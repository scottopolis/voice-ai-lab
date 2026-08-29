import { useEffect, useRef, useState } from 'react'
import { PipecatClient, type RTVIMessage, type TransportState } from '@pipecat-ai/client-js'
import { SmallWebRTCTransport } from '@pipecat-ai/small-webrtc-transport'

type Option = { id: string; label: string }
type Voice = Option & { model: string; ready: boolean; missing: string[] }
type AgentPipeline = Voice
type Config = {
  pipelines: AgentPipeline[]
  models: Option[]
  voices: Voice[]
}
type Message = { role: 'you' | 'agent'; text: string }

const messageText = (message: RTVIMessage) => {
  const data = message.data as { message?: unknown } | undefined
  return typeof data?.message === 'string' ? data.message : 'The voice session failed.'
}

export default function App() {
  const [config, setConfig] = useState<Config | null>(null)
  const [pipeline, setPipeline] = useState('cascade')
  const [model, setModel] = useState('')
  const [voice, setVoice] = useState('')
  const [state, setState] = useState<TransportState>('disconnected')
  const [activity, setActivity] = useState('Ready to connect')
  const [messages, setMessages] = useState<Message[]>([])
  const [userDraft, setUserDraft] = useState('')
  const [botDraft, setBotDraft] = useState('')
  const [error, setError] = useState('')
  const clientRef = useRef<PipecatClient | null>(null)
  const botDraftRef = useRef('')

  useEffect(() => {
    fetch('/api/config')
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load the voice configuration.')
        return response.json() as Promise<Config>
      })
      .then((next) => {
        setConfig(next)
        setPipeline(next.pipelines.find((item) => item.ready)?.id ?? next.pipelines[0]?.id ?? '')
        setModel(next.models[0]?.id ?? '')
        setVoice(next.voices.find((item) => item.ready)?.id ?? next.voices[0]?.id ?? '')
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Could not load the voice configuration.')
      })

    return () => {
      void clientRef.current?.disconnect()
    }
  }, [])

  const selectedPipeline = config?.pipelines.find((item) => item.id === pipeline)
  const selectedVoice = config?.voices.find((item) => item.id === voice)
  const cascade = pipeline === 'cascade'
  const agentLabel = cascade ? selectedVoice?.label : selectedPipeline?.label
  const connected = state === 'ready' || state === 'connected'
  const busy = !['disconnected', 'connected', 'ready', 'error'].includes(state)
  const ready = Boolean(selectedPipeline?.ready && (!cascade || selectedVoice?.ready))

  async function connect() {
    setError('')
    setActivity('Connecting')
    setMessages([])
    setUserDraft('')
    setBotDraft('')
    botDraftRef.current = ''

    const client = new PipecatClient({
      transport: new SmallWebRTCTransport(),
      enableMic: true,
      enableCam: false,
      callbacks: {
        onTransportStateChanged: setState,
        onBotReady: () => setActivity('Listening'),
        onUserStartedSpeaking: () => setActivity('Listening to you'),
        onUserStoppedSpeaking: () => setActivity('Thinking'),
        onBotStartedSpeaking: () => setActivity('Agent speaking'),
        onBotStoppedSpeaking: () => setActivity('Listening'),
        onUserTranscript: (data) => {
          if (data.final) {
            setMessages((current) => [...current, { role: 'you', text: data.text }])
            setUserDraft('')
          } else {
            setUserDraft(data.text)
          }
        },
        onBotLlmStarted: () => {
          botDraftRef.current = ''
          setBotDraft('')
        },
        onBotLlmText: (data) => {
          botDraftRef.current += data.text
          setBotDraft(botDraftRef.current)
        },
        onBotLlmStopped: () => {
          const text = botDraftRef.current.trim()
          if (text) setMessages((current) => [...current, { role: 'agent', text }])
          botDraftRef.current = ''
          setBotDraft('')
        },
        onError: (message) => setError(messageText(message)),
        onDisconnected: () => setActivity('Ready to connect'),
      },
    })
    clientRef.current = client

    try {
      await client.initDevices()
      await client.connect({
        webrtcRequestParams: {
          endpoint: '/api/offer',
          requestData: { pipeline, model, voice },
        },
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start the voice session.')
      await client.disconnect()
      clientRef.current = null
    }
  }

  async function disconnect() {
    await clientRef.current?.disconnect()
    clientRef.current = null
  }

  if (!config && !error) {
    return <main className="loading">Loading voice providers…</main>
  }

  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">Conversational voice lab</p>
          <h1>
            Pick a brain.<br />
            <em>Swap the voice.</em>
          </h1>
          <p className="intro">
            Compare native speech-to-speech agents with a swappable STT → GPT → voice cascade.
          </p>
        </div>
        <div className={`status ${connected ? 'live' : ''}`}>
          <span /> {activity}
        </div>
      </header>

      <section className={`controls ${cascade ? '' : 'native'}`} aria-label="Conversation configuration">
        <label>
          Agent pipeline
          <select value={pipeline} onChange={(event) => setPipeline(event.target.value)} disabled={connected || busy}>
            {config?.pipelines.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}{item.ready ? '' : ' · needs key'}
              </option>
            ))}
          </select>
        </label>
        {cascade ? (
          <>
            <label>
              GPT model
              <select value={model} onChange={(event) => setModel(event.target.value)} disabled={connected || busy}>
                {config?.models.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
            <label>
              Voice provider
              <select value={voice} onChange={(event) => setVoice(event.target.value)} disabled={connected || busy}>
                {config?.voices.map((item) => (
                  <option key={item.id} value={item.id} disabled={!item.ready}>
                    {item.label} · {item.model}{item.ready ? '' : ' · needs key'}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <div className="native-model">
            <small>Native model</small>
            <strong>{selectedPipeline?.model}</strong>
            <span>Speech in → speech out</span>
          </div>
        )}
        {connected ? (
          <button className="call stop" onClick={disconnect} disabled={busy}>End conversation</button>
        ) : (
          <button className="call" onClick={connect} disabled={busy || !ready}>
            {busy ? 'Connecting…' : 'Start conversation'}
          </button>
        )}
      </section>

      {!ready && config && (
        <aside className="setup">
          Add the missing values to <code>.env</code> and restart: {' '}
          {[...(selectedPipeline?.missing ?? []), ...(cascade ? selectedVoice?.missing ?? [] : [])]
            .filter((item, index, all) => all.indexOf(item) === index)
            .join(', ')}
        </aside>
      )}
      {error && <p className="error" role="alert">{error}</p>}

      <section className="conversation" aria-live="polite">
        {messages.length === 0 && !userDraft && !botDraft ? (
          <div className="empty">
            <div className="orb"><span /></div>
            <h2>{connected ? 'Say something.' : 'Your conversation appears here.'}</h2>
            <p>Interrupt naturally—the agent should stop and listen.</p>
          </div>
        ) : (
          <div className="transcript">
            {messages.map((message, index) => (
              <article className={message.role} key={`${message.role}-${index}`}>
                <small>{message.role === 'you' ? 'You' : agentLabel}</small>
                <p>{message.text}</p>
              </article>
            ))}
            {userDraft && <article className="you draft"><small>You</small><p>{userDraft}</p></article>}
            {botDraft && <article className="agent draft"><small>{agentLabel}</small><p>{botDraft}</p></article>}
          </div>
        )}
      </section>

      <footer>Selections lock while connected. End the conversation to change pipelines.</footer>
    </main>
  )
}
