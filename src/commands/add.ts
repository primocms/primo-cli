import fs from 'fs/promises'
import path from 'path'
import { randomInt } from 'crypto'
import chalk from 'chalk'
import ora from 'ora'
import { spawn } from 'child_process'
import { ensure_binary, ensure_data_dir } from '../utils/binary.js'
import { read_site_config, write_site_config, type SiteConfig } from '../utils/site-config.js'
import { SERVER_CONFIG_FILE, read_server_config, write_server_config, type ServerConfig } from '../utils/server-config.js'
import { normalize_site } from './validate.js'
import { import_site_files, site_exists, wait_for_ready, kill_process, type ImportTimings } from './dev.js'

interface AddOptions {
	dir: string
	port: string
}

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

function generate_id(): string {
	let id = ''
	for (let i = 0; i < 15; i++) {
		id += ID_ALPHABET[randomInt(ID_ALPHABET.length)]
	}
	return id
}

// Mirror of new.ts's display-name derivation so `primo add maison-verde`
// and `primo new maison-verde` produce the same site name.
function derive_display_name(folder_name: string): string {
	return folder_name.includes('.')
		? folder_name.split('.')[0].charAt(0).toUpperCase() + folder_name.split('.')[0].slice(1)
		: folder_name.charAt(0).toUpperCase() + folder_name.slice(1).replace(/-/g, ' ')
}

