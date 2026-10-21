import os
import re
from typing import Dict, List, Tuple
import httpx

from app.services.translation_service import translate_text


CURATED_TOPIC_TEMPLATES: List[Tuple[List[str], str, List[str]]] = [
    (
        ["starbucks", "coffee", "cà phê", "cafe", "tra sua", "trà sữa", "đồ uống"],
        "Ordering Coffee at Starbucks",
        [
            "Alex: Hi there! Welcome to Starbucks, what can I get started for you today?",
            "Sarah: Good morning! Could I please get a grande iced caramel macchiato with oat milk?",
            "Alex: Sure thing! Would you like that less sweet or with regular caramel drizzle?",
            "Sarah: Half sweet, please, and no whipped cream on top.",
            "Alex: Got it, a grande iced half-sweet caramel macchiato with oat milk. Anything to eat?",
            "Sarah: Yes, could you warm up a blueberry muffin for me as well?",
            "Alex: Absolutely! Can I get a name for your cup?",
            "Sarah: It is Sarah, S-A-R-A-H. Can I pay with Apple Pay?",
            "Alex: Of course, just tap your phone right here on the reader. Your total is nine fifty.",
            "Sarah: Awesome, thank you so much! Where do I pick up my drink?",
            "Alex: Right down at the end of the counter. We will call your name in just two minutes!",
        ],
    ),
    (
        ["phỏng vấn", "xin việc", "interview", "job", "tuyển dụng", "cv", "resume"],
        "Job Interview for Software Engineer",
        [
            "Sarah: Good morning Alex, thank you for coming in today. How was your commute?",
            "Alex: Good morning Sarah! The traffic was a bit busy, but I left early so it was smooth.",
            "Sarah: Great to hear. To start off, could you tell me a little bit about your background?",
            "Alex: Certainly! Over the past four years, I have been building mobile and backend applications.",
            "Sarah: That aligns well with our team. What attracted you to this position at our company?",
            "Alex: I really admire your focus on user experience and high-performance mobile engineering.",
            "Sarah: Can you share a challenging technical problem you solved recently?",
            "Alex: Sure, we had an audio synchronization drift issue on iOS, and I fixed it using FFmpeg normalization.",
            "Sarah: Impressive! How do you usually handle tight deadlines when requirements change?",
            "Alex: I prioritize core features first, communicate early with stakeholders, and write automated tests.",
            "Sarah: Thank you Alex, those are great answers. Do you have any questions for me about the team?",
        ],
    ),
    (
        ["cảnh sát", "giao thông", "police", "traffic stop", "tốc độ", "bằng lái", "ticket", "speeding"],
        "Talking to a Traffic Police Officer",
        [
            "Alex: Good afternoon ma'am. Do you know why I pulled you over today?",
            "Sarah: Good afternoon officer. I am not completely sure, was I driving a little too fast?",
            "Alex: You were going forty-five in a thirty mile per hour school zone.",
            "Sarah: Oh no, I am so sorry officer! I am new to this neighborhood and missed the sign.",
            "Alex: May I see your driver's license, vehicle registration, and proof of insurance, please?",
            "Sarah: Yes, of course. They are right here in my glove compartment, let me grab them slowly.",
            "Alex: Thank you. Are you still living at the address listed on this driver's license?",
            "Sarah: Yes officer, that is my current address, and this is a rental car for my business trip.",
            "Alex: Alright, since your driving record is completely clean, I am only giving you a warning today.",
            "Sarah: Thank you so much officer! I will pay much closer attention to the speed limit signs.",
        ],
    ),
    (
        ["khách sạn", "hotel", "check-in", "check in", "đặt phòng", "room", "resort"],
        "Hotel Check-in & Room Upgrade",
        [
            "Sarah: Good evening! Welcome to the Grand Horizon Hotel. How may I assist you?",
            "Alex: Good evening! I have a reservation under the name Alex Nguyen for three nights.",
            "Sarah: Let me pull that up for you. Yes, a deluxe queen room with breakfast included.",
            "Alex: That is right. By any chance, do you have a room on a high floor with a city view?",
            "Sarah: Let me check our availability. Good news, I can upgrade you to the fifteenth floor at no extra charge!",
            "Alex: That sounds wonderful, thank you! What time is breakfast served in the morning?",
            "Sarah: Breakfast runs from six thirty to ten o'clock in the dining lounge on the second floor.",
            "Alex: Great! Could I also request a late check-out on Sunday afternoon?",
            "Sarah: Certainly, I have extended your check-out time to two p.m. Here are your two keycards.",
            "Alex: Thank you so much for your help! Where are the elevators located?",
        ],
    ),
    (
        ["sân bay", "airport", "máy bay", "flight", "hải quan", "customs", "boarding", "hành lý"],
        "Airport Check-in & Immigration",
        [
            "Sarah: Good morning! Where are you flying to today, sir?",
            "Alex: Good morning! I am flying to San Francisco on flight UA890.",
            "Sarah: May I see your passport and booking confirmation, please?",
            "Alex: Here you go. Would it be possible to get an aisle seat near the front of the cabin?",
            "Sarah: Yes, seat 14C is still open. Are you checking any bags today?",
            "Alex: Just this one suitcase, and I will bring my backpack as a carry-on.",
            "Sarah: Please place your suitcase on the scale. Everything looks good, it is under twenty-three kilos.",
            "Alex: Awesome! Has the boarding gate been announced yet?",
            "Sarah: Yes, you will be boarding at Gate B12 at ten forty-five. Here is your boarding pass.",
            "Alex: Thank you very much! Have a great day.",
        ],
    ),
    (
        ["nhà hàng", "ăn tối", "restaurant", "dinner", "gọi món", "menu", "steak"],
        "Ordering Dinner at a Restaurant",
        [
            "Sarah: Good evening! Welcome to Olive Bistro. Table for two tonight?",
            "Alex: Yes please, could we sit near the window if there is a table available?",
            "Sarah: Right this way! Here are your menus. Can I start you off with something to drink?",
            "Alex: Could I have a glass of sparkling water with lemon, please?",
            "Sarah: Of course! Are you ready to order your main course, or do you need a few more minutes?",
            "Alex: I think I am ready. What do you recommend between the grilled salmon and the ribeye steak?",
            "Sarah: Our ribeye steak is very popular tonight, served with roasted garlic potatoes.",
            "Alex: That sounds delicious! I will have the ribeye steak cooked medium rare, please.",
            "Sarah: Excellent choice. Would you like a side salad or mushroom soup to start?",
            "Alex: The mushroom soup sounds great, thank you!",
        ],
    ),
]


