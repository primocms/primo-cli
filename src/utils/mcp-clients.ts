import fs from 'fs'
import os from 'os'
import path from 'path'

/**
 * Client registry for `primo mcp install` — one place to encode every client's
 * filename, scope(s), format and merge key so a schema change is a data edit.
 *
 * Every shape below was checked against the client's official docs (URLs in
 * `docs`). The matrix in the original task brief was the starting point; two
 * entries were corrected against the docs:
 *
 *   - OpenCode v2 nests servers under `mcp.servers.<name>` (v1 used `mcp.<name>`
 *     directly, and used `enabled` instead of `disabled`). We target v2.
 *   - Continue and Zed are writable at their documented paths, and Gemini also
 *     supports a project-scoped `.gemini/settings.json` (docs say user only in
 *     the brief).
 *
 * JetBrains has no documented, stable on-disk MCP file (settings live in the
 * IDE/AI Assistant plugin, or an XML blob under the IDE options dir), so it is
 * print-only here.
 */

export type McpFormat = 'json' | 'jsonc' | 'toml'
export type McpScope = 'project' | 'user'

/**
 * `flat`  → `{ "command": "…", "args": [...] }` (the Claude/Cursor family)
 * `opencode` → `{ "type": "local", "command": ["…", "…"] }`
 */
export type McpEntryKind = 'flat' | 'opencode'

export interface McpLaunch {
	command: string
	args: string[]
}

export interface McpScopeDef {
	scope: McpScope
	/**
	 * Ordered candidate paths. The first one that already exists wins; if none
	 * exists the first is used for creation. Tokens: {home} {cwd} {xdg}
	 * {vscodeGlobalStorage}.
	 */
	paths: string[]
}

export interface McpClientDef {
	id: string
	name: string
	/** Official schema/source URL the shape was verified against. */
	docs: string | null
	format: McpFormat
	entry_kind: McpEntryKind
	/** Emit `"type": "stdio"` on flat entries (Claude/Cursor/VS Code want it). */
	stdio_type?: boolean
	/** JSON key path, or TOML table path, where the server entry lives. */
	key_path: string[]
	scopes: McpScopeDef[]
	/** Paths relative to cwd that imply the client is used in this project. */
	project_markers?: string[]
	/** Paths relative to home that imply the client is installed/used. */
	user_dirs?: string[]
	/** Binaries on PATH that imply the client is installed. */
	binaries?: string[]
	/** Env vars whose presence implies the client is installed. */
	env_vars?: string[]
	/** false → never auto-write; only `primo mcp print` can help. */
	writable: boolean
	note?: string
}

export const MCP_SERVER_NAME = 'primo'