// Register an existing sites/<name> folder with the workspace CMS: ensure
// site.yaml has a site_id, then import the site's records into the workspace
// database — via the running dev server when there is one, or a short-lived
// headless CMS process otherwise. One-time action; exits when done.
export async function add_site(target: string, options: AddOptions) {
	const base_dir = path.resolve(options.dir)

	try {
		await fs.access(path.join(base_dir, SERVER_CONFIG_FILE))
	} catch {
		console.log(chalk.red(`No ${SERVER_CONFIG_FILE} found in ${base_dir}.`))
		console.log(chalk.dim('Run `primo add` from the workspace root, or pass --dir <workspace>.'))
		process.exit(1)
	}

	const sites_root = path.join(base_dir, 'sites')
	const site_dir = resolve_site_dir(base_dir, sites_root, target)
	const folder_name = path.basename(site_dir)

	let stat
	try {
		stat = await fs.stat(site_dir)
	} catch {
		console.log(chalk.red(`sites/${folder_name} not found.`))
		console.log(chalk.dim('Create the folder first, or use `primo new` to scaffold a fresh site.'))
		process.exit(1)
	}
	if (!stat!.isDirectory()) {
		console.log(chalk.red(`sites/${folder_name} is not a directory.`))
		process.exit(1)
	}

	if (!await looks_like_site(site_dir)) {
		console.log(chalk.red(`sites/${folder_name} doesn't look like a Primo site.`))
		console.log(chalk.dim('Expected at least one of: site.yaml, pages/, blocks/, page-types/, site/'))
		process.exit(1)
	}

	let server_config = await read_server_config(base_dir)
	const { config, created, minted } = await ensure_site_config(site_dir, folder_name)
	if (created) {
		console.log(chalk.dim(`  created site.yaml (site_id ${config.site_id})`))
	} else if (minted) {
		console.log(chalk.dim(`  stamped site_id ${config.site_id} into site.yaml`))
	}

	// `primo new` guarantees the default group exists in server.yaml; when we
	// assign group: default ourselves, give it the same guarantee so the
	// dashboard doesn't invent an ad-hoc group id for it.
	if (config.group === 'default') {
		const site_groups = server_config.site_groups ?? []
		if (!site_groups.some((group) => group.id === 'default')) {
			server_config = {
				...server_config,
				site_groups: [...site_groups, { id: 'default', name: 'Default', index: site_groups.length }]
			}
			await write_server_config(base_dir, server_config)
		}
	}

	const port = server_config.port ?? parseInt(options.port, 10)
	const api_url = `http://127.0.0.1:${port}`

	if (await is_server_running(port)) {
		// A dev server is up — ask it to discover and import the site, exactly
		// like `primo new` does, so its watchers attach too.
		const reload = await request_dev_reload(port)

		if (reload.status === 'unreachable') {
			// Older dev server or hot reload disabled (port+1 in use). Import
			// directly against the running CMS — records land, but the dev
			// server won't watch this site until it's restarted.
			let timings: ImportTimings | null = null
			try {
				timings = await register_site(site_dir, api_url, config, port, server_config, base_dir)
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err)
				console.log(chalk.red(`  ✗ ${config.name} could not be imported: ${message}`))
				console.log(chalk.dim(`  Fix the problem, then re-run \`primo add ${target}\`.`))
				process.exit(1)
			}
			report_import(config.name, timings)
			console.log(chalk.yellow('  The running dev server couldn\'t be reloaded — restart `primo dev` to watch this site.'))
			console.log('')
			return
		}

		// The health check only proves *a* Primo server is on this port — it
		// could belong to a different workspace. The reload response's `known`
		// list is the only reliable way to tell: PocketBase 404s record reads
		// pre-setup even when the record exists, so we can't just probe the
		// site_id. (Older dev servers don't send `known` — trust the reload.)
		const known = reload.known?.find(site => site.site_id === config.site_id)
		if (reload.known && !known) {
			console.log(chalk.red(`  A Primo server is running on port ${port}, but it isn't serving this workspace.`))
			console.log(chalk.dim('  Stop it (or start `primo dev` in this workspace) and re-run `primo add`.'))
			process.exit(1)
		}

		if (known?.blocked || reload.quarantined.includes(config.name)) {
			console.log(chalk.yellow(`  ${config.name} was found, but the dev server couldn't import it (e.g. duplicate IDs or a missing pages/index.yaml).`))
			console.log(chalk.dim('  Check the `primo dev` logs, fix the problem, then re-run `primo add`.'))
			process.exit(1)
		}

		console.log('')
		if (reload.loaded === 0 && reload.known) {
			console.log(`  ${chalk.cyan(config.name)} is already registered with the running dev server.`)
		} else {
			console.log(chalk.green(`  ✓ ${config.name} registered`))
		}
		const host = local_dev_host(config.name, port)
		console.log(`    ${chalk.dim('Edit:')}    http://${host}/admin/site`)
		console.log(`    ${chalk.dim('Preview:')} http://${host}/`)
		console.log('')
		return
	}

	// No dev server running: boot the CMS binary headlessly against the
	// workspace database, import, and shut it back down.
	const spinner = ora('Starting CMS for one-time import...').start()
	const binary_path = await ensure_binary()
	const data_dir = await ensure_data_dir(base_dir)

	const cms_process = spawn(binary_path, ['serve', '--http', `127.0.0.1:${port}`, '--dir', data_dir], {
		stdio: ['pipe', 'pipe', 'pipe'],
		env: { ...process.env, PRIMO_DEV_MODE: '1', PRIMO_AUTHOR_MODE: 'files' }
	})
	let stderr_output = ''
	cms_process.stderr?.on('data', (data) => {
		stderr_output += data.toString()
	})

	let timings: ImportTimings | null = null
	let boot_failed = false
	let import_error: string | null = null
	try {
		const ready = await wait_for_ready(api_url, 30000)
		// A ready health check only proves *something* answered on the port.
		// If our child lost the bind race to another CMS and exited, that
		// other server is answering — importing would land this site's
		// records in a different workspace's database. Require our own
		// process to still be alive before trusting the port.
		if (!ready || cms_process.exitCode !== null || cms_process.killed) {
			boot_failed = true
		} else {
			spinner.text = `Importing ${config.name}...`
			try {
				timings = await register_site(site_dir, api_url, config, port, server_config, base_dir)
			} catch (err) {
				import_error = err instanceof Error ? err.message : String(err)
			}
		}
	} finally {
		// Always tear the CMS down before exiting — process.exit skips
		// finally blocks, so no exit() may appear inside this try.
		await kill_process(cms_process)
	}

	if (boot_failed) {
		spinner.fail('CMS failed to start')
		if (stderr_output) console.log(chalk.red(stderr_output))
		process.exit(1)
	}

	if (import_error !== null) {
		spinner.fail(`${config.name} could not be imported: ${import_error}`)
		console.log(chalk.dim(`  Fix the problem, then re-run \`primo add ${target}\`.`))
		process.exit(1)
	}

	if (timings === null || !timings.ok) {
		// Duplicate _ids or a failed bootstrap+import — details already printed.
		spinner.fail(`${config.name} could not be imported — see the errors above.`)
		process.exit(1)
	}

	spinner.succeed(`${config.name} registered (${timings.mode})`)
	report_warnings(timings)
	console.log('')
	console.log(chalk.dim('  Run `primo dev` to serve it.'))
	console.log('')
}

async function register_site(
	site_dir: string,
	api_url: string,
	config: SiteConfig,
	port: number,
	server_config: ServerConfig,
	base_dir: string
): Promise<ImportTimings | null> {
	await normalize_site(site_dir)
	const use_bootstrap = !await site_exists(api_url, config.site_id)
	return await import_site_files(site_dir, api_url, config, port, server_config, use_bootstrap, base_dir)
}

function report_import(site_name: string, timings: ImportTimings | null): void {
	if (timings === null || !timings.ok) {
		console.log(chalk.red(`  ✗ ${site_name} could not be imported — see the errors above.`))
		process.exit(1)
	}
	console.log(chalk.green(`  ✓ ${site_name} registered (${timings.mode})`))
	report_warnings(timings)
}

