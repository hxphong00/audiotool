# TÀI LIỆU YÊU CẦU & BÁO CÁO NGHIÊN CỨU KỸ THUẬT TOÀN DIỆN
# (COMPREHENSIVE SPECIFICATION & RESEARCH REPORT)

## Dự án: Ứng dụng Luyện nghe Hội thoại Tiếng Anh Native trên iPhone
### (Spotify-like Background Audio, Karaoke Sync & Tap-to-Translate)

---

## 1. Bối cảnh, Vấn đề Thực tế & Mục tiêu Dự án

### 1.1. Bài toán Thực tế (User Problem)
- **Nhu cầu cốt lõi:** Người dùng muốn tận dụng thời gian di chuyển, lái xe hằng ngày (commuting) để luyện nghe tiếng Anh qua các đoạn hội thoại thực tế (conversations/dialogues).
- **Trải nghiệm mong muốn:**
  - Nhập vào bất kỳ đoạn kịch bản hội thoại nào (dạng văn bản hoặc file âm thanh sẵn có).
  - Hoạt động **chạy ngầm hoàn hảo như Spotify**: Khóa màn hình iPhone, đút điện thoại vào túi quần hoặc kết nối tai nghe Bluetooth (AirPods) / Apple CarPlay trên xe hơi mà âm thanh vẫn phát liên tục không bị ngắt.
  - **Đọc Text đồng bộ theo giọng đọc như xem lời bài hát trên Spotify (Spotify-like Live Lyrics Sync):**
    - Khi nhìn vào màn hình (dừng đèn đỏ, nghỉ chân), giao diện hiển thị toàn bộ lời thoại như màn hình xem Lyrics của Spotify.
    - Giọng đọc đến đâu, chữ sáng lên đến đó (Karaoke-style word-level highlight), màn hình tự động cuộn (Auto-scroll) theo câu đang nói.
    - Có thể chạm vào bất kỳ câu nào để nhảy phát lại ngay từ câu đó.
  - **Lưu trữ Thư viện Hội thoại để Nghe lại Mọi lúc (Saved Library & Offline Replay):**
    - Mọi đoạn hội thoại sau khi tạo đều được tự động lưu vào danh mục thư viện cá nhân.
    - Người dùng có thể mở danh sách bài học ra để nghe đi nghe lại nhiều lần bất cứ lúc nào mà không cần nhập lại kịch bản.
    - Hỗ trợ lưu trữ ngoại tuyến (Offline Cache) vào bộ nhớ iPhone để nghe khi đi đường không có mạng 4G/5G.
  - **Không hiểu thì có chữ để đọc và chạm dịch ngay tại chỗ:** Bản dịch tiếng Việt nằm sẵn dưới mỗi câu, hoặc chạm nhẹ vào bất kỳ từ tiếng Anh nào để tra nghĩa ngay lập tức (kèm phiên âm IPA và ngữ cảnh) mà không làm trôi bài nghe.

### 1.2. Khảo sát Thị trường & Lý do Tự phát triển (Make vs. Buy)
Qua khảo sát các ứng dụng hiện có trên thị trường:
1. **Miraa (AI Transcribe & Study):** Tính năng rất sát với nhu cầu (chạy ngầm, karaoke, dịch song ngữ, A-B repeat). Tuy nhiên:
   - Bản miễn phí chỉ giới hạn 30 phút tạo phụ đề AI ban đầu.
   - Các gói trả phí định kỳ: Basic khoảng ~25.000đ/tháng (220.000 từ/tháng), Pro khoảng $5.99/tháng hoặc $49.99/năm.
2. **LingQ:** Nền tảng học qua nội dung nhập ngoài rất tốt nhưng giao diện cồng kềnh, tính phí hàng tháng cao (~$12.99/tháng).
3. **Spotify / Apple Podcasts:** Hỗ trợ podcast transcript chạy theo giây nhưng không hỗ trợ người dùng tự đưa file/kịch bản cá nhân vào, không thể bấm tra từ điển hay hiện dịch song ngữ trực tiếp.
4. **Speechify / NaturalReader:** Giọng đọc tốt nhưng thiếu tính năng phân vai hội thoại đa nhân vật tự nhiên và trải nghiệm chạm dịch không tối ưu cho người học tiếng Anh.

