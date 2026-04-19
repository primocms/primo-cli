import fs from 'fs/promises'
import path from 'path'
import { dump as dump_yaml, load as load_yaml } from 'js-yaml'

export interface SiteConfig {
	name: string
	site_id: string
	host?: string
	server?: string
	group?: string
}

export const SITE_CONFIG_FILE = 'site.yaml'

export function get_site_config_path(site_dir: string): string {
	return path.join(site_dir, SITE_CONFIG_FILE)
}

export async function read_site_config(site_dir: string): Promise<SiteConfig> {
	const config_data = await fs.readFile(get_site_config_path(site_dir), 'utf-8')
	return load_yaml(config_data) as SiteConfig
}

export async function write_site_config(site_dir: string, config: SiteConfig): Promise<void> {
	await fs.writeFile(get_site_config_path(site_dir), dump_yaml(config, { lineWidth: -1, noRefs: true }))
}
