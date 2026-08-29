# Voice AI Lab

A small browser demo for comparing native speech-to-speech agents with interchangeable GPT models and voice providers. Pipecat owns the real-time pipelines and provider protocols; the browser always sends and receives audio over peer-to-peer WebRTC.

```text
Cascade:         microphone → Deepgram Flux STT → selected GPT → selected voice → speaker
OpenAI Realtime: microphone → gpt-realtime-2.1 → speaker
Gemini Live:     microphone → Gemini 3.1 Flash Live → speaker
```

The cascade keeps transcription and reasoning fixed so voice providers can be compared directly. OpenAI Realtime and Gemini Live are separate native baselines because they own the complete audio-to-audio interaction.

## Setup

Requires Node 22+ and Python 3.11+.

```bash
npm install
npm run setup
cp .env.example .env
# Add the keys for the pipelines and voice providers you want.
npm run dev
```

Open the Vite URL printed in the terminal, choose a pipeline, model/provider where applicable, and voice, then select **Start conversation** and allow microphone access. End the conversation before changing selections.

API keys stay in the Python process. The frontend receives only public model/voice IDs and labels, readiness booleans, and missing environment-variable names.

## Available choices

GPT models:

- GPT-5.6 Terra
- GPT-5.6 Luna
- GPT-5.4 Mini

Native speech-to-speech agents:

- OpenAI Realtime (`gpt-realtime-2.1`)
- Gemini Live (`gemini-3.1-flash-live-preview`)

Voice providers:

- ElevenLabs Eleven v3 Conversational
- Deepgram Flux TTS
- Cartesia Sonic 3.6
- Hume Octave
- OpenAI speech
- xAI streaming TTS

Built-in voice choices include Rachel, Adam, and George for ElevenLabs; Heather, Alexis, and Miles for Deepgram Flux; Eve, Ara, and Rex for xAI; Marin and Cedar for OpenAI Realtime; and Kore, Puck, and Aoede for Gemini Live. Rachel is now the ElevenLabs default because the previous default, George, is British; George remains selectable. Provider voice IDs are intentionally defined server-side rather than overridden in `.env`. Other providers retain their existing server-configured voice environment variables.

The cascade requires `DEEPGRAM_API_KEY`, `OPENAI_API_KEY`, and the selected voice provider's key. OpenAI Realtime only requires `OPENAI_API_KEY`; Gemini Live only requires `GOOGLE_API_KEY`.

## Useful commands

```bash
npm run dev        # Python API + Vite UI
npm run api        # Python API only
npm run typecheck
npm run lint
npm run build
```

The research report remains in [`research/voice-ai-market.md`](research/voice-ai-market.md).
