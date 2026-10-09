import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { start_mock_server } from './helpers/mock-server.mjs'
import { make_workspace, run_cli } from './helpers/run-cli.mjs'
import { save_baseline } from '../dist/utils/push-guard.js'

const revision = 'v1:' + 'a'.repeat(64)
const sites = ['alpha', 'beta'].map((name) => ({ id: name.padEnd(15, '0'), name, host: `${name}.example.com` }))
async function fixture(t, config = {}) {
	const workspace = await make_workspace()
	const server = await start_mock_server({ sites, publication: true, ...config })
	t.after(async () => {
		await server.close()
		await workspace.cleanup()
	})
	await fs.writeFile(path.join(workspace.work, 'server.yaml'), `server: ${server.url}\n`)
	for (const site of sites) {
		const dir = path.join(workspace.work, 'sites', site.name)
		await fs.mkdir(path.join(dir, 'pages'), { recursive: true })
		await fs.writeFile(path.join(dir, 'site.yaml'), `name: ${site.name}\nsite_id: ${site.id}\nserver: ${server.url}\n`)
		await fs.writeFile(path.join(dir, 'pages/index.yaml'), 'name: Home\n')
		await save_baseline(dir, server.url, site.id, revision)
	}
	const run = (...args) => run_cli([args[0], '--token', 'test-token', ...args.slice(1)], { cwd: workspace.work, home: workspace.home })
	return { workspace, server, run }
}

