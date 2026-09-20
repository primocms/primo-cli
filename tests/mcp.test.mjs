import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs/promises'
import path from 'path'
import { run_cli, make_workspace } from './helpers/run-cli.mjs'

/**
 * `primo mcp` coverage.
 *
 * Every test runs the built CLI against a throwaway cwd + fake HOME, with PATH
 * pointed at an empty directory so neither the developer's config nor
 * installed client binaries can leak into the result. The fake PATH also makes
 * resolve_launch() deterministic: no `primo-mcp` is found, so entries use the
 * `npx -y primo-mcp` fallback.
 *
 * We exercise the built dist, like tests/smoke.test.mjs — that's what ships.
 */

async function make_mcp_workspace() {
	const workspace = await make_workspace()
	const bin = path.join(workspace.root, 'empty-bin')
	await fs.mkdir(bin, { recursive: true })
	const xdg = path.join(workspace.home, '.config')
	return {
		...workspace,
		xdg,
		env: { XDG_CONFIG_HOME: xdg, PATH: bin }
	}
}

function run_mcp(args, workspace, extra = {}) {
	return run_cli(args, { cwd: workspace.work, home: workspace.home, env: { ...workspace.env, ...extra } })
}

async function read_json(file_path) {
	return JSON.parse(await fs.readFile(file_path, 'utf8'))
}

async function backups_of(file_path) {
	const dir = path.dirname(file_path)
	const base = path.basename(file_path)
	const entries = await fs.readdir(dir)
	return entries.filter((entry) => entry.startsWith(`${base}.bak-`))
}

/**
 * The application-support parent the CLI resolves for the current platform.
 * Pass the same APPDATA override to run_mcp so Windows stays isolated to the
 * fake home.
 */
function app_support_path(home, appdata) {
	if (process.platform === 'darwin') return path.join(home, 'Library', 'Application Support')
	if (process.platform === 'win32') return appdata
	return path.join(home, '.config')
}

describe('primo mcp list', () => {
	test('--json has a stable shape and lists every known client', async () => {
		const workspace = await make_mcp_workspace()
		try {
			const result = await run_mcp(['mcp', 'list', '--json'], workspace)
			assert.equal(result.code, 0, result.output)
			const parsed = JSON.parse(result.stdout)
			assert.equal(parsed.command, 'mcp list')
			assert.ok(Array.isArray(parsed.clients))

			const ids = parsed.clients.map((client) => client.client)
			for (const expected of ['claude', 'claude-desktop', 'cursor', 'vscode', 'codex', 'opencode', 'gemini', 'cline', 'windsurf', 'continue', 'zed', 'jetbrains']) {
				assert.ok(ids.includes(expected), `${expected} missing from mcp list`)
			}
			for (const client of parsed.clients) {
				assert.equal(typeof client.path, 'string')
				assert.ok(['project', 'user'].includes(client.scope))
				assert.ok(['yes', 'no', 'unparseable', 'n/a'].includes(client.configured))
				assert.equal(typeof client.detected, 'boolean')
			}
		} finally {
			await workspace.cleanup()
		}
	})
})

