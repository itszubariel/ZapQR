import QRCode from "qrcode";
import { templates, type Template } from "./templates";

const PRESETS = [
  { fg: "#0a0a0a", bg: "#f5f2eb", label: "Ink / Paper" },
  { fg: "#f5f2eb", bg: "#0a0a0a", label: "Paper / Ink" },
  { fg: "#e63946", bg: "#f5f2eb", label: "Zap / Paper" },
  { fg: "#0a0a0a", bg: "#ffffff", label: "Black / White" },
  { fg: "#ffffff", bg: "#000000", label: "White / Black" },
  { fg: "#e63946", bg: "#0a0a0a", label: "Zap / Ink" },
] as const;

const ECL_LEVELS = [
  { value: "L", label: "L", desc: "Low" },
  { value: "M", label: "M", desc: "Medium" },
  { value: "Q", label: "Q", desc: "Quartile" },
  { value: "H", label: "H", desc: "High" },
] as const;

const MODULE_STYLES = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dots", label: "Dots" },
] as const;

const HELP = {
  colors:
    "Pick foreground and background colors for your QR code. High contrast works best for reliable scanning.",
  ecl: "Error correction adds redundancy so the QR still scans even if partially damaged or covered. Higher = more resilient. Use High (H) when adding a logo.",
  style:
    "Change the shape of each module (pixel) in the QR grid. All styles scan the same.",
  logo: "Overlay an image in the center of the QR. Automatically sets error correction to High so the code still scans.",
};

let currentFg = "#0a0a0a";
let currentBg = "#f5f2eb";
let currentEcl = "H";
let currentModuleStyle = "square";
let userEdited = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let logoImage: HTMLImageElement | null = null;
let activeTemplateId = "text";
let fieldValues: Record<string, string> = {};

export function initGenerator(container: HTMLElement) {
  container.innerHTML = `
    <div class="gen-type-area">
      <label for="qr-type">Type</label>
      <select id="qr-type" class="gen-select">
        ${templates
          .map(
            (t) =>
              `<option value="${t.id}"${
                t.id === activeTemplateId ? " selected" : ""
              }>${t.label}</option>`,
          )
          .join("")}
      </select>
    </div>

    <div class="gen-fields" id="gen-fields"></div>

    <div class="gen-colors">
      <div class="label-row">
        <div class="label">Colors</div>
        <button class="help-btn" data-tip="${
          HELP.colors
        }" aria-label="Help">?</button>
      </div>
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

    <div class="gen-section">
      <div class="label-row">
        <div class="label">Error Correction</div>
        <button class="help-btn" data-tip="${
          HELP.ecl
        }" aria-label="Help">?</button>
      </div>
      <div class="ecl-row" id="ecl-row"></div>
    </div>

    <div class="gen-section">
      <div class="label-row">
        <div class="label">Module Style</div>
        <button class="help-btn" data-tip="${
          HELP.style
        }" aria-label="Help">?</button>
      </div>
      <div class="style-row" id="style-row"></div>
    </div>

    <div class="gen-section">
      <div class="label-row">
        <div class="label">Logo</div>
        <button class="help-btn" data-tip="${
          HELP.logo
        }" aria-label="Help">?</button>
      </div>
      <button class="logo-upload-btn" id="logo-upload-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span id="logo-label">Add logo</span>
      </button>
      <input type="file" id="logo-file" accept="image/*" style="display:none" />
    </div>

    <div id="qr-output"></div>
  `;

  const fieldsEl = document.getElementById("gen-fields")!;
  const typeSelect = document.getElementById("qr-type") as HTMLSelectElement;
  const presetsEl = document.getElementById("presets")!;
  const colorFg = document.getElementById("color-fg") as HTMLInputElement;
  const colorBg = document.getElementById("color-bg") as HTMLInputElement;
  const swatchFg = document.getElementById("swatch-fg")!;
  const swatchBg = document.getElementById("swatch-bg")!;
  const swatchFgFill = document.getElementById("swatch-fg-fill")!;
  const swatchBgFill = document.getElementById("swatch-bg-fill")!;
  const eclRow = document.getElementById("ecl-row")!;
  const styleRow = document.getElementById("style-row")!;
  const logoBtn = document.getElementById("logo-upload-btn")!;
  const logoFile = document.getElementById("logo-file") as HTMLInputElement;
  const logoLabel = document.getElementById("logo-label")!;
  const output = document.getElementById("qr-output")!;

  container.querySelectorAll(".help-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const tip =
        (e.currentTarget as HTMLElement).getAttribute("data-tip") || "";
      showTooltip(e.currentTarget as HTMLElement, tip);
    });
  });

  typeSelect.addEventListener("change", () => {
    activeTemplateId = typeSelect.value;
    fieldValues = {};
    renderFields(fieldsEl, getActiveTemplate());
    renderQR(output);
  });

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
      colorFg.value = p.fg;
      colorBg.value = p.bg;
      swatchFgFill.style.background = p.fg;
      swatchBgFill.style.background = p.bg;
      updatePresetSelection(presetsEl);
      renderQR(output);
    };
    presetsEl.appendChild(btn);
  });

  ECL_LEVELS.forEach((e) => {
    const btn = document.createElement("button");
    btn.className = "ecl-btn" + (e.value === currentEcl ? " selected" : "");
    btn.textContent = e.label;
    btn.title = e.desc;
    btn.onclick = () => {
      if (btn.classList.contains("disabled")) return;
      currentEcl = e.value;
      eclRow
        .querySelectorAll(".ecl-btn")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      renderQR(output);
    };
    eclRow.appendChild(btn);
  });

  MODULE_STYLES.forEach((s) => {
    const btn = document.createElement("button");
    btn.className =
      "style-btn" + (s.value === currentModuleStyle ? " selected" : "");
    btn.textContent = s.label;
    btn.onclick = () => {
      currentModuleStyle = s.value;
      styleRow
        .querySelectorAll(".style-btn")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      renderQR(output);
    };
    styleRow.appendChild(btn);
  });

  swatchFg.onclick = () => colorFg.click();
  swatchBg.onclick = () => colorBg.click();

  colorFg.oninput = () => {
    currentFg = colorFg.value;
    swatchFgFill.style.background = colorFg.value;
    updatePresetSelection(presetsEl);
    renderQR(output);
  };

  colorBg.oninput = () => {
    currentBg = colorBg.value;
    swatchBgFill.style.background = colorBg.value;
    updatePresetSelection(presetsEl);
    renderQR(output);
  };

  logoBtn.onclick = () => {
    if (logoImage) {
      logoImage = null;
      logoLabel.textContent = "Remove logo";
      logoLabel.textContent = "Add logo";
      logoBtn.classList.remove("has-logo");
      setEclDisabled(eclRow, false);
      renderQR(output);
      return;
    }
    logoFile.click();
  };

  logoFile.onchange = () => {
    const file = logoFile.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      logoImage = img;
      logoLabel.textContent = "Remove logo";
      logoBtn.classList.add("has-logo");
      setEclDisabled(eclRow, true);
      renderQR(output);
    };
    img.src = URL.createObjectURL(file);
  };

  renderFields(fieldsEl, getActiveTemplate());
  updatePresetSelection(presetsEl);
  renderQR(output);
}

