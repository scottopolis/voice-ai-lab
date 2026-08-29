import { describe, expect, it, vi } from 'vitest'
import { pcm16ToWav } from '../audio.js'
import { audioFetch } from '../adapters/http.js'
describe('audio normalization and sanitized errors',()=>{
 it('wraps PCM16 as a valid 24 kHz mono WAV',()=>{const wav=pcm16ToWav(Buffer.alloc(8));expect(wav.toString('ascii',0,4)).toBe('RIFF');expect(wav.toString('ascii',8,12)).toBe('WAVE');expect(wav.readUInt32LE(24)).toBe(24000);expect(wav.readUInt32LE(40)).toBe(8)})
 it('does not surface an upstream secret-bearing body',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('key=super-secret',{status:401})));await expect(audioFetch('https://voice.invalid',{headers:{Authorization:'Bearer private'}})).rejects.not.toThrow(/super-secret|private/);vi.unstubAllGlobals()})
})
