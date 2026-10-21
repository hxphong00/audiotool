import os
import shutil
import subprocess
import tempfile
from typing import List, Dict, Tuple

def get_ffmpeg_binary() -> str:
    """Finds ffmpeg executable path."""
    local_bin = os.path.expanduser("~/.local/bin/ffmpeg")
    if os.path.isfile(local_bin) and os.access(local_bin, os.X_OK):
        return local_bin
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg
    return "ffmpeg"

def calculate_cumulative_timestamps(
    segments: List[Dict], silence_sec: float = 0.4
) -> Tuple[List[Dict], float]:
    """
    Computes absolute cumulative start and end times for segments and individual words,
    accounting for silence intervals inserted between consecutive segments.
    """
    current_offset = 0.0
    updated_segments = []
    
    for i, seg in enumerate(segments):
        duration = float(seg.get("duration", 0.0))
        seg_start = round(current_offset, 3)
        seg_end = round(current_offset + duration, 3)
        
        updated_words = []
        for w in seg.get("words", []):
            w_start = round(current_offset + float(w.get("start", 0.0)), 3)
            w_end = round(current_offset + float(w.get("end", 0.0)), 3)
            updated_words.append({
                "word": w.get("word", ""),
                "start": w_start,
                "end": w_end
            })
            
        new_seg = dict(seg)
        new_seg["start"] = seg_start
        new_seg["end"] = seg_end
        new_seg["words"] = updated_words
        updated_segments.append(new_seg)
        
        current_offset = seg_end
        if i < len(segments) - 1:
            current_offset += silence_sec
            
    total_duration = round(current_offset, 3) if segments else 0.0
    return updated_segments, total_duration

def create_silence_mp3(duration_sec: float, output_path: str, ffmpeg_bin: str = None) -> None:
    """Generates an MP3 containing silence of specified duration."""
    ffmpeg = ffmpeg_bin or get_ffmpeg_binary()
    cmd = [
        ffmpeg,
        "-y",
        "-f", "lavfi",
        "-i", f"anullsrc=r=44100:cl=mono",
        "-t", str(duration_sec),
        "-q:a", "9",
        "-acodec", "libmp3lame",
        output_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def stitch_audio_files(
    segment_audio_paths: List[str],
    output_mp3_path: str,
    silence_sec: float = 0.4,
    ffmpeg_bin: str = None
) -> None:
    """
    Concatenates multiple audio segment files into a single MP3 stream,
    inserting silence_sec gap between segments.
    """
    ffmpeg = ffmpeg_bin or get_ffmpeg_binary()
    os.makedirs(os.path.dirname(os.path.abspath(output_mp3_path)), exist_ok=True)
    
    if not segment_audio_paths:
        raise ValueError("No audio segments to stitch")
        
    if len(segment_audio_paths) == 1 and silence_sec == 0:
        shutil.copy(segment_audio_paths[0], output_mp3_path)
        return

    with tempfile.TemporaryDirectory() as tmpdir:
        silence_file = os.path.join(tmpdir, "silence.mp3")
        create_silence_mp3(silence_sec, silence_file, ffmpeg)
        
        concat_list_file = os.path.join(tmpdir, "concat.txt")
        with open(concat_list_file, "w", encoding="utf-8") as f:
            for i, audio_path in enumerate(segment_audio_paths):
                abs_audio = os.path.abspath(audio_path)
                f.write(f"file '{abs_audio}'\n")
                if i < len(segment_audio_paths) - 1 and silence_sec > 0:
                    f.write(f"file '{silence_file}'\n")
                    
        cmd = [
            ffmpeg,
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_list_file,
            "-c:a", "libmp3lame",
            "-q:a", "4",
            output_mp3_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