👉 **Quyết định của dự án:** Tự xây dựng một ứng dụng mã nguồn mở **dành riêng cho iPhone**, tận dụng các mô hình AI mã nguồn mở miễn phí 100%, không phụ thuộc vào gói thuê bao hàng tháng của bất kỳ bên thứ ba nào.

### 1.3. Định vị Nền tảng: Ứng dụng Native trên iPhone (Zero Apple Developer Fee)
- **Yêu cầu sống còn từ người dùng:** Ứng dụng phải là **Native App cài trực tiếp trên iPhone**, mở lên là dùng độc lập, KHÔNG chạy qua trình duyệt web Safari (tránh các hạn chế ngặt nghèo về âm thanh nền và thao tác trên web di động).
- **Giải pháp chi phí bản quyền 0 đồng:**
  - Thông thường, đưa app lên App Store đòi hỏi tài khoản Apple Developer Program tốn **$99/năm**.
  - Nếu cài file `.ipa` thông qua các công cụ như AltStore / Sideloadly thì bị giới hạn chứng chỉ hết hạn sau **7 ngày**, phải ký lại liên tục.
  - **Giải pháp tối ưu được lựa chọn:** Xây dựng bằng **React Native (Expo SDK)** và xuất bản dưới dạng **Expo Development Build (hoặc Local Build)**. Với phương pháp này, ứng dụng được build và cài đặt trực tiếp vào iPhone cá nhân qua cổng USB cáp sạc hoặc mạng Wi-Fi nội bộ. Ứng dụng chạy vĩnh viễn, không hết hạn 7 ngày và **hoàn toàn miễn phí 0 đồng**.

---

## 2. Nghiên cứu Hệ sinh thái Mã nguồn mở & Lựa chọn Công nghệ

Hệ thống được chia làm hai luồng xử lý dữ liệu chính:

```
[Kịch bản Text / File Audio] 
       │
       ▼
 ┌─────────────┐       HTTP / REST API       ┌────────────────────────┐
 │   Backend   │ ──────────────────────────> │   Native iOS Client    │
 │ (FastAPI +  │                             │  (React Native + RNTP  │
 │  AI Engine) │ <────────────────────────── │   + Expo trên iPhone)  │
 └─────────────┘       (JSON + Audio MP3)    └────────────────────────┘
```

### 2.1. Luồng A: Nhập Text hội thoại ➔ Sinh Giọng đọc Nhiều người & Mốc thời gian
Khi người dùng nhập vào một kịch bản trò chuyện (ví dụ: `Person A: ...` / `Person B: ...`), hệ thống cần chuyển thành giọng đọc đàm thoại tự nhiên và lấy mốc thời gian chi tiết từng từ:

| Công nghệ | Ưu điểm | Nhược điểm | Đánh giá & Ứng dụng |
| :--- | :--- | :--- | :--- |
| **`edge-tts` (Python)** | - Gọi trực tiếp Microsoft Edge Neural Voices miễn phí 100%<br>- Trả về trực tiếp sự kiện `WordBoundary` (mốc thời gian từng từ) chính xác đến mili-giây mà không cần chạy thêm mô hình tách chữ<br>- Cực nhẹ, không tốn GPU, hỗ trợ nhiều giọng đàm thoại Anh-Mỹ (Andrew, Ava, Emma, Brian...) | Cần kết nối Internet khi sinh file audio | **Lựa chọn số 1 cho Backend MVP:** Đơn giản, chuẩn xác, tạo giọng nhiều người cực tự nhiên mà không tốn tài nguyên máy chủ. |
| **`Kokoro-82M`** | - Model mã nguồn mở siêu nhẹ (82M params, ~300MB)<br>- Chạy cực nhanh trên CPU và Apple Silicon (Mac M1 Pro)<br>- Giọng đọc tiếng Anh tự nhiên hàng đầu thế giới hiện nay | Cần dùng thêm mô hình căn chỉnh âm vị (như Wav2Vec2 hoặc Faster-Whisper) để lấy mốc thời gian từng từ | **Lựa chọn dự phòng / Nâng cấp:** Dành cho chế độ Offline hoàn toàn trên máy chủ nội bộ. |
| **`Dia` (Nari Labs)** | Tự động sinh hội thoại 2 người kèm tiếng thở, tiếng cười tự nhiên | Nặng, khó đóng gói nhẹ | Xem xét ở các phiên bản thử nghiệm sau. |

