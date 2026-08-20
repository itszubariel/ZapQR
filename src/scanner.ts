import { Html5Qrcode } from "html5-qrcode";

let scanner: Html5Qrcode | null = null;
let scanned = false;
let cameraReady = false;
let readyTimeout: ReturnType<typeof setTimeout> | null = null;

export function pauseScanner() {
  scanned = false;
  if (!scanner || !cameraReady) return;
  try {
    scanner.pause(true);
  } catch {}
}

export function resumeScanner() {
  if (!scanner || !cameraReady) return false;
  showOverlay(false);
  try {
    scanner.resume();
  } catch {}
  scanned = false;
  return true;
}

export function stopScanner() {
  scanned = false;
  cameraReady = false;
  if (readyTimeout) {
    clearTimeout(readyTimeout);
    readyTimeout = null;
  }
  if (!scanner) return;
  try {
    scanner.stop();
  } catch {}
  scanner = null;
}

export function initScanner(container: HTMLElement) {
  container.innerHTML = `
    <div id="scanner-screen">
      <div class="viewfinder-wrap" id="vf-wrap">
        <div id="qr-reader"></div>
        <div class="scanner-loading-overlay" id="scanner-overlay">
          <div class="scanner-spinner"></div>
        </div>
        <div class="viewfinder-overlay" id="vf-overlay">
          <div class="vf-corner tl"></div>
          <div class="vf-corner tr"></div>
          <div class="vf-corner bl"></div>
          <div class="vf-corner br"></div>
          <div class="scan-line" id="scan-line"></div>
          <div class="scan-ripple" id="scan-ripple">
            <div class="scan-ripple-ring"></div>
          </div>
        </div>
      </div>
      <div class="scan-state" id="scan-state">Point camera at a QR code</div>
      <div class="scan-info">
        <div class="scan-info-title">How it works</div>
        <div class="scan-info-item">
          <span class="scan-info-num">1</span>
          <span>Point your camera at any QR code</span>
        </div>
        <div class="scan-info-item">
          <span class="scan-info-num">2</span>
          <span>Hold steady while it detects the code</span>
        </div>
        <div class="scan-info-item">
          <span class="scan-info-num">3</span>
          <span>Copy the result or open the link</span>
        </div>
      </div>
      <div class="scan-footer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="12" height="12">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        100% local. No data leaves your device.
      </div>
    </div>
  `;

  cameraReady = false;
  scanner = new Html5Qrcode("qr-reader");
  scanned = false;

  scanner
    .start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
      (decodedText) => {
        if (scanned) return;
        scanned = true;
        showScanModal(decodedText);
        addToHistory(decodedText, "scan");
      },
      () => {},
    )
    .then(() => {
      const video = document.querySelector(
        "#qr-reader video",
      ) as HTMLVideoElement | null;
      if (!video) {
        onCameraReady();
        return;
      }

      video.muted = true;
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");

      if (video.readyState >= 3) {
        onCameraReady();
        return;
      }

      video.addEventListener("playing", () => onCameraReady(), { once: true });
      video.play().catch(() => {});

      readyTimeout = setTimeout(() => {
        if (!cameraReady) onCameraReady();
      }, 3000);
    })
    .catch(() => {
      showOverlay(false);
      const wrap = document.getElementById("vf-wrap")!;
      wrap.innerHTML = `
        <div class="cam-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M10.5 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3.5" />
            <path d="M15 3h5v5" />
            <path d="M10 14 3 7" />
          </svg>
          <div class="msg">No camera access</div>
          <div class="sub">Allow camera permissions in your browser or device settings, then reload.</div>
        </div>
      `;
      const state = document.getElementById("scan-state");
      if (state) state.style.display = "none";
    });
}

function onCameraReady() {
  if (cameraReady) return;
  cameraReady = true;
  if (readyTimeout) {
    clearTimeout(readyTimeout);
    readyTimeout = null;
  }
  showOverlay(false);
}

function showOverlay(visible: boolean) {
  const el = document.getElementById("scanner-overlay");
  if (!el) return;
  el.classList.toggle("hidden", !visible);
}

function showScanModal(text: string) {
  const isUrl = /^https?:\/\//i.test(text);
  const screen = document.getElementById("scanner-screen");
  if (!screen) return;

  const overlay = document.createElement("div");
  overlay.className = "scan-modal-overlay";
  overlay.innerHTML = `
    <div class="scan-modal">
      <div class="scan-modal-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        Code Scanned
      </div>
      <div class="scan-modal-value">${escapeHtml(text)}</div>
      <div class="scan-modal-actions">
        ${
          isUrl
            ? `<button class="scan-modal-btn primary" id="modal-open">Open Link</button>`
            : ""
        }
        <button class="scan-modal-btn" id="modal-copy">Copy</button>
        <button class="scan-modal-btn" id="modal-close">Close</button>
      </div>
    </div>
  `;

  screen.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("active"));

  const close = () => {
    overlay.classList.remove("active");
    setTimeout(() => {
      overlay.remove();
      scanned = false;
    }, 250);
  };

  document.getElementById("modal-close")!.onclick = close;
  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };

  document.getElementById("modal-copy")!.onclick = () => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  };

  if (isUrl) {
    document.getElementById("modal-open")!.onclick = () => {
      window.open(text, "_blank", "noopener");
    };
  }
}

function addToHistory(text: string, type: string) {
  const history = JSON.parse(
    localStorage.getItem("qr-history") || "[]",
  ) as Array<{
    text: string;
    time: number;
    type: string;
  }>;
  if (history.some((h) => h.text === text && h.type === type)) return;
  history.unshift({ text, time: Date.now(), type });
  if (history.length > 100) history.length = 100;
  localStorage.setItem("qr-history", JSON.stringify(history));
}

function escapeHtml(str: string): string {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function showToast(msg: string) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.querySelector(".phone-screen")?.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
