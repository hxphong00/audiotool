# Thiết Kế Kỹ Thuật (Technical Design Spec): Ứng Dụng Luyện Nghe Hội Thoại Tiếng Anh Native trên iPhone 13 (iOS 18.1)

## 1. Bối cảnh & Yêu cầu Đã Chốt với Người dùng

Dựa trên tài liệu gốc `native_ios_english_player_complete_research.md` và **12 quyết định kỹ thuật** đã chốt với người dùng:

1. **Thiết bị mục tiêu (Target Device):** iPhone 13 chạy **iOS 18.1 (Build 22B83)** + hỗ trợ chạy trên iOS Simulator (Xcode 16.2) trên MacBook Pro (IP LAN: `192.168.1.220`).
2. **Audio Engine:** Sử dụng `react-native-track-player` (RNTP) cho Lock Screen, Control Center, AirPods & Background Audio (`UIBackgroundModes: ["audio"]`, `AVAudioSession` `.playback`), đồng thời bọc lớp **Safe Native Bridge Adapter** để không bị crash nếu mở trên môi trường chưa build native (Expo Go / Web).
3. **Phạm vi Luồng dữ liệu:** Tập trung hoàn thiện chuẩn 100% **Luồng A** (Nhập kịch bản Text ➔ Phân vai `edge-tts` ➔ Ghép 1 file MP3 ➔ Karaoke Sync ➔ Chạm tra từ ➔ Lưu Offline).
4. **Dịch thuật & Từ điển (Luồng C):**
   - Dịch câu & từ sang tiếng Việt qua **Google Translate GTX API (`httpx` bất đồng bộ)** (khắc phục triệt để lỗi `429 TooManyRequests` của `deep-translator`).
   - Tra từ điển qua **Free Dictionary API (`api.dictionaryapi.dev`)** để lấy **Phiên âm IPA chuẩn Anh-Mỹ**, **Từ loại (`part_of_speech`)**, định nghĩa và ví dụ.
   - Hỗ trợ tùy chọn nâng cao: Nếu có biến môi trường `GEMINI_API_KEY` hoặc `OPENAI_API_KEY`, tự động bổ sung giải thích nghĩa theo ngữ cảnh câu thoại (`context_sentence`).
5. **Triệt tiêu Lệch Đồng bộ Âm thanh (Zero Audio Drift):**
   - Dùng `ffmpeg` chuẩn hóa toàn bộ file âm thanh câu thoại và file khoảng lặng về cùng tần số mẫu **`24000 Hz`, mono, `libmp3lame`**.
   - Cắt khoảng lặng thừa ở đuôi mỗi file MP3 con do `edge-tts` sinh ra (`words[-1]["end"] + 0.12s`), chèn đúng `400ms` silence giữa các câu, và dùng `ffmpeg -i` đo **thời lượng thực tế** của từng file để tính `calculate_cumulative_timestamps` (sai số `0.00s`).
6. **Khôi phục Dấu câu Hiển thị (`WordBoundary` Punctuation Alignment):**
   - Khôi phục đầy đủ dấu câu (`,`, `.`, `?`, `!`, `'`, `...`) từ câu gốc `text_en` vào mảng `words` trong JSON để hiển thị câu tiếng Anh tự nhiên trên màn hình Karaoke, nhưng tự động lọc sạch dấu câu khi người dùng chạm vào từ để tra nghĩa.
