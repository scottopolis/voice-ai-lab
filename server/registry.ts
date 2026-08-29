import { deepgram } from './adapters/deepgram.js'
import { gemini } from './adapters/gemini.js'
import { audioFetch } from './adapters/http.js'
import { nova } from './adapters/nova.js'
import { realtimeRepeat } from './adapters/realtime.js'
import type { Provider } from './types.js'

const requirements = (...keys: string[]) =>
  Object.fromEntries(keys.map((key) => [key, Boolean(process.env[key])]))

const entry = (provider: Omit<Provider, 'ready'>): Provider => ({
  ...provider,
  ready: Object.values(provider.requirements).every(Boolean),
})

export function registry(): Provider[] {
  const elevenModel = process.env.ELEVENLABS_MODEL || 'eleven_v3'
  const elevenVoice = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb'
  const deepgramModel = process.env.DEEPGRAM_MODEL || 'flux-haley-en'
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-live-preview'
  const geminiVoice = process.env.GEMINI_VOICE || 'Kore'
  const novaModel = process.env.AWS_NOVA_MODEL || 'amazon.nova-2-sonic-v1:0'
  const novaVoice = process.env.AWS_NOVA_VOICE || 'tiffany'
  const openAIModel = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime-2.1'
  const openAIVoice = process.env.OPENAI_VOICE || 'marin'
  const cartesiaModel = process.env.CARTESIA_MODEL || 'sonic-3.6-2026-08-27'
  const cartesiaVoice = process.env.CARTESIA_VOICE_ID || 'db6b0ed5-d5d3-463d-ae85-518a07d3c2b4'
  const xAIModel = process.env.XAI_VOICE_MODEL || 'grok-voice-think-fast-1.0'
  const xAIVoice = process.env.XAI_VOICE || 'eve'
  const humeModel = process.env.HUME_MODEL || 'octave-2'
  const humeVoice = process.env.HUME_VOICE_ID || ''

  return [
    entry({
      id: 'eleven',
      provider: 'ElevenLabs',
      model: elevenModel,
      type: 'TTS',
      fidelity: 'exact',
      status: 'GA',
      requirements: requirements('ELEVENLABS_API_KEY'),
      voices: [{ id: elevenVoice, label: 'Configured stock voice' }],
      note: 'Direct Eleven v3 text-to-speech.',
      generate: (text, voice) =>
        audioFetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice!)}`, {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY!,
            'content-type': 'application/json',
            accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text,
            model_id: elevenModel,
            output_format: 'mp3_44100_128',
          }),
        }),
    }),
    entry({
      id: 'deepgram',
      provider: 'Deepgram',
      model: deepgramModel,
      type: 'TTS',
      fidelity: 'exact',
      status: 'Available',
      requirements: requirements('DEEPGRAM_API_KEY'),
      voices: [{ id: deepgramModel, label: 'Haley (configured Flux model)' }],
      note: 'Direct Flux TTS over /v2/speak; raw PCM is wrapped as WAV.',
      generate: deepgram,
    }),
    entry({
      id: 'gemini',
      provider: 'Google',
      model: geminiModel,
      type: 'Native S2S',
      fidelity: 'exact',
      status: 'Preview',
      requirements: requirements('GEMINI_API_KEY'),
      voices: [{ id: geminiVoice, label: 'Configured Live voice' }],
      note: 'Server-side Gemini Live exact-repeat capture; output PCM is wrapped as WAV.',
      generate: gemini,
    }),
    entry({
      id: 'nova',
      provider: 'Amazon',
      model: novaModel,
      type: 'Native S2S',
      fidelity: 'exact',
      status: 'GA',
      requirements: requirements('AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'),
      voices: [{ id: novaVoice, label: 'Configured Nova voice' }],
      note: 'Bedrock bidirectional exact-repeat capture using a cross-modal text turn.',
      generate: nova,
    }),
    entry({
      id: 'openai',
      provider: 'OpenAI',
      model: openAIModel,
      type: 'Native S2S',
      fidelity: 'exact',
      status: 'GA',
      requirements: requirements('OPENAI_API_KEY'),
      voices: [{ id: openAIVoice, label: 'Configured Realtime voice' }],
      note: 'Server-side Realtime WebSocket exact-repeat capture.',
      generate: process.env.OPENAI_API_KEY
        ? realtimeRepeat('openai', process.env.OPENAI_API_KEY, openAIModel, openAIVoice)
        : undefined,
    }),
    entry({
      id: 'cartesia',
      provider: 'Cartesia',
      model: cartesiaModel,
      type: 'TTS',
      fidelity: 'exact',
      status: 'GA snapshot',
      requirements: requirements('CARTESIA_API_KEY'),
      voices: [{ id: cartesiaVoice, label: 'Skylar (or configured voice)' }],
      note: 'Direct Sonic 3.6 bytes endpoint.',
      generate: (text, voice) =>
        audioFetch('https://api.cartesia.ai/tts/bytes', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.CARTESIA_API_KEY}`,
            'Cartesia-Version': process.env.CARTESIA_API_VERSION || '2026-08-14',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model_id: cartesiaModel,
            transcript: text,
            voice: voice,
            output_format: { container: 'mp3', bit_rate: 128000, sample_rate: 44100 },
          }),
        }),
    }),
    entry({
      id: 'xai',
      provider: 'xAI',
      model: xAIModel,
      type: 'Native S2S',
      fidelity: 'exact',
      status: 'Available',
      requirements: requirements('XAI_API_KEY'),
      voices: [{ id: xAIVoice, label: 'Configured voice' }],
      note: 'Server-side Voice Agent exact-repeat capture.',
      generate: process.env.XAI_API_KEY
        ? realtimeRepeat('xai', process.env.XAI_API_KEY, xAIModel, xAIVoice)
        : undefined,
    }),
    entry({
      id: 'hume',
      provider: 'Hume',
      model: humeModel,
      type: 'TTS',
      fidelity: 'exact',
      status: 'Preview',
      requirements: requirements('HUME_API_KEY', 'HUME_VOICE_ID'),
      voices: [{ id: humeVoice, label: 'Configured Octave voice' }],
      note: 'Direct Octave TTS; EVI 4-mini is the separate companion S2S cascade.',
      generate: (text, voice) =>
        audioFetch('https://api.hume.ai/v0/tts/file', {
          method: 'POST',
          headers: {
            'X-Hume-Api-Key': process.env.HUME_API_KEY!,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            version: '2',
            utterances: [{ text, voice: { id: voice } }],
            format: { type: 'mp3' },
          }),
        }),
    }),
  ]
}
