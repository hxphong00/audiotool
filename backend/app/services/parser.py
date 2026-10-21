import re
from typing import List, Dict

def parse_dialogue_script(script: str) -> List[Dict[str, str]]:
    """
    Parses dialogue script with lines in format:
    Speaker: Speech content
    """
    lines = script.strip().split("\n")
    segments = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        match = re.match(r"^([^:]+):\s*(.*)$", line)
        if match:
            speaker = match.group(1).strip()
            text = match.group(2).strip()
            if text:
                segments.append({
                    "speaker": speaker,
                    "text": text
                })
        else:
            # If line doesn't have speaker prefix, append to last or default
            if segments:
                segments[-1]["text"] += " " + line
            else:
                segments.append({
                    "speaker": "Speaker",
                    "text": line
                })
                
    return segments
