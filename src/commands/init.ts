import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import { SITE_CONFIG_FILE } from '../utils/site-config.js'
import { SERVER_CONFIG_FILE, read_server_config, write_server_config } from '../utils/server-config.js'

interface InitOptions {
	name?: string
}

export async function init_workspace(options: InitOptions) {
	const cwd = process.cwd()

	// Refuse to init inside a site directory
	try {
		await fs.access(path.join(cwd, SITE_CONFIG_FILE))
		console.log(chalk.red(`Found ${SITE_CONFIG_FILE} in the current directory.`))
		console.log(chalk.red('Run `primo init` from outside a site directory.'))
		process.exit(1)
	} catch {
		// Not inside a site directory, continue.
	}

	// If a name is provided, create that folder and init inside it.
	// Otherwise, init in cwd.
	let base_dir = cwd
	if (options.name) {
		if (!/^[a-z0-9.-]+$/i.test(options.name)) {
			console.log(chalk.red('Name must contain only letters, numbers, dots, and hyphens.'))
			process.exit(1)
		}
		base_dir = path.join(cwd, options.name)
		try {
			await fs.access(base_dir)
			console.log(chalk.red(`Directory "${options.name}" already exists`))
			process.exit(1)
		} catch {
			// Directory doesn't exist, good to proceed
		}
	}

	const server_config_path = path.join(base_dir, SERVER_CONFIG_FILE)

	// If cwd init, bail if a server is already here.
	if (!options.name) {
		try {
			await fs.access(server_config_path)
			console.log(chalk.red(`Workspace already initialized (${SERVER_CONFIG_FILE} exists).`))
			console.log(chalk.dim('Run `primo new <site>` to add a site.'))
			process.exit(1)
		} catch {
			// No server config, good to proceed
		}
	}

	const spinner = ora('Initializing workspace...').start()

	try {
		await fs.mkdir(base_dir, { recursive: true })
		await fs.mkdir(path.join(base_dir, 'sites'), { recursive: true })
		await fs.mkdir(path.join(base_dir, 'library'), { recursive: true })

		await write_server_config(base_dir, {
			port: 3000,
			site_groups: [
				{
					id: 'default',
					name: 'Default',
					index: 0
				}
			]
		})

		// Re-read and ensure default group is present (normalize round-trip)
		const server_config = await read_server_config(base_dir)
		const site_groups = server_config.site_groups ?? []
		if (!site_groups.some((group) => group.id === 'default')) {
			site_groups.push({
				id: 'default',
				name: 'Default',
				index: site_groups.length
			})
			await write_server_config(base_dir, { ...server_config, site_groups })
		}

		spinner.succeed(`Workspace initialized: ${chalk.cyan(base_dir)}`)

		const rel = path.relative(cwd, base_dir) || '.'
		console.log('')
		console.log(chalk.dim('  Next steps:'))
		if (rel !== '.') {
			console.log(chalk.dim(`    cd ${rel}`))
		}
		console.log(chalk.dim('    primo new <site-name>'))
		console.log('')
	} catch (error) {
		spinner.fail(`Failed to initialize workspace: ${error instanceof Error ? error.message : error}`)
		process.exit(1)
	}
}
