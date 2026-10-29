import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import http from 'node:http'
import { chromium } from '@playwright/test'
import { run_cli, make_workspace } from './helpers/run-cli.mjs'

test(
	'built CLI output hydrates existing section and head nodes, including head-only blocks',
	{ timeout: 60000 },
	async (t) => {
		const workspace = await make_workspace()
		t.after(workspace.cleanup)
		const options = { cwd: workspace.work, home: workspace.home }
		const init = await run_cli(['init', '--no-mcp'], options)
		assert.equal(init.code, 0, init.output)
		const files = {
			'site.yaml': 'name: Hydration fixture\n',
			'site/head.svelte': '<title>Client site</title>',
			'page-types/default/config.yaml': 'name: Default\n',
			'blocks/hero/component.svelte': `<script>let count = $state(0); $effect(() => { window.hydrated = (window.hydrated || 0) + 1 })</script><svelte:head><link rel="canonical" href="https://client.test/" /></svelte:head><h1>Client headline</h1><button onclick={() => count++}>{count}</button><style>h1 { color: red }</style>`,
			'blocks/list/component.svelte': `<script>let items = ['one','two']; $effect(() => { window.hydrated = (window.hydrated || 0) + 1 })</script><svelte:head><meta name="list-head" content="one" /></svelte:head><section>List</section>{#each items as item}<p>{item}</p>{/each}`,
			'blocks/seo/component.svelte': `<script>$effect(() => { window.hydrated = (window.hydrated || 0) + 1 })</script><svelte:head><meta name="seo-only" content="yes" /></svelte:head>`,
			'pages/index.yaml':
				'name: Home\npage_type: default\nsections:\n  - block: hero\n  - block: list\n  - block: seo\n',
		}
		const site = path.join(workspace.work, 'sites/client')
		for (const [file, contents] of Object.entries(files)) {
			await fs.mkdir(path.dirname(path.join(site, file)), { recursive: true })
			await fs.writeFile(path.join(site, file), contents)
		}
		const output = path.join(workspace.work, 'public')
		const built = await run_cli(
			['build', '--dir', site, '--output', output],
			options,
		)
		assert.equal(built.code, 0, built.output)
		const server = http.createServer(async (req, res) => {
			try {
				const pathname = new URL(req.url, 'http://local').pathname
				const file = path.join(
					output,
					pathname === '/' ? 'index.html' : pathname,
				)
				res.setHeader(
					'Content-Type',
					file.endsWith('.js') ? 'text/javascript' : 'text/html',
				)
				res.end(await fs.readFile(file))
			} catch {
				res.writeHead(404)
				res.end()
			}
		})
		await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
		t.after(
			() =>
				new Promise((resolve) => {
					server.closeAllConnections()
					server.close(resolve)
				}),
		)
		const browser = await chromium.launch({ headless: true })
		t.after(() => browser.close())
		const page = await browser.newPage()
		const errors = []
		page.on('pageerror', (e) => errors.push(e.message))
		page.on('console', (m) => {
			if (/hydrat|Failed to/.test(m.text())) errors.push(m.text())
		})
		await page.addInitScript(() => {
			document.addEventListener('readystatechange', () => {
				if (document.readyState === 'interactive') {
					window.originals = [
						...document.querySelectorAll('[data-section]'),
					].map((el) => [...el.childNodes])
					window.originalHeads = [
						...document.head.querySelectorAll(
							'title,link[rel=canonical],meta[name=list-head],meta[name=seo-only]',
						),
					]
				}
			})
		})
		await page.goto(`http://127.0.0.1:${server.address().port}/`)
		await page.waitForFunction(() => window.hydrated === 3)
		assert.equal(
			await page.evaluate(() =>
				window.originals.every((nodes, i) =>
					nodes.every(
						(node, j) =>
							node.isConnected &&
							node ===
								document.querySelectorAll('[data-section]')[i].childNodes[j],
					),
				),
			),
			true,
			'SSR section nodes were replaced',
		)
		assert.equal(
			await page.evaluate(() =>
				window.originalHeads.every((node) => node.isConnected),
			),
			true,
			'SSR head nodes were replaced',
		)
		for (const selector of [
			'title',
			'link[rel=canonical]',
			'meta[name=list-head]',
			'meta[name=seo-only]',
		])
			assert.equal(await page.locator(`head ${selector}`).count(), 1)
		assert.equal(
			await page.locator('h1').evaluate((el) => getComputedStyle(el).color),
			'rgb(255, 0, 0)',
		)
		await page.locator('button').click()
		assert.equal(await page.locator('button').textContent(), '1')
		assert.deepEqual(errors, [])
	},
)
