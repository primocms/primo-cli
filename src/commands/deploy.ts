import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import { select } from '@inquirer/prompts'
import { execSync, spawn } from 'child_process'
import { read_server_config, write_server_config, get_server_config_path, SERVER_CONFIG_FILE } from '../utils/server-config.js'
import { read_site_config, get_site_config_path, type SiteConfig, SITE_CONFIG_FILE } from '../utils/site-config.js'

interface DeployOptions {
	provider?: string
	dryRun?: boolean
}

type Provider = 'railway' | 'fly'

interface WorkspaceInventory {
	root_dir: string
	server_config_path: string
	sites: { dir: string; config: SiteConfig }[]
	has_library: boolean
}

async function path_exists(p: string): Promise<boolean> {
	try {
		await fs.access(p)
		return true
	} catch {
		return false
	}
}

async function inventory_workspace(root_dir: string): Promise<WorkspaceInventory> {
	const server_config_path = get_server_config_path(root_dir)
	if (!await path_exists(server_config_path)) {
		console.log('')
		console.log(chalk.red(`No ${SERVER_CONFIG_FILE} found in ${root_dir}.`))
		console.log('')
		console.log(chalk.dim('  primo deploy must be run from a workspace root.'))
		console.log(chalk.dim('  A workspace root is the directory containing server.yaml.'))
		console.log(chalk.dim('  Run `primo init` to create one, or `cd` into an existing workspace.'))
		console.log('')
		process.exit(1)
	}

	// Confirm parseable; we don't need the contents but failing fast is helpful.
	await read_server_config(root_dir)

	const sites: { dir: string; config: SiteConfig }[] = []
	const sites_root = path.join(root_dir, 'sites')
	if (await path_exists(sites_root)) {
		const entries = await fs.readdir(sites_root, { withFileTypes: true })
		for (const entry of entries) {
			if (!entry.isDirectory() || entry.name.startsWith('.')) continue
			const site_dir = path.join(sites_root, entry.name)
			if (!await path_exists(get_site_config_path(site_dir))) continue
			try {
				const config = await read_site_config(site_dir)
				sites.push({ dir: site_dir, config })
			} catch {
				// Skip sites with invalid config
			}
		}
	}

	const has_library = await path_exists(path.join(root_dir, 'library'))

	return {
		root_dir,
		server_config_path,
		sites,
		has_library
	}
}

function normalize_provider(raw: unknown): Provider | undefined {
	if (typeof raw !== 'string') return undefined
	const v = raw.trim().toLowerCase()
	if (v === 'railway') return 'railway'
	if (v === 'fly' || v === 'fly.io' || v === 'flyio') return 'fly'
	return undefined
}

function workspace_app_name(root_dir: string): string {
	return path.basename(root_dir).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') || 'primo-workspace'
}

export async function deploy(options: DeployOptions) {
	const root_dir = process.cwd()

	const inventory = await inventory_workspace(root_dir)

	if (options.dryRun) {
		print_dry_run(inventory, options.provider as Provider | undefined)
		return
	}

	let provider = normalize_provider(options.provider)

	if (!provider) {
		try {
			const choice = await select<Provider>({
				message: 'Where do you want to deploy?',
				choices: [
					{ name: 'Railway', value: 'railway' },
					{ name: 'Fly.io', value: 'fly' }
				]
			})
			provider = normalize_provider(choice)
		} catch {
			// User cancelled (Ctrl+C / Esc) — exit quietly.
			console.log('')
			process.exit(1)
		}
	}

	if (!provider) {
		console.log('')
		console.log(chalk.red('No provider selected.'))
		console.log(chalk.dim('  Pass -p railway or -p fly, or pick one from the prompt.'))
		console.log('')
		process.exit(1)
	}

	const cli_installed = await check_provider_cli(provider)
	if (!cli_installed) {
		console.log('')
		console.log(chalk.yellow(`${provider} CLI not found. Install it first:`))
		if (provider === 'railway') {
			console.log(chalk.dim('  npm install -g @railway/cli'))
			console.log(chalk.dim('  railway login'))
		} else {
			console.log(chalk.dim('  curl -L https://fly.io/install.sh | sh'))
			console.log(chalk.dim('  fly auth login'))
		}
		process.exit(1)
	}

	const provider_logged_in = await check_provider_auth(provider)
	if (!provider_logged_in) {
		console.log('')
		console.log(chalk.red(`Not logged in to ${provider}.`))
		if (provider === 'railway') {
			console.log(chalk.dim('  Run `railway login` and try again.'))
		} else {
			console.log(chalk.dim('  Run `fly auth login` and try again.'))
		}
		console.log('')
		process.exit(1)
	}

	const spinner = ora('Generating deployment files...').start()
	try {
		await generate_dockerfile(inventory)
		if (provider === 'fly') {
			await generate_fly_toml(inventory)
		}
		spinner.succeed('Deployment files generated')

		if (provider === 'railway') {
			await deploy_to_railway(inventory)
		} else {
			await deploy_to_fly(inventory)
		}
	} catch (error) {
		spinner.fail(`Deployment failed: ${error instanceof Error ? error.message : error}`)
		process.exit(1)
	}
}

