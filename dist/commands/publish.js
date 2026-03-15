import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import readline from 'readline';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROVIDERS = [
    { name: 'Vercel', value: 'vercel', description: 'Static hosting with edge network', type: 'static' },
    { name: 'Netlify', value: 'netlify', description: 'Static hosting with serverless functions', type: 'static' },
    { name: 'Cloudflare Pages', value: 'cloudflare', description: 'Static hosting on Cloudflare edge', type: 'static' },
    { name: 'Primo Server', value: 'primo', description: 'Sync to your self-hosted Primo CMS', type: 'cms' }
];
async function prompt_select(message, choices) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        console.log('');
        console.log(chalk.bold(message));
        console.log('');
        choices.forEach((choice, i) => {
            const prefix = chalk.dim(`  ${i + 1}.`);
            const name = chalk.white(choice.name);
            const desc = choice.description ? chalk.dim(` - ${choice.description}`) : '';
            console.log(`${prefix} ${name}${desc}`);
        });
        console.log('');
        rl.question(chalk.cyan('  Enter number: '), (answer) => {
            rl.close();
            const index = parseInt(answer, 10) - 1;
            if (index >= 0 && index < choices.length) {
                resolve(choices[index].value);
            }
            else {
                resolve(choices[0].value);
            }
        });
    });
}
async function prompt_confirm(message) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(chalk.cyan(`${message} (Y/n): `), (answer) => {
            rl.close();
            resolve(answer.toLowerCase() !== 'n');
        });
    });
}
async function run_command(command, args, cwd) {
    return new Promise((resolve) => {
        const child = spawn(command, args, {
            cwd,
            stdio: ['inherit', 'pipe', 'pipe'],
            shell: true
        });
        let output = '';
        child.stdout?.on('data', (data) => {
            output += data.toString();
            process.stdout.write(data);
        });
        child.stderr?.on('data', (data) => {
            output += data.toString();
            process.stderr.write(data);
        });
        child.on('close', (code) => {
            resolve({ success: code === 0, output });
        });
        child.on('error', (err) => {
            resolve({ success: false, output: err.message });
        });
    });
}
async function check_cli_installed(cli) {
    try {
        const { success } = await run_command('which', [cli], process.cwd());
        return success;
    }
    catch {
        return false;
    }
}
async function build_static_site(site_dir, spinner) {
    const cli_root = path.resolve(__dirname, '..', '..');
    const dev_dir = path.join(cli_root, '.pala-dev');
    const dist_dir = path.join(site_dir, 'dist');
    // Step 1: Generate the Vite project by starting dev server briefly
    spinner.text = 'Generating build files...';
    // Import dev server functions dynamically to reuse the generation logic
    const { dev_server } = await import('./dev.js');
    // Start dev server in background to generate files
    const dev_promise = new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(), 5000);
    });
    // Run dev server briefly using spawn
    const dev_process = spawn('npx', ['pala', 'dev', '-p', '4998'], {
        cwd: site_dir,
        stdio: 'ignore',
        detached: true
    });
    await new Promise(resolve => setTimeout(resolve, 6000));
    try {
        process.kill(-dev_process.pid, 'SIGTERM');
    }
    catch { }
    // Check if .pala-dev exists
    try {
        await fs.access(dev_dir);
    }
    catch {
        return null;
    }
    // Step 2: Create vite.config.js if needed
    const vite_config_path = path.join(dev_dir, 'vite.config.js');
    try {
        await fs.access(vite_config_path);
    }
    catch {
        await fs.writeFile(vite_config_path, `
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [
		svelte({
			compilerOptions: {
				runes: true
			}
		})
	],
	resolve: {
		dedupe: ['svelte']
	},
	build: {
		outDir: 'dist',
		rollupOptions: {
			input: {
				main: 'index.html',
				app: 'app.html'
			}
		}
	}
})
`);
    }
    // Step 3: Run Vite build
    spinner.text = 'Building for production...';
    const build_result = await run_command('npx', ['vite', 'build'], dev_dir);
    if (!build_result.success) {
        return null;
    }
    // Step 4: Copy to site dist
    spinner.text = 'Preparing deployment files...';
    await fs.rm(dist_dir, { recursive: true, force: true });
    await fs.cp(path.join(dev_dir, 'dist'), dist_dir, { recursive: true });
    // Step 5: Rename app.html to index.html
    const app_html = path.join(dist_dir, 'app.html');
    const index_html = path.join(dist_dir, 'index.html');
    try {
        await fs.unlink(index_html);
    }
    catch { }
    try {
        await fs.rename(app_html, index_html);
    }
    catch { }
    return dist_dir;
}
async function publish_vercel(dist_dir, spinner) {
    // Create vercel.json for SPA routing
    await fs.writeFile(path.join(dist_dir, 'vercel.json'), JSON.stringify({
        rewrites: [{ source: '/(.*)', destination: '/index.html' }]
    }, null, 2));
    spinner.stop();
    console.log('');
    console.log(chalk.dim('  Running Vercel deployment...'));
    console.log('');
    const result = await run_command('npx', ['vercel', '--prod', '--yes'], dist_dir);
    return result.success;
}
async function publish_netlify(dist_dir, spinner) {
    // Create _redirects for SPA routing
    await fs.writeFile(path.join(dist_dir, '_redirects'), '/*    /index.html   200\n');
    spinner.stop();
    console.log('');
    console.log(chalk.dim('  Running Netlify deployment...'));
    console.log('');
    const result = await run_command('npx', ['netlify', 'deploy', '--prod', '--dir', '.'], dist_dir);
    return result.success;
}
async function publish_cloudflare(dist_dir, spinner) {
    // Create _redirects for SPA routing
    await fs.writeFile(path.join(dist_dir, '_redirects'), '/*    /index.html   200\n');
    spinner.stop();
    console.log('');
    console.log(chalk.dim('  Running Cloudflare Pages deployment...'));
    console.log('');
    const result = await run_command('npx', ['wrangler', 'pages', 'deploy', '.', '--project-name', 'primo-site'], dist_dir);
    return result.success;
}
async function publish_primo(site_dir, spinner) {
    spinner.text = 'Syncing to Primo server...';
    // Read pala.json for server config
    const config_path = path.join(site_dir, 'pala.json');
    let config;
    try {
        const data = await fs.readFile(config_path, 'utf-8');
        config = JSON.parse(data);
    }
    catch {
        spinner.fail('No pala.json found. Export a site first with `primo export`.');
        return false;
    }
    if (!config.host || !config.site_id) {
        spinner.fail('pala.json missing host or site_id.');
        return false;
    }
    spinner.stop();
    console.log('');
    console.log(chalk.dim(`  Syncing to ${config.host}...`));
    console.log('');
    const result = await run_command('npx', ['pala', 'import'], site_dir);
    return result.success;
}
export async function publish(options) {
    const site_dir = path.resolve(options.dir);
    const spinner = ora('Preparing to publish...').start();
    // Check for pala.json
    const config_path = path.join(site_dir, 'pala.json');
    let config;
    try {
        const data = await fs.readFile(config_path, 'utf-8');
        config = JSON.parse(data);
        spinner.succeed(`Found site: ${chalk.cyan(config.name)}`);
    }
    catch {
        spinner.fail('No pala.json found. Run this from a Primo site directory.');
        process.exit(1);
    }
    // Check for saved provider preference
    const prefs_path = path.join(site_dir, '.primo-publish.json');
    let saved_provider = null;
    try {
        const prefs = JSON.parse(await fs.readFile(prefs_path, 'utf-8'));
        saved_provider = prefs.provider;
    }
    catch { }
    // Select provider
    let provider = options.provider;
    if (!provider && saved_provider) {
        const use_saved = await prompt_confirm(`Publish to ${saved_provider} again?`);
        if (use_saved) {
            provider = saved_provider;
        }
    }
    if (!provider) {
        provider = await prompt_select('Where would you like to publish?', PROVIDERS);
        // Save preference
        const save_pref = await prompt_confirm('Remember this choice for next time?');
        if (save_pref) {
            await fs.writeFile(prefs_path, JSON.stringify({ provider }, null, 2));
        }
    }
    console.log('');
    const spinner2 = ora(`Publishing to ${provider}...`).start();
    let success = false;
    if (provider === 'primo') {
        // Sync to Primo server (no build needed)
        success = await publish_primo(site_dir, spinner2);
    }
    else {
        // Build static site first
        const dist_dir = await build_static_site(site_dir, spinner2);
        if (!dist_dir) {
            spinner2.fail('Build failed.');
            process.exit(1);
        }
        // Deploy to selected provider
        switch (provider) {
            case 'vercel':
                success = await publish_vercel(dist_dir, spinner2);
                break;
            case 'netlify':
                success = await publish_netlify(dist_dir, spinner2);
                break;
            case 'cloudflare':
                success = await publish_cloudflare(dist_dir, spinner2);
                break;
        }
    }
    console.log('');
    if (success) {
        console.log(chalk.green('  ✓ Published successfully!'));
    }
    else {
        console.log(chalk.red('  ✗ Publish failed. Check the output above for errors.'));
    }
    console.log('');
}
