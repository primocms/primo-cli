import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'
import { read_site_config } from '../utils/site-config.js'
import { read_server_config, SERVER_CONFIG_FILE } from '../utils/server-config.js'

interface PreviewOptions {
	dir: string
	json?: boolean
}

interface SiteRecord {
	id: string
	name?: string
	host?: string
	[key: string]: unknown
}

interface SyncStatus {
	ok: boolean
	error?: string
	failed_at?: string
}

/**
 * Rebuild a site's published preview. This is the CLI counterpart to the MCP
 * `build_preview` tool, for humans, CI, and agents without an MCP client: it
 * needs only `primo dev` running.
 *
 * The heavy lifting — compiling the site and uploading the preview artifacts —
 * lives in `primo-mcp`'s publish compiler, imported dynamically so a
 * `primo-mcp` without the subpath export degrades with a clear message instead
 * of breaking the command.
 */
export async function preview(options: PreviewOptions) {
	const site_dir = path.resolve(options.dir)
	const as_json = !!options.json

	const fail = (message: string) => {
		if (as_json) {
			console.log(JSON.stringify({ ok: false, error: message }, null, 2))
		} else {
			console.log(chalk.red(message))
		}
		process.exitCode = 1
	}

	let config: { site_id?: string; host?: string } | null = null
	try {
		config = (await read_site_config(site_dir)) as { site_id?: string; host?: string } | null
	} catch {
		fail(`No site.yaml found at ${site_dir}/site.yaml — run from a site directory, or pass --dir <site>.`)
		return
	}
	const site_id = config?.site_id
	if (!site_id) {
		fail(`site.yaml at ${site_dir} is missing site_id.`)
		return
	}

	// If the last file→CMS push failed, the server still holds pre-edit state;
	// compiling it would publish a stale preview that looks successful.
	const sync = await read_sync(site_dir)
	if (sync && sync.ok === false) {
		fail(`The most recent file→CMS push failed at ${sync.failed_at ?? 'an unknown time'} and the server still holds pre-edit state. Fix the error and let \`primo dev\` re-import before building a preview. Error: ${sync.error ?? 'unknown'}`)
		return
	}

	const workspace = await find_workspace(site_dir)
	if (!workspace) {
		fail(`No ${SERVER_CONFIG_FILE} found above ${site_dir}. Run \`primo preview\` from inside a workspace.`)
		return
	}
	const api_url = `http://127.0.0.1:${workspace.port}`

	let token: string
	try {
		token = await dev_auth(api_url)
	} catch (error) {
		fail(error instanceof Error ? error.message : String(error))
		return
	}

	let record: SiteRecord
	try {
		record = await fetch_site_record(api_url, token, site_id)
	} catch (error) {
		fail(error instanceof Error ? error.message : String(error))
		return
	}

	let compile_and_upload: (api_url: string, token: string, record: SiteRecord) => Promise<{ pageCount: number; symbolCount: number }>
	try {
		// Non-literal specifier: the subpath only exists in primo-mcp >= 0.1.8,
		// so a static specifier would fail to type-resolve against older installs.
		const compiler_specifier = 'primo-mcp/compiler'
		const compiler = (await import(compiler_specifier)) as {
			compileAndUploadPublishArtifacts: (api_url: string, token: string, record: SiteRecord) => Promise<{ pageCount: number; symbolCount: number }>
		}
		compile_and_upload = compiler.compileAndUploadPublishArtifacts
	} catch {
		fail('This build of primo-mcp does not expose its compiler subpath (needs primo-mcp >= 0.1.8). Upgrade with `npm i -g primo-mcp@latest` (or `npx primo-mcp@latest`).')
		return
	}

	let summary: { pageCount: number; symbolCount: number }
	try {
		summary = await compile_and_upload(api_url, token, record)
	} catch (error) {
		fail(`Preview compile failed: ${error instanceof Error ? error.message : error}`)
		return
	}

	try {
		await generate(api_url, token, site_id)
	} catch (error) {
		fail(error instanceof Error ? error.message : String(error))
		return
	}

	const host = record.host || config?.host
	const site_url = host ? `http://${host}` : `${api_url}/?_site=${encodeURIComponent(site_id)}`

	if (as_json) {
		console.log(JSON.stringify({ ok: true, site_url, pages: summary.pageCount, symbols: summary.symbolCount }, null, 2))
	} else {
		console.log(chalk.green(`✓ Preview rebuilt (${summary.pageCount} page${summary.pageCount === 1 ? '' : 's'})`))
		console.log(`  ${chalk.cyan(site_url)}`)
	}
}

async function read_sync(site_dir: string): Promise<SyncStatus | null> {
	try {
		const raw = await fs.readFile(path.join(site_dir, '.primo', 'sync_status.json'), 'utf-8')
		return JSON.parse(raw) as SyncStatus
	} catch {
		return null
	}
}

async function find_workspace(site_dir: string): Promise<{ dir: string; port: number } | null> {
	let dir = site_dir
	for (;;) {
		try {
			await fs.access(path.join(dir, SERVER_CONFIG_FILE))
			const config = await read_server_config(dir)
			return { dir, port: config.port ?? 3000 }
		} catch {
			// keep walking up
		}
		const parent = path.dirname(dir)
		if (parent === dir) return null
		dir = parent
	}
}

async function dev_auth(api_url: string): Promise<string> {
	let response: Response
	try {
		response = await fetch(`${api_url}/api/primo/dev-auth`, {
			method: 'POST',
			signal: AbortSignal.timeout(2000)
		})
	} catch {
		throw new Error(`Could not reach the Primo server at ${api_url}. Is \`primo dev\` running?`)
	}
	if (!response.ok) {
		throw new Error(`The Primo server at ${api_url} did not return a dev token (HTTP ${response.status}). Is \`primo dev\` running?`)
	}
	const body = (await response.json()) as { token?: string }
	if (!body.token) {
		throw new Error('The dev-auth response did not include a token.')
	}
	return body.token
}

async function fetch_site_record(api_url: string, token: string, site_id: string): Promise<SiteRecord> {
	const response = await fetch(`${api_url}/api/collections/sites/records/${encodeURIComponent(site_id)}`, {
		headers: { Authorization: token }
	})
	if (response.status === 404) {
		throw new Error(`Site ${site_id} was not found on the server at ${api_url}. Is \`primo dev\` running for this workspace?`)
	}
	if (!response.ok) {
		const body = await response.text().catch(() => '')
		throw new Error(`Could not read the site record (HTTP ${response.status}): ${body || 'no body'}`)
	}
	return (await response.json()) as SiteRecord
}

async function generate(api_url: string, token: string, site_id: string): Promise<void> {
	const response = await fetch(`${api_url}/api/primo/generate`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: token },
		body: JSON.stringify({ site_id })
	})
	if (!response.ok) {
		const body = await response.text().catch(() => '')
		throw new Error(`Preview generation failed (HTTP ${response.status}): ${body || 'no body'}`)
	}
}