function print_dry_run(inventory: WorkspaceInventory, provider?: Provider) {
	console.log('')
	console.log(chalk.bold('Deploy preview (dry-run)'))
	console.log('')
	console.log(`  Workspace: ${chalk.cyan(inventory.root_dir)}`)
	console.log(`  Provider:  ${chalk.cyan(provider || '(prompted at deploy time)')}`)
	console.log(`  Image:     ${chalk.cyan(PRIMO_SERVER_IMAGE)}`)
	console.log('')
	console.log(chalk.bold('  Will create on the provider:'))
	console.log(`    ${chalk.green('+')} A service running ${PRIMO_SERVER_IMAGE}`)
	console.log(`    ${chalk.green('+')} A persistent volume mounted at /app/pb_data`)
	if (provider === 'fly') {
		console.log(`    ${chalk.green('+')} fly.toml in this workspace`)
	}
	console.log(`    ${chalk.green('+')} Dockerfile in this workspace`)
	console.log('')
	console.log(chalk.bold('  Will be uploaded after first boot via primo push:'))
	console.log(`    ${chalk.dim('—')} ${SERVER_CONFIG_FILE}`)
	if (inventory.has_library) {
		console.log(`    ${chalk.dim('—')} library/`)
	} else {
		console.log(chalk.dim('      (no library/ directory found)'))
	}
	if (inventory.sites.length > 0) {
		console.log(`    ${chalk.dim('—')} sites/ (${inventory.sites.length} site${inventory.sites.length === 1 ? '' : 's'})`)
		for (const site of inventory.sites) {
			const slug = path.basename(site.dir)
			console.log(chalk.dim(`        - ${slug}  (${site.config.name})`))
		}
	} else {
		console.log(chalk.yellow('      (no sites found under sites/)'))
	}
	console.log(chalk.dim('      (first push bootstraps; subsequent pushes update incrementally)'))
	console.log('')

	if (provider) {
		console.log(chalk.dim(`  Auth: run \`${provider === 'railway' ? 'railway whoami' : 'fly auth whoami'}\` to confirm provider login.`))
	} else {
		console.log(chalk.dim('  Auth: provider not selected; pass -p railway|fly to dry-run with auth context.'))
	}
	console.log('')
	console.log(chalk.dim('  No files were written. Run without --dry-run to deploy.'))
	console.log('')
}

async function check_provider_cli(provider: Provider): Promise<boolean> {
	try {
		if (provider === 'railway') {
			execSync('railway --version', { stdio: 'ignore' })
		} else {
			execSync('fly version', { stdio: 'ignore' })
		}
		return true
	} catch {
		return false
	}
}

async function check_provider_auth(provider: Provider): Promise<boolean> {
	try {
		if (provider === 'railway') {
			execSync('railway whoami', { stdio: 'ignore' })
		} else {
			execSync('fly auth whoami', { stdio: 'ignore' })
		}
		return true
	} catch {
		return false
	}
}

// Pinned to the upstream-published image. primocms's main.yml workflow
// publishes branch tags for whitelisted prefixes (main, feature/**, rc/**),
// with slashes slugified to dashes (feature/local-dev-cli → :feature-local-dev-cli).
// Bump to a release tag (:v3.0.0) when primocms cuts a stable release.
const PRIMO_SERVER_IMAGE = 'ghcr.io/primocms/primo:main'

async function generate_dockerfile(inventory: WorkspaceInventory) {
	// One-line Dockerfile: pull the published palacms image and run it
	// unchanged. Workspace data (server.yaml, sites/, library/) is uploaded
	// after deploy via `primo push`, which calls /api/palacms/bootstrap on
	// first push (server with no sites) and /api/palacms/import/<id> on
	// subsequent pushes. The volume mounted at /app/pb_data persists the
	// SQLite database between restarts.
	void inventory
	const dockerfile = `# Primo CMS deployment (generated by primo deploy)
FROM ${PRIMO_SERVER_IMAGE}
EXPOSE 8080
`
	await fs.writeFile(path.join(inventory.root_dir, 'Dockerfile'), dockerfile)

	// .dockerignore keeps the build context small (Railway uploads cwd to its
	// builder). Nothing in the workspace gets baked into the image — we just
	// FROM the upstream image directly.
	const dockerignore = `node_modules/
.git/
.primo/
*.log
.DS_Store
`
	await fs.writeFile(path.join(inventory.root_dir, '.dockerignore'), dockerignore)
}

async function generate_fly_toml(inventory: WorkspaceInventory) {
	const app_name = workspace_app_name(inventory.root_dir)

	// palacms binds 0.0.0.0:8080 in its CMD; mount /app/pb_data on a persistent
	// volume so the SQLite db + uploads survive restarts. Auto-start/stop keeps
	// the small instance free-tier-friendly.
	const fly_toml = `app = "${app_name}"
primary_region = "sjc"

[build]

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1

[mounts]
  source = "pb_data"
  destination = "/app/pb_data"
`

	await fs.writeFile(path.join(inventory.root_dir, 'fly.toml'), fly_toml)
}

