import { GoogleGenAI, Modality, type LiveServerMessage, type Session } from '@google/genai'
import { pcm16ToWav } from '../audio.js'
import { ApiError, type AudioResult } from '../types.js'

export async function gemini(text: string): Promise<AudioResult> {
  const chunks: Buffer[] = []
  let session: Session | undefined
  let settled = false

  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => finish(new ApiError(504, 'UPSTREAM_TIMEOUT', 'Gemini Live timed out.')),
      Number(process.env.REQUEST_TIMEOUT_MS || 30000),
    )

    function finish(error?: Error) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      session?.close()
      if (error) reject(error)
      else resolve({ bytes: pcm16ToWav(Buffer.concat(chunks)), contentType: 'audio/wav' })
    }

    function onMessage(message: LiveServerMessage) {
      if (message.data) chunks.push(Buffer.from(message.data, 'base64'))
      if (message.serverContent?.turnComplete) {
        finish(
          chunks.length
            ? undefined
            : new ApiError(502, 'EMPTY_AUDIO', 'Gemini Live completed without audio.'),
        )
      }
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    ai.live
      .connect({
        model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: process.env.GEMINI_VOICE || 'Kore' },
            },
          },
          systemInstruction: 'Repeat the user text exactly. Add no words.',
        },
        callbacks: {
          onmessage: onMessage,
          onerror: () =>
            finish(new ApiError(502, 'UPSTREAM_ERROR', 'Gemini Live rejected the request.')),
          onclose: () => {
            if (!settled) {
              finish(new ApiError(502, 'UPSTREAM_ERROR', 'Gemini Live closed before completing.'))
            }
          },
        },
      })
      .then((connected) => {
        session = connected
        session.sendClientContent({
          turns: [{ role: 'user', parts: [{ text }] }],
          turnComplete: true,
        })
      })
      .catch(() => finish(new ApiError(502, 'UPSTREAM_ERROR', 'Could not connect to Gemini Live.')))
  })
}
