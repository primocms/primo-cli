import {test} from 'node:test'
import assert from 'node:assert/strict'
import {setImmediate as turn} from 'node:timers/promises'
import {authenticate_in_browser} from '../dist/utils/browser-login.js'

test('slow_down honors a Retry-After longer than thirty seconds',async t=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:100000})
 let polls=0
 t.mock.method(globalThis,'fetch',async url=>{
  const data=String(url).endsWith('/start')?{protocol:1,device_code:'a'.repeat(64),user_code:'ABCD-1234-EF01-5678',verification_uri:'/admin/cli-login?code=ABCD-1234-EF01-5678',expires_in:300,interval:1}:++polls===1?{error:'slow_down'}:{error:'access_denied'}
  const status=String(url).endsWith('/start')?200:polls===1?429:403
  return new Response(JSON.stringify(data),{status,headers:{'Retry-After':'45'}})
 })
 const pending=authenticate_in_browser('https://cms.test',{noBrowser:true})
 const rejected=assert.rejects(pending,/declined/)
 await turn();t.mock.timers.tick(1000);await turn()
 assert.equal(polls,1)
 t.mock.timers.tick(30000);await turn()
 assert.equal(polls,1,'polled at the removed 30-second cap')
 t.mock.timers.tick(15000);await turn()
 assert.equal(polls,2)
 await rejected
})

test('approval with an empty identity is rejected before credential persistence',async t=>{
 t.mock.method(globalThis,'fetch',async url=>Response.json(String(url).endsWith('/start')
  ?{protocol:1,device_code:'a'.repeat(64),user_code:'ABCD-1234-EF01-5678',verification_uri:'/admin/cli-login?code=ABCD-1234-EF01-5678',expires_in:300,interval:1}
  :{token:'must-not-save',record:{email:''}}))
 await assert.rejects(authenticate_in_browser('https://cms.test',{noBrowser:true}),/invalid login result/)
})
