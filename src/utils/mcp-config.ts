import fs from 'fs/promises'
import path from 'path'
import type { McpLaunch } from './mcp-clients.js'

/**
 * Config merge/write primitives for `primo mcp install`.
 *
 * The whole point of this file is to never destroy unrelated settings:
 *   - JSON/JSONC files: parse strictly, set exactly one key path, re-emit
 *     preserving key order and detected indentation. If the file contains
 *     comments (which JSON.parse cannot round-trip), refuse to write and let
 *     the caller emit a manual snippet instead.
 *   - TOML files: a narrowly-scoped text merge that only inserts/replaces the
 *     `[mcp_servers.primo]` table, leaving every other table, key and comment
 *     untouched. No TOML dependency (see docs/report).
 *   - Writes are atomic (temp file + rename) and back up the prior file.
 */

export type MergeAction = 'create' | 'update' | 'unchanged' | 'skip'

export interface MergeResult {
	/** Full file contents to write, or null when nothing should be written. */
	content: string | null
	changed: boolean
	action: MergeAction
	reason?: string
}

export interface WriteResult {
	backup: string | null
}

export async function read_if_exists(file_path: string): Promise<string | null> {
	try {
		return await fs.readFile(file_path, 'utf8')
	} catch (err: any) {
		if (err?.code === 'ENOENT') return null
		throw err
	}
}

export function ensure_trailing_newline(text: string): string {
	return text.endsWith('\n') ? text : `${text}\n`
}

function is_plain_object(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Scans JSON text for `//` or `/* *​/` comments outside of strings. JSON.parse
 * cannot round-trip these, so any hit means we must not rewrite the file.
 */
export function has_json_comments(text: string): boolean {
	let in_string = false
	let escaped = false
	for (let i = 0; i < text.length; i++) {
		const char = text[i]
		if (in_string) {
			if (escaped) {
				escaped = false
			} else if (char === '\\') {
				escaped = true
			} else if (char === '"') {
				in_string = false
			}
			continue
		}
		if (char === '"') {
			in_string = true
			continue
		}
		if (char === '/' && text[i + 1] === '/') return true
		if (char === '/' && text[i + 1] === '*') return true
	}
	return false
}

/**
 * Removes `//` and block comments outside of strings. Used only for read-only
 * detection (`mcp list` / configured checks) — never for writing, because the
 * comments would be lost.
 */
export function strip_json_comments(text: string): string {
	let out = ''
	let in_string = false
	let escaped = false
	for (let i = 0; i < text.length; i++) {
		const char = text[i]
		if (in_string) {
			out += char
			if (escaped) {
				escaped = false
			} else if (char === '\\') {
				escaped = true
			} else if (char === '"') {
				in_string = false
			}
			continue
		}
		if (char === '"') {
			in_string = true
			out += char
			continue
		}
		if (char === '/' && text[i + 1] === '/') {
			while (i < text.length && text[i] !== '\n') i++
			out += '\n'
			continue
		}
		if (char === '/' && text[i + 1] === '*') {
			i += 2
			while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
			i++
			continue
		}
		out += char
	}
	return out
}

/** Best-effort JSONC parse for read-only checks (tolerates comments + trailing commas). */
export function parse_json_lenient(text: string): unknown {
	const stripped = strip_json_comments(text).replace(/,(\s*[}\]])/g, '$1')
	return JSON.parse(stripped)
}

/** Detects the indentation used by an existing JSON file. */
export function detect_indent(text: string | null): string {
	if (!text) return '  '
	const tab_match = text.match(/\n(\t+)\S/)
	if (tab_match) return '\t'
	const space_match = text.match(/\n( +)\S/)
	if (space_match) return space_match[1]
	return '  '
}

export function serialize_json(value: unknown, indent: string): string {
	return `${JSON.stringify(value, null, indent)}\n`
}

export function get_at_key_path(root: unknown, key_path: string[]): unknown {
	let node: unknown = root
	for (const key of key_path) {
		if (!is_plain_object(node)) return undefined
		node = node[key]
	}
	return node
}

export function deep_equal(a: unknown, b: unknown): boolean {
	if (a === b) return true
	if (Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((item, i) => deep_equal(item, b[i]))
	}
	if (is_plain_object(a) && is_plain_object(b)) {
		const a_keys = Object.keys(a)
		const b_keys = Object.keys(b)
		if (a_keys.length !== b_keys.length) return false
		return a_keys.every((key) => Object.prototype.hasOwnProperty.call(b, key) && deep_equal(a[key], b[key]))
	}
	return false
}

