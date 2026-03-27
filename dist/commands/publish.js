import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { execSync, spawn } from 'child_process';
export async function publish(options) {
    const spinner = ora('Preparing deployment...').start();
    try {
        const site_dir = path.resolve(options.dir);
        // Read primo.json
        const config_path = path.join(site_dir, 'primo.json');
        let config;
        try {
            const config_data = await fs.readFile(config_path, 'utf-8');
            config = JSON.parse(config_data);
        }
        catch {
            spinner.fail('No primo.json found. Run `primo new` first.');
            process.exit(1);
        }
        spinner.stop();
        // Determine provider
        let provider = options.provider;
        if (!provider) {
            const { selected_provider } = await inquirer.prompt([{
                    type: 'list',
                    name: 'selected_provider',
                    message: 'Where do you want to deploy?',
                    choices: [
                        { name: 'Railway', value: 'railway' },
                        { name: 'Fly.io', value: 'fly' }
                    ]
                }]);
            provider = selected_provider;
        }
        // Check if provider CLI is installed
        const cli_installed = await check_provider_cli(provider);
        if (!cli_installed) {
            console.log('');
            console.log(chalk.yellow(`${provider} CLI not found. Install it first:`));
            if (provider === 'railway') {
                console.log(chalk.dim('  npm install -g @railway/cli'));
                console.log(chalk.dim('  railway login'));
            }
            else {
                console.log(chalk.dim('  curl -L https://fly.io/install.sh | sh'));
                console.log(chalk.dim('  fly auth login'));
            }
            process.exit(1);
        }
        // Generate deployment files
        spinner.start('Generating deployment files...');
        await generate_dockerfile(site_dir, config);
        if (provider === 'fly') {
            await generate_fly_toml(site_dir, config);
        }
        spinner.succeed('Deployment files generated');
        // Deploy
        if (provider === 'railway') {
            await deploy_to_railway(site_dir, config);
        }
        else {
            await deploy_to_fly(site_dir, config);
        }
    }
    catch (error) {
        spinner.fail(`Deployment failed: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
    }
}
async function check_provider_cli(provider) {
    try {
        if (provider === 'railway') {
            execSync('railway --version', { stdio: 'ignore' });
        }
        else {
            execSync('fly version', { stdio: 'ignore' });
        }
        return true;
    }
    catch {
        return false;
    }
}
async function generate_dockerfile(site_dir, config) {
    const dockerfile = `# Pala CMS Deployment
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git

WORKDIR /build
RUN git clone https://github.com/palacms/palacms.git . && \\
    go build -o palacms .

FROM alpine:3.19

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /build/palacms /app/palacms

COPY blocks/ /app/pb_data/blocks/
COPY pages/ /app/pb_data/pages/
COPY page-types/ /app/pb_data/page-types/
COPY site/ /app/pb_data/site/
COPY uploads/ /app/pb_data/uploads/ 2>/dev/null || true
COPY primo.json /app/pb_data/

RUN chmod +x /app/palacms

ENV PB_DATA_DIR=/app/pb_data

EXPOSE 8080

CMD ["/app/palacms", "serve", "--http", "0.0.0.0:8080"]
`;
    await fs.writeFile(path.join(site_dir, 'Dockerfile'), dockerfile);
    const dockerignore = `node_modules/
.git/
.primo/
*.log
.DS_Store
`;
    await fs.writeFile(path.join(site_dir, '.dockerignore'), dockerignore);
}
async function generate_fly_toml(site_dir, config) {
    const app_name = config.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const fly_toml = `app = "${app_name}"
primary_region = "sjc"

[build]

[env]
  PB_DATA_DIR = "/app/pb_data"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1

[mounts]
  source = "pb_data"
  destination = "/app/pb_data"
`;
    await fs.writeFile(path.join(site_dir, 'fly.toml'), fly_toml);
}
async function deploy_to_railway(site_dir, config) {
    console.log('');
    console.log(chalk.cyan('Deploying to Railway...'));
    const spinner = ora('Setting up Railway project...').start();
    try {
        try {
            execSync('railway status', { cwd: site_dir, stdio: 'ignore' });
            spinner.succeed('Linked to existing Railway project');
        }
        catch {
            spinner.text = 'Creating new Railway project...';
            execSync(`railway init --name "${config.name}"`, { cwd: site_dir, stdio: 'inherit' });
            spinner.succeed('Created new Railway project');
        }
    }
    catch (error) {
        spinner.fail('Failed to set up Railway project');
        throw error;
    }
    console.log('');
    console.log(chalk.dim('Building and deploying...'));
    console.log('');
    const deploy_process = spawn('railway', ['up', '--detach'], {
        cwd: site_dir,
        stdio: 'inherit'
    });
    return new Promise((resolve, reject) => {
        deploy_process.on('close', (code) => {
            if (code === 0) {
                console.log('');
                console.log(chalk.green('✓ Deployment started'));
                console.log('');
                console.log(chalk.dim('  railway open    - view deployment'));
                console.log(chalk.dim('  railway logs    - view logs'));
                resolve();
            }
            else {
                reject(new Error(`Railway deployment failed with code ${code}`));
            }
        });
    });
}
async function deploy_to_fly(site_dir, config) {
    console.log('');
    console.log(chalk.cyan('Deploying to Fly.io...'));
    const app_name = config.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const spinner = ora('Checking Fly.io app...').start();
    try {
        execSync(`fly status --app ${app_name}`, { cwd: site_dir, stdio: 'ignore' });
        spinner.succeed(`Found existing app: ${app_name}`);
    }
    catch {
        spinner.text = 'Creating Fly.io app...';
        execSync(`fly apps create ${app_name}`, { cwd: site_dir, stdio: 'inherit' });
        spinner.text = 'Creating persistent volume...';
        execSync(`fly volumes create pb_data --size 1 --region sjc --app ${app_name}`, {
            cwd: site_dir,
            stdio: 'inherit'
        });
        spinner.succeed(`Created app: ${app_name}`);
    }
    console.log('');
    console.log(chalk.dim('Building and deploying...'));
    console.log('');
    const deploy_process = spawn('fly', ['deploy'], {
        cwd: site_dir,
        stdio: 'inherit'
    });
    return new Promise((resolve, reject) => {
        deploy_process.on('close', (code) => {
            if (code === 0) {
                console.log('');
                console.log(chalk.green('✓ Deployed'));
                console.log('');
                console.log(chalk.cyan(`  https://${app_name}.fly.dev`));
                console.log(chalk.cyan(`  https://${app_name}.fly.dev/_/  (admin)`));
                resolve();
            }
            else {
                reject(new Error(`Fly deployment failed with code ${code}`));
            }
        });
    });
}
