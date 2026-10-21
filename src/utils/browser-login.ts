import { spawn } from 'node:child_process'
import { save_auth_token } from './auth.js'

export interface BrowserLoginOptions {
	noBrowser?: boolean
	timeout?: number
	signal?: AbortSignal
}

export function browser_login_origin(server: string): URL {
	const url = new URL(server)
	if (
		url.username ||
		url.password ||
		url.search ||
		url.hash ||
		url.pathname !== '/'
	)
		throw new Error(
			'Use a CMS server origin without credentials, paths, or query parameters.'
		)
	const loopback =
		url.hostname === 'localhost' ||
		url.hostname === '127.0.0.1' ||
		url.hostname === '[::1]'
	if (url.protocol !== 'https:' && !(loopback && url.protocol === 'http:'))
		throw new Error('Browser login requires HTTPS, except for localhost.')
	return url
}

async function request(
	server: string,
	route: string,
	body: object,
	deadline: number,
	signal?: AbortSignal
) {
	const controller = new AbortController()
	const abort = () => controller.abort()
	signal?.addEventListener('abort', abort, { once: true })
	const timer = setTimeout(
		abort,
		Math.max(1, Math.min(10000, deadline - Date.now()))
	)
	try {
		if (signal?.aborted) controller.abort()
		const response = await fetch(`${server}/api/primo/cli-login/${route}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
			signal: controller.signal,
			redirect: 'error'
		})
		const data = (await response.json().catch(() => ({}))) as Record<
			string,
			unknown
		>
		return { response, data }
	} finally {
		clearTimeout(timer)
		signal?.removeEventListener('abort', abort)
	}
}

async function open_browser(url: string): Promise<boolean> {
	const [command, args] =
		process.platform === 'darwin'
			? ['open', [url]]
			: process.platform === 'win32'
				? ['rundll32.exe', ['url.dll,FileProtocolHandler', url]]
				: ['xdg-open', [url]]
	return new Promise((resolve) => {
		const child = spawn(command, args, { stdio: 'ignore' })
		const timer = setTimeout(() => {
			child.kill()
			resolve(false)
		}, 5000)
		child.on('error', () => {
			clearTimeout(timer)
			resolve(false)
		})
		child.on('close', (code) => {
			clearTimeout(timer)
			resolve(code === 0)
		})
	})
}

async function pause(ms: number, signal?: AbortSignal) {
	return new Promise<void>((resolve, reject) => {
		const abort = () => {
			clearTimeout(timer)
			reject(new Error('Login cancelled.'))
		}
		const timer = setTimeout(() => {
			signal?.removeEventListener('abort', abort)
			resolve()
		}, ms)
		if (signal?.aborted) {
			abort()
			return
		}
		signal?.addEventListener('abort', abort, { once: true })
	})
}

export async function authenticate_in_browser(
	server: string,
	options: BrowserLoginOptions = {}
): Promise<string> {
	const origin = browser_login_origin(server)
	if (
		options.timeout !== undefined &&
		(!Number.isInteger(options.timeout) ||
			options.timeout < 1 ||
			options.timeout > 600)
	)
		throw new Error('--timeout must be an integer from 1 to 600 seconds.')
	let deadline = Date.now() + (options.timeout ?? 300) * 1000
	try {
		const { response, data } = await request(
			origin.origin,
			'start',
			{},
			deadline,
			options.signal
		)
		if (response.status === 404 || response.status === 405)
			throw new Error(
				'This server does not support browser login. Update the CMS, or use primo login --password in your own terminal.'
			)
		if (!response.ok)
			throw new Error(
				typeof data.message === 'string'
					? data.message
					: 'Could not start browser login.'
			)
		if (
			data.protocol !== 1 ||
			typeof data.device_code !== 'string' ||
			!/^[a-f0-9]{64}$/.test(data.device_code) ||
			typeof data.user_code !== 'string' ||
			!/^[A-F0-9]{4}(?:-[A-F0-9]{4}){3}$/.test(data.user_code) ||
			typeof data.verification_uri !== 'string' ||
			!Number.isInteger(data.expires_in) ||
			Number(data.expires_in) < 1 ||
			Number(data.expires_in) > 600 ||
			!Number.isInteger(data.interval) ||
			Number(data.interval) < 1 ||
			Number(data.interval) > 30
		)
			throw new Error('Invalid browser-login response from the server.')
		const verification = new URL(data.verification_uri, origin)
		if (
			verification.origin !== origin.origin ||
			verification.pathname !== '/admin/cli-login' ||
			verification.username ||
			verification.password ||
			verification.hash ||
			verification.searchParams.get('code') !== data.user_code ||
			[...verification.searchParams.keys()].some((key) => key !== 'code')
		)
			throw new Error('The server returned an invalid browser approval URL.')
		deadline = Math.min(deadline, Date.now() + Number(data.expires_in) * 1000)
		console.log(`Approve access in your browser. Check code: ${data.user_code}`)
		console.log(`  ${verification.href}`)
		if (!options.noBrowser && !(await open_browser(verification.href)))
			console.log(
				'Could not open a browser automatically. Open the approval link above to continue.'
			)
		let interval = Number(data.interval) * 1000
		while (Date.now() < deadline) {
			await pause(
				Math.min(interval, Math.max(0, deadline - Date.now())),
				options.signal
			)
			if (Date.now() >= deadline) break
			const polled = await request(
				origin.origin,
				'token',
				{ device_code: data.device_code },
				deadline,
				options.signal
			)
			if (polled.response.status === 200) {
				const record = polled.data.record as { email?: string } | undefined
				if (
					typeof polled.data.token !== 'string' ||
					!polled.data.token ||
					typeof record?.email !== 'string'
				)
					throw new Error('The server returned an invalid login result.')
				await save_auth_token(origin.origin, polled.data.token)
				console.log(`Logged in as ${record.email}`)
				return polled.data.token
			}
			if (
				polled.data.error === 'authorization_pending' &&
				polled.response.status === 202
			)
				continue
			if (polled.data.error === 'slow_down' && polled.response.status === 429) {
				interval = Math.max(
					interval + 5000,
					Math.min(
						30000,
						Number(polled.response.headers.get('Retry-After')) * 1000 || 5000
					)
				)
				continue
			}
			if (polled.data.error === 'access_denied')
				throw new Error(
					'Browser approval was declined or the approving session is no longer valid. Start primo login again.'
				)
			if (polled.data.error === 'expired_token')
				throw new Error('Login request expired. Start primo login again.')
			throw new Error(
				'Could not complete browser login. Start primo login again.'
			)
		}
		throw new Error('Login request expired. Start primo login again.')
	} catch (error) {
		if (options.signal?.aborted) throw new Error('Login cancelled.')
		if (Date.now() >= deadline)
			throw new Error('Login request expired. Start primo login again.')
		throw error
	}
}
