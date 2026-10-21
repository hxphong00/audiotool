import pytest
from app.services.translation_service import translate_text

def test_translate_text():
    # Translate a simple English phrase
    res = translate_text("Hello, how are you?")
    assert isinstance(res, str)
    assert len(res) > 0
