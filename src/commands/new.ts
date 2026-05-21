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

	// Require an initialized workspace
	try {
		await fs.access(server_config_path)
	} catch {
		console.log(chalk.red(`No ${SERVER_CONFIG_FILE} found in the current directory.`))
		console.log(chalk.dim('Run `primo init [name]` first to create a workspace.'))
		process.exit(1)
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
			group: 'default'
		}
		await write_site_config(site_dir, config)

		// Create default page type config + sibling fields.yaml
		const page_type_config = {
			_id: generate_id(),
			name: 'Default',
			icon: 'mdi:file-document-outline',
			color: '#2B407D',
			allowed_blocks: ['hero']
		}
		await fs.writeFile(
			path.join(site_dir, 'page-types', 'default', 'config.yaml'),
			`_id: ${page_type_config._id}
name: ${page_type_config.name}
icon: ${page_type_config.icon}
color: "${page_type_config.color}"
allowed_blocks:
  - hero
`
		)
		await fs.writeFile(
			path.join(site_dir, 'page-types', 'default', 'fields.yaml'),
			'[]\n'
		)
		await fs.writeFile(
			path.join(site_dir, 'page-types', 'default', 'layout.yaml'),
			`# Sections shared by every page of this type. Add blocks here to render
# the same header/footer across all pages of this type.
#
# header:
#   - block: site-header
# footer:
#   - block: site-footer
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

		// Create starter hero block (4 files: config + fields + content + component)
		await fs.mkdir(path.join(site_dir, 'blocks', 'hero'), { recursive: true })

		await fs.writeFile(
			path.join(site_dir, 'blocks', 'hero', 'config.yaml'),
			`_id: ${generate_id()}
name: Hero
`
		)

		await fs.writeFile(
			path.join(site_dir, 'blocks', 'hero', 'fields.yaml'),
			`- _id: ${generate_id()}
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

		// Create workspace-level AGENTS.md if it doesn't already exist.
		// Per-site AGENTS.md is generated by `export.go` for portable exports;
		// in a workspace, one root-level file covers all sites.
		const workspace_agents_path = path.join(base_dir, 'AGENTS.md')
		try {
			await fs.access(workspace_agents_path)
		} catch {
			await fs.writeFile(workspace_agents_path, generate_agent_md())
		}

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

function generate_agent_md(): string {
	return `# Primo workspace

Primo workspace for local development. Each subdirectory under \`sites/\` is an independent Primo site.

The Primo MCP server (\`primo\`) is the source of truth, when present, for schema, validation, field types, and inline editing. Call \`list_docs\` first to see what's documented.

Without the MCP server, read \`sites/*/blocks/*/fields.yaml\` and \`sites/*/page-types/*/fields.yaml\` to infer schemas, and treat \`sites/*/pages/*.yaml\` page/section \`content:\` as the source of truth for rendered content (block \`content.yaml\` files are defaults only).

## Layout

- \`server.yaml\` — workspace config and site groups
- \`sites/<name>/\` — individual sites (\`site.yaml\`, \`site/\`, \`blocks/\`, \`page-types/\`, \`pages/\`, \`.primo/\`)
- \`library/\` — shared library content

## Setup

- \`primo dev\` — start the local CMS and dev server. Run from the workspace root.
- \`primo new [name]\` — scaffold a new site under \`sites/\`.
- File edits sync automatically while \`primo dev\` is running. Structural changes (block schema, component) may trigger a browser reload.

## Source of truth

- Editable source lives in \`sites/<name>/site.yaml\`, \`site/\`, \`blocks/\`, \`page-types/\`, and \`pages/\`.
- \`.primo/\` is generated local state (SQLite + uploads). Do not edit, do not commit.
- Do not patch the SQLite DB to fix schema or content issues. Edit the source files; the dev server reimports.
- If local state seems wrong, delete \`.primo/\` and let the dev server reimport from files.

## Recovering overwritten files

When \`primo dev\` syncs CMS changes to disk, the prior file content is copied to \`.primo/trash/\` before the overwrite or delete. Entries are kept for 7 days.

If a file appears to have lost content after a sync (deleted entries, shrunken YAML lists, missing sections, removed files), check \`.primo/trash/\` for the most recent copy and restore with \`cp\`. The dev server also annotates the change log when a synced file shrinks or is deleted.

## IDs

- Top-level entities use system-owned \`_id\` keys (pages, sections, blocks, page types, fields).
- For blocks, \`_id\` lives in \`blocks/<key>/config.yaml\`. For page types, in \`page-types/<key>/config.yaml\`. The folder name is the stable reference key — editing \`name\` in \`config.yaml\` only changes the editor display label.
- When creating a new entity, omit the ID. The dev server generates and writes it back on first sync.
- Do not invent or hand-author IDs. Keep existing IDs stable when editing.
- Duplicate IDs are treated as conflicts; affected files may be skipped.

## Routing

- Page slugs come from the file path under \`pages/\`, not a \`slug:\` key.
- \`pages/index.yaml\` → \`/\`, \`pages/about.yaml\` → \`/about\`, \`pages/about/team.yaml\` → \`/about/team\`.
- Do not add \`slug:\` to page files. It is ignored.

## Workflow

- When building out a new site, call \`get_docs('recommended-defaults')\` first for baseline fields and the wiring checklist.
- After editing a block file, call \`validate_block\`.
- After editing a page or page-type file, call \`validate_page\`.
- When creating a new block or page type, prefer \`scaffold_block\` / \`scaffold_page_type\`.
- When you create a reusable block, add its folder name to the relevant page type's \`allowed_blocks\` — otherwise it won't appear in the editor sidebar.
- For everything else, call \`get_docs\` with the relevant section.
- Block components are Svelte 5. If the Svelte MCP server is available, use \`mcp__svelte__svelte-autofixer\` after editing \`.svelte\` files.

## Permission prompts

Your MCP client may prompt before each Primo tool call. All Primo MCP tools are read-only or return scaffolds — they don't modify your files. To skip the prompts, allowlist the \`primo\` server in your client's MCP settings (mechanism varies by client).

---

# Project preferences

Fill in the sections below to give agents project-specific direction. Anything left blank is treated as "no preference."

## Design direction

<!-- e.g. warm earth tones, generous whitespace, system fonts, minimal animation -->

## Voice & tone

<!-- e.g. friendly but not casual, second-person, short sentences -->

## SEO preferences

<!-- e.g. always mention city in seo_description, target ~150 chars, prefer action verbs in titles -->

## Content guidelines

<!-- e.g. real customer names ok, no stock photos, prefer specific numbers over vague claims -->

## Other

<!-- e.g. accessibility targets, performance budgets, browser support, anything else agents should know -->
`
}
