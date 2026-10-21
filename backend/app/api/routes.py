import asyncio
import glob
import json
import os
import re
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.api.range_streaming import stream_file_with_range
from app.services.ai_script_service import generate_dialogue_from_topic
from app.services.pipeline import process_dialogue
from app.services.translation_service import lookup_word_details

router = APIRouter()

STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "storage"))
SAFE_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]+$")


def _validate_conversation_id(conversation_id: str) -> str:
    if not conversation_id or not SAFE_ID_PATTERN.match(conversation_id):
        raise HTTPException(status_code=400, detail="Invalid conversation_id format")
    return conversation_id


def _rewrite_urls_for_request(data: dict, request: Request) -> dict:
    base_url = str(request.base_url).rstrip("/")
    conv_id = data.get("conversation_id", "")
    offline_filename = data.get("offline_filename") or f"{conv_id}.mp3"
    updated = dict(data)
    updated["audio_url"] = f"{base_url}/static/{offline_filename}"
    updated["audio_stream_url"] = f"{base_url}/api/audio/{conv_id}/stream"
    updated.pop("local_audio_path", None)
    updated.pop("local_json_path", None)
    return updated


class DialogueCreateRequest(BaseModel):
    title: Optional[str] = "English Conversation"
    script: str
    silence_sec: Optional[float] = 0.4
    pause_between_speakers: Optional[float] = None
    accent: Optional[str] = "us"
    emotion: Optional[str] = "natural"


class TopicScriptRequest(BaseModel):
    topic: str
    num_lines: Optional[int] = 10


class TopicDialogueRequest(BaseModel):
    topic: str
    num_lines: Optional[int] = 10
    pause_between_speakers: Optional[float] = 0.4
    accent: Optional[str] = "us"
    emotion: Optional[str] = "natural"


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.post("/dialogue/generate-script")
async def generate_script_endpoint(req: TopicScriptRequest):
    if not req.topic or not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty")
    try:
        result = await asyncio.to_thread(
            generate_dialogue_from_topic,
            req.topic.strip(),
            req.num_lines or 10,
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dialogue/from-topic")
async def create_dialogue_from_topic_endpoint(req: TopicDialogueRequest, request: Request):
    if not req.topic or not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty")
    try:
        generated = await asyncio.to_thread(
            generate_dialogue_from_topic,
            req.topic.strip(),
            req.num_lines or 10,
        )
        effective_silence = max(0.0, min(10.0, float(req.pause_between_speakers or 0.4)))
        base_url = str(request.base_url).rstrip("/")
        data = await process_dialogue(
            script=generated["script"],
            title=generated["title"],
            storage_dir=STORAGE_DIR,
            base_url=base_url,
            silence_sec=effective_silence,
            accent=req.accent or "us",
            emotion=req.emotion or "natural",
        )
        return _rewrite_urls_for_request(data, request)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dialogue/create")
async def create_dialogue(req: DialogueCreateRequest, request: Request):
    if not req.script or not req.script.strip():
        raise HTTPException(status_code=400, detail="Script cannot be empty")

    raw_pause = (
        req.pause_between_speakers
        if req.pause_between_speakers is not None
        else (req.silence_sec if req.silence_sec is not None else 0.4)
    )
    effective_silence = max(0.0, min(10.0, float(raw_pause)))

    base_url = str(request.base_url).rstrip("/")
    try:
        data = await process_dialogue(
            script=req.script,
            title=req.title or "English Conversation",
            storage_dir=STORAGE_DIR,
            base_url=base_url,
            silence_sec=effective_silence,
            accent=req.accent or "us",
            emotion=req.emotion or "natural",
        )
        return _rewrite_urls_for_request(data, request)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dialogue/{conversation_id}")
async def get_dialogue(conversation_id: str, request: Request):
    safe_id = _validate_conversation_id(conversation_id)
    json_path = os.path.join(STORAGE_DIR, f"{safe_id}.json")
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail="Conversation not found")

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return _rewrite_urls_for_request(data, request)


@router.get("/dialogue")
async def list_dialogues(request: Request):
    base_url = str(request.base_url).rstrip("/")
    json_files = glob.glob(os.path.join(STORAGE_DIR, "*.json"))
    # Sort newest first by modification time
    json_files.sort(key=lambda p: os.path.getmtime(p), reverse=True)

    dialogues = []
    for jf in json_files:
        try:
            with open(jf, "r", encoding="utf-8") as f:
                data = json.load(f)
                conv_id = data.get("conversation_id")
                if not conv_id:
                    continue
                offline_filename = data.get("offline_filename") or f"{conv_id}.mp3"
                dialogues.append({
                    "conversation_id": conv_id,
                    "title": data.get("title", "English Conversation"),
                    "created_at": data.get("created_at"),
                    "total_duration": data.get("total_duration", 0.0),
                    "segments_count": len(data.get("segments", [])),
                    "audio_url": f"{base_url}/static/{offline_filename}",
                    "audio_stream_url": f"{base_url}/api/audio/{conv_id}/stream",
                })
        except Exception:
            continue
    return {"dialogues": dialogues}


@router.get("/audio/{conversation_id}/stream")
async def stream_dialogue_audio(conversation_id: str, request: Request):
    safe_id = _validate_conversation_id(conversation_id)
    mp3_path = os.path.join(STORAGE_DIR, f"{safe_id}.mp3")
    return stream_file_with_range(mp3_path, request, media_type="audio/mpeg")


@router.get("/dictionary/lookup")
async def lookup_word(word: str, context: Optional[str] = ""):
    if not word or not word.strip():
        raise HTTPException(status_code=400, detail="Word cannot be empty")

    details = await asyncio.to_thread(lookup_word_details, word, context or "")
    if not details.get("word"):
        raise HTTPException(status_code=400, detail="Word cannot be empty")
    return details
