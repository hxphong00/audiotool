# SPECIFICATION & SYSTEM DESIGN DOC
# Title: Cloud Deployment & Dual Commute Playback for AudioTool
**Date:** 2026-10-21  
**Status:** Approved for Implementation (v2 - Expanded with Commute UX & Critical Caveats)  
**Target Hardware:** iPhone 13 (Standard / Bản tiêu chuẩn) — iOS 18.1 (Build 22B83)  
**Host Machine:** Apple Silicon Mac (`arm64`), Xcode 16.2  

---

## 1. MỤC TIÊU & BỐI CẢNH YÊU CẦU NGƯỜI DÙNG (USER REQUIREMENTS)

Tài liệu này ghi nhận đầy đủ các yêu cầu thực tế trực tiếp từ người dùng:
1. **Phạm vi người dùng (Single User):** Chỉ phục vụ duy nhất 1 người dùng cá nhân. Yêu cầu triển khai tinh gọn, không phức tạp hóa hạ tầng, không phát sinh chi phí vận hành.
2. **Độc lập máy tính cá nhân (Mac cannot run 24/7):** Máy Mac không thể bật liên tục 24/7. Backend phải được deploy lên **Cloud** (chạy độc lập, ổn định, có HTTPS cho iOS).
3. **Môi trường sử dụng thực tế (Lái xe / Di chuyển ngoài đường):**
   * **Chế độ 1 - Bật mạng (4G/5G Online):** Ra đường bật 4G kết nối trực tiếp đến Cloud Backend để nghe streaming hoặc tạo bài hội thoại mới tức thì.
   * **Chế độ 2 - Bản tải về (100% Offline):** Tải trước các bài hội thoại (audio MP3 + kịch bản JSON) về bộ nhớ máy iPhone 13. Khi ra đường, tắt hoàn toàn mạng hoặc bật chế độ máy bay vẫn phát âm thanh bình thường.
4. **Trải nghiệm Nghe & Nhìn (Listening & Reading Sync):**
   * **Nghe:** Âm thanh hội thoại tự nhiên đa nhân vật (Alex nam, Sarah nữ), chạy ngầm liên tục khi tắt màn hình khóa (Spotify-like `AVAudioSession`).
   * **Nhìn:** Xem được chữ tiếng Anh chạy karaoke (bôi xanh từng từ theo mili-giây) và **phụ đề dịch tiếng Việt ngay bên dưới** từng câu thoại.
   * **Lái xe rảnh tay:** Hỗ trợ tai nghe AirPods bấm lùi câu để nghe lại câu vừa trôi qua mà không cần mở khóa điện thoại hay rời mắt khỏi đường.
5. **Cài đặt lên iPhone 13:** Sử dụng chứng chỉ Apple ID cá nhân miễn phí (không tốn phí $99/năm của Apple Developer Program).

---

## 2. KIẾN TRÚC TỔNG THỂ (SYSTEM ARCHITECTURE)

```
+-----------------------------------------------------------------------------------+
|                                  CLOUD BACKEND                                    |
|                      (Deploy trên Koyeb / Render / Fly.io)                        |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   | Docker Container (Python 3.11 + FFmpeg + FastAPI)                          |   |
|   |  - POST /api/dialogue/create   : AI sinh TTS (edge-tts) + Gộp FFmpeg      |   |
|   |  - GET  /api/dialogue/{id}      : Trả về JSON kịch bản (EN words + Sub VI)  |   |
|   |  - GET  /api/audio/{id}/stream : HTTP 206 Byte-Range MP3 Streaming        |   |
|   |  - GET  /api/dictionary/lookup : Dịch từ điển tức thì                     |   |
|   +---------------------------------------------------------------------------+   |
|         ^                                                                         |
|         | HTTPS (SSL tự động từ Cloud)                                            |
+---------|-------------------------------------------------------------------------+
          |
          | (4G/5G Online)
          v
+-----------------------------------------------------------------------------------+
|                        IPHONE 13 (BẢN TIÊU CHUẨN) - iOS 18.1                      |
|                                                                                   |
|  [ PlayerScreen (OLED Dark Mode) ]                                                |
|   ├── Dòng chữ tiếng Anh: Bôi xanh Karaoke từng từ (Word-level highlight)         |
|   ├── Dòng phụ đề tiếng Việt: Hiển thị ngay bên dưới mỗi câu thoại                |
|   ├── Chế độ Giữ sáng màn hình (Keep Awake) khi gắn giá đỡ xe                     |
|   └── Chế độ Tự động lặp lại (Auto-Loop) nghe ngấm ngữ điệu                       |
|                                                                                   |
|  [ 2 Chế độ Hoạt động ]:                                                         |
|   ├── 1. ONLINE: Stream trực tiếp từ Cloud URL qua 4G                             |
|   └── 2. OFFLINE: Đọc từ Bộ nhớ iPhone (Local Storage)                            |
|           ├── expo-file-system    ➔ Lưu file MP3 vào device storage               |
|           └── AsyncStorage        ➔ Lưu metadata JSON (lời EN + sub VI)           |
|                                                                                   |
|  [ Background & Hardware Integration ]:                                           |
|   ├── AVAudioSession (Category: Playback) ➔ Chạy ngầm khi tắt màn hình khóa       |
|   └── AirPods Remote Commands ➔ Bóp tai nghe nhảy lùi về đầu câu (currentSegment) |
+-----------------------------------------------------------------------------------+
```

