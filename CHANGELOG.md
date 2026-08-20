# Changelog

All notable changes to ZapQR will be documented here.

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
