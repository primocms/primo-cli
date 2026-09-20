import {
	build_entry,
	choose_scope,
	client_ids,
	detect_clients,
	get_client,
	path_context,
	resolve_launch,
	resolve_scopes,
	type McpClientDef,
	type McpLaunch,
	type McpScope
} from './mcp-clients.js'
import {
	deep_equal,
	merge_json_config,
	merge_toml_config,
	read_if_exists,
	write_config_atomic,
	type MergeAction
} from './mcp-config.js'

/**
 * The reusable MCP wiring engine behind both `primo mcp install` and the
 * `primo init` hook. Keeping the merge/write logic here (rather than in the
 * command) lets init wire clients without reimplementing any of the safety
 * rules: only the `primo` entry is touched, writes are backed up and atomic,
 * and re-runs are idempotent.
 */

export type ResultAction = MergeAction | 'manual' | 'error'

export interface ClientResult {
	client: string
	name: string
	scope: McpScope
	path: string
	action: ResultAction
	changed: boolean
	backup?: string | null
	reason?: string
	note?: string
}

export interface McpWiringOptions {
	/** Explicit client ids; when empty (and not `all`), detected clients are used. */
	clients?: string[]
	all?: boolean
	global?: boolean
	project?: boolean
	dryRun?: boolean
	force?: boolean
	/** Directory used for project-scope resolution and detection. Defaults to cwd. */
	cwd?: string
}

export const UNKNOWN_CLIENT_HINT = `Known clients: ${client_ids().join(', ')}`

/** Validates explicit ids and falls back to detection. Throws on an unknown id. */
export function selected_clients(options: { clients?: string[]; all?: boolean; cwd: string }): string[] {
	const explicit = (options.clients || []).map((id) => id.trim()).filter(Boolean)
	for (const id of explicit) {
		if (!get_client(id)) throw new Error(`Unknown client "${id}". ${UNKNOWN_CLIENT_HINT}`)
	}
	if (options.all) return client_ids()
	if (explicit.length > 0) return explicit
	return detect_clients({ cwd: options.cwd, home: path_context(options.cwd).home })
}

/** Merges the Primo entry into a single client's config. Never throws. */
export async function install_client(
	client: McpClientDef,
	options: McpWiringOptions & { cwd: string; launch: McpLaunch }
): Promise<ClientResult> {
	const scopes = resolve_scopes(client, path_context(options.cwd))
	const chosen = choose_scope(client, scopes, options)
	const base: ClientResult = {
		client: client.id,
		name: client.name,
		scope: chosen.scope,
		path: chosen.target,
		action: 'unchanged',
		changed: false,
		note: client.note
	}

	if (!client.writable) {
		return { ...base, action: 'manual', reason: client.note || 'no safe on-disk config; use `primo mcp print`' }
	}

	try {
		const existing = await read_if_exists(chosen.target)
		const entry = build_entry(client, options.launch)

		const merged = client.format === 'toml'
			? merge_toml_config({ existing, key_path: client.key_path, launch: options.launch, force: !!options.force })
			: merge_json_config({
				existing,
				key_path: client.key_path,
				entry,
				force: !!options.force,
				equivalent: (a, b) => entries_equivalent(client, a, b)
			})

		if (!merged.changed || merged.content === null) {
			return { ...base, action: merged.action, reason: merged.reason }
		}

		if (options.dryRun) {
			return { ...base, action: merged.action, changed: false, reason: 'dry run — nothing written' }
		}

		const { backup } = await write_config_atomic(chosen.target, merged.content)
		return { ...base, action: merged.action, changed: true, backup }
	} catch (err: any) {
		return { ...base, action: 'error', reason: err?.message || String(err) }
	}
}

/**
 * Resolves clients and installs into each. Returns the launch command plus one
 * result per client, so callers can format output however they like.
 */
export async function run_mcp_wiring(
	options: McpWiringOptions = {}
): Promise<{ launch: McpLaunch; results: ClientResult[] }> {
	const ctx = path_context(options.cwd)
	const launch = resolve_launch()
	const ids = selected_clients({ clients: options.clients, all: options.all, cwd: ctx.cwd })
	const results: ClientResult[] = []

	for (const id of ids) {
		const client = get_client(id)
		if (!client) continue
		results.push(await install_client(client, { ...options, cwd: ctx.cwd, launch }))
	}

	return { launch, results }
}

/**
 * Compares two entries, ignoring a `"type": "stdio"` that is optional in most
 * flat clients. This avoids rewriting a user's working entry just to add the
 * redundant type field.
 */
function entries_equivalent(client: McpClientDef, a: unknown, b: unknown): boolean {
	if (client.entry_kind !== 'flat') return deep_equal(a, b)
	if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return deep_equal(a, b)
	return deep_equal(strip_optional_stdio_type(a as Record<string, unknown>), strip_optional_stdio_type(b as Record<string, unknown>))
}

function strip_optional_stdio_type(entry: Record<string, unknown>): Record<string, unknown> {
	const clone: Record<string, unknown> = { ...entry }
	if (clone.type === 'stdio' || clone.type === undefined) delete clone.type
	return clone
}
