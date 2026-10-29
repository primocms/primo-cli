import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { start_mock_server } from './helpers/mock-server.mjs'
import { make_workspace, run_cli, CLI_ENTRY } from './helpers/run-cli.mjs'

const device_code = 'a'.repeat(64)
const user_code = 'ABCD-1234-EF01-5678'
const saved_token = 'browser-approved-token'

async function fixture(
	t,
	{
		polls = ['authorization_pending', 'approved'],
		verification_uri,
		supported = true
	} = {}
) {
	const workspace = await make_workspace()
	t.after(workspace.cleanup)
	let poll = 0
	const server = await start_mock_server({
		sites: [{ id: 'aaaaaaaaaaaaaaa', name: 'Demo', host: 'demo.example.com' }],
		export_files: {
			'site.yaml': 'name: Demo\nsite_id: aaaaaaaaaaaaaaa\n',
			'pages/index.yaml': 'name: Home\n'
		},
		on_request({ url, req, res }) {
			const json = (status, value) => {
				res.writeHead(status, { 'Content-Type': 'application/json' })
				res.end(JSON.stringify(value))
				return true
			}
			if (url.pathname === '/api/primo/cli-login/start') {
				if (!supported) return json(404, { message: 'Not found' })
				return json(200, {
					protocol: 1,
					device_code,
					user_code,
					verification_uri:
						verification_uri || '/admin/cli-login?code=' + user_code,
					expires_in: 300,
					interval: 1
				})
			}
			if (url.pathname === '/api/primo/cli-login/token') {
				const result = polls[Math.min(poll++, polls.length - 1)]
				if (result === 'approved')
					return json(200, {
						token: saved_token,
						record: { email: 'user@example.com' }
					})
				if (result === 'authorization_pending')
					return json(202, { error: result })
				if (result === 'slow_down') {
					res.setHeader('Retry-After', '1')
					return json(429, { error: result })
				}
				return json(result === 'expired_token' ? 410 : 403, { error: result })
			}
			if (url.pathname === '/api/collections/users/auth-refresh') {
				assert.equal(req.headers.authorization, 'Bearer ' + saved_token)
				return json(200, {
					token: saved_token,
					record: { email: 'user@example.com' }
				})
			}
		}
	})
	t.after(server.close)
	const options = { cwd: workspace.work, home: workspace.home }
	return {
		workspace,
		server,
		options,
		token_file: path.join(workspace.home, '.primo/tokens.json')
	}
}

test('browser approval saves a private token and later login/pull reuse it without prompts', async (t) => {
	const { server, options, token_file, workspace } = await fixture(t)
	const first = await run_cli(['login', server.url, '--no-browser'], options)
	assert.equal(first.code, 0, first.output)
	assert.match(first.output, /Approve access in your browser/)
	assert.match(first.output, new RegExp(user_code))
	assert.match(first.output, /Logged in as user@example.com/)
	assert.doesNotMatch(
		first.output,
		/Email:|Password:|browser-approved-token|aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/
	)
	assert.equal(
		JSON.parse(await fs.readFile(token_file, 'utf8'))[server.url],
		saved_token
	)
	assert.equal((await fs.stat(token_file)).mode & 0o777, 0o600)
	const again = await run_cli(['login', server.url, '--no-browser'], options)
	assert.equal(again.code, 0, again.output)
	assert.match(again.output, /Already logged in/)
	assert.equal(server.matching('/api/primo/cli-login/start').length, 1)
	const pulled = await run_cli(
		['pull', server.url, path.join(workspace.root, 'pulled')],
		options
	)
	assert.equal(pulled.code, 0, pulled.output)
	const exports = server.matching('/api/primo/export/aaaaaaaaaaaaaaa')
	assert.equal(exports[0].authorization, 'Bearer ' + saved_token)
	assert.equal(
		server.matching('/api/collections/users/auth-with-password').length,
		0
	)
})

for (const error of ['access_denied', 'expired_token']) {
	test(`browser ${error} fails without saving credentials`, async (t) => {
		const { server, options, token_file } = await fixture(t, { polls: [error] })
		const result = await run_cli(['login', server.url, '--no-browser'], options)
		assert.notEqual(result.code, 0)
		assert.match(
			result.output,
			error === 'access_denied' ? /declined/ : /expired/
		)
		await assert.rejects(fs.access(token_file))
	})
}

test('headless login has a deadline and legacy password login never prompts without a terminal', async (t) => {
	const { server, options, token_file } = await fixture(t, {
		polls: ['authorization_pending']
	})
	const expired = await run_cli(
		['login', server.url, '--no-browser', '--timeout', '1'],
		options
	)
	assert.notEqual(expired.code, 0)
	assert.match(expired.output, /expired/)
	await assert.rejects(fs.access(token_file))
	const password = await run_cli(['login', server.url, '--password'], options)
	assert.notEqual(password.code, 0)
	assert.match(password.output, /interactive terminal/)
	assert.doesNotMatch(password.output, /Email:|Password:/)
})

