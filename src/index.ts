#!/usr/bin/env node

import { Command } from 'commander'
import { init_workspace } from './commands/init.js'
import { new_site } from './commands/new.js'
import { pull_site } from './commands/pull.js'
import { push_site } from './commands/push.js'
import { pull_library } from './commands/pull-library.js'
import { push_library } from './commands/push-library.js'
import { dev_server } from './commands/dev.js'
import { login } from './commands/login.js'
import { validate_site } from './commands/validate.js'
import { publish } from './commands/publish.js'
import { build_site } from './commands/build.js'

const program = new Command()

program
	.name('primo')
	.description('Build sites visually, edit them anywhere')
	.version('0.1.3')

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
	.command('publish')
	.description('Deploy site with CMS')
	.option('-d, --dir <dir>', 'Site directory', '.')
	.option('-p, --provider <provider>', 'Provider (railway, fly)')
	.action(publish)

program
	.command('push')
	.description('Push local files to hosted CMS')
	.option('-s, --server <url>', 'Server URL')
	.option('--site <id>', 'Site ID')
	.option('-d, --dir <dir>', 'Directory', '.')
	.option('-t, --token <token>', 'Auth token')
	.option('--preview', 'Preview only')
	.action(push_site)

program
	.command('pull')
	.description('Pull from hosted CMS to local files')
	.option('-s, --server <url>', 'Server URL (auto-detects local)')
	.option('--site <id>', 'Site ID (interactive if not provided)')
	.option('-o, --output <dir>', 'Output directory', '.')
	.option('-t, --token <token>', 'Auth token')
	.action(pull_site)

const library = program
	.command('library')
	.description('Manage shared block library')

library
	.command('pull')
	.description('Pull shared library to local files')
	.option('-s, --server <url>', 'Server URL (auto-detects local)')
	.option('-o, --output <dir>', 'Output directory', '.')
	.option('-t, --token <token>', 'Auth token')
	.action(pull_library)

library
	.command('push')
	.description('Push local shared library to hosted CMS')
	.option('-s, --server <url>', 'Server URL')
	.option('-d, --dir <dir>', 'Workspace directory', '.')
	.option('-t, --token <token>', 'Auth token')
	.action(push_library)

program
	.command('login')
	.description('Login to hosted CMS')
	.argument('<server>', 'Server URL')
	.option('-e, --email <email>', 'Email')
	.action((server, options) => login({ server, ...options }))

program
	.command('validate')
	.description('Validate site structure')
	.option('-d, --dir <dir>', 'Directory', '.')
	.option('--strict', 'Strict mode')
	.action(validate_site)

program
	.command('build')
	.description('Build static site')
	.option('-d, --dir <dir>', 'Site directory', '.')
	.option('-o, --output <dir>', 'Output directory', '_site')
	.action(build_site)

program.parse()