### 2.2. Luồng B: Nhập File Audio MP3 sẵn có ➔ Chép lời & Bóc tách Mốc thời gian
Khi người dùng đưa vào một bài nghe MP3 có sẵn:
- **`Faster-Whisper` / `WhisperX`:** Tối ưu hóa từ OpenAI Whisper bằng CTranslate2, chạy nhanh gấp 4 lần trên chip Mac M1.
- Tích hợp kỹ thuật **Phân đoạn âm vị (Phoneme Alignment)** và **Speaker Diarization** để tách chính xác:
  - Ai đang nói (Speaker A hay Speaker B).
  - Từng câu bắt đầu ở giây nào, kết thúc ở giây nào.
  - Từng từ (`word`) có mốc thời gian `start` và `end` chi tiết.

### 2.3. Luồng C: Dịch thuật Song ngữ & Ngữ cảnh
- **Dịch cả câu:** Sử dụng thư viện `deep-translator` (kết nối Google Translate API miễn phí) hoặc gọi mô hình nhẹ Gemini Flash để dịch trước toàn bộ kịch bản sang tiếng Việt.
- **Tra từ đơn & Cụm từ:** Lưu từ điển offline hoặc truy vấn API từ điển (Free Dictionary API) để lấy loại từ (noun, verb...), phiên âm quốc tế IPA và nghĩa tương ứng trong ngữ cảnh câu thoại.

---

## 3. Nghiên cứu Kỹ thuật Chuyên sâu trên iOS Native

Đây là các bài toán kỹ thuật đặc thù của hệ điều hành iOS mà nếu không giải quyết chuẩn xác, ứng dụng sẽ thất bại khi sử dụng thực tế.

### 3.1. Quản lý Âm thanh Chạy ngầm (Background Audio) & Tránh bị iOS ngắt
- **Nguyên nhân lỗi phổ biến:** Trên iOS, nếu ứng dụng phát nhiều đoạn âm thanh nhỏ nối tiếp nhau (mỗi câu một file audio), ngay khi người dùng khóa màn hình điện thoại hoặc gạt nút Im lặng (Silent Switch), iOS sẽ thu hồi quyền chạy nền và dừng hẳn âm thanh ngay khi hết file đầu tiên.
- **Giải pháp chuyên sâu (Single Concatenated Audio Stream):**
  1. Backend sử dụng `ffmpeg` ghép toàn bộ các câu thoại của bài học thành **1 file `.mp3` duy nhất**, chèn một khoảng lặng tự nhiên (`400ms`) giữa các lượt nói của hai nhân vật.
  2. Thời gian của từng từ và từng câu được cộng dồn theo độ lệch thời gian (`time_offset`), bảo đảm khớp tuyệt đối với file âm thanh duy nhất này.
  3. Ứng dụng iPhone sử dụng thư viện **`react-native-track-player` (RNTP)**:
     - RNTP tương tác trực tiếp với tầng gốc **`AVAudioSession`** của iOS ở chế độ `.playback`.
     - Trong file `app.json`, khai báo quyền nền:
       ```json
       "ios": {
         "infoPlist": {
           "UIBackgroundModes": ["audio"]
         }
       }
       ```
     - Nhờ đó, ứng dụng được hệ điều hành đối xử như một trình phát Podcast/Nhạc chuyên nghiệp: phát xuyên suốt khi tắt màn hình, bỏ trong túi quần, hoặc khi gạt nút chuông im lặng bên hông iPhone.