describe('primo mcp install — JSON merge safety', () => {
	test('merges mcp.servers.primo into opencode.json without touching other keys', async () => {
		const workspace = await make_mcp_workspace()
		try {
			const file = path.join(workspace.work, 'opencode.json')
			const original = {
				$schema: 'https://opencode.ai/config.json',
				theme: 'dark',
				mcp: { servers: { other: { type: 'local', command: ['other'] } } }
			}
			await fs.writeFile(file, JSON.stringify(original, null, 2) + '\n')

			const result = await run_mcp(['mcp', 'install', '--client', 'opencode', '--project'], workspace)
			assert.equal(result.code, 0, result.output)

			const parsed = await read_json(file)
			assert.equal(parsed.$schema, original.$schema, '$schema was clobbered')
			assert.equal(parsed.theme, 'dark', 'unrelated key was clobbered')
			assert.deepEqual(parsed.mcp.servers.other, { type: 'local', command: ['other'] }, 'sibling server was clobbered')
			assert.deepEqual(parsed.mcp.servers.primo, { type: 'local', command: ['npx', '-y', 'primo-mcp'] })

			// Idempotent: second run reports unchanged and creates no new backup.
			const backups_before = await backups_of(file)
			const second = await run_mcp(['mcp', 'install', '--client', 'opencode', '--project'], workspace)
			assert.equal(second.code, 0, second.output)
			assert.match(second.output, /already configured/)
			assert.deepEqual(await backups_of(file), backups_before, 'a no-op run should not write or back up')
		} finally {
			await workspace.cleanup()
		}
	})

	test('writes JS-kit clients under servers, not mcpServers (VS Code)', async () => {
		const workspace = await make_mcp_workspace()
		try {
			const result = await run_mcp(['mcp', 'install', '--client', 'vscode'], workspace)
			assert.equal(result.code, 0, result.output)
			const parsed = await read_json(path.join(workspace.work, '.vscode/mcp.json'))
			assert.deepEqual(parsed.servers.primo, { type: 'stdio', command: 'npx', args: ['-y', 'primo-mcp'] })
			assert.equal(parsed.mcpServers, undefined)
		} finally {
			await workspace.cleanup()
		}
	})

	test('writes Claude Desktop config under the OS application-support dir', async () => {
		const workspace = await make_mcp_workspace()
		try {
			const appdata = path.join(workspace.home, 'AppData', 'Roaming')
			const file = path.join(
				app_support_path(workspace.home, appdata),
				'Claude',
				'claude_desktop_config.json'
			)
			await fs.mkdir(path.dirname(file), { recursive: true })
			await fs.writeFile(file, JSON.stringify({ mcpServers: { other: { command: 'other' } }, theme: 'dark' }, null, 2))

			const result = await run_mcp(['mcp', 'install', '--client', 'claude-desktop'], workspace, { APPDATA: appdata })
			assert.equal(result.code, 0, result.output)

			const parsed = await read_json(file)
			assert.equal(parsed.theme, 'dark', 'unrelated key was clobbered')
			assert.deepEqual(parsed.mcpServers.other, { command: 'other' }, 'sibling server was clobbered')
			// Claude Desktop entries are plain command/args — no "type" field.
			assert.deepEqual(parsed.mcpServers.primo, { command: 'npx', args: ['-y', 'primo-mcp'] })
		} finally {
			await workspace.cleanup()
		}
	})

	test('treats an existing equivalent entry (no "type") as already configured', async () => {
		const workspace = await make_mcp_workspace()
		try {
			const file = path.join(workspace.work, '.mcp.json')
			await fs.writeFile(file, JSON.stringify({ mcpServers: { primo: { command: 'npx', args: ['-y', 'primo-mcp'] } } }))
			const result = await run_mcp(['mcp', 'install', '--client', 'claude'], workspace)
			assert.equal(result.code, 0, result.output)
			assert.match(result.output, /already configured/)
			assert.equal(await backups_of(file).then((b) => b.length), 0)
		} finally {
			await workspace.cleanup()
		}
	})

	test('refuses to rewrite a JSONC file with comments', async () => {
		const workspace = await make_mcp_workspace()
		try {
			const file = path.join(workspace.work, 'opencode.jsonc')
			const contents = '{\n  // keep this comment\n  "mcp": { "servers": {} }\n}\n'
			await fs.writeFile(file, contents)

			const result = await run_mcp(['mcp', 'install', '--client', 'opencode'], workspace)
			assert.equal(result.code, 0, result.output)
			assert.match(result.output, /comments/)
			assert.equal(await fs.readFile(file, 'utf8'), contents, 'file with comments must be left untouched')
		} finally {
			await workspace.cleanup()
		}
	})

	test('--dry-run writes nothing and creates no directories', async () => {
		const workspace = await make_mcp_workspace()
		try {
			const result = await run_mcp(['mcp', 'install', '--client', 'cursor', '--dry-run'], workspace)
			assert.equal(result.code, 0, result.output)
			assert.match(result.output, /dry run/)
			await assert.rejects(fs.access(path.join(workspace.work, '.cursor')), 'dry run created .cursor/')
		} finally {
			await workspace.cleanup()
		}
	})

	test('--force replaces a differing entry; default leaves it alone', async () => {
		const workspace = await make_mcp_workspace()
		try {
			const file = path.join(workspace.work, '.mcp.json')
			const original = '{"mcpServers":{"primo":{"command":"something-else"}}}'
			await fs.writeFile(file, original)

			const skipped = await run_mcp(['mcp', 'install', '--client', 'claude'], workspace)
			assert.equal(skipped.code, 0, skipped.output)
			assert.match(skipped.output, /--force/)
			assert.equal(await fs.readFile(file, 'utf8'), original, 'default run must not clobber a differing entry')

			const forced = await run_mcp(['mcp', 'install', '--client', 'claude', '--force'], workspace)
			assert.equal(forced.code, 0, forced.output)
			const parsed = await read_json(file)
			assert.deepEqual(parsed.mcpServers.primo, { type: 'stdio', command: 'npx', args: ['-y', 'primo-mcp'] })
		} finally {
			await workspace.cleanup()
		}
	})

	test('backs up the previous file before writing', async () => {
		const workspace = await make_mcp_workspace()
		try {
			const file = path.join(workspace.work, 'opencode.json')
			const original = '{\n  "theme": "dark"\n}\n'
			await fs.writeFile(file, original)

			const result = await run_mcp(['mcp', 'install', '--client', 'opencode', '--project'], workspace)
			assert.equal(result.code, 0, result.output)

			const backups = await backups_of(file)
			assert.equal(backups.length, 1, `expected one backup, saw ${JSON.stringify(backups)}`)
			assert.equal(await fs.readFile(path.join(path.dirname(file), backups[0]), 'utf8'), original)
		} finally {
			await workspace.cleanup()
		}
	})
})

