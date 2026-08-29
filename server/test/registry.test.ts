import { afterEach, describe, expect, it } from 'vitest'
import { registry } from '../registry.js'
const saved={...process.env}
afterEach(()=>{process.env={...saved}})
describe('provider registry',()=>{
 it('contains eight exact adapters without exposing values',()=>{const list=registry();expect(list).toHaveLength(8);expect(list.map(p=>p.id)).toEqual(['eleven','deepgram','gemini','nova','openai','cartesia','xai','hume']);expect(list.every(p=>p.fidelity==='exact')).toBe(true);expect(list.find(p=>p.id==='deepgram')?.model).toMatch(/^flux-.+-en$/);expect(JSON.stringify(list.map(p=>({id:p.id,requirements:p.requirements})))).not.toContain(process.env.ELEVENLABS_API_KEY||'impossible-secret')})
 it('calculates multi-field readiness',()=>{delete process.env.CARTESIA_API_KEY;process.env.CARTESIA_VOICE_ID='voice';expect(registry().find(p=>p.id==='cartesia')?.ready).toBe(false);process.env.CARTESIA_API_KEY='secret';expect(registry().find(p=>p.id==='cartesia')?.ready).toBe(true)})
})
