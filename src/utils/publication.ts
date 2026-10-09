import type { PushTarget } from './push-guard.js'
import { response_error } from './push-guard.js'
import { fetch_site_record, load_compiler } from '../commands/preview.js'
import { publish_retry_command } from './hosted-targets.js'

export interface PublicationStatus {
	protocol: number
	site_id: string
	state: 'never_published' | 'current' | 'behind' | 'publishing' | 'failed' | 'unknown'
	draft_revision: string
	published_revision: string
	unpublished_changes: boolean | null
	published_at: string
	site_url: string | null
	attempt: {
		id: string
		revision: string
		state: string
		started_at: string
		finished_at: string
		error: string
	}
}

export interface PublicationResult {
	state: 'not_requested' | 'not_attempted' | 'succeeded' | 'failed' | 'unknown'
	revision?: string
	attempt_id?: string
	site_url?: string | null
	error?: string
	error_code?: string
	retry_command?: string
	status?: PublicationStatus
}

function publication_url(target: PushTarget) {
	return `${target.server}/api/primo/publication/${encodeURIComponent(target.target)}`
}

async function request(target: PushTarget, suffix = '', body?: unknown): Promise<Response> {
	if (!target.token) throw new Error('Authentication required to publish. Run `primo login -s <server-url>`, then retry publication.')
	return fetch(publication_url(target) + suffix, {
		method: body === undefined ? 'GET' : 'POST',
		headers: {
			Authorization: `Bearer ${target.token}`,
			...(body === undefined ? {} : { 'Content-Type': 'application/json' })
		},
		...(body === undefined ? {} : { body: JSON.stringify(body) }),
		signal: AbortSignal.timeout(120000)
	})
}

export async function read_publication_status(target: PushTarget): Promise<PublicationStatus> {
	const response = await request(target)
	if (response.status === 404) throw new Error('Publication status is unavailable. Update the CMS and verify this site exists on the selected server.')
	if (!response.ok) throw new Error(await response_error(response))
	const value = (await response.json()) as PublicationStatus
	if (
		value.protocol !== 1 ||
		value.site_id !== target.target ||
		!/^v1:[a-f0-9]{64}$/.test(value.draft_revision) ||
		!['never_published', 'current', 'behind', 'publishing', 'failed', 'unknown'].includes(value.state) ||
		!value.attempt ||
		typeof value.attempt.id !== 'string'
	) {
		throw new Error('Server returned invalid publication status.')
	}
	return value
}

export async function publish_target(target: PushTarget, expected_revision?: string): Promise<PublicationResult> {
	const retry_command = publish_retry_command(target)
	let attempt_id: string | undefined
	let revision: string | undefined
	let activation_sent = false
	let start_sent = false
	try {
		const before = await read_publication_status(target)
		revision = expected_revision || before.draft_revision
		if (before.draft_revision !== revision) throw new Error('Hosted content changed after the push. Review the hosted draft before publishing it.')
		// Resolve the compiler before starting an attempt, so an unsupported
		// installation cannot leave the hosted site stuck in publishing state.
		const compiler = await load_compiler()
		start_sent = true
		const start = await request(target, '', { expected_revision: revision })
		if (!start.ok) {
			start_sent = false
			throw new Error(await response_error(start))
		}
		const attempt = (await start.json()) as {
			attempt_id: string
			revision: string
		}
		if (!/^[a-zA-Z0-9]{24}$/.test(attempt.attempt_id) || attempt.revision !== revision) throw new Error('Invalid publication attempt returned by server.')
		attempt_id = attempt.attempt_id
		const record = await fetch_site_record(target.server, target.token!, target.target)
		await compiler(target.server, target.token!, record)
		activation_sent = true
		const activation = await request(target, `/${encodeURIComponent(attempt_id)}/activate`, {})
		if (!activation.ok) {
			throw new Error(await response_error(activation))
		}
		const receipt = (await activation.json()) as {
			protocol: number
			site_id: string
			attempt_id: string
			revision: string
			state: string
			site_url: string | null
		}
		if (receipt.protocol !== 1 || receipt.site_id !== target.target || receipt.attempt_id !== attempt_id || receipt.revision !== revision || receipt.state !== 'succeeded') {
			throw new Error('Could not confirm the requested publication. Check hosted status before retrying.')
		}
		return { state: 'succeeded', revision, attempt_id, site_url: receipt.site_url }
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		if (activation_sent || (start_sent && !attempt_id)) {
			// A lost activation/start response is ambiguous. Read authoritative
			// state, and never turn a possibly successful publication into failure.
			try {
				const status = await read_publication_status(target)
				if (attempt_id && status.attempt.id === attempt_id && status.attempt.state === 'succeeded') {
					return {
						state: 'succeeded',
						revision,
						attempt_id,
						site_url: status.site_url,
						status
					}
				}
				if (attempt_id && status.attempt.id === attempt_id && status.attempt.state === 'failed') {
					return {
						state: 'failed',
						revision,
						attempt_id,
						error: status.attempt.error || message,
						error_code: 'publication_failed',
						retry_command,
						status
					}
				}
			} catch {
				/* Preserve uncertainty when status is unavailable. */
			}
			return {
				state: 'unknown',
				revision,
				attempt_id,
				error: message,
				error_code: 'publication_outcome_unknown',
				retry_command
			}
		}
		if (attempt_id) {
			try {
				await request(target, `/${encodeURIComponent(attempt_id)}/fail`, {
					error: message
				})
			} catch {
				/* Local outcome is known; remote status may remain in progress. */
			}
		}
		return {
			state: 'failed',
			revision,
			attempt_id,
			error: message,
			error_code: 'publication_failed',
			retry_command
		}
	}
}

export function print_publication_result(label: string, result: PublicationResult, draft_saved = false) {
	if (result.state === 'succeeded') {
		console.log(`Published: ${label} (${result.revision})`)
		if (result.site_url) console.log(`  ${result.site_url}`)
		else console.log('  Build published; no public domain is assigned. Assign a domain in the dashboard.')
	} else {
		console.error(`Publication ${result.state}: ${label}: ${result.error}`)
		if (draft_saved) console.error('  Your draft changes are saved.')
		if (result.state === 'unknown') console.error('  Check `primo status --hosted` before retrying; the server may have completed publication.')
		else console.error(`  Retry publication: ${result.retry_command}`)
	}
}
