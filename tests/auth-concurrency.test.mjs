import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawn } from 'node:child_process'
import { make_workspace } from './helpers/run-cli.mjs'

test('concurrent logins preserve every server session in the private token store', async t => {
 const workspace=await make_workspace();t.after(workspace.cleanup)
 const module=pathToFileURL(path.resolve('dist/utils/auth.js')).href
 await Promise.all(Array.from({length:8},(_,i)=>new Promise((resolve,reject)=>{
  const code=`import {save_auth_token} from ${JSON.stringify(module)}; await save_auth_token('https://server-${i}.test','test-session-${i}');`
  const child=spawn(process.execPath,['--input-type=module','-e',code],{env:{...process.env,HOME:workspace.home,USERPROFILE:workspace.home}})
  let error='';child.stderr.on('data',chunk=>{error+=chunk});child.stdout.resume()
  child.on('error',reject);child.on('exit',status=>status===0?resolve():reject(new Error(error)))
 })))
 const file=path.join(workspace.home,'.primo/tokens.json')
 const tokens=JSON.parse(await fs.readFile(file,'utf8'))
 assert.equal(Object.keys(tokens).length,8)
 for(let i=0;i<8;i++) assert.equal(tokens[`https://server-${i}.test`],`test-session-${i}`)
 await assert.rejects(fs.access(file+'.lock'),{code:'ENOENT'})
 if(process.platform!=='win32') assert.equal((await fs.stat(file)).mode&0o777,0o600)
})

async function run_auth_code(workspace, body) {
 const module=pathToFileURL(path.resolve('dist/utils/auth.js')).href
 return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['--input-type=module','-e',`import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {get_auth_token,save_auth_token,remove_auth_token} from ${JSON.stringify(module)};${body}`],{env:{...process.env,HOME:workspace.home,USERPROFILE:workspace.home}})
  let output='';child.stderr.on('data',chunk=>output+=chunk);child.stdout.resume();child.on('error',reject);child.on('exit',status=>status===0?resolve():reject(new Error(output)))
 })
}

test('default-port token aliases reuse legacy sessions and migrate on save', async t => {
 const workspace=await make_workspace();t.after(workspace.cleanup)
 await workspace.write_token('https://cms.example.test:443','legacy')
 await run_auth_code(workspace,`assert.equal(await get_auth_token('https://cms.example.test'),'legacy');await save_auth_token('https://cms.example.test','updated');assert.equal(await get_auth_token('https://CMS.example.test:443/'),'updated');`)
 const tokens=JSON.parse(await fs.readFile(path.join(workspace.home,'.primo/tokens.json'),'utf8'))
 assert.deepEqual(tokens,{'https://cms.example.test':'updated'})
})

test('cancellation while the token store is locked leaves credentials untouched', async t => {
 const workspace=await make_workspace();t.after(workspace.cleanup)
 const lock=path.join(workspace.home,'.primo/tokens.json.lock');await fs.mkdir(path.dirname(lock));await fs.writeFile(lock,'active owner')
 await run_auth_code(workspace,`const controller=new AbortController();setTimeout(()=>controller.abort(),40);await assert.rejects(save_auth_token('https://cancelled.test','secret',controller.signal),{name:'AbortError'});`)
 await assert.rejects(fs.access(path.join(workspace.home,'.primo/tokens.json')),{code:'ENOENT'})
 assert.equal(await fs.readFile(lock,'utf8'),'active owner')
})


test('rejected credential removal preserves refreshed and unrelated sessions',async t=>{
 const workspace=await make_workspace();t.after(workspace.cleanup)
 await workspace.write_token('https://cms.test:443','rejected')
 await run_auth_code(workspace,`await save_auth_token('https://other.test','keep');await remove_auth_token('https://cms.test','rejected');assert.equal(await get_auth_token('https://cms.test'),null);await save_auth_token('https://cms.test','fresh');await remove_auth_token('https://cms.test','rejected');assert.equal(await get_auth_token('https://cms.test'),'fresh');assert.equal(await get_auth_token('https://other.test'),'keep');`)
})
