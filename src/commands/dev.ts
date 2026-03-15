import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'
import ora from 'ora'
import chokidar from 'chokidar'
import { createServer, type InlineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import extract from 'extract-zip'
import yaml from 'js-yaml'
import { get_auth_token } from '../utils/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface DevOptions {
	dir: string
	port: string
	server?: string
	site?: string
	token?: string
}

interface PalaConfig {
	name: string
	host: string
	site_id: string
}

interface BlockField {
	key?: string
	name?: string
	type: string
	label?: string
	options?: {
		field?: string  // For page-field type: references page.fields by ID
		page_type?: string  // For page-list type: filters pages by page_type
	}
}

interface BlockData {
	name: string
	html: string
	css: string
	js: string
	fields: BlockField[]
}

interface PageSection {
	block: string
	content: Record<string, any>
}

interface PageData {
	name: string
	slug: string
	page_type: string
	fields: Record<string, any>
	sections: PageSection[]
	index?: number
}

interface PageTypeLayout {
	header: { block: string; index: number }[]
	footer: { block: string; index: number }[]
}

// Track page state for new/updated indicators
interface PageStatus {
	new_pages: Set<string>
	updated_pages: Set<string>
}

let initial_page_hashes: Map<string, string> = new Map()
let page_status: PageStatus = { new_pages: new Set(), updated_pages: new Set() }

function hash_page(page: PageData): string {
	return JSON.stringify({ name: page.name, slug: page.slug, sections: page.sections, fields: page.fields })
}

export async function dev_server(options: DevOptions) {
	const spinner = ora('Starting development server...').start()

	try {
		let site_dir = path.resolve(options.dir)
		const port = parseInt(options.port, 10)

		// If server and site are provided, export from remote first
		if (options.server && options.site) {
			const server = normalize_server_url(options.server)
			const site_id = options.site

			spinner.text = 'Connecting to server...'

			// Get auth token
			const token = options.token || await get_auth_token(server)
			if (!token) {
				spinner.fail(`Authentication required. Run 'pala login ${options.server}' first.`)
				process.exit(1)
			}

			// Create output directory (use site_id as folder name)
			site_dir = path.resolve(options.dir, site_id)
			await fs.mkdir(site_dir, { recursive: true })

			spinner.text = 'Exporting site from server...'

			const response = await fetch(`${server}/api/palacms/export/${site_id}`, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			})

			if (!response.ok) {
				const error = await response.text()
				spinner.fail(`Export failed: ${error}`)
				process.exit(1)
			}

			// Save ZIP temporarily
			const zip_data = await response.arrayBuffer()
			const temp_zip = path.join(site_dir, '.pala-export.zip')
			await fs.writeFile(temp_zip, Buffer.from(zip_data))

			// Extract ZIP
			spinner.text = 'Extracting files...'
			await extract(temp_zip, { dir: site_dir })

			// Clean up temp ZIP
			await fs.unlink(temp_zip)

			spinner.succeed(`Site exported to ${site_dir}`)
			spinner.start('Starting development server...')
		}

		// Generate dev project inside CLI directory so Vite finds node_modules naturally
		const cli_root = path.resolve(__dirname, '..', '..')
		const dev_dir = path.join(cli_root, '.pala-dev')

		// Read pala.json
		const config_path = path.join(site_dir, 'pala.json')
		let config: PalaConfig

		try {
			const config_data = await fs.readFile(config_path, 'utf-8')
			config = JSON.parse(config_data)
		} catch {
			spinner.fail('No pala.json found. Run `pala export` first to get a site.')
			process.exit(1)
		}

		spinner.text = 'Loading site data...'

		// Load blocks, pages, site content, and page type layouts
		const blocks = await load_blocks(site_dir)
		const pages = await load_pages(site_dir)
		const site_content = await load_site_content(site_dir)
		const page_type_layouts = await load_page_type_layouts(site_dir)
		const page_type_configs = await load_page_type_configs(site_dir)

		// Initialize page tracking - capture initial state
		initial_page_hashes.clear()
		page_status = { new_pages: new Set(), updated_pages: new Set() }
		for (const [page_path, page] of Object.entries(pages)) {
			initial_page_hashes.set(page_path, hash_page(page))
		}
		const site_css = await read_file_or_empty(path.join(site_dir, 'site', 'variables.css'))
		const site_head = await read_file_or_empty(path.join(site_dir, 'site', 'head.html'))

		spinner.text = 'Generating Vite project...'

		// Generate Vite project
		await generate_vite_project(dev_dir, blocks, pages, site_content, page_type_layouts, page_type_configs, site_css, site_head, config)

		spinner.text = 'Starting Vite dev server...'

		// Start Vite with inline config (no config file needed)
		// Since dev_dir is inside cli_root, Vite will naturally find node_modules
		const vite_config: InlineConfig = {
			root: dev_dir,
			configFile: false,
			plugins: [
				svelte({
					compilerOptions: {
						runes: true
					}
				}),
			],
			resolve: {
				dedupe: ['svelte']
			},
			server: {
				port,
				open: false,
				hmr: true
			},
			logLevel: 'error'
		}

		const server = await createServer(vite_config)

		await server.listen()

		spinner.succeed(`Development server running at ${chalk.cyan(`http://localhost:${port}`)}`)
		console.log('')
		console.log(chalk.dim(`  Site: ${config.name}`))
		console.log(chalk.dim(`  Blocks: ${Object.keys(blocks).length}`))
		console.log(chalk.dim(`  Pages: ${Object.keys(pages).length}`))
		console.log('')
		console.log(chalk.green('  ✓ Real Svelte compilation with HMR'))
		console.log('')

		// Watch for changes in source files
		const watcher = chokidar.watch([
			path.join(site_dir, 'blocks'),
			path.join(site_dir, 'pages'),
			path.join(site_dir, 'site')
		], {
			ignoreInitial: true,
			ignored: ['**/.pala-dev/**', '**/node_modules/**']
		})

		watcher.on('change', async (file_path) => {
			console.log(chalk.dim(`  File changed: ${path.relative(site_dir, file_path)}`))
			await regenerate(site_dir, dev_dir)
		})

		watcher.on('add', async (file_path) => {
			console.log(chalk.dim(`  File added: ${path.relative(site_dir, file_path)}`))
			await regenerate(site_dir, dev_dir)
		})

		console.log(chalk.dim('  Watching for changes...'))
		console.log(chalk.dim('  Press Ctrl+C to stop'))

	} catch (error) {
		spinner.fail(`Failed to start server: ${error instanceof Error ? error.message : error}`)
		console.error(error)
		process.exit(1)
	}
}