describe('primo mcp install — TOML merge safety', () => {
	test('adds [mcp_servers.primo] while preserving other tables and comments', async () => {
		const workspace = await make_mcp_workspace()
		try {
			const file = path.join(workspace.home, '.codex', 'config.toml')
			const original = [
				'# top comment',
				'model = "gpt-5"',
				'',
				'[mcp_servers.other]',
				'command = "other-mcp"',
				'args = ["--flag"]   # inline comment',
				'',
				'[shell_environment_policy]',
				'inherit = "core"',
				''
			].join('\n')
			await fs.mkdir(path.dirname(file), { recursive: true })
			await fs.writeFile(file, original)

			const result = await run_mcp(['mcp', 'install', '--client', 'codex', '--global'], workspace)
			assert.equal(result.code, 0, result.output)

			const contents = await fs.readFile(file, 'utf8')
			assert.match(contents, /# top comment/)
			assert.match(contents, /# inline comment/)
			assert.match(contents, /\[mcp_servers\.other\]/)
			assert.match(contents, /\[shell_environment_policy\]/)
			assert.match(contents, /\[mcp_servers\.primo\]\ncommand = "npx"\nargs = \["-y", "primo-mcp"\]/)

			// Idempotent.
			const second = await run_mcp(['mcp', 'install', '--client', 'codex', '--global'], workspace)
			assert.equal(second.code, 0, second.output)
			assert.match(second.output, /already configured/)
			assert.equal(await fs.readFile(file, 'utf8'), contents)
		} finally {
			await workspace.cleanup()
		}
	})

	test('does not clobber a differing table without --force', async () => {
		const workspace = await make_mcp_workspace()
		try {
			const file = path.join(workspace.home, '.codex', 'config.toml')
			const original = '[mcp_servers.primo]\ncommand = "old-thing"\n'
			await fs.mkdir(path.dirname(file), { recursive: true })
			await fs.writeFile(file, original)

			const skipped = await run_mcp(['mcp', 'install', '--client', 'codex', '--global'], workspace)
			assert.equal(skipped.code, 0, skipped.output)
			assert.equal(await fs.readFile(file, 'utf8'), original)

			const forced = await run_mcp(['mcp', 'install', '--client', 'codex', '--global', '--force'], workspace)
			assert.equal(forced.code, 0, forced.output)
			assert.match(await fs.readFile(file, 'utf8'), /command = "npx"/)
		} finally {
			await workspace.cleanup()
		}
	})

	test('refuses inline/dotted mcp_servers definitions instead of guessing', async () => {
		const workspace = await make_mcp_workspace()
		try {
			const file = path.join(workspace.home, '.codex', 'config.toml')
			const original = 'mcp_servers = { primo = { command = "x" } }\n'
			await fs.mkdir(path.dirname(file), { recursive: true })
			await fs.writeFile(file, original)

			const result = await run_mcp(['mcp', 'install', '--client', 'codex', '--global'], workspace)
			assert.equal(result.code, 0, result.output)
			assert.match(result.output, /inline or via dotted keys/)
			assert.equal(await fs.readFile(file, 'utf8'), original)
		} finally {
			await workspace.cleanup()
		}
	})
})

describe('primo mcp install — detection', () => {
	test('detects clients from project and home markers', async () => {
		const workspace = await make_mcp_workspace()
		try {
			await fs.mkdir(path.join(workspace.work, '.vscode'), { recursive: true })
			await fs.mkdir(path.join(workspace.home, '.gemini'), { recursive: true })

			const result = await run_mcp(['mcp', 'list', '--json'], workspace)
			assert.equal(result.code, 0, result.output)
			const parsed = JSON.parse(result.stdout)
			const detected = parsed.clients.filter((client) => client.detected).map((client) => client.client)
			assert.deepEqual(detected.sort(), ['gemini', 'vscode'])
		} finally {
			await workspace.cleanup()
		}
	})

	test('detects Claude Desktop from the application-support dir', async () => {
		const workspace = await make_mcp_workspace()
		try {
			const appdata = path.join(workspace.home, 'AppData', 'Roaming')
			await fs.mkdir(path.join(app_support_path(workspace.home, appdata), 'Claude'), { recursive: true })

			const result = await run_mcp(['mcp', 'list', '--json'], workspace, { APPDATA: appdata })
			assert.equal(result.code, 0, result.output)
			const parsed = JSON.parse(result.stdout)
			const detected = parsed.clients.filter((client) => client.detected).map((client) => client.client)
			assert.ok(detected.includes('claude-desktop'), `claude-desktop not detected: ${JSON.stringify(detected)}`)
		} finally {
			await workspace.cleanup()
		}
	})

	test('detects token-based user dirs (opencode under XDG_CONFIG_HOME)', async () => {
		const workspace = await make_mcp_workspace()
		try {
			await fs.mkdir(path.join(workspace.xdg, 'opencode'), { recursive: true })

			const result = await run_mcp(['mcp', 'list', '--json'], workspace)
			assert.equal(result.code, 0, result.output)
			const parsed = JSON.parse(result.stdout)
			const detected = parsed.clients.filter((client) => client.detected).map((client) => client.client)
			assert.ok(detected.includes('opencode'), `opencode not detected: ${JSON.stringify(detected)}`)
		} finally {
			await workspace.cleanup()
		}
	})

	test('with no flags installs to detected clients only', async () => {
		const workspace = await make_mcp_workspace()
		try {
			await fs.mkdir(path.join(workspace.work, '.vscode'), { recursive: true })
			const result = await run_mcp(['mcp', 'install'], workspace)
			assert.equal(result.code, 0, result.output)
			assert.ok(await fs.stat(path.join(workspace.work, '.vscode/mcp.json')))
			await assert.rejects(fs.access(path.join(workspace.work, '.cursor')), 'should not install to undetected clients')
		} finally {
			await workspace.cleanup()
		}
	})

	test('with nothing detected, prints the matrix and writes nothing', async () => {
		const workspace = await make_mcp_workspace()
		try {
			const result = await run_mcp(['mcp', 'install', '--dry-run'], workspace)
			assert.equal(result.code, 0, result.output)
			assert.match(result.output, /No MCP clients detected/)
			assert.match(result.output, /primo mcp print --client/)
		} finally {
			await workspace.cleanup()
		}
	})
})

describe('primo mcp install — output contract', () => {
	test('--json result shape is stable', async () => {
		const workspace = await make_mcp_workspace()
		try {
			const result = await run_mcp(['mcp', 'install', '--client', 'opencode', '--project', '--dry-run', '--json'], workspace)
			assert.equal(result.code, 0, result.output)
			const parsed = JSON.parse(result.stdout)
			assert.equal(parsed.command, 'mcp install')
			assert.equal(parsed.dry_run, true)
			assert.equal(parsed.launch.command, 'npx')
			assert.deepEqual(parsed.launch.args, ['-y', 'primo-mcp'])
			assert.equal(parsed.results.length, 1)
			const entry = parsed.results[0]
			for (const key of ['client', 'name', 'scope', 'path', 'action', 'changed']) {
				assert.ok(key in entry, `missing key ${key}`)
			}
			assert.equal(entry.client, 'opencode')
			assert.equal(entry.changed, false)
		} finally {
			await workspace.cleanup()
		}
	})

	test('rejects an unknown client with a helpful error', async () => {
		const workspace = await make_mcp_workspace()
		try {
			const result = await run_mcp(['mcp', 'install', '--client', 'nope'], workspace)
			assert.notEqual(result.code, 0)
			assert.match(result.output, /Unknown client "nope"/)
		} finally {
			await workspace.cleanup()
		}
	})
})

describe('primo mcp print', () => {
	test('emits an OpenCode v2 mcp.servers snippet', async () => {
		const workspace = await make_mcp_workspace()
		try {
			const result = await run_mcp(['mcp', 'print', '--client', 'opencode'], workspace)
			assert.equal(result.code, 0, result.output)
			assert.match(result.output, /"mcp"/)
			assert.match(result.output, /"servers"/)
			assert.match(result.output, /"primo"/)
			assert.match(result.output, /"type": "local"/)
			assert.match(result.output, /"npx",\s*\n\s*"-y",\s*\n\s*"primo-mcp"/)

			const json = await run_mcp(['mcp', 'print', '--client', 'opencode', '--json'], workspace)
			const parsed = JSON.parse(json.stdout)
			assert.equal(parsed.command, 'mcp print')
			assert.deepEqual(parsed.snippets[0].content && JSON.parse(parsed.snippets[0].content), {
				mcp: { servers: { primo: { type: 'local', command: ['npx', '-y', 'primo-mcp'] } } }
			})
		} finally {
			await workspace.cleanup()
		}
	})

	test('emits a Codex TOML table', async () => {
		const workspace = await make_mcp_workspace()
		try {
			const result = await run_mcp(['mcp', 'print', '--client', 'codex'], workspace)
			assert.equal(result.code, 0, result.output)
			assert.match(result.output, /\[mcp_servers\.primo\]/)
			assert.match(result.output, /command = "npx"/)
			assert.match(result.output, /args = \["-y", "primo-mcp"\]/)
		} finally {
			await workspace.cleanup()
		}
	})
})
