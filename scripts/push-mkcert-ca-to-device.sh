#!/usr/bin/env bash
# Build the mkcert root CA in DER form and push it to the connected Android device via ADB.
# Then on the phone: Settings → Security → Install a certificate → CA certificate → choose rootCA.der.crt from Downloads.
#
# Prerequisites: mkcert installed, ADB in PATH, one Android device connected (adb devices).
#
# Usage: ./scripts/push-mkcert-ca-to-device.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="$PROJECT_ROOT/certificates"
OUT_FILE="$OUT_DIR/rootCA.der.crt"

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert is not installed. Install it first (e.g. sudo apt install mkcert)."
  exit 1
fi

if ! command -v adb >/dev/null 2>&1; then
  echo "adb is not in PATH. Install Android platform tools and ensure the device is connected."
  exit 1
fi

MKCERT_ROOT=$(mkcert -CAROOT)
if [ ! -f "$MKCERT_ROOT/rootCA.pem" ]; then
  echo "mkcert root CA not found. Run ./scripts/create-https-cert.sh first."
  exit 1
fi

if ! adb devices | grep -q 'device$'; then
  echo "No Android device in 'device' state. Connect the device via USB and run: adb devices"
  exit 1
fi

mkdir -p "$OUT_DIR"
openssl x509 -inform PEM -outform DER -in "$MKCERT_ROOT/rootCA.pem" -out "$OUT_FILE"
echo "Created $OUT_FILE"

adb push "$OUT_FILE" /sdcard/Download/rootCA.der.crt
echo "Pushed to device: /sdcard/Download/rootCA.der.crt"
echo ""
echo "On the phone:"
echo "  1. Open Files (or Downloads) and find rootCA.der.crt"
echo "  2. Tap it, or go to Settings → Security → Install a certificate → CA certificate and select it"
echo "  3. Name it (e.g. mkcert) and confirm"
echo "  4. Then open https://YOUR_LAN_IP:3000 in Chrome"
