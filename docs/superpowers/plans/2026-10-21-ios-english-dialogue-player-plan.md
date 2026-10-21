# iOS Native English Dialogue Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện ứng dụng luyện nghe hội thoại tiếng Anh Native trên iPhone 13 (iOS 18.1) với Backend FastAPI (`edge-tts` + `ffmpeg` + Google GTX/Dictionary API) và Mobile App React Native Expo (`react-native-track-player` + Karaoke Sync + `@gorhom/bottom-sheet` + Offline Mode), đạt độ chính xác đồng bộ 100% và sẵn sàng chạy chỉ với 1 lệnh.

**Architecture:**
- **Backend (`backend/`):** FastAPI bất đồng bộ cung cấp pipeline phân tích kịch bản, nhận diện giới tính nhân vật, tổng hợp giọng đọc `edge-tts` kèm khôi phục dấu câu cho từng từ (`WordBoundary`), chuẩn hóa & đo thời lượng MP3 thực tế qua `ffmpeg` (24kHz mono + 400ms silence), dịch câu song ngữ và tra từ điển kèm IPA/từ loại/ngữ cảnh, phát stream HTTP 206 Byte-Range.
- **Mobile App (`mobile-app/`):** Ứng dụng React Native (Expo) chia thành 3 màn hình (`PlayerScreen`, `LibraryScreen`, `ImportScreen`), đồng bộ chữ Karaoke không nhấp nháy (`useKaraokeSync`), chạm từ mở `@gorhom/bottom-sheet` (`TranslationSheet`), điều khiển rảnh tay qua AirPods (`RemotePrevious` & `RemoteJumpBackward`), và lưu trữ ngoại tuyến (`storageService` với `expo-file-system` + `AsyncStorage`).

**Tech Stack:**
- **Backend:** Python 3.9+, FastAPI, Uvicorn, `edge-tts`, `httpx`, `ffmpeg`, `pytest`, `pytest-asyncio`
- **Mobile App:** TypeScript, React Native 0.88, Expo SDK 58, `react-native-track-player`, `@gorhom/bottom-sheet`, `expo-file-system`, `@react-native-async-storage/async-storage`

## Global Constraints

- Không lệch thời gian (Zero Audio Drift): Thời lượng từng câu và tổng bài phải khớp với thời lượng thực tế của file MP3 (`ffmpeg -i`, sai số `< 0.08s`).
- Giữ nguyên dấu câu (`,`, `.`, `?`, `!`) trong từng phần tử `words[].word` để hiển thị tự nhiên, nhưng lọc sạch dấu câu khi tra từ điển.
- Bản dịch `text_vi` phải là tiếng Việt thực sự (không được trả về tiếng Anh gốc).
- URL âm thanh (`audio_url`, `audio_stream_url`) phải được cập nhật động theo `request.base_url` khi gọi API lấy chi tiết hoặc danh sách bài học, và Mobile App phải tự động chuẩn hóa URL theo `API_BASE_URL` hoặc đường dẫn file Offline cục bộ.
- Không lộ đường dẫn nội bộ máy chủ (`local_audio_path`, `local_json_path`) trong JSON lưu trữ hoặc trả về qua API, và chặn Path Traversal trên `conversation_id`.

---

## Cấu trúc Tập tin (File Structure)

