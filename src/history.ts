import QRCode from "qrcode";

interface HistoryEntry {
  text: string;
  time: number;
  type: string;
}

export function initHistory(container: HTMLElement) {
  const history: HistoryEntry[] = JSON.parse(
    localStorage.getItem("qr-history") || "[]",
  );

  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="finder-pattern">
          <div class="ring outer"></div>
          <div class="ring mid"></div>
          <div class="ring inner"></div>
        </div>
        <div class="title">No history yet</div>
        <div class="sub">Scanned and generated QR codes will show up here.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="section-title">Recent</div>
    <div class="history-list" id="history-list"></div>
  `;

  const list = document.getElementById("history-list")!;

  history.forEach((h, i) => {
    const entry = document.createElement("div");
    entry.className = "history-entry";

    const thumb = document.createElement("div");
    thumb.className = "history-thumb";

    if (h.type === "scan") {
      thumb.innerHTML = `
        <svg class="scan-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
          <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
          <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
          <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
          <line x1="7" y1="12" x2="17" y2="12"/>
        </svg>
      `;
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = 42;
      canvas.height = 42;
      thumb.appendChild(canvas);
      QRCode.toCanvas(canvas, h.text, {
        width: 42,
        margin: 0,
        color: { dark: "#0a0a0a", light: "#f5f2eb" },
      }).catch(() => {
        thumb.innerHTML = `<svg class="scan-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="4" height="4" rx="0.5"/>
        </svg>`;
      });
    }

    const info = document.createElement("div");
    info.className = "history-info";
    info.innerHTML = `
      <div class="text">${escapeHtml(h.text)}</div>
      <div class="meta">
        <span class="type-badge ${h.type}">${
      h.type === "scan" ? "Scan" : "Gen"
    }</span>
        <span>${timeAgo(h.time)}</span>
      </div>
    `;

    const del = document.createElement("button");
    del.className = "history-delete";
    del.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    `;
    del.onclick = (e) => {
      e.stopPropagation();
      history.splice(i, 1);
      localStorage.setItem("qr-history", JSON.stringify(history));
      initHistory(container);
    };

    entry.appendChild(thumb);
    entry.appendChild(info);
    entry.appendChild(del);

    entry.addEventListener("click", () => showQrPopup(h.text, h.type));
    list.appendChild(entry);
  });
}

function showQrPopup(text: string, type: string) {
  const existing = document.getElementById("qr-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "qr-modal";
  modal.className = "qr-modal";
  modal.innerHTML = `
    <div class="qr-modal-backdrop"></div>
    <div class="qr-modal-card">
      <div class="qr-modal-header">
        <span class="type-badge ${type}">${
    type === "scan" ? "Scan" : "Gen"
  }</span>
        <button class="qr-modal-close" id="modal-close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="qr-modal-body" id="modal-qr-body"></div>
      <div class="qr-modal-text">${escapeHtml(text)}</div>
      <div class="qr-modal-actions">
        <button class="btn-copy" id="modal-copy">Copy text</button>
        ${
          /^https?:\/\//i.test(text)
            ? `<button class="btn-open" id="modal-open">Open link</button>`
            : ""
        }
      </div>
    </div>
  `;

  document.querySelector(".phone-screen")!.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add("open"));

  const body = document.getElementById("modal-qr-body")!;
  const canvas = document.createElement("canvas");
  canvas.width = 220;
  canvas.height = 220;
  body.appendChild(canvas);
  QRCode.toCanvas(canvas, text, {
    width: 220,
    margin: 2,
    color: { dark: "#0a0a0a", light: "#f5f2eb" },
  });

  const close = () => {
    modal.classList.remove("open");
    setTimeout(() => modal.remove(), 200);
  };

  document.getElementById("modal-close")!.onclick = close;
  (modal.querySelector(".qr-modal-backdrop") as HTMLElement).onclick = close;

  document.getElementById("modal-copy")!.onclick = () => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  };

  const openBtn = document.getElementById("modal-open");
  if (openBtn) openBtn.onclick = () => window.open(text, "_blank", "noopener");
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
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
  document.querySelector(".phone-screen")!.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
