import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import extract from 'extract-zip'
import inquirer from 'inquirer'
import { dump as dump_yaml, load as load_yaml } from 'js-yaml'
import { get_auth_token } from '../utils/auth.js'
import { write_site_config } from '../utils/site-config.js'

interface PullOptions {
	server?: string
	site?: string
	output: string
	token?: string
}

async function detect_server(): Promise<string | null> {
	// Check common local ports
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

export async function pull_site(options: PullOptions) {
	const spinner = ora('Connecting...').start()

	try {
		// Detect or use provided server
		let server: string
		if (options.server) {
			server = options.server
		} else {
			spinner.text = 'Looking for local server...'
			const detected = await detect_server()
			// Default to localhost:3000 if no server detected
			server = detected || 'http://localhost:3000'
			spinner.text = `Using ${server}`
		}

		// Get auth token (may not be needed for local)
		const token = options.token || await get_auth_token(server)
		// Local servers may not require auth
		const headers: Record<string, string> = {}
		if (token) {
			headers['Authorization'] = `Bearer ${token}`
		}

		let site_id = options.site
		let site_host: string | undefined
		let site_name: string | undefined
		let site_group: string | undefined

		// If no site specified, show interactive selection
		if (!site_id) {
			spinner.text = 'Fetching sites...'
			const sites_response = await fetch(`${server}/api/collections/sites/records`, {
				headers
			})

			if (!sites_response.ok) {
				spinner.fail('Failed to fetch sites')
				process.exit(1)
			}

			const sites_data = await sites_response.json() as { items: Site[] }
			const sites = sites_data.items || []

			if (sites.length === 0) {
				spinner.fail('No sites found on this server')
				process.exit(1)
			}

			spinner.stop()

			const { selected_site } = await inquirer.prompt([{
				type: 'list',
				name: 'selected_site',
				message: 'Select a site to pull:',
				choices: sites.map(site => ({
					name: `${site.name} ${chalk.dim(`(${site.host})`)}`,
					value: site
				}))
			}])

			site_id = selected_site.id
			site_name = selected_site.name
			site_host = selected_site.host
			site_group = selected_site.group

			spinner.start('Exporting site...')
		} else {
			// Fetch site info to get hostname for folder name
			spinner.text = 'Fetching site info...'
			const site_response = await fetch(`${server}/api/collections/sites/records/${site_id}`, {
				headers
			})

			if (site_response.ok) {
				const site_data = await site_response.json() as Site
				site_name = site_data.name
				site_host = site_data.host
				site_group = site_data.group
			}
		}

		let output_dir = path.resolve(options.output)

		// If output is default (.), use hostname as folder name
		if (options.output === '.' && site_host) {
			const hostname = site_host.split(':')[0]
			if (hostname && hostname !== 'localhost') {
				output_dir = path.resolve(hostname)
			}
		}

		await fs.mkdir(output_dir, { recursive: true })

		// Fetch the export
		spinner.text = 'Exporting site...'
		const response = await fetch(`${server}/api/palacms/export/${site_id}`, {
			headers
		})

		if (!response.ok) {
			const error = await response.text()
			spinner.fail(`Export failed: ${error}`)
			process.exit(1)
		}

		// Save ZIP temporarily
		const zip_data = await response.arrayBuffer()
		const temp_zip = path.join(output_dir, '.primo-export.zip')
		await fs.writeFile(temp_zip, Buffer.from(zip_data))

		// Extract ZIP
		spinner.text = 'Extracting files...'
		await extract(temp_zip, { dir: output_dir })

		// Clean up temp ZIP
		await fs.unlink(temp_zip)

		await write_site_config(output_dir, {
			name: site_name || 'Imported Site',
			host: site_host || '',
			site_id: site_id!,
			server,
			group: site_group
		})

		// Copy JSON schemas
		spinner.text = 'Adding JSON schemas...'
		await copy_schemas(output_dir)

		// Add $schema references
		await add_schema_references(output_dir)

		spinner.succeed(`Site exported to ${chalk.cyan(output_dir)}`)

		// Show summary
		const files = await count_files(output_dir)
		console.log('')
		console.log(chalk.dim('  Files exported:'))
		console.log(chalk.dim(`    blocks/     ${files.blocks} blocks`))
		console.log(chalk.dim(`    page-types/ ${files.page_types} page types`))
		console.log(chalk.dim(`    pages/      ${files.pages} pages`))
		console.log(chalk.dim(`    ${'site.yaml'}   config`))
		console.log('')
		console.log(chalk.green('  Ready for local development!'))
		console.log(chalk.dim('  Run `primo dev` to start the local server'))

	} catch (error) {
		spinner.fail(`Export failed: ${error instanceof Error ? error.message : error}`)
		process.exit(1)
	}
}

async function count_files(dir: string): Promise<{ blocks: number; page_types: number; pages: number }> {
	const counts = { blocks: 0, page_types: 0, pages: 0 }

	try {
		const blocks_dir = path.join(dir, 'blocks')
		const entries = await fs.readdir(blocks_dir, { withFileTypes: true })
		counts.blocks = entries.filter(e => e.isDirectory()).length
	} catch {}

	try {
		const pt_dir = path.join(dir, 'page-types')
		const entries = await fs.readdir(pt_dir, { withFileTypes: true })
		counts.page_types = entries.filter(e => e.isDirectory()).length
	} catch {}

	try {
		const pages_dir = path.join(dir, 'pages')
		counts.pages = await count_yaml_files(pages_dir)
	} catch {}

	return counts
}

async function count_yaml_files(dir: string): Promise<number> {
	let count = 0
	const entries = await fs.readdir(dir, { withFileTypes: true })

	for (const entry of entries) {
		if (entry.isDirectory()) {
			count += await count_yaml_files(path.join(dir, entry.name))
		} else if (entry.name.endsWith('.yaml')) {
			count++
		}
	}

	return count
}

async function copy_schemas(output_dir: string) {
	// Get path to schemas directory relative to compiled dist file
	const current_file = new URL(import.meta.url).pathname
	const dist_dir = path.dirname(path.dirname(current_file)) // dist/
	const project_root = path.dirname(dist_dir) // project root
	const schemas_src = path.join(project_root, 'schemas')
	const schemas_dest = path.join(output_dir, '.schemas')

	await fs.mkdir(schemas_dest, { recursive: true })

	const schema_files = await fs.readdir(schemas_src)
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
	// Add $schema to page-type config.yaml
	const page_types_dir = path.join(output_dir, 'page-types')
	try {
		const page_types = await fs.readdir(page_types_dir, { withFileTypes: true })
		for (const page_type of page_types) {
			if (page_type.isDirectory()) {
				const config_path = path.join(page_types_dir, page_type.name, 'config.yaml')
				try {
					const config = load_yaml(await fs.readFile(config_path, 'utf-8'))
					if (!config || typeof config !== 'object' || Array.isArray(config)) {
						continue
					}
					const with_schema = {
						$schema: '../../.schemas/page-type-config.schema.json',
						...(config as Record<string, unknown>)
					}
					await fs.writeFile(config_path, dump_yaml(with_schema, { lineWidth: -1, noRefs: true }))
				} catch {}
			}
		}
	} catch {}
}