### Backend (`backend/`)
- `pytest.ini` — Cấu hình `pythonpath = .` và `asyncio_mode = auto` để chạy `pytest` trực tiếp.
- `Dockerfile` — Đóng gói Backend kèm `ffmpeg` theo đúng Mục 5 của đặc tả.
- `app/services/parser.py` — Bóc tách kịch bản hội thoại.
- `app/services/tts_service.py` — Phân vai giọng đọc theo giới tính (`gender: "male" | "female"`), gọi `edge-tts`, khôi phục dấu câu cho `words`, cắt đuôi thừa và đo chính xác `duration` bằng `ffmpeg`.
- `app/services/audio_stitcher.py` — Tạo silence 24kHz mono, ghép các file MP3 câu thoại, đo thời lượng thực tế bằng `ffmpeg -i` và cộng dồn `calculate_cumulative_timestamps`.
- `app/services/translation_service.py` — Dịch câu tiếng Việt qua Google Translate GTX (`httpx`), tra từ điển IPA + từ loại + định nghĩa qua Free Dictionary API (`api.dictionaryapi.dev`) + hỗ trợ tùy chọn Gemini/OpenAI context.
- `app/services/pipeline.py` — Điều phối bất đồng bộ toàn bộ pipeline, xuất JSON chuẩn Schema Mục 4 (có `created_at`, `speakers[k].gender`, không lộ `local_*_path`).
- `app/api/routes.py` — Validate `conversation_id` chống Path Traversal, ghi đè động `audio_url`/`audio_stream_url` theo `request.base_url`, sắp xếp danh sách bài học mới nhất lên đầu, hỗ trợ xóa/tra cứu từ kèm `context`.
- `tests/test_*.py` — Bộ test TDD toàn diện cho từng service và API (sử dụng `tmp_path` để không làm bẩn `app/storage/`).

### Mobile App (`mobile-app/`)
- `app.json` — Bổ sung `NSAppTransportSecurity` (`NSAllowsArbitraryLoads: true`, `NSAllowsLocalNetworking: true`) và `UIBackgroundModes: ["audio"]` cho iPhone 13 (iOS 18.1).
- `index.ts` — Đăng ký `TrackPlayer.registerPlaybackService` an toàn tại entry point.
- `src/types.ts` — Định nghĩa đầy đủ `DialogueData`, `DialogueSummary`, `WordLookupResult` (IPA, `part_of_speech`, `definitions`, `context_en`, `context_vi`).
- `src/services/apiService.ts` — Chuẩn hóa URL động theo `API_BASE_URL`, lưu/đọc `API_BASE_URL` từ `AsyncStorage`, gọi API tạo bài, lấy danh sách, lấy chi tiết và tra từ kèm ngữ cảnh.
- `src/services/storageService.ts` — Quản lý tải bài học về máy (`expo-file-system` + `AsyncStorage`), kiểm tra trạng thái Offline, đọc bài học Offline khi mất mạng.
- `src/services/trackPlayerService.ts` — Cấu hình `AVAudioSession` (`IOSCategory.Playback`, `IOSCategoryMode.SpokenAudio`), xử lý `RemoteJumpBackward` & `RemotePrevious` (AirPods: 1 lần về đầu câu, 2 lần về câu trước), cập nhật tên nhân vật lên Lock Screen, kèm fallback audio an toàn khi chạy môi trường chưa build native.
- `src/hooks/useKaraokeSync.ts` — Hook đồng bộ vị trí phát ở tần số cao, giữ câu active trong khoảng nghỉ `400ms` chống nhấp nháy (flicker).
- `src/components/WordPressable.tsx` — Component từng từ có thể chạm (`Pressable`) với highlight xanh `#1DB954`.
- `src/components/KaraokeLine.tsx` — Component câu hội thoại bọc `React.memo` tối ưu hiệu năng 60 FPS.
- `src/components/TranslationSheet.tsx` — Bottom Sheet chuẩn iOS (`@gorhom/bottom-sheet`) hiển thị từ vựng, IPA, từ loại, nghĩa tiếng Việt và câu ngữ cảnh.
- `src/components/AudioControls.tsx` — Thanh điều khiển phát/tạm dừng, tua về đầu câu, tua tới, đổi tốc độ và thanh tiến độ chạm để tua.
- `src/screens/PlayerScreen.tsx` — Màn hình chính tích hợp điều hướng sang `LibraryScreen` và `ImportScreen`.
- `src/screens/LibraryScreen.tsx` — Màn hình thư viện bài học (hiển thị thời lượng `MM:SS`, số câu, trạng thái Offline, nút "⬇ Tải về máy" / "✓ Đã tải").
- `src/screens/ImportScreen.tsx` — Màn hình nhập tiêu đề, kịch bản hội thoại, kịch bản mẫu và cấu hình IP LAN máy chủ.

