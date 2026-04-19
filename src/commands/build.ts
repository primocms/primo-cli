import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import { load as load_yaml } from 'js-yaml'
import { compile } from 'svelte/compiler'
import * as esbuild from 'esbuild'
import { fileURLToPath } from 'url'
import { read_site_config, type SiteConfig, SITE_CONFIG_FILE } from '../utils/site-config.js'

interface BuildOptions {
	dir: string
	output: string
}

interface PageSection {
	_id?: string
	block: string
	content?: Record<string, unknown>
}

interface Page {
	_id?: string
	id?: string
	name: string
	slug?: string
	page_type: string
	sections: PageSection[]
	fields?: Record<string, unknown>
}

interface Layout {
	header?: PageSection[]
	footer?: PageSection[]
}

interface BlockField {
	id?: string
	_id?: string
	name: string
	type: string
	label?: string
	config?: {
		field?: string // Name of site field to reference (for site-field type)
		[key: string]: unknown
	} | null
	options?: {
		field?: string // Backwards compatibility - name of site field
		[key: string]: unknown
	} | null
}

interface SiteField {
	id?: string
	_id?: string
	name: string
	type: string
	label?: string
}

interface SiteData {
	fields: SiteField[]
	content: Record<string, unknown>
}

export async function build_site(options: BuildOptions) {
	const spinner = ora('Building site...').start()

	try {
		const site_dir = path.resolve(options.dir)
		const output_dir = path.resolve(options.output)
		const temp_dir = path.join(site_dir, '.primo', 'build-temp')

		// Read site config
		let config: SiteConfig

		try {
			config = await read_site_config(site_dir)
		} catch {
			spinner.fail(`No ${SITE_CONFIG_FILE} found. Run \`primo new\` first.`)
			process.exit(1)
		}

		// Clean and create directories
		await fs.rm(output_dir, { recursive: true, force: true })
		await fs.mkdir(output_dir, { recursive: true })
		await fs.rm(temp_dir, { recursive: true, force: true })
		await fs.mkdir(temp_dir, { recursive: true })

		// Read head.svelte for global head content
		let head_content = ''
		try {
			const head_path = path.join(site_dir, 'site', 'head.svelte')
			head_content = await fs.readFile(head_path, 'utf-8')
		} catch {
			// No head.svelte, that's fine
		}

		// Find all pages
		const pages_dir = path.join(site_dir, 'pages')
		const page_files = await find_pages(pages_dir)

		spinner.text = `Building ${page_files.length} page${page_files.length !== 1 ? 's' : ''}...`

		// Compile all blocks once and cache them
		const block_cache = new Map<string, { js: string; css: string }>()

		// Cache layouts per page type
		const layout_cache = new Map<string, Layout>()

		// Load site data (fields and content)
		const site_data = await load_site_data(site_dir)

		// Build each page
		for (const page_file of page_files) {
			const page_content = await fs.readFile(page_file, 'utf-8')
			const page = load_yaml(page_content) as Page
			const page_path = get_page_path_from_file(site_dir, page_file)

			spinner.text = `Building ${page.name || page_path || 'home'}...`

			const result = await build_page({
				page,
				site_dir,
				temp_dir,
				head_content,
				site_name: config.name,
				block_cache,
				layout_cache,
				site_data
			})

			if (result.error) {
				console.log(chalk.yellow(`  Warning: ${page.name}: ${result.error}`))
			}

			// Determine output path from the page file path.
			const out_path = page_path === ''
				? path.join(output_dir, 'index.html')
				: path.join(output_dir, page_path, 'index.html')

			await fs.mkdir(path.dirname(out_path), { recursive: true })
			await fs.writeFile(out_path, result.html)
		}

		// Copy uploads directory
		const uploads_src = path.join(site_dir, 'uploads')
		const uploads_dest = path.join(output_dir, 'uploads')
		try {
			await copy_dir(uploads_src, uploads_dest)
		} catch {
			// No uploads directory, that's fine
		}

		// Clean up temp directory
		await fs.rm(temp_dir, { recursive: true, force: true })

		spinner.succeed(`Built ${page_files.length} page${page_files.length !== 1 ? 's' : ''} to ${chalk.cyan(output_dir)}`)

		console.log('')
		console.log(chalk.dim('  Preview locally:'))
		console.log(chalk.dim(`    npx serve ${options.output}`))
		console.log('')
		console.log(chalk.dim('  Deploy:'))
		console.log(chalk.dim(`    npx vercel deploy ${options.output} --prod`))
		console.log(chalk.dim(`    npx netlify deploy --prod --dir=${options.output}`))
		console.log(chalk.dim(`    npx wrangler pages deploy ${options.output}`))
		console.log('')

	} catch (error) {
		spinner.fail(`Build failed: ${error instanceof Error ? error.message : error}`)
		if (error instanceof Error && error.stack) {
			console.log(chalk.dim(error.stack))
		}
		process.exit(1)
	}
}

