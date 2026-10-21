#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")"

echo "========================================================"
echo "🚀 Khởi chạy Backend English Dialogue Audio API"
echo "🌐 Địa chỉ LAN cho iPhone 13 (iOS 18.1): http://${LAN_IP}:8000"
echo "📖 Tài liệu Swagger API:                 http://${LAN_IP}:8000/docs"
echo "========================================================"

cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
  echo "📦 Đang tạo môi trường ảo Python..."
  python3 -m venv venv
  ./venv/bin/pip install --upgrade pip
  ./venv/bin/pip install -r requirements.txt
fi

exec ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
