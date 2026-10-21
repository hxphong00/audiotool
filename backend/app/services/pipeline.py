import json
import os
import tempfile
import uuid
from typing import Dict, Any

from app.services.parser import parse_dialogue_script
from app.services.tts_service import generate_segment_tts, get_voice_for_speaker
from app.services.audio_stitcher import stitch_audio_files, calculate_cumulative_timestamps
from app.services.translation_service import translate_text

async def process_dialogue(
    script: str,
    title: str = "English Dialogue",
    storage_dir: str = "app/storage",
    base_url: str = "http://localhost:8000",
    silence_sec: float = 0.4
) -> Dict[str, Any]:
    """
    Complete end-to-end pipeline:
    1. Parse raw dialogue script.
    2. Synthesize audio per speaker with WordBoundary timestamps.
    3. Translate each segment to Vietnamese.
    4. Stitch all audio into a single MP3 stream with natural silence gaps.
    5. Calculate cumulative millisecond timestamps.
    6. Persist MP3 and JSON metadata.
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
    speakers_meta = {}
    
    with tempfile.TemporaryDirectory() as tmpdir:
        for idx, item in enumerate(raw_segments):
            speaker = item["speaker"]
            text = item["text"]
            voice = get_voice_for_speaker(speaker)
            
            if speaker not in speakers_meta:
                speakers_meta[speaker] = {
                    "name": speaker,
                    "voice": voice
                }
                
            seg_audio_tmp = os.path.join(tmpdir, f"seg_{idx}.mp3")
            tts_res = await generate_segment_tts(text, voice, seg_audio_tmp)
            temp_audio_files.append(seg_audio_tmp)
            
            text_vi = translate_text(text)
            
            intermediate_segments.append({
                "id": idx + 1,
                "speaker": speaker,
                "speaker_name": speaker,
                "duration": tts_res["duration"],
                "text_en": text,
                "text_vi": text_vi,
                "words": tts_res["words"]
            })
            
        # Stitch all segments into single MP3
        stitch_audio_files(
            temp_audio_files,
            final_audio_path,
            silence_sec=silence_sec
        )
        
    # Calculate cumulative offset timestamps
    final_segments, total_duration = calculate_cumulative_timestamps(
        intermediate_segments, silence_sec=silence_sec
    )
    
    # Strip internal 'duration' key from final output
    for seg in final_segments:
        seg.pop("duration", None)
        
    data = {
        "conversation_id": conversation_id,
        "title": title or "English Conversation",
        "total_duration": total_duration,
        "audio_url": f"{base_url}/static/{audio_filename}",
        "audio_stream_url": f"{base_url}/api/audio/{conversation_id}/stream",
        "offline_filename": audio_filename,
        "speakers": speakers_meta,
        "segments": final_segments,
        "local_audio_path": final_audio_path,
        "local_json_path": final_json_path
    }
    
    with open(final_json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    return data
