# TECHNICAL SPECIFICATION & RESEARCH REPORT
## Native iOS English Conversation Audio Player
### (Spotify-like Background Playback, Karaoke Sync & Tap-to-Translate)

---

## 1. Background, Problem Statement & Objectives

### 1.1. Problem Statement
- **Core User Need:** Commuters want to utilize daily commute and driving time to practice English listening with realistic multi-person dialogues and conversations.
- **Desired Experience:**
  - Input any dialogue script (text script or pre-recorded audio file).
  - **Spotify-like Background Playback:** Turn off the iPhone screen, put the phone into a pocket, or connect via Bluetooth headphones (AirPods) / Apple CarPlay, while audio continues uninterrupted.
  - **Spotify Live Lyrics Sync (Karaoke-style):** When glancing at the screen (e.g. stopped at a red light), words light up in sync with the audio, and the screen automatically scrolls to keep the current sentence centered.
  - **Saved Library & Offline Archive:** All generated dialogues are archived permanently so the user can replay any dialogue without re-entering the script.
  - **Tap-to-Translate:** Subdued Vietnamese translation displayed below each sentence, or tap on any English word to pause audio and display IPA phonetics and contextual meaning.

### 1.2. Market Analysis & The "Make vs. Buy" Decision
1. **Miraa (AI Transcribe & Study):** Closest existing product (AI transcription, karaoke highlight, bilingual translation, A-B repeat). Limitations:
   - Free tier only offers an initial 30 minutes of AI transcription.
   - Recurring subscriptions: Basic ~$0.99/mo (capped at ~220,000 words/mo), Pro ~$5.99/mo or $49.99/year.
2. **LingQ:** Robust import feature, but heavyweight UI and high monthly cost (~$12.99/mo).
3. **Spotify / Apple Podcasts:** Supports transcript syncing for select podcasts, but does not allow importing custom conversation scripts, nor does it support tap-to-translate or bilingual inline subtitles.
4. **Speechify / NaturalReader:** Natural AI narration, but lacks natural multi-speaker dialogue parsing and intuitive tap-to-translate functionality.

👉 **Project Decision:** Build a self-hosted, open-source solution optimized for iOS that uses free open-source neural TTS models with 0 recurring subscription fees.

### 1.3. Platform Strategy: Native iOS App (Zero Apple Developer Fee)
- **Hard Constraint:** Must run as a standalone Native App directly on the iPhone (NOT via Safari mobile browser) to overcome aggressive iOS background tab freezing.
- **Zero Cost Solution:** Built with **React Native (Expo SDK)** and deployed as a **Local/Development Build**. This allows compiling and deploying directly to a personal iPhone over USB cable or local Wi-Fi for free, without paying Apple's $99/year developer membership fee and avoiding the 7-day expiration limit of sideloading tools like AltStore.

---

## 2. Open-Source Ecosystem & Technology Stack

The system adopts a hybrid client-server architecture:

```
[Dialogue Text / Audio Script]
             │
             ▼
      ┌──────────────┐         HTTP / REST API         ┌─────────────────────────┐
      │ Python       │ ──────────────────────────────> │ Native iOS Client       │
      │ FastAPI      │                                 │ (React Native + RNTP    │
      │ Backend      │ <────────────────────────────── │ + Expo on iPhone)       │
      └──────────────┘       (JSON + MP3 Audio)        └─────────────────────────┘
```

### 2.1. Text-to-Speech (TTS) & Word Boundary Extraction
* **`edge-tts` (Python):** Communicates with Microsoft Edge Neural TTS endpoints.
  * Emits millisecond-accurate `WordBoundary` events directly via WebSocket without requiring an auxiliary speech-to-text alignment model.
  * Free, high quality, multi-speaker conversational voices: `en-US-AndrewNeural`, `en-US-BrianNeural` (Male); `en-US-AvaNeural`, `en-US-EmmaNeural` (Female).
* **Local Alternative (`Kokoro-82M`):** 82M parameter open-source TTS model (~300MB, Apache 2.0) runnable locally on Apple Silicon (M1/M2/M3/M4) via MLX for offline-only scenarios.

### 2.2. Translation
* **`deep-translator`:** Automates sentence-level Vietnamese translation and per-word dictionary lookup with fallback mechanisms.

