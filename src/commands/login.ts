import chalk from 'chalk'
import ora from 'ora'
import readline from 'readline'
import fs from 'fs/promises'
import {
	authenticate_in_browser,
	browser_login_origin,
	type BrowserLoginOptions
} from '../utils/browser-login.js'
import { get_auth_token, save_auth_token } from '../utils/auth.js'
import {
	read_server_config,
	get_server_config_path,
	normalize_server_url
} from '../utils/server-config.js'

interface LoginOptions {
	server?: string
	email?: string
	password?: boolean
	browser?: boolean
	timeout?: string
	reauth?: boolean
}

export async function login(options: LoginOptions) {
	let server_url = options.server
	if (!server_url) {
		// Fall back to `server:` in server.yaml when run from a workspace.
		try {
			await fs.access(get_server_config_path(process.cwd()))
			const config = await read_server_config(process.cwd())
			if (config.server) server_url = config.server
		} catch {
			// not in a workspace, fall through
		}
	}

	if (!server_url) {
		console.log('')
		console.log(chalk.red('Server URL required.'))
		console.log(
			chalk.dim(
				'  Pass it as the first argument, use -s <url>, or run from a workspace whose server.yaml has a `server:` field.'
			)
		)
		console.log('')
		process.exit(1)
	}

	const server = normalize_server_url(server_url)
	if (!options.password) {
		try {
			browser_login_origin(server)
		} catch (error) {
			console.error(error instanceof Error ? error.message : String(error))
			process.exitCode = 1
			return
		}
	}

	console.log('')
	console.log(chalk.bold(`Logging in to ${server}`))
	console.log('')

	if (options.email && !options.password) {
		console.error(
			'Use --password with --email for terminal password login. Browser login uses the account signed in to your browser.'
		)
		process.exitCode = 1
		return
	}
	if (!options.password && !options.reauth) {
		const cached = await get_auth_token(server)
		if (cached) {
			try {
				const response = await fetch(
					`${server}/api/collections/users/auth-refresh`,
					{
						method: 'POST',
						headers: { Authorization: `Bearer ${cached}` },
						signal: AbortSignal.timeout(10000),
						redirect: 'error'
					}
				)
				if (response.ok) {
					const data = (await response.json()) as {
						token?: string
						record?: { email?: string }
					}
					if (data.token && data.record?.email) {
						await save_auth_token(server, data.token)
						console.log(`Already logged in as ${data.record.email}`)
						return
					}
				}
				if (![401, 403, 404].includes(response.status))
					throw new Error(
						'Could not verify the saved login. Try again when the server is available.'
					)
			} catch (error) {
				console.error(error instanceof Error ? error.message : String(error))
				process.exitCode = 1
				return
			}
		}
	}
	const token = options.password
		? await authenticate_with_password(server, options.email)
		: await authenticate_with_browser(server, {
				noBrowser: options.browser === false,
				timeout:
					options.timeout === undefined ? undefined : Number(options.timeout)
			})
	if (!token) {
		process.exit(1)
	}
	console.log('')
	console.log(chalk.dim('  Token saved to ~/.primo/tokens.json'))
	console.log(
		chalk.dim(
			'  You can now use `primo pull`, `primo push`, and `primo publish` without --token'
		)
	)
}

// Both explicit login and pull's first-login path use browser consent.
export async function authenticate_with_browser(
	server: string,
	options: BrowserLoginOptions = {}
): Promise<string | null> {
	const controller = new AbortController()
	const cancel = () => controller.abort()
	process.once('SIGINT', cancel)
	process.once('SIGTERM', cancel)
	try {
		return await authenticate_in_browser(server, {
			...options,
			signal: controller.signal
		})
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error))
		return null
	} finally {
		process.removeListener('SIGINT', cancel)
		process.removeListener('SIGTERM', cancel)
	}
}

// Prompt for credentials (email if not supplied, then password), authenticate
// against the server, and persist the token on success. Returns the token, or
// null if authentication failed. Available only through explicit --password.
async function authenticate_with_password(
	server: string,
	email?: string
): Promise<string | null> {
	if (!process.stdin.isTTY || !process.stdout.isTTY) {
		console.error(
			'Password login requires an interactive terminal. Use browser login or supply an existing --token to the command.'
		)
		return null
	}
	if (!email) {
		email = await prompt('Email: ')
	}

	const password = await prompt_password('Password: ')

	const spinner = ora('Authenticating...').start()

	try {
		// Authenticate with PocketBase
		const response = await fetch(
			`${server}/api/collections/users/auth-with-password`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				signal: AbortSignal.timeout(10000),
				redirect: 'error',
				body: JSON.stringify({
					identity: email,
					password: password
				})
			}
		)

		if (!response.ok) {
			const error = (await response
				.json()
				.catch(() => ({ message: 'Authentication failed' }))) as {
				message?: string
			}
			spinner.fail(`Login failed: ${error.message || 'Invalid credentials'}`)
			return null
		}

		const data = (await response.json()) as {
			token: string
			record: { email: string }
		}

		// Save the token
		await save_auth_token(server, data.token)

		spinner.succeed(`Logged in as ${chalk.cyan(data.record.email)}`)
		return data.token
	} catch (error) {
		spinner.fail(
			`Login failed: ${error instanceof Error ? error.message : error}`
		)
		return null
	}
}

function prompt(question: string): Promise<string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	})

	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close()
			resolve(answer)
		})
	})
}

function prompt_password(question: string): Promise<string> {
	return new Promise((resolve) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		})

		// Disable echoing for password input
		if (process.stdin.isTTY) {
			process.stdout.write(question)
			const stdin = process.stdin
			stdin.setRawMode(true)
			stdin.resume()

			let password = ''
			stdin.on('data', function handler(char) {
				const c = char.toString('utf8')
				switch (c) {
					case '\n':
					case '\r':
					case '\u0004': // Ctrl+D
						stdin.setRawMode(false)
						stdin.pause()
						stdin.removeListener('data', handler)
						process.stdout.write('\n')
						rl.close()
						resolve(password)
						break
					case '\u0003': // Ctrl+C
						process.exit()
						break
					case '\u007F': // Backspace
						if (password.length > 0) {
							password = password.slice(0, -1)
							process.stdout.clearLine(0)
							process.stdout.cursorTo(0)
							process.stdout.write(question + '*'.repeat(password.length))
						}
						break
					default:
						password += c
						process.stdout.clearLine(0)
						process.stdout.cursorTo(0)
						process.stdout.write(question + '*'.repeat(password.length))
						break
				}
			})
		} else {
			// Non-TTY fallback
			rl.question(question, (answer) => {
				rl.close()
				resolve(answer)
			})
		}
	})
}
