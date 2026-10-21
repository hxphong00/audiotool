import os
import re
import tempfile
import edge_tts
from typing import Dict, List, Optional

from app.services.audio_stitcher import get_audio_duration, trim_and_normalize_segment

MALE_VOICES = [
    "en-US-AndrewNeural",
    "en-US-BrianNeural",
]

FEMALE_VOICES = [
    "en-US-AvaNeural",
    "en-US-EmmaNeural",
]

DEFAULT_VOICE_POOL = [
    "en-US-AndrewNeural",  # Male
    "en-US-AvaNeural",     # Female
    "en-US-BrianNeural",   # Male
    "en-US-EmmaNeural",    # Female
]

MALE_NAME_HINTS = {
    "alex", "david", "john", "michael", "mike", "brian", "tom", "mark",
    "james", "robert", "bob", "paul", "kevin", "daniel", "dan", "chris",
    "steven", "steve", "peter", "jack", "sam", "ben", "waiter", "man",
    "boy", "father", "dad", "husband", "mr", "sir", "speaker a", "person a",
    "driver", "manager",
}

FEMALE_NAME_HINTS = {
    "sarah", "emily", "emma", "ava", "lisa", "anna", "mary", "jessica",
    "rachel", "laura", "amy", "sophia", "olivia", "chloe", "grace", "lily",
    "waitress", "woman", "girl", "mother", "mom", "wife", "ms", "mrs",
    "miss", "speaker b", "person b", "receptionist",
}

_speaker_voice_map: Dict[str, str] = {}


def detect_speaker_gender(speaker: str, fallback_index: int = 0) -> str:
    """
    Infers speaker gender ('male' or 'female') from speaker name or role hints.
    Falls back to alternating male/female by speaker index.
    """
    clean = speaker.strip().lower()
    first_token = re.sub(r"[^a-z]", "", clean.split()[0]) if clean else ""

    if clean in FEMALE_NAME_HINTS or first_token in FEMALE_NAME_HINTS:
        return "female"
    if clean in MALE_NAME_HINTS or first_token in MALE_NAME_HINTS:
        return "male"
    return "male" if fallback_index % 2 == 0 else "female"


def get_speaker_profile(
    speaker: str,
    session_map: Optional[Dict[str, Dict[str, str]]] = None,
) -> Dict[str, str]:
    """
    Assigns a consistent voice and gender profile for each speaker within a dialogue.
    """
    clean_key = speaker.strip().lower()
    if session_map is not None and clean_key in session_map:
        return session_map[clean_key]

    existing_count = len(session_map) if session_map is not None else len(_speaker_voice_map)
    gender = detect_speaker_gender(speaker, fallback_index=existing_count)

    used_voices = (
        {v["voice"] for v in session_map.values()}
        if session_map is not None
        else set(_speaker_voice_map.values())
    )
    pool = MALE_VOICES if gender == "male" else FEMALE_VOICES
    chosen_voice = next((v for v in pool if v not in used_voices), pool[existing_count % len(pool)])

    profile = {
        "name": speaker.strip(),
        "voice": chosen_voice,
        "gender": gender,
    }
    if session_map is not None:
        session_map[clean_key] = profile
    else:
        _speaker_voice_map[clean_key] = chosen_voice
    return profile


def get_voice_for_speaker(speaker: str) -> str:
    """
    Consistently assigns a distinct natural voice to each speaker in the dialogue.
    """
    clean_speaker = speaker.strip().lower()
    if clean_speaker not in _speaker_voice_map:
        profile = get_speaker_profile(speaker)
        _speaker_voice_map[clean_speaker] = profile["voice"]
    return _speaker_voice_map[clean_speaker]


def _normalize_word_token(token: str) -> str:
    return re.sub(r"[^a-z0-9]", "", token.lower())


def align_words_with_punctuation(text_en: str, raw_words: List[Dict]) -> List[Dict]:
    """
    Restores punctuation (commas, periods, question marks, exclamation marks, etc.)
    from the original text_en onto the raw WordBoundary tokens emitted by edge-tts.
    """
    if not raw_words:
        return []

    source_tokens = text_en.strip().split()
    if not source_tokens:
        return raw_words

    aligned: List[Dict] = []
    src_idx = 0

    for i, rw in enumerate(raw_words):
        raw_text = str(rw.get("word", ""))
        norm_raw = _normalize_word_token(raw_text)
        matched_word = raw_text

        # Look ahead a small window in source_tokens to find matching word with punctuation
        for lookahead in range(src_idx, min(src_idx + 3, len(source_tokens))):
            candidate = source_tokens[lookahead]
            norm_cand = _normalize_word_token(candidate)
            if norm_raw and (norm_cand == norm_raw or norm_Raw_in_cand(norm_raw, norm_cand)):
                matched_word = candidate
                src_idx = lookahead + 1
                break

        aligned.append({
            "word": matched_word,
            "start": rw.get("start", 0.0),
            "end": rw.get("end", 0.0),
        })

    # Ensure trailing punctuation on the very last word if source sentence ended with punctuation
    if aligned and source_tokens:
        last_src = source_tokens[-1]
        trailing_punct = re.search(r"([.,?!;:'\"…]+)$", last_src)
        if trailing_punct and not re.search(r"[.,?!;:'\"…]$", aligned[-1]["word"]):
            aligned[-1]["word"] = aligned[-1]["word"] + trailing_punct.group(1)

    return aligned


def norm_Raw_in_cand(norm_raw: str, norm_cand: str) -> bool:
    return bool(norm_raw and norm_cand and (norm_cand.startswith(norm_raw) or norm_raw.startswith(norm_cand)))


async def generate_segment_tts(
    text: str, voice: str, output_path: str
) -> Dict:
    """
    Generates a normalized 24kHz mono MP3 file for a single text segment using edge-tts,
    extracting millisecond WordBoundary timestamps with punctuation restored and measuring
    the exact MP3 duration.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        boundary="WordBoundary",
    )

    raw_words: List[Dict] = []
    audio_data = bytearray()

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            w_text = chunk["text"]
            start_sec = round(chunk["offset"] / 10_000_000, 3)
            end_sec = round((chunk["offset"] + chunk["duration"]) / 10_000_000, 3)
            raw_words.append({
                "word": w_text,
                "start": start_sec,
                "end": end_sec,
            })

    words = align_words_with_punctuation(text, raw_words)

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_raw:
        tmp_raw_path = tmp_raw.name
        tmp_raw.write(audio_data)

    try:
        target_trim = round(words[-1]["end"] + 0.14, 3) if words else None
        exact_duration = trim_and_normalize_segment(
            tmp_raw_path, output_path, max_duration=target_trim
        )
        if exact_duration <= 0:
            exact_duration = get_audio_duration(output_path) or (target_trim or 0.0)
    finally:
        if os.path.exists(tmp_raw_path):
            os.remove(tmp_raw_path)

    return {
        "audio_path": output_path,
        "duration": round(exact_duration, 3),
        "words": words,
    }
