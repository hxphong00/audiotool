from deep_translator import GoogleTranslator

def translate_text(text: str, target: str = "vi") -> str:
    """
    Translates input text to target language (default Vietnamese).
    Falls back to original text if translation fails.
    """
    if not text or not text.strip():
        return ""
    try:
        translated = GoogleTranslator(source="auto", target=target).translate(text)
        return translated or text
    except Exception as e:
        # Fallback to original text on connection error
        return text
