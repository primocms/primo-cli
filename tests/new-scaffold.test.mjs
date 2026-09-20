import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs/promises'
import path from 'path'
import { run_cli, make_workspace } from './helpers/run-cli.mjs'

/**
 * `primo new` must not hand-author `_id`s — the server mints and writes them
 * back on first import (AGENTS.md). It should also ship the page-type
 * `head.svelte` and the `seo_*` fields it references, so a fresh site has a
 * real head out of the box.
 */
describe('primo new scaffold', () => {
	test('omits _id and includes the page-type head + SEO fields', async () => {
		const workspace = await make_workspace()
		try {
			await fs.writeFile(path.join(workspace.work, 'server.yaml'), 'port: 39475\n')
			await fs.mkdir(path.join(workspace.work, 'sites'), { recursive: true })

			const result = await run_cli(['new', 'demo', '--skip-dev'], { cwd: workspace.work, home: workspace.home })
			assert.equal(result.code, 0, result.output)

			const site = path.join(workspace.work, 'sites', 'demo')

			const offenders = []
			async function walk(dir) {
				for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
					const full = path.join(dir, entry.name)
					if (entry.isDirectory()) {
						await walk(full)
						continue
					}
					const text = await fs.readFile(full, 'utf-8')
					if (/^_id:/m.test(text)) offenders.push(path.relative(site, full))
				}
			}
			await walk(site)
			assert.deepEqual(offenders, [], `scaffold hand-authored an _id in: ${offenders.join(', ')}`)

			await fs.access(path.join(site, 'page-types', 'default', 'head.svelte'))
			const fields = await fs.readFile(path.join(site, 'page-types', 'default', 'fields.yaml'), 'utf-8')
			assert.match(fields, /name: seo_title/)
			assert.match(fields, /name: og_image/)
		} finally {
			await workspace.cleanup()
		}
	})
})
