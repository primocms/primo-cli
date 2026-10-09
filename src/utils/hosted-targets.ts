import fs from 'fs/promises'
import path from 'path'
import { read_site_config, get_site_config_path } from './site-config.js'
import { read_server_config, get_server_config_path, normalize_server_url } from './server-config.js'
import { get_auth_token } from './auth.js'
import { find_duplicate_site_ids, describe_duplicate_site_ids } from './site-ids.js'
import type { PushTarget } from './push-guard.js'

export interface HostedOptions {
	dir: string
	server?: string
	site?: string
	only?: string
	token?: string
	json?: boolean
}

async function exists(file: string) {
	try {
		await fs.access(file)
		return true
	} catch {
		return false
	}
}

export async function hosted_targets(options: HostedOptions): Promise<PushTarget[]> {
	const root = path.resolve(options.dir)
	// Publishing/status can target a hosted site without a local checkout.
	if (options.server && options.site && !options.only) {
		const server = normalize_server_url(options.server)
		return [{ dir: root, server, target: options.site, label: options.site, token: options.token || (await get_auth_token(server)) }]
	}

	let workspace_server: string | undefined
	let dirs: string[]
	if (await exists(get_site_config_path(root))) {
		if (options.only) throw new Error('--only selects a site from a workspace root. Use --dir for a site directory.')
		dirs = [root]
		for (const parent of [path.dirname(root), path.dirname(path.dirname(root))]) {
			if (await exists(get_server_config_path(parent))) {
				workspace_server = (await read_server_config(parent)).server
				break
			}
		}
	} else if (await exists(get_server_config_path(root))) {
		workspace_server = (await read_server_config(root)).server
		const entries = await fs.readdir(path.join(root, 'sites'), {
			withFileTypes: true
		})
		dirs = []
		for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
			if (!entry.isDirectory() || entry.name.startsWith('.')) continue
			const dir = path.join(root, 'sites', entry.name)
			if (await exists(get_site_config_path(dir))) dirs.push(dir)
		}
		if (options.only) dirs = dirs.filter((dir) => path.basename(dir) === options.only)
		if (options.site && dirs.length !== 1) throw new Error('--site requires a single site directory or --only selection.')
	} else {
		throw new Error(`No site.yaml or server.yaml found in ${root}. Pass --dir <site-or-workspace>.`)
	}
	if (!dirs.length) throw new Error(options.only ? `No site folder named "${options.only}" under sites/.` : 'No sites found in this workspace.')
	const duplicates = await find_duplicate_site_ids(dirs)
	if (duplicates.size) throw new Error(describe_duplicate_site_ids(duplicates, root))
	const targets = []
	for (const dir of dirs) {
		const config = await read_site_config(dir)
		const server_raw = options.server || config.server || workspace_server
		if (!server_raw) throw new Error(`No hosted server configured for ${path.basename(dir)}. Pass --server or set server in site.yaml/server.yaml.`)
		const target = options.site || config.site_id
		if (!target) throw new Error(`Missing site_id in ${get_site_config_path(dir)}.`)
		const server = normalize_server_url(server_raw)
		targets.push({
			dir,
			server,
			target,
			label: path.basename(dir),
			token: options.token || (await get_auth_token(server))
		})
	}
	const identities = targets.map((t) => JSON.stringify([t.server, t.target]))
	if (new Set(identities).size !== identities.length) throw new Error('Multiple folders select the same server site.')
	return targets
}

// Quote paths and target identifiers for copying into a POSIX shell.
export function publish_retry_command(target: PushTarget): string {
	const quote = (s: string) => "'" + s.replaceAll("'", "'\\''") + "'"
	return `primo publish --dir ${quote(target.dir)} --server ${quote(target.server)} --site ${quote(target.target)}`
}
