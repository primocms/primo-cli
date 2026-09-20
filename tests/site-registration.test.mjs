import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs/promises'
import path from 'path'
import { run_cli, make_workspace } from './helpers/run-cli.mjs'
import { start_mock_server } from './helpers/mock-server.mjs'

/**
 * Site-registration messaging regressions.
 *
 * - `primo add` refuses while the workspace port is held (to avoid racing the
 *   dev watcher's site_id mint), so its help must say so rather than promise a
 *   live pickup.
 * - `primo new` must not print live Edit/Preview links when the dev server did
 *   not actually import the site.
 */

describe('primo add help', () => {
	test('describes the port requirement instead of a live pickup', async () => {
		const workspace = await make_workspace()
		try {
			const result = await run_cli(['add', '--help'], { cwd: workspace.work, home: workspace.home })
			assert.equal(result.code, 0, result.output)
			assert.doesNotMatch(result.output, /picks the site up live/i)
			assert.match(result.output, /stop .*primo dev/i)
		} finally {
			await workspace.cleanup()
		}
	})
})

describe('primo new — registration messaging', () => {
	test('does not show live links when the running dev server cannot reload', async () => {
		const workspace = await make_workspace()
		const server = await start_mock_server()
		try {
			const port = new URL(server.url).port
			await fs.writeFile(
				path.join(workspace.work, 'server.yaml'),
				`port: ${port}\nsite_groups:\n  - id: default\n    name: Default\n    index: 0\n`
			)
			await fs.mkdir(path.join(workspace.work, 'sites'), { recursive: true })

			// The mock answers /api/health (so `new` treats a server as running)
			// but nothing answers the reload endpoint on port+1.
			const result = await run_cli(['new', 'demo', '--skip-dev'], { cwd: workspace.work, home: workspace.home })
			assert.equal(result.code, 0, result.output)
			assert.match(result.output, /didn't import it|Restart `primo dev`/)
			assert.doesNotMatch(result.output, /Preview:/, 'must not print live preview links for an unimported site')

			// The site is still created on disk.
			await fs.access(path.join(workspace.work, 'sites', 'demo', 'site.yaml'))
		} finally {
			await server.close()
			await workspace.cleanup()
		}
	})

	test('--skip-dev with no server says the site is not registered yet', async () => {
		const workspace = await make_workspace()
		try {
			await fs.writeFile(
				path.join(workspace.work, 'server.yaml'),
				`port: 39471\nsite_groups:\n  - id: default\n    name: Default\n    index: 0\n`
			)
			await fs.mkdir(path.join(workspace.work, 'sites'), { recursive: true })

			const result = await run_cli(['new', 'demo', '--skip-dev'], { cwd: workspace.work, home: workspace.home })
			assert.equal(result.code, 0, result.output)
			assert.match(result.output, /isn't registered yet|primo dev/)
			assert.doesNotMatch(result.output, /Preview:/)
		} finally {
			await workspace.cleanup()
		}
	})
})