### 3.2. Hỗ trợ HTTP 206 Byte-Range Requests cho iOS
- Trình phát âm thanh của iOS đòi hỏi máy chủ phải phản hồi đúng chuẩn `Accept-Ranges: bytes` (HTTP 206 Partial Content).
- Nếu Backend FastAPI chỉ trả về file dạng `FileResponse` thông thường (HTTP 200), iOS sẽ không thể tua thời gian (seek), thanh tiến độ ngoài màn hình khóa sẽ bị đơ hoặc tải lại từ đầu mỗi khi tạm dừng. Backend sẽ được lập trình riêng module Streaming hỗ trợ Range Header chuẩn RFC 7233.

### 3.3. Tích hợp Rảnh tay khi Lái xe (Lock Screen, AirPods & Apple CarPlay)
Khi người dùng đang điều khiển phương tiện trên đường, an toàn là số một. Người dùng không thể mở điện thoại ra bấm, do đó hệ thống tích hợp sâu với phần cứng qua RNTP:
- **Đẩy thông tin bài học lên Màn hình Khóa & Trung tâm điều khiển:** Hiển thị tên bài hội thoại, tên nhân vật đang nói và tiến độ thời gian.
- **Tùy biến nút bấm tai nghe (AirPods Remote Commands):**
  - Nhấn 1 lần: Tạm dừng / Tiếp tục phát (`Event.RemotePlay` / `Event.RemotePause`).
  - **Tính năng độc quyền cho việc học tiếng Anh:** Khi nhấn nút tua lùi (`Event.RemoteJumpBackward`) trên tai nghe AirPods hoặc trên vô-lăng xe hơi:
    - Thay vì tua lùi 10 giây/15 giây một cách máy móc như các app nghe nhạc, app sẽ **nhảy ngược về đúng mốc bắt đầu của câu thoại hiện tại (`currentSegment.start`)**.
    - Giúp người lái xe dễ dàng nghe lại đúng câu vừa nói mà không bị trôi bài, không cần phân tâm nhìn vào điện thoại.

### 3.4. Trải nghiệm Đọc Text Đồng bộ Thời gian thực như Spotify Lyrics (60 FPS Word Sync & Auto-scroll)
- **Mô phỏng 100% trải nghiệm xem lời bài hát (Spotify Lyrics View):**
  - Toàn bộ giao diện là màn hình tối (OLED Dark Mode `#121212`), tương phản cao giúp dễ liếc mắt nhìn khi đang dừng đèn đỏ hoặc đi bộ.
  - Khi âm thanh phát đến câu nào:
    - Câu đang nói sáng rõ với font chữ lớn (`#FFFFFF`), các câu trước và sau mờ đi (`#555555`) để người dùng không bị phân tâm.
    - **Đồng bộ từng từ (Word-level Sync):** Nhờ dữ liệu `WordBoundary` từ Backend, từ đang phát được tô nền xanh Spotify (`#1DB954`) hoặc đổi màu nổi bật ngay lập tức.
  - **Tự động cuộn thông minh (Auto-scroll):** Sử dụng `FlatList` với thuộc tính `scrollToIndex({ index, animated: true, viewPosition: 0.4 })` để tự động giữ câu thoại đang nói nằm ở 40% phần trên màn hình, giúp tầm mắt người dùng tự nhiên và không phải dùng tay vuốt màn hình khi lái xe.
  - **Chạm để nhảy phát (Tap-to-Seek):** Người dùng có thể chạm trực tiếp vào bất kỳ câu thoại nào trong danh sách để trình phát lập tức nhảy đến đúng giây bắt đầu của câu đó (`TrackPlayer.seekTo(segment.start)`).

