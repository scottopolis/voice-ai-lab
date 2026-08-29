# Latest voice-AI market: audition and story plan

**Research cutoff/access date:** 2026-08-29. **Scope:** products a developer can actually audition now. Dates, prices, status and vendor performance numbers are volatile; links in the [ledger](#source-ledger) are the authority. “Latency” below is never an independently measured result unless explicitly described as such.

## Executive recommendation

Build an **eight-entry audition**, but show two leaderboards because this market is not one category:

1. **ElevenLabs — Eleven v3** (produced TTS/expressiveness benchmark)
2. **Deepgram — Flux TTS** (conversation-native TTS)
3. **Google — Gemini 3.1 Flash Live Preview** (native speech-to-speech; use **Gemini 2.5 Flash Native Audio GA** as the production fallback)
4. **Amazon — Nova 2 Sonic** (native speech-to-speech)
5. **OpenAI — GPT-Realtime-2.1** (native speech-to-speech)
6. **Cartesia — Sonic 3.6** (fast multilingual TTS)
7. **xAI — Grok Voice Think Fast 1.0** (native speech-to-speech)
8. **Hume — Octave 2 / EVI 4-mini** (expressive TTS plus S2S wrapper)

**Recommendation:** do not crown one context-free “best voice.” Crown **best voiceover** (blind, fixed-script clips) and **best live agent** (interruption, task completion and measured end-to-end latency), then name a practical overall winner. Eleven v3 is the quality/control benchmark, but not a native conversational brain. The strongest current challengers are Deepgram Flux TTS and Cartesia Sonic 3.6 for generated speech, and OpenAI/Gemini/Amazon/xAI for complete live conversation.

### “Gemma” correction

The likely intended Google product is **Gemini**, not **Gemma**. Gemma is Google's open-weight model family and is not the Google Live voice API; the current voice product is Gemini Live. One confusing coincidence: **Gemma is also the name of a Cartesia British-English stock voice**, not a model. Test Google as Gemini; use Cartesia's Gemma voice only if a British voice is desirable. [G1][C1]

## Normalized comparison

| Provider / model | Release or update | Type | Availability / integration | Latency (**vendor claim**) | Expressiveness / control | Languages | Public price verified 2026-08-29 | Key limitation |
|---|---|---|---|---|---|---|---|---|
| **ElevenLabs Eleven v3** (`eleven_v3`) | 2025-06-03 preview; API 2025-08-20; now GA | TTS; multi-speaker text-to-dialogue | REST/streaming `POST /v1/text-to-speech/{voice_id}` and Dialogue API | No comparable v3 number published; quality-first. Separate **v3 Conversational** claims ~280 ms model latency, excluding network/app | Inline audio tags, emotions/non-verbal sounds, dialogue, cloning/voice library | 70+ | **$0.10/1K chars**; v3 Conversational $0.05/1K | Fixed text in → audio out; no listening, reasoning, tools or barge-in by itself; 5,000-char request limit [E1–E4] |
| **Deepgram Flux TTS** | Launch/current page live Aug. 2026 (exact publication day not exposed) | Conversation-native TTS; can sit inside Voice Agent platform | WebSocket `wss://api.deepgram.com/v2/speak`; managed/VPC/on-prem; Voice Agent API available separately | Landing page does not publish a clean TTFA number; broader Deepgram site says TTS “as low as 80 ms” (not necessarily Flux) | Carries cross-turn context; automatic tone/pacing; explicit interrupt/flush events; speed control; no SSML/style tags needed | English at launch (the separate Flux STT supports 10 languages) | **Free through 2026-09-12**, with stated concurrency caps; post-promo Flux rate not yet applicable/publicly extractable. Voice Agent API **$4.50/hr** | Not a reasoning S2S model alone; needs STT + LLM (or Deepgram Voice Agent API). Do not misreport Flux STT's 10 languages as Flux TTS support [D1–D3] |
| **Google Gemini 3.1 Flash Live Preview** / **2.5 Flash Native Audio GA fallback** | 3.1 Live preview updated Mar. 2026; 2.5 GA released 2025-12-12 | Full-duplex native audio S2S, multimodal agent | Gemini Live API via stateful WebSocket/GenAI SDK; partner WebRTC; 2.5 GA on Vertex/Agent Platform | “Low latency” only; no official milliseconds located | 3.1 reasoning level; voices, affective dialogue, proactive audio, VAD/barge-in, tools/search; native language switching | Live API docs say 97 languages; 2.5 enterprise page advertises 30 HD voices/24 languages—scope differs | Token-priced. Current Gemini pricing page lists Live audio rates by model; because the rendered extract interleaves rows, **read price at runtime rather than hard-code it** | 3.1 is preview; native-audio output is audio-only (transcript is ancillary); audio-only sessions 15 min without session extension; raw-audio context can make cost non-intuitive [G1–G5] |
| **Amazon Nova 2 Sonic** | GA 2025-12-02; speech-generation refresh May 2026 | Full-duplex native S2S | Amazon Bedrock `InvokeModelWithBidirectionalStream`; console; LiveKit/Pipecat and telephony integrations | “Real-time, low latency”; no official millisecond claim located | Adaptive response to input prosody, turn sensitivity, interruptions, polyglot voices, text/audio switching, async tools, 1M context | 7 languages (English variants, French, Italian, German, Spanish, Portuguese, Hindi); docs enumerate 13 named locale voices while service card says 22 expressive voices—likely updated inventory | Token-priced on AWS Nova/Bedrock pricing; the dynamic page did not expose reliable numeric rates, so fetch in-region values at test time | 8-minute connection then renew; supported-language scope is much narrower than Gemini/Eleven/Cartesia; no real-time translation; AWS account/region setup [A1–A5] |
| **OpenAI GPT-Realtime-2.1** | 2026-07-06 | Full-duplex native S2S reasoning agent | GA Realtime endpoint over WebRTC/WebSocket/SIP; tools | OpenAI says platform caching cut p95 latency **at least 25%** across Realtime voice models; no absolute TTFA promised | Configurable reasoning, instruction following, tools; improved silence/noise/alphanumeric handling and interruption | Multilingual, but no official fixed language count on model card; test target locales | Per 1M tokens: text $4 in/$0.40 cached/$24 out; audio **$32 in/$0.40 cached/$64 out**; image $5 in | Not a `/audio/speech` TTS endpoint; reasoning effort trades latency/cost; preset voices rather than arbitrary cloned voice [O1–O3] |
| **Cartesia Sonic 3.6** (`sonic-3.6-2026-08-27`) | GA snapshot 2026-08-27 | Streaming TTS | REST, SSE and WebSocket API; cloud/on-prem; voice cloning | Product family claims **sub-90 ms TTS**; treat as model/provider measurement, not app TTFA | Contextual pacing/intonation, transcript fidelity, locale controls, cloning; less explicit actor-direction control than Eleven/Hume | 44 | Public plans/credit conversion are dynamic; no unambiguous per-character 3.6 rate was verified in accessible official docs | Does not listen/reason/turn-take alone; newest snapshot has only two days of public evidence [C1–C2] |
| **xAI Grok Voice Think Fast 1.0** (`grok-voice-latest`) | Current model documented Aug. 2026; exact launch day not located | Full-duplex S2S agent | OpenAI-compatible WebSocket `wss://api.x.ai/v1/realtime`; ephemeral tokens; tools including web/X/MCP/functions | **Sub-second** (vendor) | Reasoning on/off, system instructions, built-in or custom voice, server VAD, tools | “Expressive, multilingual”; official fixed count not stated for S2S (STT separately says 25) | **Starts $0.05/min**; separate Grok TTS $15/1M chars | Floating `latest` alias must be pinned; sparse independent test evidence; model docs do not quantify language coverage [X1–X2] |
| **Hume Octave 2 + EVI 4-mini** | Preview 2025-10-01 | TTS; EVI is S2S agent platform | Octave HTTP/WS TTS; EVI WebSocket/REST with external LLM | Octave docs claim **~100 ms model latency excluding network** (launch post said under 200 ms) | Semantic/emotional delivery, voice design/cloning, continuation; EVI detects vocal expression and supports interruption | 11 | Pricing page is plan/credit based; visible search extract was insufficient to map a reliable per-minute Octave/EVI rate—verify at run time | Still preview; EVI 4-mini does **not generate language natively**, so it requires an external LLM and adds cost/latency [H1–H4] |

**Status caveat:** “newest” and “stable” conflict for Google. 3.1 Flash Live is newest but preview; 2.5 Flash Native Audio is the GA production choice. Show both labels in the UI but count this as one provider entry.

## Apples-to-oranges boundaries and fair audition path

There are three architectures here:

* **TTS:** Eleven v3, Deepgram Flux TTS, Cartesia Sonic 3.6, Hume Octave 2. These speak supplied copy; they do not prove intelligence or interruption handling.
* **Native S2S:** Gemini Live, Nova 2 Sonic, GPT-Realtime-2.1, Grok Voice. They hear audio, decide what to say and speak it; output wording can differ, so a “same sentence” test is not guaranteed.
* **Agent platforms/cascades:** Deepgram Voice Agent and Hume EVI compose listening, turn logic, an LLM and speaking. Their score includes orchestration and the selected companion models.

### App implementation path

| Entry | Comparable fixed-script audition | Live-agent test |
|---|---|---|
| Eleven v3 | Direct TTS with the canonical script; use one stock voice, then a tagged emotional variant | **Prerecord the v3 answer** for listening only, or pair Scribe/other STT + same benchmark LLM + Eleven v3 Conversational. Clearly badge “cascade,” not Eleven v3 S2S. |
| Deepgram Flux TTS | Send each turn over one persistent `/v2/speak` session so it can use prior-turn context; also render turn 1 alone | Use Deepgram Voice Agent with Flux STT + the same benchmark LLM + Flux TTS when enabled. If Flux TTS is not selectable in the agent account, run a custom cascade. |
| Gemini | For a strict clip, instruct: “Say exactly the text between delimiters; add no words,” record first clean response; if it refuses/varies, use Google TTS companion and label it | Direct Live API. Use 3.1 preview for “latest”; rerun critical results on 2.5 GA. |
| Nova 2 Sonic | Exact-repeat instruction and record output; if wording drifts, present prerecorded successful output, not a fabricated TTS equivalence | Direct Bedrock bidirectional stream. |
| GPT-Realtime-2.1 | Exact-repeat instruction and record output; do **not** substitute `gpt-4o-mini-tts` without relabeling | Direct Realtime via WebRTC in browser (WebSocket on server/telephony). |
| Cartesia Sonic 3.6 | Direct streaming TTS, pinned dated snapshot; use one curated stock voice (the “Gemma” voice is optional) | Pair identical STT + benchmark LLM + Sonic 3.6; app owns VAD/cancel/flush. |
| Grok Voice | Exact-repeat instruction and record output; optional separate `/v1/tts` is a different product | Direct `/v1/realtime`, pinned `grok-voice-think-fast-1.0`. |
| Hume | Direct Octave 2 TTS on same script | EVI 4-mini + the same benchmark external LLM; score and disclose both. |

**Normalization rules:** mono PCM 24 kHz/16-bit for saved files (transcode only after capture), -16 LUFS playback normalization with no denoise/EQ, same output device/network region/time window, one comparable gender/accent voice per provider, three warm runs plus five measured runs. Preserve originals and request/event logs. Never compare a vendor's model-inference claim to your measured microphone-to-speaker latency.

## Reproducible benchmark

### Fixed script (TTS and exact-repeat mode)

Generate these as separate clips, then one combined clip:

1. **Neutral/product:** “Your order is confirmed and should arrive on Thursday, September 3 at 4:15 p.m.”
2. **Hard entities:** “Dr. Nguyen prescribed 0.25 milligrams of semaglutide; ticket QZ-407B costs $1,209.05.”
3. **Prosody:** “I didn't say she stole the blue folder—I said she *borrowed* it.”
4. **Emotion sequence:** “We found your dog. [relieved] He's safe. [quietly] He was hiding behind the old station.” Use semantic prose for providers without tags; tags are removed from spoken output.
5. **Multilingual/code-switch:** English plus the same human-verified Spanish and Hindi translations. Do not machine-score unfamiliar languages without native raters.
6. **Dialogue:** two speakers disagree politely, overlap once, then reconcile. Only score native multi-speaker products on speaker separation; others generate each turn separately.

Use an exact-copy system prompt for S2S models. Record whether words were inserted/omitted; do not keep retrying until one “hero” take appears. Randomize provider labels and playback order per rater.

### Live scenario

System role: customer-support agent for a fictional delivery company, grounded only in a 10-row fixture. Script each run:

1. “Where is order QZ-407B?”
2. Interrupt **700 ms after first audible response**: “Wait—ship it to São Paulo instead.”
3. Speak a hesitant turn with a 600 ms internal pause: “My new address is… 18 Rua São João.”
4. Ask for a tool action: “Change it and read back the confirmation code.”
5. Show frustration in tone, then switch to Spanish for one turn.

Automate interruption timing with a prerecorded input track, but also perform three human calls to catch duplex/audio-device artifacts. Fixture and tool results must be identical. Cap answers at two sentences.

### Instrumentation

For each of five measured runs log monotonic timestamps: connection ready; first input sample sent; input speech end; server end-of-turn; first output event; first decoded audio sample; playback start; interruption input start; model cancel event; playback stop; tool request/result; final audio end. Report median and p95 for:

* **TTFA:** input speech end → first playable output sample
* **mouth-to-ear:** input speech end → playback start
* **barge-in stop:** interruption speech start → local playback stopped
* **turn completion** and **tool completion**

Log region, transport, model snapshot, voice ID, reasoning setting, prompt, codecs/sample rates, SDK version and estimated cost. A network trace is useful; API timestamps alone omit playback buffering.

### Scoring rubric (100 points)

| Dimension | Weight | Anchors |
|---|---:|---|
| Naturalness | 20 | 1 robotic/artifacted; 3 plausible with obvious synthesis; 5 human-like across all clips |
| Emotional range | 15 | 1 flat/inappropriate; 3 emotion present but coarse; 5 nuanced transitions without caricature |
| Pronunciation/fidelity | 15 | 1 multiple critical errors; 3 one material entity/error; 5 exact copy and correct names, units, code, currency |
| Interruption/turn-taking | 15 | 1 talks over user/false turns; 3 usable; 5 fast clean barge-in, handles hesitation, retains context |
| Latency | 15 | Score measured mouth-to-ear: 5 <500 ms, 4 500–749, 3 750–999, 2 1–1499, 1 ≥1500; report barge-in separately |
| Controllability | 10 | 1 ignores direction; 3 broad persona works; 5 repeatable fine control without harming fidelity |
| Developer experience | 10 | 1 blocked/fragile; 3 documented but plumbing-heavy; 5 quick setup, stable streaming, clear errors/usage/logging |

Three or more blind raters; five runs/provider. Publish median category scores, variance, failure rate and cost/run. TTS entries receive **N/A**, not zero, for interruption; rank them only on the 60-point TTS subset (naturalness, emotion, pronunciation, control), rescaled to 100. S2S ranks use all 100. Decide ties within two points by pronunciation/failure rate, not subjective preference.

## YouTube and content-angle findings

Discovery used the official YouTube Data API separately from product research; metadata and comments below were retrieved 2026-08-29. Public captions were fetched where available. Counts are point-in-time, not comparable across ages. This is a deliberately small relevant sample, not comprehensive scraping.

### Selected evidence

**1. [“ElevenLabs new V3 voice model can create entire conversations”](https://www.youtube.com/watch?v=c_b-KWAogbI) — Matt Wolfe, 2025-06-17.** 27,539 views, 370 likes, 14 comments.

* **Thumbnail/title/hook observed:** novelty + whole conversations; opens by playing an expressive two-person sample, then clones his own voice from ~30 seconds.
* **Actually tested:** dialogue tags (chuckle/laugh/excited/shouting) and a quick clone. He explicitly says his clone does not sound like him and notes the 30-minute training route could improve it.
* **Comments observed:** weak identity fidelity dominates: “It was a reasonable approximation but it wasn’t very good,” “better results with V2.5,” and requests for the 30-minute version. This is evidence against equating expressiveness with cloning accuracy.

**2. [“ElevenLabs just got nuked by open source”](https://www.youtube.com/watch?v=dQ841Pd6YvQ) — Jeff Geerling, 2026-01-23.** 655,272 views, 24,814 likes, 1,493 comments.

* **Hook observed:** provocative incumbent-vs-free framing around Qwen3-TTS and voice cloning.
* **Content evidence limit:** transcript retrieval was not performed for this selected source; description says it demos Qwen3-TTS. Do not infer a complete benchmark from the title.
* **Comments observed:** the strongest audience reaction is safety/trust rather than fidelity: “Don't ever use audio as password,” bank authorization fears, identity theft and “nothing is real.” Useful sidebar, but Qwen was not added to the app shortlist because this comparison prioritizes currently supported commercial APIs.

**3. [“Best Text-to-Speech for Voice AI? Deepgram vs ElevenLabs”](https://www.youtube.com/watch?v=JMmR8RGYX7A) — Deepgram, 2026-07-13.** 464 views, 9 likes, 2 comments.

* **Hook/content observed:** enterprise head-to-head around accuracy, latency, cost and scale; transcript positions ElevenLabs for entertainment and Deepgram for live agents, demonstrating hard terms and an intentionally awkward delayed drive-through.
* **Evidence caution:** this is vendor marketing, not an independent test; claimed 40% cost advantage and blind preferences need primary methodology before reuse. Only one substantive comment was visible, so no audience theme can be claimed.

**4. [“Introducing Amazon Nova 2 Sonic”](https://www.youtube.com/watch?v=pO2rZ6MoN1Y) — Amazon Web Services, 2025-12-02.** 6,060 views, 74 likes, 7 comments.

* **Hook/content observed:** “how” speech is said matters; demos Hindi switching and a mortgage-support flow with verification, branch lookup and asynchronous retrieval.
* **Comments observed:** requests for Marathi/Thai/more translation languages and a concrete EU deployment mismatch: Nova available in `eu-north-1` while Amazon Connect was not, versus Connect in `eu-central-1` without Nova. Region + language availability are real buyer pain points.

**5. [“OpenAI's NEW Voice Agent Model — GPT-RealTime 2 is dope!”](https://www.youtube.com/watch?v=FPp7u8F6E9Y) — 1littlecoder, 2026-05-07.** 4,953 views, 86 likes, 24 comments.

* **Hook/content observed:** leads with “most impressive” and latency, then runs an unedited live empathy conversation and explains voice-to-action/tool use.
* **Comments observed:** viewers ask cascade-vs-native cost and value tool calling. A revealing correction says the end demo used Realtime 1.5, not 2—model/version provenance is an audience trust issue. The video predates 2.1, so it is market context, not evidence about 2.1 quality.

**6. [“Voice Agents with Gemini Native Audio”](https://www.youtube.com/watch?v=aCPjPB7p5OE) — Gradient Update, 2025-12-13.** 3,964 views, 83 likes, 13 comments.

* **Hook/content observed:** argues native audio crossed from impressive chat demos to enterprise use because function calling, instruction following and long-context behavior improved; inspects docs/pricing and demonstrates the model.
* **Comments observed:** repeated “how do I ground it in company data?” questions (hours, prices, orders, Confluence) and function-calling setup trouble. Business viewers care less about a pretty voice than dependable retrieval/action.

**7. [“Build a real-time voice AI agent with Gemini Live API”](https://www.youtube.com/watch?v=pFc-HcUgFgY) — Google Cloud Tech, 2026-08-26.** 58,135 views, 855 likes, 38 comments.

* **Hook/content observed:** opens with a working music agent, interrupts it immediately, then teaches “TTS reads; Live hears” and the WebSocket send/receive loop. It explicitly shows VAD, local playback cancellation for instant-feeling barge-in, and tools.
* **Comments observed:** strongest positive reactions mention actual audio-to-audio apps and Jira/tool integration. Captions and comments were accessible; thumbnail pixels were not separately downloaded, so visual thumbnail composition is unverified.

**8. [“Cartesia’s State-of-the-Art Breakthrough: Sonic 3.5 TTS + Ink.2 ASR”](https://www.youtube.com/watch?v=1npr03B_YNg) — Cartesia, published 2026-07-17.** 245 views, 11 likes, 4 comments.

* **Hook/content observed:** public flight-rebooking demo with a spelling clarification, confirmation code, time constraint and upgrade action; then leaderboard and “84% switched” claims.
* **Evidence caution/comments:** vendor-authored and superseded by Sonic 3.6. Comments mostly request credits/use-case guide, likely prompted by the video's giveaway CTA; they are not independent quality evidence.

### Observed audience pain points vs inferred angles

**Observed:** (a) expressive demos can have poor clone identity; (b) model/version mistakes undermine reviews; (c) buyers ask about total cascade cost, not token price alone; (d) grounding and tool reliability determine enterprise utility; (e) language/region/telephony overlap blocks deployment; (f) voice cloning triggers fraud/authentication anxiety; (g) interruption demos make native S2S differences instantly legible.

**Inferred content opportunity (not comment evidence):** most comparison videos let vendors choose their own hero script and then mix TTS with agents. A controlled, blind two-leaderboard test—same difficult copy plus the same interruption/tool scenario—is both more honest and more visually demonstrable. For established businesses, translate “sounds human” into abandonment rate, task completion, compliance/deployment and cost per resolved call.

### Title/hook options

1. **I Tested 8 New AI Voices Blind—The Famous One Didn't Win**
2. **ElevenLabs v3 vs GPT-Realtime 2.1 vs Gemini Live: One Fair Voice Test**
3. **The Best AI Voice Isn't the Best Voice Agent (I Tested Both)**
4. **I Interrupted Every New AI Voice—Only These Felt Human**
5. **8 AI Voices Read the Same Impossible Script. Hear the Winner.**
6. **$0.05/Minute vs “Studio Quality”: Which AI Voice Should a Business Buy?**
7. **The Voice Demo Vendors Don't Show: Names, Codes, Pauses and Interruptions**
8. **I Built the Same Customer-Service Call on Every Major Voice API**
9. **Gemma vs Gemini? The 2026 AI Voice Market Is More Confusing Than It Sounds**
10. **Natural Voice, Bad Agent: The AI Voice Test That Changes the Winner**
11. **Can You Hear Which Voice Is AI? 2026's New Models, Ranked**

**Strongest narrative:** **“The best-sounding voice loses when you interrupt it.”** Open cold with eight anonymized reads of the hard-entity line, reveal the blind TTS winner, then interrupt every live agent at the exact same moment. The reversal explains the category error: cinematic expressiveness, faithful transactional speech and conversational competence are different products. End with role-based winners and an overall recommendation, not a vague montage.

## Source ledger

All accessed **2026-08-29**. Official provider sources are primary for market facts; YouTube is evidence about creator coverage/audience response, not model capability.

### ElevenLabs

* **[E1]** [Introducing Eleven v3 (alpha)](https://elevenlabs.io/blog/eleven-v3) — ElevenLabs, 2025-06-03; page now notes GA.
* **[E2]** [Eleven v3 API availability](https://elevenlabs.io/blog/eleven-v3-alpha-now-available-in-the-api) — 2025-08-20.
* **[E3]** [Models documentation](https://elevenlabs.io/docs/overview/models) — current model IDs, status, languages, limits and conversational latency claim.
* **[E4]** [ElevenAPI pricing](https://elevenlabs.io/pricing/api) — current unit prices.

### Deepgram

* **[D1]** [Flux TTS product page](https://deepgram.com/product/text-to-speech/flux) — current architecture, promo/status, controls and vendor benchmark methodology.
* **[D2]** [Deepgram Voice Agent API](https://deepgram.com/product/voice-agent-api) — orchestration and $4.50/hour.
* **[D3]** [Flux STT quickstart](https://developers.deepgram.com/docs/flux/quickstart) — kept separate to prevent conflating STT turn detection/languages with Flux TTS.

### Google

* **[G1]** [Gemini Live API overview](https://ai.google.dev/gemini-api/docs/live-api) — transports/features; last updated 2026-08-26.
* **[G2]** [Live API capabilities and limitations](https://ai.google.dev/gemini-api/docs/live-api/capabilities) — VAD, affective/proactive audio, languages, session/context limits; last updated 2026-08-05.
* **[G3]** [Gemini 3.1 Flash Live Preview model](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-live-preview) — newest preview model ID/update.
* **[G4]** [Gemini 2.5 Flash Native Audio GA](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/2-5-flash-live-api) — GA date/model/voices/regions.
* **[G5]** [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) — current pricing, last updated 2026-08-28.

### Amazon

* **[A1]** [Nova 2 Sonic launch](https://aws.amazon.com/blogs/aws/introducing-amazon-nova-2-sonic-next-generation-speech-to-speech-model-for-conversational-ai/) — AWS News Blog, 2025-12-02. (AWS also serves this under an `amazon.com/blogs/aws` canonical URL.)
* **[A2]** [Nova 2 Sonic user guide](https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-conversational-speech.html) — capabilities/connection limit.
* **[A3]** [Languages and voices](https://docs.aws.amazon.com/nova/latest/nova2-userguide/sonic-language-support.html).
* **[A4]** [Bedrock model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-sonic.html) — lifecycle/model limits/API.
* **[A5]** [Nova pricing](https://aws.amazon.com/nova/pricing/) — dynamic regional rates; numeric values were not exposed in retrieved text.

### OpenAI

* **[O1]** [Realtime and audio guide](https://developers.openai.com/api/docs/guides/realtime) — current recommended model and transports.
* **[O2]** [GPT-Realtime-2.1 model card](https://developers.openai.com/api/docs/models/gpt-realtime-2.1) — capabilities and prices.
* **[O3]** [2.1 release announcement](https://community.openai.com/t/new-realtime-models-on-the-api-gpt-realtime-2-1-and-gpt-realtime-2-1-mini/1385896) — OpenAI Developer Community staff announcement, 2026-07-06; latency claim. This is official staff communication, but less durable than docs.

### Cartesia, xAI, Hume

* **[C1]** [Sonic 3.6 documentation](https://docs.cartesia.ai/build-with-cartesia/tts-models/latest) — GA snapshot/date, 44 languages and Cartesia “Gemma” voice.
* **[C2]** [Cartesia launch page](https://cartesia.ai/launch) — sub-90 ms vendor claim.
* **[X1]** [xAI Voice overview](https://docs.x.ai/developers/model-capabilities/audio/voice) — products, endpoint, latency and prices.
* **[X2]** [xAI Voice Agent API](https://docs.x.ai/developers/model-capabilities/audio/voice-agent) — current alias/version, controls and compatibility.
* **[H1]** [Octave 2 / EVI 4-mini launch](https://www.hume.ai/blog/octave-2-launch) — 2025-10-01.
* **[H2]** [Hume TTS docs](https://dev.hume.ai/docs/text-to-speech-tts/overview) — latency, limits, status and integration.
* **[H3]** [Hume EVI overview](https://dev.hume.ai/docs/speech-to-speech-evi/overview).
* **[H4]** [Hume pricing](https://www.hume.ai/pricing) — dynamic plan pricing; exact model-level rate unresolved.

### YouTube

The eight direct URLs and point-in-time metrics are embedded in the findings above. Metadata/comments came from YouTube Data API `videos.list` and `commentThreads.list`; captions were public/auto-generated tracks fetched with `youtube-transcript-api`. The Jeff Geerling transcript was not fetched, and thumbnail imagery was not downloaded or visually audited. Comment quotations are short, representative examples from the accessible relevance-ranked sample—not a claim of all comments or sentiment prevalence.

## Remaining uncertainty for the builder

Before wiring paid calls, re-open dynamic pricing pages for **Gemini Live, Nova 2 Sonic, Cartesia 3.6 and Hume** and save a dated screenshot/JSON quote; accessible page rendering did not provide sufficiently unambiguous model-level numbers. Confirm Flux TTS's model IDs, post-promo pricing and account availability—the launch promotion is active at this cutoff, so normal billing has not begun. Pin all versioned models; never use `latest` in recorded benchmark runs. Finally, 2026 releases have little independent YouTube testing: treat vendor demos and leaderboards as hypotheses the hands-on benchmark must verify.
