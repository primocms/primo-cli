import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs/promises'
import path from 'path'
import { run_cli, make_workspace } from './helpers/run-cli.mjs'
import { start_mock_server } from './helpers/mock-server.mjs'

/**
 * `primo status` reads the workspace from disk plus a health probe — it must
 * not need the auth-gated CMS API. These tests cover the workspace shape, the
 * per-site sync state, liveness, and the not-a-workspace error.
 */

async function make_workspace_with_sites(port = 39472) {
	const workspace = await make_workspace()
	const sites = path.join(workspace.work, 'sites')
	await fs.mkdir(path.join(sites, 'alpha', '.primo'), { recursive: true })
	await fs.mkdir(path.join(sites, 'bravo'), { recursive: true })
	// A folder without site.yaml is not a site and must be ignored.
	await fs.mkdir(path.join(sites, 'notes'), { recursive: true })

	await fs.writeFile(path.join(workspace.work, 'server.yaml'), `port: ${port}\nsite_groups:\n  - id: g1\n    name: Group One\n    index: 0\n`)
	await fs.writeFile(path.join(sites, 'alpha', 'site.yaml'), 'name: Alpha\nsite_id: aaaaaaaaaaaaaaa\ngroup: g1\n')
	await fs.writeFile(
		path.join(sites, 'alpha', '.primo', 'sync_status.json'),
		JSON.stringify({ ok: false, error: 'duplicate _id', failed_at: '2026-01-01T00:00:00Z' })
	)
	await fs.writeFile(path.join(sites, 'bravo', 'site.yaml'), 'name: Bravo\nsite_id: bbbbbbbbbbbbbbb\ngroup: g1\n')

	return workspace
}

function run_status(args, workspace) {
	return run_cli(['status', ...args], { cwd: workspace.work, home: workspace.home })
}

describe('primo status', () => {
	test('--json reports workspace, sites, and sync state without the CMS API', async () => {
		const workspace = await make_workspace_with_sites()
		try {
			const result = await run_status(['--json'], workspace)
			assert.equal(result.code, 0, result.output)
			const parsed = JSON.parse(result.stdout)

			assert.equal(parsed.port, 39472)
			assert.equal(parsed.running, false)
			assert.equal(parsed.groups.length, 1)

			const slugs = parsed.sites.map((site) => site.slug)
			assert.deepEqual(slugs, ['alpha', 'bravo'], `expected alpha and bravo only, got ${JSON.stringify(slugs)}`)

			const alpha = parsed.sites.find((site) => site.slug === 'alpha')
			assert.equal(alpha.group, 'g1')
			assert.equal(alpha.sync.ok, false)
			assert.match(alpha.sync.error, /duplicate/)

			const bravo = parsed.sites.find((site) => site.slug === 'bravo')
			assert.equal(bravo.sync, null)
		} finally {
			await workspace.cleanup()
		}
	})

	test('reports the server as running when the health endpoint answers', async () => {
		const server = await start_mock_server()
		const workspace = await make_workspace_with_sites(Number(new URL(server.url).port))
		try {
			const result = await run_status(['--json'], workspace)
			assert.equal(result.code, 0, result.output)
			const parsed = JSON.parse(result.stdout)
			assert.equal(parsed.running, true)
		} finally {
			await server.close()
			await workspace.cleanup()
		}
	})

	test('fails clearly outside a workspace', async () => {
		const workspace = await make_workspace()
		try {
			const result = await run_status([], workspace)
			assert.notEqual(result.code, 0)
			assert.match(result.output, /No server\.yaml found/)
		} finally {
			await workspace.cleanup()
		}
	})
})