test('cancelling browser login stops waiting and leaves credentials unsaved', async (t) => {
	const { workspace, server, token_file } = await fixture(t, {
		polls: ['authorization_pending']
	})
	const child = spawn(
		process.execPath,
		[CLI_ENTRY, 'login', server.url, '--no-browser'],
		{ cwd: workspace.work, env: { ...process.env, HOME: workspace.home } }
	)
	t.after(() => {
		if (child.exitCode === null) child.kill('SIGKILL')
	})
	const done = once(child, 'close')
	let output = ''
	child.stderr.on('data', (data) => (output += data))
	await new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(output)), 5000)
		child.stdout.on('data', (data) => {
			output += data
			if (output.includes('Approve access')) {
				clearTimeout(timer)
				resolve()
			}
		})
	})
	child.kill('SIGTERM')
	await done
	assert.notEqual(child.exitCode, 0)
	assert.match(output, /cancelled/)
	await assert.rejects(fs.access(token_file))
})

test('older servers produce an actionable error without silently asking for a password', async (t) => {
	const { server, options } = await fixture(t, { supported: false })
	const result = await run_cli(['login', server.url, '--no-browser'], options)
	assert.notEqual(result.code, 0)
	assert.match(result.output, /Update the CMS.*--password/)
	assert.doesNotMatch(result.output, /Email:|Password:/)
})

test('browser login refuses cross-origin approval URLs before polling', async (t) => {
	const { server, options } = await fixture(t, {
		verification_uri:
			'https://other.example.com/admin/cli-login?code=' + user_code
	})
	const result = await run_cli(['login', server.url, '--no-browser'], options)
	assert.notEqual(result.code, 0)
	assert.match(result.output, /invalid browser approval URL/)
	assert.equal(server.matching('/api/primo/cli-login/token').length, 0)
})

test('server-config fallback works and --reauth requests a fresh approval', async (t) => {
	const { workspace, options, server } = await fixture(t, {
		polls: ['approved']
	})
	await fs.writeFile(
		path.join(workspace.work, 'server.yaml'),
		`server: ${server.url}\n`
	)
	await workspace.write_token(server.url, saved_token)
	const result = await run_cli(['login', '--no-browser', '--reauth'], options)
	assert.equal(result.code, 0, result.output)
	assert.equal(server.matching('/api/primo/cli-login/start').length, 1)
	assert.equal(server.matching('/api/collections/users/auth-refresh').length, 0)
})

test('polling backs off when the server requests slow_down', async (t) => {
	const { server, options } = await fixture(t, {
		polls: ['slow_down', 'approved']
	})
	const result = await run_cli(
		['login', server.url, '--no-browser', '--timeout', '20'],
		options
	)
	assert.equal(result.code, 0, result.output)
	assert.equal(server.matching('/api/primo/cli-login/token').length, 2)
})

test('insecure remote servers are rejected before any saved token is sent', async (t) => {
	const workspace = await make_workspace()
	t.after(workspace.cleanup)
	await workspace.write_token('http://cms.example.com', saved_token)
	const result = await run_cli(
		['login', 'http://cms.example.com', '--no-browser'],
		{ cwd: workspace.work, home: workspace.home }
	)
	assert.notEqual(result.code, 0)
	assert.match(result.output, /requires HTTPS/)
})

test(
	'default login opens the browser with only the public approval code',
	{ skip: process.platform === 'win32' },
	async (t) => {
		const { workspace, server, options } = await fixture(t, {
			polls: ['approved']
		})
		const bin = path.join(workspace.root, 'bin')
		await fs.mkdir(bin)
		const target = path.join(workspace.root, 'opened-url')
		const launcher = path.join(
			bin,
			process.platform === 'darwin' ? 'open' : 'xdg-open'
		)
		await fs.writeFile(
			launcher,
			`#!${process.execPath}\nrequire('node:fs').writeFileSync(process.env.PRIMO_TEST_OPENED_URL, process.argv[2]);\n`
		)
		await fs.chmod(launcher, 0o755)
		const result = await run_cli(['login', server.url], {
			...options,
			env: {
				PATH: bin + path.delimiter + process.env.PATH,
				PRIMO_TEST_OPENED_URL: target
			}
		})
		assert.equal(result.code, 0, result.output)
		assert.equal(
			await fs.readFile(target, 'utf8'),
			server.url + '/admin/cli-login?code=' + user_code
		)
	}
)
