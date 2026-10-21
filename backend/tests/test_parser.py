import pytest
from app.services.parser import parse_dialogue_script

def test_parse_dialogue_script_valid():
    script = """
    Alex: Hey Sarah, are you caught in traffic?
    Sarah: Yes, absolutely! The highway is packed.
    """
    segments = parse_dialogue_script(script)
    assert len(segments) == 2
    assert segments[0]["speaker"] == "Alex"
    assert segments[0]["text"] == "Hey Sarah, are you caught in traffic?"
    assert segments[1]["speaker"] == "Sarah"
    assert segments[1]["text"] == "Yes, absolutely! The highway is packed."

def test_parse_dialogue_script_ignores_empty_lines():
    script = """
    
    Alex: First line.
    
    Sarah: Second line.
    
    """
    segments = parse_dialogue_script(script)
    assert len(segments) == 2
