import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import ora, { type Ora } from 'ora'
import extract from 'extract-zip'
import { dump as dump_yaml, load as load_yaml } from 'js-yaml'
import { get_auth_token } from '../utils/auth.js'
import { write_site_config } from '../utils/site-config.js'
import { write_server_config, type SiteGroupConfig } from '../utils/server-config.js'

interface PullOptions {
	server?: string
	output: string
	token?: string
}

async function detect_server(): Promise<string | null> {
	const ports = [3000, 8080, 5173]

	for (const port of ports) {
		try {
			const url = `http://127.0.0.1:${port}`
			const response = await fetch(`${url}/api/health`, {
				signal: AbortSignal.timeout(500)
			})
			if (response.ok) {
				return url
			}
		} catch {
			// Not running on this port
		}
	}

	return null
}

interface Site {
	id: string
	name: string
	host: string
	group: string
}

interface SiteGroup {
	id: string
	name: string
	index?: number
}

function slugify(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'site'
}

function server_folder_name(server: string): string {
	try {
		return new URL(server).hostname || 'primo-server'
	} catch {
		return 'primo-server'
	}
}

export async function pull_site(options: PullOptions) {
	const spinner = ora('Connecting...').start()

	try {
		// Resolve server (flag > local detect)
		let server: string
		if (options.server) {
			server = options.server.replace(/\/+$/, '')
		} else {
			spinner.text = 'Looking for local server...'
			const detected = await detect_server()
			server = (detected || 'http://localhost:3000').replace(/\/+$/, '')
			spinner.text = `Using ${server}`
		}

		// Auth (optional for local)
		const token = options.token || await get_auth_token(server)
		const headers: Record<string, string> = {}
		if (token) {
			headers['Authorization'] = `Bearer ${token}`
		}

		// Decide root dir: if --output is default ('.'), nest under server hostname.
		// Otherwise use --output verbatim.
		const root_dir = options.output === '.'
			? path.resolve(server_folder_name(server))
			: path.resolve(options.output)
		await fs.mkdir(root_dir, { recursive: true })

		// List all sites
		spinner.text = 'Fetching sites...'
		const sites_response = await fetch(`${server}/api/collections/sites/records?perPage=200`, {
			headers
		})

		if (!sites_response.ok) {
			spinner.fail(`Failed to fetch sites (${sites_response.status})`)
			process.exit(1)
		}

		const sites_data = await sites_response.json() as { items: Site[] }
		const sites = sites_data.items || []

		if (sites.length === 0) {
			if (!token) {
				spinner.fail(`Not authenticated. Run \`primo login ${server}\` first.`)
			} else {
				spinner.fail('No sites visible — your token may be expired. Try `primo login` again.')
			}
			process.exit(1)
		}

		// Pull library (best-effort — older servers may not support it)
		const library_pulled = await pull_library_into(server, headers, root_dir, spinner)

		// Pull each site into sites/<slug>/
		const sites_root = path.join(root_dir, 'sites')
		await fs.mkdir(sites_root, { recursive: true })
		const used_slugs = new Set<string>()
		const pulled_sites: Array<{ slug: string; site: Site }> = []
		for (const site of sites) {
			const base_slug = slugify(site.name || site.host || site.id)
			let slug = base_slug
			let n = 2
			while (used_slugs.has(slug)) {
				slug = `${base_slug}-${n++}`
			}
			used_slugs.add(slug)

			const site_dir = path.join(sites_root, slug)
			spinner.start(`Pulling ${chalk.cyan(site.name)}...`)
			await pull_one_site(server, headers, site, site_dir, spinner)
			pulled_sites.push({ slug, site })
		}

		// Fetch site groups so server.yaml has them
		const site_groups = await fetch_site_groups(server, headers)

		// Write minimal server.yaml so MCP registration + dev work at the root
		await write_server_config(root_dir, {
			port: 3000,
			site_groups: site_groups.length > 0 ? site_groups : undefined
		})

		spinner.succeed(`Server pulled to ${chalk.cyan(root_dir)}`)
		console.log('')
		console.log(chalk.dim('  Sites:'))
		for (const { slug, site } of pulled_sites) {
			console.log(chalk.dim(`    sites/${slug}/  ${chalk.dim(`(${site.name})`)}`))
		}
		if (library_pulled) {
			console.log(chalk.dim('    library/'))
		}
		console.log(chalk.dim(`    server.yaml`))
		console.log('')
		console.log(chalk.green('  Ready for local development!'))
		console.log(chalk.dim(`  cd ${path.relative(process.cwd(), root_dir) || '.'} && primo dev`))

	} catch (error) {
		spinner.fail(`Pull failed: ${error instanceof Error ? error.message : error}`)
		process.exit(1)
	}
}

