import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs/promises'
import path from 'path'
import { run_cli, make_workspace } from './helpers/run-cli.mjs'

/**
 * `primo init` MCP wiring.
 *
 * init is the first onboarding moment, so it offers to connect MCP clients.
 * We use Windsurf because it is user-scoped only — its config path does not
 * depend on the workspace or the platform, which keeps these assertions
 * portable. PATH points at an empty dir so resolve_launch() deterministically
 * falls back to `npx -y primo-mcp`.
 */

async function make_init_workspace() {
	const workspace = await make_workspace()
	const bin = path.join(workspace.root, 'empty-bin')
	await fs.mkdir(bin, { recursive: true })
	return { ...workspace, env: { PATH: bin } }
}

function run_init(args, workspace) {
	return run_cli(['init', ...args], { cwd: workspace.work, home: workspace.home, env: workspace.env })
}

function windsurf_config(home) {
	return path.join(home, '.codeium', 'windsurf', 'mcp_config.json')
}

/** Creates the marker dir that makes Windsurf detect as installed. */
async function seed_windsurf(home) {
	await fs.mkdir(path.join(home, '.codeium', 'windsurf'), { recursive: true })
}

describe('primo init — MCP wiring', () => {
	test('--yes wires detected clients without prompting', async () => {
		const workspace = await make_init_workspace()
		try {
			await seed_windsurf(workspace.home)
			const result = await run_init(['--yes'], workspace)
			assert.equal(result.code, 0, result.output)
			assert.match(result.output, /Primo MCP/)

			const parsed = JSON.parse(await fs.readFile(windsurf_config(workspace.home), 'utf8'))
			assert.deepEqual(parsed.mcpServers.primo, { command: 'npx', args: ['-y', 'primo-mcp'] })
		} finally {
			await workspace.cleanup()
		}
	})

	test('--no-mcp writes no client config', async () => {
		const workspace = await make_init_workspace()
		try {
			await seed_windsurf(workspace.home)
			const result = await run_init(['--no-mcp'], workspace)
			assert.equal(result.code, 0, result.output)
			await assert.rejects(fs.access(windsurf_config(workspace.home)), '--no-mcp must not write config')
		} finally {
			await workspace.cleanup()
		}
	})

	test('non-TTY default prints a hint instead of prompting or writing', async () => {
		const workspace = await make_init_workspace()
		try {
			await seed_windsurf(workspace.home)
			const result = await run_init([], workspace)
			assert.equal(result.code, 0, result.output)
			assert.match(result.output, /primo mcp install/)
			await assert.rejects(fs.access(windsurf_config(workspace.home)), 'a non-TTY run must not write config')
		} finally {
			await workspace.cleanup()
		}
	})

	test('re-running is a no-op when already wired', async () => {
		const workspace = await make_init_workspace()
		try {
			const file = windsurf_config(workspace.home)
			await fs.mkdir(path.dirname(file), { recursive: true })
			const original = JSON.stringify(
				{ mcpServers: { primo: { command: 'npx', args: ['-y', 'primo-mcp'] } } },
				null,
				2
			) + '\n'
			await fs.writeFile(file, original)

			const result = await run_init(['--yes'], workspace)
			assert.equal(result.code, 0, result.output)
			assert.match(result.output, /already wired/)
			assert.equal(await fs.readFile(file, 'utf8'), original, 'a wired client must not be rewritten')
		} finally {
			await workspace.cleanup()
		}
	})
})
