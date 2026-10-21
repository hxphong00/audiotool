# TÀI LIỆU TIẾNG VIỆT (VIETNAMESE DOCUMENTATION)
## Dự án: AudioTool - Trình Phát Hội Thoại Tiếng Anh Native trên iPhone

Chào mừng bạn đến với thư mục tài liệu tiếng Việt của dự án **AudioTool**. Đây là giải pháp luyện nghe tiếng Anh thực tế khi lái xe/di chuyển, hỗ trợ chạy ngầm màn hình khóa như Spotify, hiển thị chữ chạy theo giọng đọc (Karaoke-style), lưu trữ thư viện nghe lại và chạm từ tra nghĩa tức thì.

---

### Danh mục Tài liệu:

1. **[Nghiên cứu Kỹ thuật & Bối cảnh Kiến trúc (research_and_architecture.md)](research_and_architecture.md):**
   * Bối cảnh bài toán thực tế & so sánh các app trên thị trường (Miraa, LingQ, Spotify, Speechify).
   * Lựa chọn hệ sinh thái mã nguồn mở (`edge-tts`, `ffmpeg`, `deep-translator`).
   * Các thách thức kỹ thuật đặc thù trên iOS: Quản lý chạy ngầm qua `react-native-track-player` và `AVAudioSession`, cơ chế gộp file âm thanh đơn (Single Concatenated Stream), hỗ trợ HTTP 206 Byte-Range streaming.
   * Điều khiển rảnh tay khi lái xe với AirPods (nhảy về đầu câu vừa trôi qua).
   * Chuẩn hóa cấu trúc dữ liệu JSON Schema (`segments`, `words`).

2. **[Hướng dẫn Cấu hình Xcode & Quy trình Kiểm thử (setup_and_testing.md)](setup_and_testing.md):**
   * Hướng dẫn kích hoạt Xcode và cài CocoaPods trên máy Mac.
   * Cấu hình Apple ID cá nhân (Personal Team) miễn phí và bật Developer Mode trên iPhone.
   * Khởi chạy Backend và chạy 10 unit tests tự động.
   * Lệnh biên dịch và nạp app thẳng vào iPhone qua cáp sạc USB (`npx expo run:ios --device`).
   * 5 kịch bản kiểm thử chi tiết trên thiết bị thật.

---

### Cấu trúc 3 thành phần của Dự án:
* **`backend/` (BE):** Máy chủ Python FastAPI chịu trách nhiệm xử lý chuyển kịch bản chữ thành giọng đọc AI đa nhân vật, bóc tách mốc thời gian từng từ chuẩn mili-giây, dịch tiếng Việt và streaming HTTP 206.
* **`mobile-app/` (APP):** Ứng dụng Native iOS viết bằng React Native Expo, giao diện Dark Mode tối ưu khi lái xe, tích hợp chạy ngầm `AVAudioSession` và đồng bộ lời Karaoke.
* **`docs/` (DOC):** Tài liệu đặc tả kỹ thuật và hướng dẫn vận hành, phân chia thành 2 thư mục ngôn ngữ độc lập: `vi/` (Tiếng Việt) và `en/` (Tiếng Anh).
