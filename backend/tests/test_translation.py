import pytest
from app.services.translation_service import translate_text, lookup_word_details


def test_translate_text_returns_real_vietnamese():
    source = "Good morning Sarah, how is the traffic looking today?"
    res = translate_text(source, target="vi")
    assert isinstance(res, str)
    assert len(res) > 0
    # Must actually translate to Vietnamese, not fall back to the identical English sentence
    assert res.strip().lower() != source.strip().lower()


def test_lookup_word_details_includes_ipa_pos_and_context():
    details = lookup_word_details(
        "highway,",
        context="The highway traffic is moving at a snail's pace.",
    )
    assert details["word"] == "highway"
    assert isinstance(details["translation_vi"], str)
    assert len(details["translation_vi"]) > 0
    assert details["translation_vi"].lower() != "highway"
    assert "phonetic" in details
    assert len(details["phonetic"]) > 0
    assert "part_of_speech" in details
    assert len(details["part_of_speech"]) > 0
    assert details["context_en"] == "The highway traffic is moving at a snail's pace."
    assert len(details["context_vi"]) > 0