async function regenerate(site_dir: string, dev_dir: string) {
	try {
		const blocks = await load_blocks(site_dir)
		const pages = await load_pages(site_dir)
		const site_content = await load_site_content(site_dir)
		const page_type_layouts = await load_page_type_layouts(site_dir)
		const page_type_configs = await load_page_type_configs(site_dir)
		const site_css = await read_file_or_empty(path.join(site_dir, 'site', 'variables.css'))
		const site_head = await read_file_or_empty(path.join(site_dir, 'site', 'head.html'))
		const config_data = await fs.readFile(path.join(site_dir, 'pala.json'), 'utf-8')
		const config = JSON.parse(config_data)

		// Track new and updated pages
		for (const [page_path, page] of Object.entries(pages)) {
			const current_hash = hash_page(page)
			const initial_hash = initial_page_hashes.get(page_path)

			if (!initial_hash) {
				// New page - didn't exist at startup
				page_status.new_pages.add(page_path)
				page_status.updated_pages.delete(page_path)
			} else if (current_hash !== initial_hash) {
				// Updated page - content changed
				page_status.updated_pages.add(page_path)
			}
		}

		await generate_blocks(dev_dir, blocks)
		await generate_pages(dev_dir, blocks, pages, site_content, page_type_layouts, page_type_configs)
		await generate_app(dev_dir, pages, blocks, site_content, site_css, site_head, config)

		// Regenerate toolbar with updated page statuses
		await generate_toolbar(dev_dir, pages, page_type_configs, config)
	} catch (error) {
		console.error(chalk.red(`  Regeneration error: ${error instanceof Error ? error.message : error}`))
	}
}

