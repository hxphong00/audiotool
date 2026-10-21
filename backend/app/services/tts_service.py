import os
import edge_tts
from typing import Dict, List

DEFAULT_VOICE_POOL = [
    "en-US-AndrewNeural",  # Male
    "en-US-AvaNeural",     # Female
    "en-US-BrianNeural",   # Male
    "en-US-EmmaNeural",    # Female
]

_speaker_voice_map: Dict[str, str] = {}

def get_voice_for_speaker(speaker: str) -> str:
    """
    Consistently assigns a distinct natural voice to each speaker in the dialogue.
    """
    clean_speaker = speaker.strip().lower()
    if clean_speaker not in _speaker_voice_map:
        idx = len(_speaker_voice_map) % len(DEFAULT_VOICE_POOL)
        _speaker_voice_map[clean_speaker] = DEFAULT_VOICE_POOL[idx]
    return _speaker_voice_map[clean_speaker]

async def generate_segment_tts(
    text: str, voice: str, output_path: str
) -> Dict:
    """
    Generates an MP3 file for a single text segment using edge-tts,
    extracting precise millisecond WordBoundary timestamps.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        boundary="WordBoundary"
    )
    
    words: List[Dict] = []
    audio_data = bytearray()
    
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            w_text = chunk["text"]
            start_sec = round(chunk["offset"] / 10_000_000, 3)
            end_sec = round((chunk["offset"] + chunk["duration"]) / 10_000_000, 3)
            words.append({
                "word": w_text,
                "start": start_sec,
                "end": end_sec
            })
            
    with open(output_path, "wb") as f:
        f.write(audio_data)
        
    duration = words[-1]["end"] if words else 0.0
    # Add a slight tail margin (0.15s) so the last syllable isn't cut off
    if duration > 0:
        duration = round(duration + 0.15, 3)
        
    return {
        "audio_path": output_path,
        "duration": duration,
        "words": words
    }
