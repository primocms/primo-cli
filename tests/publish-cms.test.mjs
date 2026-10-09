import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import net from 'node:net'
import fs from 'node:fs/promises'
import path from 'node:path'
import { make_workspace, run_cli } from './helpers/run-cli.mjs'

test(
	'real CMS: draft push, publish, unpublished edits, failed publication and retry',
	{
		skip: !process.env.PRIMO_TEST_CMS_BINARY,
		timeout: 90000
	},
	async (t) => {
		const workspace = await make_workspace()
		const reservation = net.createServer()
		await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve))
		const port = reservation.address().port
		await new Promise((resolve) => reservation.close(resolve))
		const server = `http://127.0.0.1:${port}`
		let logs = ''
		const cms = spawn(process.env.PRIMO_TEST_CMS_BINARY, ['serve', '--http', `127.0.0.1:${port}`, '--dir', path.join(workspace.root, 'pb_data')], {
			env: { ...process.env, PRIMO_DEV_MODE: '1', PRIMO_AUTHOR_MODE: 'both', PRIMO_ENABLE_USAGE_STATS: 'false' },
			stdio: ['ignore', 'pipe', 'pipe']
		})
		cms.stdout.on('data', (data) => {
			logs += data
		})
		cms.stderr.on('data', (data) => {
			logs += data
		})
		t.after(async () => {
			if (cms.exitCode === null) {
				const stopped = new Promise((resolve) => cms.once('close', resolve))
				cms.kill('SIGTERM')
				await stopped
			}
			await workspace.cleanup()
		})
		let ready = false
		for (let i = 0; i < 100; i++) {
			try {
				if ((await fetch(`${server}/api/health`)).ok) {
					ready = true
					break
				}
			} catch {}
			if (cms.exitCode !== null) break
			await delay(100)
		}
		assert.ok(ready, logs)
		const id = 'publicationdemo'
		const dir = path.join(workspace.work, 'sites/demo')
		const component = path.join(dir, 'blocks/hero/component.svelte')
		const page = path.join(dir, 'pages/index.yaml')
		const files = {
			'server.yaml': `server: ${server}\n`,
			'sites/demo/site.yaml': `name: Demo\nsite_id: ${id}\nserver: ${server}\n`,
			'sites/demo/blocks/hero/config.yaml': 'name: Hero\n',
			'sites/demo/blocks/hero/component.svelte': '<h1>{heading}</h1>\n<style>h1 { color: red; }</style>\n',
			'sites/demo/blocks/hero/fields.yaml': '- name: heading\n  type: text\n',
			'sites/demo/page-types/default/config.yaml': 'name: Default\nallowed_blocks: [hero]\n',
			'sites/demo/pages/index.yaml': 'name: Home\npage_type: Default\nsections:\n  - block: hero\n    content:\n      heading: Original headline\n'
		}
		for (const [file, value] of Object.entries(files)) {
			await fs.mkdir(path.dirname(path.join(workspace.work, file)), { recursive: true })
			await fs.writeFile(path.join(workspace.work, file), value)
		}
		const cli = (args) => run_cli(args, { cwd: workspace.work, home: workspace.home, timeout_ms: 30000 })
		const bootstrap = await cli(['push', '--json'])
		assert.equal(bootstrap.code, 0, bootstrap.output)
		assert.equal(JSON.parse(bootstrap.stdout).results[0].publish.state, 'not_requested')
		const { token } = await fetch(`${server}/api/primo/dev-auth`, { method: 'POST' }).then((r) => r.json())
		assert.ok(token)
		const auth = { Authorization: `Bearer ${token}` }
		const publicHTML = () => fetch(`${server}/?_site=${id}`).then((r) => r.text())
		const status = () => fetch(`${server}/api/primo/publication/${id}`, { headers: auth }).then((r) => r.json())
		assert.equal((await status()).state, 'never_published')
		const published = await cli(['publish', '--only', 'demo', '--token', token, '--json'])
		assert.equal(published.code, 0, published.output)
		assert.equal(JSON.parse(published.stdout).results[0].publish.state, 'succeeded')
		assert.match(await publicHTML(), /Original headline/)
		const originalRevision = (await status()).published_revision
		await fs.writeFile(page, files['sites/demo/pages/index.yaml'].replace('Original headline', 'Draft headline'))
		const draft = await cli(['push', '--only', 'demo', '--token', token, '--json'])
		assert.equal(draft.code, 0, draft.output)
		assert.equal((await status()).state, 'behind')
		assert.match(await publicHTML(), /Original headline/)
		assert.doesNotMatch(await publicHTML(), /Draft headline/)
		const combined = await cli(['push', '--only', 'demo', '--token', token, '--publish', '--json'])
		assert.equal(combined.code, 0, combined.output)
		const result = JSON.parse(combined.stdout).results[0]
		assert.equal(result.push.state, 'succeeded')
		assert.equal(result.publish.state, 'succeeded')
		assert.equal(result.push.revision, result.publish.revision)
		assert.notEqual(result.push.revision, originalRevision)
		assert.match(await publicHTML(), /Draft headline/)
		// Importing source saves a draft; only publication evaluates the Svelte code.
		await fs.writeFile(component, '<h1>{heading}</h1><script>const broken = ;</script>')
		const failure = await cli(['push', '--only', 'demo', '--token', token, '--publish', '--json'])
		assert.equal(failure.code, 1, failure.output)
		const failed = JSON.parse(failure.stdout).results[0]
		assert.equal(failed.push.state, 'succeeded', failure.output)
		assert.equal(failed.publish.state, 'failed', failure.output)
		assert.match(await publicHTML(), /Draft headline/)
		assert.equal((await status()).state, 'failed')
		// Repair the hosted draft through CMS APIs and retry publication alone.
		const symbols = await fetch(`${server}/api/collections/site_symbols/records?filter=${encodeURIComponent(`site="${id}"`)}`, { headers: auth }).then((r) => r.json())
		const repair = await fetch(`${server}/api/collections/site_symbols/records/${symbols.items[0].id}`, {
			method: 'PATCH',
			headers: { ...auth, 'Content-Type': 'application/json' },
			body: JSON.stringify({ js: '', html: '<h1>Repaired hosted draft</h1>' })
		})
		assert.equal(repair.status, 200, await repair.text())
		const retry = await cli(['publish', '--only', 'demo', '--token', token, '--json'])
		assert.equal(retry.code, 0, retry.output)
		assert.match(await publicHTML(), /Repaired hosted draft/)
		assert.equal((await status()).state, 'current')
		const baseline = JSON.parse(await fs.readFile(path.join(dir, '.primo/sync-state.json'), 'utf8'))
		assert.equal(Object.values(baseline)[0].revision, failed.push.revision, 'publication must not advance the local push baseline across a CMS edit')
	}
)