async function generate_toolbar(
	dev_dir: string,
	pages: Record<string, PageData>,
	page_type_configs: Record<string, PageTypeConfig>,
	config: PalaConfig
) {
	await fs.writeFile(path.join(dev_dir, 'index.html'), `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${config.name} - Pala Dev</title>
	<script src="https://cdn.jsdelivr.net/npm/iconify-icon@2.1.0/dist/iconify-icon.min.js"></script>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace; }

		#pala-toolbar {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			height: 44px;
			background: #09090b;
			color: #fafafa;
			font-size: 12px;
			z-index: 999999;
			display: flex;
			align-items: center;
			padding: 0 16px;
			gap: 16px;
			border-bottom: 1px solid #27272a;
			transition: transform 0.25s ease;
		}

		#pala-toolbar.collapsed { transform: translateY(-100%); }
		#pala-toolbar.collapsed .toolbar-toggle {
			transform: translateY(100%);
			border-radius: 0 0 6px 6px;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
		}

		.toolbar-brand {
			display: flex;
			align-items: center;
			gap: 10px;
			flex-shrink: 0;
		}
		.toolbar-logo { color: #a1a1aa; font-size: 16px; }
		.toolbar-title { font-weight: 600; letter-spacing: 0.05em; color: #a1a1aa; font-size: 11px; }

		.toolbar-divider {
			width: 1px;
			height: 24px;
			background: #27272a;
			flex-shrink: 0;
		}

		.toolbar-toggle {
			background: transparent;
			border: 1px solid #27272a;
			color: #71717a;
			cursor: pointer;
			padding: 6px 10px;
			font-size: 10px;
			border-radius: 4px;
			flex-shrink: 0;
		}
		.toolbar-toggle:hover { color: #fafafa; background: #18181b; }

		.toolbar-status-badge {
			display: inline-block;
			font-size: 9px;
			font-weight: 600;
			padding: 3px 6px;
			border-radius: 3px;
			margin-left: 8px;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		.toolbar-status-badge.new {
			background: #10b981;
			color: #fff;
		}
		.toolbar-status-badge.updated {
			background: #f59e0b;
			color: #fff;
		}

		.toolbar-viewport-controls {
			display: flex;
			gap: 4px;
			background: #18181b;
			padding: 4px;
			border-radius: 6px;
			border: 1px solid #27272a;
		}
		.viewport-btn {
			background: transparent;
			border: none;
			color: #71717a;
			cursor: pointer;
			padding: 6px 8px;
			font-size: 16px;
			border-radius: 4px;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.viewport-btn:hover {
			color: #fafafa;
			background: #27272a;
		}
		.viewport-btn.active {
			color: #fafafa;
			background: #6366f1;
		}

		.toolbar-spacer { flex: 1; }

		.toolbar-dropdown {
			position: relative;
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.toolbar-dropdown-btn {
			display: flex;
			align-items: center;
			gap: 8px;
			background: #18181b;
			border: 1px solid #27272a;
			color: #fafafa;
			padding: 6px 12px;
			border-radius: 4px;
			font-size: 13px;
			cursor: pointer;
			font-family: system-ui, -apple-system, sans-serif;
		}
		.toolbar-dropdown-btn:hover {
			background: #27272a;
		}
		.dropdown-arrow {
			font-size: 10px;
			color: #71717a;
		}

		.toolbar-dropdown-menu {
			display: none;
			position: absolute;
			top: 100%;
			left: 0;
			margin-top: 4px;
			background: #09090b;
			border: 1px solid #27272a;
			border-radius: 6px;
			min-width: 320px;
			max-height: 80vh;
			overflow-y: auto;
			box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
			z-index: 1000;
		}
		.toolbar-dropdown-menu.open {
			display: block;
		}
		.toolbar-dropdown-menu a {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 10px 12px;
			color: #a1a1aa;
			text-decoration: none;
			font-size: 13px;
			font-family: system-ui, -apple-system, sans-serif;
			border-bottom: 1px solid #18181b;
		}
		.toolbar-dropdown-menu a:last-child {
			border-bottom: none;
		}
		.toolbar-dropdown-menu a:hover {
			background: #18181b;
		}
		.toolbar-dropdown-menu a.active .page-name {
			color: #f97316;
		}
		.toolbar-dropdown-menu a.child-page {
			padding-left: 40px;
		}
		.page-icon {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 24px;
			height: 24px;
			border-radius: 4px;
			flex-shrink: 0;
			font-size: 14px;
		}
		.page-icon iconify-icon {
			font-size: 16px;
		}
		.page-name {
			font-weight: 500;
			color: #fafafa;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.page-slug {
			color: #52525b;
			font-size: 11px;
		}
		.page-info {
			display: flex;
			flex-direction: column;
			gap: 2px;
			flex: 1;
			min-width: 0;
		}

		.page-badge {
			display: inline-block;
			font-size: 9px;
			font-weight: 600;
			padding: 2px 5px;
			border-radius: 3px;
			margin-left: 8px;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		.page-badge.new {
			background: #10b981;
			color: #fff;
		}
		.page-badge.updated {
			background: #f59e0b;
			color: #fff;
		}

		#site-frame-wrapper {
			position: fixed;
			top: 44px;
			left: 0;
			right: 0;
			bottom: 0;
			display: flex;
			justify-content: center;
			align-items: flex-start;
			background: #18181b;
			transition: top 0.25s ease, height 0.25s ease;
		}

		body.collapsed #site-frame-wrapper {
			top: 0;
		}

		#site-frame {
			border: none;
			height: 100%;
			width: 100%;
			max-width: 100%;
			background: white;
			transition: width 0.3s ease, max-width 0.3s ease;
		}

		#site-frame.mobile {
			max-width: 375px;
		}

		#site-frame.tablet {
			max-width: 768px;
		}

		#site-frame.desktop {
			max-width: 100%;
		}
	</style>
</head>
<body>
	<div id="pala-toolbar">
		<div class="toolbar-brand">
			<span class="toolbar-logo">◆</span>
			<span class="toolbar-title">PALA DEV</span>
		</div>
		<div class="toolbar-divider"></div>
		<div class="toolbar-dropdown">
			<button class="toolbar-dropdown-btn" onclick="toggleDropdown()">
				<span id="current-page-name">Home</span>
				<span class="dropdown-arrow">▼</span>
			</button>
			<span id="current-page-status"></span>
			<div class="toolbar-dropdown-menu" id="pages-menu"></div>
		</div>
		<div class="toolbar-spacer"></div>
		<div class="toolbar-viewport-controls">
			<button class="viewport-btn" data-viewport="mobile" onclick="setViewport('mobile')">
				<iconify-icon icon="mdi:cellphone"></iconify-icon>
			</button>
			<button class="viewport-btn" data-viewport="tablet" onclick="setViewport('tablet')">
				<iconify-icon icon="mdi:tablet"></iconify-icon>
			</button>
			<button class="viewport-btn active" data-viewport="desktop" onclick="setViewport('desktop')">
				<iconify-icon icon="mdi:monitor"></iconify-icon>
			</button>
		</div>
		<button class="toolbar-toggle" onclick="toggleToolbar()">▲</button>
	</div>
	<div id="site-frame-wrapper">
		<iframe id="site-frame"></iframe>
	</div>

	<script>
		// Set iframe src with correct initial hash based on browser URL
		const iframe = document.getElementById('site-frame');
		const initialPath = location.pathname;
		iframe.src = '/app.html#' + initialPath;

		const pages = ${JSON.stringify(Object.entries(pages).map(([path, page]) => {
			// Handle index pages: 'index' -> '/', 'blog/index' -> '/blog'
			let pagePath = '/' + path;
			if (path === 'index') pagePath = '/';
			else if (path.endsWith('/index')) pagePath = '/' + path.slice(0, -6);
			const pt_config = page_type_configs[page.page_type] || {};
			return {
				path: pagePath,
				name: page.name || path,
				index: page.index,
				status: page_status.new_pages.has(path) ? 'new' : page_status.updated_pages.has(path) ? 'updated' : null,
				icon: pt_config.icon || 'mdi:file-document-outline',
				color: pt_config.color || null
			};
		}))};

		const pagesMenu = document.getElementById('pages-menu');
		let currentPath = initialPath;
		let dropdownOpen = false;

		// Organize pages by parent path
		const rootPages = [];
		const childPages = {};

		pages.forEach(page => {
			const parts = page.path.split('/').filter(Boolean);
			if (parts.length <= 1) {
				rootPages.push(page);
			} else {
				const parent = '/' + parts[0];
				if (!childPages[parent]) childPages[parent] = [];
				childPages[parent].push(page);
			}
		});

		// Sort root pages by index, then alphabetically, Home always first
		rootPages.sort((a, b) => {
			if (a.path === '/') return -1;
			if (b.path === '/') return 1;
			const aIdx = a.index ?? 999;
			const bIdx = b.index ?? 999;
			if (aIdx !== bIdx) return aIdx - bIdx;
			return a.name.localeCompare(b.name);
		});

		// Render page links in dropdown with hierarchy
		function createPageLink(page, isChild = false) {
			const a = document.createElement('a');
			a.href = '#';
			a.dataset.path = page.path;
			if (isChild) a.classList.add('child-page');
			if (page.path === '/') a.classList.add('active');

			// Page icon with iconify
			const iconWrapper = document.createElement('span');
			iconWrapper.className = 'page-icon';
			if (page.color) {
				iconWrapper.style.background = page.color;
				iconWrapper.style.color = '#fff';
			} else {
				iconWrapper.style.color = '#52525b';
			}
			const iconEl = document.createElement('iconify-icon');
			iconEl.setAttribute('icon', page.icon);
			iconWrapper.appendChild(iconEl);
			a.appendChild(iconWrapper);

			// Page info (name + slug)
			const info = document.createElement('span');
			info.className = 'page-info';

			const nameSpan = document.createElement('span');
			nameSpan.className = 'page-name';
			nameSpan.textContent = page.name;
			info.appendChild(nameSpan);

			const slugSpan = document.createElement('span');
			slugSpan.className = 'page-slug';
			slugSpan.textContent = page.path;
			info.appendChild(slugSpan);

			a.appendChild(info);

			// Add status badge if new or updated
			if (page.status) {
				const badge = document.createElement('span');
				badge.className = 'page-badge ' + page.status;
				badge.textContent = page.status;
				a.appendChild(badge);
			}

			a.onclick = (e) => {
				e.preventDefault();
				navigateTo(page.path);
				closeDropdown();
			};
			return a;
		}

		rootPages.forEach(page => {
			pagesMenu.appendChild(createPageLink(page));
			// Add children if any
			const children = childPages[page.path];
			if (children) {
				children.sort((a, b) => {
					const aIdx = a.index ?? 999;
					const bIdx = b.index ?? 999;
					if (aIdx !== bIdx) return aIdx - bIdx;
					return a.name.localeCompare(b.name);
				});
				children.forEach(child => {
					pagesMenu.appendChild(createPageLink(child, true));
				});
			}
		});

		function toggleDropdown() {
			dropdownOpen = !dropdownOpen;
			pagesMenu.classList.toggle('open', dropdownOpen);
		}

		function closeDropdown() {
			dropdownOpen = false;
			pagesMenu.classList.remove('open');
		}

		// Close dropdown when clicking outside
		document.addEventListener('click', (e) => {
			if (!e.target.closest('.toolbar-dropdown')) {
				closeDropdown();
			}
		});

		// Initialize page name on load
		updateActiveLink(currentPath);

		function navigateTo(path) {
			currentPath = path;
			updateActiveLink(path);
			// Navigate iframe using hash routing
			iframe.contentWindow.location.hash = path;
		}

		function updateActiveLink(path) {
			let pageName = 'Home';
			let parentName = null;
			let pageStatus = null;

			// Find the active page
			const activePage = pages.find(p => p.path === path);
			if (activePage) {
				pageName = activePage.name;
				pageStatus = activePage.status;

				// Check if this is a child page (has a parent path)
				const pathParts = path.split('/').filter(Boolean);
				if (pathParts.length > 1) {
					// Find parent page
					const parentPath = '/' + pathParts[0];
					const parentPage = pages.find(p => p.path === parentPath);
					if (parentPage) {
						parentName = parentPage.name;
					}
				}
			}

			// Update active state in dropdown
			document.querySelectorAll('.toolbar-dropdown-menu a').forEach(a => {
				a.classList.toggle('active', a.dataset.path === path);
			});

			// Update page name with breadcrumb
			const displayName = parentName ? parentName + ' > ' + pageName : pageName;
			document.getElementById('current-page-name').textContent = displayName;

			// Update status badge
			const statusEl = document.getElementById('current-page-status');
			if (pageStatus) {
				statusEl.className = 'toolbar-status-badge ' + pageStatus;
				statusEl.textContent = pageStatus;
			} else {
				statusEl.className = '';
				statusEl.textContent = '';
			}
		}

		function setViewport(size) {
			const iframe = document.getElementById('site-frame');
			iframe.className = size;

			// Update active button
			document.querySelectorAll('.viewport-btn').forEach(btn => {
				btn.classList.toggle('active', btn.dataset.viewport === size);
			});

			// Save preference
			localStorage.setItem('pala-viewport', size);
		}

		// Listen for navigation messages from iframe
		window.addEventListener('message', (e) => {
			if (e.data && e.data.type === 'pala-navigation') {
				const path = e.data.path;
				if (path !== currentPath) {
					currentPath = path;
					updateActiveLink(path);
				}
				// Always update browser URL to match iframe (handles initial load)
				if (location.pathname !== path) {
					history.replaceState({}, '', path);
				}
			}
		});

		// Listen for browser back/forward buttons
		window.addEventListener('popstate', () => {
			const path = location.pathname;
			if (path !== currentPath) {
				currentPath = path;
				updateActiveLink(path);
				// Update iframe to match browser URL
				iframe.contentWindow.location.hash = path;
			}
		});

		// Toggle toolbar
		function toggleToolbar() {
			const collapsed = document.body.classList.toggle('collapsed');
			document.getElementById('pala-toolbar').classList.toggle('collapsed', collapsed);
			document.querySelector('.toolbar-toggle').textContent = collapsed ? '▼' : '▲';
			localStorage.setItem('pala-toolbar-collapsed', collapsed);
		}

		// Restore state
		if (localStorage.getItem('pala-toolbar-collapsed') === 'true') {
			toggleToolbar();
		}

		// Restore viewport preference
		const savedViewport = localStorage.getItem('pala-viewport');
		if (savedViewport && ['mobile', 'tablet', 'desktop'].includes(savedViewport)) {
			setViewport(savedViewport);
		}
	</script>
</body>
</html>
`.trim())
}