---

## 3. iOS Native Deep-Dive Engineering Challenges

### 3.1. Background Audio Persistence & Avoiding iOS Suspension
- **Root Cause of iOS Audio Drops:** When playing a playlist of short audio files (one per sentence), iOS Safari and non-background WebViews immediately revoke background execution permissions as soon as the first track ends while the screen is locked.
- **Solution - Single Concatenated Audio Stream:**
  1. Backend stitches all dialogue turns into **a single continuous `.mp3` file** using FFmpeg, inserting a natural `400ms` silence between alternating speakers.
  2. Absolute cumulative timestamps are calculated for all segments and words (`time_offset`).
  3. The iOS app utilizes **`react-native-track-player` (RNTP)**, which binds directly to native `AVAudioSession` under category `.playback` with `UIBackgroundModes: ["audio"]`. The iOS kernel treats the app as an audio stream (like Spotify or Podcasts), running indefinitely even when the screen is locked or the physical Silent Switch is activated.

### 3.2. HTTP 206 Byte-Range Request Streaming
- iOS AVPlayer strictly enforces RFC 7233 partial content requests (`Range: bytes=start-end`). If the server returns HTTP 200, seeking is disabled and lock-screen progress widgets freeze. The FastAPI backend implements streaming response with `Accept-Ranges: bytes` and `Content-Range`.

### 3.3. Hands-Free Commute Controls (AirPods & Lock Screen)
- Standard music apps rewind a fixed 10s or 15s. During language learning, this lands between sentences.
- **AudioTool Custom Rewind (`Event.RemoteJumpBackward`):** Pressing the rewind command on AirPods or car steering wheel triggers a custom event that seeks directly to the start timestamp of the currently active sentence (`currentSegment.start`), allowing hands-free instant replay of missed phrases.

### 3.4. 60 FPS Spotify Lyrics-Style Karaoke Sync
- Uses RNTP's `useProgress(100)` hook to obtain playback timestamps at 100ms intervals.
- The active sentence is highlighted with large high-contrast typography, while preceding and succeeding sentences are dimmed.
- Words light up in Spotify Green (`#1DB954`) in real time.
- `FlatList.scrollToIndex({ viewPosition: 0.4 })` smoothly auto-scrolls to keep the speaking sentence in the top 40% of the screen.
- Tap-to-Seek allows tapping any sentence to immediately jump playback to that position.

### 3.5. Tap-to-Translate & iOS Bottom Sheet
- Each word is a pressable target. Tapping a word:
  1. Automatically calls `TrackPlayer.pause()`.
  2. Pops up an iOS Bottom Sheet showing the word, IPA phonetics, and Vietnamese translation.
  3. Dismissing the modal automatically calls `TrackPlayer.play()` to resume seamlessly.

### 3.6. Saved Archive Library & Offline Replay
- Every generated dialogue is stored persistently in `backend/app/storage/` as `<id>.mp3` and `<id>.json`.
- The `LibraryScreen` on the iPhone displays all saved lessons (title, duration, sentence count) for one-tap replay without re-synthesizing.

---

## 4. Standardized JSON Schema

```json
{
  "conversation_id": "conv_79fd4dda97",
  "title": "Weekend Coffee Meetup",
  "total_duration": 9.14,
  "audio_url": "http://192.168.1.220:8000/static/conv_79fd4dda97.mp3",
  "audio_stream_url": "http://192.168.1.220:8000/api/audio/conv_79fd4dda97/stream",
  "offline_filename": "conv_79fd4dda97.mp3",
  "speakers": {
    "David": {"name": "David", "voice": "en-US-AndrewNeural"},
    "Emily": {"name": "Emily", "voice": "en-US-AvaNeural"}
  },
  "segments": [
    {
      "id": 1,
      "speaker": "David",
      "speaker_name": "David",
      "start": 0.0,
      "end": 3.25,
      "text_en": "Hey Emily, do you want to grab coffee this afternoon?",
      "text_vi": "Này Emily, chiều nay bạn có muốn đi uống cà phê không?",
      "words": [
        {"word": "Hey", "start": 0.0, "end": 0.3},
        {"word": "Emily,", "start": 0.35, "end": 0.8},
        {"word": "do", "start": 0.85, "end": 1.0},
        {"word": "you", "start": 1.05, "end": 1.2},
        {"word": "want", "start": 1.25, "end": 1.5},
        {"word": "to", "start": 1.55, "end": 1.7},
        {"word": "grab", "start": 1.75, "end": 2.1},
        {"word": "coffee", "start": 2.15, "end": 2.5},
        {"word": "this", "start": 2.55, "end": 2.8},
        {"word": "afternoon?", "start": 2.85, "end": 3.25}
      ]
    }
  ]
}
```

