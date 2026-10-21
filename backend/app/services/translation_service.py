import os
import re
from typing import Dict, Any, Optional
import httpx
from deep_translator import GoogleTranslator

GTX_URL = "https://translate.googleapis.com/translate_a/single"
FREE_DICT_URL = "https://api.dictionaryapi.dev/api/v2/entries/en"

POS_VI_MAP = {
    "noun": "Danh từ (noun)",
    "verb": "Động từ (verb)",
    "adjective": "Tính từ (adj)",
    "adverb": "Trạng từ (adv)",
    "pronoun": "Đại từ (pronoun)",
    "preposition": "Giới từ (prep)",
    "conjunction": "Liên từ (conj)",
    "interjection": "Thán từ (interj)",
    "exclamation": "Thán từ (excl)",
}


def clean_word_token(word: str) -> str:
    """Strips surrounding punctuation from a tapped word."""
    if not word:
        return ""
    cleaned = re.sub(r"^[^a-zA-Z0-9']+|[^a-zA-Z0-9']+$", "", word.strip())
    # Strip trailing possessive 's if present so dictionary lookup finds root word
    if cleaned.lower().endswith("'s") and len(cleaned) > 3:
        cleaned = cleaned[:-2]
    return cleaned


def translate_text(text: str, target: str = "vi") -> str:
    """
    Translates input text to target language (default Vietnamese).
    Uses Google GTX endpoint via httpx first (fast & immune to deep_translator's
    HTML scraping 429 block), then falls back to deep_translator if needed.
    """
    if not text or not text.strip():
        return ""
    clean_input = text.strip()

    # 1. Primary: Google Translate GTX JSON API
    try:
        resp = httpx.get(
            GTX_URL,
            params={
                "client": "gtx",
                "sl": "en",
                "tl": target,
                "dt": "t",
                "q": clean_input,
            },
            timeout=6.0,
        )
        if resp.status_code == 200:
            payload = resp.json()
            if isinstance(payload, list) and payload and isinstance(payload[0], list):
                translated_parts = [
                    part[0] for part in payload[0] if isinstance(part, list) and part and part[0]
                ]
                joined = "".join(translated_parts).strip()
                if joined:
                    return joined
    except Exception:
        pass

    # 2. Secondary fallback: deep_translator
    try:
        translated = GoogleTranslator(source="auto", target=target).translate(clean_input)
        if translated and translated.strip():
            return translated.strip()
    except Exception:
        pass

    return clean_input


def _fetch_dictionary_entry(clean_word: str) -> Dict[str, str]:
    """
    Queries Free Dictionary API (api.dictionaryapi.dev) for IPA phonetic,
    part of speech, English definition, and example sentence.
    """
    result = {
        "phonetic": "",
        "part_of_speech": "",
        "definition_en": "",
        "example_en": "",
    }
    if not clean_word:
        return result

    try:
        resp = httpx.get(f"{FREE_DICT_URL}/{clean_word.lower()}", timeout=5.0)
        if resp.status_code == 200:
            entries = resp.json()
            if isinstance(entries, list) and entries:
                entry = entries[0]
                phonetic = entry.get("phonetic") or ""
                if not phonetic:
                    for p in entry.get("phonetics", []):
                        if isinstance(p, dict) and p.get("text"):
                            phonetic = p["text"]
                            break
                result["phonetic"] = phonetic

                meanings = entry.get("meanings", [])
                if meanings and isinstance(meanings[0], dict):
                    raw_pos = str(meanings[0].get("partOfSpeech", "")).lower()
                    result["part_of_speech"] = POS_VI_MAP.get(raw_pos, raw_pos.capitalize())
                    defs = meanings[0].get("definitions", [])
                    if defs and isinstance(defs[0], dict):
                        result["definition_en"] = str(defs[0].get("definition", ""))
                        result["example_en"] = str(defs[0].get("example", ""))
    except Exception:
        pass

    return result


def _try_llm_contextual_explanation(
    word: str, context: str
) -> Optional[Dict[str, str]]:
    """
    Optional enrichment if GEMINI_API_KEY or OPENAI_API_KEY is configured in environment.
    """
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        try:
            prompt = (
                f"Giải thích ngắn gọn từ '{word}' trong câu '{context}'. "
                "Trả về đúng 1 dòng nghĩa tiếng Việt sát ngữ cảnh nhất."
            )
            resp = httpx.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}",
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=5.0,
            )
            if resp.status_code == 200:
                candidates = resp.json().get("candidates", [])
                if candidates:
                    note = candidates[0]["content"]["parts"][0]["text"].strip()
                    return {"context_note_vi": note}
        except Exception:
            pass
    return None


def lookup_word_details(word: str, context: str = "") -> Dict[str, Any]:
    """
    Performs full word lookup:
    - Clean word token
    - IPA phonetic & Part of Speech from Free Dictionary API
    - Vietnamese translation of the word and its English definition
    - Contextual sentence translation (and optional LLM note if API key is present)
    """
    clean = clean_word_token(word)
    if not clean:
        return {
            "word": "",
            "phonetic": "",
            "part_of_speech": "",
            "translation_vi": "",
            "definition_en": "",
            "definition_vi": "",
            "context_en": context or "",
            "context_vi": "",
        }

    dict_info = _fetch_dictionary_entry(clean)
    translation_vi = translate_text(clean, target="vi")
    definition_en = dict_info["definition_en"]
    definition_vi = translate_text(definition_en, target="vi") if definition_en else ""

    context_en = (context or dict_info["example_en"] or "").strip()
    context_vi = translate_text(context_en, target="vi") if context_en else ""

    # Fallback phonetic & POS if dictionary API didn't have the inflected form
    phonetic = dict_info["phonetic"] or f"/{clean.lower()}/"
    part_of_speech = dict_info["part_of_speech"] or "Từ vựng (word)"

    llm_extra = _try_llm_contextual_explanation(clean, context_en) if context_en else None
    if llm_extra and llm_extra.get("context_note_vi"):
        definition_vi = llm_extra["context_note_vi"]

    return {
        "word": clean,
        "phonetic": phonetic,
        "part_of_speech": part_of_speech,
        "translation_vi": translation_vi,
        "definition_en": definition_en,
        "definition_vi": definition_vi,
        "context_en": context_en,
        "context_vi": context_vi,
    }