type SetResult = { ok: true; value: Record<string, unknown> } | { ok: false; reason: string }

function set_at_key_path(root: Record<string, unknown>, key_path: string[], entry: unknown): SetResult {
	const clone = JSON.parse(JSON.stringify(root)) as Record<string, unknown>
	let node: Record<string, unknown> = clone
	for (let i = 0; i < key_path.length - 1; i++) {
		const key = key_path[i]
		const existing = node[key]
		if (existing === undefined) {
			node[key] = {}
		} else if (!is_plain_object(existing)) {
			return { ok: false, reason: `existing "${key_path.slice(0, i + 1).join('.')}" is not an object` }
		}
		node = node[key] as Record<string, unknown>
	}
	node[key_path[key_path.length - 1]] = entry
	return { ok: true, value: clone }
}

export interface JsonMergeOptions {
	existing: string | null
	key_path: string[]
	entry: unknown
	force: boolean
	/**
	 * Optional equality override, so callers can treat semantically-equal
	 * entries (e.g. one with `"type": "stdio"` and one without) as unchanged
	 * instead of rewriting a user's file.
	 */
	equivalent?: (a: unknown, b: unknown) => boolean
}

export function merge_json_config(options: JsonMergeOptions): MergeResult {
	const { existing, key_path, entry, force } = options
	const equivalent = options.equivalent || deep_equal

	if (existing === null || existing.trim() === '') {
		const created = set_at_key_path({}, key_path, entry)
		if (!created.ok) return { content: null, changed: false, action: 'skip', reason: created.reason }
		return { content: serialize_json(created.value, '  '), changed: true, action: 'create' }
	}

	if (has_json_comments(existing)) {
		return {
			content: null,
			changed: false,
			action: 'skip',
			reason: 'file contains comments (JSONC); refusing to rewrite — use `primo mcp print` and paste manually'
		}
	}

	let parsed: unknown
	try {
		parsed = JSON.parse(existing)
	} catch (err: any) {
		return {
			content: null,
			changed: false,
			action: 'skip',
			reason: `file is not valid JSON (${err?.message || 'parse error'}); refusing to rewrite`
		}
	}

	if (!is_plain_object(parsed)) {
		return { content: null, changed: false, action: 'skip', reason: 'top level is not a JSON object; refusing to rewrite' }
	}

	const current = get_at_key_path(parsed, key_path)
	if (equivalent(current, entry)) {
		return { content: null, changed: false, action: 'unchanged' }
	}

	if (current !== undefined && !force) {
		return {
			content: null,
			changed: false,
			action: 'skip',
			reason: `an existing "${key_path.join('.')}" entry differs; re-run with --force to replace it`
		}
	}

	const updated = set_at_key_path(parsed, key_path, entry)
	if (!updated.ok) return { content: null, changed: false, action: 'skip', reason: updated.reason }

	return {
		content: serialize_json(updated.value, detect_indent(existing)),
		changed: true,
		action: 'update'
	}
}

// ---------------------------------------------------------------------------
// TOML
// ---------------------------------------------------------------------------

export function toml_string(value: string): string {
	const escaped = value
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '\\"')
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\r')
		.replace(/\t/g, '\\t')
	return `"${escaped}"`
}

export function toml_array(values: string[]): string {
	return `[${values.map(toml_string).join(', ')}]`
}

function escape_regex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * True when `[parent]` exists and defines `key = ...` directly (e.g.
 * `[mcp_servers]` with `primo = { ... }`). Appending `[parent.key]` after that
 * would be invalid TOML, so the caller must bail.
 */
