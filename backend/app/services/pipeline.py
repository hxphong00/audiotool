import asyncio
import json
import os
import tempfile
import uuid
from datetime import datetime, timezone
from typing import Dict, Any

from app.services.parser import parse_dialogue_script
from app.services.tts_service import generate_segment_tts, get_speaker_profile
from app.services.audio_stitcher import stitch_audio_files, calculate_cumulative_timestamps
from app.services.translation_service import translate_text


async def process_dialogue(
    script: str,
    title: str = "English Dialogue",
    storage_dir: str = "app/storage",
    base_url: str = "http://localhost:8000",
    silence_sec: float = 0.4,
) -> Dict[str, Any]:
    """
    Complete end-to-end pipeline:
    1. Parse raw dialogue script.
    2. Assign gender-aware voices per speaker and synthesize audio with WordBoundary timestamps.
    3. Translate each segment to Vietnamese asynchronously.
    4. Stitch all audio into a single 24kHz mono MP3 stream with natural 400ms silence gaps.
    5. Calculate exact cumulative timestamps matching the final MP3.
    6. Persist MP3 and JSON metadata (without leaking server filesystem paths).
    """
    os.makedirs(storage_dir, exist_ok=True)
    raw_segments = parse_dialogue_script(script)
    if not raw_segments:
        raise ValueError("Script contains no valid dialogue lines")

    conversation_id = f"conv_{uuid.uuid4().hex[:10]}"
    audio_filename = f"{conversation_id}.mp3"
    json_filename = f"{conversation_id}.json"

    final_audio_path = os.path.join(storage_dir, audio_filename)
    final_json_path = os.path.join(storage_dir, json_filename)

    temp_audio_files = []
    intermediate_segments = []
    speakers_meta: Dict[str, Dict[str, str]] = {}
    session_voice_map: Dict[str, Dict[str, str]] = {}

    with tempfile.TemporaryDirectory() as tmpdir:
        for idx, item in enumerate(raw_segments):
            speaker = item["speaker"]
            text = item["text"]
            profile = get_speaker_profile(speaker, session_voice_map)
            voice = profile["voice"]

            if speaker not in speakers_meta:
                speakers_meta[speaker] = {
                    "name": speaker,
                    "voice": voice,
                    "gender": profile["gender"],
                }

            seg_audio_tmp = os.path.join(tmpdir, f"seg_{idx}.mp3")
            tts_res = await generate_segment_tts(text, voice, seg_audio_tmp)
            temp_audio_files.append(seg_audio_tmp)

            text_vi = await asyncio.to_thread(translate_text, text, "vi")

            intermediate_segments.append({
                "id": idx + 1,
                "speaker": speaker,
                "speaker_name": speaker,
                "duration": tts_res["duration"],
                "text_en": text,
                "text_vi": text_vi,
                "words": tts_res["words"],
            })

        # Stitch all segments into single 24kHz mono MP3 in thread pool
        stitched_mp3_duration = await asyncio.to_thread(
            stitch_audio_files,
            temp_audio_files,
            final_audio_path,
            silence_sec,
        )

    # Calculate cumulative offset timestamps
    final_segments, calculated_duration = calculate_cumulative_timestamps(
        intermediate_segments, silence_sec=silence_sec
    )

    total_duration = round(stitched_mp3_duration or calculated_duration, 3)

    # Strip internal 'duration' key from final output
    for seg in final_segments:
        seg.pop("duration", None)

    clean_base = base_url.rstrip("/")
    data = {
        "conversation_id": conversation_id,
        "title": title or "English Conversation",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "total_duration": total_duration,
        "audio_url": f"{clean_base}/static/{audio_filename}",
        "audio_stream_url": f"{clean_base}/api/audio/{conversation_id}/stream",
        "offline_filename": audio_filename,
        "speakers": speakers_meta,
        "segments": final_segments,
    }

    with open(final_json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return data