---

## 3. THIẾT KẾ CHI TIẾT CÁC THÀNH PHẦN

### 3.1. Cloud Backend Service
* **Môi trường đóng gói:** `backend/Dockerfile` chạy `python:3.11-slim` tích hợp `ffmpeg`.
* **Cơ chế API:**
  * Endpoint `POST /api/dialogue/create`: Nhận kịch bản chữ, tự động nhận diện nhân vật (Alex = `en-US-AndrewNeural`, Sarah = `en-US-AvaNeural`), trích xuất mốc mili-giây từng từ (`boundary="WordBoundary"`), gọi dịch thuật tiếng Việt tự động, ghép nối FFmpeg thêm 400ms ngắt câu tự nhiên.
  * Endpoint `GET /api/audio/{id}/stream`: Hỗ trợ chuẩn RFC 7233 (HTTP 206 Partial Content) bắt buộc cho trình phát nhạc `AVPlayer` trên iOS.
* **Nền tảng Cloud lựa chọn:**
  * **Koyeb (Ưu tiên số 1):** 100% miễn phí 1 web service, **không ngủ đông (No spin-down)**, tự động cấp HTTPS, nối GitHub repo tự build Dockerfile.
  * **Render.com (Dự phòng):** Miễn phí 750 giờ/tháng, giao diện thân thiện, cấp domain `*.onrender.com`.

### 3.2. Cơ chế Lưu trữ & Tải Offline trên iPhone 13 (Offline Storage Engine)
Để giải quyết triệt để yêu cầu *"đi xe ngoài đường ... có bản tải về là có thể nghe được"*:
1. **Dịch vụ Lưu trữ Cục bộ (`storageService.ts`):**
   * Sử dụng `@react-native-async-storage/async-storage` để lưu danh sách các bài hội thoại đã tải (`OFFLINE_INDEX_KEY`).
   * Sử dụng `expo-file-system` (`FileSystem.documentDirectory + 'offline_dialogues/' + id + '.mp3'`) để tải và lưu toàn bộ file âm thanh trực tiếp vào bộ nhớ flash của iPhone 13.
2. **Nút bấm Tải về (Download Button):**
   * Trên giao diện `PlayerScreen`, bổ sung nút trạng thái:
     * Trạng thái 1: `⬇ Lưu máy` (Chưa tải)
     * Trạng thái 2: `⏳ Đang tải...` (Đang stream và ghi file)
     * Trạng thái 3: `✓ OFFLINE` (Đã có sẵn trên iPhone)
3. **Phát nhạc Offline:**
   * Khi người dùng mở mục **"📚 Thư viện"**, app hợp nhất danh sách từ server và danh sách bài đã lưu offline.
   * Khi chọn bài offline, `TrackPlayer.add` sẽ trỏ trực tiếp vào đường dẫn cục bộ `file://${localPath}` thay vì URL mạng.
   * Dữ liệu JSON kịch bản (lời tiếng Anh + phụ đề tiếng Việt) nạp ngay lập tức 0ms, không phụ thuộc vào tình trạng sóng 4G.

