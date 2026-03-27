import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'
import { load as load_yaml } from 'js-yaml'

interface BuildOptions {
	dir: string
	output: string
}

interface SiteConfig {
	name: string
	site_id: string
	host?: string
}

interface PageSection {
	block: string
	content: Record<string, unknown>
}

interface Page {
	id: string
	name: string
	slug: string
	page_type: string
	sections: PageSection[]
	fields?: Record<string, unknown>
}

interface BlockField {
	name: string
	type: string
	options?: Record<string, unknown>
}

interface BlockConfig {
	name: string
	fields: BlockField[]
}

export async function build_site(options: BuildOptions) {
	const spinner = ora('Building site...').start()

	try {
		const site_dir = path.resolve(options.dir)
		const output_dir = path.resolve(options.output)

		// Read site config
		const config_path = path.join(site_dir, 'primo.json')
		let config: SiteConfig

		try {
			const config_data = await fs.readFile(config_path, 'utf-8')
			config = JSON.parse(config_data)
		} catch {
			spinner.fail('No primo.json found. Run `primo new` first.')
			process.exit(1)
		}

		// Clean and create output directory
		await fs.rm(output_dir, { recursive: true, force: true })
		await fs.mkdir(output_dir, { recursive: true })

		// Read head.svelte for global styles
		let head_content = ''
		try {
			const head_path = path.join(site_dir, 'site', 'head.svelte')
			head_content = await fs.readFile(head_path, 'utf-8')
		} catch {
			// No head.svelte, that's fine
		}

		// Extract CSS from head.svelte
		let global_css = ''
		if (head_content) {
			const style_match = head_content.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
			if (style_match) {
				global_css = style_match[1]
			}
		}

		// Find all pages
		const pages_dir = path.join(site_dir, 'pages')
		const pages = await find_pages(pages_dir)

		spinner.text = `Building ${pages.length} page${pages.length !== 1 ? 's' : ''}...`

		// Collect all CSS from blocks
		const block_css_cache = new Map<string, string>()
		const all_css: string[] = [global_css]

		// Build each page
		for (const page_file of pages) {
			const page_content = await fs.readFile(page_file, 'utf-8')
			const page = load_yaml(page_content) as Page

			// Render page sections
			let page_html = ''

			for (const section of page.sections || []) {
				const block_name = section.block
				const content = normalize_content(section.content)

				// Get or compile block
				let block_css = block_css_cache.get(block_name)
				if (block_css === undefined) {
					const result = await compile_block(site_dir, block_name)
					block_css = result.css
					block_css_cache.set(block_name, block_css)
					if (block_css) {
						all_css.push(block_css)
					}
				}

				// Render block HTML
				const block_html = await render_block(site_dir, block_name, content)
				page_html += block_html
			}

			// Generate full HTML document
			const html = generate_html(config.name, page.name, page_html, all_css.join('\n'))

			// Determine output path
			const slug = page.slug || path.basename(page_file, '.yaml')
			const out_path = slug === '' || slug === 'index'
				? path.join(output_dir, 'index.html')
				: path.join(output_dir, slug, 'index.html')

			await fs.mkdir(path.dirname(out_path), { recursive: true })
			await fs.writeFile(out_path, html)
		}

		// Copy uploads directory
		const uploads_src = path.join(site_dir, 'uploads')
		const uploads_dest = path.join(output_dir, 'uploads')
		try {
			await copy_dir(uploads_src, uploads_dest)
		} catch {
			// No uploads directory, that's fine
		}

		spinner.succeed(`Built ${pages.length} page${pages.length !== 1 ? 's' : ''} to ${chalk.cyan(output_dir)}`)

		console.log('')
		console.log(chalk.dim('  Preview locally:'))
		console.log(chalk.dim(`    npx serve ${options.output}`))
		console.log('')
		console.log(chalk.dim('  Deploy:'))
		console.log(chalk.dim('    npx netlify deploy --prod --dir=' + options.output))
		console.log(chalk.dim('    npx vercel ' + options.output))
		console.log('')

	} catch (error) {
		spinner.fail(`Build failed: ${error instanceof Error ? error.message : error}`)
		if (error instanceof Error && error.stack) {
			console.log(chalk.dim(error.stack))
		}
		process.exit(1)
	}
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
			} else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
				pages.push(full_path)
			}
		}
	}

	await scan(pages_dir)
	return pages
}

