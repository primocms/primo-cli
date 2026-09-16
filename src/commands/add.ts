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
	const port = server_config.port ?? parseInt(options.port, 10)

	// `primo add` and `primo dev`'s sites-root watcher both mint a site_id for a
	// newly-appeared folder. If dev is up when we add, the two race: the watcher
	// adopts the folder under its own id while add writes a different id to
	// site.yaml, leaving disk pointing at an id the CMS doesn't have. Refuse
	// while a server holds the port so there is exactly one minter — the
	// headless import below. This check runs BEFORE ensure_site_config so we
	// never stamp a site_id we'd then strand. `primo dev` picks the folder up on
	// its next start (or its watcher, if it's already been given an id).
	if (await is_server_running(port)) {
		console.log(chalk.red(`A Primo server is running on port ${port}.`))
		console.log(chalk.dim(`  Stop it (Ctrl+C in its terminal), then re-run \`primo add ${target}\`.`))
		console.log(chalk.dim('  `primo dev` imports the folder itself once it\'s restarted.'))
		process.exit(1)
	}

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

	const api_url = `http://127.0.0.1:${port}`

	// No server is running (guaranteed — we refused above if one held the port),
	// so boot the CMS binary headlessly against the workspace database, import,
	// and shut it back down. This is the single minter/import path, which is why
	// `primo add` and the dev watcher can't double-mint the same folder.
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
