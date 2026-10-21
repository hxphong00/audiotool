#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
chmod +x "$ROOT_DIR/start-backend.sh" "$ROOT_DIR/run-ios.sh"

cleanup() {
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo ""
    echo "🛑 Đang dừng Backend server (PID $BACKEND_PID)..."
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# Kill any old process occupying port 8000
OLD_PID="$(lsof -ti tcp:8000 2>/dev/null || true)"
if [ -n "$OLD_PID" ]; then
  echo "♻️ Đang giải phóng cổng 8000 (PID $OLD_PID)..."
  kill -9 $OLD_PID 2>/dev/null || true
fi

"$ROOT_DIR/start-backend.sh" &
BACKEND_PID=$!

sleep 2
"$ROOT_DIR/run-ios.sh" "$@"