async function compile_block(site_dir: string, block_name: string): Promise<{ css: string }> {
	const component_path = path.join(site_dir, 'blocks', block_name, 'component.svelte')

	try {
		const source = await fs.readFile(component_path, 'utf-8')

		// Extract CSS from the component
		const style_match = source.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
		const css = style_match ? style_match[1] : ''

		return { css }
	} catch {
		return { css: '' }
	}
}

async function render_block(site_dir: string, block_name: string, content: Record<string, unknown>): Promise<string> {
	const component_path = path.join(site_dir, 'blocks', block_name, 'component.svelte')

	try {
		let source = await fs.readFile(component_path, 'utf-8')

		// Remove script tags for static render
		source = source.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')

		// Remove style tags (CSS is collected separately)
		source = source.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

		// Simple template rendering - replace {variable} with content values
		let html = source.trim()

		// Handle {#if condition}...{/if} blocks
		html = process_if_blocks(html, content)

		// Handle {#each items as item}...{/each} blocks
		html = process_each_blocks(html, content)

		// Replace simple variable interpolations {variable}
		html = html.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (match, varName) => {
			const value = content[varName]
			if (value === undefined || value === null) return ''
			return escape_html(String(value))
		})

		// Replace property access {obj.prop} or {obj?.prop}
		html = html.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\??\.([\w.?]+)\}/g, (match, objName, propPath) => {
			const obj = content[objName]
			if (!obj || typeof obj !== 'object') return ''
			const value = get_nested_value(obj as Record<string, unknown>, propPath.replace(/\?/g, ''))
			if (value === undefined || value === null) return ''
			return escape_html(String(value))
		})

		// Replace {obj && obj.prop} patterns
		html = html.replace(/\{[^}]+&&\s*([^}]+)\}/g, (match, expr) => {
			// Try to evaluate simple property access
			const prop_match = expr.trim().match(/([a-zA-Z_][a-zA-Z0-9_]*)\.(\w+)/)
			if (prop_match) {
				const obj = content[prop_match[1]]
				if (obj && typeof obj === 'object') {
					const value = (obj as Record<string, unknown>)[prop_match[2]]
					if (value !== undefined && value !== null) {
						return escape_html(String(value))
					}
				}
			}
			return ''
		})

		// Replace (obj && obj.prop) || 'default' patterns
		html = html.replace(/\{[^}]*\|\|\s*['"]([^'"]+)['"]\}/g, (match, defaultVal) => {
			// Check if the first part evaluates to something
			const var_match = match.match(/\{([a-zA-Z_][a-zA-Z0-9_]*)/)
			if (var_match) {
				const value = content[var_match[1]]
				if (value !== undefined && value !== null && value !== '') {
					return escape_html(String(value))
				}
			}
			return escape_html(defaultVal)
		})

		// Handle {@html content} - render raw HTML
		html = html.replace(/\{@html\s+([^}]+)\}/g, (match, expr) => {
			const var_name = expr.trim()
			const value = content[var_name]
			if (value === undefined || value === null) return ''
			return String(value) // Don't escape - it's raw HTML
		})

		// Clean up any remaining unresolved template expressions
		html = html.replace(/\{[^}]+\}/g, '')

		return html
	} catch (error) {
		console.log(chalk.yellow(`  Warning: Could not render block "${block_name}": ${error}`))
		return `<!-- Block "${block_name}" could not be rendered -->`
	}
}

