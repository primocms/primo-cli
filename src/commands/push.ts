import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import ora, { type Ora } from 'ora'
import archiver from 'archiver'
import { prepare_push, append_push_guard, finish_push, response_error, type PushPlan, type PushTarget } from '../utils/push-guard.js'
import { preserve_upload_paths } from '../utils/portable-uploads.js'
import { get_auth_token } from '../utils/auth.js'
import { find_duplicate_site_ids, describe_duplicate_site_ids } from '../utils/site-ids.js'
import { read_site_config, get_site_config_path, type SiteConfig, SITE_CONFIG_FILE } from '../utils/site-config.js'
import { get_server_config_path, read_server_config, resolve_format_options, normalize_server_url, type ServerConfig, type SiteGroupConfig } from '../utils/server-config.js'
import { format_file_contents } from '../utils/format.js'
import { with_command_output } from '../utils/command-output.js'
import { publish_target, print_publication_result, type PublicationResult } from '../utils/publication.js'
import { publish_retry_command } from '../utils/hosted-targets.js'

interface PushOptions {
	server?: string
	site?: string
	only?: string
	dir: string
	token?: string
	publish?: boolean
	json?: boolean
	report?: PushReport
	workspaceServer?: string
	preview?: boolean
	dryRun?: boolean
	force?: boolean
	yes?: boolean
}

interface PushResult {
	target: string
	server?: string
	site_id?: string
	push: { state: 'not_attempted' | 'previewed' | 'succeeded' | 'failed' | 'unknown'; revision?: string; error?: string; error_code?: string }
	publish: PublicationResult
	plan?: PushPlan
}
interface PushReport {
	ok: boolean
	results: PushResult[]
	error?: string
	error_code?: string
}

function push_result(options: PushOptions, label: string, plan?: PushPlan): PushResult {
	let result = options.report?.results.find((item) => (plan ? item.plan?.dir === plan.dir && item.plan.target === plan.target : item.target === label))
	if (!result) {
		result = { target: label, push: { state: 'not_attempted' }, publish: { state: options.publish ? 'not_attempted' : 'not_requested' } }
		options.report?.results.push(result)
	}
	if (plan?.target === 'library') result.publish = { state: 'not_requested' }
	if (plan) Object.assign(result, { plan, server: plan.server, site_id: plan.target === 'library' ? undefined : plan.target })
	return result
}

async function publish_pushed_sites(options: PushOptions): Promise<string[]> {
	const failed: string[] = []
	for (const result of options.report?.results || []) {
		if (result.push.state !== 'succeeded' || result.plan?.target === 'library' || !result.plan) continue
		if (!options.publish) {
			console.log(`  Draft updated: ${result.target}. Publication was not requested.`)
			console.log(`  To publish: ${publish_retry_command(result.plan)}`)
			continue
		}
		console.log(`Publishing: ${result.target}...`)
		result.publish = await publish_target(result.plan, result.push.revision)
		print_publication_result(result.target, result.publish, true)
		if (result.publish.state !== 'succeeded') failed.push(result.target)
	}
	return failed
}

// Preserve the return contract used by deploy while exposing phase results to
// scripts. A publication failure must never erase a successful push baseline.
export async function push_site(options: PushOptions): Promise<string[]> {
	const report: PushReport = { ok: false, results: [] }
	let failed: string[] = []
	await with_command_output(options.json, async () => {
		try {
			if (options.publish && (options.preview || options.dryRun)) throw new Error('--publish cannot be combined with --preview or --dry-run. No changes were sent.')
			failed = await push_site_internal({ ...options, report })
			if (failed.length === 0 && !options.preview && !options.dryRun) failed = await publish_pushed_sites({ ...options, report })
			else if (options.publish && report.results.some((result) => result.push.state === 'succeeded')) {
				console.log('Publication was not attempted because the selected push did not complete. Earlier draft changes remain saved.')
			}
			report.ok = failed.length === 0
		} catch (error) {
			report.error = error instanceof Error ? error.message : String(error)
			report.error_code = 'push_failed'
			failed = ['push']
			console.error(report.error)
		}
	})
	if (!report.ok) process.exitCode = 1
	if (options.json) console.log(JSON.stringify({ ...report, results: report.results.map(({ plan, ...result }) => result) }, null, 2))
	return failed
}

