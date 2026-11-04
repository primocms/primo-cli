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
		const token = tokens[normalize_server(server)]
		return typeof token === 'string' && token ? token : null
	} catch {
		return null
	}
}

export async function save_auth_token(
	server: string,
	token: string
): Promise<void> {
	await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 })

	const release = await acquire_token_lock()
	try {
		let tokens: TokenStore = {}
		try {
			const data = await fs.readFile(TOKEN_FILE, 'utf-8')
			tokens = JSON.parse(data)
		} catch {}

		tokens[normalize_server(server)] = token
		const temporary = `${TOKEN_FILE}.${randomUUID()}.tmp`
		try {
			await fs.writeFile(temporary, JSON.stringify(tokens, null, 2), {
				mode: 0o600,
				flag: 'wx'
			})
			await fs.rename(temporary, TOKEN_FILE)
		} finally {
			await fs.unlink(temporary).catch(() => {})
		}
	} finally { await release() }
}

function normalize_server(server: string): string {
	return server.replace(/\/+$/, '').toLowerCase()
}

async function acquire_token_lock(): Promise<() => Promise<void>> {
	const file = `${TOKEN_FILE}.lock`
	const deadline = Date.now() + 5000
	while (true) {
		try {
			const handle = await fs.open(file, 'wx', 0o600)
			return async () => { try { await handle.close() } finally { await fs.unlink(file) } }
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
			if (Date.now() >= deadline) throw new Error('Another login is updating tokens.json. Retry after it finishes; if a login crashed, remove tokens.json.lock only after verifying no login is running.')
			await delay(50)
		}
	}
}