async function pull_one_site(
	server: string,
	headers: Record<string, string>,
	site: Site,
	site_dir: string,
	spinner: Ora
) {
	await fs.mkdir(site_dir, { recursive: true })

	spinner.text = `Exporting ${site.name}...`
	const response = await fetch(`${server}/api/palacms/export/${site.id}`, { headers })
	if (!response.ok) {
		const error = await response.text()
		throw new Error(`Export failed for ${site.name}: ${error}`)
	}

	const zip_data = await response.arrayBuffer()
	const temp_zip = path.join(site_dir, '.primo-export.zip')
	await fs.writeFile(temp_zip, Buffer.from(zip_data))

	spinner.text = `Extracting ${site.name}...`
	await extract(temp_zip, { dir: site_dir })
	await fs.unlink(temp_zip)

	await write_site_config(site_dir, {
		name: site.name || 'Imported Site',
		host: site.host || '',
		site_id: site.id,
		server,
		group: site.group
	})

	await copy_schemas(site_dir)
	await add_schema_references(site_dir)
}

async function pull_library_into(
	server: string,
	headers: Record<string, string>,
	root_dir: string,
	spinner: Ora
): Promise<boolean> {
	spinner.start('Pulling library...')
	const response = await fetch(`${server}/api/palacms/export-library`, { headers })
	if (response.status === 404) {
		spinner.warn('Library export not supported by this server — skipping')
		return false
	}
	if (!response.ok) {
		spinner.warn(`Library export failed (${response.status}) — skipping`)
		return false
	}

	const zip_data = await response.arrayBuffer()
	const temp_zip = path.join(root_dir, '.primo-library-export.zip')
	await fs.writeFile(temp_zip, Buffer.from(zip_data))
	await extract(temp_zip, { dir: root_dir })
	await fs.unlink(temp_zip)
	return true
}

async function fetch_site_groups(
	server: string,
	headers: Record<string, string>
): Promise<SiteGroupConfig[]> {
	try {
		const response = await fetch(`${server}/api/collections/site_groups/records?perPage=200`, {
			headers
		})
		if (!response.ok) return []
		const data = await response.json() as { items: SiteGroup[] }
		const items = data.items || []
		return items.map((g, i) => ({
			id: g.id,
			name: g.name || g.id,
			index: typeof g.index === 'number' ? g.index : i
		}))
	} catch {
		return []
	}
}

async function copy_schemas(output_dir: string) {
	const current_file = new URL(import.meta.url).pathname
	const dist_dir = path.dirname(path.dirname(current_file))
	const project_root = path.dirname(dist_dir)
	const schemas_src = path.join(project_root, 'schemas')
	const schemas_dest = path.join(output_dir, '.schemas')

	let schema_files: string[]
	try {
		schema_files = await fs.readdir(schemas_src)
	} catch {
		// Schemas not bundled with this CLI install — skip silently
		return
	}

	await fs.mkdir(schemas_dest, { recursive: true })

	for (const file of schema_files) {
		if (file.endsWith('.json')) {
			await fs.copyFile(
				path.join(schemas_src, file),
				path.join(schemas_dest, file)
			)
		}
	}
}

async function add_schema_references(output_dir: string) {
	await stamp_schema_on_dir_configs(
		path.join(output_dir, 'page-types'),
		'config.yaml',
		'../../.schemas/page-type-config.schema.json'
	)
	await stamp_schema_on_dir_configs(
		path.join(output_dir, 'blocks'),
		'config.yaml',
		'../../.schemas/block-config.schema.json'
	)
}

async function stamp_schema_on_dir_configs(parent_dir: string, file_name: string, schema_ref: string) {
	try {
		const entries = await fs.readdir(parent_dir, { withFileTypes: true })
		for (const entry of entries) {
			if (!entry.isDirectory()) continue
			const config_path = path.join(parent_dir, entry.name, file_name)
			try {
				const config = load_yaml(await fs.readFile(config_path, 'utf-8'))
				if (!config || typeof config !== 'object' || Array.isArray(config)) continue
				const with_schema = {
					$schema: schema_ref,
					...(config as Record<string, unknown>)
				}
				await fs.writeFile(config_path, dump_yaml(with_schema, { lineWidth: -1, noRefs: true }))
			} catch {}
		}
	} catch {}
}
