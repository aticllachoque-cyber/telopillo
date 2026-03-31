#!/usr/bin/env bash
# Create a local HTTPS certificate for the Next.js dev server so the app is
# reachable over https:// from this machine and from a device on the LAN.
#
# Prerequisites: mkcert (https://github.com/FiloSottile/mkcert)
#   Ubuntu/Debian: sudo apt install mkcert
#   Or: brew install mkcert (macOS)
#
# Usage:
#   ./scripts/create-https-cert.sh
#   LAN_IP=192.168.1.100 ./scripts/create-https-cert.sh
#
# Then run: npm run dev:https
# On the device, open https://YOUR_LAN_IP:3000 (accept the certificate once).

set -e
LAN_IP="${LAN_IP:-192.168.1.12}"
CERT_DIR="$(cd "$(dirname "$0")/.." && pwd)/certificates"
KEY_FILE="$CERT_DIR/localhost-key.pem"
CERT_FILE="$CERT_DIR/localhost.pem"

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert is not installed. Install it first:"
  echo "  Ubuntu/Debian: sudo apt install mkcert"
  echo "  macOS: brew install mkcert"
  echo "  https://github.com/FiloSottile/mkcert"
  exit 1
fi

mkdir -p "$CERT_DIR"
mkcert -install
mkcert -key-file "$KEY_FILE" -cert-file "$CERT_FILE" \
  localhost 127.0.0.1 "::1" "$LAN_IP"

echo "Certificates created:"
echo "  Key:  $KEY_FILE"
echo "  Cert: $CERT_FILE"
echo "  Hosts: localhost, 127.0.0.1, $LAN_IP"
echo ""
echo "Run the dev server with HTTPS: npm run dev:https"
echo "On your phone, open https://$LAN_IP:3000 and accept the certificate once."
