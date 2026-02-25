#!/usr/bin/env bash
# Run seller flows (16–19) on mobile viewport with visible browser (Playwright CLI).
# Usage: ./scripts/playwright-cli-seller-mobile.sh
# Requires: dev server at http://localhost:3000, seller account (seller1@test.com / TestPassword123).
# Optional: run `playwright-cli state-save --name=logged-in` once after login to skip login step.

set -e
SESSION="seller-mobile"
URL="${BASE_URL:-http://localhost:3000}"
SELLER_EMAIL="${SELLER_EMAIL:-seller1@test.com}"
SELLER_PASSWORD="${SELLER_PASSWORD:-TestPassword123}"

echo "Opening ${URL} on mobile (375x812) with visible browser..."
playwright-cli open "${URL}" --session="${SESSION}" --headed
playwright-cli -s="${SESSION}" resize 375 812
sleep 2

# Load saved auth state or open login for manual sign-in
echo "Loading auth state or opening login..."
playwright-cli -s="${SESSION}" state-load --name=logged-in 2>/dev/null || true
sleep 1
playwright-cli -s="${SESSION}" goto "${URL}/login"
sleep 2
echo "  → If not logged in: in the browser use ${SELLER_EMAIL} / ${SELLER_PASSWORD} and click Iniciar Sesión."
echo "  → When you see home or profile, press Enter here to run seller flows."
[ -t 0 ] && read -r
sleep 1

echo "--- Flow 16: Create product (/publicar) ---"
playwright-cli -s="${SESSION}" goto "${URL}/publicar"
sleep 2
playwright-cli -s="${SESSION}" snapshot

echo "--- Flow 17: Manage products (/perfil/mis-productos) ---"
playwright-cli -s="${SESSION}" goto "${URL}/perfil/mis-productos"
sleep 2
playwright-cli -s="${SESSION}" snapshot

echo "--- Flow 18: Edit product (first product edit link) ---"
playwright-cli -s="${SESSION}" run-code "await page.getByRole('link',{name:/editar/i}).first().click()"
sleep 2
playwright-cli -s="${SESSION}" snapshot

echo "--- Flow 19: Offer to demand (/busco → detail → Ofrecer) ---"
playwright-cli -s="${SESSION}" goto "${URL}/busco"
sleep 2
playwright-cli -s="${SESSION}" run-code "await page.locator('a[href^=\"/busco/\"]').nth(1).click()"
sleep 2
playwright-cli -s="${SESSION}" snapshot
playwright-cli -s="${SESSION}" run-code "await page.getByRole('button',{name:/ofrecer mi producto/i}).click()"
playwright-cli -s="${SESSION}" snapshot

echo "Done. Browser left open. Close with: playwright-cli -s=${SESSION} close"
