#!/usr/bin/env bash
# Print the Subject Alternative Names (SAN) of the local HTTPS cert.
# Use this to confirm your LAN IP is in the certificate (e.g. IP Address:192.168.1.12).
#
# Usage: ./scripts/verify-https-cert.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CERT_FILE="$SCRIPT_DIR/../certificates/localhost.pem"

if [ ! -f "$CERT_FILE" ]; then
  echo "Certificate not found. Run ./scripts/create-https-cert.sh first."
  exit 1
fi

echo "Certificate SAN (hosts/IPs this cert is valid for):"
openssl x509 -in "$CERT_FILE" -noout -text | grep -A1 "Subject Alternative Name" || true
echo ""
echo "If your LAN IP (e.g. 192.168.1.12) is not listed, regenerate with:"
echo "  LAN_IP=192.168.1.12 ./scripts/create-https-cert.sh"
echo "Then restart: npm run dev:https"
