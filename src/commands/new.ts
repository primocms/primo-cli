import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import { dev_server } from './dev.js'
import { SITE_CONFIG_FILE, write_site_config } from '../utils/site-config.js'
import { SERVER_CONFIG_FILE, read_server_config, write_server_config } from '../utils/server-config.js'

interface NewOptions {
	name?: string
	template?: string
	skipDev?: boolean
}

export async function new_site(options: NewOptions) {
	const base_dir = process.cwd()
	const server_config_path = path.join(base_dir, SERVER_CONFIG_FILE)
	const site_config_path = path.join(base_dir, SITE_CONFIG_FILE)
	const sites_dir = path.join(base_dir, 'sites')
	const library_dir = path.join(base_dir, 'library')

	try {
		await fs.access(site_config_path)
		console.log(chalk.red(`Found ${SITE_CONFIG_FILE} in the current directory.`))
		console.log(chalk.red('Run `primo new` from a workspace root, not inside a site directory.'))
		process.exit(1)
	} catch {
		// Not inside a site directory, continue.
	}

	// Auto-create server config if it doesn't exist, and ensure a default site group exists.
	try {
		await fs.access(server_config_path)
	} catch {
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
	}

	await fs.mkdir(sites_dir, { recursive: true })
	await fs.mkdir(library_dir, { recursive: true })

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

	let site_name = options.name

	// Prompt for name if not provided
	if (!site_name) {
		const { name } = await inquirer.prompt([{
			type: 'input',
			name: 'name',
			message: 'Site name:',
			default: 'my-site',
			validate: (input: string) => {
				if (!input.trim()) return 'Name is required'
				if (!/^[a-z0-9.-]+$/i.test(input)) return 'Use only letters, numbers, dots, and hyphens'
				return true
			}
		}])
		site_name = name
	}

	// Always create site in sites/<name>
	const site_dir = path.join(sites_dir, site_name!)

	// Check if directory exists
	try {
		await fs.access(site_dir)
		console.log(chalk.red(`Directory "${site_name}" already exists`))
		process.exit(1)
	} catch {
		// Directory doesn't exist, good to proceed
	}

	const spinner = ora('Creating site...').start()

	try {
		// Create directory structure
		await fs.mkdir(site_dir, { recursive: true })
		await fs.mkdir(path.join(site_dir, 'blocks'), { recursive: true })
		await fs.mkdir(path.join(site_dir, 'pages'), { recursive: true })
		await fs.mkdir(path.join(site_dir, 'page-types', 'default'), { recursive: true })
		await fs.mkdir(path.join(site_dir, 'site'), { recursive: true })

		// Create site config
		// If name has dots (hostname), use first part capitalized as display name
		const display_name = site_name!.includes('.')
			? site_name!.split('.')[0].charAt(0).toUpperCase() + site_name!.split('.')[0].slice(1)
			: site_name!.charAt(0).toUpperCase() + site_name!.slice(1).replace(/-/g, ' ')
		const config = {
			name: display_name,
			site_id: generate_id(),
			// Leave host empty for local dev - dev.ts will generate coffee-shop.localhost:3000
			// Only set host if it looks like a real domain (has a dot)
			host: site_name!.includes('.') ? site_name : '',
			group: 'default'
		}
		await write_site_config(site_dir, config)

		// Create default page type config
		const page_type_config = {
			id: generate_id(),
			name: 'Default',
			icon: 'mdi:file-document-outline',
			allowed_blocks: ['hero'],
			fields: []
		}
		await fs.writeFile(
			path.join(site_dir, 'page-types', 'default', 'config.yaml'),
			`id: ${page_type_config.id}
name: ${page_type_config.name}
icon: ${page_type_config.icon}
allowed_blocks:
  - hero
fields: []
`
		)

		// Create site fields (empty array)
		await fs.writeFile(
			path.join(site_dir, 'site', 'fields.yaml'),
			'[]\n'
		)

		// Create site content (empty)
		await fs.writeFile(
			path.join(site_dir, 'site', 'content.yaml'),
			'# Site-wide content\n'
		)

		// Create site head with CSS variables
		await fs.writeFile(
			path.join(site_dir, 'site', 'head.svelte'),
			`<style>
:root {
	--theme-primary: #6366f1;
	--theme-primary-dark: #4f46e5;
	--theme-background: #ffffff;
	--theme-background-secondary: #f8fafc;
	--theme-text: #0f172a;
	--theme-text-muted: #64748b;
	--theme-border-color: #e2e8f0;
	--theme-heading-font: system-ui, -apple-system, sans-serif;
	--theme-body-font: system-ui, -apple-system, sans-serif;
	--theme-section-padding: 5rem;
}
</style>
`
		)

		// Create starter hero block
		await fs.mkdir(path.join(site_dir, 'blocks', 'hero'), { recursive: true })

		await fs.writeFile(
			path.join(site_dir, 'blocks', 'hero', 'fields.yaml'),
			`_id: ${generate_id()}
name: Hero
fields:
  - _id: ${generate_id()}
    name: headline
    label: Headline
    type: text
  - _id: ${generate_id()}
    name: subheadline
    label: Subheadline
    type: text
  - _id: ${generate_id()}
    name: cta
    label: Call to Action
    type: link
`
		)

		await fs.writeFile(
			path.join(site_dir, 'blocks', 'hero', 'component.svelte'),
			`<section class="hero">
	<div class="container">
		<h1>{headline}</h1>
		{#if subheadline}
			<p class="subheadline">{subheadline}</p>
		{/if}
		{#if cta?.url}
			<a href={cta.url} class="btn">{cta.label}</a>
		{/if}
	</div>
</section>

<script>
	let { headline = '', subheadline = '', cta = {} } = $props()
</script>

<style>
	.hero {
		padding: var(--theme-section-padding, 5rem) 0;
		background: var(--theme-background-secondary, #f8fafc);
		text-align: center;
	}

	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	h1 {
		font-family: var(--theme-heading-font, system-ui);
		font-size: clamp(2rem, 5vw, 3.5rem);
		font-weight: 700;
		color: var(--theme-text, #0f172a);
		margin: 0 0 1rem;
		line-height: 1.1;
	}

	.subheadline {
		font-size: 1.25rem;
		color: var(--theme-text-muted, #64748b);
		margin: 0 0 2rem;
	}

	.btn {
		display: inline-block;
		padding: 0.875rem 2rem;
		background: var(--theme-primary, #6366f1);
		color: white;
		text-decoration: none;
		border-radius: 0.5rem;
		font-weight: 500;
		transition: background 0.2s;
	}

	.btn:hover {
		background: var(--theme-primary-dark, #4f46e5);
	}
</style>
`
		)

		await fs.writeFile(
			path.join(site_dir, 'blocks', 'hero', 'content.yaml'),
			`headline: Welcome to ${display_name}
subheadline: Edit this content in your local files or CMS
cta:
  label: Get Started
  url: "#"
`
		)

		// Create index page
		const page_id = generate_id()
		const section_id = generate_id()
		await fs.writeFile(
			path.join(site_dir, 'pages', 'index.yaml'),
			`_id: ${page_id}
name: Home
page_type: default
fields: {}
sections:
  - _id: ${section_id}
    block: hero
    content:
      headline: Welcome to ${display_name}
      subheadline: Edit this content in your local files or CMS
      cta:
        label: Get Started
        url: "#"
`
		)

		// Create AGENT.md
		await fs.writeFile(
			path.join(site_dir, 'AGENT.md'),
			generate_agent_md(display_name)
		)

		spinner.succeed(`Site created: ${chalk.cyan(site_dir)}`)

		// Check if server is already running
		const port = 3000
		const server_running = await is_server_running(port)

		if (server_running) {
			// Tell the server to reload and pick up the new site
			try {
				await fetch(`http://127.0.0.1:${port + 1}/reload`, { method: 'POST' })
			} catch {
				// Reload server might not be running (older version)
			}
			console.log('')
			console.log(chalk.dim(`  http://${site_name}.localhost:${port}/`))
			console.log('')
		} else if (!options.skipDev) {
			// No server running, start one
			console.log('')
			await dev_server({ dir: base_dir, port: String(port) })
		} else {
			console.log('')
			console.log(chalk.dim('  Next steps:'))
			console.log(chalk.dim('    primo dev'))
			console.log('')
		}

	} catch (error) {
		spinner.fail(`Failed to create site: ${error instanceof Error ? error.message : error}`)
		process.exit(1)
	}
}

