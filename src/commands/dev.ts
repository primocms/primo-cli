import fs from 'fs/promises'
import path from 'path'
import { randomInt } from 'crypto'
import chalk from 'chalk'
import ora from 'ora'
import { spawn, type ChildProcess } from 'child_process'
import archiver from 'archiver'
import extract from 'extract-zip'
import { dump as dump_yaml, load as load_yaml } from 'js-yaml'
import chokidar, { type FSWatcher } from 'chokidar'
import { ensure_binary, ensure_data_dir } from '../utils/binary.js'
import { read_site_config, type SiteConfig, SITE_CONFIG_FILE } from '../utils/site-config.js'
import { read_server_config, type ServerConfig, type SiteGroupConfig, format_group_name, SERVER_CONFIG_FILE } from '../utils/server-config.js'
import { normalize_site } from './validate.js'

interface DevOptions {
	dir: string
	port: string
	force?: boolean
}

interface SiteInfo {
	dir: string
	config: SiteConfig
}

let cms_process: ChildProcess | null = null
let watchers: FSWatcher[] = []
let reimport_timeout: NodeJS.Timeout | null = null
let library_reimport_timeout: NodeJS.Timeout | null = null
let sync_interval: NodeJS.Timeout | null = null
let is_syncing = false
let is_importing = false
let is_cleaning_up = false
let last_import_time = 0  // Timestamp of last import completion
let last_local_change_time = 0  // Timestamp of most recent local watcher event
const importing_site_keys = new Set<string>()
const pending_local_site_keys = new Set<string>()
let is_importing_library = false
let has_pending_library_local_changes = false

// Track files written by sync to prevent watcher from re-pushing them
// Map of filepath -> mtime (ms) when we wrote it
const synced_files = new Map<string, number>()
const synced_deleted_paths = new Map<string, number>()

// Snapshot of library folder paths known to be in the DB after the last
// successful push, mapped to the underlying DB record ID (group id or
// symbol/block id from fields.yaml). Paths are posix-style and relative to
// the library root, e.g. "marketing" (group) or "marketing/hero-split"
// (block). A diff against the current filesystem between pushes is what
// produces the `deletes` manifest: if a path was in the last snapshot but
// isn't on disk now, its ID is sent to the server as an explicit delete.
type LibrarySnapshot = Map<string, { kind: 'group' | 'block'; id: string | null }>
let library_snapshot: LibrarySnapshot = new Map()

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const SITES_DIR = 'sites'
const LIBRARY_DIR = 'library'
const MCP_CONFIG_FILE = '.mcp.json'

type IDCategory = 'pages' | 'page_sections' | 'blocks' | 'page_types' | 'site_fields' | 'block_fields' | 'page_type_fields'

type DuplicateOccurrence = {
	owner: string
	file: string
}

type LocalDevPreparation = {
	excluded_paths: Set<string>
	warnings: string[]
}

type ImportTimings = {
	zip_ms: number
	request_ms: number
	mode: 'bootstrap' | 'import' | 'bootstrap+import'
}

const LOCAL_PUSH_DEBOUNCE_MS = 150
const LOCAL_ZIP_COMPRESSION_LEVEL = 0
// Tolerance for matching a file mtime against the synced_files map to decide
// whether an fs.watch event was caused by our own sync-write. Wider values
// trade duplicate push work for safety against slow I/O and flaky watchers
// (macOS fs.watch fires inconsistently for recursive writes).
const SYNC_MTIME_TOLERANCE_MS = 3000
// When the user writes a file locally, suppress CMS->local pulls for this
// long to prevent a pull that was in-flight before the watcher fired from
// stomping the just-written content on arrival.
const LOCAL_CHANGE_PULL_COOLDOWN_MS = 3000

function get_site_sync_key(site_dir: string, config: SiteConfig): string {
	return config.site_id || site_dir
}

async function with_site_import_lock<T>(site_dir: string, config: SiteConfig, fn: () => Promise<T>): Promise<T> {
	const site_key = get_site_sync_key(site_dir, config)
	importing_site_keys.add(site_key)
	try {
		return await fn()
	} finally {
		importing_site_keys.delete(site_key)
	}
}

// Check if a port is in use
async function is_port_in_use(port: number): Promise<boolean> {
	try {
		const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
			method: 'GET',
			signal: AbortSignal.timeout(500)
		})
		return response.ok
	} catch {
		return false
	}
}

// Kill processes on a specific port
async function kill_port(port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const lsof = spawn('lsof', ['-ti', `:${port}`])
		let pids = ''
		lsof.stdout.on('data', (data) => { pids += data.toString() })
		lsof.on('close', () => {
			const pid_list = pids.trim().split('\n').filter(Boolean)
			if (pid_list.length === 0) {
				resolve(false)
				return
			}
			for (const pid of pid_list) {
				try {
					process.kill(parseInt(pid, 10), 'SIGKILL')
				} catch {
					// Process may have already exited
				}
			}
			resolve(true)
		})
	})
}

// Fetch with timeout helper
async function fetch_with_timeout(url: string, options: RequestInit = {}, timeout_ms = 10000): Promise<Response> {
	const controller = new AbortController()
	const timeout_id = setTimeout(() => controller.abort(), timeout_ms)

	try {
		const response = await fetch(url, { ...options, signal: controller.signal })
		return response
	} finally {
		clearTimeout(timeout_id)
	}
}

// Kill process with escalation to SIGKILL
async function kill_process(proc: ChildProcess): Promise<void> {
	if (!proc || proc.killed) return

	proc.kill('SIGTERM')

	// Wait up to 3 seconds for graceful shutdown
	const start = Date.now()
	while (Date.now() - start < 3000) {
		if (proc.killed || proc.exitCode !== null) return
		await new Promise(resolve => setTimeout(resolve, 100))
	}

	// Force kill if still running
	if (!proc.killed && proc.exitCode === null) {
		proc.kill('SIGKILL')
	}
}

