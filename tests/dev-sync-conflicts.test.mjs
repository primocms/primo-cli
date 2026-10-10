import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { sync_from_cms } from '../dist/commands/dev.js'
import { make_workspace } from './helpers/run-cli.mjs'
import { start_mock_server } from './helpers/mock-server.mjs'

async function fixture(t) {
	const workspace = await make_workspace()
	t.after(workspace.cleanup)
	const config = { name: 'Conflict fixture', site_id: path.basename(workspace.root) }
	const site = path.join(workspace.work, 'sites/demo')
	const exports = {
		'pages/index.yaml': 'name: Home\nsections: []\n',
		'blocks/hero/component.svelte': '<h1>Original</h1>\n'
	}
	for (const [file, contents] of Object.entries(exports)) {
		await fs.mkdir(path.dirname(path.join(site, file)), { recursive: true })
		await fs.writeFile(path.join(site, file), contents)
	}
	const server = await start_mock_server({ sites: [{ id: config.site_id }], export_files: exports })
	t.after(server.close)
	const sync = (mode = 'both') => sync_from_cms(site, server.url, config, { format: { enabled: false } }, workspace.work, { mode })
	await sync() // Establish a baseline shared by local files and the CMS.
	return { workspace, site, exports, sync }
}

test('two-way sync keeps an unresolved local edit across repeated CMS pulls', async t => {
	const { site, exports, sync } = await fixture(t)
	const file = path.join(site, 'blocks/hero/component.svelte')
	const local = '<h1>My local edit</h1>\n'
	await fs.writeFile(file, local)
	exports['blocks/hero/component.svelte'] = '<h1>CMS edit</h1>\n'
	for (let poll = 0; poll < 4; poll++) {
		await sync()
		assert.equal(await fs.readFile(file, 'utf8'), local, `local edit lost on poll ${poll + 1}`)
	}
	// Once both sides agree, subsequent CMS-only edits should sync normally.
	exports['blocks/hero/component.svelte'] = local
	await sync()
	exports['blocks/hero/component.svelte'] = '<h1>Later CMS edit</h1>\n'
	await sync()
	assert.equal(await fs.readFile(file, 'utf8'), exports['blocks/hero/component.svelte'])
})

test('two-way sync preserves an edited file when the CMS drops its whole directory', async t => {
	const { site, exports, sync } = await fixture(t)
	const file = path.join(site, 'blocks/hero/component.svelte')
	await fs.writeFile(file, '<h1>Keep this edit</h1>\n')
	delete exports['blocks/hero/component.svelte']
	for (let poll = 0; poll < 4; poll++) {
		await sync()
		assert.equal(await fs.readFile(file, 'utf8'), '<h1>Keep this edit</h1>\n')
	}
})

test('two-way sync preserves a new local file missing from every CMS export', async t => {
	const { site, sync } = await fixture(t)
	const file = path.join(site, 'pages/new.yaml')
	await fs.writeFile(file, 'name: New page\nsections: []\n')
	for (let poll = 0; poll < 4; poll++) {
		await sync()
		assert.equal(await fs.readFile(file, 'utf8'), 'name: New page\nsections: []\n')
	}
})

test('CMS-author mode still overwrites a local edit and backs it up', async t => {
	const { workspace, site, exports, sync } = await fixture(t)
	const file = path.join(site, 'blocks/hero/component.svelte')
	const local = '<h1>Local edit to back up</h1>\n'
	await fs.writeFile(file, local)
	exports['blocks/hero/component.svelte'] = '<h1>CMS wins</h1>\n'
	await sync('cms')
	assert.equal(await fs.readFile(file, 'utf8'), exports['blocks/hero/component.svelte'])
	const trash = path.join(workspace.work, '.primo/trash')
	const backups = await Promise.all((await fs.readdir(trash)).map(file => fs.readFile(path.join(trash, file), 'utf8')))
	assert.ok(backups.includes(local), 'the overwritten local edit must remain recoverable')
})