export const MCP_CLIENTS: McpClientDef[] = [
	{
		id: 'claude',
		name: 'Claude Code',
		docs: 'https://code.claude.com/docs/en/mcp',
		format: 'jsonc',
		entry_kind: 'flat',
		stdio_type: true,
		key_path: ['mcpServers', MCP_SERVER_NAME],
		scopes: [{ scope: 'project', paths: ['{cwd}/.mcp.json'] }],
		project_markers: ['.mcp.json'],
		user_dirs: ['.claude'],
		binaries: ['claude'],
		env_vars: ['CLAUDE_CONFIG_DIR'],
		writable: true
	},
	{
		id: 'claude-desktop',
		name: 'Claude Desktop',
		docs: 'https://modelcontextprotocol.io/quickstart/user',
		format: 'json',
		entry_kind: 'flat',
		// claude_desktop_config.json uses plain command/args entries (no "type").
		key_path: ['mcpServers', MCP_SERVER_NAME],
		scopes: [{ scope: 'user', paths: ['{appSupport}/Claude/claude_desktop_config.json'] }],
		user_dirs: ['{appSupport}/Claude'],
		writable: true,
		note: 'Official on macOS and Windows; the Linux path is best-effort.'
	},
	{
		id: 'cursor',
		name: 'Cursor',
		docs: 'https://cursor.com/docs/context/mcp',
		format: 'json',
		entry_kind: 'flat',
		stdio_type: true,
		key_path: ['mcpServers', MCP_SERVER_NAME],
		scopes: [
			{ scope: 'project', paths: ['{cwd}/.cursor/mcp.json'] },
			{ scope: 'user', paths: ['{home}/.cursor/mcp.json'] }
		],
		project_markers: ['.cursor'],
		user_dirs: ['.cursor'],
		binaries: ['cursor'],
		writable: true
	},
	{
		id: 'vscode',
		name: 'VS Code / Copilot',
		docs: 'https://code.visualstudio.com/docs/agents/reference/mcp-configuration',
		format: 'jsonc',
		entry_kind: 'flat',
		stdio_type: true,
		// VS Code nests under top-level `servers`, not `mcpServers`.
		key_path: ['servers', MCP_SERVER_NAME],
		scopes: [{ scope: 'project', paths: ['{cwd}/.vscode/mcp.json'] }],
		project_markers: ['.vscode'],
		binaries: ['code'],
		writable: true
	},
	{
		id: 'codex',
		name: 'Codex',
		docs: 'https://developers.openai.com/codex/config-reference',
		format: 'toml',
		entry_kind: 'flat',
		// TOML table path: [mcp_servers.primo]
		key_path: ['mcp_servers', MCP_SERVER_NAME],
		scopes: [
			{ scope: 'user', paths: ['{home}/.codex/config.toml'] },
			{ scope: 'project', paths: ['{cwd}/.codex/config.toml'] }
		],
		project_markers: ['.codex'],
		user_dirs: ['.codex'],
		binaries: ['codex'],
		env_vars: ['CODEX_HOME'],
		writable: true
	},
	{
		id: 'opencode',
		name: 'OpenCode',
		docs: 'https://opencode.ai/v2/docs/mcp-servers/',
		format: 'jsonc',
		entry_kind: 'opencode',
		// OpenCode v2: { "mcp": { "servers": { "primo": { … } } } }
		key_path: ['mcp', 'servers', MCP_SERVER_NAME],
		scopes: [
			{ scope: 'project', paths: ['{cwd}/opencode.json', '{cwd}/opencode.jsonc', '{cwd}/.opencode/opencode.json'] },
			{ scope: 'user', paths: ['{xdg}/opencode/opencode.json', '{xdg}/opencode/opencode.jsonc'] }
		],
		project_markers: ['opencode.json', 'opencode.jsonc', '.opencode'],
		user_dirs: ['{.config}/opencode'],
		binaries: ['opencode'],
		writable: true
	},
	{
		id: 'gemini',
		name: 'Gemini CLI',
		docs: 'https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md',
		format: 'json',
		entry_kind: 'flat',
		key_path: ['mcpServers', MCP_SERVER_NAME],
		scopes: [
			{ scope: 'user', paths: ['{home}/.gemini/settings.json'] },
			{ scope: 'project', paths: ['{cwd}/.gemini/settings.json'] }
		],
		project_markers: ['.gemini'],
		user_dirs: ['.gemini'],
		binaries: ['gemini'],
		writable: true
	},
	{
		id: 'cline',
		name: 'Cline',
		docs: 'https://docs.cline.bot/mcp/configuring-mcp-servers',
		format: 'json',
		entry_kind: 'flat',
		key_path: ['mcpServers', MCP_SERVER_NAME],
		scopes: [
			{
				scope: 'user',
				// Newer Cline builds migrated the IDE globalStorage file to a
				// shared ~/.cline location (and, for the CLI, ~/.cline/mcp.json).
				// Prefer whichever already exists; create the globalStorage path
				// that the extension reads today.
				paths: [
					'{vscodeGlobalStorage}/saoudrizwan.claude-dev/settings/cline_mcp_settings.json',
					'{home}/.cline/data/settings/cline_mcp_settings.json',
					'{home}/.cline/mcp.json'
				]
			}
		],
		user_dirs: [
			'.cline',
			'{vscodeGlobalStorage}/saoudrizwan.claude-dev'
		],
		binaries: ['cline'],
		env_vars: ['CLINE_MCP_SETTINGS_PATH'],
		writable: true
	},
	{
		id: 'windsurf',
		name: 'Windsurf / Devin Desktop',
		docs: 'https://docs.windsurf.com/windsurf/cascade/mcp',
		format: 'json',
		entry_kind: 'flat',
		key_path: ['mcpServers', MCP_SERVER_NAME],
		scopes: [{ scope: 'user', paths: ['{home}/.codeium/windsurf/mcp_config.json'] }],
		user_dirs: ['.codeium/windsurf'],
		binaries: ['windsurf'],
		writable: true
	},
	{
		id: 'continue',
		name: 'Continue',
		docs: 'https://docs.continue.dev/customize/deep-dives/mcp',
		format: 'json',
		entry_kind: 'flat',
		key_path: ['mcpServers', MCP_SERVER_NAME],
		scopes: [{ scope: 'project', paths: ['{cwd}/.continue/mcpServers/mcp.json'] }],
		project_markers: ['.continue'],
		writable: true,
		note: 'Continue also accepts a YAML config; this writes the documented JSON drop-in.'
	},
	{
		id: 'zed',
		name: 'Zed',
		docs: 'https://zed.dev/docs/ai/mcp',
		format: 'json',
		entry_kind: 'flat',
		// Zed calls MCP servers "context servers" and nests under `context_servers`.
		key_path: ['context_servers', MCP_SERVER_NAME],
		scopes: [
			{ scope: 'user', paths: ['{xdg}/zed/settings.json'] },
			{ scope: 'project', paths: ['{cwd}/.zed/settings.json'] }
		],
		project_markers: ['.zed'],
		user_dirs: ['{.config}/zed'],
		binaries: ['zed'],
		writable: true
	},
	{
		id: 'jetbrains',
		name: 'JetBrains AI Assistant',
		docs: 'https://www.jetbrains.com/help/ai-assistant/mcp.html',
		format: 'json',
		entry_kind: 'flat',
		key_path: ['mcpServers', MCP_SERVER_NAME],
		scopes: [{ scope: 'user', paths: ['{home}/.config/JetBrains/AIAssistant/mcp.json'] }],
		user_dirs: ['.config/JetBrains'],
		writable: false,
		note: 'No stable on-disk file; paste the snippet via Settings | Tools | AI Assistant | MCP.'
	}
]