function toml_table_has_key(lines: string[], parent: string, key: string): boolean {
	const parent_re = new RegExp(`^\\s*\\[\\s*${escape_regex(parent)}\\s*\\]\\s*(#.*)?$`)
	const header_re = /^\s*\[/
	const key_re = new RegExp(`^\\s*${escape_regex(key)}\\s*=`)
	for (let i = 0; i < lines.length; i++) {
		if (!parent_re.test(lines[i])) continue
		for (let j = i + 1; j < lines.length; j++) {
			if (header_re.test(lines[j])) break
			if (key_re.test(lines[j])) return true
		}
	}
	return false
}

/** Canonical `[<table>]` block for a launch descriptor. */
export function build_toml_block(key_path: string[], launch: McpLaunch): string {
	const header = `[${key_path.join('.')}]`
	const lines = [header, `command = ${toml_string(launch.command)}`]
	if (launch.args.length > 0) lines.push(`args = ${toml_array(launch.args)}`)
	return lines.join('\n')
}

function normalize_toml_lines(lines: string[]): string {
	return lines
		.map((line) => line.replace(/#.*$/, '').trim())
		.filter((line) => line.length > 0)
		.map((line) => line.replace(/\s*=\s*/, '=').replace(/,\s+/g, ','))
		.join('\n')
}

export interface TomlMergeOptions {
	existing: string | null
	key_path: string[]
	launch: McpLaunch
	force: boolean
}

export function merge_toml_config(options: TomlMergeOptions): MergeResult {
	const { existing, key_path, launch, force } = options
	const block = build_toml_block(key_path, launch)
	const table = key_path.join('.')

	if (existing === null || existing.trim() === '') {
		return { content: `${block}\n`, changed: true, action: 'create' }
	}

	const lines = existing.split('\n')
	const header_re = new RegExp(`^\\s*\\[\\s*${escape_regex(table)}\\s*\\]\\s*(#.*)?$`)
	const header_index = lines.findIndex((line) => header_re.test(line))

	if (header_index === -1) {
		// Guard against shapes this narrow text merge can't safely edit:
		// inline tables, dotted keys, or a `primo` key inside a [mcp_servers]
		// table (which would collide with the sub-table we'd append).
		const inline_re = new RegExp(`(^|\\n)\\s*${escape_regex(table)}\\s*=`)
		const dotted_re = new RegExp(`(^|\\n)\\s*${escape_regex(table)}\\.`)
		const parent_inline_re = new RegExp(`(^|\\n)\\s*${escape_regex(key_path[0])}\\s*=`)
		if (
			inline_re.test(existing) ||
			dotted_re.test(existing) ||
			parent_inline_re.test(existing) ||
			toml_table_has_key(lines, key_path[0], key_path[key_path.length - 1])
		) {
			return {
				content: null,
				changed: false,
				action: 'skip',
				reason: `"${table}" is defined inline or via dotted keys; refusing to rewrite — add the table manually`
			}
		}
		const base = ensure_trailing_newline(existing)
		const separator = base.endsWith('\n\n') ? '' : '\n'
		return { content: `${base}${separator}${block}\n`, changed: true, action: 'update' }
	}

	// Find the end of this table: the next header that isn't a descendant
	// table of the one we own (so [mcp_servers.primo.env] is treated as ours).
	const descendant_re = new RegExp(`^\\s*\\[\\s*${escape_regex(table)}\\.`)
	const next_header_re = /^\s*\[/
	let end_index = lines.length
	for (let i = header_index + 1; i < lines.length; i++) {
		if (next_header_re.test(lines[i]) && !descendant_re.test(lines[i])) {
			end_index = i
			break
		}
	}

	const existing_block = lines.slice(header_index, end_index)
	const existing_direct: string[] = []
	const existing_descendants: string[] = []
	let seen_descendant = false
	for (let i = 1; i < existing_block.length; i++) {
		const line = existing_block[i]
		if (seen_descendant) {
			existing_descendants.push(line)
		} else if (next_header_re.test(line)) {
			seen_descendant = true
			existing_descendants.push(line)
		} else {
			existing_direct.push(line)
		}
	}

	if (normalize_toml_lines(existing_direct) === normalize_toml_lines(block.split('\n').slice(1))) {
		return { content: null, changed: false, action: 'unchanged' }
	}

	if (!force) {
		return {
			content: null,
			changed: false,
			action: 'skip',
			reason: `an existing [${table}] table differs; re-run with --force to replace it`
		}
	}

	const replacement = [block, ...existing_descendants]
	const merged = [...lines.slice(0, header_index), ...replacement, ...lines.slice(end_index)]
	return { content: ensure_trailing_newline(merged.join('\n')), changed: true, action: 'update' }
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

function backup_suffix(): string {
	return new Date().toISOString().replace(/[:.]/g, '-')
}

/** Writes `content` atomically, backing up any existing file first. */
export async function write_config_atomic(file_path: string, content: string): Promise<WriteResult> {
	const dir = path.dirname(file_path)
	await fs.mkdir(dir, { recursive: true })

	const existing = await read_if_exists(file_path)
	let backup: string | null = null
	if (existing !== null) {
		backup = `${file_path}.bak-${backup_suffix()}`
		await fs.writeFile(backup, existing, 'utf8')
	}

	const tmp = path.join(dir, `.${path.basename(file_path)}.tmp-${process.pid}-${Date.now()}`)
	await fs.writeFile(tmp, content, 'utf8')
	await fs.rename(tmp, file_path)
	return { backup }
}
