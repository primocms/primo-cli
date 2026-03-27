import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import { dev_server } from './dev.js'

interface NewOptions {
	name?: string
	template?: string
	skipDev?: boolean
}

export async function new_site(options: NewOptions) {
	const base_dir = process.cwd()
	const server_config_path = path.join(base_dir, 'server.json')

	// Auto-create server.json if it doesn't exist
	try {
		await fs.access(server_config_path)
	} catch {
		await fs.writeFile(server_config_path, JSON.stringify({ port: 3000 }, null, 2) + '\n')
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

	// Always create site in subdirectory
	const site_dir = path.join(base_dir, site_name!)

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
		await fs.mkdir(path.join(site_dir, 'uploads'), { recursive: true })

		// Create primo.json
		// If name has dots (hostname), use first part capitalized as display name
		const display_name = site_name!.includes('.')
			? site_name!.split('.')[0].charAt(0).toUpperCase() + site_name!.split('.')[0].slice(1)
			: site_name!.charAt(0).toUpperCase() + site_name!.slice(1).replace(/-/g, ' ')
		const config = {
			name: display_name,
			site_id: generate_id(),
			// Leave host empty for local dev - dev.ts will generate coffee-shop.localhost:3000
			// Only set host if it looks like a real domain (has a dot)
			host: site_name!.includes('.') ? site_name : ''
		}
		await fs.writeFile(
			path.join(site_dir, 'primo.json'),
			JSON.stringify(config, null, 2) + '\n'
		)

		// Create default page type config
		const page_type_config = {
			id: generate_id(),
			name: 'Default',
			icon: 'mdi:file-document-outline',
			allowed_blocks: ['hero'],
			fields: []
		}
		await fs.writeFile(
			path.join(site_dir, 'page-types', 'default', 'config.json'),
			JSON.stringify(page_type_config, null, 2) + '\n'
		)

		// Create site fields (empty array)
		await fs.writeFile(
			path.join(site_dir, 'site', 'fields.json'),
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

		const hero_fields = {
			id: generate_id(),
			name: 'Hero',
			fields: [
				{ id: generate_id(), name: 'headline', label: 'Headline', type: 'text', options: null },
				{ id: generate_id(), name: 'subheadline', label: 'Subheadline', type: 'text', options: null },
				{ id: generate_id(), name: 'cta', label: 'Call to Action', type: 'link', options: null }
			]
		}
		await fs.writeFile(
			path.join(site_dir, 'blocks', 'hero', 'fields.json'),
			JSON.stringify(hero_fields, null, 2) + '\n'
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
		await fs.writeFile(
			path.join(site_dir, 'pages', 'index.yaml'),
			`id: ${page_id}
name: Home
slug: index
page_type: default
fields: {}
sections:
  - block: hero
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

Pala site for local development.

## Structure

\`\`\`
blocks/           # Svelte components with content fields
  {name}/
    component.svelte
    fields.json
    content.yaml  # Default field values (optional)
page-types/       # Page templates
  {name}/
    config.json
pages/            # Page content (YAML)
  index.yaml      # Homepage
  contact.yaml    # Leaf page (/contact)
  about/          # Section with children
    index.yaml    # /about
    team.yaml     # /about/team
site/             # Site-wide settings
  fields.json
  content.yaml
  head.svelte     # Injected into <head>
.primo/           # Internal metadata
\`\`\`

## Creating Blocks

Each block needs two files:

**component.svelte** - Svelte 5 component:
\`\`\`svelte
<h1>{headline}</h1>
{#if image?.url}
  <img src={image.url} alt={image.alt} />
{/if}

<style>
  h1 { font-size: 2rem; }
</style>
\`\`\`

**Note:** Props are auto-injected from fields.json. No need to declare \`$props()\` - just use the field names directly in your template.

**fields.json** - Field definitions:
\`\`\`json
{
  "name": "Hero",
  "fields": [
    { "name": "headline", "label": "Headline", "type": "text" },
    { "name": "image", "label": "Image", "type": "image" }
  ]
}
\`\`\`

## Field Types

### text
Single-line text input.
\`\`\`svelte
<h1>{headline}</h1>
\`\`\`

### rich-text
WYSIWYG editor. Outputs HTML.
\`\`\`svelte
{@html content}
\`\`\`

### markdown
Markdown editor. Outputs HTML.
\`\`\`svelte
{@html body}
\`\`\`

### image
Image upload. Returns \`{ url, alt, width, height }\`.
\`\`\`svelte
{#if image?.url}
  <img src={image.url} alt={image.alt} />
{/if}
\`\`\`

### link
URL with label. Returns \`{ url, label }\`.
\`\`\`svelte
{#if cta?.url}
  <a href={cta.url}>{cta.label}</a>
{/if}
\`\`\`

### url
Plain URL string.
\`\`\`svelte
<a href={website_url}>Visit</a>
\`\`\`

### icon
Icon picker. Returns SVG string.
\`\`\`svelte
{@html icon}
\`\`\`

### number
Numeric input.
\`\`\`json
{ "name": "columns", "type": "number", "options": { "min": 1, "max": 6 } }
\`\`\`

### switch
Boolean toggle.
\`\`\`svelte
{#if show_title}<h1>{title}</h1>{/if}
\`\`\`

### select
Dropdown selection.
\`\`\`json
{ "name": "align", "type": "select", "options": { "choices": ["left", "center", "right"] } }
\`\`\`
\`\`\`svelte
<div class="text-{align}">{content}</div>
\`\`\`

### repeater
List of items with nested fields.
\`\`\`json
{
  "name": "features",
  "type": "repeater",
  "options": {
    "fields": [
      { "name": "title", "type": "text" },
      { "name": "description", "type": "text" }
    ]
  }
}
\`\`\`
\`\`\`svelte
{#each features as feature}
  <div>
    <h3>{feature.title}</h3>
    <p>{feature.description}</p>
  </div>
{/each}
\`\`\`

### group
Nested object of fields.
\`\`\`json
{
  "name": "author",
  "type": "group",
  "options": {
    "fields": [
      { "name": "name", "type": "text" },
      { "name": "avatar", "type": "image" }
    ]
  }
}
\`\`\`
\`\`\`svelte
<div>{author.name}</div>
{#if author.avatar?.url}<img src={author.avatar.url} />{/if}
\`\`\`

### page
Reference to another page. Returns page data with \`_meta.url\`.
\`\`\`json
{ "name": "featured_post", "type": "page", "options": { "page_type": "blog-post" } }
\`\`\`

### page-list
All pages of a type.
\`\`\`json
{ "name": "posts", "type": "page-list", "options": { "page_type": "blog-post" } }
\`\`\`

### page-field
Reference a field from the current page type.

### site-field
Reference a site-wide field.

### slider
Range slider for numeric values.
\`\`\`json
{ "name": "opacity", "type": "slider", "options": { "min": 0, "max": 100, "step": 10 } }
\`\`\`

### date
Date picker.

### info
Display-only text for editors (not rendered in component).

## Svelte 5 Syntax

Components use Svelte 5:
- \`$state()\` for reactive variables
- \`$derived()\` for computed values
- \`$effect()\` for side effects
- \`onclick={handler}\` not \`on:click={handler}\`

## Editor Context

Check if component is running in the CMS editor:
\`\`\`svelte
let is_editor = $state(false)

if (typeof window !== 'undefined') {
	is_editor = window.__PALA_CONTEXT__?.environment === 'editor'
}
\`\`\`

Use this for:
- Disabling fixed/sticky positioning
- Skipping scroll/resize listeners
- Showing placeholder content

## This Site

### Blocks

- \`hero\` - Hero

### Page Types

- \`default\` - Default

## Best Practices

### Safe Field Access

Always handle potentially undefined fields:
\`\`\`svelte
<!-- Images -->
{#if hero_image?.url}
  <img src={hero_image.url} alt={hero_image.alt} />
{/if}

<!-- Links -->
<a href={cta?.url || '#'}>{cta?.label || 'Learn More'}</a>

<!-- Repeaters -->
{#each features || [] as feature}
  <div>{feature.title}</div>
{/each}
\`\`\`

## Workflow

1. Run \`primo dev\` to start the local preview server
2. Edit blocks, pages, or site settings - changes auto-sync to dev server
3. Run \`primo push\` to deploy changes to a live server (if connected)
`
}
