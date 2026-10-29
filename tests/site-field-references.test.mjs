import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { run_cli, make_workspace } from './helpers/run-cli.mjs'

for (const mode of ['key', 'id']) {
 test(`static build resolves ${mode} navigation/footer references and reports broken references`, async (t) => {
  const workspace = await make_workspace()
  t.after(() => workspace.cleanup())
  const site = path.join(workspace.work, 'site')
  const output = path.join(workspace.work, 'out')
  async function write(relative, content) {
   const file = path.join(site, relative)
   await fs.mkdir(path.dirname(file), { recursive: true })
   await fs.writeFile(file, content)
  }
  await write('site.yaml', 'name: Shared values\nsite_id: fixture00000001\n')
  await write('site/fields.yaml', `- name: nav_links
  _id: nav000000000001
  type: repeater
  subfields:
    - name: link
      type: link
- name: footer_groups
  _id: footer000000001
  type: repeater
  subfields:
    - name: title
      type: text
    - name: links
      type: repeater
      subfields:
        - name: link
          type: link
- name: notice
  _id: notice000000001
  type: text
- name: count
  _id: count0000000001
  type: number
- name: enabled
  _id: enabled00000001
  type: switch
- name: nav000000000001
  _id: decoy0000000001
  type: text
`)
  const content = `nav_links:
  - link: { page: about0000000001, label: About }
footer_groups:
  - title: Explore
    links:
      - link: { url: 'https://example.com/help', label: Help }
notice: Shared copyright
count: 0
enabled: false
`
  await write('site/content.yaml', content)
  const names = ['nav_links', 'footer_groups', 'notice', 'count', 'enabled']
  const ids = ['nav000000000001', 'footer000000001', 'notice000000001', 'count0000000001', 'enabled00000001']
  const nested = `- name: wrapper\n  type: group\n  subfields:\n    - name: shared_notice\n      type: site-field\n      config: { field: ${mode === 'key' ? 'notice' : ids[2]} }\n`
  const fields = names.map((name, index) => `- name: shared_${name}\n  type: site-field\n  config: { field: ${mode === 'key' ? name : ids[index]} }\n`).join('') + nested
  await write('blocks/shared/content.yaml', 'wrapper: {}\n')
  await write('blocks/shared/config.yaml', 'name: Shared\n')
  await write('blocks/shared/fields.yaml', fields)
  await write('blocks/shared/component.svelte', `<nav>{#each shared_nav_links as item}<a href={item.link.url}>{item.link.label}</a>{/each}</nav>{#each shared_footer_groups as group}<h2>{group.title}</h2>{#each group.links as item}<a href={item.link.url}>{item.link.label}</a>{/each}{/each}<p>{shared_notice}:{shared_count}:{shared_enabled}</p><span>{wrapper.shared_notice}</span>`)
  await write('page-types/default/config.yaml', 'name: Default\n')
  await write('page-types/default/layout.yaml', 'header:\n  - block: shared\nfooter:\n  - block: shared\n')
  for (const [file,id] of [['index','home00000000001'],['about','about0000000001']]) await write(`pages/${file}.yaml`, `_id: ${id}\nname: ${file}\npage_type: default\nsections: []\n`)
  const build = () => run_cli(['build', '-d', site, '-o', output], { cwd: workspace.work, home: workspace.home })
  const built = await build()
  assert.equal(built.code, 0, built.output)
  for (const file of ['index.html','about/index.html']) {
   const html = await fs.readFile(path.join(output,file),'utf8')
   assert.equal([...html.matchAll(/href="\/about"[^>]*>About<\/a>/g)].length, 2)
   assert.equal([...html.matchAll(/Explore/g)].length, 2)
   assert.match(html, /href="https:\/\/example.com\/help"[^>]*>Help<\/a>/)
   assert.match(html, /Shared copyright:0:false/)
  }
  assert.equal(await fs.readFile(path.join(site,'site/content.yaml'),'utf8'), content)
  assert.equal(await fs.readFile(path.join(site,'blocks/shared/fields.yaml'),'utf8'), fields)
  // A same-named local fallback must never conceal a bad explicit reference.
  await write('blocks/shared/fields.yaml', '- name: nav_links\n  type: site-field\n  config: { field: missing-nav }\n')
  const failed = await build()
  assert.equal(failed.code, 1, failed.output)
  assert.match(failed.output, /site-field reference "missing-nav".*blocks\/shared\/fields.yaml.*nav_links.config.field.*site\/fields.yaml/)
 })
}