export function get_client(id: string): McpClientDef | undefined {
	return MCP_CLIENTS.find((client) => client.id === id)
}

export function client_ids(): string[] {
	return MCP_CLIENTS.map((client) => client.id)
}

/**
 * The command clients should run. Prefer a globally resolvable `primo-mcp`
 * binary; fall back to `npx -y primo-mcp`. `npm install -g primo-mcp` is the
 * documented way to get the direct form.
 */
export function resolve_launch(): McpLaunch {
	const binary = find_on_path('primo-mcp')
	if (binary) {
		return { command: 'primo-mcp', args: [] }
	}
	return { command: 'npx', args: ['-y', 'primo-mcp'] }
}

/** Builds the per-client server entry (JSON value / TOML values). */
export function build_entry(client: McpClientDef, launch: McpLaunch): unknown {
	if (client.entry_kind === 'opencode') {
		return { type: 'local', command: [launch.command, ...launch.args] }
	}

	const entry: Record<string, unknown> = {}
	if (client.stdio_type) entry.type = 'stdio'
	entry.command = launch.command
	if (launch.args.length > 0) entry.args = [...launch.args]
	return entry
}

/** Nests a client's entry under its key path, for `primo mcp print`. */
export function build_fragment(client: McpClientDef, launch: McpLaunch): Record<string, unknown> {
	const entry = build_entry(client, launch)
	let node: Record<string, unknown> = entry as Record<string, unknown>
	for (let i = client.key_path.length - 1; i >= 0; i--) {
		node = { [client.key_path[i]]: node }
	}
	return node
}

export interface PathContext {
	home: string
	cwd: string
	/** XDG_CONFIG_HOME, defaults to ~/.config */
	xdg: string
	platform: NodeJS.Platform
}

export function path_context(cwd = process.cwd()): PathContext {
	const home = os.homedir()
	const xdg = process.env.XDG_CONFIG_HOME || path.join(home, '.config')
	return { home, cwd: path.resolve(cwd), xdg, platform: process.platform }
}

/** Expands a path template to an absolute path. Exported for tests. */
export function expand_path(template: string, ctx: PathContext): string {
	const config = xdg_config_dir(ctx)
	const replacements: Record<string, string> = {
		'{home}': ctx.home,
		'{cwd}': ctx.cwd,
		'{xdg}': ctx.xdg,
		'{.config}': config,
		'{appSupport}': app_support_dir(ctx),
		'{vscodeGlobalStorage}': vscode_global_storage(ctx)
	}
	let out = template
	for (const [token, value] of Object.entries(replacements)) {
		out = out.split(token).join(value)
	}
	return path.normalize(out)
}

/** `~/.config` (or XDG_CONFIG_HOME) — the parent of per-client config dirs. */
function xdg_config_dir(ctx: PathContext): string {
	return ctx.xdg
}

/**
 * Per-OS application-support parent for GUI apps (Claude Desktop and friends):
 * macOS `~/Library/Application Support`, Windows `%APPDATA%`, Linux `~/.config`.
 */
function app_support_dir(ctx: PathContext): string {
	if (ctx.platform === 'darwin') return path.join(ctx.home, 'Library', 'Application Support')
	if (ctx.platform === 'win32') return process.env.APPDATA || path.join(ctx.home, 'AppData', 'Roaming')
	return ctx.xdg
}