function report_warnings(timings: ImportTimings): void {
	if (timings.warning_count > 0) {
		console.log(chalk.yellow(`  ⚠ imported with ${timings.warning_count} warning${timings.warning_count === 1 ? '' : 's'} (details above)`))
	}
}

function resolve_site_dir(base_dir: string, sites_root: string, target: string): string {
	// A bare name resolves under sites/; anything with a separator is taken
	// as a path. Either way the result must be directly under sites/ — that's
	// the only directory site discovery and the dashboard scan, so registering
	// a folder anywhere else would import records no later `primo dev` run
	// can match back to files.
	const resolved = !target.includes('/') && !target.includes(path.sep)
		? path.resolve(sites_root, target)
		: path.resolve(base_dir, target)
	if (path.dirname(resolved) !== sites_root) {
		console.log(chalk.red(`Sites must live directly under sites/ — got "${target}".`))
		process.exit(1)
	}
	return resolved
}

async function looks_like_site(site_dir: string): Promise<boolean> {
	for (const marker of ['site.yaml', 'pages', 'blocks', 'page-types', 'site']) {
		try {
			await fs.stat(path.join(site_dir, marker))
			return true
		} catch {
			// keep looking
		}
	}
	return false
}

// Make sure site.yaml exists with a name and a site_id, minting what's
// missing. The site_id is the registration key: discovery, import, and the
// dashboard all match records by it, so a folder without one can never come
// online no matter how many times the dev server scans it.
async function ensure_site_config(site_dir: string, folder_name: string): Promise<{ config: SiteConfig; created: boolean; minted: boolean }> {
	let existing: SiteConfig | null = null
	try {
		const parsed = await read_site_config(site_dir)
		if (parsed && typeof parsed === 'object') {
			existing = parsed
		} else if (parsed !== null && parsed !== undefined) {
			// site.yaml exists but isn't a mapping (e.g. a bare string).
			// Overwriting it would silently discard whatever the user meant
			// to keep — an empty file is the only non-mapping we fill in.
			console.log(chalk.red(`sites/${folder_name}/site.yaml is malformed (expected key: value mappings).`))
			console.log(chalk.dim('Fix or delete it, then re-run `primo add`.'))
			process.exit(1)
		}
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
			// Unreadable or unparseable site.yaml — never overwrite it with a
			// fresh config; that would mint a new site_id and drop the user's
			// server/group for a site that may already be registered.
			const message = error instanceof Error ? error.message : String(error)
			console.log(chalk.red(`sites/${folder_name}/site.yaml could not be read: ${message}`))
			console.log(chalk.dim('Fix or delete it, then re-run `primo add`.'))
			process.exit(1)
		}
		// ENOENT — no site.yaml yet; create one below.
	}

	const created = existing === null
	const config = existing ?? ({ group: 'default' } as SiteConfig)
	let changed = created

	if (!config.name) {
		config.name = derive_display_name(folder_name)
		changed = true
	}
	const minted = !config.site_id
	if (minted) {
		config.site_id = generate_id()
		changed = true
	}

	if (changed) {
		await write_site_config(site_dir, config)
	}
	return { config, created, minted }
}

type ReloadResult =
	| { status: 'unreachable' }
	| {
		status: 'ok'
		loaded: number
		quarantined: string[]
		known?: { name: string; site_id: string; blocked: boolean }[]
	}

async function request_dev_reload(port: number): Promise<ReloadResult> {
	try {
		// Bound the request: the reload handler runs discovery + import
		// synchronously before responding.
		const controller = new AbortController()
		const timeout = setTimeout(() => controller.abort(), 30000)
		let res: Response
		try {
			res = await fetch(`http://127.0.0.1:${port + 1}/reload`, {
				method: 'POST',
				signal: controller.signal
			})
		} finally {
			clearTimeout(timeout)
		}
		if (!res.ok) return { status: 'unreachable' }
		const result = await res.json().catch(() => null) as
			| { loaded?: number; quarantined?: string[]; known?: { name: string; site_id: string; blocked: boolean }[] }
			| null
		if (!result) return { status: 'unreachable' }
		return {
			status: 'ok',
			loaded: result.loaded ?? 0,
			quarantined: result.quarantined ?? [],
			known: Array.isArray(result.known) ? result.known : undefined
		}
	} catch {
		return { status: 'unreachable' }
	}
}

// Mirror of dev.ts's local_dev_host so the links printed here match the ones
// `primo dev` prints for the same site.
function local_dev_host(name: string, port: number): string {
	const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'site'
	return `${slug}.localhost:${port}`
}

async function is_server_running(port: number): Promise<boolean> {
	try {
		const controller = new AbortController()
		const timeout = setTimeout(() => controller.abort(), 1000)
		const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
			signal: controller.signal
		})
		clearTimeout(timeout)
		return response.ok
	} catch {
		return false
	}
}