async function path_exists(p: string): Promise<boolean> {
	try {
		await fs.access(p)
		return true
	} catch {
		return false
	}
}

// Look up the display name for a group ID by walking up from the site dir
// to find a workspace server.yaml. site.yaml only stores the group ID, so
// without this the server has nothing to label the group with on first push
// and falls back to humanizing the random ID ("8Y17hao5jt2xmd8").
async function resolve_group_name(site_dir: string, group_id: string | undefined): Promise<string | undefined> {
	if (!group_id) return undefined
	// Typical layout: <workspace>/sites/<slug>/site.yaml — server.yaml lives two levels up.
	const candidates = [path.dirname(path.dirname(site_dir)), path.dirname(site_dir), site_dir]
	for (const dir of candidates) {
		if (!(await path_exists(get_server_config_path(dir)))) continue
		try {
			const cfg = await read_server_config(dir)
			const match = cfg.site_groups?.find((g: SiteGroupConfig) => g.id === group_id)
			if (match?.name) return match.name
		} catch {
			// ignore — bad server.yaml shouldn't block the push
		}
	}
	return undefined
}

// Best-effort workspace root for a site dir, used to resolve the workspace
// prettier install when formatting rewritten yaml. Walks up looking for a
// server.yaml; falls back to the site dir if none is found (single-site checkout).
async function root_dir_for(site_dir: string): Promise<string> {
	const candidates = [path.dirname(path.dirname(site_dir)), path.dirname(site_dir), site_dir]
	for (const dir of candidates) {
		if (await path_exists(get_server_config_path(dir))) return dir
	}
	return site_dir
}

// Preserve portable source paths on hosted pushes too, so the next local dev
// session can import them. Older bare IDs are recovered from manifest metadata.
async function apply_upload_writeback(site_dir: string, workspace_dir: string, created_ids: CreatedIDs | undefined): Promise<void> {
	const entries = created_ids?.['uploads/.manifest.json']?._uploads
	if (!entries || typeof entries !== 'object') return
	let format_options
	try {
		format_options = resolve_format_options(await read_server_config(workspace_dir))
	} catch {
		format_options = resolve_format_options({} as ServerConfig)
	}
	try {
		await preserve_upload_paths(site_dir, entries as Record<string, unknown>, async (file, raw) => {
			const formatted = await format_file_contents(file, String(raw), workspace_dir, format_options)
			await fs.writeFile(file, formatted, 'utf-8')
		})
	} catch (error) {
		console.log(chalk.yellow(`  Upload source writeback failed: ${error instanceof Error ? error.message : error}`))
	}
}

interface PushDiff {
	blocks: { added: string[]; modified: string[]; deleted: string[] }
	page_types: { added: string[]; modified: string[]; deleted: string[] }
	pages: { added: string[]; modified: string[]; deleted: string[] }
	site: { added: string[]; modified: string[]; deleted: string[] }
}

// The server returns created_ids to let the CLI write back canonical state.
// Upload reconciliation is surfaced under created_ids["uploads/.manifest.json"]
// ._uploads as a symbolic-filename -> { id, canonical } map (id is the server's
// record id; canonical is the PocketBase-suffixed on-disk filename).
type CreatedIDs = Record<string, Record<string, unknown>>

