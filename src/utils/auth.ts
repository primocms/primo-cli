import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'

const CONFIG_DIR = path.join(os.homedir(), '.primo')
const TOKEN_FILE = path.join(CONFIG_DIR, 'tokens.json')

interface TokenStore {
	[server: string]: string
}

export async function get_auth_token(server: string): Promise<string | null> {
	try {
		const data = await fs.readFile(TOKEN_FILE, 'utf-8')
		const tokens: TokenStore = JSON.parse(data)
		const canonical = normalize_server(server)
		const token = tokens[canonical] ?? Object.entries(tokens).find(([key, value]) => typeof value === 'string' && normalize_server(key) === canonical)?.[1]
		return typeof token === 'string' && token ? token : null
	} catch {
		return null
	}
}

export async function save_auth_token(server: string, token: string, signal?: AbortSignal): Promise<void> {
	signal?.throwIfAborted()
	await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 })

	const release = await acquire_token_lock(signal)
	try {
		let tokens: TokenStore = {}
		try {
			const data = await fs.readFile(TOKEN_FILE, 'utf-8')
			tokens = JSON.parse(data)
		} catch {}

		signal?.throwIfAborted()
		const canonical = normalize_server(server)
		for (const key of Object.keys(tokens)) if (key !== canonical && normalize_server(key) === canonical) delete tokens[key]
		tokens[canonical] = token
		const temporary = `${TOKEN_FILE}.${randomUUID()}.tmp`
		try {
			await fs.writeFile(temporary, JSON.stringify(tokens, null, 2), {
				mode: 0o600,
				flag: 'wx'
			})
			signal?.throwIfAborted()
			await fs.rename(temporary, TOKEN_FILE)
		} finally {
			await fs.unlink(temporary).catch(() => {})
		}
	} finally {
		await release()
	}
}

function normalize_server(server: string): string {
	try {
		const url = new URL(server)
		return url.href.replace(/\/+$/, '').toLowerCase()
	} catch {
		return server.replace(/\/+$/, '').toLowerCase()
	}
}

async function acquire_token_lock(signal?: AbortSignal): Promise<() => Promise<void>> {
	const file = `${TOKEN_FILE}.lock`
	const deadline = Date.now() + 5000
	while (true) {
		signal?.throwIfAborted()
		try {
			const handle = await fs.open(file, 'wx', 0o600)
			// PID metadata helps diagnose a crashed owner; never unlink an
			// unverified lock and risk concurrent credential-store writes.
			try {
				await handle.writeFile(
					JSON.stringify({
						pid: process.pid,
						created_at: new Date().toISOString()
					})
				)
			} catch (error) {
				await handle.close()
				await fs.unlink(file)
				throw error
			}
			return async () => {
				try {
					await handle.close()
				} finally {
					await fs.unlink(file)
				}
			}
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
			if (Date.now() >= deadline)
				throw new Error(
					'Another login is updating tokens.json. Retry after it finishes; if a login crashed, remove tokens.json.lock only after verifying no login is running.'
				)
			await delay(50, undefined, { signal })
		}
	}
}
