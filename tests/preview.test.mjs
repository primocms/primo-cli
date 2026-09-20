import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs/promises'
import path from 'path'
import { run_cli, make_workspace } from './helpers/run-cli.mjs'

/**
 * `primo preview` rebuilds a site's published preview via a running dev server.
 * These cover the guards that run before any compile — the failure modes an
 * agent is most likely to hit. The compile-and-publish happy path needs a real
 * server and is covered by the e2e suite.
 */

const FREE_PORT = 39473

async function make_site(workspace, { site_id = 'aaaaaaaaaaaaaaa', sync } = {}) {
	const site_dir = path.join(workspace.work, 'sites', 'demo')
	await fs.mkdir(path.join(site_dir, '.primo'), { recursive: true })
	await fs.writeFile(path.join(workspace.work, 'server.yaml'), `port: ${FREE_PORT}\n`)
	if (site_id !== null) {
		await fs.writeFile(path.join(site_dir, 'site.yaml'), `name: Demo\nsite_id: ${site_id}\ngroup: default\n`)
	}
	if (sync) {
		await fs.writeFile(path.join(site_dir, '.primo', 'sync_status.json'), JSON.stringify(sync))
	}
	return site_dir
}

function run_preview(args, workspace) {
	return run_cli(['preview', ...args], { cwd: workspace.work, home: workspace.home })
}

describe('primo preview', () => {
	test('fails when there is no site.yaml', async () => {
		const workspace = await make_workspace()
		try {
			const site_dir = await make_site(workspace, { site_id: null })
			const result = await run_preview(['-d', site_dir], workspace)
			assert.notEqual(result.code, 0)
			assert.match(result.output, /No site\.yaml found/)
		} finally {
			await workspace.cleanup()
		}
	})

	test('refuses to build from a failed last import', async () => {
		const workspace = await make_workspace()
		try {
			const site_dir = await make_site(workspace, {
				sync: { ok: false, error: 'duplicate _id', failed_at: '2026-01-01T00:00:00Z' }
			})
			const result = await run_preview(['-d', site_dir], workspace)
			assert.notEqual(result.code, 0)
			assert.match(result.output, /push failed/)
			assert.match(result.output, /duplicate _id/)
		} finally {
			await workspace.cleanup()
		}
	})

	test('reports an unreachable server instead of compiling', async () => {
		const workspace = await make_workspace()
		try {
			const site_dir = await make_site(workspace)
			const result = await run_preview(['-d', site_dir], workspace)
			assert.notEqual(result.code, 0)
			assert.match(result.output, /Could not reach the Primo server/)
		} finally {
			await workspace.cleanup()
		}
	})

	test('--json emits an error object', async () => {
		const workspace = await make_workspace()
		try {
			const site_dir = await make_site(workspace)
			const result = await run_preview(['-d', site_dir, '--json'], workspace)
			assert.notEqual(result.code, 0)
			const parsed = JSON.parse(result.stdout)
			assert.equal(parsed.ok, false)
			assert.match(parsed.error, /Could not reach/)
		} finally {
			await workspace.cleanup()
		}
	})
})
