import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { randomUUID } from 'node:crypto'

const CONFIG_DIR = path.join(os.homedir(), '.primo')
const TOKEN_FILE = path.join(CONFIG_DIR, 'tokens.json')

interface TokenStore {
	[server: string]: string
}

export async function get_auth_token(server: string): Promise<string | null> {
	try {
		const data = await fs.readFile(TOKEN_FILE, 'utf-8')
		const tokens: TokenStore = JSON.parse(data)
		return tokens[normalize_server(server)] || null
	} catch {
		return null
	}
}

export async function save_auth_token(
	server: string,
	token: string
): Promise<void> {
	await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 })

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
}

function normalize_server(server: string): string {
	return server.replace(/\/+$/, '').toLowerCase()
}
