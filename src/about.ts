export function initAbout(container: HTMLElement) {
  container.innerHTML = `
    <div class="about-page">
      <div class="about-section">
        <div class="about-heading">About ZapQR</div>
        <p class="about-text">
          ZapQR is a free, open-source QR code scanner and generator.
          No ads, no tracking, no accounts. Just scan or create QR codes instantly.
        </p>
      </div>

      <div class="about-section">
        <div class="about-heading">Features</div>
        <div class="about-feature">
          <div class="about-feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
              <line x1="7" y1="12" x2="17" y2="12"/>
            </svg>
          </div>
          <div>
            <div class="about-feature-title">QR Scanner</div>
            <div class="about-feature-desc">Scan any QR code with your camera in real time.</div>
          </div>
        </div>
        <div class="about-feature">
          <div class="about-feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="4" height="4" rx="0.5"/>
            </svg>
          </div>
          <div>
            <div class="about-feature-title">QR Generator</div>
            <div class="about-feature-desc">Create QR codes with custom colors. Download as PNG.</div>
          </div>
        </div>
        <div class="about-feature">
          <div class="about-feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4l3 3"/>
            </svg>
          </div>
          <div>
            <div class="about-feature-title">History</div>
            <div class="about-feature-desc">Keep track of your recent scans and generations.</div>
          </div>
        </div>
        <div class="about-feature">
          <div class="about-feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <div class="about-feature-title">Fully Private</div>
            <div class="about-feature-desc">Everything runs locally. No data ever leaves your device.</div>
          </div>
        </div>
      </div>

      <div class="about-section">
        <div class="about-heading">Privacy Policy</div>
        <p class="about-text">
          ZapQR does not collect, store, or transmit any personal data.
          All QR scanning is performed locally on your device using your camera.
          All generated QR codes are created entirely on-device.
          History is stored locally in your browser's storage and never leaves it.
          No cookies, no analytics, no third-party services.
        </p>
      </div>

      <div class="about-section">
        <div class="about-heading">Terms of Service</div>
        <p class="about-text">
          ZapQR is provided as-is, free of charge, for personal and commercial use.
          We are not responsible for any misuse of scanned or generated content.
          Use the app responsibly and respect the privacy of others.
        </p>
      </div>

      <div class="about-section">
        <div class="about-heading">Open Source</div>
        <p class="about-text">
          ZapQR is built with Vite, TypeScript, and Capacitor.
          The source code is available on GitHub.
        </p>
        <a class="about-link" href="https://github.com/itszubariel/ZapQR" target="_blank" rel="noopener">
          View on GitHub
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>

      <div class="about-footer">
        ZapQR v1.0.0
      </div>
    </div>
  `;
}