// Returns the labels (site slugs / 'library') that failed to push so callers
// like `primo deploy` can tell a clean run from a partial one. Empty = success.
async function push_site_internal(options: PushOptions): Promise<string[]> {
	const root_dir = path.resolve(options.dir)
	const has_site_yaml = await path_exists(get_site_config_path(root_dir))
	const has_server_yaml = await path_exists(get_server_config_path(root_dir))

	// Resolve a workspace-level default server URL (server.yaml). Used as the
	// fallback for sites that don't declare their own `server` in site.yaml,
	// and for the library push.
	let workspace_server: string | undefined
	if (has_server_yaml) {
		try {
			const server_config = await read_server_config(root_dir)
			workspace_server = server_config.server
		} catch {
			// fall through — bad server.yaml will surface elsewhere
		}
	}
	if (!workspace_server && has_site_yaml) {
		try { workspace_server = (await read_server_config(await root_dir_for(root_dir))).server } catch { /* Single-site checkout. */ }
	}
	const effective_options: PushOptions = { ...options, workspaceServer: workspace_server }
	if (has_site_yaml && options.only) throw new Error('--only selects a site from a workspace root. Use --dir for a site directory.')

	if (options.dryRun) {
		await print_push_dry_run(root_dir, has_site_yaml, has_server_yaml, effective_options)
		return []
	}

	// Server-folder mode: walk site subfolders + push library
	if (!has_site_yaml && has_server_yaml) {
		const failed = await push_server(root_dir, effective_options)
		if (failed.length > 0) {
			console.log('')
			console.log(chalk.red(`Push incomplete — failed: ${failed.join(', ')}`))
			console.log(chalk.dim('  Fix the errors above and rerun `primo push` (completed pushes are safe to repeat).'))
			console.log('')
			// exitCode (not process.exit) so an in-process caller like `primo
			// deploy` can still finish its own reporting before the process ends.
			process.exitCode = 1
		}
		return failed
	}

	// Single-site mode (cwd is a site folder, or --dir points at one). If it
	// sits under a workspace's sites/, a sibling with the same site_id means
	// one of them is a copy that would overwrite the other on the server.
	const parent = path.dirname(root_dir)
	if (path.basename(parent) === 'sites') {
		const siblings = (await fs.readdir(parent, { withFileTypes: true }))
			.filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
			.map(entry => path.join(parent, entry.name))
		const duplicates = await find_duplicate_site_ids(siblings)
		const mine = [...duplicates].filter(([, dirs]) => dirs.includes(root_dir))
		if (mine.length > 0) {
			throw new Error(describe_duplicate_site_ids(new Map(mine), path.dirname(parent)))
		}
	}

	const spinner = ora('Reading local files...').start()
	try {
		await push_single_site(root_dir, effective_options, spinner)
		return []
	} catch (error) {
		const result = push_result(options, path.basename(root_dir))
		if (result.push.state !== 'succeeded' && result.push.state !== 'unknown') result.push = { state: 'failed', error: error instanceof Error ? error.message : String(error), error_code: 'push_failed' }
		result.push.error = error instanceof Error ? error.message : String(error)
		spinner.fail(`Push failed: ${error instanceof Error ? error.message : error}`)
		if (is_auth_error(error)) print_auth_hint()
		process.exitCode = 1
		return [path.basename(root_dir)]
	}
}

function is_auth_error(error: unknown): boolean {
	const msg = error instanceof Error ? error.message : String(error)
	return /Authentication required/i.test(msg) || /\b401\b/.test(msg) || /unauthorized/i.test(msg)
}

function print_auth_hint() {
	console.log('')
	console.log(chalk.dim('  Run `primo login -s <server-url>` to authenticate, then retry.'))
	console.log('')
}

