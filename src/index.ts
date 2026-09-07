#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Command } from 'commander'
import chalk from 'chalk'
import { init_workspace } from './commands/init.js'
import { new_site } from './commands/new.js'
import { pull_site } from './commands/pull.js'
import { push_site } from './commands/push.js'
import { pull_library } from './commands/pull-library.js'
import { push_library } from './commands/push-library.js'
import { dev_server } from './commands/dev.js'
import { login } from './commands/login.js'
import { validate_site } from './commands/validate.js'
import { deploy } from './commands/deploy.js'
import { build_site } from './commands/build.js'

const pkg_path = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json')
const pkg_version = JSON.parse(fs.readFileSync(pkg_path, 'utf-8')).version as string

const program = new Command()

program
	.name('primo')
	.description('Build sites visually, edit them anywhere')
	.version(pkg_version)

// Top-level help: prepend a Deploy-vs-build-vs-push decision tree so first-time
// users can pick a command without reading every description. Use 'before' so
// it only renders for the root program, not subcommand help.
program.addHelpText('before', `
${chalk.bold('Local development')}
  ${chalk.cyan('primo dev')}      Run the local CMS on this workspace

${chalk.bold('Going live — pick one')}
  Want others to edit content? .................. ${chalk.cyan('primo deploy')}
  Just hosting a static blog? ................... ${chalk.cyan('primo build')}
  Already have a hosted Primo server? ........... ${chalk.cyan('primo push')}
`)

program
	.command('init [name]')
	.description('Initialize a new Primo workspace (server) in a new folder or the current directory')
	.action((name) => init_workspace({ name }))

program
	.command('new [name]')
	.description('Create a new site in the current workspace and start local CMS')
	.option('-t, --template <template>', 'Starter template')
	.option('--skip-dev', 'Create files only, don\'t start CMS')
	.action((name, options) => new_site({ name, ...options }))

program
	.command('dev')
	.description('Start local CMS')
	.option('-d, --dir <dir>', 'Site directory', '.')
	.option('-p, --port <port>', 'Port', '3000')
	.option('-f, --force', 'Kill existing processes on the port')
	.option('--author <mode>', 'Who is authoring this session: "files" (push only; CMS UI is read-only — default), "cms" (CMS edits write to files; file edits revert), "both" (bidirectional; CMS edits often lost on conflict — beta)', 'files')
	.action(dev_server)

program
	.command('deploy')
	.description('Deploy this workspace (all sites) with editable CMS (Railway, Fly)')
	.option('-p, --provider <provider>', 'Provider: railway | fly')
	.option('--no-push', 'Skip uploading the workspace after provisioning (you can run `primo push` later)')
	.option('--dry-run', 'Show what would be deployed without doing anything')
	.addHelpText('after', `
${chalk.bold('Supported providers')}
  railway   Railway (railway.com) — requires the Railway CLI and a logged-in account
  fly       Fly.io — requires the flyctl CLI and a logged-in account

For other hosts (Netlify, Vercel, Cloudflare, GitHub Pages), use ${chalk.cyan('primo build')}
on a single site and deploy the output folder with that host's CLI.

${chalk.bold('Workspace layout uploaded as one unit')}
  server.yaml
  library/      (if present)
  sites/        (every site under this directory)

${chalk.bold('See also')}
  primo build   Export a single site as static files
  primo push    Sync local changes to an existing hosted Primo server
`)
	.action(deploy)

program
	.command('push [server]')
	.description('Sync local changes to an existing hosted Primo server')
	.option('-s, --server <url>', 'Server URL')
	.option('--site <id>', 'Site ID')
	.option('--only <slug>', 'Push only the named site folder under sites/ (skips library)')
	.option('-d, --dir <dir>', 'Directory', '.')
	.option('-t, --token <token>', 'Auth token')
	.option('--preview', 'Preview only')
	.option('--dry-run', 'Show what would be pushed without sending requests')
	.addHelpText('after', `
${chalk.bold('Requires an existing hosted Primo server.')}
Run ${chalk.cyan('primo deploy')} first to create one, then ${chalk.cyan('primo login -s <server-url>')}
to authenticate this machine before pushing.

${chalk.bold('See also')}
  primo deploy  Stand up a new hosted Primo server
  primo login   Authenticate with a hosted Primo server
`)
	.action(async (server, options) => { await push_site({ ...options, server: server || options.server }) })

program
	.command('pull [server] [dir]')
	.description('Pull entire server (all sites + library) to local files (defaults to ./<server-hostname>)')
	.option('-s, --server <url>', 'Server URL (auto-detects local)')
	.option('-t, --token <token>', 'Auth token')
	.action((server, dir, options) => pull_site({
		...options,
		server: server || options.server,
		output: dir
	}))

const library = program
	.command('library')
	.description('Manage shared block library')

library
	.command('pull [server] [dir]')
	.description('Pull shared library to local files')
	.option('-s, --server <url>', 'Server URL (auto-detects local)')
	.option('-t, --token <token>', 'Auth token')
	.action((server, dir, options) => pull_library({
		...options,
		server: server || options.server,
		output: dir
	}))

library
	.command('push [server]')
	.description('Push local shared library to hosted CMS')
	.option('-s, --server <url>', 'Server URL')
	.option('-d, --dir <dir>', 'Workspace directory', '.')
	.option('-t, --token <token>', 'Auth token')
	.action((server, options) => push_library({ ...options, server: server || options.server }))

program
	.command('login [server]')
	.description('Login to hosted CMS')
	.option('-s, --server <url>', 'Server URL (defaults to `server:` in server.yaml)')
	.option('-e, --email <email>', 'Email')
	.action((server, options) => login({ ...options, server: server || options.server }))

program
	.command('validate')
	.description('Validate site structure')
	.option('-d, --dir <dir>', 'Directory', '.')
	.option('--strict', 'Strict mode')
	.action(validate_site)

program
	.command('build')
	.description('Export a single site as static files for any host (Netlify, Vercel, etc.)')
	.option('-d, --dir <dir>', 'Site directory', '.')
	.option('-o, --output <dir>', 'Output directory', '_site')
	.addHelpText('after', `
${chalk.bold('See also')}
  primo deploy  Want collaborators to edit content from a CMS UI? Use deploy instead —
                it ships the workspace with an editable CMS to Railway or Fly.
`)
	.action(build_site)

// Custom unknown-command handler. commander's default suggestion engine is
// based on Levenshtein distance and won't reach across renames like
// publish→deploy, so handle the common renamed/unknown cases explicitly.
program.on('command:*', (operands: string[]) => {
	const cmd = operands[0]
	console.error('')
	console.error(chalk.red(`Unknown command: ${cmd}`))
	console.error('')
	if (cmd === 'publish') {
		console.error(`  ${chalk.cyan('primo publish')} has been replaced by ${chalk.cyan('primo deploy')}.`)
		console.error(`  ${chalk.dim('It now deploys your whole workspace (all sites + library) as one unit.')}`)
		console.error('')
		console.error(`  Run: ${chalk.cyan('primo deploy --help')}`)
	} else {
		console.error(`  Run ${chalk.cyan('primo --help')} to see available commands.`)
	}
	console.error('')
	process.exit(1)
})

// parseAsync so async action handlers are awaited inside commander's
// lifecycle — with plain parse() a rejected handler becomes an unhandled
// rejection (ugly stack, engine-dependent exit) instead of the clean
// message + exit(1) below.
program.parseAsync().catch((error) => {
	console.error('')
	console.error(chalk.red(error instanceof Error ? error.message : String(error)))
	console.error('')
	process.exit(1)
})
