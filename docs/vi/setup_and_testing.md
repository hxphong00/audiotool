# HƯỚNG DẪN CẤU HÌNH XCODE, HỆ THỐNG VÀ QUY TRÌNH TEST LÊN IPHONE THẬT
### (Project: Native iOS English Dialogue Player - AudioTool)

Tài liệu này hướng dẫn chi tiết từng bước từ cấu hình Xcode vừa tải về, kết nối iPhone cá nhân không tốn phí $99/năm, cho đến quy trình chạy thử nghiệm toàn diện hệ thống.

---

## BƯỚC 1: Hoàn tất Kích hoạt Xcode trên máy Mac

Máy Mac của bạn đã có **Xcode 16.2** tại `/Applications/Xcode.app`. Hãy chạy lệnh sau trên Terminal để chấp nhận thỏa thuận bản quyền và kích hoạt bộ công cụ lập trình:

```bash
# 1. Chấp nhận bản quyền Xcode (nhập mật khẩu máy Mac khi được hỏi)
sudo xcodebuild -license accept

# 2. Cài đặt CocoaPods (trình quản lý thư viện gốc iOS bắt buộc cho React Native)
sudo gem install cocoapods
```

> **Lưu ý:** Mở ứng dụng **Xcode** từ Launchpad hoặc thư mục `/Applications/Xcode.app` một lần đầu tiên để Xcode tự động nạp các gói component bổ trợ (iOS 17/18 Simulator platform).

---

## BƯỚC 2: Cấu hình Apple ID & Chế độ Nhà phát triển trên iPhone

### 1. Đăng nhập Apple ID miễn phí vào Xcode
1. Mở **Xcode** trên máy Mac.
2. Trên thanh menu trên cùng, chọn **Xcode > Settings...** (hoặc nhấn phím tắt `⌘ ,`).
3. Chuyển sang thẻ **Accounts**.
4. Nhấn dấu cộng **`+`** ở góc dưới bên trái ➔ Chọn **Apple ID** ➔ Nhập tài khoản iCloud / Apple ID cá nhân của bạn.
5. Sau khi đăng nhập thành công, bạn sẽ thấy xuất hiện một mục tên **Personal Team** (đây là chứng chỉ miễn phí để nạp app thẳng vào iPhone mà không tốn $99/năm).

### 2. Kích hoạt Developer Mode trên iPhone
1. Dùng cáp sạc USB kết nối iPhone vào máy Mac.
2. Trên màn hình iPhone, nếu có bảng hỏi "Tin cậy máy tính này?", hãy bấm **Tin cậy (Trust)** và nhập mật khẩu mở khóa iPhone.
3. Trên iPhone, vào **Cài đặt (Settings) ➔ Quyền riêng tư & Bảo mật (Privacy & Security)**.
4. Cuộn xuống dưới cùng, chọn **Chế độ nhà phát triển (Developer Mode)**.
5. Gạt công tắc sang **Bật (On)** ➔ iPhone sẽ yêu cầu khởi động lại máy.
6. Sau khi iPhone khởi động lại, bấm **Bật (Turn On)** và nhập mật khẩu để xác nhận.

---

## BƯỚC 3: Khởi động Backend & Kiểm tra API

Backend Python (FastAPI + Microsoft Edge Neural TTS + FFmpeg 6.0) đảm nhiệm việc sinh file âm thanh, tạo mốc thời gian từng từ và dịch nghĩa tiếng Việt.

### 1. Khởi động Backend
Mở một cửa sổ Terminal và chạy:

```bash
cd /Users/hoangphong/Documents/audiotool/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Kiểm tra nhanh Backend
* Mở trình duyệt trên máy Mac, truy cập:
  * Kiểm tra trạng thái máy chủ: `http://localhost:8000/api/health` ➔ Trả về `{"status":"ok"}`.
  * Xem danh sách bài hội thoại mẫu: `http://localhost:8000/api/dialogue`.
