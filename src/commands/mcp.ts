import path from 'path'
import chalk from 'chalk'
import {
	MCP_CLIENTS,
	MCP_SERVER_NAME,
	build_fragment,
	choose_scope,
	client_ids,
	detect_clients,
	expand_path,
	find_on_path,
	get_client,
	path_context,
	resolve_launch,
	resolve_scopes,
	type McpClientDef,
	type McpLaunch,
	type McpScope
} from '../utils/mcp-clients.js'
import {
	build_toml_block,
	get_at_key_path,
	parse_json_lenient,
	read_if_exists
} from '../utils/mcp-config.js'
import {
	UNKNOWN_CLIENT_HINT,
	run_mcp_wiring,
	type ClientResult
} from '../utils/mcp-wiring.js'

export interface McpInstallOptions {
	client?: string[]
	all?: boolean
	global?: boolean
	project?: boolean
	dryRun?: boolean
	json?: boolean
	force?: boolean
}

export interface McpListOptions {
	json?: boolean
}

export interface McpPrintOptions {
	client?: string[]
	global?: boolean
	project?: boolean
	json?: boolean
}

interface ListedClient {
	client: string
	name: string
	scope: McpScope
	path: string
	format: string
	detected: boolean
	configured: 'yes' | 'no' | 'unparseable' | 'n/a'
	note?: string
}

export const UNKNOWN_CLIENTS_HINT = UNKNOWN_CLIENT_HINT

function collect_client(value: string, previous: string[]): string[] {
	return previous.concat([value])
}

export const client_option = collect_client

function describe_scope(scope: McpScope): string {
	return scope === 'project' ? 'project' : 'user'
}

export async function mcp_install(options: McpInstallOptions) {
	const as_json = !!options.json

	let run: Awaited<ReturnType<typeof run_mcp_wiring>>
	try {
		run = await run_mcp_wiring({
			clients: options.client,
			all: options.all,
			global: options.global,
			project: options.project,
			dryRun: options.dryRun,
			force: options.force
		})
	} catch (err: any) {
		if (as_json) {
			console.log(JSON.stringify({ command: 'mcp install', error: err.message }, null, 2))
			process.exitCode = 1
			return
		}
		throw err
	}

	if (run.results.length === 0) {
		print_no_clients(run.launch, as_json)
		return
	}

	// A failed write (e.g. EACCES) is reported per client; make it visible to
	// scripts too, matching the unknown-client path above.
	if (run.results.some((result) => result.action === 'error')) process.exitCode = 1
	if (as_json) {
		console.log(JSON.stringify({
			command: 'mcp install',
			dry_run: !!options.dryRun,
			force: !!options.force,
			launch: run.launch,
			results: run.results
		}, null, 2))
		return
	}

	print_install_results(run.results, run.launch, !!options.dryRun)
}

function print_no_clients(launch: McpLaunch, as_json: boolean) {
	if (as_json) {
		console.log(JSON.stringify({
			command: 'mcp install',
			launch,
			results: [],
			detected: [],
			message: 'no MCP clients detected'
		}, null, 2))
		return
	}

	console.log(chalk.bold('\nNo MCP clients detected in this directory or your home config.\n'))
	print_matrix()
	console.log('')
	console.log(`Pick a client explicitly, or emit a snippet to paste yourself:`)
	console.log(`  ${chalk.cyan('primo mcp install --client <name>')}`)
	console.log(`  ${chalk.cyan('primo mcp print --client <name>')}`)
	console.log('')
	console.log(chalk.dim(`The server command would be: ${format_launch(launch)}`))
	console.log('')
}

function print_matrix() {
	console.log(chalk.bold('Known clients'))
	for (const client of MCP_CLIENTS) {
		const scopes = client.scopes.map((scope) => scope.scope).join('/')
		console.log(`  ${pad(client.id, 12)} ${pad(client.name, 24)} ${pad(scopes, 16)} ${chalk.dim(client.scopes[0].paths[0])}`)
	}
}

function print_install_results(results: ClientResult[], launch: McpLaunch, dry_run: boolean) {
	console.log(chalk.bold('\nPrimo MCP setup'))
	console.log(chalk.dim(`  server command: ${format_launch(launch)}`))
	if (dry_run) console.log(chalk.yellow('  dry run — no files will be written'))
	console.log('')

	for (const result of results) {
		const icon = result.action === 'error'
			? chalk.red('✖')
			: result.changed
				? chalk.green('✓')
				: result.action === 'skip' || result.action === 'manual'
					? chalk.yellow('!')
					: chalk.dim('•')
		const label = result.changed
			? (result.action === 'create' ? 'added' : 'updated')
			: result.action === 'unchanged'
				? 'already configured'
				: result.action
		console.log(`  ${icon} ${pad(result.client, 12)} ${pad(describe_scope(result.scope), 8)} ${chalk.dim(result.path)}`)
		console.log(`      ${label}${result.reason ? chalk.dim(` — ${result.reason}`) : ''}${result.backup ? chalk.dim(` (backup: ${path.basename(result.backup)})`) : ''}`)
	}
	console.log('')
}

