import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { create_utf8_tail, start_dev_logging } from '../dist/utils/dev-logs.js'
import { read_dev_logs, LOG_READ_LIMIT } from '../dist/utils/read-dev-logs.js'
import { CLI_ENTRY, make_workspace, run_cli } from './helpers/run-cli.mjs'

test('CMS log capture joins split ANSI sequences before stripping them', async t => {
 const workspace = await make_workspace(); t.after(workspace.cleanup)
 const log = start_dev_logging(workspace.work)
 try {
  const capture = log.capture('stdout')
  capture(Buffer.from('\x1b[')); capture(Buffer.from('31mcolored')); capture(Buffer.from('\x1b[0m\n'))
 } finally { log.stop() }
 const result = await read_dev_logs(workspace.work)
 assert.match(result.text, /colored/)
 assert.doesNotMatch(result.text, /\x1b|31m|0m/)
})

test('a symlinked log cannot change its target and does not prevent startup', async t => {
 const workspace = await make_workspace(); t.after(workspace.cleanup)
 await fs.mkdir(path.join(workspace.work, '.primo'))
 const target = path.join(workspace.work, 'kept.txt')
 await fs.writeFile(target, 'kept', { mode: 0o644 })
 await fs.symlink(target, path.join(workspace.work, '.primo/dev.log'))
 const log = start_dev_logging(workspace.work)
 log.capture('stdout')(Buffer.from('must not reach target\n')); log.stop()
 assert.equal(await fs.readFile(target, 'utf8'), 'kept')
 if (process.platform !== 'win32') assert.equal((await fs.stat(target)).mode & 0o777, 0o644)
})

test('CMS capture pauses its source until the output drains', async t => {
 const workspace = await make_workspace(); t.after(workspace.cleanup)
 const original = process.stdout.write
 let paused = false, resumed = false
 process.stdout.write = () => false
 const log = start_dev_logging(workspace.work)
 try {
  const source = { pause() { paused = true }, resume() { resumed = true } }
  log.capture('stdout', source)(Buffer.from('bounded output\n'))
  assert.equal(paused, true)
  assert.equal(resumed, false)
  process.stdout.emit('drain')
  assert.equal(resumed, true)
 } finally { log.stop(); process.stdout.write = original }
})

test('a single-site session nested in a workspace reads its own log', async t => {
 const workspace = await make_workspace(); t.after(workspace.cleanup)
 await fs.writeFile(path.join(workspace.work, 'server.yaml'), '{}\n')
 const site = path.join(workspace.work, 'sites/standalone')
 await fs.mkdir(path.join(site, '.primo'), { recursive: true })
 await fs.writeFile(path.join(site, '.primo/dev.log'), 'standalone session\n')
 const runtime={version:1,workspace:await fs.realpath(site),pid:process.pid,port:43002,instance:'standalone'}
 await fs.writeFile(path.join(site,'.primo/dev-server.json'),JSON.stringify(runtime))
 t.mock.method(globalThis,'fetch',async()=>Response.json(runtime))
 assert.equal((await read_dev_logs(site)).text, 'standalone session\n')
})

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

 test('log controls crossing the old line cut and long OSC payloads stay stripped',async t=>{
 const workspace=await make_workspace();t.after(workspace.cleanup)
 const original=process.stdout.write;process.stdout.write=()=>true
 const log=start_dev_logging(workspace.work,1024*1024)
 try {
 const capture=log.capture('stdout')
 capture(Buffer.from('x'.repeat(8191)+'\x1b[31'))
 capture(Buffer.from('m'+'y'.repeat(9000)+'\x1b[0m\n'))
 capture(Buffer.from('\x1b]0;'+'hidden-title'.repeat(4000)))
 capture(Buffer.from('\x07visible-after-title\n'))
 }finally{log.stop();process.stdout.write=original}
 const result=await read_dev_logs(workspace.work,1000)
 assert.match(result.text,/visible-after-title/)
 assert.doesNotMatch(result.text,/\x1b|31m|hidden-title|0m/)
 })

test('logs from a child folder find the live single-site session', async t => {
 const workspace=await make_workspace();t.after(workspace.cleanup)
 const site=path.join(workspace.work,'sites/demo'),child=path.join(site,'pages')
 await fs.mkdir(path.join(site,'.primo'),{recursive:true});await fs.mkdir(child)
 await fs.writeFile(path.join(workspace.work,'server.yaml'),'port: 3000\n')
 const runtime={version:1,workspace:await fs.realpath(site),pid:process.pid,port:43002,instance:'nested'}
 await fs.writeFile(path.join(site,'.primo/dev-server.json'),JSON.stringify(runtime))
 await fs.writeFile(path.join(site,'.primo/dev.log'),'nested session\n')
 t.mock.method(globalThis,'fetch',async()=>Response.json(runtime))
 assert.equal((await read_dev_logs(child)).text,'nested session\n')
})

test('a bounded log window retains its first complete line',async t=>{
 const workspace=await make_workspace();t.after(workspace.cleanup)
 await fs.mkdir(path.join(workspace.work,'.primo'))
 const tail='first complete\n'+'x'.repeat(256*1024-'first complete\n'.length-1)+'\n'
 await fs.writeFile(path.join(workspace.work,'.primo/dev.log'),'prefix\n'+tail)
 assert((await read_dev_logs(workspace.work,1000)).text.startsWith('first complete\n'))
})


test('startup diagnostic tail preserves split UTF-8 and trims whole code points',()=>{
 const tail=create_utf8_tail(5),bytes=Buffer.from('🙂')
 tail.write(bytes.subarray(0,2));tail.write(bytes.subarray(2));tail.write(Buffer.from('abc'))
 assert.equal(tail.end(),'🙂abc')
 const cut=create_utf8_tail(4);cut.write(Buffer.from('🙂abc'));assert.equal(cut.end(),'abc')
})

test('a log symlink substituted after startup cannot redirect appends',async t=>{
 const workspace=await make_workspace();t.after(workspace.cleanup)
 const original=process.stdout.write;process.stdout.write=()=>true
 const log=start_dev_logging(workspace.work),outside=path.join(workspace.root,'outside')
 try {
  await fs.writeFile(outside,'preserve')
  await fs.unlink(log.file);await fs.symlink(outside,log.file)
  log.capture('stdout')(Buffer.from('must not redirect\n'))
  assert.equal(await fs.readFile(outside,'utf8'),'preserve')
 } finally {log.stop();process.stdout.write=original}
})