interface BuildPageOptions {
	page: Page
	site_dir: string
	temp_dir: string
	head_content: string
	site_name: string
	block_cache: Map<string, { js: string; css: string }>
	layout_cache: Map<string, Layout>
	site_data: SiteData
}

async function build_page(options: BuildPageOptions): Promise<{ html: string; error?: string }> {
	const { page, site_dir, temp_dir, head_content, site_name, block_cache, layout_cache, site_data } = options

	try {
		// Load layout for this page type
		const page_type = page.page_type || 'default'
		let layout = layout_cache.get(page_type)
		if (layout === undefined) {
			layout = await load_layout(site_dir, page_type)
			layout_cache.set(page_type, layout)
		}

		// Combine header + page sections + footer
		const header_sections = await resolve_layout_sections(layout.header || [], site_dir, site_data)
		const footer_sections = await resolve_layout_sections(layout.footer || [], site_dir, site_data)
		const page_sections = await resolve_page_sections(page.sections || [], site_dir, site_data)
		const all_sections = [...header_sections, ...page_sections, ...footer_sections]

		if (all_sections.length === 0) {
			return { html: generate_empty_page(site_name, page.name, head_content) }
		}

		const sections = all_sections

		// Compile each block and collect CSS
		const all_css: string[] = []
		const section_components: string[] = []

		for (let i = 0; i < sections.length; i++) {
			const section = sections[i]
			const block_name = section.block

			// Check cache first
			let compiled = block_cache.get(block_name)
			if (!compiled) {
				compiled = await compile_block(site_dir, block_name, temp_dir)
				block_cache.set(block_name, compiled)
			}

			if (compiled.css) {
				all_css.push(compiled.css)
			}

			// Create import and usage for this section
			const component_name = `Section_${i}_${block_name.replace(/-/g, '_')}`
			section_components.push({
				name: component_name,
				block_name,
				props: section.content || {}
			} as any)
		}

		// Create a page component that renders all sections
		const page_component = generate_page_component(section_components as any, sections)
		const page_component_path = path.join(temp_dir, `page_${page.id || 'temp'}.svelte`)
		await fs.writeFile(page_component_path, page_component)

		// Compile the page component
		const page_source = await fs.readFile(page_component_path, 'utf-8')
		const page_compiled = compile(page_source, {
			generate: 'server',
			filename: page_component_path,
			css: 'external'
		})

		if (page_compiled.warnings.length > 0) {
			for (const warning of page_compiled.warnings) {
				if (!warning.message.includes('unused')) {
					console.log(chalk.yellow(`  Svelte warning: ${warning.message}`))
				}
			}
		}

		// Write compiled JS and bundle with esbuild
		const compiled_path = path.join(temp_dir, `page_${page.id || 'temp'}.js`)
		await fs.writeFile(compiled_path, page_compiled.js.code)

		// Copy all block compiled JS files to temp for bundling
		for (const section of sections) {
			const block_js_path = path.join(temp_dir, `${section.block}.compiled.js`)
			const cached = block_cache.get(section.block)
			if (cached?.js) {
				await fs.writeFile(block_js_path, cached.js)
			}
		}

		// Bundle with esbuild - include svelte runtime
		const bundle_path = path.join(temp_dir, `bundle_${page.id || 'temp'}.mjs`)

		// Find where svelte is installed (could be in primo-cli's node_modules or globally)
		const svelte_base = await find_svelte_path()

		await esbuild.build({
			entryPoints: [compiled_path],
			bundle: true,
			format: 'esm',
			platform: 'node',
			outfile: bundle_path,
			logLevel: 'silent',
			alias: {
				'svelte/internal/server': path.join(svelte_base, 'src/internal/server/index.js'),
				'svelte/internal/shared': path.join(svelte_base, 'src/internal/shared/index.js'),
				'svelte/internal/client': path.join(svelte_base, 'src/internal/client/index.js'),
				'svelte': path.join(svelte_base, 'src/index.js')
			}
		})

		// Import and render
		const bundle_url = `file://${bundle_path}`
		const { default: PageComponent } = await import(bundle_url)

		// Import render from svelte/server
		const { render } = await import('svelte/server')

		// Build props for all sections
		const props: Record<string, unknown> = {}
		sections.forEach((section, i) => {
			props[`section_${i}_props`] = section.content || {}
		})

		const rendered = render(PageComponent, { props })

		// Extract CSS from head.svelte
		let head_css = ''
		let head_html = head_content
		const style_match = head_content.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
		if (style_match) {
			head_css = style_match[1]
			head_html = head_content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
		}

		// Combine all CSS
		const combined_css = [head_css, ...all_css].filter(Boolean).join('\n')

		// Generate final HTML
		const title = page.name === 'Home' ? site_name : `${page.name} | ${site_name}`
		const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escape_html(title)}</title>
${head_html}
	<style>
${combined_css}
	</style>
	${rendered.head || ''}
</head>
<body>
${rendered.body || ''}
</body>
</html>`

		return { html }

	} catch (error) {
		const error_msg = error instanceof Error ? error.message : String(error)
		return {
			html: generate_error_page(site_name, page.name, error_msg, head_content),
			error: error_msg
		}
	}
}

async function compile_block(site_dir: string, block_name: string, temp_dir: string): Promise<{ js: string; css: string }> {
	const component_path = path.join(site_dir, 'blocks', block_name, 'component.svelte')

	try {
		const source = await fs.readFile(component_path, 'utf-8')

		// Compile with Svelte
		const compiled = compile(source, {
			generate: 'server',
			filename: component_path,
			css: 'external',
			name: block_name.replace(/-/g, '_')
		})

		// Extract CSS
		const css = compiled.css?.code || ''

		// Write compiled JS for importing
		const output_path = path.join(temp_dir, `${block_name}.compiled.js`)
		await fs.writeFile(output_path, compiled.js.code)

		return { js: compiled.js.code, css }
	} catch (error) {
		console.log(chalk.yellow(`  Warning: Could not compile block "${block_name}": ${error}`))
		return { js: '', css: '' }
	}
}

function generate_page_component(components: Array<{ name: string; block_name: string; props: Record<string, unknown> }>, sections: PageSection[]): string {
	const imports = sections.map((section, i) => {
		const safe_name = section.block.replace(/-/g, '_')
		return `import Section_${i} from './${section.block}.compiled.js'`
	}).join('\n')

	const props_declarations = sections.map((_, i) => {
		return `section_${i}_props = {}`
	}).join(',\n\t')

	const section_renders = sections.map((_, i) => {
		return `<Section_${i} {...section_${i}_props} />`
	}).join('\n\t\t')

	return `<script module>
${imports}
</script>

<script>
let {
	${props_declarations}
} = $props()
</script>

<main>
	${section_renders}
</main>`
}

function generate_empty_page(site_name: string, page_name: string, head_content: string): string {
	const title = page_name === 'Home' ? site_name : `${page_name} | ${site_name}`
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escape_html(title)}</title>
${head_content}
</head>
<body>
</body>
</html>`
}

