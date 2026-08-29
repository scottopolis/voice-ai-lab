import os
from collections.abc import Callable
from dataclasses import dataclass

from loguru import logger
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineParams, PipelineWorker
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.flux.stt import DeepgramFluxSTTService
from pipecat.services.deepgram.flux.tts import DeepgramFluxTTSService
from pipecat.services.elevenlabs.dialogue.tts import ElevenLabsDialogueTTSService
from pipecat.services.google.gemini_live.llm import GeminiLiveLLMService
from pipecat.services.hume.tts import HumeTTSService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.services.openai.realtime.events import (
    AudioConfiguration,
    AudioInput,
    AudioOutput,
    InputAudioNoiseReduction,
    InputAudioTranscription,
    SemanticTurnDetection,
    SessionProperties,
)
from pipecat.services.openai.realtime.llm import OpenAIRealtimeLLMService
from pipecat.services.openai.tts import OpenAITTSService
from pipecat.services.xai.tts import XAITTSService
from pipecat.transports.base_transport import TransportParams
from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport
from pipecat.workers.runner import WorkerRunner


SYSTEM_INSTRUCTION = """You are a friendly assistant in a live voice conversation.
Keep replies concise, natural, and easy to say aloud. Usually answer in one or two
sentences. Do not use markdown, emoji, lists, or stage directions."""


@dataclass(frozen=True)
class ModelOption:
    id: str
    label: str


@dataclass(frozen=True)
class VoiceOption:
    id: str
    label: str
    model: str
    required_env: tuple[str, ...]
    create: Callable[[], object]

    @property
    def ready(self) -> bool:
        return all(os.getenv(name) for name in self.required_env)

    @property
    def missing(self) -> list[str]:
        return [name for name in self.required_env if not os.getenv(name)]


@dataclass(frozen=True)
class PipelineOption:
    id: str
    label: str
    model: str
    required_env: tuple[str, ...]

    @property
    def ready(self) -> bool:
        return all(os.getenv(name) for name in self.required_env)

    @property
    def missing(self) -> list[str]:
        return [name for name in self.required_env if not os.getenv(name)]


LLM_MODELS = (
    ModelOption("gpt-5.6-terra", "GPT-5.6 Terra"),
    ModelOption("gpt-5.6-luna", "GPT-5.6 Luna"),
    ModelOption("gpt-5.4-mini", "GPT-5.4 Mini"),
)


def _pipeline_options() -> tuple[PipelineOption, ...]:
    return (
        PipelineOption(
            id="cascade",
            label="Swappable cascade",
            model="Deepgram → GPT → selected voice",
            required_env=("OPENAI_API_KEY", "DEEPGRAM_API_KEY"),
        ),
        PipelineOption(
            id="openai-realtime",
            label="OpenAI Realtime",
            model=os.getenv("OPENAI_REALTIME_MODEL", "gpt-realtime-2.1"),
            required_env=("OPENAI_API_KEY",),
        ),
        PipelineOption(
            id="gemini-live",
            label="Gemini Live",
            model=os.getenv("GEMINI_LIVE_MODEL", "gemini-3.1-flash-live-preview"),
            required_env=("GOOGLE_API_KEY",),
        ),
    )


def _voice_options() -> tuple[VoiceOption, ...]:
    eleven_voice = os.getenv("ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb")
    cartesia_voice = os.getenv(
        "CARTESIA_VOICE_ID", "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4"
    )
    hume_voice = os.getenv("HUME_VOICE_ID", "")

    return (
        VoiceOption(
            id="elevenlabs",
            label="ElevenLabs",
            model=os.getenv("ELEVENLABS_MODEL", "eleven_v3_conversational"),
            required_env=("ELEVENLABS_API_KEY",),
            create=lambda: ElevenLabsDialogueTTSService(
                api_key=os.environ["ELEVENLABS_API_KEY"],
                settings=ElevenLabsDialogueTTSService.Settings(
                    model=os.getenv("ELEVENLABS_MODEL", "eleven_v3_conversational"),
                    voice=eleven_voice,
                ),
            ),
        ),
        VoiceOption(
            id="deepgram",
            label="Deepgram",
            model=os.getenv("DEEPGRAM_TTS_VOICE", "flux-heather-en"),
            required_env=("DEEPGRAM_API_KEY",),
            create=lambda: DeepgramFluxTTSService(
                api_key=os.environ["DEEPGRAM_API_KEY"],
                settings=DeepgramFluxTTSService.Settings(
                    voice=os.getenv("DEEPGRAM_TTS_VOICE", "flux-heather-en")
                ),
            ),
        ),
        VoiceOption(
            id="cartesia",
            label="Cartesia",
            model=os.getenv("CARTESIA_MODEL", "sonic-3.6-2026-08-27"),
            required_env=("CARTESIA_API_KEY",),
            create=lambda: CartesiaTTSService(
                api_key=os.environ["CARTESIA_API_KEY"],
                cartesia_version=os.getenv("CARTESIA_API_VERSION"),
                settings=CartesiaTTSService.Settings(
                    model=os.getenv("CARTESIA_MODEL", "sonic-3.6-2026-08-27"),
                    voice=cartesia_voice,
                ),
            ),
        ),
        VoiceOption(
            id="hume",
            label="Hume",
            model="Octave 2",
            required_env=("HUME_API_KEY", "HUME_VOICE_ID"),
            create=lambda: HumeTTSService(
                api_key=os.environ["HUME_API_KEY"],
                settings=HumeTTSService.Settings(voice=hume_voice),
            ),
        ),
        VoiceOption(
            id="openai",
            label="OpenAI",
            model=os.getenv("OPENAI_TTS_MODEL", "gpt-4o-mini-tts"),
            required_env=("OPENAI_API_KEY",),
            create=lambda: OpenAITTSService(
                api_key=os.environ["OPENAI_API_KEY"],
                settings=OpenAITTSService.Settings(
                    model=os.getenv("OPENAI_TTS_MODEL", "gpt-4o-mini-tts"),
                    voice=os.getenv("OPENAI_TTS_VOICE", "marin"),
                ),
            ),
        ),
        VoiceOption(
            id="xai",
            label="xAI",
            model="Streaming TTS",
            required_env=("XAI_API_KEY",),
            create=lambda: XAITTSService(
                api_key=os.environ["XAI_API_KEY"],
                settings=XAITTSService.Settings(
                    voice=os.getenv("XAI_TTS_VOICE", "eve")
                ),
            ),
        ),
    )