---

## 5. Monorepo Structure

```
audiotool/
├── backend/                              # Python FastAPI Server
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes.py                 # REST Endpoints
│   │   │   └── range_streaming.py        # HTTP 206 Partial Content Streaming
│   │   ├── services/
│   │   │   ├── parser.py                 # Dialogue Script Parser
│   │   │   ├── tts_service.py            # Edge-TTS multi-speaker synthesis
│   │   │   ├── audio_stitcher.py         # FFmpeg concatenation & cumulative offsets
│   │   │   ├── translation_service.py   # Bilingual translation
│   │   │   └── pipeline.py               # Coordinator service
│   │   ├── storage/                      # Persisted MP3 and JSON files
│   │   └── main.py                       # FastAPI entrypoint with CORS
│   ├── tests/                            # 10/10 automated pytest suite
│   ├── create_dialogue.py                # Command-line dialogue generation utility
│   └── requirements.txt                  # Python dependencies
│
├── mobile-app/                           # Native iOS React Native App (Expo)
│   ├── src/
│   │   ├── components/
│   │   │   ├── KaraokeLine.tsx           # Live lyrics line with word-level highlight
│   │   │   ├── AudioControls.tsx         # Player controls (rewind to sentence start, speed)
│   │   │   └── TranslationModal.tsx      # Tap-to-translate modal
│   │   ├── screens/
│   │   │   └── PlayerScreen.tsx          # Fullscreen lyrics player & saved library
│   │   ├── services/
│   │   │   ├── trackPlayerService.ts     # AVAudioSession, AirPods remote events
│   │   │   └── apiService.ts             # Backend REST connection
│   │   └── types.ts                      # TypeScript definitions
│   ├── app.json                          # Expo iOS config (UIBackgroundModes: ["audio"])
│   └── App.tsx                           # Main entry point
│
└── docs/                                 # Bilingual Documentation
    ├── vi/                               # Vietnamese Guides & Architecture
    └── en/                               # English Guides & Architecture
```

---

## 6. Personal User Requirements & Cloud / Commute Strategy

Based on explicit requirements from user feedback (2026-10-21):
1. **Single Personal User:** Built solely for one individual user. Priority is maximum agility, zero monthly hosting costs, and fast deployment.
2. **Mac Cannot Run 24/7 (Cloud Hosting Required):**
   - The development Mac host cannot remain powered on 24/7.
   - The Python + FFmpeg backend is containerized via `backend/Dockerfile` and deployed independently to a **Cloud provider** (recommended: **Koyeb** for 24/7 always-on free execution without spin-down sleep, or Render / Fly.io) with public HTTPS for iOS ATS security.
3. **Dual Commuting Playback Modes (On the Road):**
   - **Mode 1 - Cellular 4G/5G Online:** Mobile app calls the Cloud backend directly over 4G to generate new dialogues on the go or stream live.
   - **Mode 2 - 100% Offline Downloaded Playback:** Dialogues and MP3 audio files can be pre-downloaded to local iPhone 13 storage (`expo-file-system` + `AsyncStorage`). On the road, users can disable cellular data or enable Airplane Mode and play saved lessons without interruptions or data usage.
4. **Bilingual Commute Learning Experience:**
   - Background audio plays uninterrupted when iPhone 13 is locked (`AVAudioSession`).
   - Hands-free AirPods controls: Squeeze/tap earbud to jump back to the start of the current sentence (`RemoteJumpBackward`).
   - Visual screen: Word-level green karaoke highlighting synchronized to milliseconds, with Vietnamese subtitle translation positioned directly below each dialogue sentence.

