# ENGLISH DOCUMENTATION
## Project: AudioTool - Native iOS English Conversation Player
### (Spotify-like Background Playback, Word-Level Karaoke Sync & Tap-to-Translate)

Welcome to the English documentation for **AudioTool**. This repository provides an end-to-end open-source solution for commuting English learners who want Spotify-like continuous background playback on iPhones, millisecond-accurate word karaoke syncing, saved dialogue replay libraries, and contextual tap-to-translate.

---

### Documentation Index:

1. **[Research Report & System Architecture (research_and_architecture.md)](research_and_architecture.md):**
   * Problem statement & comparative market analysis (Miraa, LingQ, Spotify Podcasts, Speechify).
   * Open-source tech stack evaluation (`edge-tts`, `ffmpeg`, `deep-translator`, `react-native-track-player`).
   * iOS-specific technical constraints: `AVAudioSession` category `.playback`, single concatenated audio stream requirement to bypass iOS background suspension, and HTTP 206 Byte-Range streaming.
   * Hands-free driving controls via AirPods Remote Commands (`RemoteJumpBackward` jumping to current segment start).
   * Standardized JSON Schema for word boundaries and bilingual transcripts.

2. **[Setup & Comprehensive Testing Guide (setup_and_testing.md)](setup_and_testing.md):**
   * Xcode 16 activation & CocoaPods configuration on macOS.
   * Free Apple ID signing (Personal Team) without paying $99/year.
   * Enabling Developer Mode on personal iPhones.
   * Running the FastAPI backend & executing automated pytest suites.
   * Compiling & deploying native builds directly to iPhone via USB cable (`npx expo run:ios --device`).
   * 5 detailed end-to-end verification test scenarios on real hardware.

---

### Three Core Subsystems (BE, APP, DOC):
* **`backend/` (BE):** Python FastAPI service responsible for script parsing, multi-speaker neural TTS synthesis (`edge-tts`), millisecond word-boundary extraction, Vietnamese translation, and RFC 7233 partial-content streaming.
* **`mobile-app/` (APP):** Native iOS application developed with React Native and Expo, featuring an OLED dark mode player, real-time karaoke auto-scrolling, AirPods integration, saved archive library, and tap-to-translate modals.
* **`docs/` (DOC):** Complete technical specifications, divided into bilingual directories: `vi/` (Vietnamese) and `en/` (English).