### 3.5. Tính năng Chạm Từ Để Dịch (Tap-to-Translate) & iOS Bottom Sheet
- Mỗi từ tiếng Anh trong kịch bản là một thành phần cảm ứng (`Pressable`).
- Khi người dùng chạm vào một từ chưa hiểu:
  1. Tự động gọi `TrackPlayer.pause()` để giữ nguyên vị trí bài nghe, không bị trôi tiếng.
  2. Mở một **Bottom Sheet vuốt chuẩn iOS** (sử dụng `@gorhom/bottom-sheet`):
     - Hiển thị từ vựng dạng chữ lớn.
     - Phiên âm IPA chuẩn Anh-Mỹ.
     - Từ loại và nghĩa tiếng Việt tương ứng theo ngữ cảnh.
     - Nút "Tiếp tục nghe ▶" để tiếp tục phát ngay sau khi hiểu nghĩa.
  3. Khi người dùng vuốt đóng Bottom Sheet xuống, hệ thống tự động gọi `TrackPlayer.play()` để tiếp tục phát bài nghe liền mạch.

### 3.6. Cơ chế Quản lý Thư viện & Lưu trữ Nghe lại Mọi lúc (Offline Library & Archive)
- **Lưu trữ vĩnh viễn trên Server & Thiết bị:**
  - Mọi đoạn hội thoại sau khi được tạo ra đều được lưu lại vĩnh viễn trong thư mục lưu trữ (`backend/app/storage/`) dưới dạng cặp file: `<id>.mp3` và `<id>.json`.
  - Trên ứng dụng iPhone, màn hình Thư viện (`LibraryScreen`) cho phép:
    1. **Xem danh sách tất cả các bài hội thoại đã học:** Hiển thị tiêu đề, thời lượng (ví dụ `03:45`), số lượng câu thoại, ngày tạo.
    2. **Chọn phát lại bất kỳ bài cũ nào:** Người dùng chỉ cần chạm vào tên bài để mở lại toàn bộ âm thanh, phụ đề karaoke chạy chữ và bản dịch tiếng Việt mà không cần phải nhập lại kịch bản.
    3. **Chế độ Ngoại tuyến (Offline Mode):** Hỗ trợ nút "Tải về máy". Ứng dụng dùng `expo-file-system` tải file `.mp3` và `.json` về bộ nhớ iPhone và ghi nhận vào `AsyncStorage`. Khi đi xe vào vùng mất sóng (đường hầm, cao tốc, ngoài vùng phủ sóng 4G/5G), app tự động chuyển sang đọc file offline từ máy mà không bị gián đoạn.

---

## 4. Chuẩn hóa Cấu trúc Dữ liệu (JSON Schema)

Dữ liệu do Backend FastAPI xuất ra và gửi đến ứng dụng iPhone có định dạng JSON thống nhất như sau:

```json
{
  "conversation_id": "dialogue_commute_001",
  "title": "Daily Commute & Traffic Navigation",
  "total_duration": 48.75,
  "audio_url": "http://192.168.1.15:8000/static/audio/dialogue_commute_001.mp3",
  "offline_filename": "dialogue_commute_001.mp3",
  "speakers": {
    "Speaker A": {"name": "Alex", "voice": "en-US-AndrewNeural", "gender": "male"},
    "Speaker B": {"name": "Sarah", "voice": "en-US-AvaNeural", "gender": "female"}
  },
  "segments": [
    {
      "id": 1,
      "speaker": "Speaker A",
      "speaker_name": "Alex",
      "start": 0.0,
      "end": 3.42,
      "text_en": "Hey Sarah, are you caught in the morning rush hour too?",
      "text_vi": "Này Sarah, bạn cũng đang bị kẹt xe vào giờ cao điểm buổi sáng à?",
      "words": [
        {"word": "Hey", "start": 0.0, "end": 0.32},
        {"word": "Sarah,", "start": 0.35, "end": 0.85},
        {"word": "are", "start": 0.90, "end": 1.05},
        {"word": "you", "start": 1.08, "end": 1.25},
        {"word": "caught", "start": 1.28, "end": 1.65},
        {"word": "in", "start": 1.68, "end": 1.80},
        {"word": "the", "start": 1.82, "end": 1.95},
        {"word": "morning", "start": 1.98, "end": 2.40},
        {"word": "rush", "start": 2.45, "end": 2.75},
        {"word": "hour", "start": 2.78, "end": 3.10},
        {"word": "too?", "start": 3.15, "end": 3.42}
      ]
    },
    {
      "id": 2,
      "speaker": "Speaker B",
      "speaker_name": "Sarah",
      "start": 3.82,
      "end": 7.15,
      "text_en": "Yes, absolutely! The highway traffic is moving at a snail's pace.",
      "text_vi": "Đúng vậy luôn! Xe cộ trên đường cao tốc đang di chuyển chậm như sên bò.",
      "words": [
        {"word": "Yes,", "start": 3.82, "end": 4.20},
        {"word": "absolutely!", "start": 4.25, "end": 4.95},
        {"word": "The", "start": 5.00, "end": 5.15},
        {"word": "highway", "start": 5.18, "end": 5.65},
        {"word": "traffic", "start": 5.70, "end": 6.10},
        {"word": "is", "start": 6.12, "end": 6.25},
        {"word": "moving", "start": 6.28, "end": 6.60},
        {"word": "at", "start": 6.62, "end": 6.72},
        {"word": "a", "start": 6.74, "end": 6.80},
        {"word": "snail's", "start": 6.82, "end": 7.10},
        {"word": "pace.", "start": 7.12, "end": 7.45}
      ]
    }
  ]
}
```