async function deploy_to_railway(inventory: WorkspaceInventory) {
	console.log('')
	console.log(chalk.cyan('Deploying to Railway...'))

	const spinner = ora('Setting up Railway project...').start()
	const project_name = workspace_app_name(inventory.root_dir)

	try {
		try {
			execSync('railway status', { cwd: inventory.root_dir, stdio: 'ignore' })
			spinner.succeed('Linked to existing Railway project')
		} catch {
			spinner.text = 'Creating new Railway project...'
			execSync(`railway init --name "${project_name}"`, { cwd: inventory.root_dir, stdio: 'inherit' })
			spinner.succeed('Created new Railway project')
		}
	} catch (error) {
		spinner.fail('Failed to set up Railway project')
		throw error
	}

	console.log('')
	console.log(chalk.dim('Building and deploying...'))
	console.log('')

	const deploy_process = spawn('railway', ['up', '--detach'], {
		cwd: inventory.root_dir,
		stdio: 'inherit'
	})

	return new Promise<void>((resolve, reject) => {
		deploy_process.on('close', async (code) => {
			if (code !== 0) {
				reject(new Error(`Railway deployment failed with code ${code}`))
				return
			}

			// Generate (or fetch existing) public domain so the user can hit
			// the server immediately. railway domain is idempotent — calling
			// it on a service that already has a generated domain returns the
			// same URL.
			const domain = await try_railway_domain(inventory.root_dir)
			const url = domain ? `https://${domain}` : undefined

			if (url) {
				await record_workspace_server(inventory.root_dir, url)
			}

			print_post_deploy_next_steps('railway', url)
			resolve()
		})
	})
}

async function try_railway_domain(cwd: string): Promise<string | undefined> {
	try {
		const out = execSync('railway domain --json', { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString()
		const parsed = JSON.parse(out) as { domain?: string; url?: string }
		const raw = parsed.domain || parsed.url
		if (!raw) return undefined
		// railway sometimes returns bare hostname, sometimes full URL
		return raw.replace(/^https?:\/\//, '').replace(/\/+$/, '')
	} catch {
		return undefined
	}
}

async function record_workspace_server(root_dir: string, url: string): Promise<void> {
	try {
		const config = await read_server_config(root_dir)
		if (config.server === url) return
		await write_server_config(root_dir, { ...config, server: url })
	} catch {
		// Don't fail the deploy if we can't write the file — user can add
		// the server URL manually.
	}
}

function print_post_deploy_next_steps(provider: Provider, url?: string) {
	console.log('')
	console.log(chalk.green('✓ Deployment started'))
	console.log('')
	if (url) {
		console.log(chalk.bold('  URL: ') + chalk.cyan(url))
		console.log(chalk.dim('  (saved as `server:` in server.yaml — primo push/login pick it up automatically)'))
		console.log('')
	}
	console.log(chalk.bold('Next steps'))
	console.log('')
	if (provider === 'railway') {
		console.log(chalk.dim('  Railway needs one manual setting the CLI can\'t set for you:'))
		console.log(chalk.dim('    Settings → Volumes → mount on /app/pb_data (size 1GB+)'))
		console.log('')
	}
	console.log(chalk.dim('  Then upload your workspace into the deployed server:'))
	console.log(chalk.dim(`    primo push${url ? '' : ' -s <url>'}`))
	console.log(chalk.dim('  (first push bootstraps the sites; later pushes update them incrementally)'))
	console.log('')
}

async function deploy_to_fly(inventory: WorkspaceInventory) {
	console.log('')
	console.log(chalk.cyan('Deploying to Fly.io...'))

	const app_name = workspace_app_name(inventory.root_dir)
	const spinner = ora('Checking Fly.io app...').start()

	try {
		execSync(`fly status --app ${app_name}`, { cwd: inventory.root_dir, stdio: 'ignore' })
		spinner.succeed(`Found existing app: ${app_name}`)
	} catch {
		spinner.text = 'Creating Fly.io app...'
		execSync(`fly apps create ${app_name}`, { cwd: inventory.root_dir, stdio: 'inherit' })

		spinner.text = 'Creating persistent volume...'
		execSync(`fly volumes create pb_data --size 1 --region sjc --app ${app_name}`, {
			cwd: inventory.root_dir,
			stdio: 'inherit'
		})
		spinner.succeed(`Created app: ${app_name}`)
	}

	console.log('')
	console.log(chalk.dim('Building and deploying...'))
	console.log('')

	const deploy_process = spawn('fly', ['deploy'], {
		cwd: inventory.root_dir,
		stdio: 'inherit'
	})

	return new Promise<void>((resolve, reject) => {
		deploy_process.on('close', async (code) => {
			if (code !== 0) {
				reject(new Error(`Fly deployment failed with code ${code}`))
				return
			}
			const url = `https://${app_name}.fly.dev`
			await record_workspace_server(inventory.root_dir, url)
			print_post_deploy_next_steps('fly', url)
			resolve()
		})
	})
}
