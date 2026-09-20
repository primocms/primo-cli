import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs/promises'
import net from 'node:net'
import path from 'path'
import { run_cli, make_workspace } from './helpers/run-cli.mjs'
import { start_mock_server } from './helpers/mock-server.mjs'

/**
 * `primo status` reads the workspace from disk plus a health probe — it must
 * not need the auth-gated CMS API. These tests cover the workspace shape, the
 * per-site sync state, liveness, and the not-a-workspace error.
 */

/** An ephemeral port nothing is listening on, so the health probe fails. */
async function free_port() {
	return await new Promise((resolve, reject) => {
		const probe = net.createServer()
		probe.once('error', reject)
		probe.listen(0, '127.0.0.1', () => {
			const address = probe.address()
			const port = typeof address === 'object' && address ? address.port : 0
			probe.close(() => resolve(port))
		})
	})
}

async function make_workspace_with_sites(port) {
	const chosen_port = port ?? (await free_port())
	const workspace = await make_workspace()
	const sites = path.join(workspace.work, 'sites')
	await fs.mkdir(path.join(sites, 'alpha', '.primo'), { recursive: true })
	await fs.mkdir(path.join(sites, 'bravo'), { recursive: true })
	// A folder without site.yaml is not a site and must be ignored.
	await fs.mkdir(path.join(sites, 'notes'), { recursive: true })

	await fs.writeFile(path.join(workspace.work, 'server.yaml'), `port: ${chosen_port}\nsite_groups:\n  - id: g1\n    name: Group One\n    index: 0\n`)
	await fs.writeFile(path.join(sites, 'alpha', 'site.yaml'), 'name: Alpha\nsite_id: aaaaaaaaaaaaaaa\ngroup: g1\n')
	await fs.writeFile(
		path.join(sites, 'alpha', '.primo', 'sync_status.json'),
		JSON.stringify({ ok: false, error: 'duplicate _id', failed_at: '2026-01-01T00:00:00Z' })
	)
	await fs.writeFile(path.join(sites, 'bravo', 'site.yaml'), 'name: Bravo\nsite_id: bbbbbbbbbbbbbbb\ngroup: g1\n')

	return { ...workspace, port: chosen_port }
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

			assert.equal(parsed.port, workspace.port)
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

	test('marks which sites are registered in the running CMS', async () => {
		const server = await start_mock_server({
			sites: [{ id: 'aaaaaaaaaaaaaaa', name: 'Alpha' }],
			site_groups: [{ id: 'g1', name: 'Group One' }]
		})
		const workspace = await make_workspace_with_sites(Number(new URL(server.url).port))
		try {
			const result = await run_status(['--json'], workspace)
			assert.equal(result.code, 0, result.output)
			const parsed = JSON.parse(result.stdout)

			assert.equal(parsed.running, true)
			assert.equal(parsed.cms.sites.length, 1)

			assert.equal(parsed.sites.find((site) => site.slug === 'alpha').in_cms, true)
			assert.equal(parsed.sites.find((site) => site.slug === 'bravo').in_cms, false)
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