### Scripts Khởi chạy (`/` root)
- `start-backend.sh` — Tự động tìm IP LAN, kích hoạt `venv`, chạy FastAPI trên `0.0.0.0:8000`.
- `run-ios.sh` — Tự động nạp Node v24, cập nhật IP LAN vào Mobile App, hỗ trợ chạy Simulator hoặc nạp vào iPhone 13 (`npx expo run:ios --device`).
- `start.sh` — Chạy đồng thời Backend và Mobile App chỉ với 1 lệnh.

---

## Các Giai đoạn & Nhiệm vụ Triển khai (Phases & Tasks)

### Phase 1: Sửa Lỗi Cốt lõi Backend (TDD)
- [ ] **Task 1.1: Chuẩn hóa `tts_service.py` (Nhận diện giới tính, Khôi phục dấu câu `words`, Đo thời lượng thực)**
  - Viết test kiểm tra `get_speaker_profile("Alex")` trả về `gender="male"` và `get_speaker_profile("Sarah")` trả về `gender="female"`.
  - Viết test kiểm tra `align_words_with_punctuation` khôi phục đúng dấu phẩy, dấu chấm hỏi (`"Sarah,"`, `"today?"`) từ câu gốc vào danh sách từ của `WordBoundary`.
  - Cập nhật `generate_segment_tts` cắt khoảng lặng thừa cuối câu và trả về thời lượng MP3 thực tế.
- [ ] **Task 1.2: Chuẩn hóa `audio_stitcher.py` (Sample rate 24kHz, Đo thời lượng MP3 thực tế bằng `ffmpeg -i`, Zero Drift)**
  - Viết test kiểm tra `get_audio_duration(mp3_path)` trả về đúng số giây thực tế của file MP3 và tổng thời lượng file sau khi `stitch_audio_files` khớp với `total_duration` của `calculate_cumulative_timestamps` (sai số `< 0.08s`).
  - Sửa `create_silence_mp3` và `stitch_audio_files` dùng chung `24000 Hz`, mono, `libmp3lame`.
- [ ] **Task 1.3: Nâng cấp `translation_service.py` (Google GTX + Free Dictionary API IPA/Part-of-speech + Context)**
  - Viết test kiểm tra `translate_text("Good morning Sarah, how is the traffic looking today?")` trả về tiếng Việt thật (khác câu tiếng Anh gốc).
  - Viết test kiểm tra `lookup_word_details("highway", context="The highway is packed.")` trả về đầy đủ `word`, `phonetic` (IPA), `part_of_speech`, `translation_vi`, `definition_en`, `context_en`, `context_vi`.
- [ ] **Task 1.4: Hoàn thiện `pipeline.py`, `routes.py`, `pytest.ini`, `Dockerfile` và Tái tạo dữ liệu mẫu `storage/`**
  - Viết test cho `routes.py` (sử dụng `monkeypatch` thư mục `STORAGE_DIR` sang `tmp_path` để không làm bẩn dữ liệu thật): kiểm tra chặn Path Traversal (`400`/`404`), kiểm tra `GET /api/dialogue/{id}` tự động cập nhật `audio_url` & `audio_stream_url` theo `base_url` của request, kiểm tra JSON không chứa `local_audio_path`, và kiểm tra `/api/dictionary/lookup?word=caught&context=...` trả về IPA + từ loại.
  - Chạy script tái tạo lại các bài hội thoại mẫu trong `backend/app/storage/` với bản dịch tiếng Việt chuẩn, đầy đủ dấu câu và khớp thời lượng MP3 100%.

