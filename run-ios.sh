#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
MOBILE_DIR="$ROOT_DIR/mobile-app"

# Load Node v24 from NVM if available (required by React Native 0.88 / Expo 58)
if [ -d "$HOME/.nvm/versions/node/v24.19.0/bin" ]; then
  export PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH"
elif [ -d "$HOME/.nvm/versions/node" ]; then
  LATEST_NODE="$(ls -1 "$HOME/.nvm/versions/node" | tail -n 1)"
  export PATH="$HOME/.nvm/versions/node/$LATEST_NODE/bin:$PATH"
fi
export PATH="$HOME/homebrew/Library/Homebrew/vendor/portable-ruby/current/bin:$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")"

# Sync current Mac LAN IP into apiService.ts default
if [ -f "$MOBILE_DIR/src/services/apiService.ts" ] && [ "$LAN_IP" != "127.0.0.1" ]; then
  sed -i '' -E "s|let API_BASE_URL = 'http://[^']*';|let API_BASE_URL = 'http://${LAN_IP}:8000';|g" "$MOBILE_DIR/src/services/apiService.ts" || true
fi

echo "========================================================"
echo "📱 Khởi chạy Mobile App (iPhone 13 iOS 18.1 / Simulator)"
echo "🟢 Node version: $(node -v)"
echo "🔗 Backend LAN:  http://${LAN_IP}:8000"
echo "========================================================"

cd "$MOBILE_DIR"

MODE="${1:-start}"
if [ "$MODE" = "--device" ] || [ "$MODE" = "device" ]; then
  echo "🔌 Đang build & cài đặt Native App trực tiếp lên iPhone 13..."
  npx expo run:ios --device
elif [ "$MODE" = "--simulator" ] || [ "$MODE" = "ios" ]; then
  echo "🖥 Đang mở trên iOS Simulator..."
  npx expo start --ios
else
  echo "💡 Nhấn 'i' để mở iOS Simulator, 'w' để mở Web, hoặc quét QR từ iPhone 13 (cùng Wi-Fi)."
  echo "   (Để build Native trực tiếp vào iPhone 13 qua cáp USB: ./run-ios.sh --device)"
  npx expo start
fi