async function print_push_dry_run(root_dir: string, has_site_yaml: boolean, has_server_yaml: boolean, options: PushOptions) {
	console.log('')
	console.log(chalk.bold('Push preview (dry-run)'))
	console.log('')

	if (!has_site_yaml && !has_server_yaml) {
		throw new Error(`No ${SITE_CONFIG_FILE} or ${path.basename(get_server_config_path(root_dir))} found in ${root_dir}.`)
	}

	const sites: { dir: string; config: ReturnType<typeof Object> | null; label: string }[] = []
	let library_present = false
	let inferred_server: string | undefined

	if (has_site_yaml) {
		try {
			const config = await read_site_config(root_dir)
			sites.push({ dir: root_dir, config: config as any, label: config.name || path.basename(root_dir) })
			inferred_server = config.server
		} catch {
			// fall through
		}
	} else if (has_server_yaml) {
		const sites_root = path.join(root_dir, 'sites')
		if (await path_exists(sites_root)) {
			const entries = await fs.readdir(sites_root, { withFileTypes: true })
			for (const entry of entries) {
				if (!entry.isDirectory() || entry.name.startsWith('.')) continue
				const candidate = path.join(sites_root, entry.name)
				if (!await path_exists(get_site_config_path(candidate))) continue
				try {
					const config = await read_site_config(candidate)
					sites.push({ dir: candidate, config: config as any, label: config.name || entry.name })
					inferred_server = inferred_server || config.server
				} catch {
					// skip
				}
			}
		}
		library_present = await path_exists(path.join(root_dir, 'library'))
	}

	const included = options.only ? sites.filter(site => path.basename(site.dir) === options.only) : sites
	if (options.only && !included.length) throw new Error(`No site folder named "${options.only}" under sites/.`)
	for (const site of included) {
		const raw = options.server || site.config?.server || options.workspaceServer || inferred_server
		const result = push_result(options, path.basename(site.dir))
		result.site_id = options.site || site.config?.site_id
		if (raw) result.server = normalize_server_url(raw)
	}
	if (library_present && !options.only) push_result(options, 'library')
	const server_raw = options.server || options.workspaceServer || inferred_server
	const server = server_raw ? normalize_server_url(server_raw) : undefined

	console.log(`  Target server: ${chalk.cyan(server || '(not set — pass --server or set in site.yaml)')}`)
	console.log('')
	console.log(chalk.bold('  Will sync:'))
	if (sites.length === 0) {
		console.log(chalk.yellow('    (no sites found)'))
	} else {
		for (const site of included) {
			console.log(`    ${chalk.green('+')} site: ${site.label}  ${chalk.dim(`(${path.basename(site.dir)})`)}`)
		}
	}
	if (library_present && !options.only) {
		console.log(`    ${chalk.green('+')} library/`)
	}
	console.log('')

	if (server) {
		const token = options.token || await get_auth_token(server)
		if (token) {
			console.log(chalk.dim(`  Auth: token found for ${server}.`))
		} else {
			console.log(chalk.yellow(`  Auth: not logged in to ${server}. Run \`primo login -s ${server}\`.`))
		}
	}

	if (options.preview) {
		console.log(chalk.dim('  --preview flag set: real push would request a server-side preview only.'))
	}
	console.log('')
	console.log(chalk.dim('  No requests sent. Run without --dry-run to push.'))
	console.log('')
}

async function site_target(site_dir: string, options: PushOptions): Promise<PushTarget> {
	const config = await read_site_config(site_dir)
	const server_raw = options.server || config.server || options.workspaceServer
	if (!server_raw) throw new Error(`Server URL required for ${path.basename(site_dir)}.`)
	const server = normalize_server_url(server_raw)
	const target = options.site || config.site_id
	if (!target) throw new Error(`Site ID required for ${path.basename(site_dir)}.`)
	return { dir: site_dir, server, target, token: options.token || await get_auth_token(server), label: path.basename(site_dir) }
}