### Phase 2: Xây dựng Hạ tầng Dịch vụ & Hooks trên Mobile App
- [ ] **Task 2.1: Cập nhật `src/types.ts`, `src/services/apiService.ts` và `src/services/storageService.ts` (Offline Mode)**
  - Chuẩn hóa URL âm thanh (`resolveAudioUrl`) để kể cả khi JSON có chứa IP cũ hoặc `localhost`, app vẫn tự động đổi sang `API_BASE_URL` hiện tại hoặc đường dẫn file Offline `file://...` trong `expo-file-system`.
  - Triển khai `storageService.ts` với `expo-file-system` và `AsyncStorage` để tải/lưu/xóa bài học Offline và đồng bộ danh sách bài học khi mất mạng.
- [ ] **Task 2.2: Nâng cấp `src/services/trackPlayerService.ts` & `src/hooks/useKaraokeSync.ts`**
  - Bọc `react-native-track-player` an toàn (không crash nếu chạy trên môi trường thiếu native module, có fallback HTML5/JS audio timer).
  - Cấu hình `IOSCategory.Playback`, `IOSCategoryMode.SpokenAudio`, đăng ký cả `Event.RemoteJumpBackward` và `Event.RemotePrevious` (AirPods: bấm 1 lần về đầu câu hiện tại, bấm lần 2 ở `< 0.8s` đầu câu thì lùi về câu trước), cập nhật tên nhân vật lên Lock Screen.
  - Viết hook `useKaraokeSync.ts` giữ nguyên `activeSegmentIndex` trong khoảng nghỉ `400ms` giữa 2 câu để chống nhấp nháy giao diện.

### Phase 3: Xây dựng Giao diện Chuẩn Kiến trúc Mục 5
- [ ] **Task 3.1: Xây dựng các Components (`WordPressable.tsx`, `KaraokeLine.tsx`, `TranslationSheet.tsx`, `AudioControls.tsx`)**
  - `WordPressable.tsx`: Từ tiếng Anh dùng `Pressable`, tô nền xanh `#1DB954` khi đang đọc.
  - `KaraokeLine.tsx`: Bọc `React.memo` chỉ re-render câu đang active hoặc vừa đổi trạng thái active.
  - `TranslationSheet.tsx`: Sử dụng `@gorhom/bottom-sheet` vuốt đóng chuẩn iOS, hiển thị Từ vựng, Phiên âm IPA, Từ loại, Nghĩa tiếng Việt, Định nghĩa và Câu ngữ cảnh song ngữ.
  - `AudioControls.tsx`: Hỗ trợ chạm vào thanh progress bar để tua nhanh, nút Đầu câu / Câu trước, Play/Pause, +5s, tốc độ `0.8x / 1.0x / 1.25x`.
- [ ] **Task 3.2: Xây dựng 3 Màn hình (`PlayerScreen.tsx`, `LibraryScreen.tsx`, `ImportScreen.tsx`) & Cấu hình `app.json` / `index.ts`**
  - Cập nhật `app.json` bổ sung `NSAppTransportSecurity` cho iOS 18.1.
  - Cập nhật `index.ts` và `App.tsx`.
  - Tách biệt rõ `PlayerScreen.tsx`, `LibraryScreen.tsx` (có nút "⬇ Tải Offline" / "✓ Đã tải", thời lượng `MM:SS`), và `ImportScreen.tsx` (có ô nhập tiêu đề, kịch bản mẫu nhanh, cấu hình & nút Lưu IP LAN độc lập).

### Phase 4: Đóng gói Script Khởi chạy Tự động & Kiểm thử E2E Toàn diện
- [ ] **Task 4.1: Tạo bộ script `start-backend.sh`, `run-ios.sh`, `start.sh`**
  - Tự động lấy IP LAN máy Mac (`192.168.1.220`), nạp Node v24, khởi chạy Backend và Mobile App.
- [ ] **Task 4.2: Chạy kiểm thử toàn bộ (`pytest`, `npx tsc --noEmit`, E2E API test) & Code Review cuối cùng**
  - Xác minh toàn bộ test pass 100%, không còn warning/error, và hướng dẫn ngắn gọn cách chạy trên iPhone 13 (iOS 18.1) & Simulator.
