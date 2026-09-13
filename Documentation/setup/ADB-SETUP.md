# ADB setup for E2E on connected device

Your system already has **ADB** (Android Debug Bridge). Follow these steps so your Android device is detected.

## 1. On the Android device

You said Developer options are already enabled. Now:

1. **Enable USB debugging**
   - Settings → **Developer options** → turn on **USB debugging**.

2. **Connect the phone**
   - Use a **data-capable USB cable** (some cables are charge-only).
   - Connect the phone to your Linux machine.

3. **USB mode**
   - When the phone asks, choose **File transfer / MTP** or **PTP**, not “Charging only”.

4. **Authorize this computer**
   - A popup on the phone will say “Allow USB debugging?”.
   - Check **“Always allow from this computer”** (optional) and tap **Allow**.

## 2. On the computer (Linux)

Check that the device is seen by ADB:

```bash
adb devices
```

You should see something like:

```
List of devices attached
ABC123XYZ    device
```

- **`device`** = ready to use.
- **`unauthorized`** = accept the “Allow USB debugging?” dialog on the phone and run `adb devices` again.
- **Empty list** = cable/mode/connection issue (see below).

## 3. Optional: udev rules (if device not listed)

If the device is still not listed, your user may need permission to access it. Create a udev rule:

```bash
# Find vendor ID (e.g. 18d1 for Google, 04e8 for Samsung)
lsusb

# Create rule (replace VENDOR_ID with the idVendor from lsusb, e.g. 18d1)
echo 'SUBSYSTEM=="usb", ATTR{idVendor}=="VENDOR_ID", MODE="0666", GROUP="plugdev"' | sudo tee /etc/udev/rules.d/51-android.rules
sudo udevadm control --reload-rules
sudo udevadm trigger
```

Then unplug and replug the device and run `adb devices` again.

## 4. Verify

```bash
adb devices
adb shell getprop ro.product.model
```

The second command prints the device model if the connection is OK.

## 5. Run E2E on the device

Once `adb devices` shows your device:

```bash
DEVICE_BASE_URL=http://YOUR_LAN_IP:3000 npm run test:device
```

Replace `YOUR_LAN_IP` with your PC’s IP (e.g. `192.168.1.12`). The dev server must be running (`npm run dev`) and reachable from the phone (same Wi‑Fi or USB tethering).
