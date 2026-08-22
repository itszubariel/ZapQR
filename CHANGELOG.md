# Changelog

All notable changes to ZapQR will be documented here.

---

## [1.2.0] - 2026-08-22

### Scanner

- Scan QR codes from an image via the new Upload Image button
- Robust image decoding with multi-pass fallbacks (thresholding, inversion, rescaling) for tricky images
- Native BarcodeDetector used first on platforms that ship it (e.g. Android)

### Generator

- Fixed a critical bug where generated QR codes could not be decoded by any scanner (modules were drawn transposed)
- Pixel-snapped high-resolution PNG exports (~1100px) that are crisper and scan reliably when uploaded back

### History

- Opening a scanned entry now shows the QR code itself, same as generated entries

---

## [1.1.0] - 2026-08-21

### Scanner

- Pinch-to-zoom and button zoom (zoom in/out) for camera viewfinder
- Flashlight toggle via camera torch API
- "How it works" section removed for a cleaner scanner view
- Camera viewfinder changed to 3:4 portrait aspect ratio
- Footer pinned to bottom of scanner page

### Generator

- QR code type templates: Text, URL, Phone, WiFi, Contact, Email, SMS
- Type selector dropdown with dynamic form fields per template
- Error correction level picker (L / M / Q / H)
- Module style picker (Square / Rounded / Dots)
- Logo upload with center overlay on generated QR codes
- Logo forces error correction to High and disables lower options
- Help tooltips on Colors, Error Correction, Module Style, and Logo sections
- Default QR codes for all template types (no empty states)
- History no longer captures default/placeholder QR codes

### App

- Scrollable scanner page matching generate page behavior
- Updated About page and README with new feature descriptions

---

## [1.0.0] - 2026-08-20

### Initial Release

#### Scanner

- Real-time QR code scanning via device camera
- Loading overlay with spinner while camera initializes
- Scan result modal with copy to clipboard and open link actions
- Camera permission error state with instructions
- Pause/resume on tab switch to keep camera alive without reinitializing

#### Generator

- Live QR code preview as you type
- Custom foreground and background color pickers
- 6 preset color combinations (Ink/Paper, Paper/Ink, Zap/Paper, Black/White, White/Black, Zap/Ink)
- Download generated QR codes as PNG
- Default "zubs.me" QR shown when input is empty

#### History

- Local storage of scans and generations with QR thumbnails
- Tap to view full QR in a modal with copy and open actions
- Delete individual entries
- Relative timestamps (just now, 5m ago, 2h ago, etc.)
- Empty state with animated finder pattern

#### App

- Phone shell UI with dynamic island on desktop, edge-to-edge on mobile
- Space Grotesk + DM Sans typography with dark ink/paper/zap theme
- Animated scan line and viewfinder corners
- Toast notifications and smooth tab transitions
- Critical inline CSS to prevent flash of unstyled content on load
- PWA with offline support, installable on any device
- Native Android APK via Capacitor with signed release build
