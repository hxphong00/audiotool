# ĐẶC TẢ KỸ THUẬT: TRIỂN KHAI CÁ NHÂN, PHÁT OFFLINE & KẾT NỐI 4G
### Project: AudioTool - Native iOS English Conversation Player
**Ngày lập:** 2026-10-21  
**Trạng thái:** Chờ người dùng duyệt (Pending Approval)  
**Thiết bị đích:** iPhone 13 (Bản tiêu chuẩn / Standard) — iOS 18.1 (Build 22B83)  
**Môi trường phát triển:** Apple Silicon Mac (`arm64`), Xcode 16.2  

---

## 1. BỐI CẢNH & YÊU CẦU NGƯỜI DÙNG (USER REQUIREMENTS)

Người dùng đặt ra 3 yêu cầu cốt lõi phục vụ nhu cầu luyện nghe tiếng Anh thực tế:
1. **Triển khai cá nhân nhanh gọn (Single-user simplicity):**
   * Hệ thống chỉ phục vụ 1 người dùng duy nhất, không yêu cầu quản lý tài khoản, cơ sở dữ liệu đám mây phức tạp hay trả phí hàng năm ($99/năm của Apple).
   * Cài đặt và vận hành đơn giản nhất có thể.

2. **Luyện nghe khi đi xe ngoài đường (Commuting Audio Player):**
   * Người dùng sử dụng app khi di chuyển, lái xe ngoài đường.
   * **Chế độ 1 - Bản tải về máy (Offline Mode):** Khi ở nhà có Wi-Fi, chỉ cần bấm tải về là toàn bộ âm thanh `.mp3` và dữ liệu lời thoại được lưu trực tiếp vào bộ nhớ trong của iPhone 13. Khi ra đường, không cần bật 4G, không sợ mất sóng, app vẫn phát liên tục, mượt mà 100%.
   * **Chế độ 2 - Bật mạng (Online 4G Mode):** Khi người dùng muốn tạo kịch bản mới khi đang ở ngoài đường, app có thể gọi về máy Mac ở nhà thông qua đường dẫn HTTPS bảo mật miễn phí (Cloudflare Tunnel).

3. **Giao diện hiển thị song ngữ trực quan:**
   * **Lời tiếng Anh:** Bôi xanh chuyển động theo từng từ phát âm chuẩn mili-giây (Word-level Karaoke highlight).
   * **Lời tiếng Việt:** Hiển thị phụ đề tiếng Việt dịch nghĩa ngay bên dưới mỗi câu để người dùng liếc nhìn hiểu ngay ngữ cảnh.
   * **Điều khiển rảnh tay an toàn:** Tương thích tai nghe AirPods (cử chỉ chạm/bóp để lùi về đầu câu vừa trôi qua) và chạy ngầm liên tục khi tắt màn hình khóa (`AVAudioSession` category `.playback`).

---

## 2. KIẾN TRÚC HỆ THỐNG & GIẢI PHÁP KỸ THUẬT

### A. Kiến trúc Triển khai (Deployment Architecture)

```
[Tại Nhà - Mạng LAN / Wi-Fi]
Máy Mac (FastAPI Backend :8000) <====(Wi-Fi / USB)===> iPhone 13 (App Native)
                     │
                     ▼
           [Cloudflare Tunnel]
                     │
                     ▼
          https://xxxx.trycloudflare.com (HTTPS Miễn phí)
                     │
[Ngoài Đường - 4G/5G] ◄────────────────────────────────┘
```

1. **Nạp App lên iPhone 13:**
   * Sử dụng chứng chỉ Apple ID cá nhân (Personal Team) thông qua Xcode 16.2.
   * Lệnh nạp: `cd mobile-app && npx expo run:ios --device`.
   * Miễn phí hoàn toàn, không tốn $99/năm.

2. **Kết nối Từ xa qua 4G (Remote Tunnel):**
   * Sử dụng công cụ mã nguồn mở chính thức của Cloudflare: `cloudflared`.
   * Lệnh khởi chạy trên Mac: `cloudflared tunnel --url http://localhost:8000`.
   * Cung cấp URL HTTPS công khai, vượt qua cơ chế kiểm duyệt bảo mật ATS (App Transport Security) của iOS 18.