* **Địa chỉ IP mạng LAN của máy Mac:** Hiện tại máy Mac của bạn có IP là `192.168.1.220`. Ứng dụng iPhone sẽ kết nối vào `http://192.168.1.220:8000` (đã được cấu hình mặc định sẵn).

### 3. Chạy bộ kiểm thử tự động (Unit Tests)
Trong thư mục `backend`, chạy:

```bash
pytest tests/ -v
```
*(Tất cả 10/10 bài test về TTS, FFmpeg nối file âm thanh, tính toán mốc thời gian và HTTP 206 Streaming đều phải PASS xanh).*

---

## BƯỚC 4: Biên dịch & Nạp Ứng dụng vào iPhone

### 1. Chuẩn bị mã nguồn iOS gốc (Prebuild)
Mở cửa sổ Terminal thứ hai và chạy:

```bash
cd /Users/hoangphong/Documents/audiotool/mobile-app

# Sinh thư mục ios/ chứa mã nguồn Xcode gốc
npx expo prebuild --platform ios
```

### 2. Cấu hình Signing Team (Chữ ký số miễn phí)
1. Mở thư mục dự án Xcode vừa sinh ra:
   ```bash
   open ios/AudioTool.xcworkspace
   ```
2. Trong Xcode, ở cây thư mục bên trái, nhấn vào dòng đầu tiên **AudioTool** (biểu tượng dự án màu xanh).
3. Ở khung chính giữa, chọn tab **Signing & Capabilities**.
4. Tích chọn **Automatically manage signing**.
5. Tại mục **Team**, bấm chọn tài khoản **Apple ID (Personal Team)** của bạn đã thêm ở Bước 2.
6. Nếu Xcode báo lỗi Bundle Identifier bị trùng, bạn chỉ cần sửa nhẹ `Bundle Identifier` (ví dụ: `com.hoangphong.audiotool.app`).

### 3. Nạp ứng dụng lên iPhone thật
Vẫn cắm cáp kết nối iPhone với máy Mac, chạy lệnh sau trong thư mục `mobile-app`:

```bash
npx expo run:ios --device
```
* Terminal sẽ liệt kê tên chiếc iPhone của bạn (ví dụ: `iPhone của Phong`), bạn chọn thiết bị đó.
* Xcode sẽ tự động biên dịch ứng dụng và cài trực tiếp icon **AudioTool** lên màn hình chính iPhone của bạn.

### 4. Cấp quyền tin cậy ứng dụng trên iPhone (Lần đầu tiên)
Khi app vừa cài xong, nếu bấm vào icon bị báo "Nhà phát triển không đáng tin cậy":
* Trên iPhone, vào **Cài đặt ➔ Cài đặt chung ➔ Quản lý VPN & Thiết bị**.
* Nhấp vào email Apple ID của bạn ở mục *Ứng dụng nhà phát triển*.
* Chọn **Tin cậy (Trust) "[Email của bạn]"**.
* Quay lại màn hình chính và mở app **AudioTool** lên!

---

## BƯỚC 5: Quy trình Test Thử nghiệm Hệ thống (Test Scenarios)

Sau khi mở ứng dụng trên iPhone, hãy thực hiện kiểm thử theo 5 kịch bản sau:

### ✅ Kịch bản 1: Kiểm tra Đọc Text Karaoke như Spotify
1. Mở bài nghe mẫu *"Morning Commute & Highway Traffic"*.
2. Nhấn nút **Play ▶**:
   * Âm thanh phát rõ ràng qua loa/tai nghe iPhone.
   * Giọng đọc đến đâu, từ tiếng Anh đó sáng rực màu xanh Spotify (`#1DB954`).
   * Bản dịch tiếng Việt hiển thị ngay bên dưới câu.
   * Màn hình tự động cuộn (Auto-scroll) giữ câu đang nói luôn ở tầm mắt.
3. Chạm vào một câu bất kỳ trong danh sách ➔ Âm thanh lập tức nhảy đến đúng câu đó để phát.

