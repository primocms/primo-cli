import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import ora, { type Ora } from 'ora'
import archiver from 'archiver'
import { get_auth_token } from '../utils/auth.js'
import { read_site_config, get_site_config_path, type SiteConfig, SITE_CONFIG_FILE } from '../utils/site-config.js'
import { get_server_config_path } from '../utils/server-config.js'

interface PushOptions {
	server?: string
	site?: string
	dir: string
	token?: string
	preview?: boolean
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

	// Server-folder mode: walk site subfolders + push library
	if (!has_site_yaml && has_server_yaml) {
		await push_server(root_dir, options)
		return
	}

	// Single-site mode (cwd is a site folder, or --dir points at one)
	const spinner = ora('Reading local files...').start()
	try {
		await push_single_site(root_dir, options, spinner)
	} catch (error) {
		spinner.fail(`Push failed: ${error instanceof Error ? error.message : error}`)
		process.exit(1)
	}
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

	// Push each site
	for (const site_dir of site_dirs) {
		const spinner = ora(`Pushing ${chalk.cyan(path.basename(site_dir))}...`).start()
		try {
			await push_single_site(site_dir, { ...options, dir: site_dir }, spinner)
		} catch (error) {
			spinner.fail(`${path.basename(site_dir)}: ${error instanceof Error ? error.message : error}`)
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
		}
	}
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
	if (!token) {
		throw new Error('Authentication required. Use --token or run `primo login` first.')
	}

	spinner.text = 'Packaging files...'
	const zip_buffer = await create_zip(site_dir)

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