export async function dev_server(options: DevOptions) {
	const spinner = ora('Starting Primo...').start()

	try {
		const base_dir = path.resolve(options.dir)
		const mcp_registration_path = await register_primo_mcp_server(base_dir)

		// Check for server config (multi-site mode) or site config (single-site mode)
		const server_config_path = path.join(base_dir, SERVER_CONFIG_FILE)

		let server_config: ServerConfig = {}
		let sites: SiteInfo[] = []
		let is_server_mode = false

		try {
			server_config = await read_server_config(base_dir)
			is_server_mode = true
		} catch {
			// No server config, check for site config
		}

		const port = server_config.port || parseInt(options.port, 10)

		// Check if ports are in use
		const main_in_use = await is_port_in_use(port)
		const reload_in_use = await is_port_in_use(port + 1)

		if (main_in_use || reload_in_use) {
			if (options.force) {
				spinner.text = 'Killing existing processes...'
				if (main_in_use) await kill_port(port)
				if (reload_in_use) await kill_port(port + 1)
				// Give processes time to release ports
				await new Promise(resolve => setTimeout(resolve, 500))
			} else {
				const ports_msg = main_in_use && reload_in_use
					? `Ports ${port} and ${port + 1} are`
					: `Port ${main_in_use ? port : port + 1} is`
				spinner.fail(`${ports_msg} already in use. Use --force to kill existing processes.`)
				process.exit(1)
			}
		}

		if (is_server_mode) {
			// Auto-discover sites in subdirectories
			spinner.text = 'Discovering sites...'
			sites = await discover_sites(base_dir)
			// Sites can be empty - the dashboard will show the site creation screen
		} else {
			// Single site mode
			try {
				const config = await read_site_config(base_dir)
				sites = [{ dir: base_dir, config }]
			} catch {
				spinner.fail(`No ${SERVER_CONFIG_FILE} or ${SITE_CONFIG_FILE} found. Run \`primo new\` first.`)
				process.exit(1)
			}
		}

		// Ensure binary is installed
		spinner.text = 'Checking palacms...'
		const binary_path = await ensure_binary()

		// Create data directory in project folder
		const data_dir = await ensure_data_dir(base_dir)

		spinner.text = 'Starting CMS...'

		// Start the CMS binary with dev mode enabled
		cms_process = spawn(binary_path, ['serve', '--http', `127.0.0.1:${port}`, '--dir', data_dir], {
			stdio: ['pipe', 'pipe', 'pipe'],
			env: { ...process.env, PALA_DEV_MODE: '1' }
		})

		// Capture stderr for errors
		let stderr_output = ''
		cms_process.stderr?.on('data', (data) => {
			stderr_output += data.toString()
		})

		// Wait for CMS to be ready
		const ready = await wait_for_ready(`http://127.0.0.1:${port}`, 30000)
		if (!ready) {
			spinner.fail('CMS failed to start')
			if (stderr_output) {
				console.log(chalk.red(stderr_output))
			}
			process.exit(1)
		}

			const api_url = `http://127.0.0.1:${port}`

			if (is_server_mode) {
				spinner.text = 'Loading shared library...'
				is_importing_library = true
				try {
					await import_library_files(base_dir, api_url)
				} finally {
					is_importing_library = false
				}
			}

			// Normalize and load all sites
			spinner.text = `Loading ${sites.length} site${sites.length > 1 ? 's' : ''}...`

		for (const site of sites) {
			await normalize_site(site.dir)
			const use_bootstrap = !await site_exists(api_url, site.config.site_id)
			await with_site_import_lock(site.dir, site.config, () => import_site_files(site.dir, api_url, site.config, port, server_config, use_bootstrap))
		}

		// Verify all sites are accessible before proceeding
		spinner.text = 'Verifying sites...'
		for (const site of sites) {
			await verify_site_ready(api_url, site.config.site_id)
		}

		spinner.succeed('Primo running')

		console.log('')
		if (mcp_registration_path) {
			console.log(`  ${chalk.dim(`MCP server registered at ${mcp_registration_path} - agents in this directory can now use the Primo MCP server.`)}`)
			console.log('')
		}
		if (is_server_mode) {
			console.log(`  ${chalk.cyan('Dashboard:')} http://127.0.0.1:${port}/admin/dashboard`)
			console.log('')
		}
		for (const site of sites) {
			const host = site.config.host || `${site.config.name.toLowerCase().replace(/\s+/g, '-')}.localhost:${port}`
			console.log(`  ${chalk.cyan(site.config.name)}`)
			console.log(`    ${chalk.dim('Edit:')}    http://${host}/admin/site`)
			console.log(`    ${chalk.dim('Preview:')} http://${host}/`)
		}
		if (sites.length > 0 || !is_server_mode) {
			console.log('')
		}

			// Start watching for file changes
			const dirs_to_watch = ['blocks', 'page-types', 'pages', 'site']
			const known_sites = new Set(sites.map(s => s.dir))

			if (is_server_mode) {
				const library_path = path.join(base_dir, LIBRARY_DIR)
				// Prime the snapshot from the current disk state so the first
				// post-startup push doesn't consider every existing folder as
				// a potential delete.
				library_snapshot = await scan_library_folders(library_path)

				try {
					const watcher = chokidar.watch(library_path, {
						ignored: (p: string) => path.basename(p).startsWith('.'),
						ignoreInitial: true,
						awaitWriteFinish: {
							stabilityThreshold: 60,
							pollInterval: 30
						}
					})
					const on_event = (full_path: string) => {
						if (should_skip_synced_delete(full_path)) return
						// Mark pending synchronously so the sync interval cannot
						// sneak a pull through between the event and push.
						has_pending_library_local_changes = true
						last_local_change_time = Date.now()

						const synced_mtime = synced_files.get(full_path)
						if (synced_mtime) {
							// Our own sync-write — skip.
							fs.stat(full_path)
								.then(stat => {
									if (Math.abs(stat.mtimeMs - synced_mtime) < SYNC_MTIME_TOLERANCE_MS) {
										synced_files.delete(full_path)
										return
									}
									synced_files.delete(full_path)
									schedule_library_push()
								})
								.catch(() => {
									synced_files.delete(full_path)
									schedule_library_push()
								})
							return
						}
						schedule_library_push()
					}

					const schedule_library_push = () => {
						const rel = (full_path: string) => path.relative(library_path, full_path)
						if (library_reimport_timeout) clearTimeout(library_reimport_timeout)
						library_reimport_timeout = setTimeout(async () => {
							if (is_importing) {
								// Re-arm; another push is in-flight.
								schedule_library_push()
								return
							}
							try {
								is_importing = true
								is_importing_library = true

								// Diff current disk state against the last snapshot to
								// compute the deletes manifest. Only paths present in
								// the snapshot but absent on disk right now are real
								// user deletions. Race-free: we read disk AFTER the
								// debounce has settled.
								const current = await scan_library_folders(library_path)
								const delete_group_ids: string[] = []
								const delete_symbol_ids: string[] = []
								const delete_paths: string[] = []
								for (const [snap_path, entry] of library_snapshot) {
									if (current.has(snap_path)) continue
									delete_paths.push(snap_path)
									if (entry.id) {
										if (entry.kind === 'group') delete_group_ids.push(entry.id)
										else delete_symbol_ids.push(entry.id)
									}
								}
								delete_paths.sort()
								if (delete_paths.length > 0) {
									console.log(chalk.yellow(`  library: deleting ${delete_paths.length} path(s): ${delete_paths.join(', ')}`))
								}

								const import_timings = await import_library_files(base_dir, api_url, delete_group_ids, delete_symbol_ids)
								const reload_started = Date.now()
								await request_browser_reload(api_url)
								const reload_ms = Date.now() - reload_started
								has_pending_library_local_changes = false
								// Update snapshot only on successful push.
								library_snapshot = current
								console.log(chalk.dim(`  library: zip ${import_timings.zip_ms}ms, import ${import_timings.request_ms}ms, reload ${reload_ms}ms`))
								console.log(chalk.green('  ✓ Library pushed'))
							} catch (err) {
								console.log(chalk.red(`  ✗ Library push failed: ${err}`))
							} finally {
								is_importing_library = false
								is_importing = false
								last_import_time = Date.now()
							}
						}, LOCAL_PUSH_DEBOUNCE_MS)
					}

					watcher.on('add', on_event)
					watcher.on('change', on_event)
					watcher.on('unlink', on_event)
					watcher.on('addDir', on_event)
					watcher.on('unlinkDir', on_event)
					watchers.push(watcher)
				} catch {
					// Library directory might not exist
				}
			}

			const setup_site_watchers = (site: SiteInfo) => {
			let pending_reload = false

			const schedule_reimport = () => {
				if (reimport_timeout) {
					clearTimeout(reimport_timeout)
				}
				reimport_timeout = setTimeout(async () => {
					// If already importing, reschedule and wait
					if (is_importing) {
						schedule_reimport()
						return
					}
					try {
						is_importing = true
						const normalize_started = Date.now()
						await normalize_site(site.dir)
						const normalize_ms = Date.now() - normalize_started
						const import_timings = await with_site_import_lock(site.dir, site.config, () => import_site_files(site.dir, api_url, site.config, port, server_config, false))
						let reload_ms = 0
						if (pending_reload) {
							try {
								const reload_started = Date.now()
								await request_browser_reload(api_url)
								reload_ms = Date.now() - reload_started
							} catch {
								console.log(chalk.yellow(`  Warning: Failed to trigger browser reload for ${site.config.name}`))
							}
							pending_reload = false
						}
						pending_local_site_keys.delete(get_site_sync_key(site.dir, site.config))
						console.log(chalk.dim(`  ${site.config.name}: normalize ${normalize_ms}ms, zip ${import_timings.zip_ms}ms, ${import_timings.mode} ${import_timings.request_ms}ms${reload_ms ? `, reload ${reload_ms}ms` : ''}`))
						console.log(chalk.green(`  ✓ ${site.config.name} pushed`))
					} catch (err) {
						console.log(chalk.red(`  ✗ ${site.config.name} push failed: ${err}`))
					} finally {
						is_importing = false
						last_import_time = Date.now()  // Track when import finished
					}
				}, LOCAL_PUSH_DEBOUNCE_MS)
			}

			for (const dir of dirs_to_watch) {
				const watch_path = path.join(site.dir, dir)
				try {
					const watcher = chokidar.watch(watch_path, {
						ignored: (p: string) => path.basename(p).startsWith('.'),
						ignoreInitial: true,
						awaitWriteFinish: {
							stabilityThreshold: 60,
							pollInterval: 30
						}
					})
					const continue_event = (full_path: string) => {
						const filename = path.relative(watch_path, full_path)
						console.log(chalk.dim(`  ${site.config.name}: ${dir}/${filename}`))
						if (change_requires_reload(dir, filename)) {
							pending_reload = true
						}
						schedule_reimport()
					}
					const on_event = (full_path: string) => {
						if (should_skip_synced_delete(full_path)) return
						// Mark site as pending synchronously so the sync interval
						// cannot pull against a site that's actively being edited.
						pending_local_site_keys.add(get_site_sync_key(site.dir, site.config))
						last_local_change_time = Date.now()

						const synced_mtime = synced_files.get(full_path)
						if (synced_mtime) {
							fs.stat(full_path)
								.then(stat => {
									if (Math.abs(stat.mtimeMs - synced_mtime) < SYNC_MTIME_TOLERANCE_MS) {
										synced_files.delete(full_path)
										return
									}
									synced_files.delete(full_path)
									continue_event(full_path)
								})
								.catch(() => {
									synced_files.delete(full_path)
									continue_event(full_path)
								})
							return
						}
						continue_event(full_path)
					}
					watcher.on('add', on_event)
					watcher.on('change', on_event)
					watcher.on('unlink', on_event)
					watcher.on('addDir', on_event)
					watcher.on('unlinkDir', on_event)
					watchers.push(watcher)
				} catch {
					// Directory might not exist
				}
			}
		}

		// Set up watchers for existing sites
		for (const site of sites) {
			setup_site_watchers(site)
		}

		// Simple HTTP server for reload requests (only in server mode)
		if (is_server_mode) {
			const http = await import('http')
			const reload_server = http.createServer(async (req, res) => {
				if (req.method !== 'POST' || req.url !== '/reload') {
					res.writeHead(404)
					res.end()
					return
				}

				const new_sites = await discover_sites(base_dir)
				for (const site of new_sites) {
					if (known_sites.has(site.dir)) continue

						known_sites.add(site.dir)
						sites.push(site)
						await normalize_site(site.dir)
						const use_bootstrap = !await site_exists(api_url, site.config.site_id)
						await with_site_import_lock(site.dir, site.config, () => import_site_files(site.dir, api_url, site.config, port, server_config, use_bootstrap))
						setup_site_watchers(site)

					const host = site.config.host || `${path.basename(site.dir).toLowerCase().replace(/\s+/g, '-')}.localhost:${port}`
					console.log(chalk.green(`  ✓ New site loaded: ${site.config.name}`))
					console.log(`    ${chalk.dim('Edit:')}    http://${host}/admin/site`)
					console.log(`    ${chalk.dim('Preview:')} http://${host}/`)
				}

				res.writeHead(200)
				res.end('ok')
			})
			reload_server.on('error', (err: NodeJS.ErrnoException) => {
				if (err.code === 'EADDRINUSE') {
					console.log(chalk.yellow(`\n  Warning: Reload server port ${port + 1} in use. Hot reload disabled.`))
				}
			})
			reload_server.listen(port + 1, '127.0.0.1')
		}

		// Start polling for CMS changes (sync back to local files)
		// Wait 3 seconds after import to avoid overwriting just-pushed changes
		const IMPORT_COOLDOWN_MS = 3000
		sync_interval = setInterval(async () => {
			if (is_syncing || is_importing) return
			if (Date.now() - last_import_time < IMPORT_COOLDOWN_MS) return
			// Skip the pull if the user just made a local change — otherwise a
			// pull that started before the watcher fired could overwrite the
			// fresh local edit on arrival.
			if (Date.now() - last_local_change_time < LOCAL_CHANGE_PULL_COOLDOWN_MS) return

			is_syncing = true
			try {
				for (const site of sites) {
					try {
						const site_key = get_site_sync_key(site.dir, site.config)
						if (importing_site_keys.has(site_key) || pending_local_site_keys.has(site_key)) {
							continue
						}
						await sync_from_cms(site.dir, api_url, site.config)
					} catch {
						// Silently ignore sync errors
					}
				}
				if (is_server_mode && !is_importing_library && !has_pending_library_local_changes && await has_library_content(path.join(base_dir, LIBRARY_DIR))) {
					try {
						await sync_library_from_cms(base_dir, api_url)
					} catch {
						// Silently ignore library sync errors
					}
				}
			} finally {
				is_syncing = false
			}
		}, 1000)

		console.log(chalk.dim('  Watching for changes...'))
		console.log(chalk.dim('  CMS-to-file sync is enabled when no local edits are pending.'))
		console.log(chalk.dim('  Press Ctrl+C to stop'))

		// Handle cleanup
		const cleanup = async () => {
			if (is_cleaning_up) return
			is_cleaning_up = true

			console.log(chalk.dim('\n  Shutting down...'))

			for (const watcher of watchers) {
				try {
					watcher.close()
				} catch {
					// Ignore watcher close errors
				}
			}
			watchers = []

				if (reimport_timeout) {
					clearTimeout(reimport_timeout)
					reimport_timeout = null
				}
				if (library_reimport_timeout) {
					clearTimeout(library_reimport_timeout)
					library_reimport_timeout = null
				}
				if (sync_interval) {
					clearInterval(sync_interval)
					sync_interval = null
			}
			if (cms_process) {
				await kill_process(cms_process)
				cms_process = null
			}
			process.exit(0)
		}

		process.on('SIGINT', cleanup)
		process.on('SIGTERM', cleanup)
		process.on('uncaughtException', (err) => {
			console.error(chalk.red(`\n  Uncaught exception: ${err.message}`))
			cleanup()
		})
		process.on('unhandledRejection', (reason) => {
			console.error(chalk.red(`\n  Unhandled rejection: ${reason}`))
			cleanup()
		})

		// Keep process alive
		await new Promise(() => {})

	} catch (error) {
		spinner.fail(`Failed to start: ${error instanceof Error ? error.message : error}`)
		process.exit(1)
	}
}