---

## 5. Kiến trúc Thư mục Dự án (Monorepo)

Toàn bộ mã nguồn được tổ chức trong cấu trúc Monorepo rõ ràng:

```
audiotool/
├── backend/                              # Máy chủ xử lý AI & Âm thanh (Python FastAPI)
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes.py                 # Endpoints tiếp nhận kịch bản, upload audio, stream file
│   │   ├── services/
│   │   │   ├── tts_service.py            # Xử lý edge-tts đa nhân vật & trích xuất WordBoundary
│   │   │   ├── audio_stitcher.py         # Dùng ffmpeg gộp các câu thoại, chèn khoảng lặng 400ms & cộng dồn offset
│   │   │   ├── translation_service.py   # Dịch câu và tra cứu từ vựng
│   │   ├── storage/                      # Lưu trữ các file audio và JSON đã tạo
│   │   ├── main.py                       # Khởi tạo FastAPI với CORS và Streaming 206
│   ├── requirements.txt                  # fastapi, uvicorn, edge-tts, ffmpeg-python, deep-translator
│   └── Dockerfile                        # Đóng gói backend chạy container nếu cần
│
├── mobile-app/                           # Ứng dụng Native iOS (React Native Expo)
│   ├── src/
│   │   ├── components/
│   │   │   ├── KaraokeLine.tsx           # Dòng hội thoại có highlight từ và bản dịch tiếng Việt
│   │   │   ├── WordPressable.tsx         # Từng từ có thể chạm vào để tra nghĩa
│   │   │   ├── TranslationSheet.tsx      # Bottom Sheet hiển thị nghĩa, IPA khi chạm từ
│   │   │   ├── AudioControls.tsx         # Bộ điều khiển Play/Pause, tua lùi về đầu câu
│   │   ├── screens/
│   │   │   ├── PlayerScreen.tsx          # Màn hình chính nghe bài học (Dark Mode, chữ to)
│   │   │   ├── ImportScreen.tsx          # Màn hình dán kịch bản text hoặc chọn file
│   │   │   ├── LibraryScreen.tsx         # Danh sách bài học đã lưu offline
│   │   ├── services/
│   │   │   ├── trackPlayerService.ts     # Cấu hình AVAudioSession, Remote Events & AirPods
│   │   │   ├── storageService.ts         # Lưu trữ bài nghe offline (AsyncStorage + FileSystem)
│   │   ├── hooks/
│   │   │   ├── useKaraokeSync.ts         # Hook đồng bộ thời gian thực mốc từ/câu
│   ├── app.json                          # Cấu hình Expo iOS (bundle identifier, UIBackgroundModes)
│   ├── package.json                      # react-native, expo, react-native-track-player, @gorhom/bottom-sheet
│   └── App.tsx                           # Điểm khởi chạy ứng dụng
│
└── native_ios_english_player_complete_research.md  # Tài liệu yêu cầu & nghiên cứu này
```

