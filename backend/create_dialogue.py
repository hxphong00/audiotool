import argparse
import asyncio
import sys
from app.services.pipeline import process_dialogue

async def main():
    parser = argparse.ArgumentParser(description="Chuyển kịch bản hội thoại tiếng Anh thành âm thanh và phụ đề Karaoke")
    parser.add_argument("-t", "--title", default="Hội thoại tiếng Anh", help="Tiêu đề bài học")
    parser.add_argument("-s", "--script", help="Nội dung kịch bản (Alex: ...\\nSarah: ...)")
    parser.add_argument("-f", "--file", help="Đường dẫn file text chứa kịch bản (.txt)")
    parser.add_argument("--silence", type=float, default=0.4, help="Khoảng lặng giữa 2 câu (giây, mặc định 0.4s)")
    parser.add_argument("--ip", default="192.168.1.220", help="IP máy Mac trong mạng LAN (mặc định 192.168.1.220)")

    args = parser.parse_args()

    content = ""
    if args.file:
        with open(args.file, "r", encoding="utf-8") as f:
            content = f.read()
    elif args.script:
        content = args.script.replace("\\n", "\n")
    else:
        print("Vui lòng nhập kịch bản trực tiếp (nhấn Ctrl+D sau khi nhập xong):")
        content = sys.stdin.read()

    if not content.strip():
        print("Lỗi: Kịch bản không được để trống!")
        sys.exit(1)

    print(f"🔄 Đang xử lý kịch bản: '{args.title}'...")
    print("  1. Tạo giọng đọc AI đa nhân vật (edge-tts)...")
    print("  2. Trích xuất mốc thời gian từng từ chuẩn mili-giây...")
    print("  3. Dịch nghĩa tiếng Việt từng câu...")
    print(f"  4. Nối file âm thanh duy nhất qua FFmpeg (khoảng nghỉ {args.silence}s)...")

    base_url = f"http://{args.ip}:8000"
    res = await process_dialogue(
        script=content,
        title=args.title,
        storage_dir="app/storage",
        base_url=base_url,
        silence_sec=args.silence
    )

    print("\n✅ THÀNH CÔNG!")
    print(f"  • ID cuộc hội thoại: {res['conversation_id']}")
    print(f"  • Tổng thời lượng: {res['total_duration']}s")
    print(f"  • Số câu thoại: {len(res['segments'])}")
    print(f"  • File âm thanh đã lưu: {res['local_audio_path']}")
    print(f"  • File JSON mốc thời gian: {res['local_json_path']}")
    print(f"  • Link nghe trên app/web: {res['audio_stream_url']}")
    print("\n👉 Bạn có thể mở app AudioTool trên iPhone và bấm '📚 Bài đã lưu' để nghe bài này ngay lập tức!")

if __name__ == "__main__":
    asyncio.run(main())