async function generate_vite_project(
	dev_dir: string,
	blocks: Record<string, BlockData>,
	pages: Record<string, PageData>,
	site_content: Record<string, any>,
	page_type_layouts: Record<string, PageTypeLayout>,
	page_type_configs: Record<string, PageTypeConfig>,
	site_css: string,
	site_head: string,
	config: PalaConfig
) {
	// Create directory structure
	await fs.mkdir(dev_dir, { recursive: true })
	await fs.mkdir(path.join(dev_dir, 'src', 'blocks'), { recursive: true })
	await fs.mkdir(path.join(dev_dir, 'src', 'pages'), { recursive: true })

	// Write toolbar (index.html)
	await generate_toolbar(dev_dir, pages, page_type_configs, config)

	// Write app.html - the actual site content in iframe
	const clean_head = strip_svelte_syntax(site_head)
	await fs.writeFile(path.join(dev_dir, 'app.html'), `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${config.name}</title>
	${clean_head}
</head>
<body>
	<div id="app"></div>
	<script type="module" src="/src/main.js"></script>
</body>
</html>
`.trim())

	// Generate blocks
	await generate_blocks(dev_dir, blocks)

	// Generate pages
	await generate_pages(dev_dir, blocks, pages, site_content, page_type_layouts, page_type_configs)

	// Generate App.svelte and main.js
	await generate_app(dev_dir, pages, blocks, site_content, site_css, site_head, config)
}

async function generate_blocks(dev_dir: string, blocks: Record<string, BlockData>) {
	const blocks_dir = path.join(dev_dir, 'src', 'blocks')
	await fs.mkdir(blocks_dir, { recursive: true })

	// Track which blocks we've written to avoid duplicates
	const written = new Set<string>()

	for (const [key, block] of Object.entries(blocks)) {
		// Skip if we've already written this block (could have duplicate keys)
		const component_name = sanitize_component_name(block.name || key)
		if (written.has(component_name)) continue
		written.add(component_name)

		const svelte_code = assemble_block(block)
		await fs.writeFile(
			path.join(blocks_dir, `${component_name}.svelte`),
			svelte_code
		)
	}
}

