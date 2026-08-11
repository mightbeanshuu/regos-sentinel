/**
 * Two behaviours the static harness cannot see:
 *  1. "Restart demo" must leave the dashboard blank until a document is added.
 *  2. The Ask composer placeholder must cycle while idle and stop on focus.
 */
import { chromium } from "playwright-core";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] ?? "http://localhost:3000";

/* The product moved from / to /app when the landing page was promoted
   (2026-08-11). Resolving against BASE keeps a bare origin working and is
   idempotent if someone passes the /app URL explicitly. */
const APP = new URL("/app", BASE).toString();
const OUT = fileURLToPath(new URL("./out/", import.meta.url));

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
const fail = [];

await page.goto(APP, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

/* ---- 1 · Placeholder rotation ------------------------------------------- */
const readPlaceholder = () => page.evaluate(() =>
  document.querySelector(".ask-input")?.getAttribute("placeholder") ?? null);

const first = await readPlaceholder();
await page.waitForTimeout(5200);
const second = await readPlaceholder();
if (!first) fail.push("no .ask-input found");
else if (first === second) fail.push(`placeholder did not rotate: still "${first}"`);
else console.log(`placeholder rotated:\n  "${first}"\n  → "${second}"`);

// Focused: it must hold still.
await page.click(".ask-input");
const held = await readPlaceholder();
await page.waitForTimeout(5200);
const stillHeld = await readPlaceholder();
if (held !== stillHeld) fail.push(`placeholder rotated while focused: "${held}" → "${stillHeld}"`);
else console.log(`placeholder held on focus: "${held}"`);
await page.click("h1");

/* ---- 2 · Restart demo --------------------------------------------------- */
const before = await page.evaluate(() => document.querySelector("main")?.innerText ?? "");
await page.evaluate(() => {
  [...document.querySelectorAll("button")]
    .find((b) => b.textContent?.trim() === "Restart demo")?.click();
});
await page.waitForTimeout(2500);

const after = await page.evaluate(() => ({
  text: document.querySelector("main")?.innerText ?? "",
  hasStart: Boolean(document.querySelector(".dash-start")),
  hasDecision: Boolean(document.querySelector(".dash-decision")),
  hasScore: Boolean(document.querySelector(".dash-score")),
  hasSource: Boolean(document.querySelector(".dash-source")),
  hasAsk: Boolean(document.querySelector(".dash-ask")),
}));

if (!after.hasStart) fail.push("after restart: no .dash-start panel");
for (const [key, present] of Object.entries(after)) {
  if (key === "text" || key === "hasStart") continue;
  if (present) fail.push(`after restart: ${key} is still on the dashboard`);
}
console.log(`\nbefore restart: ${before.length} chars of dashboard`);
console.log(`after restart:  ${after.text.length} chars\n---\n${after.text}\n---`);
await page.screenshot({ path: `${OUT}restart-blank.png`, fullPage: true });

/* ---- 3 · The escape hatch restores the workspace ------------------------- */
await page.evaluate(() => {
  [...document.querySelectorAll("button")]
    .find((b) => b.textContent?.includes("Continue with the built-in"))?.click();
});
await page.waitForTimeout(1200);
const restored = await page.evaluate(() => Boolean(document.querySelector(".dash-decision")));
if (!restored) fail.push('"Continue with the built-in SEBI sources" did not restore the dashboard');
else console.log('"Continue with the built-in SEBI sources" restores the full dashboard');

console.log(fail.length ? `\n=== ${fail.length} FAILURES ===\n${fail.join("\n")}` : "\n=== all checks passed ===");
await browser.close();
process.exit(fail.length ? 1 : 0);
