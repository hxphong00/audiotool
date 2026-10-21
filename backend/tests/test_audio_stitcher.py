import pytest
from app.services.audio_stitcher import calculate_cumulative_timestamps

def test_calculate_cumulative_timestamps():
    segments = [
        {
            "id": 1,
            "speaker": "Alex",
            "duration": 2.0,
            "words": [
                {"word": "Hello", "start": 0.0, "end": 0.8},
                {"word": "there", "start": 0.9, "end": 1.9}
            ]
        },
        {
            "id": 2,
            "speaker": "Sarah",
            "duration": 3.0,
            "words": [
                {"word": "Hi", "start": 0.0, "end": 0.5},
                {"word": "Alex", "start": 0.6, "end": 1.2}
            ]
        }
    ]
    
    updated_segments, total_duration = calculate_cumulative_timestamps(segments, silence_sec=0.4)
    
    # Segment 1 starts at 0.0, ends at 2.0
    assert updated_segments[0]["start"] == 0.0
    assert updated_segments[0]["end"] == 2.0
    assert updated_segments[0]["words"][0]["start"] == 0.0
    assert updated_segments[0]["words"][0]["end"] == 0.8
    assert updated_segments[0]["words"][1]["start"] == 0.9
    assert updated_segments[0]["words"][1]["end"] == 1.9
    
    # Segment 2 starts after 2.0 + 0.4 = 2.4
    assert updated_segments[1]["start"] == 2.4
    assert updated_segments[1]["end"] == 5.4
    assert updated_segments[1]["words"][0]["start"] == 2.4
    assert updated_segments[1]["words"][0]["end"] == 2.9
    assert updated_segments[1]["words"][1]["start"] == 3.0
    assert updated_segments[1]["words"][1]["end"] == 3.6
    
    assert total_duration == 5.4

def test_create_silence_and_stitch(tmp_path):
    from app.services.audio_stitcher import create_silence_mp3, stitch_audio_files
    import os
    
    silence1 = os.path.join(tmp_path, "seg1.mp3")
    silence2 = os.path.join(tmp_path, "seg2.mp3")
    output = os.path.join(tmp_path, "merged.mp3")
    
    create_silence_mp3(0.5, silence1)
    create_silence_mp3(0.5, silence2)
    assert os.path.exists(silence1)
    assert os.path.getsize(silence1) > 0
    
    stitch_audio_files([silence1, silence2], output, silence_sec=0.2)
    assert os.path.exists(output)
    assert os.path.getsize(output) > 0