function vscode_global_storage(ctx: PathContext): string {
	if (ctx.platform === 'darwin') {
		return path.join(ctx.home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage')
	}
	if (ctx.platform === 'win32') {
		const appdata = process.env.APPDATA || path.join(ctx.home, 'AppData', 'Roaming')
		return path.join(appdata, 'Code', 'User', 'globalStorage')
	}
	return path.join(ctx.home, '.config', 'Code', 'User', 'globalStorage')
}

/** Cross-platform PATH lookup. Returns the resolved path or null. */
export function find_on_path(binary: string, env: NodeJS.ProcessEnv = process.env): string | null {
	const path_value = env.PATH || env.Path || env.path || ''
	if (!path_value) return null

	const exts = process.platform === 'win32'
		? (env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)
		: ['']

	for (const dir of path_value.split(path.delimiter)) {
		if (!dir) continue
		for (const ext of exts) {
			const candidate = path.join(dir, binary + ext)
			try {
				const stat = fs.statSync(candidate)
				if (stat.isFile()) return candidate
			} catch {
				// not here
			}
		}
	}
	return null
}

export interface DetectionContext {
	cwd: string
	home: string
	/** Injected so tests don't depend on the developer's PATH. */
	find_binary?: (binary: string) => string | null
	env?: NodeJS.ProcessEnv
}

/** Returns the ids of clients that look installed/present, in registry order. */
export function detect_clients(ctx: DetectionContext): string[] {
	const find_binary = ctx.find_binary || ((binary: string) => find_on_path(binary, ctx.env || process.env))
	const env = ctx.env || process.env
	const detected: string[] = []

	for (const client of MCP_CLIENTS) {
		if (client_matches(client, ctx, find_binary, env)) detected.push(client.id)
	}
	return detected
}

function client_matches(
	client: McpClientDef,
	ctx: DetectionContext,
	find_binary: (binary: string) => string | null,
	env: NodeJS.ProcessEnv
): boolean {
	for (const marker of client.project_markers || []) {
		if (exists_sync(path.join(ctx.cwd, marker))) return true
	}
	for (const dir of client.user_dirs || []) {
		// Token paths ({home}, {appSupport}, {.config}, {vscodeGlobalStorage}, …)
		// expand to absolute directly; bare paths are relative to home.
		const template = dir.includes('{') ? dir : path.join(ctx.home, dir)
		if (exists_sync(expand_path(template, path_context(ctx.cwd)))) return true
	}
	for (const binary of client.binaries || []) {
		if (find_binary(binary)) return true
	}
	for (const name of client.env_vars || []) {
		if (env[name]) return true
	}
	return false
}

function exists_sync(file_path: string): boolean {
	try {
		fs.statSync(file_path)
		return true
	} catch {
		return false
	}
}

export interface ResolvedScope {
	scope: McpScope
	/** First existing candidate, else the primary target for creation. */
	target: string
	/** Candidate paths that already exist (for reporting). */
	existing: string[]
}

/**
 * Resolves each scope to a single target path. `existing` lets the caller
 * report when several candidate files exist.
 */
export function resolve_scopes(client: McpClientDef, ctx: PathContext): ResolvedScope[] {
	return client.scopes.map((scope_def) => {
		const candidates = scope_def.paths.map((template) => expand_path(template, ctx))
		const existing = candidates.filter(exists_sync)
		return {
			scope: scope_def.scope,
			target: existing[0] || candidates[0],
			existing
		}
	})
}

/** Picks the scope to use given --global/--project flags and the cwd. */
export function choose_scope(
	client: McpClientDef,
	resolved: ResolvedScope[],
	options: { global?: boolean; project?: boolean; cwd: string }
): ResolvedScope {
	if (options.project) {
		const project = resolved.find((scope) => scope.scope === 'project')
		if (project) return project
	}
	if (options.global) {
		const user = resolved.find((scope) => scope.scope === 'user')
		if (user) return user
	}

	if (resolved.length === 1) return resolved[0]

	const project = resolved.find((scope) => scope.scope === 'project')
	const user = resolved.find((scope) => scope.scope === 'user')
	if (project && user && looks_like_project(options.cwd)) return project
	return user || project || resolved[0]
}

const PROJECT_MARKERS = ['.git', 'server.yaml', 'site.yaml', 'package.json', 'opencode.json', 'opencode.jsonc']

export function looks_like_project(cwd: string): boolean {
	return PROJECT_MARKERS.some((marker) => exists_sync(path.join(cwd, marker)))
}
