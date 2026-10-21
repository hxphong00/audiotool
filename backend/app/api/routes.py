import glob
import json
import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.api.range_streaming import stream_file_with_range
from app.services.pipeline import process_dialogue
from app.services.translation_service import translate_text

router = APIRouter()

STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "storage"))

class DialogueCreateRequest(BaseModel):
    title: Optional[str] = "English Conversation"
    script: str
    silence_sec: Optional[float] = 0.4

@router.get("/health")
async def health():
    return {"status": "ok"}

@router.post("/dialogue/create")
async def create_dialogue(req: DialogueCreateRequest, request: Request):
    if not req.script.strip():
        raise HTTPException(status_code=400, detail="Script cannot be empty")
        
    base_url = str(request.base_url).rstrip("/")
    try:
        data = await process_dialogue(
            script=req.script,
            title=req.title or "English Conversation",
            storage_dir=STORAGE_DIR,
            base_url=base_url,
            silence_sec=req.silence_sec or 0.4
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dialogue/{conversation_id}")
async def get_dialogue(conversation_id: str):
    json_path = os.path.join(STORAGE_DIR, f"{conversation_id}.json")
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/dialogue")
async def list_dialogues():
    json_files = glob.glob(os.path.join(STORAGE_DIR, "*.json"))
    dialogues = []
    for jf in json_files:
        try:
            with open(jf, "r", encoding="utf-8") as f:
                data = json.load(f)
                dialogues.append({
                    "conversation_id": data.get("conversation_id"),
                    "title": data.get("title"),
                    "total_duration": data.get("total_duration"),
                    "segments_count": len(data.get("segments", [])),
                    "audio_url": data.get("audio_url")
                })
        except Exception:
            continue
    return {"dialogues": dialogues}

@router.get("/audio/{conversation_id}/stream")
async def stream_dialogue_audio(conversation_id: str, request: Request):
    mp3_path = os.path.join(STORAGE_DIR, f"{conversation_id}.mp3")
    return stream_file_with_range(mp3_path, request, media_type="audio/mpeg")

@router.get("/dictionary/lookup")
async def lookup_word(word: str):
    clean_word = word.strip().strip(",.?!;:\'\"()[]{}")
    if not clean_word:
        raise HTTPException(status_code=400, detail="Word cannot be empty")
        
    meaning_vi = translate_text(clean_word, target="vi")
    return {
        "word": clean_word,
        "translation_vi": meaning_vi
    }
