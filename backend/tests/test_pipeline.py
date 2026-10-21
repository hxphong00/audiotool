import pytest
import os
from app.services.pipeline import process_dialogue
from app.services.audio_stitcher import get_audio_duration


@pytest.mark.asyncio
async def test_process_dialogue_schema_and_zero_drift(tmp_path):
    script = """
    Alex: Good morning, Sarah!
    Sarah: Hello Alex, ready to go?
    """
    storage_dir = str(tmp_path)
    result = await process_dialogue(
        script=script,
        title="Test Commute",
        storage_dir=storage_dir,
        base_url="http://192.168.1.220:8000",
    )

    assert "conversation_id" in result
    assert result["title"] == "Test Commute"
    assert result["total_duration"] > 0
    assert len(result["segments"]) == 2

    # Must NOT leak internal server filesystem paths in returned/saved JSON
    assert "local_audio_path" not in result
    assert "local_json_path" not in result

    # Speakers must include gender
    assert result["speakers"]["Alex"]["gender"] == "male"
    assert result["speakers"]["Sarah"]["gender"] == "female"

    # Vietnamese translation must not equal English text
    assert result["segments"][0]["text_vi"] != result["segments"][0]["text_en"]

    # Words must preserve punctuation
    first_words = [w["word"] for w in result["segments"][0]["words"]]
    assert any("," in w for w in first_words)
    assert first_words[-1].endswith("!")

    # Verify MP3 file exists and total_duration matches actual MP3 length (<0.1s drift)
    mp3_path = os.path.join(storage_dir, result["offline_filename"])
    assert os.path.exists(mp3_path)
    actual_mp3_dur = get_audio_duration(mp3_path)
    assert abs(result["total_duration"] - actual_mp3_dur) < 0.1