def _clean_dialogue_lines(raw_text: str, target_lines: int = 10) -> List[str]:
    lines: List[str] = []
    for raw in raw_text.splitlines():
        line = raw.strip()
        line = re.sub(r"^[\-\*\d\.\)\s]+", "", line).strip()
        if ":" not in line:
            continue
        speaker, text = line.split(":", 1)
        speaker = re.sub(r"[\*\_`]", "", speaker).strip()
        text = re.sub(r"[\*\_`]", "", text).strip()
        if speaker and text and len(text.split()) >= 2:
            lines.append(f"{speaker}: {text}")
    return lines[: max(8, min(14, target_lines + 2))]


def _generate_via_gemini(topic: str, num_lines: int, api_key: str) -> Dict[str, str]:
    prompt = (
        f"Write a natural, practical English conversation between Alex and Sarah about: '{topic}'. "
        f"Requirements:\n"
        f"- Exactly {num_lines} lines alternating between 'Alex:' and 'Sarah:'.\n"
        f"- Practical everyday spoken English suitable for commuting audio practice.\n"
        f"- Output ONLY the dialogue lines in format 'Alex: ...' and 'Sarah: ...', no markdown or intro."
    )
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    resp = httpx.post(
        url,
        json={"contents": [{"parts": [{"text": prompt}]}]},
        timeout=12.0,
    )
    resp.raise_for_status()
    data = resp.json()
    text = (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
    )
    lines = _clean_dialogue_lines(text, num_lines)
    if len(lines) < 6:
        raise ValueError("Gemini output did not contain enough valid dialogue lines")
    en_title = translate_text(topic, "en") or topic
    return {
        "title": en_title.title()[:60],
        "script": "\n".join(lines),
        "provider": "gemini",
    }