function process_if_blocks(html: string, content: Record<string, unknown>): string {
	// Handle {#if condition}...{:else}...{/if} and {#if condition}...{/if}
	const if_regex = /\{#if\s+([^}]+)\}([\s\S]*?)\{\/if\}/g

	return html.replace(if_regex, (match, condition, inner) => {
		// Split by {:else} if present
		const parts = inner.split(/\{:else\}/)
		const if_content = parts[0]
		const else_content = parts[1] || ''

		// Evaluate condition
		const is_truthy = evaluate_condition(condition.trim(), content)

		return is_truthy ? if_content : else_content
	})
}

function evaluate_condition(condition: string, content: Record<string, unknown>): boolean {
	// Handle obj?.prop patterns
	const optional_match = condition.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\?\.(\w+)$/)
	if (optional_match) {
		const obj = content[optional_match[1]]
		if (!obj || typeof obj !== 'object') return false
		return !!(obj as Record<string, unknown>)[optional_match[2]]
	}

	// Handle simple variable check
	const simple_match = condition.match(/^([a-zA-Z_][a-zA-Z0-9_]*)$/)
	if (simple_match) {
		const value = content[simple_match[1]]
		return !!value
	}

	// Handle obj.prop patterns
	const prop_match = condition.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.(\w+)$/)
	if (prop_match) {
		const obj = content[prop_match[1]]
		if (!obj || typeof obj !== 'object') return false
		return !!(obj as Record<string, unknown>)[prop_match[2]]
	}

	// Default to checking if any referenced variable is truthy
	const var_match = condition.match(/([a-zA-Z_][a-zA-Z0-9_]*)/)
	if (var_match) {
		return !!content[var_match[1]]
	}

	return false
}

function process_each_blocks(html: string, content: Record<string, unknown>): string {
	// Handle {#each items as item}...{/each}
	const each_regex = /\{#each\s+([^\s]+)\s+as\s+([^}]+)\}([\s\S]*?)\{\/each\}/g

	return html.replace(each_regex, (match, arrayName, itemName, inner) => {
		const array = content[arrayName.trim()]
		if (!Array.isArray(array)) return ''

		// Handle "item, index" pattern
		const [item_var, index_var] = itemName.split(',').map((s: string) => s.trim())

		return array.map((item, index) => {
			let result = inner

			// Replace {item.prop} patterns
			if (typeof item === 'object' && item !== null) {
				result = result.replace(new RegExp(`\\{${item_var}\\.(\\w+)\\}`, 'g'), (_: string, prop: string) => {
					const value = (item as Record<string, unknown>)[prop]
					if (value === undefined || value === null) return ''
					return escape_html(String(value))
				})

				// Replace {@html item.prop} patterns
				result = result.replace(new RegExp(`\\{@html\\s+${item_var}\\.(\\w+)\\}`, 'g'), (_: string, prop: string) => {
					const value = (item as Record<string, unknown>)[prop]
					if (value === undefined || value === null) return ''
					return String(value)
				})
			}

			// Replace {item} if item is a primitive
			if (typeof item !== 'object') {
				result = result.replace(new RegExp(`\\{${item_var}\\}`, 'g'), escape_html(String(item)))
			}

			// Replace index variable if present
			if (index_var) {
				result = result.replace(new RegExp(`\\{${index_var}\\}`, 'g'), String(index))
			}

			return result
		}).join('')
	})
}

function get_nested_value(obj: Record<string, unknown>, path: string): unknown {
	const parts = path.split('.')
	let current: unknown = obj

	for (const part of parts) {
		if (current === null || current === undefined) return undefined
		if (typeof current !== 'object') return undefined
		current = (current as Record<string, unknown>)[part]
	}

	return current
}

function normalize_content(content: Record<string, unknown>): Record<string, unknown> {
	// Some content values come as arrays (from CMS), normalize to single values
	const normalized: Record<string, unknown> = {}

	for (const [key, value] of Object.entries(content)) {
		if (Array.isArray(value) && value.length > 0) {
			// Use first item if it's an array of primitives or objects
			normalized[key] = value[0]
		} else {
			normalized[key] = value
		}
	}

	return normalized
}

function escape_html(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')
}

function generate_html(site_name: string, page_name: string, body: string, css: string): string {
	const title = page_name === 'Home' ? site_name : `${page_name} | ${site_name}`

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escape_html(title)}</title>
	<style>
		*, *::before, *::after {
			box-sizing: border-box;
		}
		body {
			margin: 0;
			font-family: system-ui, -apple-system, sans-serif;
			line-height: 1.5;
		}
		img {
			max-width: 100%;
			height: auto;
		}
${css}
	</style>
</head>
<body>
${body}
</body>
</html>
`
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
