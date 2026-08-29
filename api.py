import os
from contextlib import asynccontextmanager

import uvicorn
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from pipecat.transports.smallwebrtc.request_handler import (
    SmallWebRTCPatchRequest,
    SmallWebRTCRequest,
    SmallWebRTCRequestHandler,
)

from voice_agent import public_config, run_voice_agent, validate_selection


load_dotenv(override=False)
webrtc_handler = SmallWebRTCRequestHandler()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield
    await webrtc_handler.close()


app = FastAPI(title="Voice AI Lab", lifespan=lifespan)


@app.get("/api/health")
async def health():
    return {"ok": True}


@app.get("/api/config")
async def config():
    return public_config()


@app.post("/api/offer")
async def offer(raw_request: Request, background_tasks: BackgroundTasks):
    try:
        request = SmallWebRTCRequest.from_dict(await raw_request.json())
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=400, detail="Invalid WebRTC offer") from error

    selection = request.request_data if isinstance(request.request_data, dict) else {}
    model_id = selection.get("model")
    voice_id = selection.get("voice")
    if not isinstance(model_id, str) or not isinstance(voice_id, str):
        raise HTTPException(status_code=400, detail="Select a GPT model and voice provider")

    try:
        validate_selection(model_id, voice_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    async def start_agent(connection):
        background_tasks.add_task(run_voice_agent, connection, model_id, voice_id)

    return await webrtc_handler.handle_web_request(
        request=request,
        webrtc_connection_callback=start_agent,
    )


@app.patch("/api/offer")
async def ice_candidate(request: SmallWebRTCPatchRequest):
    await webrtc_handler.handle_patch_request(request)
    return {"ok": True}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=int(os.getenv("API_PORT", "8787")))