def _generate_via_openai(topic: str, num_lines: int, api_key: str) -> Dict[str, str]:
    prompt = (
        f"Write a natural {num_lines}-line English dialogue between Alex and Sarah about: '{topic}'. "
        f"Format each line strictly as 'Alex: ...' or 'Sarah: ...'. Do not include any extra text."
    )
    resp = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
        },
        timeout=12.0,
    )
    resp.raise_for_status()
    text = resp.json()["choices"][0]["message"]["content"]
    lines = _clean_dialogue_lines(text, num_lines)
    if len(lines) < 6:
        raise ValueError("OpenAI output did not contain enough valid dialogue lines")
    en_title = translate_text(topic, "en") or topic
    return {
        "title": en_title.title()[:60],
        "script": "\n".join(lines),
        "provider": "openai",
    }


def _generate_via_ollama(topic: str, num_lines: int) -> Dict[str, str]:
    base_url = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
    model = os.environ.get("OLLAMA_MODEL", "llama3.2")
    prompt = (
        f"Write a {num_lines}-line realistic English dialogue between Alex and Sarah about: '{topic}'. "
        f"Output only lines starting with 'Alex:' or 'Sarah:'."
    )
    resp = httpx.post(
        f"{base_url}/api/generate",
        json={"model": model, "prompt": prompt, "stream": False},
        timeout=2.5,
    )
    resp.raise_for_status()
    text = resp.json().get("response", "")
    lines = _clean_dialogue_lines(text, num_lines)
    if len(lines) < 6:
        raise ValueError("Ollama output too short")
    en_title = translate_text(topic, "en") or topic
    return {
        "title": en_title.title()[:60],
        "script": "\n".join(lines),
        "provider": "ollama",
    }


def _generate_smart_builtin_dialogue(topic: str, num_lines: int = 10) -> Dict[str, str]:
    clean_topic = topic.strip()
    lower_topic = clean_topic.lower()
    clamped_lines = max(8, min(12, num_lines))

    # 1. Check curated high-quality scenario templates first
    for keywords, title, template_lines in CURATED_TOPIC_TEMPLATES:
        if any(kw in lower_topic for kw in keywords):
            selected = template_lines[:clamped_lines]
            return {
                "title": title,
                "script": "\n".join(selected),
                "provider": "smart-ai-template",
            }

    # 2. Translate Vietnamese or custom topic into natural English topic phrase
    english_topic = translate_text(clean_topic, "en") or clean_topic
    english_topic = re.sub(r"[.?!]+$", "", english_topic).strip()
    short_topic = english_topic.lower()

    dynamic_lines = [
        f"Alex: Hey Sarah, have you had a chance to look into {short_topic} yet?",
        f"Sarah: Hi Alex! Yes, I was actually just preparing some notes about {short_topic} this morning.",
        f"Alex: Awesome! What do you think is the most important thing we should focus on first?",
        f"Sarah: Honestly, getting the practical details right early on will save us a lot of time.",
        f"Alex: I completely agree. Did you run into any unexpected challenges so far?",
        f"Sarah: Just a few minor questions, but once we clarify the schedule, everything should go smoothly.",
        f"Alex: Would it help if we walked through the main steps together right now?",
        f"Sarah: Definitely! Having a clear checklist always makes me feel much more confident.",
        f"Alex: Great, let's review the key points and make sure we are both on the same page.",
        f"Sarah: Sounds like a solid plan, Alex. Let's get started right away!",
    ]

    return {
        "title": english_topic[:1].upper() + english_topic[1:60],
        "script": "\n".join(dynamic_lines[:clamped_lines]),
        "provider": "smart-ai-generator",
    }


def generate_dialogue_from_topic(topic: str, num_lines: int = 10) -> Dict[str, str]:
    """
    Generates an 8-12 line natural English conversation script from any user topic
    (Vietnamese or English). Tries Gemini -> OpenAI -> Ollama -> Smart Built-in Generator.
    """
    if not topic or not topic.strip():
        raise ValueError("Topic cannot be empty")

    clamped_lines = max(8, min(12, int(num_lines or 10)))

    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if gemini_key:
        try:
            return _generate_via_gemini(topic, clamped_lines, gemini_key)
        except Exception:
            pass

    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if openai_key:
        try:
            return _generate_via_openai(topic, clamped_lines, openai_key)
        except Exception:
            pass

    if os.environ.get("OLLAMA_BASE_URL"):
        try:
            return _generate_via_ollama(topic, clamped_lines)
        except Exception:
            pass

    return _generate_smart_builtin_dialogue(topic, clamped_lines)