function getActiveTemplate(): Template {
  return templates.find((t) => t.id === activeTemplateId) || templates[0];
}

function renderFields(container: HTMLElement, template: Template) {
  container.innerHTML = "";

  if (template.fields.length === 0) {
    const area = document.createElement("div");
    area.className = "gen-input-area";
    const label = document.createElement("label");
    label.setAttribute("for", "qr-text");
    label.textContent = template.label;
    const textarea = document.createElement("textarea");
    textarea.id = "qr-text";
    textarea.placeholder = template.placeholder;
    textarea.value = fieldValues.text || "";
    textarea.addEventListener("input", () => {
      fieldValues.text = textarea.value;
      userEdited = true;
      const output = document.getElementById("qr-output")!;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => renderQR(output), 250);
    });
    area.appendChild(label);
    area.appendChild(textarea);
    container.appendChild(area);
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "gen-fields-form";

  template.fields.forEach((field) => {
    const group = document.createElement("div");
    group.className = "gen-field-group";

    const labelEl = document.createElement("label");
    labelEl.textContent = field.label;
    labelEl.setAttribute("for", `field-${field.key}`);

    if (field.type === "select" && field.options) {
      const select = document.createElement("select");
      select.className = "gen-select";
      select.id = `field-${field.key}`;
      field.options.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.label;
        if (fieldValues[field.key] === opt.value) option.selected = true;
        select.appendChild(option);
      });
      if (!fieldValues[field.key] && field.options[0]) {
        fieldValues[field.key] = field.options[0].value;
      }
      select.addEventListener("change", () => {
        fieldValues[field.key] = select.value;
        userEdited = true;
        renderQR(document.getElementById("qr-output")!);
      });
      group.appendChild(labelEl);
      group.appendChild(select);
    } else if (field.type === "textarea") {
      const textarea = document.createElement("textarea");
      textarea.className = "gen-textarea";
      textarea.id = `field-${field.key}`;
      textarea.placeholder = field.placeholder || "";
      textarea.value = fieldValues[field.key] || "";
      textarea.addEventListener("input", () => {
        fieldValues[field.key] = textarea.value;
        userEdited = true;
        const output = document.getElementById("qr-output")!;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => renderQR(output), 250);
      });
      group.appendChild(labelEl);
      group.appendChild(textarea);
    } else {
      const input = document.createElement("input");
      input.className = "gen-input";
      input.id = `field-${field.key}`;
      input.type = "text";
      input.placeholder = field.placeholder || "";
      input.value = fieldValues[field.key] || "";
      input.addEventListener("input", () => {
        fieldValues[field.key] = input.value;
        userEdited = true;
        const output = document.getElementById("qr-output")!;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => renderQR(output), 250);
      });
      group.appendChild(labelEl);
      group.appendChild(input);
    }

    wrapper.appendChild(group);
  });

  container.appendChild(wrapper);
}