---

### B. Kiến trúc Lưu trữ Ngoại tuyến trên iPhone (Offline Storage Subsystem)

Để đảm bảo nghe được khi không có mạng ngoài đường, tạo module `offlineStorageService.ts` trong `mobile-app`:

1. **Lưu trữ File Âm thanh (Audio Persistence):**
   * Sử dụng `expo-file-system`:
     * Thư mục đích: `${FileSystem.documentDirectory}dialogues/${conversation_id}.mp3`.
     * Tải file: `FileSystem.downloadAsync(serverAudioUrl, localFileUri)`.
   * Khi phát: Cấu hình `TrackPlayer.add({ url: localFileUri, ... })`.

2. **Lưu trữ Metadata & Lời Sub (Data Persistence):**
   * Sử dụng `@react-native-async-storage/async-storage`:
     * Key danh sách: `@audiotool_offline_index` (chứa mảng các ID và tiêu đề bài đã tải).
     * Key chi tiết: `@audiotool_dialogue_${conversation_id}` (chứa JSON gồm `segments`, `words`, `text_en`, `text_vi`).

3. **Cơ chế Phát Offline:**
   * Khi khởi động app hoặc khi mất kết nối mạng, danh sách "📚 Bài đã lưu" ưu tiên đọc từ bộ nhớ trong của iPhone.
   * Người dùng nhấn vào bài bất kỳ: TrackPlayer nạp trực tiếp file âm thanh nội bộ, danh sách hiển thị đầy đủ dòng tiếng Anh và phụ đề tiếng Việt bên dưới, thanh cuộn tự động canh vị trí câu đang đọc.

---

### C. Giao diện Người dùng (UI/UX)

1. **Màn hình chính (PlayerScreen):**
   * Thêm nút hành động nhanh trên thanh công cụ:
     * `⬇️ Tải về máy` (khi bài chưa được lưu cục bộ).
     * `✅ Đã lưu máy` (khi bài đã có sẵn trong bộ nhớ offline).
2. **Modal Thư viện Bài học (Saved Library Modal):**
   * Hiển thị 2 nhóm:
     * **📱 Bài trên máy (Offline):** Phát được mọi lúc mọi nơi kể cả khi bật Chế độ máy bay.
     * **☁️ Bài trên Server:** Yêu cầu kết nối Wi-Fi nhà hoặc 4G Cloudflare Tunnel.

---

## 3. KẾ HOẠCH XÁC THỰC (VERIFICATION PLAN)

| STT | Kịch bản kiểm thử | Hành động kiểm tra | Kết quả kỳ vọng |
| :--- | :--- | :--- | :--- |
| **TC1** | Tải bài về máy | Bấm nút `⬇️ Tải về` trên bài hội thoại hiện tại | File `.mp3` được ghi vào `FileSystem.documentDirectory`, trạng thái chuyển thành `✅ Đã lưu máy` |
| **TC2** | Nghe Offline hoàn toàn | Bật Chế độ máy bay (Airplane Mode) trên iPhone 13, mở app và chọn bài trong thư viện | Âm thanh phát mượt mà, lời tiếng Anh bôi xanh karaoke, phụ đề tiếng Việt hiển thị chuẩn xác |
| **TC3** | Chạy ngầm ngoài đường | Khóa màn hình iPhone 13 khi đang phát offline | Âm thanh tiếp tục chạy ngầm, widget màn hình khóa hiển thị tên bài và thanh tiến trình |
| **TC4** | Điều khiển AirPods | Bấm 3 lần (hoặc bóp cuống tai nghe AirPods) | Âm thanh nhảy lùi về đúng mốc thời gian bắt đầu của câu thoại hiện tại |
| **TC5** | Kết nối 4G từ xa | Nhập link Cloudflare Tunnel vào Settings và tắt Wi-Fi, bật 4G | iPhone tạo bài mới thành công từ xa qua mạng di động |
