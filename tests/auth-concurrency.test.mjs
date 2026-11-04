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
