import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import { make_workspace, run_cli } from './helpers/run-cli.mjs'

test('an empty module script does not suppress an interactive instance script', async t => {
	const workspace = await make_workspace(); t.after(workspace.cleanup)
	const site = path.join(workspace.work, 'site')
	const files = {
		'site.yaml': 'name: Hydration\nsite_id: fixture00000001\n',
		'site/head.svelte': '<title>Hydration</title>',
		'page-types/default/config.yaml': 'name: Default\n',
		'page-types/default/fields.yaml': '[]\n',
		'page-types/default/layout.yaml': '{}\n',
		'blocks/counter/config.yaml': 'name: Counter\n',
		'blocks/counter/fields.yaml': '[]\n',
		'blocks/counter/component.svelte': '<script module></script>\n<script>let count = $state(0)</script>\n<button onclick={() => count++}>{count}</button>\n',
		'pages/index.yaml': 'name: Home\npage_type: default\nsections:\n  - block: counter\n'
	}
	for (const [name, content] of Object.entries(files)) {
		await fs.mkdir(path.dirname(path.join(site, name)), { recursive: true })
		await fs.writeFile(path.join(site, name), content)
	}
	const out = path.join(workspace.work, 'out')
	const result = await run_cli(['build', '-d', site, '-o', out], { cwd: workspace.work, home: workspace.home })
	assert.equal(result.code, 0, result.output)
	const html = await fs.readFile(path.join(out, 'index.html'), 'utf8')
	assert.match(html, /import\('\/_symbols\/counter\.js'\)/)
	await fs.access(path.join(out, '_symbols/counter.js'))
})