function get_default_for_field_type(type: string): string {
	switch (type) {
		case 'text':
		case 'textarea':
		case 'markdown':
		case 'html':
		case 'code':
		case 'icon':
			return "''"
		case 'number':
			return '0'
		case 'checkbox':
			return 'false'
		case 'image':
		case 'link':
		case 'group':
		case 'site-field':
			return '{}'
		case 'repeater':
		case 'select':
			return '[]'
		case 'content':
			return '{ type: "doc", content: [] }'
		default:
			return 'undefined'
	}
}

// Convert ProseMirror/TipTap JSON to HTML
function prosemirror_to_html(doc: any): string {
	if (!doc || typeof doc !== 'object') return ''
	if (doc.type !== 'doc' || !Array.isArray(doc.content)) return ''

	function render_node(node: any): string {
		if (!node || typeof node !== 'object') return ''

		const children = Array.isArray(node.content)
			? node.content.map(render_node).join('')
			: ''

		switch (node.type) {
			case 'doc':
				return children
			case 'paragraph':
				return `<p>${children}</p>`
			case 'heading': {
				const level = node.attrs?.level || 1
				return `<h${level}>${children}</h${level}>`
			}
			case 'blockquote':
				return `<blockquote>${children}</blockquote>`
			case 'bulletList':
				return `<ul>${children}</ul>`
			case 'orderedList':
				return `<ol>${children}</ol>`
			case 'listItem':
				return `<li>${children}</li>`
			case 'codeBlock':
				return `<pre><code>${children}</code></pre>`
			case 'horizontalRule':
				return '<hr />'
			case 'hardBreak':
				return '<br />'
			case 'text': {
				let text = node.text || ''
				// Escape HTML
				text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
				// Apply marks
				if (Array.isArray(node.marks)) {
					for (const mark of node.marks) {
						switch (mark.type) {
							case 'bold':
							case 'strong':
								text = `<strong>${text}</strong>`
								break
							case 'italic':
							case 'em':
								text = `<em>${text}</em>`
								break
							case 'underline':
								text = `<u>${text}</u>`
								break
							case 'strike':
								text = `<s>${text}</s>`
								break
							case 'code':
								text = `<code>${text}</code>`
								break
							case 'link':
								const href = mark.attrs?.href || '#'
								text = `<a href="${href}">${text}</a>`
								break
						}
					}
				}
				return text
			}
			default:
				return children
		}
	}

	return render_node(doc)
}

