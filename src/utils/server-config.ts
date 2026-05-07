import fs from 'fs/promises'
import path from 'path'
import { dump as dump_yaml, load as load_yaml } from 'js-yaml'
import { DEFAULT_FORMAT_OPTIONS, type FormatOptions } from './format.js'

export interface SiteGroupConfig {
	id: string
	name: string
	index?: number
}

export interface ServerConfig {
	port?: number
	site_groups?: SiteGroupConfig[]
	format?: Partial<FormatOptions>
	// Default hosted server for `primo push` / `primo login` when no site.yaml
	// declares one. Written by `primo deploy` after a successful provision.
	server?: string
}

export const SERVER_CONFIG_FILE = 'server.yaml'

export function get_server_config_path(base_dir: string): string {
	return path.join(base_dir, SERVER_CONFIG_FILE)
}

export function format_group_name(group_id: string): string {
	if (!group_id.trim()) return 'Default'

	return group_id
		.replace(/[-_]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/\b\w/g, (char) => char.toUpperCase())
}

export function normalize_server_config(config: ServerConfig): ServerConfig {
	const site_groups = Array.isArray(config.site_groups)
		? config.site_groups.reduce<SiteGroupConfig[]>((groups, group, index) => {
				if (!group || typeof group.id !== 'string' || !group.id.trim()) return groups

				groups.push({
					id: group.id,
					name: typeof group.name === 'string' && group.name.trim() ? group.name : format_group_name(group.id),
					index: Number.isInteger(group.index) ? group.index : index
				})

				return groups
			}, [])
		: undefined

	return {
		port: config.port,
		site_groups,
		format: config.format,
		server: typeof config.server === 'string' && config.server.trim()
			? config.server.trim().replace(/\/+$/, '')
			: undefined
	}
}

export function resolve_format_options(config: ServerConfig): FormatOptions {
	return { ...DEFAULT_FORMAT_OPTIONS, ...(config.format ?? {}) }
}

export async function read_server_config(base_dir: string): Promise<ServerConfig> {
	const config_data = await fs.readFile(get_server_config_path(base_dir), 'utf-8')
	return normalize_server_config(load_yaml(config_data) as ServerConfig)
}

export async function write_server_config(base_dir: string, config: ServerConfig): Promise<void> {
	await fs.writeFile(get_server_config_path(base_dir), dump_yaml(normalize_server_config(config), { lineWidth: -1, noRefs: true }))
}
