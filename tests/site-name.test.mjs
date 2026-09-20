import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs/promises'
import path from 'path'
import { run_cli, make_workspace } from './helpers/run-cli.mjs'

/**
 * `primo new` derives the site's display name from the folder name. Each
 * hyphen-separated word should be capitalised (`harrow-stone` → `Harrow
 * Stone`), and a dotted hostname should use its first label.
 */

const FREE_PORT = 39471

async function run_new(workspace, name) {
	await fs.mkdir(path.join(workspace.work, 'sites'), { recursive: true })
	const result = await run_cli(['new', name, '--skip-dev'], { cwd: workspace.work, home: workspace.home })
	assert.equal(result.code, 0, result.output)
	const site_yaml = await fs.readFile(path.join(workspace.work, 'sites', name, 'site.yaml'), 'utf8')
	const match = site_yaml.match(/^name:\s*(.+)$/m)
	return match ? match[1].trim() : site_yaml
}

describe('primo new — display name', () => {
	test('title-cases each word of a hyphenated name', async () => {
		const workspace = await make_workspace()
		try {
			await fs.writeFile(
				path.join(workspace.work, 'server.yaml'),
				`port: ${FREE_PORT}\nsite_groups:\n  - id: default\n    name: Default\n    index: 0\n`
			)
			assert.equal(await run_new(workspace, 'harrow-stone'), 'Harrow Stone')
			assert.equal(await run_new(workspace, 'my-cool-site'), 'My Cool Site')
		} finally {
			await workspace.cleanup()
		}
	})

	test('uses the first label of a dotted hostname', async () => {
		const workspace = await make_workspace()
		try {
			await fs.writeFile(
				path.join(workspace.work, 'server.yaml'),
				`port: ${FREE_PORT}\nsite_groups:\n  - id: default\n    name: Default\n    index: 0\n`
			)
			assert.equal(await run_new(workspace, 'example.com'), 'Example')
		} finally {
			await workspace.cleanup()
		}
	})
})
