# ZapQR

A free, open-source QR code scanner and generator. No ads, no tracking, no accounts. Just scan or create QR codes instantly.

**Webapp:** [zapqr.zubs.me](https://zapqr.zubs.me)  
**Android App:** [zapqr.zubs.me/download](https://zapqr.zubs.me/download)

## Features

- **QR Scanner**: Scan any QR code with your camera in real time, with pinch-to-zoom and flashlight toggle
- **QR Generator**: Create QR codes with multiple type templates (Text, URL, Phone, WiFi, Contact, Email, SMS), custom colors, module styles (Square, Rounded, Dots), error correction levels, and logo overlay
- **History**: Keep track of your recent scans and generations
- **Fully Private**: Everything runs locally. No data ever leaves your device

## Privacy

ZapQR does not collect, store, or transmit any personal data. All QR scanning is performed locally on your device using your camera. All generated QR codes are created entirely on-device. History is stored locally in your browser's storage and never leaves it. No cookies, no analytics, no third-party services.

## Tech Stack

- [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [html5-qrcode](https://github.com/mebjas/html5-qrcode): camera-based QR scanning
- [qrcode](https://github.com/soldair/node-qrcode): QR code generation
- [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa): PWA support
- [Capacitor](https://capacitorjs.com/): native Android wrapper

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Android (APK)

```bash
./build-apk.sh
```

The APK will be output to `apk/ZapQR-v1.1.0.apk`.

## License

[MIT](LICENSE)