### 3.3. Giao diện Đồng bộ Lời & Phụ đề Tiếng Việt (KaraokeLine Component)
Đảm bảo yêu cầu: *"nghe được và xem được test tiếng ảnh và tiếng việt sub ở dưới"*:
* Mỗi lượt thoại (`DialogueSegment`) gồm:
  1. **Tên nhân vật & Màu sắc:**
     * Alex (Nam): Huy hiệu xanh dương (`#4F46E5`).
     * Sarah (Nữ): Huy hiệu hồng tím (`#EC4899`).
  2. **Dòng lời tiếng Anh (Karaoke):**
     * Từ chưa đọc: Màu xám bạc (`#94A3B8`).
     * Từ đang đọc: Nổi bật màu xanh neon (`#10B981`), in đậm, có vệt sáng nhẹ (Spotify/Apple Music lyric style).
     * Từ đã đọc qua: Màu trắng sáng (`#FFFFFF`).
  3. **Dòng phụ đề tiếng Việt (Subtitle):**
     * Đặt cố định ngay bên dưới câu tiếng Anh.
     * Cỡ chữ 14pt, màu xám nhạt tự nhiên (`#CBD5E1`), giúp người học liếc nhanh hiểu nghĩa mà không gây rối mắt khi lái xe.
  4. **Tương tác chạm (Tap-to-Seek & Tap-to-Translate):**
     * Chạm vào cả dòng: Nhảy âm thanh tới đúng câu đó (`TrackPlayer.seekTo(segment.start)`).
     * Chạm riêng vào một từ: Mở bottom sheet tra nghĩa chi tiết của từ đó (kèm phiên âm IPA, từ loại, ngữ cảnh).

### 3.4. Tối ưu khi Lái xe (AirPods & Lock Screen)
* **Khóa màn hình (Lock Screen):** Tích hợp `NowPlaying` hiển thị tiêu đề bài hội thoại, tên nhân vật đang nói (`🎙 Alex — English Commute`), thanh tiến trình thời gian và điều khiển Play/Pause.
* **Cử chỉ tai nghe AirPods (Remote Command):**
  * Bắt sự kiện `Event.RemoteJumpBackward` và `Event.RemotePrevious`.
  * Thay vì lùi 15 giây mù quáng, app tính toán mốc thời gian của câu hiện tại (`currentSegment.start`) và lùi chính xác về đầu câu thoại đang nghe để người dùng nghe lại trọn vẹn câu thoại.

### 3.5. Tính năng Bổ trợ Trải nghiệm Đi xe (Commute UX Enhancements)
1. **Giữ sáng màn hình (Keep Awake Mode):**
   * *Bối cảnh:* Khi gắn iPhone 13 lên giá đỡ ô tô/xe máy, iOS sẽ tự tắt màn hình sau 30s nếu không có tương tác, làm người lái không liếc xem được lời karaoke khi dừng đèn đỏ.
   * *Giải pháp:* Tích hợp `expo-keep-awake` với nút toggle bật/tắt (icon ☀️) trực tiếp trên giao diện Player.
2. **Chế độ Tự động Lặp lại (Auto-Loop / Repeat Mode):**
   * *Bối cảnh:* Bài hội thoại đi xe có thời lượng vàng 1–3 phút. Người luyện nghe cần nghe đi nghe lại bài học 5–10 lần liên tục để ngấm ngữ điệu mà không thể thò tay bấm Play lại khi đang cầm vô lăng.
   * *Giải pháp:* Nút toggle chế độ lặp (icon 🔁: Off ➔ Repeat 1 bài). Khi playback kết thúc, tự động tua về 0 và phát tiếp.
3. **Thanh kéo tua thời gian (Audio Scrubber Slider):**
   * Hiển thị thanh tiến trình mảnh màu xanh neon ở chân màn hình, hỗ trợ kéo tua mượt mà khi nghe các bài dài trên 3 phút.

---

## 4. CÁC LƯU Ý SỐNG CÒN & QUY TẮC VẬN HÀNH (CRITICAL CAVEATS)

