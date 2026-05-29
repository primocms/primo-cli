import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import ora, { type Ora } from 'ora'
import archiver from 'archiver'
import { get_auth_token } from '../utils/auth.js'
import { read_site_config, get_site_config_path, type SiteConfig, SITE_CONFIG_FILE } from '../utils/site-config.js'
import { get_server_config_path, read_server_config } from '../utils/server-config.js'

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

interface PushDiff {
	blocks: { added: string[]; modified: string[]; deleted: string[] }
	page_types: { added: string[]; modified: string[]; deleted: string[] }
	pages: { added: string[]; modified: string[]; deleted: string[] }
	site: { added: string[]; modified: string[]; deleted: string[] }
}

export async function push_site(options: PushOptions) {
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
		return
	}

	// Server-folder mode: walk site subfolders + push library
	if (!has_site_yaml && has_server_yaml) {
		await push_server(root_dir, effective_options)
		return
	}

	// Single-site mode (cwd is a site folder, or --dir points at one)
	const spinner = ora('Reading local files...').start()
	try {
		await push_single_site(root_dir, effective_options, spinner)
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

	const server = (options.server || inferred_server)?.replace(/\/+$/, '')

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

async function push_server(root_dir: string, options: PushOptions) {
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
		return
	}

	let saw_auth_error = false

	// Push each site
	for (const site_dir of site_dirs) {
		const spinner = ora(`Pushing ${chalk.cyan(path.basename(site_dir))}...`).start()
		try {
			await push_single_site(site_dir, { ...options, dir: site_dir }, spinner)
		} catch (error) {
			spinner.fail(`${path.basename(site_dir)}: ${error instanceof Error ? error.message : error}`)
			if (is_auth_error(error)) saw_auth_error = true
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
		}
	}

	if (saw_auth_error) print_auth_hint()
}

async function push_single_site(site_dir: string, options: PushOptions, spinner: Ora) {
	let config: SiteConfig | null = null
	try {
		config = await read_site_config(site_dir)
	} catch {
		// No config file, must provide options
	}

	const server = (options.server || config?.server)?.replace(/\/+$/, '')
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

	// If the user isn't logged in yet, skip the import attempt and try
	// bootstrap directly. Bootstrap doesn't require auth (only allowed when
	// the server has zero sites), so it's the right path for first-time
	// setup against a fresh deployment.
	if (!token) {
		if (options.preview) {
			throw new Error('Authentication required for --preview. Run `primo login` first.')
		}
		spinner.text = 'No auth token — attempting bootstrap...'
		const bootstrap_result = await try_bootstrap_site(server, undefined, zip_buffer, config, site_id)
		if (bootstrap_result.ok) {
			spinner.succeed(`Bootstrapped ${config?.name || path.basename(site_dir)}`)
			console.log('')
			console.log(chalk.dim('  Site created on server and content uploaded.'))
			console.log(chalk.dim('  Run `primo login` and re-push to update content later.'))
			return
		}
		throw new Error(bootstrap_result.error)
	}

	const endpoint = options.preview
		? `${server}/api/palacms/import/${site_id}/preview`
		: `${server}/api/palacms/import/${site_id}`

	spinner.text = options.preview ? 'Previewing changes...' : 'Pushing changes...'

	const form_data = new FormData()
	form_data.append('file', new Blob([zip_buffer]), 'site.zip')

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: { 'Authorization': `Bearer ${token}` },
		body: form_data
	})

	// 404 from import means the site doesn't exist on the server yet. On a
	// freshly-deployed server we can fall back to /api/palacms/bootstrap,
	// which creates the site and ingests the zip in one shot. Bootstrap is
	// only available when the server has zero sites — past the first site,
	// new sites must be created via the dashboard UI.
	if (response.status === 404 && !options.preview) {
		spinner.text = 'Site not found on server — bootstrapping...'
		const bootstrap_result = await try_bootstrap_site(server, token, zip_buffer, config, site_id)
		if (bootstrap_result.ok) {
			spinner.succeed(`Bootstrapped ${config?.name || path.basename(site_dir)}`)
			console.log('')
			console.log(chalk.dim('  Site created on server and content uploaded.'))
			console.log(chalk.dim('  Subsequent pushes will use the import endpoint.'))
			return
		}
		throw new Error(bootstrap_result.error)
	}

	if (!response.ok) {
		throw new Error(await response.text())
	}

	const result = await response.json() as { preview?: boolean; success?: boolean; diff: PushDiff }
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
	}
}

async function try_bootstrap_site(
	server: string,
	token: string | undefined,
	zip_buffer: Buffer,
	config: SiteConfig | null,
	site_id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
	const form = new FormData()
	form.append('site_id', site_id)
	if (config?.name) form.append('name', config.name)
	if (config?.group) form.append('group', config.group)
	// Register the site against the deploy URL's host so the first visit to
	// that domain finds a matching site instead of dropping into CreateSite.
	try {
		form.append('host', new URL(server).host)
	} catch {
		// Malformed server URL — let the server fall back to its own default.
	}
	form.append('file', new Blob([zip_buffer]), 'site.zip')

	const headers: Record<string, string> = {}
	if (token) headers['Authorization'] = `Bearer ${token}`

	const response = await fetch(`${server}/api/palacms/bootstrap`, {
		method: 'POST',
		headers,
		body: form
	})

	if (response.ok) return { ok: true }

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
	let server = options.server?.replace(/\/+$/, '')
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

	const response = await fetch(`${server}/api/palacms/import-library`, {
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
