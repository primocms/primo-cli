import { createHash } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { response_error } from './push-guard.js'

const DEFAULT_CHUNK_BYTES = 1024 * 1024
const MIN_CHUNK_BYTES = 64 * 1024
const MAX_ARCHIVE_BYTES = 512 * 1024 * 1024
const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')

// Stage large archives in bounded requests, then use the existing guarded
// import exactly once. This also splits individual assets larger than a proxy's
// limit, without partial content updates or bypassing revision/backup checks.
export async function post_import(endpoint: string, form: FormData, token?: string | null, onCommitState?: (started: boolean) => void): Promise<Response> {
	onCommitState?.(false)
	const archive = form.get('file')
	if (!(archive instanceof Blob)) throw new Error('Import archive is missing.')
	const file: Blob = archive
	if (file.size > MAX_ARCHIVE_BYTES) throw new Error('Import archive exceeds the CMS limit of 512 MiB. Reduce the archive before pushing.')
	const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
	const url = new URL(endpoint)
	const endpoint_path = url.pathname
	const base_path = endpoint_path.slice(0, endpoint_path.indexOf('/api/primo/'))
	const staging = `${url.origin}${base_path}/api/primo/import-uploads`
	// A reverse proxy may mount the CMS below a path prefix; the server sees
	// only its own route. Never send credentials to a URL from a response.
	const server_endpoint = endpoint_path.slice(base_path.length)
	let archiveHash: string | undefined
	let unsupported = false

	async function stage(): Promise<Response | undefined> {
		onCommitState?.(false)
		if (!archiveHash) {
			const hash = createHash('sha256')
			const reader = file.stream().getReader()
			try { while (true) { const chunk = await reader.read(); if (chunk.done) break; hash.update(chunk.value) } }
			finally { reader.releaseLock() }
			archiveHash = hash.digest('hex')
		}
		const start = await fetch(staging, {
			method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
			body: JSON.stringify({ endpoint: server_endpoint, size: file.size, sha256: archiveHash }),
			signal: AbortSignal.timeout(30000), redirect: 'error'
		})
		if (start.status === 404 || start.status === 405) { unsupported = true; await start.body?.cancel(); return undefined }
		if (!start.ok) { await start.body?.cancel(); return undefined }
		const session = await start.json() as { protocol?: number; upload_id?: string; chunk_bytes?: number }
		if (!/^[a-f0-9]{64}$/.test(session.upload_id || '')) throw new Error('Server returned an invalid batched-upload session.')
		const upload_url = `${staging}/${session.upload_id}`
		try {
			if (session.protocol !== 1 || !Number.isSafeInteger(session.chunk_bytes) || session.chunk_bytes! < MIN_CHUNK_BYTES) {
				throw new Error('Server returned an invalid batched-upload session.')
			}
			let chunk_size = Math.min(DEFAULT_CHUNK_BYTES, session.chunk_bytes!)
			for (let offset = 0; offset < file.size;) {
				const chunk = new Uint8Array(await file.slice(offset, offset + chunk_size).arrayBuffer())
				let response: Response | undefined
				// Only chunk PUTs retry: the server checks replayed bytes. Never
				// retry the final import POST after an ambiguous network failure.
				for (let attempt = 0; attempt < 3; attempt++) {
					try {
						response = await fetch(`${upload_url}?offset=${offset}`, {
							method: 'PUT', headers: { ...headers, 'Content-Type': 'application/octet-stream', 'X-Primo-Chunk-SHA256': digest(chunk) },
							body: chunk, signal: AbortSignal.timeout(30000), redirect: 'error'
						})
						if (![408, 429, 500, 502, 503, 504].includes(response.status) || attempt === 2) break
						const retryAfter = response.status === 429 ? retry_after_delay(response.headers.get('Retry-After')) : 0
						await response.body?.cancel()
						if (retryAfter > 0) { await delay(Math.max(250 * 2 ** attempt, retryAfter)); continue }
					} catch (error) {
						if (attempt === 2) throw error
					}
					await delay(250 * 2 ** attempt)
				}
				if (!response) throw new Error('Upload chunk did not receive a response.')
				if (response.status === 413) {
					await response.body?.cancel()
					if (chunk_size <= MIN_CHUNK_BYTES) throw new Error('Proxy rejects even 64 KiB upload chunks. Increase its request-body limit before retrying.')
					chunk_size = Math.max(MIN_CHUNK_BYTES, Math.floor(chunk_size / 2))
					continue
				}
				if (!response.ok) throw new Error(`Upload chunk failed: ${await response_error(response)}`)
				const acknowledgement = await response.json() as { received?: number }
				if (acknowledgement.received !== offset + chunk.byteLength) throw new Error('Server acknowledged an unexpected upload offset; import was not submitted.')
				offset += chunk.byteLength
			}
			const commit = new FormData()
			for (const [key, value] of form.entries()) if (key !== 'file') commit.append(key, value)
			commit.set('upload_id', session.upload_id!)
			onCommitState?.(true)
			return await fetch(endpoint, { method: 'POST', headers, body: commit, redirect: 'error' })
		} finally {
			// Cleanup cannot turn a successful commit into a reported failure.
			// On disconnect/crash the server's TTL removes abandoned staging.
			await fetch(upload_url, { method: 'DELETE', headers, signal: AbortSignal.timeout(5000), redirect: 'error' }).then(r => r.body?.cancel()).catch(() => {})
		}
	}

	if (file.size > DEFAULT_CHUNK_BYTES) {
		const response = await stage()
		if (response) return response
	}
	// Small requests and older servers retain the multipart protocol. A proxy
	// can enforce a smaller limit; a rejected direct request then uses staging.
	onCommitState?.(true)
	const response = await fetch(endpoint, { method: 'POST', headers, body: form, redirect: 'error' })
	if (response.status !== 413) return response
	await response.body?.cancel()
	onCommitState?.(false)
	if (!unsupported) {
		const staged = await stage()
		if (staged) return staged
	}
	throw new Error('Upload rejected (HTTP 413). This CMS does not support batched uploads; upgrade the CMS and CLI together, then retry.')
}

function retry_after_delay(value: string | null): number {
	if (value === null) return 0
	const seconds = Number(value)
	const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - Date.now()
	return Number.isFinite(ms) ? Math.max(0, Math.min(30000, ms)) : 0
}