### ✅ Kịch bản 2: Kiểm tra Chạm từ để Tra từ điển (Tap-to-Translate)
1. Trong lúc bài nghe đang phát, chạm vào một từ bất kỳ (ví dụ: từ `traffic` hoặc `highway`).
2. **Kỳ vọng:**
   * Âm thanh tự động tạm dừng (`Pause`) ngay lập tức để không bị trôi tiếng.
   * Bảng trượt iOS Bottom Sheet hiện lên từ dưới màn hình với từ tiếng Anh to rõ và nghĩa tiếng Việt tương ứng.
3. Bấm nút **Tiếp tục nghe ▶** hoặc vuốt đóng bảng ➔ Âm thanh tiếp tục phát bình thường.

### ✅ Kịch bản 3: Kiểm tra Chạy ngầm khi Khóa Màn hình (Spotify Background Mode)
1. Đeo tai nghe Bluetooth (AirPods hoặc tai nghe bất kỳ).
2. Nhấn nút nguồn bên hông iPhone để **Khóa màn hình (Lock Screen)** và đút máy vào túi quần.
3. **Kỳ vọng:**
   * Âm thanh vẫn phát liên tục qua tai nghe, không bị ngắt.
   * Bật sáng màn hình khóa: Widget Lock Screen hiển thị tên bài học, tên người nói và thanh tua thời gian.
4. **Kiểm tra nút bấm tai nghe rảnh tay:** Bấm nút tua lùi (hoặc chạm cảm ứng lùi trên AirPods):
   * Thay vì tua 10 giây máy móc, app **nhảy ngược về đúng đầu câu thoại hiện tại** để bạn nghe lại câu vừa rồi một cách rảnh tay.

### ✅ Kịch bản 4: Kiểm tra Thư viện bài học & Nghe lại
1. Trên thanh Header của app, bấm nút **`📚 Bài đã lưu`**.
2. Danh sách các bài học đã tạo trên máy chủ sẽ hiện lên kèm thời lượng và số câu.
3. Chạm vào một bài bất kỳ ➔ Ứng dụng nạp toàn bộ âm thanh và lời karaoke để nghe lại ngay lập tức mà không cần tạo lại.

### ✅ Kịch bản 5: Nhập kịch bản hội thoại mới từ iPhone
1. Bấm nút **`⚙ Cài đặt`** ở góc phải màn hình.
2. Dán một đoạn kịch bản hội thoại tiếng Anh bất kỳ, ví dụ:
   ```text
   Alex: Hi Sarah, are you going to the tech conference this weekend?
   Sarah: Yes I am! I bought my ticket yesterday.
   Alex: Awesome, let's go together!
   ```
3. Nhấn **`Tạo bài nghe & Đồng bộ`**.
4. **Kỳ vọng:** Backend trên Mac tự động phân vai giọng Nam - Nữ, ghép file âm thanh, tạo mốc thời gian và nạp ngay bài học mới vào iPhone để bạn nghe lập tức.

---

## BƯỚC 6: Xử lý sự cố thường gặp (Troubleshooting)

| Tình huống | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| App trên iPhone báo không kết nối được Backend | iPhone và Mac không cùng mạng Wi-Fi, hoặc sai IP | 1. Đảm bảo iPhone và Mac cùng bắt một mạng Wi-Fi.<br>2. Kiểm tra IP của Mac bằng lệnh `ipconfig getifaddr en0`.<br>3. Mở mục `⚙ Cài đặt` trong app nhập lại IP: `http://<IP-Mac>:8000`. |
| Lệnh `xcodebuild -license` báo lỗi quyền | Chưa dùng quyền root | Chạy lại với tiền tố `sudo`: `sudo xcodebuild -license accept`. |
| Lệnh `npx expo run:ios` không tìm thấy iPhone | Chưa bật Developer Mode hoặc chưa cắm cáp nhận diện | Cắm lại cáp, mở khóa iPhone, chọn "Tin cậy máy tính", và kiểm tra Developer Mode đã BẬT trong Cài đặt iPhone. |
