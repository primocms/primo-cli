import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import archiver from 'archiver'
import { get_auth_token } from '../utils/auth.js'

interface ImportOptions {
	server?: string
	site?: string
	dir: string
	token?: string
	preview?: boolean
}

interface PalaConfig {
	name: string
	host: string
	site_id: string
	server?: string
}

interface ImportDiff {
	blocks: { added: string[]; modified: string[]; deleted: string[] }
	page_types: { added: string[]; modified: string[]; deleted: string[] }
	pages: { added: string[]; modified: string[]; deleted: string[] }
	site: { added: string[]; modified: string[]; deleted: string[] }
}

export async function import_site(options: ImportOptions) {
	const spinner = ora('Reading local files...').start()

	try {
		const site_dir = path.resolve(options.dir)

		// Read pala.json for server/site info
		const config_path = path.join(site_dir, 'pala.json')
		let config: PalaConfig | null = null

		try {
			const config_data = await fs.readFile(config_path, 'utf-8')
			config = JSON.parse(config_data)
		} catch {
			// No config file, must provide options
		}

		const server = options.server || config?.server
		const site_id = options.site || config?.site_id

		if (!server) {
			spinner.fail('Server URL required. Use --server or ensure pala.json has server field.')
			process.exit(1)
		}

		if (!site_id) {
			spinner.fail('Site ID required. Use --site or ensure pala.json has site_id field.')
			process.exit(1)
		}

		// Get auth token
		const token = options.token || await get_auth_token(server)
		if (!token) {
			spinner.fail('Authentication required. Use --token or run `pala login` first.')
			process.exit(1)
		}

		// Create ZIP of the site directory
		spinner.text = 'Packaging files...'
		const zip_buffer = await create_zip(site_dir)

		// Send to server
		const endpoint = options.preview
			? `${server}/api/palacms/import/${site_id}/preview`
			: `${server}/api/palacms/import/${site_id}`

		spinner.text = options.preview ? 'Previewing changes...' : 'Importing changes...'

		const form_data = new FormData()
		form_data.append('file', new Blob([zip_buffer]), 'site.zip')

		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${token}`
			},
			body: form_data
		})

		if (!response.ok) {
			const error = await response.text()
			spinner.fail(`Import failed: ${error}`)
			process.exit(1)
		}

		const result = await response.json() as { preview?: boolean; success?: boolean; diff: ImportDiff }

		if (options.preview) {
			spinner.succeed('Preview complete')
			console.log('')
			print_diff(result.diff)
			console.log('')
			console.log(chalk.dim('  Run without --preview to apply these changes'))
		} else {
			spinner.succeed('Import complete')
			console.log('')
			print_diff(result.diff)
		}

	} catch (error) {
		spinner.fail(`Import failed: ${error instanceof Error ? error.message : error}`)
		process.exit(1)
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

		// Add pala.json
		archive.file(path.join(dir, 'pala.json'), { name: 'pala.json' })

		archive.finalize()
	})
}

function print_diff(diff: ImportDiff) {
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
