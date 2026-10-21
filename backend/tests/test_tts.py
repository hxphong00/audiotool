import pytest
import os
from app.services.tts_service import generate_segment_tts, get_voice_for_speaker

def test_get_voice_for_speaker():
    v1 = get_voice_for_speaker("Alex")
    v2 = get_voice_for_speaker("Sarah")
    assert isinstance(v1, str)
    assert isinstance(v2, str)
    assert v1 != v2

@pytest.mark.asyncio
async def test_generate_segment_tts(tmp_path):
    output_mp3 = os.path.join(tmp_path, "test.mp3")
    result = await generate_segment_tts("Hello world", "en-US-AndrewNeural", output_mp3)
    assert os.path.exists(output_mp3)
    assert os.path.getsize(output_mp3) > 0
    assert result["duration"] > 0
    assert len(result["words"]) >= 2
    assert result["words"][0]["word"] == "Hello"