// Preflight every target, including the library, before the first upload. Each
// import rechecks its revision; a late conflict stops the remaining uploads.
async function push_server(root_dir: string, options: PushOptions): Promise<string[]> {
	const sites_root = path.join(root_dir, 'sites')
	const site_dirs: string[] = []
	if (await path_exists(sites_root)) {
		for (const entry of await fs.readdir(sites_root, { withFileTypes: true })) {
			if (!entry.isDirectory() || entry.name.startsWith('.')) continue
			const candidate = path.join(sites_root, entry.name)
			if (await path_exists(get_site_config_path(candidate))) site_dirs.push(candidate)
		}
	}
	site_dirs.sort()
	const duplicate_ids = await find_duplicate_site_ids(site_dirs)
	if (duplicate_ids.size > 0) {
		throw new Error(describe_duplicate_site_ids(duplicate_ids, root_dir))
	}
	const selected = options.only ? site_dirs.filter(dir => path.basename(dir) === options.only) : site_dirs
	if (!selected.length) {
		throw new Error(options.only ? `No site folder named "${options.only}" under sites/.` : 'No site folders found in this server directory.')
	}
	let plans: PushPlan[]
	try {
		if (options.site && selected.length !== 1) throw new Error('--site requires a single site directory.')
		const targets = await Promise.all(selected.map(dir => site_target(dir, options)))
		if (!options.only && await path_exists(path.join(root_dir, 'library'))) {
			const server = options.server || options.workspaceServer ? normalize_server_url((options.server || options.workspaceServer)!) : targets[0].server
			targets.push({ dir: root_dir, server, target: 'library', token: options.token || await get_auth_token(server), label: 'library' })
		}
		plans = await prepare_push(targets, options)
	} catch (error) {
		console.error(error instanceof Error ? error.message : error)
		for (const dir of selected) push_result(options, path.basename(dir)).push = { state: 'not_attempted', error: error instanceof Error ? error.message : String(error), error_code: 'push_preflight_failed' }
		return selected.map(dir => path.basename(dir))
	}
	for (const plan of plans) push_result(options, plan.label, plan)
	const completed: string[] = []
	for (let index = 0; index < plans.length; index++) {
		const plan = plans[index]
		const spinner = ora(`Pushing ${plan.label}...`).start()
		try {
			if (plan.target === 'library') {
				if (options.preview) { spinner.info('Library preview is not supported; no library upload sent.'); continue }
				await push_library_dir(root_dir, options, spinner, plan)
			} else {
				await push_single_site(plan.dir, options, spinner, plan)
			}
			if (options.preview) push_result(options, plan.label, plan).push.state = 'previewed'
			completed.push(plan.label)
		} catch (error) {
			const result = push_result(options, plan.label, plan)
			if (result.push.state !== 'succeeded' && result.push.state !== 'unknown') result.push = { state: 'failed', error: error instanceof Error ? error.message : String(error), error_code: 'push_failed' }
			result.push.error = error instanceof Error ? error.message : String(error)
			spinner.fail(`${plan.label}: ${error instanceof Error ? error.message : error}`)
			if (is_auth_error(error)) print_auth_hint()
			console.log(`Completed: ${completed.join(', ') || 'none'}`)
			console.log(`Failed: ${plan.label}`)
			console.log(`Not attempted: ${plans.slice(index + 1).map(p => p.label).join(', ') || 'none'}`)
			console.log('Earlier successful imports remain saved. The failed request may need verification if its response was lost.')
			return plans.slice(index).map(p => p.label)
		}
	}
	return []
}

