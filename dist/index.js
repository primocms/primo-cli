#!/usr/bin/env node
import { Command } from 'commander';
import { export_site } from './commands/export.js';
import { import_site } from './commands/import.js';
import { dev_server } from './commands/dev.js';
import { login } from './commands/login.js';
import { validate_site } from './commands/validate.js';
import { publish } from './commands/publish.js';
const program = new Command();
program
    .name('pala')
    .description('CLI for local Pala development')
    .version('0.1.0');
program
    .command('login')
    .description('Login to a Pala server')
    .argument('<server>', 'Pala server URL (e.g., pala.example.com)')
    .option('-e, --email <email>', 'Email address')
    .option('-p, --password <password>', 'Password')
    .action((server, options) => login({ server, ...options }));
program
    .command('export')
    .description('Export a site to local files')
    .requiredOption('-s, --server <url>', 'Pala server URL (e.g., https://pala.example.com)')
    .requiredOption('--site <id>', 'Site ID to export')
    .option('-o, --output <dir>', 'Output directory', '.')
    .option('-t, --token <token>', 'Authentication token')
    .action(export_site);
program
    .command('import')
    .description('Import local files back to a Pala server')
    .option('-s, --server <url>', 'Pala server URL (reads from pala.json if not provided)')
    .option('--site <id>', 'Site ID (reads from pala.json if not provided)')
    .option('-d, --dir <dir>', 'Directory to import from', '.')
    .option('-t, --token <token>', 'Authentication token')
    .option('--preview', 'Preview changes without applying them')
    .action(import_site);
program
    .command('dev')
    .description('Start local development server (optionally export from remote first)')
    .option('-d, --dir <dir>', 'Site directory', '.')
    .option('-p, --port <port>', 'Port to run on', '3000')
    .option('-s, --server <url>', 'Pala server URL to export from')
    .option('--site <id>', 'Site ID to export')
    .option('-t, --token <token>', 'Authentication token')
    .action(dev_server);
program
    .command('validate')
    .description('Validate site structure and fields')
    .option('-d, --dir <dir>', 'Site directory to validate', '.')
    .option('--strict', 'Enable strict validation (warnings as errors)')
    .action(validate_site);
program
    .command('publish')
    .description('Build and publish site to a hosting provider or Primo server')
    .option('-d, --dir <dir>', 'Site directory', '.')
    .option('-p, --provider <provider>', 'Provider (vercel, netlify, cloudflare, primo)')
    .action(publish);
program.parse();