async function register_primo_mcp_server(base_dir: string): Promise<string | null> {
	if (!await path_exists(path.join(base_dir, SERVER_CONFIG_FILE))) {
		return null
	}

	const mcp_config_path = path.join(base_dir, MCP_CONFIG_FILE)
	let config: Record<string, unknown> = {}

	try {
		const raw = await fs.readFile(mcp_config_path, 'utf-8')
		config = raw.trim() ? JSON.parse(raw) as Record<string, unknown> : {}
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
			return null
		}
	}

	if (!is_plain_record(config)) {
		return null
	}

	if (config.mcpServers !== undefined && !is_plain_record(config.mcpServers)) {
		return null
	}

	const existing_mcp_servers = config.mcpServers as Record<string, unknown> | undefined
	const mcp_servers = { ...(existing_mcp_servers ?? {}) }
	if (mcp_servers.primo !== undefined) {
		return null
	}

	const local_mcp = process.env.PRIMO_MCP_LOCAL
		?? '/Users/mateo/Desktop/primo/primo-mcp/dist/index.js'
	mcp_servers.primo = local_mcp
		? { command: 'node', args: [local_mcp] }
		: { command: 'npx', args: ['-y', '@primo/mcp'] }
	config.mcpServers = mcp_servers

	// Claude Code reads project-root .mcp.json. .primo/ is gitignored local
	// state, so the discoverable root file is the right registration target.
	await fs.writeFile(mcp_config_path, `${JSON.stringify(config, null, 2)}\n`, 'utf-8')
	return MCP_CONFIG_FILE
}

