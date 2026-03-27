import fs from 'fs/promises';
import { watch } from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import archiver from 'archiver';
import extract from 'extract-zip';
import { ensure_binary, ensure_data_dir } from '../utils/binary.js';
import { normalize_site } from './validate.js';
let cms_process = null;
let watchers = [];
let reimport_timeout = null;
let sync_interval = null;
let is_syncing = false;
let is_importing = false;
let is_cleaning_up = false;
// Track files written by sync to prevent watcher from re-pushing them
// Map of filepath -> mtime (ms) when we wrote it
const synced_files = new Map();
// Check if a port is in use
async function is_port_in_use(port) {
    try {
        const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(500)
        });
        return response.ok;
    }
    catch {
        return false;
    }
}
// Fetch with timeout helper
async function fetch_with_timeout(url, options = {}, timeout_ms = 10000) {
    const controller = new AbortController();
    const timeout_id = setTimeout(() => controller.abort(), timeout_ms);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        return response;
    }
    finally {
        clearTimeout(timeout_id);
    }
}
// Kill process with escalation to SIGKILL
async function kill_process(proc) {
    if (!proc || proc.killed)
        return;
    proc.kill('SIGTERM');
    // Wait up to 3 seconds for graceful shutdown
    const start = Date.now();
    while (Date.now() - start < 3000) {
        if (proc.killed || proc.exitCode !== null)
            return;
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    // Force kill if still running
    if (!proc.killed && proc.exitCode === null) {
        proc.kill('SIGKILL');
    }
}
export async function dev_server(options) {
    const spinner = ora('Starting Pala...').start();
    try {
        const base_dir = path.resolve(options.dir);
        // Check for server.json (multi-site mode) or primo.json (single-site mode)
        const server_config_path = path.join(base_dir, 'server.json');
        const site_config_path = path.join(base_dir, 'primo.json');
        let server_config = {};
        let sites = [];
        let is_server_mode = false;
        try {
            const server_data = await fs.readFile(server_config_path, 'utf-8');
            server_config = JSON.parse(server_data);
            is_server_mode = true;
        }
        catch {
            // No server.json, check for primo.json
        }
        let port = server_config.port || parseInt(options.port, 10);
        // Find an available port
        const max_port_attempts = 10;
        for (let i = 0; i < max_port_attempts; i++) {
            if (!await is_port_in_use(port))
                break;
            port++;
            if (i === max_port_attempts - 1) {
                spinner.fail(`Ports ${port - max_port_attempts + 1}-${port} are all in use`);
                process.exit(1);
            }
        }
        if (is_server_mode) {
            // Auto-discover sites in subdirectories
            spinner.text = 'Discovering sites...';
            sites = await discover_sites(base_dir);
            // Sites can be empty - the dashboard will show the site creation screen
        }
        else {
            // Single site mode
            try {
                const config_data = await fs.readFile(site_config_path, 'utf-8');
                const config = JSON.parse(config_data);
                sites = [{ dir: base_dir, config }];
            }
            catch {
                spinner.fail('No server.json or primo.json found. Run `primo new` first.');
                process.exit(1);
            }
        }
        // Ensure binary is installed
        spinner.text = 'Checking palacms...';
        const binary_path = await ensure_binary();
        // Create data directory in project folder
        const data_dir = await ensure_data_dir(base_dir);
        spinner.text = 'Starting CMS...';
        // Start the CMS binary with dev mode enabled
        cms_process = spawn(binary_path, ['serve', '--http', `127.0.0.1:${port}`, '--dir', data_dir], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, PALA_DEV_MODE: '1' }
        });
        // Capture stderr for errors
        let stderr_output = '';
        cms_process.stderr?.on('data', (data) => {
            stderr_output += data.toString();
        });
        // Wait for CMS to be ready
        const ready = await wait_for_ready(`http://127.0.0.1:${port}`, 30000);
        if (!ready) {
            spinner.fail('CMS failed to start');
            if (stderr_output) {
                console.log(chalk.red(stderr_output));
            }
            process.exit(1);
        }
        // Normalize and load all sites
        spinner.text = `Loading ${sites.length} site${sites.length > 1 ? 's' : ''}...`;
        const api_url = `http://127.0.0.1:${port}`;
        for (const site of sites) {
            await normalize_site(site.dir);
            await import_site_files(site.dir, api_url, site.config, port);
        }
        // Verify all sites are accessible before proceeding
        spinner.text = 'Verifying sites...';
        for (const site of sites) {
            await verify_site_ready(api_url, site.config.site_id);
        }
        spinner.succeed('Pala running');
        console.log('');
        if (is_server_mode) {
            console.log(`  ${chalk.cyan('Dashboard:')} http://127.0.0.1:${port}/admin/dashboard`);
            console.log('');
        }
        for (const site of sites) {
            const host = site.config.host || `${site.config.name.toLowerCase().replace(/\s+/g, '-')}.localhost:${port}`;
            console.log(`  ${chalk.cyan(site.config.name)}`);
            console.log(`    ${chalk.dim('Edit:')}    http://${host}/admin/site`);
            console.log(`    ${chalk.dim('Preview:')} http://${host}/`);
        }
        if (sites.length > 0 || !is_server_mode) {
            console.log('');
        }
        // Start watching for file changes
        const dirs_to_watch = ['blocks', 'page-types', 'pages', 'site'];
        const known_sites = new Set(sites.map(s => s.dir));
        const setup_site_watchers = (site) => {
            const schedule_reimport = () => {
                if (reimport_timeout) {
                    clearTimeout(reimport_timeout);
                }
                reimport_timeout = setTimeout(async () => {
                    try {
                        is_importing = true;
                        await normalize_site(site.dir);
                        await import_site_files(site.dir, api_url, site.config, port);
                        console.log(chalk.green(`  ✓ ${site.config.name} pushed`));
                    }
                    catch (err) {
                        console.log(chalk.red(`  ✗ ${site.config.name} push failed: ${err}`));
                    }
                    finally {
                        is_importing = false;
                    }
                }, 300);
            };
            for (const dir of dirs_to_watch) {
                const watch_path = path.join(site.dir, dir);
                try {
                    const watcher = watch(watch_path, { recursive: true }, async (event, filename) => {
                        if (!filename || filename.startsWith('.'))
                            return;
                        // Check if this file was just written by sync
                        const full_path = path.join(watch_path, filename);
                        const synced_mtime = synced_files.get(full_path);
                        if (synced_mtime) {
                            try {
                                const stat = await fs.stat(full_path);
                                // If mtime matches what we wrote, skip this event
                                if (Math.abs(stat.mtimeMs - synced_mtime) < 1000) {
                                    synced_files.delete(full_path);
                                    return;
                                }
                            }
                            catch {
                                // File might have been deleted
                            }
                            synced_files.delete(full_path);
                        }
                        console.log(chalk.dim(`  ${site.config.name}: ${dir}/${filename}`));
                        schedule_reimport();
                    });
                    watchers.push(watcher);
                }
                catch {
                    // Directory might not exist
                }
            }
        };
        // Set up watchers for existing sites
        for (const site of sites) {
            setup_site_watchers(site);
        }
        // Simple HTTP server for reload requests (only in server mode)
        if (is_server_mode) {
            const http = await import('http');
            const reload_server = http.createServer(async (req, res) => {
                if (req.method !== 'POST' || req.url !== '/reload') {
                    res.writeHead(404);
                    res.end();
                    return;
                }
                const new_sites = await discover_sites(base_dir);
                for (const site of new_sites) {
                    if (known_sites.has(site.dir))
                        continue;
                    known_sites.add(site.dir);
                    sites.push(site);
                    await normalize_site(site.dir);
                    await import_site_files(site.dir, api_url, site.config, port);
                    setup_site_watchers(site);
                    const host = site.config.host || `${path.basename(site.dir).toLowerCase().replace(/\s+/g, '-')}.localhost:${port}`;
                    console.log(chalk.green(`  ✓ New site loaded: ${site.config.name}`));
                    console.log(`    ${chalk.dim('Edit:')}    http://${host}/admin/site`);
                    console.log(`    ${chalk.dim('Preview:')} http://${host}/`);
                }
                res.writeHead(200);
                res.end('ok');
            });
            reload_server.listen(port + 1, '127.0.0.1');
        }
        // Start polling for CMS changes (sync back to local files)
        sync_interval = setInterval(async () => {
            if (is_syncing || is_importing)
                return;
            for (const site of sites) {
                try {
                    await sync_from_cms(site.dir, api_url, site.config);
                }
                catch {
                    // Silently ignore sync errors
                }
            }
        }, 5000);
        console.log(chalk.dim('  Watching for changes...'));
        console.log(chalk.dim('  Press Ctrl+C to stop'));
        // Handle cleanup
        const cleanup = async () => {
            if (is_cleaning_up)
                return;
            is_cleaning_up = true;
            console.log(chalk.dim('\n  Shutting down...'));
            for (const watcher of watchers) {
                try {
                    watcher.close();
                }
                catch {
                    // Ignore watcher close errors
                }
            }
            watchers = [];
            if (reimport_timeout) {
                clearTimeout(reimport_timeout);
                reimport_timeout = null;
            }
            if (sync_interval) {
                clearInterval(sync_interval);
                sync_interval = null;
            }
            if (cms_process) {
                await kill_process(cms_process);
                cms_process = null;
            }
            process.exit(0);
        };
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
        process.on('uncaughtException', (err) => {
            console.error(chalk.red(`\n  Uncaught exception: ${err.message}`));
            cleanup();
        });
        process.on('unhandledRejection', (reason) => {
            console.error(chalk.red(`\n  Unhandled rejection: ${reason}`));
            cleanup();
        });
        // Keep process alive
        await new Promise(() => { });
    }
    catch (error) {
        spinner.fail(`Failed to start: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
    }
}
async function discover_sites(base_dir) {
    const sites = [];
    const entries = await fs.readdir(base_dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
            const site_dir = path.join(base_dir, entry.name);
            const config_path = path.join(site_dir, 'primo.json');
            try {
                const config_data = await fs.readFile(config_path, 'utf-8');
                const config = JSON.parse(config_data);
                sites.push({ dir: site_dir, config });
            }
            catch {
                // Not a site directory
            }
        }
    }
    return sites;
}
async function wait_for_ready(url, timeout_ms) {
    const start = Date.now();
    const health_url = `${url}/api/health`;
    while (Date.now() - start < timeout_ms) {
        try {
            const response = await fetch_with_timeout(health_url, {}, 2000);
            if (response.ok) {
                // Health check passed, but collections may not be ready yet
                // Give PocketBase a moment to finish initializing
                await new Promise(resolve => setTimeout(resolve, 500));
                return true;
            }
        }
        catch {
            // Server not ready yet
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
}
async function verify_site_ready(api_url, site_id) {
    const max_attempts = 20;
    const delay_ms = 100;
    for (let i = 0; i < max_attempts; i++) {
        try {
            const response = await fetch_with_timeout(`${api_url}/api/collections/sites/records/${site_id}`, {}, 5000);
            if (response.ok) {
                return true;
            }
        }
        catch {
            // Site not ready yet
        }
        await new Promise(resolve => setTimeout(resolve, delay_ms));
    }
    return false;
}
async function import_site_files(site_dir, api_url, config, port) {
    const site_name = config.name || 'My Site';
    const site_id = config.site_id;
    // Create ZIP of site files
    const zip_buffer = await create_site_zip(site_dir);
    // Use hostname from config, or generate from folder name
    const folder_name = path.basename(site_dir);
    const host = config.host || (folder_name.includes('.')
        ? `${folder_name}:${port}` // Looks like a domain
        : `${folder_name.toLowerCase().replace(/\s+/g, '-')}.localhost:${port}`);
    // Retry bootstrap up to 3 times (collections may not be ready immediately)
    const max_retries = 3;
    for (let attempt = 1; attempt <= max_retries; attempt++) {
        const form_data = new FormData();
        form_data.append('site_id', site_id);
        form_data.append('name', site_name);
        form_data.append('host', host);
        form_data.append('file', new Blob([zip_buffer]), 'site.zip');
        try {
            const bootstrap_response = await fetch_with_timeout(`${api_url}/api/palacms/bootstrap`, {
                method: 'POST',
                body: form_data
            }, 30000); // 30s timeout for imports
            if (bootstrap_response.ok) {
                return;
            }
            const error_text = await bootstrap_response.text();
            // Check if it's a collection not found error (timing issue)
            if (error_text.includes('collection') && attempt < max_retries) {
                await new Promise(resolve => setTimeout(resolve, 500 * attempt));
                continue;
            }
            console.log(chalk.yellow(`  Bootstrap failed (${bootstrap_response.status}): ${error_text}`));
            // Bootstrap failed, try regular import
            const import_form = new FormData();
            import_form.append('file', new Blob([zip_buffer]), 'site.zip');
            const import_response = await fetch_with_timeout(`${api_url}/api/palacms/import/${site_id}`, {
                method: 'POST',
                body: import_form
            }, 30000); // 30s timeout for imports
            if (!import_response.ok) {
                const import_error = await import_response.text();
                console.log(chalk.yellow(`  Import failed (${import_response.status}): ${import_error}`));
            }
            return;
        }
        catch (err) {
            if (attempt < max_retries) {
                await new Promise(resolve => setTimeout(resolve, 500 * attempt));
                continue;
            }
            console.log(chalk.yellow(`  Import error: ${err}`));
        }
    }
}
async function create_site_zip(dir) {
    return new Promise((resolve, reject) => {
        const archive = archiver('zip', { zlib: { level: 9 } });
        const chunks = [];
        archive.on('data', chunk => chunks.push(chunk));
        archive.on('end', () => resolve(Buffer.concat(chunks)));
        archive.on('error', reject);
        const dirs_to_include = ['blocks', 'page-types', 'pages', 'site', 'uploads'];
        for (const subdir of dirs_to_include) {
            const full_path = path.join(dir, subdir);
            archive.directory(full_path, subdir);
        }
        const primo_json = path.join(dir, 'primo.json');
        archive.file(primo_json, { name: 'primo.json' });
        archive.finalize();
    });
}
async function sync_from_cms(site_dir, api_url, config) {
    is_syncing = true;
    try {
        const response = await fetch_with_timeout(`${api_url}/api/palacms/export/${config.site_id}`, {}, 15000);
        if (!response.ok)
            return;
        const zip_data = await response.arrayBuffer();
        // Extract to temp directory
        const temp_dir = path.join(site_dir, '.primo', 'sync-temp');
        const temp_zip = path.join(temp_dir, 'export.zip');
        await fs.mkdir(temp_dir, { recursive: true });
        await fs.writeFile(temp_zip, Buffer.from(zip_data));
        await extract(temp_zip, { dir: temp_dir });
        await fs.unlink(temp_zip);
        // Compare and sync files
        const dirs_to_sync = ['blocks', 'page-types', 'pages', 'site'];
        const changed_files = [];
        for (const dir of dirs_to_sync) {
            const temp_path = path.join(temp_dir, dir);
            const local_path = path.join(site_dir, dir);
            try {
                const files = await sync_directory(temp_path, local_path, dir);
                changed_files.push(...files);
            }
            catch {
                // Directory might not exist in export
            }
        }
        // Clean up temp directory
        await fs.rm(temp_dir, { recursive: true, force: true });
        if (changed_files.length > 0) {
            for (const file of changed_files) {
                console.log(chalk.blue(`  ↓ ${config.name}: ${file}`));
            }
        }
    }
    finally {
        is_syncing = false;
    }
}
async function sync_directory(src, dest, relative_path = '') {
    const changed_files = [];
    const entries = await fs.readdir(src, { withFileTypes: true });
    await fs.mkdir(dest, { recursive: true });
    for (const entry of entries) {
        const src_path = path.join(src, entry.name);
        const dest_path = path.join(dest, entry.name);
        const file_relative = relative_path ? `${relative_path}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
            const nested = await sync_directory(src_path, dest_path, file_relative);
            changed_files.push(...nested);
        }
        else {
            const src_content = await fs.readFile(src_path, 'utf-8');
            let dest_content = '';
            try {
                dest_content = await fs.readFile(dest_path, 'utf-8');
            }
            catch {
                // File doesn't exist locally
            }
            // Normalize to handle trailing newline/whitespace differences
            if (src_content.trim() !== dest_content.trim()) {
                // Track this file BEFORE writing to avoid race with watcher
                // Use current time as estimate, watcher allows 1 second tolerance
                synced_files.set(dest_path, Date.now());
                await fs.writeFile(dest_path, src_content);
                // Update with actual mtime after write
                const stat = await fs.stat(dest_path);
                synced_files.set(dest_path, stat.mtimeMs);
                changed_files.push(file_relative);
            }
        }
    }
    return changed_files;
}
