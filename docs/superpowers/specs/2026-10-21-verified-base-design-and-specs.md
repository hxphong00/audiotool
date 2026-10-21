# HỆ THỐNG ĐẶC TẢ KỸ THUẬT & THIẾT KẾ CƠ SỞ (BASE DESIGN & SYSTEM SPEC)
## Project: AudioTool - Native iOS Commuting English Dialogue Player
**Version:** 2.0-Production  
**Standard Template:** IEEE 1016 Software Design Description (SDD) & Architecture Decision Record (ADR)  
**Date:** 2026-10-21  
**Target Hardware:** iPhone 13 (Standard / Bản tiêu chuẩn) — iOS 18.1 (Build 22B83)  
**Host & Runtime:** Apple Silicon Mac (`arm64`), Xcode 16.2, Python 3.9.6, Node.js v20.20.2  

---

## 1. TỔNG QUAN KIẾN TRÚC & PHÂN TẦNG HỆ THỐNG (SYSTEM ARCHITECTURE)

Hệ thống được thiết kế theo mô hình **Phân tầng Độc lập (Layered Decoupled Architecture)** nhằm tách biệt tuyệt đối giữa tầng tính toán AI backend và tầng phát nhạc native trên iOS:

```
+---------------------------------------------------------------------------------------+
|                                    TẦNG GIAO DIỆN (UI LAYER)                          |
|  PlayerScreen.tsx | KaraokeLine.tsx | TranslationSheet.tsx | StudyDeckScreen.tsx       |
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼
+---------------------------------------------------------------------------------------+
|                                  TẦNG DỊCH VỤ CLIENT (SERVICE LAYER)                 |
|  useKaraokeSync.ts     | storageService.ts       | learningService.ts (SM-2 Engine)   |
|  trackPlayerService.ts | apiService.ts           | expo-keep-awake / Local FileSystem |
+---------------------------------------------------------------------------------------+
                                           │
                                           │ (HTTP 206 / REST API / Local Storage)
                                           ▼
+---------------------------------------------------------------------------------------+
|                                 TẦNG MÁY CHỦ BACKEND (FASTAPI LAYER)                  |
|  routes.py             | range_streaming.py      | ai_script_service.py               |
|  pipeline.py           | tts_service.py          | audio_stitcher.py (FFmpeg)         |
+---------------------------------------------------------------------------------------+
```

---

## 2. BASE DESIGN CHO TỪNG TÍNH NĂNG (10 CORE CAPABILITIES)

### 2.1. Feature 1: Edge-TTS & Multi-speaker Dialogue Synthesis
* **Base Design:** Giao tiếp bất đồng bộ qua giao thức WebSocket của Microsoft Edge Neural TTS.
* **Speaker Mapping:**
  * Nam: `en-US-AndrewNeural` (hoặc `en-US-BrianNeural`)
  * Nữ: `en-US-AvaNeural` (hoặc `en-US-EmmaNeural`)
* **Metadata Output:** Lắng nghe sự kiện `WordBoundary` để thu thập `offset` và `duration` tính bằng mili-giây cho từng từ đơn.

### 2.2. Feature 2: FFmpeg Audio Stitcher & Cumulative Millisecond Time-Offsets
* **Base Design:** Thay vì phát nhiều file MP3 riêng biệt (bị iOS kill khi khóa màn hình), FFmpeg nối toàn bộ các đoạn âm thanh thành 1 file duy nhất (`24000 Hz, 1 channel mono, 64kbps CBR`).
* **Offset Compensation:** Tự động chèn `silence_sec` (0.4s mặc định, hoặc 2.0s – 3.0s ở chế độ Shadowing) giữa các câu thoại và tính toán mốc cộng dồn:
  $$\text{Word}_{\text{start}} = \text{Segment}_{\text{offset}} + \text{Word}_{\text{relative\_start}}$$
  Đảm bảo sai số trôi dạt tích lũy $\Delta t \le 10\text{ms}$.