function is_plain_record(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value)
}

async function discover_sites(base_dir: string): Promise<SiteInfo[]> {
	const sites: SiteInfo[] = []
	const sites_root = await get_sites_root(base_dir)
	const entries = await fs.readdir(sites_root, { withFileTypes: true })

	for (const entry of entries) {
		if (entry.isDirectory() && !entry.name.startsWith('.')) {
			const site_dir = path.join(sites_root, entry.name)
			try {
				const config = await read_site_config(site_dir)
				sites.push({ dir: site_dir, config })
			} catch {
				// Not a site directory
			}
		}
	}

	return sites
}

async function get_sites_root(base_dir: string): Promise<string> {
	const candidate = path.join(base_dir, SITES_DIR)
	try {
		const stat = await fs.stat(candidate)
		if (stat.isDirectory()) {
			return candidate
		}
	} catch {
		// Missing sites/ directory
	}

	throw new Error(`Server workspace is missing ${SITES_DIR}/. Run \`primo new\` from the workspace root or create ${SITES_DIR}/ first.`)
}

function resolve_site_group(config: SiteConfig, server_config: ServerConfig): SiteGroupConfig {
	const configured_groups = server_config.site_groups ?? []
	const group_ref = config.group?.trim()
	const ensure_group_id = (group: SiteGroupConfig): SiteGroupConfig => ({
		...group,
		id: typeof group.id === 'string' && group.id.trim().length >= 15 ? group.id.trim() : generate_id()
	})

	if (group_ref) {
		const existing_group = configured_groups.find((group) => group.id === group_ref || group.name === group_ref)
		if (existing_group) {
			return ensure_group_id(existing_group)
		}

		return ensure_group_id({
			id: group_ref,
			name: format_group_name(group_ref),
			index: configured_groups.length
		})
	}

	if (configured_groups[0]) {
		return ensure_group_id(configured_groups[0])
	}

	return ensure_group_id({
		id: '',
		name: 'Default',
		index: 0
	})
}

async function wait_for_ready(url: string, timeout_ms: number): Promise<boolean> {
	const start = Date.now()
	const health_url = `${url}/api/health`

	while (Date.now() - start < timeout_ms) {
		try {
			const response = await fetch_with_timeout(health_url, {}, 2000)
			if (response.ok) {
				// Health check passed, but collections may not be ready yet
				// Give PocketBase a moment to finish initializing
				await new Promise(resolve => setTimeout(resolve, 500))
				return true
			}
		} catch {
			// Server not ready yet
		}
		await new Promise(resolve => setTimeout(resolve, 100))
	}

	return false
}

async function verify_site_ready(api_url: string, site_id: string): Promise<boolean> {
	const max_attempts = 20
	const delay_ms = 100

	for (let i = 0; i < max_attempts; i++) {
		try {
			const response = await fetch_with_timeout(`${api_url}/api/collections/sites/records/${site_id}`, {}, 5000)
			if (response.ok) {
				return true
			}
		} catch {
			// Site not ready yet
		}
		await new Promise(resolve => setTimeout(resolve, delay_ms))
	}

	return false
}

async function site_exists(api_url: string, site_id: string): Promise<boolean> {
	try {
		const response = await fetch_with_timeout(`${api_url}/api/collections/sites/records/${site_id}`, {}, 5000)
		return response.ok
	} catch {
		return false
	}
}

function change_requires_reload(_dir: string, _filename: string): boolean {
	return true
}

async function request_browser_reload(api_url: string): Promise<void> {
	await fetch_with_timeout(`${api_url}/api/palacms/dev/reload`, {
		method: 'POST'
	}, 5000)
}