7. **Nhận diện Giới tính Nhân vật & JSON Schema Mục 4:**
   - Tự động nhận diện giới tính qua từ điển tên nhân vật phổ biến (`Alex`, `David`, `John`, `Michael`, `Brian`, `Tom`, `Mark`, `James`, `Robert`, `Paul`, `Kevin`, `Daniel`, `Waiter`, `Man`, `Boy`, `Father`, `Dad`, `Husband`, `Mr`... ➔ `male`; `Sarah`, `Emily`, `Emma`, `Ava`, `Lisa`, `Anna`, `Mary`, `Jessica`, `Rachel`, `Laura`, `Amy`, `Waitress`, `Woman`, `Girl`, `Mother`, `Mom`, `Wife`, `Ms`, `Mrs`... ➔ `female`) kết hợp luân phiên giọng Nam (`en-US-AndrewNeural`, `en-US-BrianNeural`) và Nữ (`en-US-AvaNeural`, `en-US-EmmaNeural`).
   - Lưu đầy đủ trường `gender` (`"male"` | `"female"`) trong `speakers`, loại bỏ `local_audio_path`/`local_json_path` khỏi JSON public, và chuẩn hóa URL động theo host request (`request.base_url`).
8. **Bảng Tra Từ iOS Bottom Sheet (`@gorhom/bottom-sheet`):**
   - Xây dựng `TranslationSheet.tsx` sử dụng `@gorhom/bottom-sheet` vuốt đóng chuẩn iOS.
   - Hiển thị: Từ vựng, Phiên âm IPA, Từ loại (`part_of_speech`), Nghĩa tiếng Việt, Câu ngữ cảnh (`context_en` & `context_vi`).
   - Lưu trạng thái `wasPlayingBeforeLookup`: Chỉ tự động gọi `play()` khi đóng bảng tra từ nếu trước khi chạm từ bài nghe đang ở trạng thái phát.
9. **Điều khiển Rảnh tay AirPods / CarPlay / Lock Screen:**
   - Đăng ký cả `Capability.JumpBackward` (`Event.RemoteJumpBackward`) và `Capability.SkipToPrevious` (`Event.RemotePrevious` - bóp tai nghe AirPods):
     - Bấm 1 lần: Nhảy về đầu câu đang nói (`currentSegment.start`).
     - Bấm lần 2 (khi đang ở `< 0.8s` đầu câu): Nhảy lùi về đầu câu trước đó (`segments[idx - 1].start`).
   - Cập nhật động tên nhân vật đang nói (`speaker_name`) lên Lock Screen / Control Center qua `updateNowPlayingMetadata`.
10. **Lưu trữ Ngoại tuyến (Offline Mode - `expo-file-system` + `AsyncStorage`):**
    - Xây dựng `storageService.ts` lưu danh sách bài học và tải file `.mp3` + `.json` vào thư mục `documentDirectory` của iPhone.
    - Tự động lưu cache bài vừa tạo VÀ cung cấp nút **"⬇ Tải về máy" / "✓ Đã tải Offline"** trong `LibraryScreen.tsx`. Khi mất mạng 4G/5G, app tự động đọc danh sách và phát âm thanh từ bộ nhớ iPhone.
11. **Kiến trúc Module Mobile App (Mục 5):**
    - Tách biệt rõ ràng:
      - `src/components/WordPressable.tsx`
      - `src/components/KaraokeLine.tsx` (bọc `React.memo`, chống re-render thừa)
      - `src/components/TranslationSheet.tsx` (`@gorhom/bottom-sheet`)
      - `src/components/AudioControls.tsx`
      - `src/screens/PlayerScreen.tsx`
      - `src/screens/ImportScreen.tsx`
      - `src/screens/LibraryScreen.tsx`
      - `src/services/trackPlayerService.ts`
      - `src/services/storageService.ts`
      - `src/services/apiService.ts`
      - `src/hooks/useKaraokeSync.ts` (giữ câu đang active trong khoảng nghỉ `400ms` để chống flicker).
12. **Bộ Script Khởi chạy Tự động (`start.sh`, `start-backend.sh`, `run-ios.sh`):**
    - Tự động phát hiện IP LAN của máy Mac (`192.168.1.220`), nạp Node v24 (`~/.nvm/versions/node/v24.19.0/bin`), tái tạo dữ liệu mẫu chuẩn xác trong `backend/app/storage/`, khởi động Backend FastAPI (`0.0.0.0:8000`) và chạy Mobile App.