def public_config() -> dict:
    return {
        "pipelines": [
            {
                "id": pipeline.id,
                "label": pipeline.label,
                "model": pipeline.model,
                "ready": pipeline.ready,
                "missing": pipeline.missing,
            }
            for pipeline in _pipeline_options()
        ],
        "models": [{"id": model.id, "label": model.label} for model in LLM_MODELS],
        "voices": [
            {
                "id": voice.id,
                "label": voice.label,
                "model": voice.model,
                "ready": voice.ready,
                "missing": voice.missing,
            }
            for voice in _voice_options()
        ],
    }


def validate_selection(
    pipeline_id: str, model_id: str, voice_id: str
) -> tuple[PipelineOption, VoiceOption | None]:
    pipeline = next(
        (item for item in _pipeline_options() if item.id == pipeline_id), None
    )
    if pipeline is None:
        raise ValueError("Unknown agent pipeline")

    if pipeline_id != "cascade":
        if pipeline.missing:
            raise ValueError(
                f"Missing environment variables: {', '.join(pipeline.missing)}"
            )
        return pipeline, None

    if model_id not in {model.id for model in LLM_MODELS}:
        raise ValueError("Unknown GPT model")

    voice = next((item for item in _voice_options() if item.id == voice_id), None)
    if voice is None:
        raise ValueError("Unknown voice provider")

    missing = [*pipeline.missing, *voice.missing]
    if missing:
        raise ValueError(f"Missing environment variables: {', '.join(dict.fromkeys(missing))}")
    return pipeline, voice


async def run_voice_agent(
    connection, pipeline_id: str, model_id: str, voice_id: str
) -> None:
    pipeline_option, voice = validate_selection(pipeline_id, model_id, voice_id)
    logger.info(
        "Starting voice session: pipeline={} model={} voice={}",
        pipeline_id,
        model_id,
        voice_id,
    )

    transport = SmallWebRTCTransport(
        webrtc_connection=connection,
        params=TransportParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            audio_out_10ms_chunks=2,
        ),
    )

    context = LLMContext()
    if pipeline_option.id == "cascade":
        assert voice is not None
        stt = DeepgramFluxSTTService(api_key=os.environ["DEEPGRAM_API_KEY"])
        llm = OpenAILLMService(
            api_key=os.environ["OPENAI_API_KEY"],
            settings=OpenAILLMService.Settings(
                model=model_id,
                system_instruction=SYSTEM_INSTRUCTION,
            ),
        )
        user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
            context,
            user_params=LLMUserAggregatorParams(vad_analyzer=SileroVADAnalyzer()),
        )
        processors = [
            transport.input(),
            stt,
            user_aggregator,
            llm,
            voice.create(),
            transport.output(),
            assistant_aggregator,
        ]
    elif pipeline_option.id == "openai-realtime":
        llm = OpenAIRealtimeLLMService(
            api_key=os.environ["OPENAI_API_KEY"],
            settings=OpenAIRealtimeLLMService.Settings(
                model=pipeline_option.model,
                system_instruction=SYSTEM_INSTRUCTION,
                session_properties=SessionProperties(
                    audio=AudioConfiguration(
                        input=AudioInput(
                            transcription=InputAudioTranscription(),
                            turn_detection=SemanticTurnDetection(),
                            noise_reduction=InputAudioNoiseReduction(type="near_field"),
                        ),
                        output=AudioOutput(
                            voice=os.getenv("OPENAI_REALTIME_VOICE", "marin")
                        ),
                    )
                ),
            ),
        )
        user_aggregator, assistant_aggregator = LLMContextAggregatorPair(context)
        processors = [
            transport.input(),
            user_aggregator,
            llm,
            transport.output(),
            assistant_aggregator,
        ]
    else:
        llm = GeminiLiveLLMService(
            api_key=os.environ["GOOGLE_API_KEY"],
            settings=GeminiLiveLLMService.Settings(
                model=pipeline_option.model,
                voice=os.getenv("GEMINI_LIVE_VOICE", "Kore"),
                system_instruction=SYSTEM_INSTRUCTION,
            ),
            inference_on_context_initialization=False,
        )
        user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
            context,
            user_params=LLMUserAggregatorParams(vad_analyzer=SileroVADAnalyzer()),
        )
        processors = [
            transport.input(),
            user_aggregator,
            llm,
            transport.output(),
            assistant_aggregator,
        ]

    pipeline = Pipeline(processors)
    worker = PipelineWorker(
        pipeline,
        params=PipelineParams(
            audio_out_sample_rate=24000,
            enable_metrics=True,
        ),
    )

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(_transport, _client):
        logger.info("Voice session disconnected")
        await worker.cancel()

    runner = WorkerRunner(handle_sigint=False)
    await runner.add_workers(worker)
    await runner.run()
