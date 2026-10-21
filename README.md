# AudioTool (Monorepo)
## Native iOS English Conversation Player for Commuting
### (Spotify-like Background Playback, Live Lyrics Sync, Saved Library & Tap-to-Translate)

[![Tests](https://img.shields.io/badge/pytest-10%2F10%20passing-brightgreen)](backend/tests/)
[![TypeScript](https://img.shields.io/badge/TypeScript-0%20errors-blue)](mobile-app/)
[![License](https://img.shields.io/badge/license-MIT-purple)](#)

AudioTool is an open-source, full-stack platform built specifically for English learners who commute. It combines a **Python FastAPI backend** with neural multi-speaker TTS and a **Native iOS React Native app** featuring Spotify-like live lyrics syncing, hands-free AirPods rewind controls, and background audio playback that continues uninterrupted when the iPhone is locked.

---

## 📁 Monorepo Structure

The project is organized into three clean subsystems:

```
audiotool/
├── backend/                  # 1. BACKEND (BE)
│   ├── app/                  # FastAPI REST API, TTS pipeline, FFmpeg stitcher & HTTP 206 streaming
│   ├── tests/                # 10/10 automated unit test suite
│   ├── create_dialogue.py    # Command-line utility to convert dialogues to audio
│   └── requirements.txt      # Python dependencies
│
├── mobile-app/               # 2. MOBILE APP (APP)
│   ├── src/                  # PlayerScreen, KaraokeLine, TranslationModal, AudioControls
│   ├── app.json              # iOS audio background permissions (UIBackgroundModes)
│   └── App.tsx               # Root application entry point
│
└── docs/                     # 3. DOCUMENTATION (DOC)
    ├── vi/                   # Tài liệu tiếng Việt
    │   ├── README.md
    │   ├── research_and_architecture.md
    │   └── setup_and_testing.md
    └── en/                   # English Documentation
        ├── README.md
        ├── research_and_architecture.md
        └── setup_and_testing.md
```

---

## 📖 Documentation (Tài liệu Dự án)

* 🇻🇳 **Tiếng Việt:**
  * [Tổng quan Tài liệu Tiếng Việt](docs/vi/README.md)
  * [Nghiên cứu Kỹ thuật & Bối cảnh Kiến trúc](docs/vi/research_and_architecture.md)
  * [Hướng dẫn Kích hoạt Xcode, Kết nối iPhone & 5 Kịch bản Test](docs/vi/setup_and_testing.md)
* 🇬🇧 **English:**
  * [English Documentation Overview](docs/en/README.md)
  * [Technical Specification & Architecture Report](docs/en/research_and_architecture.md)
  * [Xcode Setup, iPhone Deployment & Verification Guide](docs/en/setup_and_testing.md)

---

## 🚀 Quick Start (Khởi động Nhanh)

### 1. Start the Backend (Máy chủ xử lý AI)
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
* API Health Check: `http://localhost:8000/api/health`
* Saved Dialogue Archive: `http://localhost:8000/api/dialogue`

### 2. Generate Audio from Script (Chuyển chữ thành tiếng từ Terminal)
```bash
cd backend
source venv/bin/activate
python create_dialogue.py -t "Meeting" -s "Alex: Hello!\nSarah: Hi Alex!"
```

### 3. Launch Mobile App (Ứng dụng trên iPhone)
```bash
cd mobile-app
npx expo run:ios --device
```
*(Deploys native build directly to your connected iPhone with 0 developer fee)*.
