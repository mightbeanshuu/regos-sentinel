/** Dump visible prose per tab so jargon and layout defects can be read as text. */
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const BASE = process.argv[2] ?? "http://localhost:3000";

/* The product moved from / to /app when the landing page was promoted
   (2026-08-11). Resolving against BASE keeps a bare origin working and is
   idempotent if someone passes the /app URL explicitly. */
const APP = new URL("/app", BASE).toString();
const TABS = ["dashboard", "review", "upload", "assistants", "record"];

function chromePath() {
  for (const cmd of [
    "ls -d ~/Library/Caches/ms-playwright/chromium*/chrome-mac*/Chromium.app/Contents/MacOS/Chromium 2>/dev/null | head -1",
    "ls -d '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' 2>/dev/null | head -1",
  ]) {
    try {
      const out = execSync(cmd, { shell: "/bin/zsh" }).toString().trim();
      if (out) return out;
    } catch {}
  }
  return "";
}

const browser = await chromium.launch({ headless: true, executablePath: chromePath() || undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
let report = "";

await page.goto(APP, { waitUntil: "networkidle" });
for (const tab of TABS) {
  // The tab ids in the app are dashboard/guided/document/agents/audit, so match by
  // position — the same fallback drive.mjs relies on.
  await page.evaluate((i) => {
    const t = document.querySelectorAll(".tablist [role=tab], .tabs button, [role=tab]");
    if (t[i]) t[i].click();
  }, TABS.indexOf(tab));
  await page.waitForTimeout(1200);
  const info = await page.evaluate(() => {
    const main = document.querySelector("main") ?? document.body;
    // Every element whose own text overflows its box, plus long unbroken measures.
    const wide = [];
    for (const el of document.querySelectorAll("p, span, h1, h2, h3, li, td, th, button, summary")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && el.scrollWidth > el.clientWidth + 1) {
        wide.push({ cls: el.className?.toString?.() ?? "", w: Math.round(r.width), sw: el.scrollWidth, text: (el.textContent ?? "").slice(0, 70) });
      }
    }
    // Paragraphs rendered wider than a comfortable measure.
    const longMeasure = [];
    for (const el of document.querySelectorAll("p")) {
      const r = el.getBoundingClientRect();
      const t = (el.textContent ?? "").trim();
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (r.height > 0 && t.length > 90 && r.width / (fs * 0.5) > 95) {
        longMeasure.push({ cls: el.className?.toString?.() ?? "", ch: Math.round(r.width / (fs * 0.5)), text: t.slice(0, 80) });
      }
    }
    return {
      text: (main.innerText ?? "").replace(/\n{3,}/g, "\n\n"),
      docScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
      wide,
      longMeasure,
    };
  });
  report += `\n\n================ ${tab.toUpperCase()} ================\n`;
  report += `horizontal page scroll: ${info.docScroll}\n`;
  if (info.wide.length) report += `OVERFLOWING ELEMENTS:\n${JSON.stringify(info.wide, null, 1)}\n`;
  if (info.longMeasure.length) report += `OVER-WIDE MEASURE:\n${JSON.stringify(info.longMeasure, null, 1)}\n`;
  report += `---- visible text ----\n${info.text}\n`;
}

writeFileSync(process.env.OUTFILE ?? "/tmp/dump.txt", report);
console.log(report.slice(0, 200));
await browser.close();
