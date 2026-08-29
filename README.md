# Latest Voice AI Lab

A small, honest fixed-script audition for the eight providers shortlisted in [`research/voice-ai-market.md`](research/voice-ai-market.md). The React UI never receives credentials: a dependency-light Node server owns all upstream calls, and Vite proxies `/api` during development.

## Run

Requires Node 22+.

```bash
npm install
cp .env.example .env
# add only the providers you intend to use
npm run dev
```

Open the Vite URL printed in the terminal. The API listens on `127.0.0.1:8787` by default (`API_PORT` changes it). Keep `.env` at the repository root; it is gitignored. There are deliberately no `VITE_*` secrets. AWS readiness requires access key ID, secret access key, and region; session token is optional for temporary credentials.

Use previous/next (or keyboard arrows), keep the benchmark copy fixed, choose the configured voice, generate, and listen. For a defensible benchmark use three warm runs and five measured runs, preserve originals, randomize playback labels, and follow the normalization/scoring protocol in the research report. This app is a clip audition, **not** the report's duplex interruption benchmark.

## Adapter truth table

| Entry | App adapter | What the badge means |
|---|---|---|
| Eleven v3 | **Exact** REST TTS | `eleven_v3`, configured stock voice |
| Deepgram Flux TTS | **Exact** `/v2/speak` WebSocket | `flux-haley-en` by default; raw PCM is wrapped as WAV |
| Gemini 3.1 Flash Live | **Exact** Live SDK | Exact-repeat text turn; native 24 kHz PCM wrapped as WAV |
| Amazon Nova 2 Sonic | **Exact** Bedrock bidirectional stream | Cross-modal text turn inside a continuously active silent-audio session |
| GPT-Realtime-2.1 | **Exact** Realtime WebSocket | Exact-repeat prompt, captured PCM wrapped as WAV; wording fidelity must still be scored |
| Cartesia Sonic 3.6 | **Exact** REST bytes TTS | Pinned dated model and configured voice |
| Grok Voice Think Fast 1.0 | **Exact** Realtime WebSocket | Pinned model, exact-repeat prompt, captured PCM wrapped as WAV |
| Hume Octave 2 / EVI 4-mini | **Exact Octave TTS** | The generated clip is Octave; EVI is disclosed as a separate cascade companion |

“Exact” means the named API/model is called, not that a native S2S model is guaranteed to repeat every character. Record insertions/omissions. Nova requires more plumbing than the others because its supported text mode still maintains an active audio stream.

## Configuration

`.env.example` is the complete reference. Model/voice IDs are configurable so snapshots can be pinned without code changes. Voice lists intentionally contain only configured IDs: fetching provider voice inventories adds permissions, instability, and accidental use of private/cloned voices. `/api/providers` returns readiness booleans and variable names, never values. Requests time out (default 30 seconds), upstream bodies are not logged or returned, and errors use stable `{ error: { code, message } }` JSON.

Known limitations: paid calls were not exercised by automated tests; provider entitlements and preview event schemas can change. Deepgram's Flux model/voice pairing is account-dependent. Gemini 3.1 and Hume Octave 2 are previews. Nova requires Bedrock model access in the configured AWS region. Hume, Gemini, Nova, and Cartesia availability/pricing remain dynamic as noted in the source report.

## Quality checks

```bash
npm run typecheck
npm test
npm run build
npm run lint
```

Tests use local HTTP servers and mocked upstream fetches; no paid credentials are needed.

## Official API references

- [ElevenLabs TTS](https://elevenlabs.io/docs/api-reference/text-to-speech/convert), [Deepgram Flux TTS](https://developers.deepgram.com/docs/flux-tts/quickstart)
- [Gemini Live API](https://ai.google.dev/gemini-api/docs/live-api), [Nova 2 Sonic](https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-conversational-speech.html)
- [OpenAI Realtime](https://developers.openai.com/api/docs/guides/realtime), [Cartesia Sonic 3.6](https://docs.cartesia.ai/build-with-cartesia/tts-models/latest)
- [xAI Voice Agent](https://docs.x.ai/developers/model-capabilities/audio/voice-agent), [Hume TTS](https://dev.hume.ai/docs/text-to-speech-tts/overview)

Research cutoff and detailed product citations: **2026-08-29**, in the unchanged research report.