function format_launch(launch: McpLaunch): string {
	return [launch.command, ...launch.args].join(' ')
}

function pad(text: string, width: number): string {
	return text.length >= width ? text : text + ' '.repeat(width - text.length)
}

function configured_state(client: McpClientDef, file_path: string, contents: string | null): ListedClient['configured'] {
	if (contents === null) return 'no'
	if (client.format === 'toml') {
		const table = client.key_path.join('.')
		const header = new RegExp(`^\\s*\\[\\s*${table.replace(/\./g, '\\.')}\\s*\\]`, 'm')
		const inline = new RegExp(`^\\s*${table.replace(/\./g, '\\.')}\\s*=`, 'm')
		return header.test(contents) || inline.test(contents) ? 'yes' : 'no'
	}
	try {
		const parsed = parse_json_lenient(contents)
		return get_at_key_path(parsed, client.key_path) !== undefined ? 'yes' : 'no'
	} catch {
		return 'unparseable'
	}
}

export async function mcp_list(options: McpListOptions) {
	const ctx = path_context()
	const detected = new Set(detect_clients({ cwd: ctx.cwd, home: ctx.home }))
	const listed: ListedClient[] = []

	for (const client of MCP_CLIENTS) {
		const scopes = resolve_scopes(client, ctx)
		const chosen = choose_scope(client, scopes, { cwd: ctx.cwd })
		const contents = await read_if_exists(chosen.target)
		listed.push({
			client: client.id,
			name: client.name,
			scope: chosen.scope,
			path: chosen.target,
			format: client.format,
			detected: detected.has(client.id),
			configured: configured_state(client, chosen.target, contents),
			note: client.note
		})
	}

	if (options.json) {
		console.log(JSON.stringify({ command: 'mcp list', clients: listed }, null, 2))
		return
	}

	console.log(chalk.bold('\nMCP clients\n'))
	for (const entry of listed) {
		const detected = entry.detected ? chalk.green('detected') : chalk.dim('—')
		const configured = entry.configured === 'yes'
			? chalk.green('configured')
			: entry.configured === 'unparseable'
				? chalk.yellow('unparseable')
				: chalk.dim('not configured')
		console.log(`  ${pad(entry.client, 12)} ${pad(detected, 18)} ${pad(configured, 24)} ${pad(describe_scope(entry.scope), 8)} ${chalk.dim(entry.path)}`)
		if (entry.note) console.log(`      ${chalk.dim(entry.note)}`)
	}
	console.log('')
	console.log(chalk.dim(`Legend: ${MCP_SERVER_NAME} = the server name written into each client's config.`))
	console.log('')
}

export async function mcp_print(options: McpPrintOptions) {
	const ctx = path_context()
	const launch = resolve_launch()
	const explicit = (options.client || []).map((id) => id.trim()).filter(Boolean)
	for (const id of explicit) {
		if (!get_client(id)) throw new Error(`Unknown client "${id}". ${UNKNOWN_CLIENT_HINT}`)
	}
	const ids = explicit.length > 0 ? explicit : client_ids()

	const snippets = ids.map((id) => {
		const client = get_client(id) as McpClientDef
		const scopes = resolve_scopes(client, ctx)
		const chosen = choose_scope(client, scopes, { ...options, cwd: ctx.cwd })
		const content = client.format === 'toml'
			? build_toml_block(client.key_path, launch)
			: JSON.stringify(build_fragment(client, launch), null, 2)
		return {
			client: client.id,
			name: client.name,
			scope: chosen.scope,
			path: chosen.target,
			format: client.format,
			docs: client.docs,
			note: client.note,
			content
		}
	})

	if (options.json) {
		console.log(JSON.stringify({ command: 'mcp print', launch, snippets }, null, 2))
		return
	}

	for (const snippet of snippets) {
		console.log('')
		console.log(chalk.bold(`${snippet.name} ${chalk.dim(`(${snippet.scope} - ${snippet.path})`)}`))
		if (snippet.note) console.log(chalk.dim(`  ${snippet.note}`))
		console.log('')
		for (const line of snippet.content.split('\n')) {
			console.log(`  ${line}`)
		}
	}
	console.log('')
	console.log(chalk.dim(`Server command: ${format_launch(launch)}`))
	console.log('')
}

// Re-exported for callers that only need the launch resolution (and tests).
export { resolve_launch, expand_path, find_on_path, build_entry, build_fragment, path_context } from '../utils/mcp-clients.js'
