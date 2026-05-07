import chalk from 'chalk'
import ora from 'ora'
import readline from 'readline'
import fs from 'fs/promises'
import { save_auth_token } from '../utils/auth.js'
import { read_server_config, get_server_config_path } from '../utils/server-config.js'

interface LoginOptions {
	server?: string
	email?: string
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
		console.log(chalk.dim('  Pass -s <url>, or run from a workspace whose server.yaml has a `server:` field.'))
		console.log('')
		process.exit(1)
	}

	const server = normalize_server_url(server_url)

	console.log('')
	console.log(chalk.bold(`Logging in to ${server}`))
	console.log('')

	let email = options.email
	if (!email) {
		email = await prompt('Email: ')
	}

	const password = await prompt_password('Password: ')

	const spinner = ora('Authenticating...').start()

	try {
		// Authenticate with PocketBase
		const response = await fetch(`${server}/api/collections/users/auth-with-password`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				identity: email,
				password: password
			})
		})

		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: 'Authentication failed' })) as { message?: string }
			spinner.fail(`Login failed: ${error.message || 'Invalid credentials'}`)
			process.exit(1)
		}

		const data = await response.json() as { token: string; record: { email: string } }

		// Save the token
		await save_auth_token(server, data.token)

		spinner.succeed(`Logged in as ${chalk.cyan(data.record.email)}`)
		console.log('')
		console.log(chalk.dim('  Token saved to ~/.primo/tokens.json'))
		console.log(chalk.dim('  You can now use `primo pull` and `primo push` without --token'))

	} catch (error) {
		spinner.fail(`Login failed: ${error instanceof Error ? error.message : error}`)
		process.exit(1)
	}
}

function normalize_server_url(server: string): string {
	// Add https:// if no protocol specified
	if (!server.startsWith('http://') && !server.startsWith('https://')) {
		server = `https://${server}`
	}
	// Remove trailing slash
	return server.replace(/\/+$/, '')
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
