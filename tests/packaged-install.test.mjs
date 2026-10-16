import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { make_workspace } from './helpers/run-cli.mjs'

const exec = promisify(execFile)
const root = path.dirname(await fs.realpath(fileURLToPath(new URL('../package.json', import.meta.url))))
const dependencyRoot = await fs.access(path.join(root, 'node_modules')).then(() => path.join(root, 'node_modules'), () => path.dirname(root))

test('installed tarball builds with hoisted dependencies outside the project', { timeout: 60000 }, async t => {
	const ws = await make_workspace(); t.after(ws.cleanup)
	const env = { ...process.env, HOME: ws.home, USERPROFILE: ws.home, npm_config_cache: path.join(ws.home, '.npm') }
	const packed = await exec('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', ws.root], { cwd: root, env })
	const archive = path.join(ws.root, JSON.parse(packed.stdout)[0].filename)
	const modules = path.join(ws.root, 'installation/node_modules')
	const installed = path.join(modules, 'primo-cli')
	await fs.mkdir(installed, { recursive: true })
	await exec('tar', ['-xzf', archive, '-C', installed, '--strip-components=1'])
	// npm's usual local install puts shared dependencies beside primo-cli,
	// rather than inside it. Leave the project itself without node_modules.
	for (const entry of await fs.readdir(dependencyRoot)) {
		if (!entry.startsWith('.') && entry !== 'primo-cli') {
			await fs.symlink(path.join(dependencyRoot, entry), path.join(modules, entry), 'junction')
		}
	}
	await assert.rejects(fs.access(path.join(installed, 'node_modules/svelte')))
	await assert.rejects(fs.access(path.join(ws.work, 'node_modules')))
	const files = {
		'site.yaml': 'name: Packaged client\n',
		'site/head.svelte': '<title>Packaged client</title>',
		'blocks/hero/config.yaml': 'name: Hero\n',
		'blocks/hero/fields.yaml': '- name: heading\n  type: text\n',
		'blocks/hero/component.svelte': '<script>import { fade } from "svelte/transition"; let {heading}=$props(); let count=$state(0)</script><h1 transition:fade>{heading}</h1><button onclick={() => count++}>{count}</button>',
		'page-types/default/config.yaml': 'name: Default\n',
		'pages/index.yaml': 'name: Home\npage_type: default\nsections:\n  - block: hero\n    content:\n      heading: Installed package renders\n'
	}
	for (const [file, text] of Object.entries(files)) {
		const target = path.join(ws.work, 'site', file)
		await fs.mkdir(path.dirname(target), { recursive: true })
		await fs.writeFile(target, text)
	}
	const pkg = JSON.parse(await fs.readFile(path.join(installed, 'package.json'), 'utf8'))
	const output = path.join(ws.work, 'public')
	await exec(process.execPath, [path.join(installed, pkg.bin.primo), 'build', '--dir', path.join(ws.work, 'site'), '--output', output], { cwd: ws.work, env, timeout: 30000 }).catch(error => assert.fail(`${error.message}\n${error.stdout}\n${error.stderr}`))
	const html = await fs.readFile(path.join(output, 'index.html'), 'utf8')
	assert.match(html, /Installed package renders/)
	assert.match(html, /<title>Packaged client<\/title>/)
	assert.match(html, /hydrate/)
	await fs.access(path.join(output, '_symbols/hero.js'))
})