---

## 6. Kế hoạch Triển khai Chi tiết (Implementation Roadmap)

Quá trình xây dựng được chia thành **4 giai đoạn cụ thể**, đảm bảo vừa code vừa kiểm thử tính năng độc lập (TDD & Verification):

### Giai đoạn 1: Xây dựng Backend Python FastAPI
1. **Viết Text Parser:** Nhận văn bản kịch bản hội thoại thô, tự động bóc tách từng lượt nói theo cấu trúc `Nhân vật: Nội dung`.
2. **Tích hợp `edge-tts`:** Gọi giọng đọc tương ứng cho từng nhân vật (ví dụ: giọng Nam `en-US-AndrewNeural`, giọng Nữ `en-US-AvaNeural`), đồng thời lắng nghe sự kiện `WordBoundary` để lấy mốc thời gian từng từ.
3. **Module Ghép Âm thanh (`audio_stitcher.py`):**
   - Sử dụng `ffmpeg` ghép các file âm thanh câu thoại thành 1 file MP3 duy nhất.
   - Thêm khoảng lặng `400ms` giữa các câu để tạo nhịp thở tự nhiên.
   - Tính toán mốc `time_offset` cộng dồn vào danh sách `segments` và `words`.
4. **Tích hợp Dịch thuật:** Tự động dịch câu sang tiếng Việt qua `deep-translator`.
5. **Cấu hình API Streaming:** Viết endpoint FastAPI hỗ trợ `HTTP 206 Partial Content` để iOS Safari/AVAudioPlayer tua âm thanh mượt mà.

### Giai đoạn 2: Khởi tạo Native App React Native (Expo) & Cấu hình Chạy ngầm iOS
1. Khởi tạo dự án Expo TypeScript với cấu hình prebuild/development build.
2. Cài đặt thư viện `react-native-track-player`.
3. Cấu hình `app.json` các cờ quyền hệ thống cho iOS:
   - `UIBackgroundModes: ["audio"]`.
   - Cấu hình AVAudioSession category `.playback`.
4. Khởi tạo `trackPlayerService.ts`: Đăng ký các remote events (`Event.RemotePlay`, `Event.RemotePause`, `Event.RemoteJumpBackward`).

### Giai đoạn 3: Xây dựng Giao diện Player, Karaoke Đồng bộ & Tra từ
1. **Thiết kế giao diện Dark Mode:** Tối ưu độ tương phản, font chữ to rõ ràng, dễ nhìn lướt qua khi đang dừng xe.
2. **Lập trình Hook `useKaraokeSync`:** Bắt vị trí âm thanh qua `useProgress()`, xác định câu và từ đang phát.
3. **Hiệu ứng Cuộn tự động:** Sử dụng `FlatList` để cuộn câu đang nói vào trung tâm màn hình mượt mà.
4. **Tích hợp Bottom Sheet tra từ:** Chạm vào bất kỳ từ nào sẽ tạm dừng âm thanh và trượt bảng nghĩa tiếng Việt lên; đóng lại sẽ tiếp tục phát.

### Giai đoạn 4: Đóng gói & Chạy thử nghiệm trên iPhone thật
1. Sử dụng lệnh `npx expo run:ios --device` (hoặc tạo Development Build qua Expo Application Services / Local CLI) để nạp app trực tiếp vào iPhone qua cáp sạc USB.
2. Kiểm tra thực tế:
   - Khóa màn hình iPhone: Âm thanh vẫn phát liên tục qua tai nghe AirPods.
   - Bấm nút trên tai nghe: Nhảy lùi về đầu câu thành công.
   - Bật sáng màn hình: Chữ lập tức bắt nhịp đúng vị trí đang nói.
   - Chạm vào từ: Mở bảng tra từ điển chính xác.