test('plain push saves drafts and prints the scoped publication command without publishing', async (t) => {
	const { server, run } = await fixture(t)
	const result = await run('push', '--only', 'alpha')
	assert.equal(result.code, 0, result.output)
	assert.match(result.output, /Publication was not requested/)
	assert.match(result.output, /primo publish --dir/)
	assert.equal(server.matching(/\/publication\//).length, 0)
})

test('push --publish reports each phase separately and waits until all imports, including library, finish', async (t) => {
	const { server, workspace, run } = await fixture(t)
	await fs.mkdir(path.join(workspace.work, 'library'), { recursive: true })
	await fs.writeFile(path.join(workspace.work, 'library/groups.yaml'), '[]\n')
	await save_baseline(workspace.work, server.url, 'library', revision)
	const result = await run('push', '--publish', '--json')
	assert.equal(result.code, 0, result.output)
	const parsed = JSON.parse(result.stdout)
	assert.equal(parsed.ok, true)
	assert.equal(parsed.results.length, 3)
	assert.equal(parsed.results[2].publish.state, 'not_requested')
	for (const site of parsed.results.slice(0, 2)) {
		assert.equal(site.push.state, 'succeeded')
		assert.equal(site.publish.state, 'succeeded')
		assert.equal(site.push.revision, site.publish.revision)
	}
	const imports = server.requests.map((r, i) => (r.path.includes('/import') ? i : -1)).filter((i) => i >= 0)
	const firstPublication = server.requests.findIndex((r) => r.path.includes('/publication/'))
	assert.ok(firstPublication > Math.max(...imports))
	assert.ok(server.matching(/\/publication\/.*\/activate/).every((r) => r.authorization === 'Bearer test-token'))
	assert.doesNotMatch(result.stdout, /test-token/)
})

test('publish uses hosted authentication, uploads no local files and does not invoke dev-auth', async (t) => {
	const { server, run } = await fixture(t)
	const result = await run('publish', '--only', 'alpha', '--json')
	assert.equal(result.code, 0, result.output)
	assert.equal(JSON.parse(result.stdout).results[0].publish.state, 'succeeded')
	assert.equal(server.matching(/\/import/).length, 0)
	assert.equal(server.matching('/api/primo/dev-auth').length, 0)
	assert.equal(server.matching('/api/primo/generate').length, 0)
	assert.ok(server.matching(/\/collections\//).every((r) => r.authorization === 'test-token'))
})

test('failed publication preserves push success and baseline; standalone publication retries without pushing', async (t) => {
	let fail = true
	const { server, workspace, run } = await fixture(t, {
		on_request: ({ res, url, publications }) => {
			if (fail && url.pathname.endsWith('/activate')) {
				const state = publications[sites[0].id]
				state.state = 'failed'
				state.attempt.state = 'failed'
				state.attempt.error = 'Generation failed'
				res.writeHead(500, { 'Content-Type': 'application/json' })
				res.end(JSON.stringify({ message: 'Generation failed' }))
				return true
			}
		}
	})
	const result = await run('push', '--only', 'alpha', '--publish', '--json')
	assert.equal(result.code, 1, result.output)
	const target = JSON.parse(result.stdout).results[0]
	assert.equal(target.push.state, 'succeeded')
	assert.equal(target.publish.state, 'failed')
	assert.match(target.publish.retry_command, /primo publish/)
	const baseline = JSON.parse(await fs.readFile(path.join(workspace.work, 'sites/alpha/.primo/sync-state.json'), 'utf8'))
	assert.equal(Object.values(baseline)[0].revision, server.revisions[sites[0].id])
	const imports = server.matching(/\/import/).length
	fail = false
	const retried = await run('publish', '--only', 'alpha', '--json')
	assert.equal(retried.code, 0, retried.output)
	assert.equal(server.matching(/\/import/).length, imports)
})

test('a lost activation response is reconciled with authoritative status', async (t) => {
	const { run } = await fixture(t, {
		on_request: ({ res, url, publications }) => {
			if (url.pathname.endsWith('/activate')) {
				const state = publications[sites[0].id]
				state.attempt.state = 'succeeded'
				state.published_revision = state.attempt.revision
				state.state = 'current'
				res.destroy()
				return true
			}
		}
	})
	const result = await run('publish', '--only', 'alpha', '--json')
	assert.equal(result.code, 0, result.output)
	assert.equal(JSON.parse(result.stdout).results[0].publish.state, 'succeeded')
})

test('an ambiguous activation reports unknown and never records failure', async (t) => {
	let activated = false
	const { server, run } = await fixture(t, {
		on_request: ({ req, res, url }) => {
			if (url.pathname.endsWith('/activate')) {
				activated = true
				res.destroy()
				return true
			}
			if (activated && req.method === 'GET' && url.pathname.includes('/publication/')) {
				res.destroy()
				return true
			}
		}
	})
	const result = await run('publish', '--only', 'alpha', '--json')
	assert.equal(result.code, 1, result.output)
	assert.equal(JSON.parse(result.stdout).results[0].publish.state, 'unknown')
	assert.equal(server.matching(/\/fail$/).length, 0)
})

test('failed push prevents publication of all targets and reports unattempted targets', async (t) => {
	const { server, run } = await fixture(t, {
		on_request: ({ req, url, revisions }) => {
			if (req.method === 'POST' && url.pathname === `/api/primo/import/${sites[1].id}`) revisions[sites[1].id] = 'v1:' + 'b'.repeat(64)
		}
	})
	const result = await run('push', '--publish', '--json')
	assert.equal(result.code, 1, result.output)
	const parsed = JSON.parse(result.stdout)
	assert.equal(parsed.results[0].push.state, 'succeeded')
	assert.equal(parsed.results[0].publish.state, 'not_attempted')
	assert.equal(parsed.results[1].push.state, 'failed')
	assert.equal(server.matching(/\/publication\//).length, 0)
})

test('preview and dry-run cannot publish, even in non-interactive JSON mode', async (t) => {
	const { server, run } = await fixture(t)
	for (const flag of ['--preview', '--dry-run']) {
		const result = await run('push', flag, '--publish', '--json')
		assert.equal(result.code, 1, result.output)
		assert.match(JSON.parse(result.stdout).error, /cannot be combined/)
	}
	assert.equal(server.requests.length, 0)
})

test('hosted status reports behind and unknown without falling back to local state', async (t) => {
	const { server, run } = await fixture(t)
	const published = await run('publish', '--only', 'alpha')
	assert.equal(published.code, 0, published.output)
	server.revisions[sites[0].id] = 'v1:' + 'f'.repeat(64)
	const result = await run('status', '--hosted', '--only', 'alpha', '--json')
	assert.equal(result.code, 0, result.output)
	const publication = JSON.parse(result.stdout).results[0].publication
	assert.equal(publication.state, 'behind')
	assert.equal(publication.unpublished_changes, true)
	assert.equal(publication.published_revision, revision)
})

test('an older CMS leaves the successful push saved and reports unsupported publication', async (t) => {
	const { run } = await fixture(t, { publication: false })
	const result = await run('push', '--only', 'alpha', '--publish', '--json')
	assert.equal(result.code, 1, result.output)
	const target = JSON.parse(result.stdout).results[0]
	assert.equal(target.push.state, 'succeeded')
	assert.equal(target.publish.state, 'failed')
	assert.match(target.publish.error, /Update the CMS/)
	const status = await run('status', '--hosted', '--only', 'alpha', '--json')
	assert.equal(status.code, 1, status.output)
	assert.equal(JSON.parse(status.stdout).results[0].publication.state, 'unknown')
})

test('a shared library upload failure leaves every publication unattempted', async (t) => {
	const { server, workspace, run } = await fixture(t, {
		on_request: ({ req, res, url }) => {
			if (req.method === 'POST' && url.pathname === '/api/primo/import-library') {
				res.writeHead(500, { 'Content-Type': 'application/json' })
				res.end(JSON.stringify({ message: 'Library import failed' }))
				return true
			}
		}
	})
	await fs.mkdir(path.join(workspace.work, 'library'), { recursive: true })
	await fs.writeFile(path.join(workspace.work, 'library/groups.yaml'), '[]\n')
	await save_baseline(workspace.work, server.url, 'library', revision)
	const result = await run('push', '--publish', '--json')
	assert.equal(result.code, 1, result.output)
	const parsed = JSON.parse(result.stdout)
	assert.equal(parsed.results[2].push.state, 'failed')
	assert.equal(parsed.results[2].push.error_code, 'push_failed')
	assert.ok(parsed.results.slice(0, 2).every((item) => item.push.state === 'succeeded' && item.publish.state === 'not_attempted'))
	assert.equal(server.matching(/\/publication\//).length, 0)
})

test('publication failure on one site still reports successful publication of another', async (t) => {
	const { run } = await fixture(t, {
		on_request: ({ res, url, publications }) => {
			if (url.pathname === `/api/primo/publication/${sites[0].id}/${publications[sites[0].id]?.attempt.id}/activate`) {
				const state = publications[sites[0].id]
				state.state = 'failed'
				state.attempt.state = 'failed'
				state.attempt.error = 'alpha failed'
				res.writeHead(500, { 'Content-Type': 'application/json' })
				res.end(JSON.stringify({ message: 'alpha failed' }))
				return true
			}
		}
	})
	const result = await run('push', '--publish', '--json')
	assert.equal(result.code, 1, result.output)
	const parsed = JSON.parse(result.stdout)
	assert.equal(parsed.results[0].publish.state, 'failed')
	assert.equal(parsed.results[1].publish.state, 'succeeded')
})

test('standalone publish reads stored login tokens and the workspace server fallback', async (t) => {
	const { workspace, server } = await fixture(t)
	const dir = path.join(workspace.work, 'sites/alpha')
	await fs.writeFile(path.join(dir, 'site.yaml'), `name: Alpha\nsite_id: ${sites[0].id}\n`)
	await workspace.write_token(server.url, 'stored-token')
	const result = await run_cli(['publish', '--dir', dir, '--json'], { cwd: workspace.work, home: workspace.home })
	assert.equal(result.code, 0, result.output)
	assert.ok(server.matching(/\/publication\//).every((r) => r.authorization === 'Bearer stored-token'))
	assert.doesNotMatch(result.stdout, /stored-token/)
})

test('push and standalone publication agree on explicit per-site servers', async (t) => {
	const { workspace, server, run } = await fixture(t)
	const alternate = await start_mock_server({ sites: [sites[0]], publication: true })
	t.after(() => alternate.close())
	const dir = path.join(workspace.work, 'sites/alpha')
	await fs.writeFile(path.join(dir, 'site.yaml'), `name: Alpha\nsite_id: ${sites[0].id}\nserver: ${alternate.url}\n`)
	await save_baseline(dir, alternate.url, sites[0].id, revision)
	const result = await run('push', '--only', 'alpha', '--publish', '--json')
	assert.equal(result.code, 0, result.output)
	assert.equal(JSON.parse(result.stdout).results[0].server, alternate.url)
	assert.equal(server.requests.length, 0)
	const publish = await run('publish', '--only', 'alpha', '--json')
	assert.equal(publish.code, 0, publish.output)
	assert.equal(JSON.parse(publish.stdout).results[0].server, alternate.url)
})

test('dry-run JSON lists selected targets without sending requests', async (t) => {
	const { server, run } = await fixture(t)
	const result = await run('push', '--only', 'alpha', '--dry-run', '--json')
	assert.equal(result.code, 0, result.output)
	const parsed = JSON.parse(result.stdout)
	assert.equal(parsed.results.length, 1)
	assert.equal(parsed.results[0].target, 'alpha')
	assert.equal(parsed.results[0].push.state, 'not_attempted')
	assert.equal(parsed.results[0].publish.state, 'not_requested')
	assert.equal(server.requests.length, 0)
})

test('explicit server and site publish hosted content without a local checkout', async (t) => {
	const { workspace, server } = await fixture(t)
	const result = await run_cli(['publish', server.url, '--site', sites[0].id, '--token', 'test-token', '--json'], { cwd: workspace.home, home: workspace.home })
	assert.equal(result.code, 0, result.output)
	assert.equal(JSON.parse(result.stdout).results[0].publish.state, 'succeeded')
	const status = await run_cli(['status', '--server', server.url, '--site', sites[0].id, '--token', 'test-token', '--json'], { cwd: workspace.home, home: workspace.home })
	assert.equal(status.code, 0, status.output)
	assert.equal(JSON.parse(status.stdout).results[0].publication.state, 'current')
})
