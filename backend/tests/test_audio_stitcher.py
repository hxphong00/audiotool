import os
import pytest
from app.services.audio_stitcher import (
    calculate_cumulative_timestamps,
    create_silence_mp3,
    stitch_audio_files,
    get_audio_duration,
)


def test_calculate_cumulative_timestamps():
    segments = [
        {
            "id": 1,
            "speaker": "Alex",
            "duration": 2.0,
            "words": [
                {"word": "Hello,", "start": 0.0, "end": 0.8},
                {"word": "there!", "start": 0.9, "end": 1.9},
            ],
        },
        {
            "id": 2,
            "speaker": "Sarah",
            "duration": 3.0,
            "words": [
                {"word": "Hi", "start": 0.0, "end": 0.5},
                {"word": "Alex.", "start": 0.6, "end": 1.2},
            ],
        },
    ]

    updated_segments, total_duration = calculate_cumulative_timestamps(
        segments, silence_sec=0.4
    )

    assert updated_segments[0]["start"] == 0.0
    assert updated_segments[0]["end"] == 2.0
    assert updated_segments[1]["start"] == 2.4
    assert updated_segments[1]["end"] == 5.4
    assert total_duration == 5.4


def test_create_silence_stitch_and_measure_exact_duration(tmp_path):
    silence1 = os.path.join(tmp_path, "seg1.mp3")
    silence2 = os.path.join(tmp_path, "seg2.mp3")
    output = os.path.join(tmp_path, "merged.mp3")

    create_silence_mp3(1.0, silence1)
    create_silence_mp3(1.5, silence2)
    d1 = get_audio_duration(silence1)
    d2 = get_audio_duration(silence2)
    assert abs(d1 - 1.0) < 0.08
    assert abs(d2 - 1.5) < 0.08

    stitch_audio_files([silence1, silence2], output, silence_sec=0.4)
    merged_dur = get_audio_duration(output)
    expected_dur = d1 + d2 + 0.4
    assert abs(merged_dur - expected_dur) < 0.08
