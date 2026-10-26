import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { start_dev_logging } from '../dist/utils/dev-logs.js'
import { read_dev_logs, LOG_READ_LIMIT } from '../dist/utils/read-dev-logs.js'
import { CLI_ENTRY, make_workspace, run_cli } from './helpers/run-cli.mjs'

test('log rotation retains the previous file, strips ANSI, and preserves split UTF-8', async t => {
 const workspace = await make_workspace(); t.after(workspace.cleanup)
 const log = start_dev_logging(workspace.work, 250)
 try {
  const capture = log.capture('stdout')
  const bytes = Buffer.from('🌻 Unicode output\n')
  capture(bytes.subarray(0, 2)); capture(bytes.subarray(2))
  capture(Buffer.from('\x1b[31mserver error\x1b[0m\n'))
  capture(Buffer.from('last message '.repeat(8)))
 } finally { log.stop() }
 const current = await read_dev_logs(workspace.work)
 const previous = await read_dev_logs(workspace.work, 100, true)
 assert.equal(previous.available, true)
 assert.match(previous.text, /🌻 Unicode output/)
 assert.doesNotMatch(current.text + previous.text, /\x1b|�/)
 assert.match(current.text, /last message/)
})

test('logs resolve workspace from a site, bound reads, and validate line counts', async t => {
 const workspace = await make_workspace(); t.after(workspace.cleanup)
 const site = path.join(workspace.work, 'sites/demo')
 await fs.mkdir(site, { recursive: true })
 await fs.mkdir(path.join(workspace.work, '.primo'))
 await fs.writeFile(path.join(workspace.work, 'server.yaml'), '{}\n')
 const log_file = path.join(workspace.work, '.primo/dev.log')
 await fs.writeFile(log_file, 'line\n'.repeat(LOG_READ_LIMIT))
 const result = await run_cli(['logs', '--dir', site, '--json', '-n', '2'], { cwd: workspace.work, home: workspace.home })
 const parsed = JSON.parse(result.stdout)
 assert.equal(parsed.log_file, log_file)
 assert.equal(parsed.text, 'line\nline\n')
 assert.equal(parsed.truncated, true)
 const invalid = await run_cli(['logs', '-n', 'nope'], { cwd: workspace.work, home: workspace.home })
 assert.notEqual(invalid.code, 0)
 assert.match(invalid.output, /integer from 1 to 1000/)
})

test('logs follow waits for creation, reads appended output and follows rotation', async t => {
 const workspace = await make_workspace(); t.after(workspace.cleanup)
 const child = spawn(process.execPath, [CLI_ENTRY, 'logs', '--follow'], { cwd: workspace.work, env: { ...process.env, HOME: workspace.home } })
 t.after(async () => { if (child.exitCode === null && child.signalCode === null) { child.kill('SIGTERM'); await once(child, 'exit') } })
 let output = ''; child.stdout.on('data', chunk => { output += chunk }); child.stderr.on('data', () => {})
 const wait_for = async text => {
  const deadline = Date.now() + 5000
  while (!output.includes(text) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50))
  assert.ok(output.includes(text), output)
 }
 await fs.mkdir(path.join(workspace.work, '.primo'))
 const file = path.join(workspace.work, '.primo/dev.log')
 await fs.writeFile(file, 'first output\n')
 await wait_for('first output')
 await fs.appendFile(file, 'second output\n')
 await wait_for('second output')
 await fs.appendFile(file, 'backlog '.repeat(20000) + '\nlast output before rotation\n')
 await fs.rename(file, file + '.1')
 await fs.writeFile(file, 'rotated output\n')
 await wait_for('rotated output')
 assert.match(output, /last output before rotation/)
 child.kill('SIGTERM'); await once(child, 'exit')
 assert.equal(child.exitCode, 0)
})


test('every physical line identifies its source even for multiline chunks', async t => {
 const workspace = await make_workspace(); t.after(workspace.cleanup)
 const log = start_dev_logging(workspace.work)
 try {
  log.capture('stderr')(Buffer.from('first server line\nsecond server line\n'))
  process.stdout.write('first CLI line\nsecond CLI line\n')
 } finally { log.stop() }
 const { text } = await read_dev_logs(workspace.work)
 for (const line of text.trim().split('\n')) assert.match(line, /^\[\d{4}-[^\]]+\] \[(?:cli|cms)(?::stdout|:stderr)?\] /)
 assert.match(text, /\[cms:stderr\] second server line/)
 assert.match(text, /\[cli:stdout\] second CLI line/)
})
