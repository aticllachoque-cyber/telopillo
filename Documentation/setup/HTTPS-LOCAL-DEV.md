# HTTPS for local development (and device testing)

Running the dev server over HTTPS avoids "connection is not secure" on the phone and lets Chrome on the device load the app without blocking.

## 1. Install mkcert (once)

- **Ubuntu/Debian:** `sudo apt install mkcert`
- **macOS:** `brew install mkcert`
- **Other:** https://github.com/FiloSottile/mkcert

## 2. Create certificates (once per machine or when LAN IP changes)

From the project root, **use your real LAN IP** (the script defaults to 192.168.1.12):

```bash
chmod +x scripts/create-https-cert.sh
./scripts/create-https-cert.sh
```

If your machine’s IP is different (e.g. 192.168.1.100), set it explicitly:

```bash
LAN_IP=192.168.1.100 ./scripts/create-https-cert.sh
```

**Important:** Do not pass a placeholder like `tu.ip` or `YOUR_IP`. The certificate must contain the actual IP the phone uses (e.g. `192.168.1.12`). Check with `hostname -I | awk '{print $1}'`.  
This creates `certificates/localhost-key.pem` and `certificates/localhost.pem`. The `certificates/` folder is in `.gitignore`; do not commit it.

## 3. Run the dev server with HTTPS

```bash
npm run dev:https
```

The server will listen on:

- **https://localhost:3000**
- **https://127.0.0.1:3000**
- **https://192.168.1.12:3000** (or the IP you passed as `LAN_IP`)

Your machine must allow connections on port 3000 from the LAN (firewall).

## 4. On the phone

1. Open **https://YOUR_LAN_IP:3000** (e.g. `https://192.168.1.12:3000`) in Chrome.
2. You may see a certificate warning (mkcert is trusted on your PC, but the phone does not have the CA). Tap **Advanced** → **Proceed to … (unsafe)** once.
3. After that, the site should load as secure.

## 5. E2E on the connected device

With the dev server running via `npm run dev:https`:

```bash
DEVICE_BASE_URL=https://192.168.1.12:3000 npm run test:device
```

Use the same IP you used when creating the cert and the one your phone uses to reach the app.

## Trust the certificate on the phone (no “Proceed” button)

On many Android devices Chrome **does not show** “Advanced” → “Proceed” for untrusted certificates. To remove the warning and load the page:

### Install the mkcert root CA on the Android device

1. **On your PC** (where you ran mkcert), create the DER certificate and send it to the phone via ADB:
   ```bash
   chmod +x scripts/push-mkcert-ca-to-device.sh
   ./scripts/push-mkcert-ca-to-device.sh
   ```
   This builds `rootCA.der.crt` and pushes it to the device’s **Download** folder.  
   Alternatively, do it manually and then copy the file (email, USB, etc.):
   ```bash
   MKCERT_ROOT=$(mkcert -CAROOT)
   openssl x509 -inform PEM -outform DER -in "$MKCERT_ROOT/rootCA.pem" -out "$MKCERT_ROOT/rootCA.der.crt"
   ```

2. **On the Android device:**
   - Open the **Settings** app → **Security** (or **Security & privacy**) → **Encryption & credentials** (or **More security settings**).
   - Tap **Install a certificate** → **CA certificate**.
   - If Android warns that this is for testing only, confirm.
   - Choose the `rootCA.der.crt` file (e.g. from Downloads).
   - Give it a name (e.g. “mkcert”) and confirm.

3. **Open Chrome** and go to `https://YOUR_LAN_IP:3000`. The connection should be trusted and the page should load without a warning.

Use this only on your own devices and for local development; do not install this CA on shared or production devices.

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| `certificates/localhost-key.pem` not found | Run `./scripts/create-https-cert.sh` first. |
| Certificate not trusted on phone | Install the mkcert root CA on the phone (see above) or use HTTP for device testing. |
| No “Proceed” / “Advanced” on phone | Install the mkcert root CA on the device (see above). |
| Different LAN IP | Run `LAN_IP=your.ip ./scripts/create-https-cert.sh`, then restart `npm run dev:https`. |