// Make {#each} loops defensive by adding fallbacks for undefined/null iterables
function make_each_loops_safe(html: string): string {
	// Match {#each expression as ...} and wrap expression with (expression || [])
	// Handles both simple vars like `items` and nested access like `form.inputs`
	return html.replace(
		/\{#each\s+([a-zA-Z_][\w.?]*)\s+as\b/g,
		(_match, expr) => {
			// Don't double-wrap if already has parentheses
			if (expr.includes('(')) return _match
			return `{#each (${expr} || []) as`
		}
	)
}

// Make property access safe by adding optional chaining
// Transforms `logo.image.url` to `logo?.image?.url`
function make_property_access_safe(html: string): string {
	// Match property access chains inside { } expressions
	// e.g., {logo.image.url} or {#if logo.type === 'text'}
	return html.replace(
		/\{([^}]*)\}/g,
		(_match, content) => {
			// Transform property chains: word.word.word -> word?.word?.word
			// But skip:
			// - Already has optional chaining (?.): logo?.image
			// - Function calls: items.map(...)
			// - Array access: items[0]
			// - Strings: "some.text"
			// - Numbers: 1.5
			const transformed = content.replace(
				/\b([a-zA-Z_]\w*)\.([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)\b/g,
				(propMatch: string, first: string, rest: string) => {
					// Skip if already has optional chaining anywhere in the chain
					if (propMatch.includes('?.')) return propMatch
					// Skip common method names that shouldn't use optional chaining
					if (['toString', 'valueOf', 'hasOwnProperty'].includes(rest.split('.')[0])) {
						return propMatch
					}
					// Add ?. between each property access
					const parts = rest.split('.')
					return `${first}?.${parts.join('?.')}`
				}
			)
			return `{${transformed}}`
		}
	)
}

function assemble_block(block: BlockData): string {
	// Get unique fields with their types for defaults
	const seen_keys = new Set<string>()
	const fields_with_types: { key: string; type: string }[] = []
	for (const field of (block.fields || [])) {
		const key = field.key || field.name
		if (key && !seen_keys.has(key)) {
			seen_keys.add(key)
			fields_with_types.push({ key, type: field.type })
		}
	}

	// Build the component
	let code = ''

	// HTML template first - make it safe for undefined/null values
	let html = block.html || ''
	html = make_each_loops_safe(html)
	html = make_property_access_safe(html)
	code += html
	code += '\n'

	// Script with props - need to handle imports correctly
	if (fields_with_types.length > 0 || block.js) {
		code += '\n<script>\n'

		// Extract imports from existing JS and put them first
		const js_code = block.js || ''
		const import_regex = /^import\s+.*$/gm
		const imports: string[] = []
		let remaining_js = js_code.replace(import_regex, (match) => {
			imports.push(match)
			return ''
		}).trim()

		// Write imports first
		if (imports.length > 0) {
			code += imports.join('\n') + '\n\n'
		}

		// Then $props() with type-appropriate defaults
		if (fields_with_types.length > 0) {
			const props_with_defaults = fields_with_types
				.map(f => `${f.key} = ${get_default_for_field_type(f.type)}`)
				.join(', ')
			code += `\tlet { ${props_with_defaults} } = $props()\n`
		}

		// Then remaining JS code
		if (remaining_js) {
			code += `\n\t${remaining_js.replace(/\n/g, '\n\t')}\n`
		}
		code += '</script>\n'
	}

	// Style
	if (block.css) {
		code += `\n<style>\n${block.css}\n</style>\n`
	}

	return code
}

async function generate_pages(
	dev_dir: string,
	blocks: Record<string, BlockData>,
	pages: Record<string, PageData>,
	site_content: Record<string, any>,
	page_type_layouts: Record<string, PageTypeLayout>,
	page_type_configs: Record<string, PageTypeConfig>
) {
	const pages_dir = path.join(dev_dir, 'src', 'pages')
	await fs.mkdir(pages_dir, { recursive: true })

	for (const [page_path, page] of Object.entries(pages)) {
		const page_code = assemble_page(page, blocks, site_content, page_type_layouts, pages, page_type_configs)
		const safe_name = page_path.replace(/\//g, '_') || 'index'
		await fs.writeFile(
			path.join(pages_dir, `${safe_name}.svelte`),
			page_code
		)
	}
}

function assemble_page(page: PageData, blocks: Record<string, BlockData>, site_content: Record<string, any>, page_type_layouts: Record<string, PageTypeLayout>, pages: Record<string, PageData>, page_type_configs: Record<string, PageTypeConfig>): string {
	let sections = page.sections || []

	// Get header sections from page type layout
	const layout = page.page_type ? page_type_layouts[page.page_type] : undefined
	if (layout?.header && layout.header.length > 0) {
		// Convert header layout items to PageSection format with empty content
		// (page-field type fields will pull data from page.fields)
		// Skip header blocks that are already at the start of the page sections
		const sorted_header = layout.header.sort((a, b) => a.index - b.index)
		const header_sections: PageSection[] = sorted_header
			.filter((item, idx) => {
				// Skip if this header block is already at the corresponding position in page sections
				const existing = sections[idx]
				return !(existing && existing.block.toLowerCase() === item.block.toLowerCase())
			})
			.map(item => ({
				block: item.block,
				content: {} // Empty content - page-field fields will be populated
			}))
		sections = [...header_sections, ...sections]
	}

	// Get footer sections from page type layout
	if (layout?.footer && layout.footer.length > 0) {
		const sorted_footer = layout.footer.sort((a, b) => a.index - b.index)
		const footer_sections: PageSection[] = sorted_footer
			.filter((item, idx) => {
				// Skip if this footer block is already at the corresponding position at end of page sections
				const end_idx = sections.length - sorted_footer.length + idx
				const existing = sections[end_idx]
				return !(existing && existing.block.toLowerCase() === item.block.toLowerCase())
			})
			.map(item => ({
				block: item.block,
				content: {} // Empty content - site-field fields will be populated
			}))
		sections = [...sections, ...footer_sections]
	}

	if (sections.length === 0) {
		return `<p>Empty page: ${page.name}</p>`
	}

	// Collect unique block imports
	const block_imports = new Map<string, string>()
	sections.forEach((section, i) => {
		const block = blocks[section.block]
		if (block) {
			const component_name = sanitize_component_name(block.name || section.block)
			if (!block_imports.has(section.block)) {
				block_imports.set(section.block, component_name)
			}
		}
	})

	// Build imports
	const imports = Array.from(block_imports.entries())
		.map(([key, name]) => `\timport ${name} from '../blocks/${name}.svelte'`)
		.join('\n')

	// Build section renders
	const renders = sections.map((section, i) => {
		const block = blocks[section.block]
		if (!block) {
			return `\t<div style="padding: 1rem; background: #fee; border: 1px solid #f00;">Block not found: ${section.block}</div>`
		}

		// Build maps for field types, site-field and page-field references
		const field_types = new Map<string, string>()
		const site_field_names = new Map<string, string>() // field_name -> site_content_key
		const page_field_refs = new Map<string, string>() // field_name -> page field ID
		const page_list_fields = new Map<string, any>() // field_name -> { page_type: string }
		for (const field of (block.fields || [])) {
			const key = field.key || field.name
			if (key) {
				field_types.set(key, field.type)
				// site-field type fields reference site content by their field name
				if (field.type === 'site-field') {
					site_field_names.set(key, key)
				}
				// page-field type fields reference page fields by ID
				if (field.type === 'page-field' && field.options?.field) {
					page_field_refs.set(key, field.options.field)
				}
				// page-list type fields query pages by page_type
				if (field.type === 'page-list') {
					page_list_fields.set(key, field.options || {})
				}
			}
		}

		const component_name = sanitize_component_name(block.name || section.block)

		// Start with section content, then inject site content for site-field type fields
		const merged_content = { ...section.content }

		// For each site-field, inject the site content value if not already provided
		for (const [field_name, site_key] of site_field_names.entries()) {
			if (!merged_content[field_name] || merged_content[field_name] === null || merged_content[field_name] === '') {
				const site_value = site_content[site_key]
				if (site_value !== undefined && site_value !== null) {
					merged_content[field_name] = site_value
				}
			}
		}

		// For each page-field, inject the page field value (overrides section content)
		// Page fields may be stored by field ID or field name in page.fields
		for (const [field_name, field_id] of page_field_refs.entries()) {
			// Try lookup by field ID first, then by field name
			const page_value = page.fields?.[field_id] ?? page.fields?.[field_name]
			if (page_value !== undefined && page_value !== null) {
				// Always override section content for page-field types
				merged_content[field_name] = page_value
			}
		}

		// For each page-list field, query and inject matching pages
		for (const [field_name, options] of page_list_fields.entries()) {
			if (!merged_content[field_name] || merged_content[field_name] === null || merged_content[field_name] === '') {
				const page_type_filter = options.page_type
				const matching_pages = Object.entries(pages)
					.filter(([_, p]) => !page_type_filter || p.page_type === page_type_filter)
					.map(([page_path, p]) => {
						const pt_config = page_type_configs[p.page_type] || {}
						// Construct canonical URL from page_path (e.g., "blog/getting-started" -> "/blog/getting-started")
						const url = page_path ? `/${page_path}` : '/'
						return {
							title: p.fields?.title || '',
							canonical_url: url,
							featured_image: p.fields?.featured_image || null,
							author: p.fields?.author || '',
							excerpt: p.fields?.excerpt || '',
							publish_date: p.fields?.publish_date || '',
							description: p.fields?.description || '',
							color: pt_config.color || null,
							icon: pt_config.icon || 'mdi:file-document-outline',
							_meta: { name: p.name, url }
						}
					})
				merged_content[field_name] = matching_pages
			}
		}

		// Filter out null values and empty strings so component defaults are used instead
		const props = Object.entries(merged_content)
			.filter(([key, value]) => value !== null && value !== '')
			.map(([key, value]) => {
				// Convert rich-text ProseMirror docs to HTML
				const field_type = field_types.get(key)
				if (field_type === 'rich-text' && typeof value === 'object' && value?.type === 'doc') {
					const html = prosemirror_to_html(value)
					return `${key}={${JSON.stringify(html)}}`
				}
				return `${key}={${JSON.stringify(value)}}`
			})
			.join(' ')

		return `\t<${component_name} ${props} />`
	}).join('\n')

	return `<script>
${imports}
</script>

${renders}
`
}

function build_layout_props(block: BlockData, site_content: Record<string, any>): string {
	// Build props for layout components (site-navigation, site-footer)
	// These use site-field type fields that reference site content
	const props: string[] = []

	for (const field of (block.fields || [])) {
		const key = field.key || field.name
		if (!key) continue

		// For site-field type, inject the site content value
		if (field.type === 'site-field') {
			const site_value = site_content[key]
			if (site_value !== undefined && site_value !== null) {
				props.push(`${key}={${JSON.stringify(site_value)}}`)
			}
		}
	}

	return props.join(' ')
}

async function generate_app(
	dev_dir: string,
	pages: Record<string, PageData>,
	blocks: Record<string, BlockData>,
	site_content: Record<string, any>,
	site_css: string,
	site_head: string,
	config: PalaConfig
) {
	// Build page imports and routes
	const page_entries = Object.entries(pages)
	const imports = page_entries.map(([page_path], i) => {
		const safe_name = page_path.replace(/\//g, '_') || 'index'
		return `\timport Page_${i} from './pages/${safe_name}.svelte'`
	}).join('\n')

	const routes: string[] = []
	page_entries.forEach(([page_path, page], i) => {
		// Handle index pages: 'index' -> '/', 'blog/index' -> '/blog'
		let route = '/' + page_path
		if (page_path === 'index') route = '/'
		else if (page_path.endsWith('/index')) route = '/' + page_path.slice(0, -6)
		routes.push(`\t\t'${route}': Page_${i}`)
	})

	// Check for layout blocks (site-navigation and site-footer)
	const has_site_navigation = 'site-navigation' in blocks
	const has_site_footer = 'site-footer' in blocks

	// Build layout imports
	const layout_imports: string[] = []
	if (has_site_navigation) {
		layout_imports.push(`\timport SiteNavigation from './blocks/SiteNavigation.svelte'`)
	}
	if (has_site_footer) {
		layout_imports.push(`\timport SiteFooter from './blocks/SiteFooter.svelte'`)
	}

	// Build site content JSON for layout props
	const site_content_json = JSON.stringify(site_content)

	// Build layout wrapper start/end
	let layout_nav = ''
	let layout_footer = ''
	if (has_site_navigation) {
		const nav_props = build_layout_props(blocks['site-navigation'], site_content)
		layout_nav = `<SiteNavigation ${nav_props} />`
	}
	if (has_site_footer) {
		const footer_props = build_layout_props(blocks['site-footer'], site_content)
		layout_footer = `<SiteFooter ${footer_props} />`
	}

	// App.svelte with hash router (no toolbar - it's in the wrapper)
	await fs.writeFile(path.join(dev_dir, 'src', 'App.svelte'), `<script>
${imports}
${layout_imports.join('\n')}

	const routes = {
${routes.join(',\n')}
	}

	let path = $state(get_path())

	function get_path() {
		return window.location.hash.slice(1) || '/'
	}

	function notifyParent(newPath) {
		if (window.parent !== window) {
			window.parent.postMessage({ type: 'pala-navigation', path: newPath }, '*')
		}
	}

	// Intercept link clicks to use hash navigation
	function handleClick(e) {
		const link = e.target.closest('a[href]')
		if (!link) return

		const href = link.getAttribute('href')
		// Only handle internal links
		if (!href || href.startsWith('http') || href.startsWith('mailto:')) return
		// Already a hash link
		if (href.startsWith('#')) return

		e.preventDefault()
		const newPath = href.startsWith('/') ? href : '/' + href
		window.location.hash = newPath
	}

	$effect(() => {
		const handler = () => {
			if (document.startViewTransition) {
				document.startViewTransition(() => {
					path = get_path()
					notifyParent(path)
					window.scrollTo(0, 0)
				})
			} else {
				path = get_path()
				notifyParent(path)
				window.scrollTo(0, 0)
			}
		}
		window.addEventListener('hashchange', handler)
		document.addEventListener('click', handleClick)
		// Notify parent of initial path
		notifyParent(path)
		return () => {
			window.removeEventListener('hashchange', handler)
			document.removeEventListener('click', handleClick)
		}
	})

	let Page = $derived(routes[path] || routes['/'])
</script>

${layout_nav}

{#if Page}
	<Page />
{:else}
	<p>Page not found: {path}</p>
{/if}

${layout_footer}

<style>
	:global(*) {
		box-sizing: border-box;
	}
	:global(body) {
		margin: 0;
		font-family: system-ui, sans-serif;
	}
	${site_css}
</style>
`)

	// main.js
	await fs.writeFile(path.join(dev_dir, 'src', 'main.js'), `
import { mount } from 'svelte'
import App from './App.svelte'

const app = mount(App, {
	target: document.getElementById('app')
})

export default app
`.trim())
}

function sanitize_component_name(name: string): string {
	// Convert to PascalCase and remove invalid characters
	return name
		.split(/[-_\s]+/)
		.map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join('')
		.replace(/[^a-zA-Z0-9]/g, '')
}

async function load_blocks(site_dir: string): Promise<Record<string, BlockData>> {
	const blocks: Record<string, BlockData> = {}
	const blocks_dir = path.join(site_dir, 'blocks')

	try {
		const entries = await fs.readdir(blocks_dir, { withFileTypes: true })

		for (const entry of entries) {
			if (!entry.isDirectory()) continue

			const block_dir = path.join(blocks_dir, entry.name)
			const component_code = await read_file_or_empty(path.join(block_dir, 'component.svelte'))
			const fields_data = await read_file_or_empty(path.join(block_dir, 'fields.json'))

			// Parse component to extract html, css, js
			const { html, css, js } = parse_svelte_component(component_code)

			let fields: BlockField[] = []
			let name = entry.name

			if (fields_data) {
				try {
					const parsed = JSON.parse(fields_data)
					fields = parsed.fields || []
					name = parsed.name || entry.name
				} catch {}
			}

			blocks[entry.name] = { name, html, css, js, fields }
			blocks[name] = { name, html, css, js, fields }
		}
	} catch {}

	return blocks
}

function parse_svelte_component(code: string): { html: string; css: string; js: string } {
	let html = code
	let css = ''
	let js = ''

	// Extract style
	const style_match = code.match(/<style[^>]*>([\s\S]*?)<\/style>/)
	if (style_match) {
		css = style_match[1].trim()
		html = html.replace(style_match[0], '')
	}

	// Extract script
	const script_match = code.match(/<script[^>]*>([\s\S]*?)<\/script>/)
	if (script_match) {
		js = script_match[1].trim()
		html = html.replace(script_match[0], '')
	}

	html = html.trim()

	return { html, css, js }
}

async function load_pages(site_dir: string): Promise<Record<string, PageData>> {
	const pages: Record<string, PageData> = {}
	const pages_dir = path.join(site_dir, 'pages')

	async function scan_dir(dir: string, prefix: string = '') {
		try {
			const entries = await fs.readdir(dir, { withFileTypes: true })

			for (const entry of entries) {
				const full_path = path.join(dir, entry.name)

				if (entry.isDirectory()) {
					await scan_dir(full_path, prefix ? `${prefix}/${entry.name}` : entry.name)
				} else if (entry.name.endsWith('.json') || entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
					const ext = path.extname(entry.name)
					const page_path = prefix
						? `${prefix}/${entry.name.replace(ext, '')}`
						: entry.name.replace(ext, '')

					try {
						const data = await fs.readFile(full_path, 'utf-8')
						if (ext === '.json') {
							pages[page_path] = JSON.parse(data)
						} else {
							pages[page_path] = yaml.load(data) as PageData
						}
					} catch {}
				}
			}
		} catch {}
	}

	await scan_dir(pages_dir)
	return pages
}

async function load_site_content(site_dir: string): Promise<Record<string, any>> {
	const json_path = path.join(site_dir, 'site', 'content.json')
	const yaml_path = path.join(site_dir, 'site', 'content.yaml')
	const yml_path = path.join(site_dir, 'site', 'content.yml')

	let content: Record<string, any> = {}

	// Try JSON first, then YAML
	try {
		const data = await fs.readFile(json_path, 'utf-8')
		content = JSON.parse(data)
	} catch {
		try {
			const data = await fs.readFile(yaml_path, 'utf-8')
			content = yaml.load(data) as Record<string, any> || {}
		} catch {
			try {
				const data = await fs.readFile(yml_path, 'utf-8')
				content = yaml.load(data) as Record<string, any> || {}
			} catch {
				return {}
			}
		}
	}

	// Filter out empty keys and null values
	const filtered: Record<string, any> = {}
	for (const [key, value] of Object.entries(content)) {
		if (key && value !== null && value !== undefined) {
			filtered[key] = value
		}
	}
	return filtered
}

interface PageTypeConfig {
	icon?: string
	color?: string
}

async function load_page_type_configs(site_dir: string): Promise<Record<string, PageTypeConfig>> {
	const configs: Record<string, PageTypeConfig> = {}
	const page_types_dir = path.join(site_dir, 'page-types')

	try {
		const entries = await fs.readdir(page_types_dir, { withFileTypes: true })

		for (const entry of entries) {
			if (entry.isDirectory()) {
				const page_type_slug = entry.name
				const config_path = path.join(page_types_dir, page_type_slug, 'config.json')

				try {
					const config_data = await fs.readFile(config_path, 'utf-8')
					const config = JSON.parse(config_data)
					configs[page_type_slug] = {
						icon: config.icon || 'mdi:file-document-outline',
						color: config.color
					}
				} catch {
					configs[page_type_slug] = { icon: 'mdi:file-document-outline' }
				}
			}
		}
	} catch {}

	return configs
}

async function load_page_type_layouts(site_dir: string): Promise<Record<string, PageTypeLayout>> {
	const layouts: Record<string, PageTypeLayout> = {}
	const page_types_dir = path.join(site_dir, 'page-types')

	try {
		const entries = await fs.readdir(page_types_dir, { withFileTypes: true })

		for (const entry of entries) {
			if (entry.isDirectory()) {
				const page_type_slug = entry.name
				const type_dir = path.join(page_types_dir, page_type_slug)

				// Read header.json and footer.json if they exist
				let header: { block: string; index: number }[] = []
				let footer: { block: string; index: number }[] = []

				try {
					const header_path = path.join(type_dir, 'header.json')
					const header_data = await fs.readFile(header_path, 'utf-8')
					header = JSON.parse(header_data)
				} catch {}

				try {
					const footer_path = path.join(type_dir, 'footer.json')
					const footer_data = await fs.readFile(footer_path, 'utf-8')
					footer = JSON.parse(footer_data)
				} catch {}

				layouts[page_type_slug] = { header, footer }
			}
		}
	} catch {}

	return layouts
}

async function read_file_or_empty(file_path: string): Promise<string> {
	try {
		return await fs.readFile(file_path, 'utf-8')
	} catch {
		return ''
	}
}

function strip_svelte_syntax(html: string): string {
	// Extract style tags to preserve them
	const style_blocks: string[] = []
	let result = html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, (match) => {
		style_blocks.push(match)
		return `__STYLE_BLOCK_${style_blocks.length - 1}__`
	})

	// Remove Svelte block syntax like {#if ...}, {:else}, {/if}, {#each ...}, {/each}
	result = result
		.replace(/\{#if[^}]*\}/g, '')
		.replace(/\{:else[^}]*\}/g, '')
		.replace(/\{\/if\}/g, '')
		.replace(/\{#each[^}]*\}/g, '')
		.replace(/\{\/each\}/g, '')
		.replace(/\{#await[^}]*\}/g, '')
		.replace(/\{:then[^}]*\}/g, '')
		.replace(/\{:catch[^}]*\}/g, '')
		.replace(/\{\/await\}/g, '')

	// Remove Svelte expressions like {variable} - but only single-word ones to avoid CSS
	result = result.replace(/=\{[a-z_][a-z0-9_]*\}/gi, '=""')
	result = result.replace(/\{[a-z_][a-z0-9_.]*\}/gi, '')

	// Restore style blocks
	style_blocks.forEach((block, i) => {
		result = result.replace(`__STYLE_BLOCK_${i}__`, block)
	})

	// Clean up empty attribute values and malformed tags
	result = result.replace(/content=\s*\/>/g, '/>')
	result = result.replace(/href=\s*\/>/g, '/>')

	return result
}

function normalize_server_url(server: string): string {
	// Add https:// if no protocol specified
	if (!server.startsWith('http://') && !server.startsWith('https://')) {
		server = `https://${server}`
	}
	// Remove trailing slash
	return server.replace(/\/+$/, '')
}
