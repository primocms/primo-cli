import path from 'path'
import { createRequire } from 'module'
import chalk from 'chalk'

export interface FormatOptions {
	enabled: boolean
	use_tabs: boolean
	tab_width: number
	print_width: number
	semi: boolean
	single_quote: boolean
	trailing_comma: 'none' | 'es5' | 'all'
}

export const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
	enabled: true,
	use_tabs: true,
	tab_width: 2,
	print_width: 100,
	semi: false,
	single_quote: true,
	trailing_comma: 'none'
}

const FORMATTABLE_EXTENSIONS = new Set(['.yaml', '.yml', '.svelte', '.ts', '.js', '.json'])

let prettier_module: any | null | undefined = undefined
let svelte_plugin_module: any | null | undefined = undefined
let warned_no_prettier = false

function resolve_prettier(workspace_dir: string): any | null {
	if (prettier_module !== undefined) return prettier_module

	const require_from_workspace = createRequire(path.join(workspace_dir, 'package.json'))
	try {
		prettier_module = require_from_workspace('prettier')
		return prettier_module
	} catch {
		// Not installed in workspace — try CLI's own deps as a fallback.
		try {
			prettier_module = createRequire(import.meta.url)('prettier')
			return prettier_module
		} catch {
			prettier_module = null
			return null
		}
	}
}

function resolve_svelte_plugin(workspace_dir: string): any | null {
	if (svelte_plugin_module !== undefined) return svelte_plugin_module

	const require_from_workspace = createRequire(path.join(workspace_dir, 'package.json'))
	try {
		svelte_plugin_module = require_from_workspace('prettier-plugin-svelte')
		return svelte_plugin_module
	} catch {
		try {
			svelte_plugin_module = createRequire(import.meta.url)('prettier-plugin-svelte')
			return svelte_plugin_module
		} catch {
			svelte_plugin_module = null
			return null
		}
	}
}

export function should_format(file_path: string): boolean {
	return FORMATTABLE_EXTENSIONS.has(path.extname(file_path).toLowerCase())
}

export async function format_file_contents(
	file_path: string,
	contents: string,
	workspace_dir: string,
	options: FormatOptions
): Promise<string> {
	if (!options.enabled) return contents
	if (!should_format(file_path)) return contents

	const prettier = resolve_prettier(workspace_dir)
	if (!prettier) {
		if (!warned_no_prettier) {
			warned_no_prettier = true
			console.log(
				chalk.dim(
					`  formatter: prettier not found in workspace; install \`prettier\` (and \`prettier-plugin-svelte\` for .svelte) or set format.enabled=false in server.yaml to silence`
				)
			)
		}
		return contents
	}

	const ext = path.extname(file_path).toLowerCase()
	const plugins: any[] = []
	if (ext === '.svelte') {
		const svelte_plugin = resolve_svelte_plugin(workspace_dir)
		if (svelte_plugin) plugins.push(svelte_plugin)
	}

	const prettier_options: any = {
		filepath: file_path,
		useTabs: options.use_tabs,
		tabWidth: options.tab_width,
		printWidth: options.print_width,
		semi: options.semi,
		singleQuote: options.single_quote,
		trailingComma: options.trailing_comma,
		plugins
	}

	try {
		const formatted = await prettier.format(contents, prettier_options)
		return formatted
	} catch (err) {
		// Don't break the import flow on a formatter error — just skip and warn.
		console.log(chalk.yellow(`  formatter: skipping ${path.basename(file_path)} (${(err as Error).message})`))
		return contents
	}
}
