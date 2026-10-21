import pytest
import os
from app.services.pipeline import process_dialogue

@pytest.mark.asyncio
async def test_process_dialogue(tmp_path):
    script = """
    Alex: Good morning!
    Sarah: Hello Alex, ready to go?
    """
    storage_dir = str(tmp_path)
    result = await process_dialogue(
        script=script,
        title="Test Commute",
        storage_dir=storage_dir,
        base_url="http://localhost:8000"
    )
    
    assert "conversation_id" in result
    assert result["title"] == "Test Commute"
    assert result["total_duration"] > 0
    assert len(result["segments"]) == 2
    assert os.path.exists(result["local_audio_path"])
    assert os.path.exists(result["local_json_path"])
    
    # Check words and translations
    assert len(result["segments"][0]["words"]) >= 2
    assert len(result["segments"][0]["text_vi"]) > 0
    assert result["segments"][1]["start"] > result["segments"][0]["end"]