function generate_id(length = 15): string {
	let id = ''
	for (let i = 0; i < length; i++) {
		id += ID_ALPHABET[randomInt(ID_ALPHABET.length)]
	}
	return id
}

function get_entity_id(value: unknown): string | undefined {
	if (!value || typeof value !== 'object') return undefined
	const record = value as { _id?: unknown; id?: unknown }
	if (typeof record._id === 'string' && record._id) return record._id
	if (typeof record.id === 'string' && record.id) return record.id
	return undefined
}

function get_fields_array(data: unknown): Record<string, unknown>[] {
	if (Array.isArray(data)) {
		return data.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
	}

	if (data && typeof data === 'object' && Array.isArray((data as { fields?: unknown[] }).fields)) {
		return (data as { fields: unknown[] }).fields
			.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
	}

	return []
}

function get_sections_array(data: unknown): Record<string, unknown>[] {
	if (!Array.isArray(data)) {
		return []
	}

	return data.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
}

function collect_field_ids(fields: Record<string, unknown>[], visit: (field_id: string) => void) {
	for (const field of fields) {
		const field_id = get_entity_id(field)
		if (field_id) {
			visit(field_id)
		}

		if (Array.isArray(field.subfields)) {
			const subfields = field.subfields.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
			collect_field_ids(subfields, visit)
		}
	}
}

function track_duplicate(
	duplicates: Map<IDCategory, Map<string, DuplicateOccurrence[]>>,
	category: IDCategory,
	id: string,
	occurrence: DuplicateOccurrence
) {
	let by_id = duplicates.get(category)
	if (!by_id) {
		by_id = new Map<string, DuplicateOccurrence[]>()
		duplicates.set(category, by_id)
	}

	const existing = by_id.get(id) ?? []
	existing.push(occurrence)
	by_id.set(id, existing)
}

async function mark_written_file(file_path: string) {
	synced_files.set(file_path, Date.now())
	try {
		const stat = await fs.stat(file_path)
		synced_files.set(file_path, stat.mtimeMs)
	} catch {
		// Ignore files that disappeared
	}
}

function mark_deleted_path(file_path: string) {
	synced_deleted_paths.set(file_path, Date.now())
}

function should_skip_synced_delete(file_path: string): boolean {
	const deleted_at = synced_deleted_paths.get(file_path)
	if (!deleted_at) {
		return false
	}

	if (Date.now() - deleted_at < 10_000) {
		synced_deleted_paths.delete(file_path)
		return true
	}

	synced_deleted_paths.delete(file_path)
	return false
}

async function mark_deleted_tree(root_path: string): Promise<void> {
	mark_deleted_path(root_path)

	let entries
	try {
		entries = await fs.readdir(root_path, { withFileTypes: true })
	} catch {
		return
	}

	for (const entry of entries) {
		await mark_deleted_tree(path.join(root_path, entry.name))
	}
}

async function remove_tracked_path(target_path: string): Promise<void> {
	await mark_deleted_tree(target_path)
	await fs.rm(target_path, { recursive: true, force: true })
}

async function path_exists(target_path: string): Promise<boolean> {
	try {
		await fs.stat(target_path)
		return true
	} catch {
		return false
	}
}

async function find_page_files(dir: string, relative_dir = 'pages'): Promise<string[]> {
	const files: string[] = []

	let entries
	try {
		entries = await fs.readdir(dir, { withFileTypes: true })
	} catch {
		return files
	}

	for (const entry of entries) {
		if (entry.name.startsWith('.')) continue

		const full_path = path.join(dir, entry.name)
		const relative_path = `${relative_dir}/${entry.name}`

		if (entry.isDirectory()) {
			files.push(...await find_page_files(full_path, relative_path))
			continue
		}

		if (entry.name.endsWith('.yaml')) {
			files.push(relative_path)
		}
	}

	return files
}

function to_posix_path(file_path: string): string {
	return file_path.split(path.sep).join('/')
}

function is_excluded_path(relative_path: string, excluded_paths: Set<string>): boolean {
	const normalized = to_posix_path(relative_path)

	for (const excluded of excluded_paths) {
		if (normalized === excluded || normalized.startsWith(`${excluded}/`)) {
			return true
		}
	}

	return false
}

async function add_directory_to_archive(
	archive: archiver.Archiver,
	full_dir: string,
	archive_dir: string,
	excluded_paths: Set<string>
) {
	let entries
	try {
		entries = await fs.readdir(full_dir, { withFileTypes: true })
	} catch {
		return
	}

	for (const entry of entries) {
		const full_path = path.join(full_dir, entry.name)
		const archive_path = archive_dir ? `${archive_dir}/${entry.name}` : entry.name

		if (is_excluded_path(archive_path, excluded_paths)) {
			continue
		}

		if (entry.isDirectory()) {
			await add_directory_to_archive(archive, full_path, archive_path, excluded_paths)
		} else if (entry.isFile()) {
			archive.file(full_path, { name: archive_path })
		}
	}
}

function describe_duplicate(category: IDCategory, id: string, occurrences: DuplicateOccurrence[]): string {
	const files = [...new Set(occurrences.map((occurrence) => occurrence.file))].sort()

	switch (category) {
		case 'pages':
			return `duplicate page _id "${id}" in ${files.join(' and ')}; skipping those pages`
		case 'page_sections':
			return `duplicate section _id "${id}" in ${files.join(' and ')}; skipping those pages`
		case 'blocks':
			return `duplicate block _id "${id}" in ${files.join(' and ')}; skipping those blocks`
		case 'page_types':
			return `duplicate page type id "${id}" in ${files.join(' and ')}; skipping those page types`
		case 'site_fields':
			return `duplicate site field _id "${id}" in ${files.join(' and ')}; skipping site/fields.yaml`
		case 'block_fields':
			return `duplicate block field _id "${id}" in ${files.join(' and ')}; skipping those blocks`
		case 'page_type_fields':
			return `duplicate page type field _id "${id}" in ${files.join(' and ')}; skipping those page types`
	}
}

