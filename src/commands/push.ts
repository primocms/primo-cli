import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import ora, { type Ora } from 'ora'
import archiver from 'archiver'
import { dump as dump_yaml, load as load_yaml } from 'js-yaml'
import { get_auth_token } from '../utils/auth.js'
import { read_site_config, get_site_config_path, type SiteConfig, SITE_CONFIG_FILE } from '../utils/site-config.js'
import { get_server_config_path, read_server_config, resolve_format_options, normalize_server_url, type ServerConfig, type SiteGroupConfig } from '../utils/server-config.js'
import { format_file_contents } from '../utils/format.js'

interface PushOptions {
	server?: string
	site?: string
	only?: string
	dir: string
	token?: string
	preview?: boolean
	dryRun?: boolean
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

// Converge the local site with the upload ids the server minted on push. The
// server creates its own site_uploads record per file (it can't honor a foreign
// CMS's id), renames files to a canonical suffixed name, and returns the
// symbolic->{id,canonical} map. `primo dev` applies this writeback via its
// watcher; `primo push` previously dropped it, so local refs stayed symbolic (or
// worse, kept a stale id from another CMS) and drifted from the server forever.
//
// This mirrors write_upload_writeback in dev.ts but without the chokidar
// bookkeeping (nothing is watching during a push). Best-effort throughout: a
// push has already succeeded by the time we get here, so a writeback hiccup
// should never fail the command.
async function apply_upload_writeback(site_dir: string, workspace_dir: string, created_ids: CreatedIDs | undefined): Promise<void> {
	const manifest = created_ids?.['uploads/.manifest.json']
	const uploads_map = manifest && typeof manifest._uploads === 'object' && manifest._uploads !== null
		? manifest._uploads as Record<string, unknown>
		: null
	if (!uploads_map) return

	// Build symbolic-filename -> record-id map and the rename list. Both
	// symbolic and canonical are treated as untrusted (they come from the
	// server response): reject anything that isn't a plain basename so a
	// crafted `../` can't make a later path.join escape uploads/ (CWE-22).
	const symbolic_to_id = new Map<string, string>()
	const rename_for = new Map<string, string>()
	for (const [symbolic, raw] of Object.entries(uploads_map)) {
		if (!raw || typeof raw !== 'object') continue
		if (!is_safe_basename(symbolic)) continue
		const entry = raw as Partial<UploadWritebackEntry>
		if (typeof entry.id !== 'string' || !entry.id) continue
		symbolic_to_id.set(symbolic, entry.id)
		const canonical = typeof entry.canonical === 'string' ? entry.canonical : ''
		if (canonical && canonical !== symbolic && is_safe_basename(canonical)) {
			rename_for.set(symbolic, canonical)
		}
	}
	if (symbolic_to_id.size === 0) return

	// Rewrite refs FIRST, renames second — and only rename files whose ref
	// rewrite actually succeeded. Renaming before rewriting risks leaving a file
	// at its canonical name while the yaml still points at the old symbolic path
	// (if the rewrite is skipped/unreadable/unwritable), which the next push
	// would resend as a stale ref. So we rewrite yaml, track which symbolic keys
	// were applied, and rename only those — keeping disk and yaml consistent even
	// when some files can't be processed.
	let format_options
	try {
		format_options = resolve_format_options(await read_server_config(workspace_dir))
	} catch {
		format_options = resolve_format_options({} as ServerConfig)
	}
	const applied = new Set<string>()
	for (const subdir of UPLOAD_REF_DIRS) {
		const files = await walk_yaml_files(path.join(site_dir, subdir))
		for (const file_path of files) {
			try {
				const content = await fs.readFile(file_path, 'utf-8')
				if (!content.includes('uploads/')) continue
				const parsed = load_yaml(content)
				if (!parsed || typeof parsed !== 'object') continue
				const { value: rewritten, applied: file_applied } = rewrite_symbolic_upload_refs(parsed, symbolic_to_id)
				if (file_applied.size === 0) continue
				const raw = dump_yaml(rewritten, { lineWidth: -1 })
				const formatted = await format_file_contents(file_path, raw, workspace_dir, format_options)
				await fs.writeFile(file_path, formatted, 'utf-8')
				// Only mark applied AFTER a successful write, so a failed write
				// leaves both the yaml ref and the on-disk filename untouched.
				for (const key of file_applied) applied.add(key)
			} catch {
				// skip unreadable / unparseable / unwritable file — its symbolic
				// key stays out of `applied`, so its file won't be renamed either
			}
		}
	}

	// Rename on-disk upload files to their canonical (server-suffixed) names,
	// but only for refs that were actually rewritten above. Missing source =
	// already renamed or user-removed; skip it.
	const uploads_dir = path.join(site_dir, 'uploads')
	for (const [symbolic, canonical] of rename_for) {
		if (!applied.has(symbolic)) continue
		try {
			await fs.rename(path.join(uploads_dir, symbolic), path.join(uploads_dir, canonical))
		} catch {
			// missing source or permission issue — skip
		}
	}
}

// Guard against path traversal / absolute paths in server-supplied upload
// names. Only accept a plain filename (no separators, no `..`, no leading dot-dot).
function is_safe_basename(name: string): boolean {
	if (!name || name === '.' || name === '..') return false
	if (name.includes('/') || name.includes('\\') || name.includes('\0')) return false
	if (path.isAbsolute(name)) return false
	return path.basename(name) === name
}

// Recursively collect .yaml files under a directory (dotfiles/dirs skipped).
async function walk_yaml_files(root: string): Promise<string[]> {
	const out: string[] = []
	const stack: string[] = [root]
	while (stack.length > 0) {
		const dir = stack.pop() as string
		let entries
		try {
			entries = await fs.readdir(dir, { withFileTypes: true })
		} catch {
			continue
		}
		for (const entry of entries) {
			if (entry.name.startsWith('.')) continue
			const full = path.join(dir, entry.name)
			if (entry.isDirectory()) stack.push(full)
			else if (entry.isFile() && entry.name.endsWith('.yaml')) out.push(full)
		}
	}
	return out
}

// Rewrite `upload: "uploads/<file>"` values to the server record id. Mirrors the
// server's rewriteUploadRefs (and dev.ts's copy). Returns the set of symbolic
// filenames it actually remapped so the caller can rename exactly those files
// (and only after the yaml write succeeds). Note this only remaps symbolic
// paths — a bare id that matches no entry is left as-is (see PR notes on the
// separate stale-cross-CMS-id repair still needed for already-broken refs).
function rewrite_symbolic_upload_refs(value: unknown, map: Map<string, string>): { value: unknown; applied: Set<string> } {
	const applied = new Set<string>()
	const walk = (v: unknown): unknown => {
		if (v && typeof v === 'object' && !Array.isArray(v)) {
			const obj = v as Record<string, unknown>
			const result: Record<string, unknown> = {}
			for (const [k, val] of Object.entries(obj)) {
				if (k === 'upload' && typeof val === 'string' && val.startsWith('uploads/')) {
					const symbolic = val.substring('uploads/'.length)
					const id = map.get(symbolic)
					if (id) {
						result[k] = id
						applied.add(symbolic)
						continue
					}
				}
				result[k] = walk(val)
			}
			return result
		}
		if (Array.isArray(v)) return v.map(walk)
		return v
	}
	const rewritten = walk(value)
	return { value: rewritten, applied }
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

interface UploadWritebackEntry {
	id: string
	canonical: string
}

// Subdirs whose yaml may carry `upload: uploads/...` refs. Mirrors the server's
// import scope (uploads/ itself holds binaries, not refs, so it's excluded).
const UPLOAD_REF_DIRS = ['blocks', 'page-types', 'pages', 'site']

// Returns the labels (site slugs / 'library') that failed to push so callers
// like `primo deploy` can tell a clean run from a partial one. Empty = success.
export async function push_site(options: PushOptions): Promise<string[]> {
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
	const effective_options: PushOptions = workspace_server && !options.server
		? { ...options, server: workspace_server }
		: options

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

	// Single-site mode (cwd is a site folder, or --dir points at one)
	const spinner = ora('Reading local files...').start()
	try {
		await push_single_site(root_dir, effective_options, spinner)
		return []
	} catch (error) {
		spinner.fail(`Push failed: ${error instanceof Error ? error.message : error}`)
		if (is_auth_error(error)) print_auth_hint()
		process.exit(1)
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
		console.log(chalk.red(`  No ${SITE_CONFIG_FILE} or ${path.basename(get_server_config_path(root_dir))} found in ${root_dir}.`))
		console.log('')
		return
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

	const server_raw = options.server || inferred_server
	const server = server_raw ? normalize_server_url(server_raw) : undefined

	console.log(`  Target server: ${chalk.cyan(server || '(not set — pass --server or set in site.yaml)')}`)
	console.log('')
	console.log(chalk.bold('  Will sync:'))
	if (sites.length === 0) {
		console.log(chalk.yellow('    (no sites found)'))
	} else {
		for (const site of sites) {
			console.log(`    ${chalk.green('+')} site: ${site.label}  ${chalk.dim(`(${path.basename(site.dir)})`)}`)
		}
	}
	if (library_present) {
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

// Pushes every site folder plus the library, continuing past individual
// failures. Returns the labels that failed — the caller decides how loudly a
// partial push should fail.
async function push_server(root_dir: string, options: PushOptions): Promise<string[]> {
	// Sites live under sites/<slug>/
	const sites_root = path.join(root_dir, 'sites')
	const site_dirs: string[] = []
	if (await path_exists(sites_root)) {
		const entries = await fs.readdir(sites_root, { withFileTypes: true })
		for (const entry of entries) {
			if (!entry.isDirectory() || entry.name.startsWith('.')) continue
			const candidate = path.join(sites_root, entry.name)
			if (await path_exists(get_site_config_path(candidate))) {
				site_dirs.push(candidate)
			}
		}
	}

	if (site_dirs.length === 0) {
		console.log(chalk.yellow('  No site folders found in this server directory.'))
		process.exit(1)
	}

	// --only <slug>: push just one site folder, skip the library
	if (options.only) {
		const match = site_dirs.find((d) => path.basename(d) === options.only)
		if (!match) {
			const available = site_dirs.map((d) => path.basename(d)).join(', ')
			console.log(chalk.red(`  No site folder named "${options.only}" under sites/.`))
			console.log(chalk.dim(`  Available: ${available}`))
			process.exit(1)
		}
		const spinner = ora(`Pushing ${chalk.cyan(path.basename(match))}...`).start()
		try {
			await push_single_site(match, { ...options, dir: match }, spinner)
		} catch (error) {
			spinner.fail(`${path.basename(match)}: ${error instanceof Error ? error.message : error}`)
			if (is_auth_error(error)) print_auth_hint()
			process.exit(1)
		}
		return []
	}

	let saw_auth_error = false
	const failed: string[] = []

	// Push each site
	for (const site_dir of site_dirs) {
		const spinner = ora(`Pushing ${chalk.cyan(path.basename(site_dir))}...`).start()
		try {
			await push_single_site(site_dir, { ...options, dir: site_dir }, spinner)
		} catch (error) {
			spinner.fail(`${path.basename(site_dir)}: ${error instanceof Error ? error.message : error}`)
			if (is_auth_error(error)) saw_auth_error = true
			failed.push(path.basename(site_dir))
			// Continue to remaining sites rather than abort the whole push
		}
	}

	// Push library if present
	const library_dir = path.join(root_dir, 'library')
	if (await path_exists(library_dir)) {
		const spinner = ora('Pushing library...').start()
		try {
			await push_library_dir(root_dir, options, spinner)
		} catch (error) {
			spinner.fail(`library: ${error instanceof Error ? error.message : error}`)
			if (is_auth_error(error)) saw_auth_error = true
			failed.push('library')
		}
	}

	if (saw_auth_error) print_auth_hint()
	return failed
}

async function push_single_site(site_dir: string, options: PushOptions, spinner: Ora) {
	let config: SiteConfig | null = null
	try {
		config = await read_site_config(site_dir)
	} catch {
		// No config file, must provide options
	}

	const server_raw = options.server || config?.server
	const server = server_raw ? normalize_server_url(server_raw) : undefined
	const site_id = options.site || config?.site_id

	if (!server) {
		throw new Error(`Server URL required. Use --server or add server field to ${SITE_CONFIG_FILE}.`)
	}
	if (!site_id) {
		throw new Error(`Site ID required. Use --site or add site_id field to ${SITE_CONFIG_FILE}.`)
	}

	const token = options.token || await get_auth_token(server)

	spinner.text = 'Packaging files...'
	const zip_buffer = await create_zip(site_dir)
	const group_name = await resolve_group_name(site_dir, config?.group)

	// If the user isn't logged in yet, skip the import attempt and try
	// bootstrap directly. Bootstrap doesn't require auth (only allowed when
	// the server has zero sites), so it's the right path for first-time
	// setup against a fresh deployment.
	if (!token) {
		if (options.preview) {
			throw new Error('Authentication required for --preview. Run `primo login` first.')
		}
		spinner.text = 'No auth token — attempting bootstrap...'
		const bootstrap_result = await try_bootstrap_site(server, undefined, zip_buffer, config, site_id, group_name)
		if (bootstrap_result.ok) {
			spinner.succeed(`Bootstrapped ${config?.name || path.basename(site_dir)}`)
			console.log('')
			console.log(chalk.dim('  Site created on server and content uploaded.'))
			console.log(chalk.dim('  Run `primo login` and re-push to update content later.'))
			// Same convergence + republish the authenticated paths do — a first
			// push shouldn't leave local upload refs unsynced or the site
			// unpublished just because it went through unauthenticated bootstrap.
			await apply_upload_writeback(site_dir, await root_dir_for(site_dir), bootstrap_result.created_ids)
			await regenerate_site(server, undefined, site_id)
			return
		}
		throw new Error(bootstrap_result.error)
	}

	const endpoint = options.preview
		? `${server}/api/primo/import/${site_id}/preview`
		: `${server}/api/primo/import/${site_id}`

	spinner.text = options.preview ? 'Previewing changes...' : 'Pushing changes...'

	const form_data = new FormData()
	form_data.append('file', new Blob([zip_buffer]), 'site.zip')
	if (group_name) form_data.append('group_name', group_name)

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: { 'Authorization': `Bearer ${token}` },
		body: form_data
	})

	// 404 from import means the site doesn't exist on the server yet. On a
	// freshly-deployed server we can fall back to /api/primo/bootstrap,
	// which creates the site and ingests the zip in one shot. Bootstrap is
	// only available when the server has zero sites — past the first site,
	// new sites must be created via the dashboard UI.
	if (response.status === 404 && !options.preview) {
		spinner.text = 'Site not found on server — bootstrapping...'
		const bootstrap_result = await try_bootstrap_site(server, token, zip_buffer, config, site_id, group_name)
		if (bootstrap_result.ok) {
			spinner.succeed(`Bootstrapped ${config?.name || path.basename(site_dir)}`)
			console.log('')
			console.log(chalk.dim('  Site created on server and content uploaded.'))
			console.log(chalk.dim('  Subsequent pushes will use the import endpoint.'))
			// Converge local upload refs/filenames with the ids the server minted
			// (see the import path below for why).
			await apply_upload_writeback(site_dir, await root_dir_for(site_dir), bootstrap_result.created_ids)
			// Import only ingests records; the published static files (html +
			// _uploads assets) are stale until GenerateSite runs. Regenerate so
			// the pushed content is actually served, not just stored.
			await regenerate_site(server, token, site_id)
			return
		}
		throw new Error(bootstrap_result.error)
	}

	if (!response.ok) {
		throw new Error(await response.text())
	}

	const result = await response.json() as { preview?: boolean; success?: boolean; diff: PushDiff; created_ids?: CreatedIDs }
	const label = config?.name || path.basename(site_dir)

	if (options.preview) {
		spinner.succeed(`Preview: ${label}`)
		console.log('')
		print_diff(result.diff)
		console.log('')
		console.log(chalk.dim('  Run without --preview to apply these changes'))
	} else {
		spinner.succeed(`Pushed ${label}`)
		console.log('')
		print_diff(result.diff)
		// The server mints its own record id for each uploaded file and returns
		// the symbolic->id map in created_ids. Converge the local copy so refs
		// point at the server's id and files carry their canonical names — the
		// same writeback `primo dev` does. Without this, local and server drift,
		// and a symbolic ref baked to a *different* CMS's id dangles forever.
		await apply_upload_writeback(site_dir, await root_dir_for(site_dir), result.created_ids)
		// Import only ingests records into the CMS; the served static site
		// (html + _uploads assets) is not rebuilt until GenerateSite runs.
		// Without this, a push lands in the CMS but the live URL keeps serving
		// the previously-published files, so pushed changes never appear.
		await regenerate_site(server, token, site_id)
	}
}

// Trigger a republish of the site's static output on the server. Import
// endpoints only write CMS records; POST /api/primo/generate runs GenerateSite,
// which re-renders the published html and stages upload assets under
// sites/<host>/_uploads. Best-effort: a generate failure shouldn't fail the
// push (records already landed), so warn rather than throw.
async function regenerate_site(server: string, token: string | undefined, site_id: string): Promise<void> {
	try {
		const response = await fetch(`${server}/api/primo/generate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { 'Authorization': `Bearer ${token}` } : {})
			},
			body: JSON.stringify({ site_id }),
			// Bound the request so a silent/hung server can't stall push for the
			// ~5min Undici default; import+writeback already succeeded by here.
			signal: AbortSignal.timeout(60_000)
		})
		if (!response.ok) {
			const detail = await response.text().catch(() => '')
			console.log(chalk.yellow(`  Warning: republish failed (${response.status}); pushed content may not be live yet.`))
			if (detail) console.log(chalk.dim(`  ${detail.slice(0, 200)}`))
			console.log(chalk.dim('  Publish from the editor, or re-run push, to regenerate the site.'))
		}
	} catch (err) {
		console.log(chalk.yellow('  Warning: republish request failed; pushed content may not be live yet.'))
		console.log(chalk.dim(`  ${err instanceof Error ? err.message : String(err)}`))
	}
}

async function try_bootstrap_site(
	server: string,
	token: string | undefined,
	zip_buffer: Buffer,
	config: SiteConfig | null,
	site_id: string,
	group_name?: string
): Promise<{ ok: true; created_ids?: CreatedIDs } | { ok: false; error: string }> {
	const form = new FormData()
	form.append('site_id', site_id)
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
		const body = await response.json().catch(() => ({})) as { created_ids?: CreatedIDs }
		return { ok: true, created_ids: body.created_ids }
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

async function push_library_dir(root_dir: string, options: PushOptions, spinner: Ora) {
	// Resolve server: --server > any site.yaml's server (they all point at the same server)
	let server = options.server ? normalize_server_url(options.server) : undefined
	if (!server) {
		const sites_root = path.join(root_dir, 'sites')
		if (await path_exists(sites_root)) {
			const entries = await fs.readdir(sites_root, { withFileTypes: true })
			for (const entry of entries) {
				if (!entry.isDirectory()) continue
				try {
					const config = await read_site_config(path.join(sites_root, entry.name))
					if (config.server) {
						server = config.server.replace(/\/+$/, '')
						break
					}
				} catch {}
			}
		}
	}
	if (!server) throw new Error('Server URL required for library push.')

	const token = options.token || await get_auth_token(server)
	if (!token) throw new Error('Authentication required. Run `primo login` first.')

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

	const response = await fetch(`${server}/api/primo/import-library`, {
		method: 'POST',
		headers: { 'Authorization': `Bearer ${token}` },
		body: form_data
	})

	if (response.status === 404) {
		spinner.warn('Library push not supported by this server — skipping')
		return
	}
	if (!response.ok) {
		throw new Error(await response.text())
	}

	const result = await response.json() as { summary?: { groups: number; blocks: number } }
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
