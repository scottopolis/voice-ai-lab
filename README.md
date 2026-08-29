# Voice AI Lab

A small browser demo for live conversations through interchangeable GPT models and voice providers. Pipecat owns the real-time pipeline and provider protocols; the browser sends and receives audio over peer-to-peer WebRTC.

```text
Microphone → Deepgram Flux STT → selected OpenAI GPT → selected voice → speaker
```

This is intentionally a cascade rather than a native speech-to-speech agent. Keeping transcription and reasoning fixed makes it possible to change the speaking provider without rebuilding the conversation loop.

## Setup

Requires Node 22+ and Python 3.11+.

```bash
npm install
npm run setup
cp .env.example .env
# Add OPENAI_API_KEY, DEEPGRAM_API_KEY, and any voice-provider keys you want.
npm run dev
```

Open the Vite URL printed in the terminal, choose a GPT model and configured voice provider, then select **Start conversation** and allow microphone access. End the conversation before changing either selection.

API keys stay in the Python process. The frontend receives only readiness booleans and missing environment-variable names.

## Available choices

GPT models:

- GPT-5.6 Terra
- GPT-5.6 Luna
- GPT-5.4 Mini

Voice providers:

- ElevenLabs Eleven v3 Conversational
- Deepgram Flux TTS
- Cartesia Sonic 3.6
- Hume Octave
- OpenAI speech
- xAI streaming TTS

Voice IDs and model snapshots can be changed in `.env`. Deepgram Flux STT and an OpenAI GPT model are used for every provider, so `DEEPGRAM_API_KEY` and `OPENAI_API_KEY` are always required.

## Useful commands

```bash
npm run dev        # Python API + Vite UI
npm run api        # Python API only
npm run typecheck
npm run lint
npm run build
```

The research report remains in [`research/voice-ai-market.md`](research/voice-ai-market.md).
