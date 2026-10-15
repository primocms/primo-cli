import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { import_site_files, sync_from_cms } from '../dist/commands/dev.js'
import { make_workspace } from './helpers/run-cli.mjs'
import { start_mock_server } from './helpers/mock-server.mjs'

async function fixture(t) {
	const workspace = await make_workspace()
	t.after(workspace.cleanup)
	const config = {
		name: 'Revision fixture',
		site_id: path.basename(workspace.root),
	}
	const site = path.join(workspace.work, 'sites/demo')
	const files = {
		'site.yaml': `name: Revision fixture\nsite_id: ${config.site_id}\n`,
		'pages/index.yaml': 'name: Home\nsections: []\n',
		'blocks/hero/component.svelte': '<h1>Original</h1>\n',
	}
	for (const [name, contents] of Object.entries(files)) {
		await fs.mkdir(path.dirname(path.join(site, name)), { recursive: true })
		await fs.writeFile(path.join(site, name), contents)
	}
	const revisions = {}
	let sequence = 0
	const server = await start_mock_server({
		sites: [{ id: config.site_id }],
		export_files: files,
		revisions,
		on_request: async ({ req, res, url, body }) => {
			if (
				req.method !== 'POST' ||
				url.pathname !== `/api/primo/import/${config.site_id}`
			)
				return false
			const form = await new Response(body, {
				headers: { 'Content-Type': req.headers['content-type'] },
			}).formData()
			const expected = form.get('expected_revision')
			res.setHeader('Content-Type', 'application/json')
			// Match localhost CMS behavior: an absent precondition permits the import.
			if (expected && expected !== revisions[config.site_id]) {
				res.writeHead(409)
				res.end('{"message":"CMS changed"}')
				return true
			}
			revisions[config.site_id] =
				'v1:' + (++sequence).toString(16).padStart(64, '0')
			res.end(
				JSON.stringify({
					success: true,
					revision: revisions[config.site_id],
					created_ids: {},
				}),
			)
			return true
		},
	})
	t.after(server.close)
	const importFiles = (expected) =>
		import_site_files(
			site,
			server.url,
			config,
			3000,
			{ format: { enabled: false } },
			false,
			workspace.work,
			expected,
		)
	return { workspace, site, config, files, server, revisions, importFiles }
}

test('local imports send the exact expected CMS revision and reject a later edit', async (t) => {
	const f = await fixture(t)
	const before = f.revisions[f.config.site_id]
	await f.importFiles(before)
	const next = f.revisions[f.config.site_id]
	assert.notEqual(next, before)
	f.revisions[f.config.site_id] = 'v1:' + 'b'.repeat(64)
	await assert.rejects(f.importFiles(next), /409/)
	assert.equal(
		f.revisions[f.config.site_id],
		'v1:' + 'b'.repeat(64),
		'rejected import overwrote CMS state',
	)
	const requests = f.server.requests.filter((r) =>
		r.path.includes('/api/primo/import/'),
	)
	const form = await new Response(requests.at(-1).body, {
		headers: { 'Content-Type': requests.at(-1).content_type },
	}).formData()
	assert.equal(form.get('expected_revision'), next)
})

test('two-way pulls fail closed when a previously verified server omits its export receipt', async (t) => {
	const f = await fixture(t)
	await f.importFiles(f.revisions[f.config.site_id])
	const legacy = await start_mock_server({
		sites: [{ id: f.config.site_id }],
		export_files: { 'pages/index.yaml': 'name: Changed\n' },
		legacy_export: true,
	})
	t.after(legacy.close)
	const original = await fs.readFile(
		path.join(f.site, 'pages/index.yaml'),
		'utf8',
	)
	await assert.rejects(
		sync_from_cms(
			f.site,
			legacy.url,
			f.config,
			{ format: { enabled: false } },
			f.workspace.work,
			{ mode: 'both' },
		),
		/no verified revision/,
	)
	assert.equal(
		await fs.readFile(path.join(f.site, 'pages/index.yaml'), 'utf8'),
		original,
	)
})
