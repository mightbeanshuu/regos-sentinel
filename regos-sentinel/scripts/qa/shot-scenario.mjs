import { chromium } from "playwright-core";
import { execSync } from "node:child_process";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? "/private/tmp/claude-501/-Users-mac/fb15fd09-79cc-4070-9797-8bb80396a457/scratchpad/scenario.png";

function chromePath() {
  for (const cmd of [
    "ls -d ~/Library/Caches/ms-playwright/chromium*/chrome-mac*/Chromium.app/Contents/MacOS/Chromium 2>/dev/null | head -1",
    "ls -d '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' 2>/dev/null | head -1",
  ]) {
    try { const o = execSync(cmd, { shell: "/bin/zsh" }).toString().trim(); if (o) return o; } catch {}
  }
  return "";
}

const browser = await chromium.launch({ headless: true, executablePath: chromePath() || undefined });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

// Tab 2 = "Review a requirement".
await page.evaluate(() => document.querySelectorAll("[role=tab]")[1]?.click());
await page.waitForTimeout(1200);

// Pick the last case tab (D) — the one that runs against a real SEBI advisory.
// Open the catalogue, then choose the last case (D — the real SEBI advisory).
await page.evaluate(() => {
  [...document.querySelectorAll("button")]
    .find((b) => /choose another example|choose an example/i.test(b.textContent ?? ""))?.click();
});
await page.waitForTimeout(900);
const picked = await page.evaluate(() => {
  const cards = [...document.querySelectorAll(".cp-card")];
  cards.at(-1)?.click();
  return cards.length;
});
console.log("case cards:", picked);
await page.waitForTimeout(2000);

// Run it if it has not run.
await page.evaluate(() => {
  [...document.querySelectorAll("button")]
    .find((b) => /^Run case /.test(b.textContent?.trim() ?? ""))?.click();
});
await page.waitForTimeout(9000);

console.log("buttons:", await page.evaluate(() => [...document.querySelectorAll("button")].map(b => b.textContent.trim().slice(0,40)).filter(Boolean).join(" | ")));
console.log("panels:", await page.evaluate(() => [...document.querySelectorAll(".panel .section-title")].map(t => t.textContent.trim()).join(" | ")));
const head = await page.evaluate(() => {
  const panel = [...document.querySelectorAll(".panel")]
    .find((p) => /What happened|Run this case/.test(p.querySelector(".section-title")?.textContent ?? ""));
  if (!panel) return null;
  const h = panel.querySelector(".panel-head");
  return {
    headHeight: Math.round(h.getBoundingClientRect().height),
    hasScoreStrip: Boolean(panel.querySelector(".sc-score")),
    text: panel.innerText.slice(0, 200),
  };
});
console.log(JSON.stringify(head, null, 1));
await page.screenshot({ path: OUT, fullPage: true });
await browser.close();