function setEclDisabled(row: HTMLElement, disabled: boolean) {
  row.querySelectorAll(".ecl-btn").forEach((btn) => {
    if (disabled) {
      btn.classList.add("disabled");
      if (!btn.classList.contains("selected")) btn.classList.remove("selected");
    } else {
      btn.classList.remove("disabled");
    }
  });
  if (disabled) {
    currentEcl = "H";
    row.querySelectorAll(".ecl-btn").forEach((btn) => {
      btn.classList.toggle("selected", btn.textContent === "H");
    });
  }
}

let tooltipEl: HTMLElement | null = null;

function showTooltip(anchor: HTMLElement, text: string) {
  if (tooltipEl) tooltipEl.remove();
  tooltipEl = document.createElement("div");
  tooltipEl.className = "gen-tooltip";
  tooltipEl.textContent = text;
  document.body.appendChild(tooltipEl);
  const rect = anchor.getBoundingClientRect();
  tooltipEl.style.left = rect.left + "px";
  tooltipEl.style.top = rect.bottom + 6 + "px";
  tooltipEl.style.maxWidth = Math.min(260, window.innerWidth - 32) + "px";
  requestAnimationFrame(() => tooltipEl!.classList.add("active"));
  const close = (e: Event) => {
    if (!tooltipEl) return;
    if (!tooltipEl.contains(e.target as Node) && e.target !== anchor) {
      tooltipEl.remove();
      tooltipEl = null;
      document.removeEventListener("click", close);
    }
  };
  setTimeout(() => document.addEventListener("click", close), 0);
}

function updatePresetSelection(container: HTMLElement) {
  container.querySelectorAll(".preset-swatch").forEach((el, i) => {
    const p = PRESETS[i];
    el.classList.toggle("selected", p.fg === currentFg && p.bg === currentBg);
  });
}

function renderQR(output: HTMLElement) {
  const template = getActiveTemplate();
  const text = template.generate(fieldValues);

  if (!text.trim()) {
    output.innerHTML = "";
    return;
  }

  const qr = QRCode.create(text, {
    errorCorrectionLevel: currentEcl as "L" | "M" | "Q" | "H",
  });

  const canvas =
    output.querySelector("canvas") || document.createElement("canvas");
  drawQR(canvas, qr);

  if (!canvas.parentNode) {
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

    if (userEdited && text.trim()) addToHistory(text, "generate");
  }
}

function drawQR(
  canvas: HTMLCanvasElement,
  qr: { modules: { get(x: number, y: number): number; size: number } },
) {
  const size = qr.modules.size;
  const margin = 2;
  const totalModules = size + margin * 2;
  const canvasSize = 280;
  const cellSize = canvasSize / totalModules;
  const radius = cellSize * 0.35;

  canvas.width = canvasSize;
  canvas.height = canvasSize;
  canvas.style.width = canvasSize + "px";
  canvas.style.height = canvasSize + "px";

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = currentBg;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  ctx.fillStyle = currentFg;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!qr.modules.get(x, y)) continue;
      const px = (x + margin) * cellSize;
      const py = (y + margin) * cellSize;

      if (currentModuleStyle === "dots") {
        ctx.beginPath();
        ctx.arc(
          px + cellSize / 2,
          py + cellSize / 2,
          cellSize / 2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      } else if (currentModuleStyle === "rounded") {
        roundRect(ctx, px, py, cellSize, cellSize, radius);
      } else {
        ctx.fillRect(px, py, cellSize, cellSize);
      }
    }
  }

  if (logoImage) {
    const logoSize = canvasSize * 0.22;
    const logoX = (canvasSize - logoSize) / 2;
    const logoY = (canvasSize - logoSize) / 2;
    const pad = cellSize * 0.5;

    ctx.fillStyle = currentBg;
    ctx.beginPath();
    roundRectPath(
      ctx,
      logoX - pad,
      logoY - pad,
      logoSize + pad * 2,
      logoSize + pad * 2,
      cellSize,
    );
    ctx.fill();

    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fill();
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
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