function generate_error_page(site_name: string, page_name: string, error: string, head_content: string): string {
	const title = page_name === 'Home' ? site_name : `${page_name} | ${site_name}`

	// Extract just the CSS from head_content
	let head_css = ''
	const style_match = head_content.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
	if (style_match) {
		head_css = style_match[1]
	}

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escape_html(title)}</title>
	<style>
${head_css}
	</style>
</head>
<body>
	<div style="padding: 2rem; text-align: center;">
		<h1>Build Error</h1>
		<p style="color: #888;">${escape_html(error)}</p>
	</div>
</body>
</html>`
}

async function find_pages(pages_dir: string): Promise<string[]> {
	const pages: string[] = []

	async function scan(dir: string) {
		let entries
		try {
			entries = await fs.readdir(dir, { withFileTypes: true })
		} catch {
			return
		}

		for (const entry of entries) {
			const full_path = path.join(dir, entry.name)
			if (entry.isDirectory()) {
				await scan(full_path)
			} else if (entry.name.endsWith('.yaml')) {
				pages.push(full_path)
			}
		}
	}

	await scan(pages_dir)
	return pages
}

function get_page_path_from_file(site_dir: string, page_file: string): string {
	const pages_dir = path.join(site_dir, 'pages')
	let relative_path = path.relative(pages_dir, page_file)
	relative_path = relative_path.replaceAll('\\', '/')
	relative_path = relative_path.replace(/\.yaml$/i, '')

	if (relative_path === 'index') {
		return ''
	}

	if (relative_path.endsWith('/index')) {
		return relative_path.slice(0, -'/index'.length)
	}

	return relative_path
}

function escape_html(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')
}

async function copy_dir(src: string, dest: string): Promise<void> {
	await fs.mkdir(dest, { recursive: true })
	const entries = await fs.readdir(src, { withFileTypes: true })

	for (const entry of entries) {
		const src_path = path.join(src, entry.name)
		const dest_path = path.join(dest, entry.name)

		if (entry.isDirectory()) {
			await copy_dir(src_path, dest_path)
		} else {
			await fs.copyFile(src_path, dest_path)
		}
	}
}

async function load_layout(site_dir: string, page_type: string): Promise<Layout> {
	const layout_path = path.join(site_dir, 'page-types', page_type, 'layout.yaml')
	try {
		const content = await fs.readFile(layout_path, 'utf-8')
		return load_yaml(content) as Layout
	} catch {
		// No layout file, return empty layout
		return {}
	}
}

async function resolve_layout_sections(sections: PageSection[], site_dir: string, site_data: SiteData): Promise<PageSection[]> {
	// For layout sections without content, load from block's content.yaml
	const resolved: PageSection[] = []
	for (const section of sections) {
		let content: Record<string, unknown>
		if (section.content && Object.keys(section.content).length > 0) {
			content = section.content
		} else {
			// Try to load default content from block's content.yaml
			content = await load_block_defaults(site_dir, section.block)
		}
		// Resolve any site-field references in the content
		const resolved_content = await resolve_site_fields(site_dir, section.block, content, site_data)
		resolved.push({ ...section, content: resolved_content })
	}
	return resolved
}

async function resolve_page_sections(sections: PageSection[], site_dir: string, site_data: SiteData): Promise<PageSection[]> {
	// Resolve site-field references in page sections
	const resolved: PageSection[] = []
	for (const section of sections) {
		const content = section.content || {}
		const resolved_content = await resolve_site_fields(site_dir, section.block, content, site_data)
		resolved.push({ ...section, content: resolved_content })
	}
	return resolved
}

async function load_block_defaults(site_dir: string, block_name: string): Promise<Record<string, unknown>> {
	const content_path = path.join(site_dir, 'blocks', block_name, 'content.yaml')
	try {
		const content = await fs.readFile(content_path, 'utf-8')
		return (load_yaml(content) as Record<string, unknown>) || {}
	} catch {
		return {}
	}
}

async function load_fields_file(file_path: string): Promise<unknown> {
	const data = await fs.readFile(file_path, 'utf-8')
	return load_yaml(data)
}

function extract_fields_array(data: unknown): BlockField[] {
	if (Array.isArray(data)) {
		return data as BlockField[]
	}

	if (data && typeof data === 'object' && Array.isArray((data as { fields?: unknown[] }).fields)) {
		return (data as { fields: BlockField[] }).fields
	}

	return []
}

function get_field_id(field: { id?: string; _id?: string }): string | undefined {
	return field._id || field.id
}

async function load_site_data(site_dir: string): Promise<SiteData> {
	const fields_path = path.join(site_dir, 'site', 'fields.yaml')
	const content_path = path.join(site_dir, 'site', 'content.yaml')

	let fields: SiteField[] = []
	let content: Record<string, unknown> = {}

	try {
		fields = extract_fields_array(await load_fields_file(fields_path)) as SiteField[]
	} catch {
		// No site fields defined
	}

	try {
		const content_data = await fs.readFile(content_path, 'utf-8')
		content = (load_yaml(content_data) as Record<string, unknown>) || {}
	} catch {
		// No site content defined
	}

	return { fields, content }
}

async function load_block_fields(site_dir: string, block_name: string): Promise<BlockField[]> {
	const fields_path = path.join(site_dir, 'blocks', block_name, 'fields.yaml')

	try {
		return extract_fields_array(await load_fields_file(fields_path))
	} catch {
		return []
	}
}

async function resolve_site_fields(
	site_dir: string,
	block_name: string,
	content: Record<string, unknown>,
	site_data: SiteData
): Promise<Record<string, unknown>> {
	// Load block field definitions to check for site-field types
	const block_fields = await load_block_fields(site_dir, block_name)

	// Create maps for site field lookup
	const site_field_id_map = new Map<string, string>() // ID -> name
	const site_field_name_set = new Set<string>() // names that exist
	for (const site_field of site_data.fields) {
		const site_field_id = get_field_id(site_field)
		if (site_field_id) {
			site_field_id_map.set(site_field_id, site_field.name)
		}
		site_field_name_set.add(site_field.name)
	}

	// Resolve site-field references in content
	const resolved: Record<string, unknown> = { ...content }

	// For each block field that is type site-field, resolve its value
	for (const field of block_fields) {
		if (field.type !== 'site-field') continue

		const field_ref = field.config?.field

		if (field_ref) {
			// Field reference can be either a name or an ID
			// Try as name first (new format)
			if (site_field_name_set.has(field_ref) && site_data.content[field_ref] !== undefined) {
				resolved[field.name] = site_data.content[field_ref]
				continue
			}
			// Try as ID (old format)
			const site_field_name = site_field_id_map.get(field_ref)
			if (site_field_name && site_data.content[site_field_name] !== undefined) {
				resolved[field.name] = site_data.content[site_field_name]
				continue
			}
		}

		// Fallback: if block field name matches a site field name, use that value
		if (site_field_name_set.has(field.name) && site_data.content[field.name] !== undefined) {
			resolved[field.name] = site_data.content[field.name]
		}
	}

	return resolved
}

async function find_svelte_path(): Promise<string> {
	// Try to find svelte in various locations
	const possible_paths = [
		// In primo-cli's node_modules (when npm linked or installed globally)
		path.join(path.dirname(fileURLToPath(import.meta.url)), '../../node_modules/svelte'),
		// In the current project's node_modules
		path.join(process.cwd(), 'node_modules/svelte'),
		// Try resolving from this file's location
		path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../node_modules/svelte')
	]

	for (const p of possible_paths) {
		try {
			await fs.access(p)
			return p
		} catch {
			// Continue to next path
		}
	}

	throw new Error('Could not find svelte package. Make sure svelte is installed.')
}
