#!/usr/bin/env bash
# Run visitor flows on mobile viewport with visible browser (Playwright CLI)
# Usage: ./scripts/playwright-cli-visitor-mobile.sh
# Requires: dev server at http://localhost:3000

set -e
SESSION="visitor-mobile"
URL="${BASE_URL:-http://localhost:3000}"

echo "Opening ${URL} on mobile (375x812) with visible browser..."
playwright-cli open "${URL}" --session="${SESSION}" --headed
playwright-cli -s="${SESSION}" resize 375 812

echo "Home loaded. Running visitor flow steps..."
sleep 2
# Hero search (use run-code so refs are not required)
playwright-cli -s="${SESSION}" run-code "await page.getByRole('searchbox', { name: /término de búsqueda/i }).fill('celular'); await page.getByRole('button', { name: 'Buscar', exact: true }).click();"
sleep 2
playwright-cli -s="${SESSION}" goto "${URL}/busco"
sleep 2
playwright-cli -s="${SESSION}" goto "${URL}/negocio/tienda-electronica-la-paz"
sleep 2
playwright-cli -s="${SESSION}" snapshot

echo "Done. Browser left open for inspection. Close with: playwright-cli -s=${SESSION} close"
