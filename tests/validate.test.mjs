import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs/promises'
import path from 'path'
import { run_cli, make_workspace } from './helpers/run-cli.mjs'

/**
 * `primo validate` must reject any YAML file `primo build` would refuse to
 * parse. These tests pin that contract for the files build reads: page YAML,
 * block content.yaml, and page-type layout.yaml.
 */

async function write_file(root, rel, content) {
	const full = path.join(root, rel)
	await fs.mkdir(path.dirname(full), { recursive: true })
	await fs.writeFile(full, content)
}

/** Writes a minimal site that validates cleanly, then applies overrides. */
async function make_site(root, overrides = {}) {
	await write_file(root, 'pages/index.yaml', overrides.page ?? `name: Home
page_type: default
fields:
  seo_title: Home
sections:
  - block: hero
    content:
      headline: Hello
`)
	await write_file(root, 'blocks/hero/component.svelte', '<section><h1>{headline}</h1></section>\n')
	await write_file(root, 'blocks/hero/config.yaml', 'name: Hero\n')
	await write_file(root, 'blocks/hero/fields.yaml', '- name: headline\n  label: Headline\n  type: text\n')
	await write_file(root, 'blocks/hero/content.yaml', overrides.block_content ?? 'headline: Hello\n')
	await write_file(root, 'page-types/default/config.yaml', 'name: Default\n')
	await write_file(root, 'page-types/default/fields.yaml', '[]\n')
	await write_file(root, 'page-types/default/layout.yaml', overrides.layout ?? '# stub\n')
	await write_file(root, 'site/fields.yaml', '[]\n')
}

function run_validate(workspace) {
	return run_cli(['validate', '-d', workspace.work], { cwd: workspace.work, home: workspace.home })
}

describe('primo validate — YAML the build would reject', () => {
	test('passes a site whose YAML is valid', async () => {
		const workspace = await make_workspace()
		try {
			await make_site(workspace.work)
			const result = await run_validate(workspace)
			assert.equal(result.code, 0, result.output)
			assert.match(result.output, /All validations passed/)
		} finally {
			await workspace.cleanup()
		}
	})

	test('reports a syntax error in a page', async () => {
		const workspace = await make_workspace()
		try {
			await make_site(workspace.work, {
				page: `name: Home
page_type: default
fields:
  seo_description: Residential work: houses and interiors
sections:
  - block: hero
    content:
      headline: Hello
`
			})
			const result = await run_validate(workspace)
			assert.notEqual(result.code, 0, `expected a non-zero exit: ${result.output}`)
			assert.match(result.output, /pages\/index\.yaml/)
			assert.match(result.output, /Invalid YAML/i)
		} finally {
			await workspace.cleanup()
		}
	})

	test('reports a syntax error in a block content.yaml', async () => {
		const workspace = await make_workspace()
		try {
			await make_site(workspace.work, { block_content: 'headline: Hello: there\n' })
			const result = await run_validate(workspace)
			assert.notEqual(result.code, 0, `expected a non-zero exit: ${result.output}`)
			assert.match(result.output, /blocks\/hero\/content\.yaml/)
			assert.match(result.output, /Invalid YAML/i)
		} finally {
			await workspace.cleanup()
		}
	})

	test('reports a syntax error in a page-type layout.yaml', async () => {
		const workspace = await make_workspace()
		try {
			await make_site(workspace.work, { layout: 'header: [block: broken\n' })
			const result = await run_validate(workspace)
			assert.notEqual(result.code, 0, `expected a non-zero exit: ${result.output}`)
			assert.match(result.output, /page-types\/default\/layout\.yaml/)
			assert.match(result.output, /Invalid YAML/i)
		} finally {
			await workspace.cleanup()
		}
	})
})
