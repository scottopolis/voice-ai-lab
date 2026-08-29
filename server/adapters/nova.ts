import { randomUUID } from 'node:crypto'
import {
  BedrockRuntimeClient,
  InvokeModelWithBidirectionalStreamCommand,
  type InvokeModelWithBidirectionalStreamInput,
} from '@aws-sdk/client-bedrock-runtime'
import { NodeHttp2Handler } from '@smithy/node-http-handler'
import { pcm16ToWav } from '../audio.js'
import { ApiError, type AudioResult } from '../types.js'

type NovaEvent = { event: Record<string, unknown> }

class EventQueue implements AsyncIterable<InvokeModelWithBidirectionalStreamInput> {
  private events: NovaEvent[] = []
  private wake: (() => void) | undefined
  private ended = false

  push(event: NovaEvent) {
    if (this.ended) return
    this.events.push(event)
    this.wake?.()
    this.wake = undefined
  }

  end() {
    this.ended = true
    this.wake?.()
    this.wake = undefined
  }

  async *[Symbol.asyncIterator]() {
    while (!this.ended || this.events.length) {
      const event = this.events.shift()
      if (event) {
        yield { chunk: { bytes: Buffer.from(JSON.stringify(event)) } }
      } else {
        await new Promise<void>((resolve) => {
          this.wake = resolve
        })
      }
    }
  }
}

export async function nova(text: string, voice?: string): Promise<AudioResult> {
  const request = new EventQueue()
  const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-east-1',
    requestHandler: new NodeHttp2Handler({
      requestTimeout: Number(process.env.REQUEST_TIMEOUT_MS || 30000),
      sessionTimeout: Number(process.env.REQUEST_TIMEOUT_MS || 30000),
    }),
  })
  const abort = new AbortController()
  const timeout = setTimeout(
    () => abort.abort(),
    Number(process.env.REQUEST_TIMEOUT_MS || 30000),
  )
  const promptName = randomUUID()
  const systemContentName = randomUUID()
  const audioContentName = randomUUID()
  const userContentName = randomUUID()
  let silenceTimer: NodeJS.Timeout | undefined

  try {
    const responsePromise = client.send(
      new InvokeModelWithBidirectionalStreamCommand({
        modelId: process.env.AWS_NOVA_MODEL || 'amazon.nova-2-sonic-v1:0',
        body: request,
      }),
      { abortSignal: abort.signal },
    )

    request.push({
      event: {
        sessionStart: {
          inferenceConfiguration: { maxTokens: 1024, topP: 0.9, temperature: 0.2 },
        },
      },
    })
    request.push({
      event: {
        promptStart: {
          promptName,
          textOutputConfiguration: { mediaType: 'text/plain' },
          audioOutputConfiguration: {
            mediaType: 'audio/lpcm',
            sampleRateHertz: 24000,
            sampleSizeBits: 16,
            channelCount: 1,
            voiceId: voice || process.env.AWS_NOVA_VOICE || 'tiffany',
            encoding: 'base64',
            audioType: 'SPEECH',
          },
        },
      },
    })
    request.push({
      event: {
        contentStart: {
          promptName,
          contentName: systemContentName,
          type: 'TEXT',
          interactive: false,
          role: 'SYSTEM',
          textInputConfiguration: { mediaType: 'text/plain' },
        },
      },
    })
    request.push({
      event: {
        textInput: {
          promptName,
          contentName: systemContentName,
          content: 'Repeat the user text exactly. Add no words.',
        },
      },
    })
    request.push({ event: { contentEnd: { promptName, contentName: systemContentName } } })
    request.push({
      event: {
        contentStart: {
          promptName,
          contentName: audioContentName,
          type: 'AUDIO',
          interactive: true,
          role: 'USER',
          audioInputConfiguration: {
            mediaType: 'audio/lpcm',
            sampleRateHertz: 16000,
            sampleSizeBits: 16,
            channelCount: 1,
            audioType: 'SPEECH',
            encoding: 'base64',
          },
        },
      },
    })

    const silence = Buffer.alloc(2048).toString('base64')
    const sendSilence = () =>
      request.push({
        event: {
          audioInput: { promptName, contentName: audioContentName, content: silence },
        },
      })
    sendSilence()
    silenceTimer = setInterval(() => {
      sendSilence()
    }, 64)

    request.push({
      event: {
        contentStart: {
          promptName,
          contentName: userContentName,
          type: 'TEXT',
          interactive: true,
          role: 'USER',
          textInputConfiguration: { mediaType: 'text/plain' },
        },
      },
    })
    request.push({
      event: { textInput: { promptName, contentName: userContentName, content: text } },
    })
    request.push({ event: { contentEnd: { promptName, contentName: userContentName } } })

    const response = await responsePromise
    if (!response.body) throw new ApiError(502, 'EMPTY_RESPONSE', 'Nova returned no response stream.')

    const chunks: Buffer[] = []
    for await (const frame of response.body) {
      if (frame.modelStreamErrorException || frame.internalServerException) {
        throw new ApiError(502, 'UPSTREAM_ERROR', 'Nova rejected the request.')
      }
      if (!frame.chunk?.bytes) continue
      const message = JSON.parse(Buffer.from(frame.chunk.bytes).toString())
      const event = message.event
      if (event?.audioOutput?.content) {
        chunks.push(Buffer.from(event.audioOutput.content, 'base64'))
      }
      if (event?.completionEnd?.stopReason === 'END_TURN') break
    }

    if (!chunks.length) throw new ApiError(502, 'EMPTY_AUDIO', 'Nova completed without audio.')
    return { bytes: pcm16ToWav(Buffer.concat(chunks)), contentType: 'audio/wav' }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (abort.signal.aborted) throw new ApiError(504, 'UPSTREAM_TIMEOUT', 'Nova timed out.')
    throw new ApiError(502, 'UPSTREAM_ERROR', 'Could not complete the Nova request.')
  } finally {
    clearTimeout(timeout)
    if (silenceTimer) clearInterval(silenceTimer)
    request.push({ event: { contentEnd: { promptName, contentName: audioContentName } } })
    request.push({ event: { promptEnd: { promptName } } })
    request.push({ event: { sessionEnd: {} } })
    request.end()
    client.destroy()
  }
}
