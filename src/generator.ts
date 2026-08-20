import QRCode from "qrcode";

const PRESETS = [
  { fg: "#0a0a0a", bg: "#f5f2eb", label: "Ink / Paper" },
  { fg: "#f5f2eb", bg: "#0a0a0a", label: "Paper / Ink" },
  { fg: "#e63946", bg: "#f5f2eb", label: "Zap / Paper" },
  { fg: "#0a0a0a", bg: "#ffffff", label: "Black / White" },
  { fg: "#ffffff", bg: "#000000", label: "White / Black" },
  { fg: "#e63946", bg: "#0a0a0a", label: "Zap / Ink" },
] as const;

const DEFAULT_QR = "zubs.me";

let currentFg = "#0a0a0a";
let currentBg = "#f5f2eb";
let currentText = "";
let userEdited = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function initGenerator(container: HTMLElement) {
  container.innerHTML = `
    <div class="gen-input-area">
      <label for="qr-text">Text or URL</label>
      <textarea id="qr-text" placeholder="Type something to generate a QR code...">${escapeHtml(
        currentText,
      )}</textarea>
    </div>

    <div class="gen-colors">
      <div class="label">Colors</div>
      <div class="color-row">
        <div class="color-pick">
          <div class="pick-label">Foreground</div>
          <button class="swatch-btn selected" id="swatch-fg" aria-label="Foreground color">
            <div class="swatch-fill" id="swatch-fg-fill" style="background:${currentFg}"></div>
          </button>
          <input type="color" class="hidden-color" id="color-fg" value="${currentFg}" />
        </div>
        <div class="color-pick">
          <div class="pick-label">Background</div>
          <button class="swatch-btn selected" id="swatch-bg" aria-label="Background color">
            <div class="swatch-fill" id="swatch-bg-fill" style="background:${currentBg}"></div>
          </button>
          <input type="color" class="hidden-color" id="color-bg" value="${currentBg}" />
        </div>
      </div>
      <div class="presets" id="presets"></div>
    </div>

    <div id="qr-output"></div>
  `;

  const textarea = document.getElementById("qr-text") as HTMLTextAreaElement;
  const output = document.getElementById("qr-output")!;
  const presetsEl = document.getElementById("presets")!;
  const colorFg = document.getElementById("color-fg") as HTMLInputElement;
  const colorBg = document.getElementById("color-bg") as HTMLInputElement;
  const swatchFg = document.getElementById("swatch-fg")!;
  const swatchBg = document.getElementById("swatch-bg")!;
  const swatchFgFill = document.getElementById("swatch-fg-fill")!;
  const swatchBgFill = document.getElementById("swatch-bg-fill")!;

  PRESETS.forEach((p) => {
    const btn = document.createElement("button");
    btn.className = "preset-swatch";
    btn.title = p.label;
    btn.innerHTML = `
      <div class="half left" style="background:${p.fg}"></div>
      <div class="half right" style="background:${p.bg}"></div>
    `;
    btn.onclick = () => {
      currentFg = p.fg;
      currentBg = p.bg;
      userEdited = true;
      colorFg.value = p.fg;
      colorBg.value = p.bg;
      swatchFgFill.style.background = p.fg;
      swatchBgFill.style.background = p.bg;
      updatePresetSelection(presetsEl);
      renderQR(textarea.value, output);
    };
    presetsEl.appendChild(btn);
  });

  swatchFg.onclick = () => colorFg.click();
  swatchBg.onclick = () => colorBg.click();

  colorFg.oninput = () => {
    currentFg = colorFg.value;
    userEdited = true;
    swatchFgFill.style.background = colorFg.value;
    updatePresetSelection(presetsEl);
    renderQR(textarea.value, output);
  };

  colorBg.oninput = () => {
    currentBg = colorBg.value;
    userEdited = true;
    swatchBgFill.style.background = colorBg.value;
    updatePresetSelection(presetsEl);
    renderQR(textarea.value, output);
  };

  textarea.addEventListener("input", () => {
    currentText = textarea.value;
    userEdited = true;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => renderQR(textarea.value, output), 250);
  });

  updatePresetSelection(presetsEl);
  renderQR(currentText, output);
}

function updatePresetSelection(container: HTMLElement) {
  container.querySelectorAll(".preset-swatch").forEach((el, i) => {
    const p = PRESETS[i];
    el.classList.toggle("selected", p.fg === currentFg && p.bg === currentBg);
  });
}

function renderQR(text: string, output: HTMLElement) {
  const trimmed = text.trim() || DEFAULT_QR;

  const existing = output.querySelector("canvas");
  if (existing) {
    QRCode.toCanvas(existing, trimmed, {
      width: 280,
      margin: 2,
      color: { dark: currentFg, light: currentBg },
    });
    return;
  }

  const canvas = document.createElement("canvas");
  QRCode.toCanvas(canvas, trimmed, {
    width: 280,
    margin: 2,
    color: { dark: currentFg, light: currentBg },
  }).then(() => {
    output.innerHTML = "";
    output.appendChild(canvas);

    const btn = document.createElement("button");
    btn.className = "btn-download";
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Download PNG
    `;
    btn.onclick = () => {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "zapqr.png";
      link.click();
    };
    output.appendChild(btn);

    if (userEdited && text.trim()) addToHistory(trimmed, "generate");
  });
}

function escapeHtml(str: string): string {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
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
