import "./style.css";
import { initScanner, pauseScanner, resumeScanner } from "./scanner";
import { initGenerator } from "./generator";
import { initHistory } from "./history";
import { initAbout } from "./about";

document.body.style.visibility = "visible";

const content = document.getElementById("content")!;
const tabs = document.querySelectorAll(".tab");
const topSub = document.getElementById("top-sub")!;

const SUB_LABELS: Record<string, string> = {
  scan: "Scan a code",
  generate: "Create a code",
  history: "Your history",
  about: "About ZapQR",
};

let activeTab = "scan";
let scannerReady = false;

const scannerSlot = document.createElement("div");
scannerSlot.id = "scanner-slot";
content.parentNode!.insertBefore(scannerSlot, content);

function switchTab(next: string) {
  if (next === activeTab) return;

  if (activeTab === "scan") {
    pauseScanner();
    scannerSlot.classList.add("hidden");
  }

  activeTab = next;

  tabs.forEach((t) => {
    t.classList.toggle("active", (t as HTMLElement).dataset.tab === next);
  });

  topSub.textContent = SUB_LABELS[next] ?? "";
  render();
}

tabs.forEach((t) => {
  t.addEventListener("click", () => switchTab((t as HTMLElement).dataset.tab!));
});

function render() {
  document.querySelector("main")!.classList.add("scrollable");

  if (activeTab === "scan") {
    content.classList.add("hidden");
    scannerSlot.classList.remove("hidden");

    if (!scannerReady) {
      scannerReady = true;
      initScanner(scannerSlot);
    } else {
      resumeScanner();
    }
  } else {
    content.classList.remove("hidden");
    content.innerHTML = "";

    if (activeTab === "generate") initGenerator(content);
    else if (activeTab === "history") initHistory(content);
    else if (activeTab === "about") initAbout(content);
  }
}

render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