async function prepare_site_for_local_dev(site_dir: string): Promise<LocalDevPreparation> {
	const excluded_paths = new Set<string>()
	const warnings: string[] = []
	const duplicates = new Map<IDCategory, Map<string, DuplicateOccurrence[]>>()

	const track_occurrence = (category: IDCategory, id: string, owner: string, file: string) => {
		track_duplicate(duplicates, category, id, { owner, file })
	}

	const pages_dir = path.join(site_dir, 'pages')
	for (const relative_path of await find_page_files(pages_dir)) {
		const full_path = path.join(site_dir, relative_path)
		const raw = await fs.readFile(full_path, 'utf-8')
		const page = load_yaml(raw) as Record<string, unknown> | undefined
		if (!page || typeof page !== 'object' || Array.isArray(page)) continue

		const page_id = get_entity_id(page)
		const page_sections = get_sections_array(page.sections)

		if (page_id) {
			track_occurrence('pages', page_id, relative_path, relative_path)
		}
		for (const section of page_sections) {
			const section_id = get_entity_id(section)
			if (section_id) {
				track_occurrence('page_sections', section_id, relative_path, relative_path)
			}
		}
	}

	const blocks_dir = path.join(site_dir, 'blocks')
	try {
		const block_names = await fs.readdir(blocks_dir)
		for (const block_name of block_names) {
			if (block_name.startsWith('.')) continue

			const relative_fields_path = `blocks/${block_name}/fields.yaml`
			const fields_path = path.join(site_dir, relative_fields_path)
			let raw: string
			try {
				raw = await fs.readFile(fields_path, 'utf-8')
			} catch {
				continue
			}

			const block_data = load_yaml(raw) as Record<string, unknown> | undefined
			if (!block_data || typeof block_data !== 'object' || Array.isArray(block_data)) continue

			const block_id = get_entity_id(block_data)
			const block_fields = get_fields_array(block_data.fields)

			const owner = `blocks/${block_name}`
			if (block_id) {
				track_occurrence('blocks', block_id, owner, relative_fields_path)
			}
			collect_field_ids(block_fields, (field_id) => {
				track_occurrence('block_fields', field_id, owner, relative_fields_path)
			})
		}
	} catch {
		// No blocks dir
	}

	const page_types_dir = path.join(site_dir, 'page-types')
	try {
		const page_type_names = await fs.readdir(page_types_dir)
		for (const page_type_name of page_type_names) {
			if (page_type_name.startsWith('.')) continue

			const relative_config_path = `page-types/${page_type_name}/config.yaml`
			const config_path = path.join(site_dir, relative_config_path)
			let raw: string
			try {
				raw = await fs.readFile(config_path, 'utf-8')
			} catch {
				continue
			}

			const config = load_yaml(raw) as Record<string, unknown>
			if (!config || typeof config !== 'object' || Array.isArray(config)) continue

			const page_type_id = get_entity_id(config)
			const page_type_fields = get_fields_array(config.fields)

			const owner = `page-types/${page_type_name}`
			if (page_type_id) {
				track_occurrence('page_types', page_type_id, owner, relative_config_path)
			}
			collect_field_ids(page_type_fields, (field_id) => {
				track_occurrence('page_type_fields', field_id, owner, relative_config_path)
			})
		}
	} catch {
		// No page-types dir
	}

	const site_fields_path = path.join(site_dir, 'site', 'fields.yaml')
	try {
		const raw = await fs.readFile(site_fields_path, 'utf-8')
		const site_fields_data = load_yaml(raw)
		const site_fields = get_fields_array(site_fields_data)
		if (site_fields.length > 0) {
			collect_field_ids(site_fields, (field_id) => {
				track_occurrence('site_fields', field_id, 'site/fields.yaml', 'site/fields.yaml')
			})
		}
	} catch {
		// No site fields file
	}

	for (const [category, by_id] of duplicates) {
		for (const [id, occurrences] of by_id) {
			if (occurrences.length < 2) {
				continue
			}

			for (const occurrence of occurrences) {
				excluded_paths.add(occurrence.owner)
			}

			warnings.push(describe_duplicate(category, id, occurrences))
		}
	}

	return {
		excluded_paths,
		warnings
	}
}

type ImportWarning = {
	kind: string
	file: string
	path: string
	field: string
	block: string
	message: string
}

// Loudly surface non-fatal import problems (e.g. orphaned fields whose
// content would otherwise be silently dropped). Printed in yellow with the
// full details so agents and humans both see exactly what was lost and where.
function print_import_warnings(site_name: string, warnings: unknown): void {
	if (!Array.isArray(warnings) || warnings.length === 0) return
	const list = warnings as ImportWarning[]
	console.log('')
	console.log(chalk.yellow(`  ⚠ ${site_name}: ${list.length} import warning${list.length === 1 ? '' : 's'}`))
	for (const w of list) {
		const msg = w.message || `${w.kind} at ${w.path} in ${w.file}`
		console.log(chalk.yellow(`    • ${msg}`))
	}
	console.log('')
}

async function import_site_files(site_dir: string, api_url: string, config: SiteConfig, port: number, server_config: ServerConfig, use_bootstrap = true): Promise<ImportTimings> {
	const site_name = config.name || 'My Site'
	const site_id = config.site_id
	const site_group = resolve_site_group(config, server_config)

	const preparation = await prepare_site_for_local_dev(site_dir)
	for (const warning of preparation.warnings) {
		console.log(chalk.yellow(`  ⚠ ${config.name}: ${warning}`))
	}

	// Create ZIP of site files
	const zip_started = Date.now()
	const zip_buffer = await create_site_zip(site_dir, preparation.excluded_paths)
	const zip_ms = Date.now() - zip_started

	// Use hostname from config, or generate from folder name
	const folder_name = path.basename(site_dir)
	const host = config.host || (
		folder_name.includes('.')
			? `${folder_name}:${port}`  // Looks like a domain
			: `${folder_name.toLowerCase().replace(/\s+/g, '-')}.localhost:${port}`
	)

	if (!use_bootstrap) {
		const import_form = new FormData()
		import_form.append('file', new Blob([zip_buffer]), 'site.zip')

		const request_started = Date.now()
		const import_response = await fetch_with_timeout(`${api_url}/api/palacms/import/${site_id}`, {
			method: 'POST',
			body: import_form
		}, 300000)
		const request_ms = Date.now() - request_started

		if (!import_response.ok) {
			const import_error = await import_response.text()
			throw new Error(`Import failed (${import_response.status}): ${import_error}`)
		}

		// Write created IDs back to files
		try {
			const result = await import_response.json() as { created_ids?: Record<string, Record<string, unknown>>, warnings?: ImportWarning[] }
			if (result.created_ids) {
				await write_created_ids(site_dir, result.created_ids)
			}
			print_import_warnings(config.name, result.warnings)
		} catch {
			// ignore JSON parse errors
		}

		return {
			zip_ms,
			request_ms,
			mode: 'import'
		}
	}

	// Retry bootstrap up to 3 times (collections may not be ready immediately)
	const max_retries = 3
	for (let attempt = 1; attempt <= max_retries; attempt++) {
		const form_data = new FormData()
		form_data.append('site_id', site_id)
		form_data.append('name', site_name)
		form_data.append('host', host)
		form_data.append('group', site_group.id)
		form_data.append('group_name', site_group.name)
		form_data.append('group_index', String(site_group.index ?? 0))
		form_data.append('server_groups', JSON.stringify(server_config.site_groups ?? [site_group]))
		form_data.append('file', new Blob([zip_buffer]), 'site.zip')

		try {
			const bootstrap_started = Date.now()
			const bootstrap_response = await fetch_with_timeout(`${api_url}/api/palacms/bootstrap`, {
				method: 'POST',
				body: form_data
			}, 300000) // 300s timeout for imports
			const bootstrap_ms = Date.now() - bootstrap_started

			if (bootstrap_response.ok) {
				try {
					const result = await bootstrap_response.json() as { warnings?: ImportWarning[] }
					print_import_warnings(config.name, result.warnings)
				} catch {
					// ignore JSON parse errors
				}
				return {
					zip_ms,
					request_ms: bootstrap_ms,
					mode: 'bootstrap'
				}
			}

			const error_text = await bootstrap_response.text()

			// Check if it's a collection not found error (timing issue)
			if (error_text.includes('collection') && attempt < max_retries) {
				await new Promise(resolve => setTimeout(resolve, 500 * attempt))
				continue
			}

			console.log(chalk.yellow(`  Bootstrap failed (${bootstrap_response.status}): ${error_text}`))

			// Bootstrap failed, try regular import
			const import_form = new FormData()
			import_form.append('file', new Blob([zip_buffer]), 'site.zip')

			const import_started = Date.now()
			const import_response = await fetch_with_timeout(`${api_url}/api/palacms/import/${site_id}`, {
				method: 'POST',
				body: import_form
			}, 300000) // 300s timeout for imports
			const import_ms = Date.now() - import_started

			if (!import_response.ok) {
				const import_error = await import_response.text()
				console.log(chalk.yellow(`  Import failed (${import_response.status}): ${import_error}`))
			} else {
				// Write created IDs back to files
				try {
					const result = await import_response.json() as { created_ids?: Record<string, Record<string, unknown>>, warnings?: ImportWarning[] }
					if (result.created_ids) {
						await write_created_ids(site_dir, result.created_ids)
					}
					print_import_warnings(config.name, result.warnings)
				} catch {
					// ignore JSON parse errors
				}
			}
			return {
				zip_ms,
				request_ms: bootstrap_ms + import_ms,
				mode: 'bootstrap+import'
			}
		} catch (err) {
			if (attempt < max_retries) {
				await new Promise(resolve => setTimeout(resolve, 500 * attempt))
				continue
			}
			if (err instanceof Error && err.name === 'AbortError') {
				throw new Error(`Timed out importing ${config.name}. If the local .primo data is stale, delete .primo and rerun primo dev.`)
			}
			throw err instanceof Error ? err : new Error(String(err))
		}
	}

	throw new Error(`Import failed for ${config.name}`)
}