function generate_id(): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
	let id = ''
	for (let i = 0; i < 15; i++) {
		id += chars[Math.floor(Math.random() * chars.length)]
	}
	return id
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

function generate_agent_md(site_name: string): string {
	return `# ${site_name}

Primo site for local development.

## Structure

\`\`\`
site.yaml        # Site config (name, site_id, host)
blocks/
  {name}/
    component.svelte
    fields.yaml
    content.yaml  # optional default block content
page-types/
  {name}/
    config.yaml
    layout.yaml   # optional shared header/footer sections
pages/
  index.yaml
  about.yaml
  about/
    index.yaml
    team.yaml
site/
  fields.yaml
  content.yaml
  head.svelte     # optional
.primo/           # local dev DB/state; not source content
\`\`\`

## Routing

- Page slugs are derived from the file path, not a \`slug:\` key.
- Examples:
  - \`pages/index.yaml\` -> \`/\`
  - \`pages/about.yaml\` -> \`/about\`
  - \`pages/about/index.yaml\` -> \`/about\`
  - \`pages/about/team.yaml\` -> \`/about/team\`
- Do not add \`slug:\` to page files. It is ignored.

## System Metadata

- Top-level entities use system-owned IDs:
  - pages: \`_id\`
  - page sections: \`_id\`
  - blocks: \`_id\` in \`fields.yaml\`
  - fields/subfields: \`_id\`
  - page types: \`id\` in \`config.yaml\`
- Do not invent or hand-author new IDs in source files.
- Keep these IDs stable when editing existing entities.
- In local dev, missing IDs may be initialized automatically.
- Duplicate IDs are treated as conflicts and may cause affected files to be skipped.

## Source Of Truth

- Source content lives in \`site.yaml\`, \`blocks/\`, \`pages/\`, \`page-types/\`, and \`site/\`.
- Treat \`.primo/\` as generated local state, not editable source content.
- Do not read from or write to the SQLite DB in \`.primo/\` unless explicitly asked.
- Do not fix schema or content issues by patching PocketBase records directly.
- If local state seems wrong, prefer deleting \`.primo/\` and reimporting from files.

## Block Files

- \`component.svelte\`: Svelte 5 component for the block.
- \`fields.yaml\`: block schema. Use \`subfields\` for repeater/group children.
- \`content.yaml\`: optional default content for new block instances.

Field schema example:
\`\`\`yaml
name: hero
fields:
  - name: headline
    label: Headline
    type: text
  - name: cta
    label: Call to Action
    type: link
  - name: features
    label: Features
    type: repeater
    subfields:
      - name: title
        label: Title
        type: text
\`\`\`

## Field Rules

- \`config\` must be an object when present.
- If a field has no config, omit \`config\` entirely.
- Do not write \`config: ""\`.
- Use \`subfields\` for \`repeater\` and \`group\` children.
- Common field types:
  - \`text\`, \`rich-text\`, \`markdown\`
  - \`image\`, \`link\`, \`url\`, \`icon\`
  - \`number\`, \`slider\`, \`switch\`, \`select\`, \`date\`
  - \`repeater\`, \`group\`
  - \`page\`, \`page-list\`, \`page-field\`, \`site-field\`
  - \`info\`

## Page Types

- \`page-types/{name}/config.yaml\` defines:
  - \`id\`
  - \`name\`
  - \`icon\`
  - \`allowed_blocks\`
  - \`fields\`
- \`page-types/{name}/layout.yaml\` can define shared \`header\` and \`footer\` sections.
- Do not manually add layout blocks to individual pages if they already come from \`layout.yaml\`.

## Components

- Components use Svelte 5 syntax.
- Match the component's data usage to field names from \`fields.yaml\`.
- Handle optional data safely:
\`\`\`svelte
{#if image?.url}
  <img src={image.url} alt={image.alt} />
{/if}

<a href={cta?.url || '#'}>{cta?.label || 'Learn More'}</a>

{#each features || [] as feature}
  <div>{feature.title}</div>
{/each}
\`\`\`

To detect the editor:
\`\`\`svelte
let is_editor = $state(false)

if (typeof window !== 'undefined') {
  is_editor = window.__PALA_CONTEXT__?.environment === 'editor'
}
\`\`\`

## Local Workflow

1. Run \`primo dev\`.
2. Edit files under \`blocks\`, \`pages\`, \`page-types\`, or \`site\`.
3. Content changes sync into the local CMS automatically.
4. Structural changes like block schema/component changes may trigger a browser reload.
`
}
