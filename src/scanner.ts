import { Html5Qrcode } from "html5-qrcode";

let scanner: Html5Qrcode | null = null;
let scanned = false;
let cameraReady = false;
let readyTimeout: ReturnType<typeof setTimeout> | null = null;
let videoStream: MediaStream | null = null;
let videoEl: HTMLVideoElement | null = null;
let torchOn = false;
let zoomLevel = 1;
let minZoom = 1;
let maxZoom = 1;
let useCssZoom = false;
let pinchStartDist = 0;
let pinchStartZoom = 1;

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
  torchOn = false;
  zoomLevel = 1;
  if (readyTimeout) {
    clearTimeout(readyTimeout);
    readyTimeout = null;
  }
  if (!scanner) return;
  try {
    scanner.stop();
  } catch {}
  scanner = null;
  videoStream = null;
  videoEl = null;
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
      <div class="scanner-controls" id="scanner-controls">
        <button class="scanner-ctrl-btn" id="btn-zoom-out" aria-label="Zoom out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
        <span class="zoom-label" id="zoom-label">1.0x</span>
        <button class="scanner-ctrl-btn" id="btn-zoom-in" aria-label="Zoom in">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
        <button class="scanner-ctrl-btn" id="btn-torch" aria-label="Toggle flashlight">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="torch-icon">
            <path d="M9 18h6"/>
            <path d="M10 22h4"/>
            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
          </svg>
        </button>
      </div>
      <div class="scan-state" id="scan-state">Point camera at a QR code</div>
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

      videoEl = video;
      videoStream = video.srcObject as MediaStream;
      detectZoomRange();
      setupTorchButton();
      setupZoomButtons();
      setupPinchZoom();

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
      const controls = document.getElementById("scanner-controls");
      if (controls) controls.style.display = "none";
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

function detectZoomRange() {
  if (!videoStream) return;
  const track = videoStream.getVideoTracks()[0];
  if (!track) return;
  const caps = track.getCapabilities?.() as any;
  if (caps?.zoom && caps.zoom.max > 1) {
    minZoom = caps.zoom.min;
    maxZoom = caps.zoom.max;
    useCssZoom = false;
  } else {
    useCssZoom = true;
    minZoom = 1;
    maxZoom = 5;
  }
  zoomLevel = 1;
  updateZoomLabel();
}

function setZoom(value: number) {
  const clamped =
    Math.round(Math.min(maxZoom, Math.max(minZoom, value)) * 10) / 10;

  if (useCssZoom) {
    zoomLevel = clamped;
    if (videoEl) {
      videoEl.style.transform = `scale(${zoomLevel})`;
      videoEl.style.transformOrigin = "center center";
    }
  } else {
    if (!videoStream) return;
    const track = videoStream.getVideoTracks()[0];
    if (!track) return;
    zoomLevel = clamped;
    track
      .applyConstraints({ advanced: [{ zoom: zoomLevel } as any] })
      .catch(() => {});
  }
  updateZoomLabel();
}

function updateZoomLabel() {
  const label = document.getElementById("zoom-label");
  if (label) label.textContent = `${zoomLevel.toFixed(1)}x`;
}

function setupTorchButton() {
  const btn = document.getElementById("btn-torch");
  if (!btn) return;
  btn.addEventListener("click", toggleTorch);
}

async function toggleTorch() {
  if (!videoStream) return;
  const track = videoStream.getVideoTracks()[0];
  if (!track) return;
  const caps = track.getCapabilities?.() as any;
  if (!caps?.torch) return;
  torchOn = !torchOn;
  await track
    .applyConstraints({ advanced: [{ torch: torchOn } as any] })
    .catch(() => {});
  const icon = document.getElementById("torch-icon");
  const btn = document.getElementById("btn-torch");
  if (btn) btn.classList.toggle("active", torchOn);
  if (icon) {
    if (torchOn) {
      icon.innerHTML = `<path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z"/>`;
    } else {
      icon.innerHTML = `
        <path d="M9 18h6"/>
        <path d="M10 22h4"/>
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
      `;
    }
  }
}

function setupZoomButtons() {
  const inBtn = document.getElementById("btn-zoom-in");
  const outBtn = document.getElementById("btn-zoom-out");
  if (inBtn) inBtn.addEventListener("click", () => setZoom(zoomLevel + 0.5));
  if (outBtn) outBtn.addEventListener("click", () => setZoom(zoomLevel - 0.5));
}

function setupPinchZoom() {
  const wrap = document.getElementById("vf-wrap");
  if (!wrap) return;

  wrap.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        pinchStartDist = getTouchDistance(e.touches);
        pinchStartZoom = zoomLevel;
      }
    },
    { passive: false },
  );

  wrap.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = getTouchDistance(e.touches);
        const scale = dist / pinchStartDist;
        setZoom(pinchStartZoom * scale);
      }
    },
    { passive: false },
  );
}

function getTouchDistance(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
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
