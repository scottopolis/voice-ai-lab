import WebSocket from 'ws'
import { pcm16ToWav } from '../audio.js'
import { ApiError, type AudioResult } from '../types.js'

export function deepgram(text: string, model?: string): Promise<AudioResult> {
  return new Promise((resolve, reject) => {
    const qs = new URLSearchParams({
      model: model || process.env.DEEPGRAM_MODEL || 'flux-haley-en',
      encoding: 'linear16',
      sample_rate: '24000',
    })
    const ws = new WebSocket(`wss://api.deepgram.com/v2/speak?${qs}`, {
      headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` },
    })
    const chunks: Buffer[] = []
    let settled = false
    const timer = setTimeout(
      () => done(new ApiError(504, 'UPSTREAM_TIMEOUT', 'Deepgram timed out.')),
      Number(process.env.REQUEST_TIMEOUT_MS || 30000),
    )

    function done(error?: Error) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      ws.close()
      if (error) reject(error)
      else resolve({ bytes: pcm16ToWav(Buffer.concat(chunks)), contentType: 'audio/wav' })
    }

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'Speak', text }))
      ws.send(JSON.stringify({ type: 'Flush' }))
    })
    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        chunks.push(Buffer.from(data as Buffer))
        return
      }
      try {
        const event = JSON.parse(data.toString())
        if (event.type === 'SpeechMetadata') {
          done(chunks.length ? undefined : new ApiError(502, 'EMPTY_AUDIO', 'Deepgram returned no audio.'))
        }
        if (event.type === 'Error') {
          done(new ApiError(502, 'UPSTREAM_ERROR', 'Deepgram rejected the request.'))
        }
      } catch {
        // Ignore non-JSON control frames.
      }
    })
    ws.on('error', () => done(new ApiError(502, 'UPSTREAM_ERROR', 'Could not connect to Deepgram.')))
  })
}
