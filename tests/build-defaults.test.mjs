import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs/promises'
import path from 'path'
import { run_cli, make_workspace } from './helpers/run-cli.mjs'

/**
 * `primo build` regressions:
 *
 * - A page section with no content of its own must fall back to the block's
 *   `content.yaml` defaults (layout sections already do), instead of rendering
 *   an empty section.
 * - Generated head bindings must not trigger Svelte's
 *   `state_referenced_locally` warning ("captures the initial value").
 */

async function write_file(root, rel, content) {
	const full = path.join(root, rel)
	await fs.mkdir(path.dirname(full), { recursive: true })
	await fs.writeFile(full, content)
}

async function make_site(root) {
	await write_file(root, 'site.yaml', 'name: Fixture\nsite_id: fixture00000001\ngroup: default\n')
	await write_file(root, 'site/fields.yaml', '- name: seo_title\n  label: SEO title\n  type: text\n')
	await write_file(root, 'site/content.yaml', 'seo_title: Fixture Title\n')
	await write_file(root, 'site/head.svelte', '<title>{seo_title}</title>\n')
	await write_file(root, 'blocks/hero/config.yaml', 'name: Hero\n')
	await write_file(root, 'blocks/hero/fields.yaml', '- name: headline\n  label: Headline\n  type: text\n')
	await write_file(root, 'blocks/hero/content.yaml', 'headline: Default Headline\n')
	await write_file(root, 'blocks/hero/component.svelte', '<script>let { headline = "" } = $props()</script>\n<section><h1>{headline}</h1></section>\n')
	await write_file(root, 'page-types/default/config.yaml', 'name: Default\n')
	await write_file(root, 'page-types/default/fields.yaml', '[]\n')
	await write_file(root, 'page-types/default/layout.yaml', '# stub\n')
	// Section intentionally carries no content of its own.
	await write_file(
		root,
		'pages/index.yaml',
		'name: Home\npage_type: default\nfields: {}\nsections:\n  - block: hero\n'
	)
}

describe('primo build', () => {
	test('page sections fall back to block defaults and head bindings stay quiet', async () => {
		const workspace = await make_workspace()
		try {
			const site_dir = path.join(workspace.work, 'site')
			const out_dir = path.join(workspace.work, 'out')
			await make_site(site_dir)

			const result = await run_cli(['build', '-d', site_dir, '-o', out_dir], {
				cwd: workspace.work,
				home: workspace.home
			})
			assert.equal(result.code, 0, result.output)

			const html = await fs.readFile(path.join(out_dir, 'index.html'), 'utf8')
			// E: the block default renders even though the section had no content.
			assert.match(html, /Default Headline/, 'section did not fall back to block defaults')
			// The head field still renders.
			assert.match(html, /Fixture Title/)

			// H: no state_referenced_locally warning from the generated head bindings.
			assert.doesNotMatch(result.output, /captures the initial value/i, `build emitted a Svelte warning:\n${result.output}`)
		} finally {
			await workspace.cleanup()
		}
	})

	test('exits non-zero when a page cannot render', async () => {
		const workspace = await make_workspace()
		try {
			const site_dir = path.join(workspace.work, 'site')
			const out_dir = path.join(workspace.work, 'out')
			await make_site(site_dir)
			// A component that throws at render time (undeclared identifier).
			await write_file(site_dir, 'blocks/hero/component.svelte', '<section><h1>{this_does_not_exist}</h1></section>\n')

			const result = await run_cli(['build', '-d', site_dir, '-o', out_dir], {
				cwd: workspace.work,
				home: workspace.home
			})
			assert.notEqual(result.code, 0, `a failed page must fail the build, got exit 0:\n${result.output}`)
			assert.match(result.output, /failed page/i)
		} finally {
			await workspace.cleanup()
		}
	})
})
