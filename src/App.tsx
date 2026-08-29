import { useEffect, useRef, useState } from 'react'
import { PipecatClient, type RTVIMessage, type TransportState } from '@pipecat-ai/client-js'
import { SmallWebRTCTransport } from '@pipecat-ai/small-webrtc-transport'

type Option = { id: string; label: string; description: string }
type VoiceChoice = Option
type Voice = Option & { model: string; ready: boolean; missing: string[]; voices: VoiceChoice[]; defaultVoice: string }
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
  const [provider, setProvider] = useState('')
  const [voice, setVoice] = useState('')
  const [state, setState] = useState<TransportState>('disconnected')
  const [activity, setActivity] = useState('Ready to connect')
  const [messages, setMessages] = useState<Message[]>([])
  const [userDraft, setUserDraft] = useState('')
  const [botDraft, setBotDraft] = useState('')
  const [error, setError] = useState('')
  const clientRef = useRef<PipecatClient | null>(null)
  const botAudioRef = useRef<HTMLAudioElement | null>(null)
  const botDraftRef = useRef('')

  useEffect(() => {
    fetch('/api/config')
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load the voice configuration.')
        return response.json() as Promise<Config>
      })
      .then((next) => {
        const initialPipeline = next.pipelines.find((item) => item.ready) ?? next.pipelines[0]
        const initialProvider = next.voices.find((item) => item.ready) ?? next.voices[0]
        setConfig(next)
        setPipeline(initialPipeline?.id ?? '')
        setModel(next.models[0]?.id ?? '')
        setProvider(initialProvider?.id ?? '')
        setVoice(
          initialPipeline?.id === 'cascade'
            ? initialProvider?.defaultVoice ?? ''
            : initialPipeline?.defaultVoice ?? '',
        )
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Could not load the voice configuration.')
      })

    return () => {
      void clientRef.current?.disconnect()
    }
  }, [])

  const selectedPipeline = config?.pipelines.find((item) => item.id === pipeline)
  const selectedProvider = config?.voices.find((item) => item.id === provider)
  const cascade = pipeline === 'cascade'
  const availableVoices = cascade ? selectedProvider?.voices : selectedPipeline?.voices
  const selectedVoice = availableVoices?.find((item) => item.id === voice)
  const agentLabel = selectedVoice?.label ?? selectedPipeline?.label
  const connected = state === 'ready' || state === 'connected'
  const busy = !['disconnected', 'connected', 'ready', 'error'].includes(state)
  const ready = Boolean(selectedPipeline?.ready && selectedVoice && (!cascade || selectedProvider?.ready))

  function choosePipeline(nextPipeline: string) {
    setPipeline(nextPipeline)
    const next = config?.pipelines.find((item) => item.id === nextPipeline)
    if (nextPipeline !== 'cascade') setVoice(next?.defaultVoice ?? next?.voices[0]?.id ?? '')
    else setVoice(selectedProvider?.defaultVoice ?? '')
  }

  function chooseProvider(nextProvider: string) {
    setProvider(nextProvider)
    const next = config?.voices.find((item) => item.id === nextProvider)
    setVoice(next?.defaultVoice ?? next?.voices[0]?.id ?? '')
  }

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
        onTrackStarted: (track) => {
          const audio = botAudioRef.current
          if (track.kind !== 'audio' || !audio) return
          audio.srcObject = new MediaStream([track])
          void audio.play().catch(() => {
            setError('Your browser blocked audio playback. Allow sound for this page and reconnect.')
          })
        },
        onTrackStopped: (track) => {
          if (track.kind === 'audio' && botAudioRef.current) {
            botAudioRef.current.srcObject = null
          }
        },
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
        onDisconnected: () => {
          if (botAudioRef.current) {
            botAudioRef.current.pause()
            botAudioRef.current.srcObject = null
          }
          setActivity('Ready to connect')
        },
      },
    })
    clientRef.current = client

    try {
      await client.initDevices()
      await client.connect({
        webrtcRequestParams: {
          endpoint: '/api/offer',
          requestData: { pipeline, model, provider, voice },
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
      <audio ref={botAudioRef} autoPlay />
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

      <section className="controls" aria-label="Conversation configuration">
        <div className="control-group pipeline-group">
          <label htmlFor="pipeline">Conversation pipeline</label>
          <select id="pipeline" value={pipeline} onChange={(event) => choosePipeline(event.target.value)} disabled={connected || busy}>
            {config?.pipelines.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}{item.ready ? '' : ' · needs key'}
              </option>
            ))}
          </select>
          <p className="helper">{selectedPipeline?.description}</p>
        </div>
        {cascade ? (
          <>
            <div className="control-group">
              <label htmlFor="model">Reasoning model</label>
              <select id="model" value={model} onChange={(event) => setModel(event.target.value)} disabled={connected || busy}>
                {config?.models.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
              <p className="helper">{config?.models.find((item) => item.id === model)?.description}</p>
            </div>
            <div className="control-group">
              <label htmlFor="provider">Speech provider</label>
              <select id="provider" value={provider} onChange={(event) => chooseProvider(event.target.value)} disabled={connected || busy}>
                {config?.voices.map((item) => (
                  <option key={item.id} value={item.id} disabled={!item.ready}>
                    {item.label} · {item.model}{item.ready ? '' : ' · needs key'}
                  </option>
                ))}
              </select>
              <p className="helper">{selectedProvider?.description}</p>
            </div>
          </>
        ) : <div className="native-model"><small>Native model</small><strong>{selectedPipeline?.model}</strong><span>Speech in → speech out</span></div>}
        <div className="control-group voice-group">
          <label htmlFor="voice">Agent voice</label>
          <select id="voice" value={voice} onChange={(event) => setVoice(event.target.value)} disabled={connected || busy || !availableVoices?.length}>
            {availableVoices?.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.description}</option>)}
          </select>
          <p className="helper">{selectedVoice?.description ?? 'Choose a configured provider first.'}</p>
        </div>
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
          {[...(selectedPipeline?.missing ?? []), ...(cascade ? selectedProvider?.missing ?? [] : [])]
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
