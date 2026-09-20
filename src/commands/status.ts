import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import { read_site_config, SITE_CONFIG_FILE } from '../utils/site-config.js'
import { read_server_config, SERVER_CONFIG_FILE } from '../utils/server-config.js'

interface StatusOptions {
	dir: string
	json?: boolean
}

interface SiteSync {
	ok: boolean
	error?: string
	failed_at?: string
	warnings?: number
	warned_at?: string
	last_import_at?: string
}

interface SiteStatus {
	slug: string
	name: string | null
	site_id: string | null
	group: string | null
	sync: SiteSync | null
}

/**
 * Report the local workspace without needing the CMS API (which is
 * auth-gated): server liveness comes from a health probe, and everything else
 * is read from the files an agent can already see — `server.yaml`,
 * `sites/<slug>/site.yaml`, and each site's `.primo/sync_status.json`.
 */
export async function status(options: StatusOptions) {
	const base_dir = path.resolve(options.dir)
	const as_json = !!options.json

	try {
		await fs.access(path.join(base_dir, SERVER_CONFIG_FILE))
	} catch {
		const message = "No " + SERVER_CONFIG_FILE + " found in " + base_dir + ". Run 'primo status' from a workspace root, or pass --dir <workspace>."
		if (as_json) {
			console.log(JSON.stringify({ error: message }, null, 2))
		} else {
			console.log(chalk.red(message))
		}
		process.exitCode = 1
		return
	}

	const server_config = await read_server_config(base_dir)
	const port = server_config.port ?? 3000
	const running = await is_server_running(port)
	const sites = await read_sites(base_dir)

	if (as_json) {
		console.log(JSON.stringify({
			workspace: base_dir,
			port,
			running,
			groups: server_config.site_groups ?? [],
			sites
		}, null, 2))
		return
	}

	console.log(chalk.bold('\nPrimo workspace'))
	console.log(`  ${chalk.dim('path')}    ${base_dir}`)
	console.log(`  ${chalk.dim('server')}  ${running ? chalk.green(`running on port ${port}`) : chalk.yellow(`not running (port ${port})`)}`)
	console.log(`  ${chalk.dim('groups')}  ${(server_config.site_groups ?? []).length}`)
	console.log(`  ${chalk.dim('sites')}   ${sites.length}`)

	const failed = sites.filter((site) => site.sync && !site.sync.ok)
	if (failed.length > 0) {
		console.log('')
		console.log(chalk.red(`  ${failed.length} site${failed.length === 1 ? '' : 's'} with a failed last import:`))
		for (const site of failed) {
			console.log(`    ${chalk.red('✖')} ${site.slug}  ${chalk.dim(site.sync?.error ?? 'last import failed')}`)
		}
	}
	console.log('')
}

async function read_sites(base_dir: string): Promise<SiteStatus[]> {
	const sites_dir = path.join(base_dir, 'sites')
	let entries: string[]
	try {
		entries = await fs.readdir(sites_dir)
	} catch {
		return []
	}

	const sites: SiteStatus[] = []
	for (const slug of entries.sort()) {
		if (slug.startsWith('.')) continue

		const site_dir = path.join(sites_dir, slug)
		const dir_stat = await fs.stat(site_dir).catch(() => null)
		if (!dir_stat?.isDirectory()) continue

		// A folder only counts as a site once it has a site.yaml.
		const has_config = await fs.access(path.join(site_dir, SITE_CONFIG_FILE)).then(() => true).catch(() => false)
		if (!has_config) continue

		let config: Record<string, unknown> | null = null
		try {
			config = (await read_site_config(site_dir)) as unknown as Record<string, unknown> | null
		} catch {
			// Malformed site.yaml — still report the folder, with nulls.
		}

		const str = (value: unknown) => (typeof value === 'string' && value.trim() ? value : null)
		sites.push({
			slug,
			name: str(config?.name),
			site_id: str(config?.site_id),
			group: str(config?.group),
			sync: await read_sync(site_dir)
		})
	}

	return sites
}

async function read_sync(site_dir: string): Promise<SiteSync | null> {
	try {
		const raw = await fs.readFile(path.join(site_dir, '.primo', 'sync_status.json'), 'utf-8')
		const parsed = JSON.parse(raw) as Record<string, unknown>
		const sync: SiteSync = { ok: parsed.ok === true }
		if (typeof parsed.error === 'string') sync.error = parsed.error
		if (typeof parsed.failed_at === 'string') sync.failed_at = parsed.failed_at
		if (typeof parsed.warnings === 'number') sync.warnings = parsed.warnings
		if (typeof parsed.warned_at === 'string') sync.warned_at = parsed.warned_at
		if (typeof parsed.last_import_at === 'string') sync.last_import_at = parsed.last_import_at
		return sync
	} catch {
		return null
	}
}

async function is_server_running(port: number): Promise<boolean> {
	try {
		const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
			signal: AbortSignal.timeout(1500)
		})
		return response.ok
	} catch {
		return false
	}
}