async function import_library_files(base_dir: string, api_url: string, delete_group_ids: string[] = [], delete_symbol_ids: string[] = []): Promise<Pick<ImportTimings, 'zip_ms' | 'request_ms'>> {
	const library_dir = path.join(base_dir, LIBRARY_DIR)

	try {
		const stat = await fs.stat(library_dir)
		if (!stat.isDirectory()) return { zip_ms: 0, request_ms: 0 }
	} catch {
		return { zip_ms: 0, request_ms: 0 }
	}

	const has_deletes = delete_group_ids.length > 0 || delete_symbol_ids.length > 0

	// If the library is empty AND there are no explicit deletes, skip the
	// push entirely. This preserves the old behavior of not wiping the CMS
	// on accidental-empty-dir. Deletes are allowed through even on an empty
	// tree so a user can intentionally clear the library.
	if (!await has_library_content(library_dir) && !has_deletes) {
		return { zip_ms: 0, request_ms: 0 }
	}

	const zip_started = Date.now()
	const zip_buffer = await create_library_zip(base_dir)
	const zip_ms = Date.now() - zip_started
	const form_data = new FormData()
	form_data.append('file', new Blob([zip_buffer]), 'library.zip')
	if (has_deletes) {
		form_data.append('deletes', JSON.stringify({
			group_ids: delete_group_ids,
			symbol_ids: delete_symbol_ids
		}))
	}

	const request_started = Date.now()
	const response = await fetch_with_timeout(`${api_url}/api/palacms/import-library`, {
		method: 'POST',
		body: form_data
	}, 120000)
	const request_ms = Date.now() - request_started

	if (response.status === 404) {
		throw new Error('Shared library sync is not supported by the current palacms binary/server. Rebuild or update palacms to use library sync.')
	}

	if (!response.ok) {
		const error_text = await response.text()
		throw new Error(error_text)
	}

	return { zip_ms, request_ms }
}

// Returns a map of posix-style relative paths (under library_path) to the
// underlying record ID for every group folder and block folder currently on
// disk. Group IDs come from library/groups.yaml, block IDs from the block's
// fields.yaml. Missing IDs are null (new blocks that have never been pushed).
async function scan_library_folders(library_path: string): Promise<LibrarySnapshot> {
	const result: LibrarySnapshot = new Map()

	// Load group ID mapping from groups.yaml
	const group_ids: Record<string, string> = {}
	try {
		const raw = await fs.readFile(path.join(library_path, 'groups.yaml'), 'utf-8')
		const parsed = load_yaml(raw)
		if (Array.isArray(parsed)) {
			for (const entry of parsed) {
				if (entry && typeof entry === 'object' && entry.folder && entry.id) {
					group_ids[String(entry.folder)] = String(entry.id)
				}
			}
		}
	} catch {
		// no groups.yaml, leave group_ids empty
	}

	let groups: import('fs').Dirent[]
	try {
		groups = await fs.readdir(library_path, { withFileTypes: true })
	} catch {
		return result
	}
	for (const group of groups) {
		if (!group.isDirectory() || group.name.startsWith('.')) continue
		const group_rel = group.name
		result.set(group_rel, { kind: 'group', id: group_ids[group_rel] ?? null })
		const group_dir = path.join(library_path, group.name)
		let blocks: import('fs').Dirent[]
		try {
			blocks = await fs.readdir(group_dir, { withFileTypes: true })
		} catch {
			continue
		}
		for (const block of blocks) {
			if (!block.isDirectory() || block.name.startsWith('.')) continue
			const block_dir = path.join(group_dir, block.name)
			let has_block_file = false
			let block_id: string | null = null
			try {
				const files = await fs.readdir(block_dir)
				has_block_file = files.some(f => f === 'component.svelte' || f === 'fields.yaml' || f === 'content.yaml')
				if (files.includes('fields.yaml')) {
					try {
						const raw = await fs.readFile(path.join(block_dir, 'fields.yaml'), 'utf-8')
						const parsed = load_yaml(raw)
						if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
							const rec = parsed as Record<string, unknown>
							if (typeof rec._id === 'string' && rec._id) block_id = rec._id
							else if (typeof rec.id === 'string' && rec.id) block_id = rec.id as string
						}
					} catch {
						// ignore
					}
				}
			} catch {
				// ignore
			}
			if (has_block_file) {
				result.set(`${group_rel}/${block.name}`, { kind: 'block', id: block_id })
			}
		}
	}
	return result
}

async function create_library_zip(base_dir: string): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const archive = archiver('zip', { zlib: { level: LOCAL_ZIP_COMPRESSION_LEVEL } })
		const chunks: Buffer[] = []

		archive.on('data', chunk => chunks.push(chunk))
		archive.on('end', () => resolve(Buffer.concat(chunks)))
		archive.on('error', reject)

		archive.directory(path.join(base_dir, LIBRARY_DIR), LIBRARY_DIR)
		archive.finalize()
	})
}