### 2.3. Feature 3: RFC 7233 HTTP 206 Partial Content Byte-Range Audio Streaming
* **Base Design:** Phục vụ giao thức Byte-Range bắt buộc cho trình phát nhạc `AVPlayer` của iOS.
* **Header Contracts:**
  * `Accept-Ranges: bytes`
  * `Content-Range: bytes START-END/TOTAL`
  * Trả về mã trạng thái `206 Partial Content`. Cho phép người dùng tua đến bất kỳ vị trí nào mà không cần tải toàn bộ file.

### 2.4. Feature 4: Vietnamese Translation & Word Context Dictionary
* **Base Design:** Dịch ngữ cảnh câu thoại sang tiếng Việt qua `deep-translator`. Tích hợp từ điển tra nghĩa nhanh (kèm phiên âm IPA quốc tế, từ loại và câu ví dụ) hiển thị qua Bottom Sheet.

### 2.5. Feature 5: One-Tap Topic Dialogue Generation Engine
* **Base Design:** Cho phép người dùng nhập bất kỳ chủ đề đời sống nào (ví dụ: *"Starbucks"*, *"Job Interview"*, *"Traffic Police"*), bộ sinh kịch bản `ai_script_service.py` tự động xuất bản kịch bản 8–12 lượt thoại chuẩn ngữ pháp, tự động gán vai Alex & Sarah và chuyển thành file âm thanh có đầy đủ mốc từ.

### 2.6. Feature 6: Commute Shadowing Pause Mode (0.4s – 3.0s)
* **Base Design:** Hỗ trợ 2 cơ chế:
  1. *Cơ chế nướng vào Audio (Baked-in FFmpeg):* Backend ghép nối sẵn 2.0s hoặc 3.0s khoảng lặng giữa các câu thoại.
  2. *Cơ chế tạm dừng động (Dynamic Player Wait):* Player tự động pause ở ranh giới câu thoại và đếm ngược thời gian nhẩm theo cấu hình của người dùng.

### 2.7. Feature 7: Offline Storage & FileSystem Audio Downloading Engine
* **Base Design:** 
  * File MP3 được tải vào `FileSystem.documentDirectory + 'offline_dialogues/' + id + '.mp3'` qua `FileSystem.downloadAsync`.
  * Metadata kịch bản JSON (lời EN + sub VI) được lưu vào `AsyncStorage` qua khóa `@audiotool_offline_dialogues_index_v1`.
  * Hỗ trợ phát nhạc offline 100% bằng cách trỏ `TrackPlayer.add` vào URI cục bộ `file://${localPath}`.

### 2.8. Feature 8: SuperMemo SM-2 Spaced Repetition Scheduling Algorithm
* **Base Design:** Ứng dụng thuật toán ôn tập ngắt quãng chuẩn khoa học SuperMemo SM-2:
  * Khoảng cách ôn tập: $I(1) = 1\text{ ngày}$, $I(2) = 3\text{ ngày}$, $I(3) = 7\text{ ngày}$, $I(n) = I(n-1) \times EF$.
  * Cập nhật hệ số dễ (Ease Factor):
    $$EF' = EF + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02)) \quad (EF' \ge 1.3)$$
  * Phân loại đánh giá: $q=3$ (Khó / 1 ngày), $q=4$ (Khá / 3 ngày), $q=5$ (Tốt / 7 ngày).

### 2.9. Feature 9: Personal Vocabulary Deck & Sentence Bookmark Star Engine
* **Base Design:**
  * Mỗi câu thoại trên `KaraokeLine` có icon ngôi sao ⭐ để gắn cờ câu khó.
  * Mỗi từ tra nghĩa trên `TranslationSheet` có nút `☆ Lưu từ này` lưu vào `SavedVocabItem`.
  * Dữ liệu hiển thị trực tiếp trong `StudyDeckScreen` với chức năng nghe lại 1 chạm.

### 2.10. Feature 10: Native Audio Session, AirPods Remote Commands & Auto-Loop
* **Base Design:**
  * Cấu hình `AVAudioSession` category `.playback`, mode `.spokenAudio`.
  * Bắt sự kiện `Event.RemoteJumpBackward` và `Event.RemotePrevious` từ tai nghe AirPods để lùi về đầu câu thoại đang nghe (`currentSegment.start`).
  * Chế độ tự động lặp lại (Auto-Loop) tự động seek về 0 khi kết thúc bài học để nghe ngấm liên tục khi lái xe.
