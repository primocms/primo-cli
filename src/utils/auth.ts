import fs from 'fs/promises'
import path from 'path'
import os from 'os'

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

export async function save_auth_token(server: string, token: string): Promise<void> {
	await fs.mkdir(CONFIG_DIR, { recursive: true })

	let tokens: TokenStore = {}
	try {
		const data = await fs.readFile(TOKEN_FILE, 'utf-8')
		tokens = JSON.parse(data)
	} catch {}

	tokens[normalize_server(server)] = token
	await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2))
}

function normalize_server(server: string): string {
	return server.replace(/\/+$/, '').toLowerCase()
}