async function create_site_zip(dir: string, excluded_paths: Set<string> = new Set()): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const archive = archiver('zip', { zlib: { level: LOCAL_ZIP_COMPRESSION_LEVEL } })
		const chunks: Buffer[] = []

		archive.on('data', chunk => chunks.push(chunk))
		archive.on('end', () => resolve(Buffer.concat(chunks)))
		archive.on('error', reject)

		void (async () => {
			try {
				const dirs_to_include = ['blocks', 'page-types', 'pages', 'site', 'uploads']
				for (const subdir of dirs_to_include) {
					const full_path = path.join(dir, subdir)
					await add_directory_to_archive(archive, full_path, subdir, excluded_paths)
				}

				const site_json = path.join(dir, SITE_CONFIG_FILE)
				if (!is_excluded_path(SITE_CONFIG_FILE, excluded_paths)) {
					archive.file(site_json, { name: SITE_CONFIG_FILE })
				}

				await archive.finalize()
			} catch (error) {
				reject(error)
			}
		})()
	})
}

async function sync_from_cms(site_dir: string, api_url: string, config: SiteConfig): Promise<void> {
	const response = await fetch_with_timeout(`${api_url}/api/palacms/export/${config.site_id}`, {}, 15000)
	if (!response.ok) return

	const zip_data = await response.arrayBuffer()

	// Extract to temp directory
	const temp_dir = path.join(site_dir, '.primo', 'sync-temp')
	const temp_zip = path.join(temp_dir, 'export.zip')

	await fs.mkdir(temp_dir, { recursive: true })
	await fs.writeFile(temp_zip, Buffer.from(zip_data))
	await extract(temp_zip, { dir: temp_dir })
	await fs.unlink(temp_zip)

	// Compare and sync files
	const dirs_to_sync = ['blocks', 'page-types', 'pages', 'site']
	const changed_files: string[] = []

	for (const dir of dirs_to_sync) {
		const temp_path = path.join(temp_dir, dir)
		const local_path = path.join(site_dir, dir)

		if (await path_exists(temp_path)) {
			const files = await sync_directory(temp_path, local_path, dir)
			changed_files.push(...files)
		} else if (await path_exists(local_path)) {
			await remove_tracked_path(local_path)
			changed_files.push(dir)
		}
	}

	// Clean up temp directory
	await fs.rm(temp_dir, { recursive: true, force: true })

	if (changed_files.length > 0) {
		for (const file of changed_files) {
			console.log(chalk.blue(`  ↓ ${config.name}: ${file}`))
		}
	}
}

async function sync_library_from_cms(base_dir: string, api_url: string): Promise<void> {
	const response = await fetch_with_timeout(`${api_url}/api/palacms/export-library`, {}, 15000)
	if (response.status === 404) {
		throw new Error('Shared library sync is not supported by the current palacms binary/server. Rebuild or update palacms to use library sync.')
	}
	if (!response.ok) return

	const zip_data = await response.arrayBuffer()
	const temp_dir = path.join(base_dir, '.primo', 'library-sync-temp')
	const temp_zip = path.join(temp_dir, 'library.zip')

	await fs.mkdir(temp_dir, { recursive: true })
	await fs.writeFile(temp_zip, Buffer.from(zip_data))
	await extract(temp_zip, { dir: temp_dir })
	await fs.unlink(temp_zip)

	const temp_library_path = path.join(temp_dir, LIBRARY_DIR)
	const local_library_path = path.join(base_dir, LIBRARY_DIR)
	let changed_files: string[] = []
	if (await path_exists(temp_library_path)) {
		changed_files = await sync_directory(temp_library_path, local_library_path, LIBRARY_DIR)
	} else if (await path_exists(local_library_path)) {
		await remove_tracked_path(local_library_path)
		changed_files = [LIBRARY_DIR]
	}

	await fs.rm(temp_dir, { recursive: true, force: true })

	if (changed_files.length > 0) {
		for (const file of changed_files) {
			console.log(chalk.blue(`  ↓ library: ${file}`))
		}
	}
}

async function sync_directory(src: string, dest: string, relative_path: string = ''): Promise<string[]> {
	const changed_files: string[] = []
	const entries = await fs.readdir(src, { withFileTypes: true })
	const source_names = new Set(entries.map(entry => entry.name))

	await fs.mkdir(dest, { recursive: true })

	for (const entry of entries) {
		const src_path = path.join(src, entry.name)
		const dest_path = path.join(dest, entry.name)
		const file_relative = relative_path ? `${relative_path}/${entry.name}` : entry.name

		if (entry.isDirectory()) {
			const nested = await sync_directory(src_path, dest_path, file_relative)
			changed_files.push(...nested)
		} else {
			const src_content = await fs.readFile(src_path, 'utf-8')

			let dest_content = ''
			try {
				dest_content = await fs.readFile(dest_path, 'utf-8')
			} catch {
				// File doesn't exist locally
			}

			// Normalize to handle trailing newline/whitespace differences
			if (src_content.trim() !== dest_content.trim()) {
				// Track this file BEFORE writing to avoid race with watcher
				// Use current time as estimate, watcher allows 1 second tolerance
				synced_files.set(dest_path, Date.now())
				await fs.writeFile(dest_path, src_content)
				// Update with actual mtime after write
				const stat = await fs.stat(dest_path)
				synced_files.set(dest_path, stat.mtimeMs)
				changed_files.push(file_relative)
			}
		}
	}

	const dest_entries = await fs.readdir(dest, { withFileTypes: true })
	for (const entry of dest_entries) {
		if (source_names.has(entry.name)) {
			continue
		}

		const dest_path = path.join(dest, entry.name)
		const file_relative = relative_path ? `${relative_path}/${entry.name}` : entry.name
		await remove_tracked_path(dest_path)
		changed_files.push(file_relative)
	}

	return changed_files
}

async function has_library_content(library_dir: string): Promise<boolean> {
	const entries = await fs.readdir(library_dir, { withFileTypes: true })

	for (const entry of entries) {
		if (entry.name.startsWith('.')) {
			continue
		}
		return true
	}

	return false
}

async function write_created_ids(site_dir: string, created_ids: Record<string, Record<string, unknown>>): Promise<void> {
	for (const [relative_path, id_data] of Object.entries(created_ids)) {
		if (!id_data._id) continue

		const file_path = path.join(site_dir, relative_path)
		try {
			const content = await fs.readFile(file_path, 'utf-8')
			const data = load_yaml(content) as Record<string, unknown>
			if (data && !data._id) {
				const updated = { _id: id_data._id, ...data }
				await fs.writeFile(file_path, dump_yaml(updated, { lineWidth: -1 }), 'utf-8')
				await mark_written_file(file_path)
			}
		} catch {
			// skip if file doesn't exist or can't be read
		}
	}
}
