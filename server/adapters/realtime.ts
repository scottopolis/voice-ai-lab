import WebSocket from 'ws'
import { pcm16ToWav } from '../audio.js'
import { ApiError, type AudioResult } from '../types.js'

type RealtimeProvider = 'openai' | 'xai'

export function realtimeRepeat(
  provider: RealtimeProvider,
  key: string,
  model: string,
  voice: string,
): (text: string) => Promise<AudioResult> {
  return (text) =>
    new Promise((resolve, reject) => {
      const url =
        provider === 'openai'
          ? `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`
          : `wss://api.x.ai/v1/realtime?model=${encodeURIComponent(model)}`
      const chunks: Buffer[] = []
      const ws = new WebSocket(url, { headers: { Authorization: `Bearer ${key}` } })
      let settled = false
      const timer = setTimeout(
        () => finish(new ApiError(504, 'UPSTREAM_TIMEOUT', 'Realtime voice service timed out.')),
        Number(process.env.REQUEST_TIMEOUT_MS || 30000),
      )

      function finish(error?: Error) {
        if (settled) return
        settled = true
        clearTimeout(timer)
        ws.close()
        if (error) reject(error)
        else resolve({ bytes: pcm16ToWav(Buffer.concat(chunks)), contentType: 'audio/wav' })
      }

      ws.on('open', () => {
        const session =
          provider === 'openai'
            ? {
                type: 'realtime',
                model,
                output_modalities: ['audio'],
                audio: {
                  output: { format: { type: 'audio/pcm', rate: 24000 }, voice },
                },
                instructions: 'Repeat the user text exactly. Add no words.',
              }
            : {
                voice,
                instructions: 'Repeat the user text exactly. Add no words.',
                audio: {
                  output: {
                    format: { type: 'audio/pcm', rate: 24000 },
                    transport: 'json',
                  },
                },
              }
        ws.send(JSON.stringify({ type: 'session.update', session }))
        ws.send(
          JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [{ type: 'input_text', text: `Repeat exactly: ${text}` }],
            },
          }),
        )
        ws.send(JSON.stringify({ type: 'response.create', response: { output_modalities: ['audio'] } }))
      })
      ws.on('message', (raw) => {
        try {
          const event = JSON.parse(raw.toString())
          if (event.type === 'response.output_audio.delta' || event.type === 'response.audio.delta') {
            chunks.push(Buffer.from(event.delta, 'base64'))
          }
          if (event.type === 'response.done') {
            finish(
              chunks.length
                ? undefined
                : new ApiError(502, 'EMPTY_AUDIO', 'Realtime model completed without audio.'),
            )
          }
          if (event.type === 'error') {
            finish(
              new ApiError(
                502,
                'UPSTREAM_ERROR',
                'Realtime voice service rejected the request. Check model access and configuration.',
              ),
            )
          }
        } catch {
          finish(
            new ApiError(502, 'INVALID_UPSTREAM', 'Realtime voice service returned an invalid event.'),
          )
        }
      })
      ws.on('error', () =>
        finish(new ApiError(502, 'UPSTREAM_ERROR', 'Could not connect to realtime voice service.')),
      )
    })
}