### ⚠️ Lưu ý 1: Hạn Chứng chỉ 7 Ngày của Apple ID Cá nhân Miễn phí
* **Thực tế:** Không trả $99/năm cho Apple đồng nghĩa với việc profile cài qua Xcode sẽ hết hạn sau **đúng 7 ngày**. Khi hết hạn, mở app sẽ báo "App is no longer available".
* **Quy trình gia hạn:** Cứ mỗi cuối tuần, cắm cáp USB nối iPhone 13 vào máy Mac và chạy:
  ```bash
  cd mobile-app && npx expo run:ios --device
  ```
  *(Mất ~30 giây. Toàn bộ các bài đã tải Offline trong máy **được bảo toàn 100%**, không bị xóa mất).*

### ⚠️ Lưu ý 2: Kích hoạt Developer Mode & Trust Certificate trên iOS 18
* Khi nạp app lần đầu lên iPhone 13:
  1. Vào **Cài đặt > Quyền riêng tư & Bảo mật > Chế độ nhà phát triển (Developer Mode)** ➔ Bật (On) ➔ Khởi động lại iPhone.
  2. Sau khi khởi động lại, vào **Cài đặt > Cài đặt chung > Quản lý VPN & Thiết bị > Apple Development** ➔ Bấm **Tin cậy (Trust)**.

### ⚠️ Lưu ý 3: Lưu trữ Tạm trên Cloud (Ephemeral Storage) vs Lưu trữ Offline iPhone
* **Thực tế:** Nền tảng Cloud miễn phí (Render / Koyeb) sử dụng ổ cứng tạm thời (ephemeral disk). Khi dịch vụ restart hoặc deploy phiên bản mới, các file `.mp3` cũ trên server có thể bị xóa.
* **Chiến lược đối phó:** Nút **"⬇ Lưu máy"** trên iPhone là chốt chặn an toàn số 1. Ngay khi tạo bài xong, người dùng bấm "Lưu máy" để file MP3 và kịch bản nằm vĩnh viễn trong bộ nhớ flash của iPhone 13.

### ⚠️ Lưu ý 4: Độ dài Kịch bản Khuyến nghị (Golden Script Length)
* **Khuyến nghị:** Kịch bản tối ưu nhất là từ **6 đến 20 câu thoại (thời lượng 1 đến 3 phút)**.
* **Lý do:** Thời gian AI sinh âm thanh chỉ mất 2-3 giây, độ dài vừa vặn để nghe lặp lại 4-5 lần trong một chặng đường ngắn, tối ưu hóa khả năng ghi nhớ của não bộ khi tham gia giao thông.

---

## 5. KẾ HOẠCH TRIỂN KHAI THỰC HÀNH (STEP-BY-STEP WORKFLOW)

### Giai đoạn 1: Deploy Backend lên Cloud (Koyeb / Render)
1. Đẩy code lên GitHub repository cá nhân.
2. Tạo Service mới trên Koyeb, chọn Dockerfile trong thư mục `backend/`.
3. Lấy URL HTTPS Cloud (ví dụ: `https://audiotool-backend.koyeb.app`).

### Giai đoạn 2: Nạp App vào iPhone 13 Thường
1. Cấu hình URL Cloud mặc định trong `apiService.ts`.
2. Bật Developer Mode trên iPhone 13 (iOS 18.1).
3. Chạy `cd mobile-app && npx expo run:ios --device` để nạp app qua USB bằng tài khoản Apple ID cá nhân.

### Giai đoạn 3: Kiểm thử Chế độ Ngoài đường
1. **Kiểm thử Online (4G):** Tắt Wi-Fi trên iPhone 13, bật 4G, mở app tạo 1 bài hội thoại mới ➔ Xác nhận backend sinh bài và phát qua 4G thành công.
2. **Kiểm thử Offline:** Bấm "⬇ Lưu máy" bài vừa tạo ➔ Bật Chế độ máy bay (Airplane Mode) trên iPhone 13 ➔ Mở mục "📚 Thư viện" ➔ Bấm phát ➔ Xác nhận âm thanh phát mượt mà, lời tiếng Anh bôi xanh và phụ đề tiếng Việt hiển thị 100%.
3. **Kiểm thử Keep Awake & Loop:** Bật Giữ sáng màn hình ➔ Đặt lên giá đỡ xe ➔ Bật Loop bài học ➔ Xác nhận màn hình không tắt và bài học tự phát lại khi kết thúc.
