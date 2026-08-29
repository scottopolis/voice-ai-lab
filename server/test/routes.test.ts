import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from '../app.js'
import type { AddressInfo } from 'node:net'
async function server(){const app=createApp();await new Promise<void>(r=>app.listen(0,'127.0.0.1',r));return {app,url:`http://127.0.0.1:${(app.address() as AddressInfo).port}`}}
const apps:ReturnType<typeof createApp>[]=[];afterEach(()=>apps.splice(0).forEach(a=>a.close()))
describe('API routing and validation',()=>{
 it('returns metadata and booleans only',async()=>{const s=await server();apps.push(s.app);const r=await fetch(`${s.url}/api/providers`);const body=await r.json();expect(r.status).toBe(200);expect(body.providers).toHaveLength(8);expect(typeof body.providers[0].ready).toBe('boolean');expect(body.providers[0].generate).toBeUndefined()})
 it('rejects malformed generation and missing credentials consistently',async()=>{const key=process.env.GEMINI_API_KEY;delete process.env.GEMINI_API_KEY;const s=await server();apps.push(s.app);let r=await fetch(`${s.url}/api/generate`,{method:'POST',body:'{}'});expect(r.status).toBe(400);expect((await r.json()).error.code).toBe('INVALID_REQUEST');r=await fetch(`${s.url}/api/generate`,{method:'POST',body:JSON.stringify({providerId:'gemini',text:'hello'})});expect(r.status).toBe(409);expect((await r.json()).error.code).toBe('NOT_READY');if(key)process.env.GEMINI_API_KEY=key})
})