async function push_single_site(site_dir: string, options: PushOptions, spinner: Ora, prepared?: PushPlan) {
	spinner.stop()
	const plan = prepared || (await prepare_push([await site_target(site_dir, options)], options))[0]
	spinner.start()
	const outcome = push_result(options, plan.label, plan)
	let config: SiteConfig | null = null
	try {
		config = await read_site_config(site_dir)
	} catch {
		// No config file, must provide options
	}

	const { server, token, target: site_id } = plan

	spinner.text = 'Packaging files...'
	const zip_buffer = await create_zip(site_dir)
	const group_name = await resolve_group_name(site_dir, config?.group)

	// If the user isn't logged in yet, skip the import attempt and try
	// bootstrap directly. Bootstrap doesn't require auth (only allowed when
	// the server has zero sites), so it's the right path for first-time
	// setup against a fresh deployment.
	if (!token) {
		if (plan.exists) throw new Error('Authentication required to update an existing site. Run `primo login` first.')
		if (options.preview) {
			throw new Error('Authentication required for --preview. Run `primo login` first.')
		}
		outcome.push = { state: 'unknown', error_code: 'push_outcome_unknown' }
		spinner.text = 'No auth token — attempting bootstrap...'
		const bootstrap_result = await try_bootstrap_site(server, undefined, zip_buffer, config, site_id, group_name, plan)
		if (bootstrap_result.ok) {
			outcome.push = { state: 'succeeded', revision: bootstrap_result.revision }
			await finish_push(plan, bootstrap_result)
			spinner.succeed(`Bootstrapped ${config?.name || path.basename(site_dir)}`)
			console.log('')
			console.log(chalk.dim('  Site created on server and content uploaded.'))
			console.log(chalk.dim('  Run `primo login` and re-push to update content later.'))
			// Converge local upload refs/filenames with the ids the server minted,
			// same as the other push paths.
			await apply_upload_writeback(site_dir, await root_dir_for(site_dir), bootstrap_result.created_ids)
			return
		}
		outcome.push = { state: 'failed', error_code: 'push_failed' }
		throw new Error(bootstrap_result.error)
	}

	const endpoint = options.preview
		? `${server}/api/primo/import/${site_id}/preview`
		: `${server}/api/primo/import/${site_id}`

	spinner.text = options.preview ? 'Previewing changes...' : 'Pushing changes...'

	const form_data = new FormData()
	form_data.append('file', new Blob([zip_buffer]), 'site.zip')
	if (group_name) form_data.append('group_name', group_name)
	append_push_guard(form_data, plan)

	if (!options.preview) outcome.push = { state: 'unknown', error_code: 'push_outcome_unknown' }
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: token ? { 'Authorization': `Bearer ${token}` } : {},
		body: form_data
	})


	if (!response.ok) {
		outcome.push = { state: 'failed', error_code: 'push_failed' }
		throw new Error(await response_error(response))
	}

	const result = await response.json() as { preview?: boolean; success?: boolean; diff: PushDiff; created_ids?: CreatedIDs; revision?: string; backup?: string }
	const label = config?.name || path.basename(site_dir)

	if (options.preview) {
		outcome.push = { state: 'previewed' }
		spinner.succeed(`Preview: ${label}`)
		console.log('')
		print_diff(result.diff)
		console.log('')
		console.log(chalk.dim('  Run without --preview to apply these changes'))
	} else {
		outcome.push = { state: 'succeeded', revision: result.revision }
		await finish_push(plan, result)
		spinner.succeed(`Pushed ${label}`)
		console.log('')
		print_diff(result.diff)
		// Keep source files portable; repair legacy bare upload IDs when the
		// local manifest identifies their files.
		await apply_upload_writeback(site_dir, await root_dir_for(site_dir), result.created_ids)
	}
}

async function try_bootstrap_site(
	server: string,
	token: string | undefined,
	zip_buffer: Buffer,
	config: SiteConfig | null,
	site_id: string,
	group_name?: string,
	plan?: PushPlan
): Promise<{ ok: true; created_ids?: CreatedIDs; revision?: string } | { ok: false; error: string }> {
	const form = new FormData()
	form.append('site_id', site_id)
	if (plan) append_push_guard(form, plan)
	if (config?.name) form.append('name', config.name)
	if (config?.group) form.append('group', config.group)
	if (group_name) form.append('group_name', group_name)
	// Host is intentionally not sent. A pushed site is created unassigned —
	// the server seeds `host` with a placeholder (the site's own id) so the
	// site is editable in the dashboard but not publicly served until an
	// operator assigns a real domain. The lone exception is bootstrap of the
	// very first site on a fresh instance, where the server falls back to the
	// deploy URL's host so that instance's front door resolves immediately.
	form.append('file', new Blob([zip_buffer]), 'site.zip')

	const headers: Record<string, string> = {}
	if (token) headers['Authorization'] = `Bearer ${token}`

	const response = await fetch(`${server}/api/primo/bootstrap`, {
		method: 'POST',
		headers,
		body: form
	})

	if (response.ok) {
		const body = await response.json().catch(() => ({})) as { created_ids?: CreatedIDs; revision?: string }
		return { ok: true, created_ids: body.created_ids, revision: body.revision }
	}

	if (response.status === 403) {
		return {
			ok: false,
			error:
				`Site '${site_id}' not found on server, and bootstrap is locked ` +
				`(server already has other sites). Create the site in the dashboard first, ` +
				`then update site_id in site.yaml to match.`
		}
	}

	return { ok: false, error: await response.text() }
}

