# E2E on a connected device (Android)

Run a short end-to-end flow on a **physical Android device** connected via USB.

## Prerequisites

1. **Android device**
   - USB debugging enabled (Settings → Developer options).
   - Chrome 87 or newer installed.
   - In Chrome: `chrome://flags` → enable **"Enable command line on non-rooted devices"**.

2. **ADB (Android Debug Bridge)**
   - Install [Android platform tools](https://developer.android.com/studio/releases/platform-tools) or use Android Studio’s ADB.
   - Device connected via USB and authorized: run `adb devices` and confirm one device is listed.

3. **App reachable from the device**
   - Start the dev server: `npm run dev`.
   - Use your machine’s **LAN IP** as the app URL (the device cannot use `localhost`). Example: `http://192.168.1.12:3000`.
   - Ensure the phone and the dev machine are on the same Wi‑Fi (or use USB tethering / port forwarding if you prefer).
   - **Check:** Open `http://YOUR_IP:3000` directly in the phone’s browser; if the app loads, you’re good to run the E2E script.

4. **“Connection is not secure” on mobile (no “Proceed” option)**
   - Chrome on Android often **does not show** “Advanced” → “Proceed” for HTTP. Try one of these:
   - **Option A – Type bypass:** With the error page visible, tap the page (so the focus is on it), then type exactly: **`thisisunsafe`** (no spaces, no tap in a box). On some versions the page then loads.
   - **Option B – Firefox on the device:** Install Firefox for Android and open `http://YOUR_IP:3000`. Firefox often shows “Advanced” → “Accept the Risk and Continue” for insecure sites.
   - **Option C – Chrome flags (device):** In Chrome on the phone open `chrome://flags`, search for **“insecure”** or **“certificate”**, enable **“Remember certificate error decisions”**, restart Chrome, then try the URL again.
   - **Option D – No button to tap:** If there is no “Proceed” or “Advanced” at all: **(1)** Install the mkcert root CA on the phone so Chrome trusts your HTTPS (see **Documentation/HTTPS-LOCAL-DEV.md** → “Trust the certificate on the phone”); or **(2)** use HTTP: `npm run dev` and `DEVICE_BASE_URL=http://YOUR_IP:3000 npm run test:device` so the script opens the app over HTTP (no cert warning).

## Install Playwright Android support (once)

```bash
npx playwright install android
```

## Run E2E on the device

Set the URL the device will use to open the app (your machine’s IP + port), then run the script.

**Use HTTP for the device test:** Chrome launched by Playwright uses a different profile and may not trust your installed CA, so the automated test can show "Connection is not secure" or about:blank even when HTTPS works in your normal browser. Start the server with `npm run dev` (not `dev:https`), then run:

```bash
DEVICE_BASE_URL=http://YOUR_LAN_IP:3000 npm run test:device
```

Example (replace with your IP):

```bash
DEVICE_BASE_URL=http://192.168.1.12:3000 npm run test:device
```

**Run a specific flow** (matches existing test plans in `tests/playwright-cli/` and `tests/e2e/`):

| FLOW | Steps |
|------|--------|
| `visitor` (default) | Home → Search "celular" → Busco → first demand detail |
| `buyer` | Home → Search "celular" → first product detail |
| `demand` | Home → Busco → first demand detail |

```bash
FLOW=buyer DEVICE_BASE_URL=http://192.168.1.12:3000 npm run test:device
FLOW=demand DEVICE_BASE_URL=http://192.168.1.12:3000 npm run test:device
```

Or run the script directly:

```bash
DEVICE_BASE_URL=http://192.168.1.12:3000 node scripts/e2e-connected-device.mjs
```

## What the script does

1. Connects to the first Android device detected by ADB.
2. Launches Chrome on the device.
3. Opens `DEVICE_BASE_URL` (your app).
4. Asserts the home heading is visible and saves `test-results/device-home.png`.
5. Runs the chosen **FLOW** (visitor, buyer, or demand) and saves screenshots to `test-results/device-*.png`.

## Troubleshooting

| Issue | Action |
|-------|--------|
| `ECONNREFUSED 127.0.0.1:5037` | ADB is not running. Start it (e.g. run `adb devices` once) or install platform tools. |
| No Android device found | Connect the device via USB, enable USB debugging, accept the authorization dialog on the device, run `adb devices`. |
| Page does not load / timeout | Use `DEVICE_BASE_URL` with your machine’s LAN IP. Ensure dev server is running and the device can reach that IP (same network). |
| **“Connection is not secure” (mobile)** | Chrome Android often has no “Proceed”. Try: type **thisisunsafe** on the error page; or use **Firefox** on the device; or see doc section 4 for Chrome flags / HTTPS. |
| Chrome flag not found | Update Chrome on the device; the flag name may vary by version. |
| **Launch timeout: Chrome did not start in time** | Playwright’s Android support is experimental; `launchBrowser()` can hang or timeout on some devices. Enable Chrome flag “Enable command line on non-rooted devices”, try `SKIP_CHROME_LAUNCH_ARGS=1`, ensure device is unlocked. **Workaround:** open the app on the phone from the PC: `adb -s DEVICE_SERIAL shell am start -a android.intent.action.VIEW -d "http://YOUR_IP:3000" com.android.chrome` (serial from `adb devices`). Then test manually on the device. |

## Using HTTPS (recommended for device testing)

To avoid “connection is not secure” and about:blank on the device, run the app over HTTPS and point the device at it:

1. **Create certificates (once):** `./scripts/create-https-cert.sh` (use `LAN_IP=your.ip` if different from 192.168.1.12).
2. **Start the dev server with HTTPS:** `npm run dev:https`.
3. **On the device:** Open `https://YOUR_LAN_IP:3000`, accept the certificate warning once.
4. **Run E2E:** `DEVICE_BASE_URL=https://YOUR_LAN_IP:3000 npm run test:device`.

See **Documentation/HTTPS-LOCAL-DEV.md** for full steps.

## Run all E2E tests with mobile viewport (PC)

To run **all** tests in `tests/e2e/` with a **mobile viewport** (iPhone 13) in the browser on your PC:

```bash
npm run test:e2e:mobile
```

Headed: `npm run test:e2e:mobile:headed`

## Optional: run full E2E suite on device

Playwright’s Android support is **experimental**. The script above runs a single flow. To run the full test suite against the device you would need a custom fixture that connects to the Android browser context (e.g. via `playwright._android` and `device.launchBrowser()`) and injects that into the test runner; that is not set up by default in this project.
