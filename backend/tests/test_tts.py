import pytest
import os
from app.services.tts_service import (
    generate_segment_tts,
    get_voice_for_speaker,
    get_speaker_profile,
    align_words_with_punctuation,
)
from app.services.audio_stitcher import get_audio_duration


def test_get_speaker_profile_and_gender():
    state = {}
    p_alex = get_speaker_profile("Alex", state)
    p_sarah = get_speaker_profile("Sarah", state)
    assert p_alex["gender"] == "male"
    assert p_sarah["gender"] == "female"
    assert p_alex["voice"] != p_sarah["voice"]


def test_get_speaker_profile_multi_country_accents():
    uk_state = {}
    uk_alex = get_speaker_profile("Alex", uk_state, accent="uk")
    uk_sarah = get_speaker_profile("Sarah", uk_state, accent="uk")
    assert uk_alex["voice"] == "en-GB-RyanNeural"
    assert uk_sarah["voice"] == "en-GB-SoniaNeural"

    au_state = {}
    au_alex = get_speaker_profile("Alex", au_state, accent="au")
    au_sarah = get_speaker_profile("Sarah", au_state, accent="au")
    assert au_alex["voice"] == "en-AU-WilliamNeural"
    assert au_sarah["voice"] == "en-AU-NatashaNeural"

    ca_state = {}
    ca_alex = get_speaker_profile("Alex", ca_state, accent="ca")
    assert ca_alex["voice"] == "en-CA-LiamNeural"


def test_align_words_with_punctuation():
    raw_words = [
        {"word": "Hey", "start": 0.0, "end": 0.3},
        {"word": "Sarah", "start": 0.35, "end": 0.8},
        {"word": "how", "start": 0.9, "end": 1.1},
        {"word": "are", "start": 1.15, "end": 1.3},
        {"word": "you", "start": 1.35, "end": 1.5},
        {"word": "doing", "start": 1.55, "end": 1.8},
        {"word": "today", "start": 1.85, "end": 2.2},
    ]
    text_en = "Hey Sarah, how are you doing today?"
    aligned = align_words_with_punctuation(text_en, raw_words)
    assert [w["word"] for w in aligned] == [
        "Hey",
        "Sarah,",
        "how",
        "are",
        "you",
        "doing",
        "today?",
    ]


@pytest.mark.asyncio
async def test_generate_segment_tts_restores_punctuation_and_matches_duration(tmp_path):
    output_mp3 = os.path.join(tmp_path, "test.mp3")
    result = await generate_segment_tts(
        "Hello Sarah, ready to go?", "en-US-AndrewNeural", output_mp3
    )
    assert os.path.exists(output_mp3)
    assert os.path.getsize(output_mp3) > 0
    assert result["duration"] > 0
    actual_file_dur = get_audio_duration(output_mp3)
    # Segment duration must closely match actual MP3 file duration (<0.08s diff)
    assert abs(result["duration"] - actual_file_dur) < 0.08
    # Check punctuation preserved in words
    words_list = [w["word"] for w in result["words"]]
    assert any("," in w for w in words_list)
    assert words_list[-1].endswith("?")