async function push_library_dir(root_dir: string, options: PushOptions, spinner: Ora, plan: PushPlan) {
	const { server, token } = plan

	spinner.text = 'Packaging library...'
	const archive = archiver('zip', { zlib: { level: 9 } })
	const chunks: Buffer[] = []
	const zip_buffer = await new Promise<Buffer>((resolve, reject) => {
		archive.on('data', (chunk) => chunks.push(chunk))
		archive.on('end', () => resolve(Buffer.concat(chunks)))
		archive.on('error', reject)
		archive.directory(path.join(root_dir, 'library'), 'library')
		archive.finalize()
	})

	spinner.text = 'Pushing library...'
	const form_data = new FormData()
	form_data.append('file', new Blob([zip_buffer]), 'library.zip')
	append_push_guard(form_data, plan)

	push_result(options, plan.label, plan).push = { state: 'unknown', error_code: 'push_outcome_unknown' }
	const response = await fetch(`${server}/api/primo/import-library`, {
		method: 'POST',
		headers: token ? { 'Authorization': `Bearer ${token}` } : {},
		body: form_data
	})

	if (response.status === 404) {
		push_result(options, plan.label, plan).push = { state: 'failed', error_code: 'push_failed' }
		throw new Error('Library push endpoint disappeared after preflight; no fallback attempted.')
	}
	if (!response.ok) {
		push_result(options, plan.label, plan).push = { state: 'failed', error_code: 'push_failed' }
		throw new Error(await response_error(response))
	}

	const result = await response.json() as { summary?: { groups: number; blocks: number }; revision?: string; backup?: string }
	push_result(options, plan.label, plan).push = { state: 'succeeded', revision: result.revision }
	await finish_push(plan, result)
	spinner.succeed('Pushed library')
	if (result.summary) {
		console.log(chalk.dim(`    groups/ ${result.summary.groups}, blocks/ ${result.summary.blocks}`))
	}
}

async function create_zip(dir: string): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const archive = archiver('zip', { zlib: { level: 9 } })
		const chunks: Buffer[] = []

		archive.on('data', chunk => chunks.push(chunk))
		archive.on('end', () => resolve(Buffer.concat(chunks)))
		archive.on('error', reject)

		// Add directories
		const dirs_to_include = ['blocks', 'page-types', 'pages', 'site', 'uploads']
		for (const subdir of dirs_to_include) {
			const full_path = path.join(dir, subdir)
			archive.directory(full_path, subdir)
		}

		// Add site config
		archive.file(path.join(dir, SITE_CONFIG_FILE), { name: SITE_CONFIG_FILE })

		archive.finalize()
	})
}

function print_diff(diff: PushDiff) {
	let has_changes = false

	for (const [section, changes] of Object.entries(diff)) {
		const { added, modified, deleted } = changes as { added: string[]; modified: string[]; deleted: string[] }

		if (added.length === 0 && modified.length === 0 && deleted.length === 0) {
			continue
		}

		has_changes = true
		console.log(chalk.bold(`  ${section}:`))

		for (const item of added) {
			console.log(chalk.green(`    + ${item}`))
		}
		for (const item of modified) {
			console.log(chalk.yellow(`    ~ ${item}`))
		}
		for (const item of deleted) {
			console.log(chalk.red(`    - ${item}`))
		}
	}

	if (!has_changes) {
		console.log(chalk.dim('  No changes detected'))
	}
}
