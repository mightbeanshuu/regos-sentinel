/**
 * The upload path, driven with a real regulator PDF.
 *
 * `drive.mjs` walks five tabs and reports zero. It also never uploads anything,
 * so every surface that only exists once a document is on screen — the passage
 * table, the review drawer, the document case, the intelligence rail's
 * document-scoped copy — has never been in a gate. Three of the defects found on
 * the 205-page CSCRF framework lived exactly there, and one of them, a passage
 * quoted at 1.23:1, had shipped.
 *
 * Two checks here are deliberately different from drive.mjs's:
 *
 *  - CONTRAST IS MEASURED FROM RENDERED PIXELS, not from getComputedStyle. The
 *    existing check reads `backgroundColor` and returns null for a gradient
 *    rather than guessing — correct, but it means any surface whose colour lives
 *    in `background-image` is skipped and the gate passes vacuously. The drawer
 *    was a near-white `linear-gradient` under a dark skin; a DOM probe reported
 *    19.72:1 for text a screenshot measured at 1.23:1.
 *  - HIDDEN HORIZONTAL OVERFLOW IS A FINDING. `documentElement.scrollWidth` was
 *    clean the whole time the passage table sat in a 154px grid track holding a
 *    520px table, because a declared scroll container hides it perfectly.
 *
 * Usage (from scripts/qa, with the app on :3000 and a document PDF to hand):
 *   node upload-path.mjs [baseUrl] [pdfPath]
 */
import { chromium } from "playwright-core";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const PDF = args.find((a) => a.endsWith(".pdf"))
  ?? fileURLToPath(new URL("../../../real-pdfs/cscrf-framework.pdf", import.meta.url));
// fileURLToPath, not .pathname — the repo path contains a space.
const OUT = fileURLToPath(new URL("./out/", import.meta.url));
mkdirSync(OUT, { recursive: true });

if (!existsSync(PDF)) {
  console.log(`No PDF at ${PDF} — pass one as an argument. Nothing to check.`);
  process.exit(0);
}

const chromePath = () => {
  try {
    return execSync(
      "ls -d ~/Library/Caches/ms-playwright/chromium-*/chrome-mac*/Chromium.app/Contents/MacOS/Chromium 2>/dev/null | head -1",
      { shell: "/bin/zsh" },
    ).toString().trim();
  } catch { return ""; }
};

const VIEWPORTS = [1920, 1600, 1440, 1280, 1024, 390];
const findings = [];
const add = (kind, detail) => findings.push({ kind, detail });

const relLum = (p) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2]);
};
const ratio = (a, b) => {
  const [hi, lo] = [relLum(a), relLum(b)].sort((m, n) => n - m);
  return (hi + 0.05) / (lo + 0.05);
};

const browser = await chromium.launch({ headless: true, executablePath: chromePath() || undefined });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on("pageerror", (e) => add("js-error", e.message.slice(0, 200)));
page.on("console", (m) => {
  if (m.type() === "error") add("js-error", m.text().slice(0, 200));
});

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

// The Romer shell has no [role=tab]; navigation is .romer-nav-item, by name.
const nav = await page.$$(".romer-nav-item");
const labels = await Promise.all(nav.map((n) => n.innerText()));
const index = labels.findIndex((l) => /your own document/i.test(l));
if (index < 0) throw new Error(`no document nav item in ${JSON.stringify(labels)}`);
await nav[index].click();
await page.waitForTimeout(1200);

const input = await page.$("input[type=file]");
if (!input) throw new Error("no file input on the document tab");
await input.setInputFiles(PDF);
let ready = false;
for (let i = 0; i < 180; i++) {
  await page.waitForTimeout(1000);
  ready = await page.evaluate(() => !!document.querySelector(".docreview-layout"));
  if (ready) break;
}
if (!ready) throw new Error("the passage table never rendered");
await page.waitForTimeout(3500);

// ---- 1. Hidden horizontal overflow, per viewport ---------------------------
for (const width of VIEWPORTS) {
  await page.setViewportSize({ width, height: 950 });
  await page.waitForTimeout(800);
  const m = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("*")) {
      const hidden = el.scrollWidth - el.clientWidth;
      if (hidden <= 8 || el.clientWidth === 0) continue;
      const style = getComputedStyle(el);
      if (!/auto|scroll/.test(style.overflowX)) continue;
      // A scroll container is only honest if what it hides is reachable: a track
      // narrower than half its content is a sliver, not a scrollable table.
      if (el.clientWidth * 2 < el.scrollWidth) {
        out.push({ cls: el.className.toString().slice(0, 40), visible: el.clientWidth, real: el.scrollWidth });
      }
    }
    return { slivers: out, pageScroll: document.documentElement.scrollWidth - window.innerWidth };
  });
  if (m.pageScroll > 0) add("horizontal-scroll", `${width}px: page scrolls ${m.pageScroll}px`);
  for (const s of m.slivers) {
    add("sliver", `${width}px: .${s.cls} shows ${s.visible}px of ${s.real}px of content`);
  }
}

// ---- 2. Rendered-pixel contrast on the surfaces that hold evidence ---------
await page.setViewportSize({ width: 1440, height: 950 });
await page.waitForTimeout(800);
const SURFACES = [".review-drawer", ".docreview-table", ".romer-rail", ".dash-decision"];
for (const selector of SURFACES) {
  const box = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    el.scrollIntoView({ block: "center" });
    return true;
  }, selector);
  if (!box) continue;
  await page.waitForTimeout(600);
  const clip = await page.evaluate((sel) => {
    const r = document.querySelector(sel).getBoundingClientRect();
    const y = Math.max(0, Math.round(r.y));
    const height = Math.min(Math.round(r.bottom), window.innerHeight) - y;
    if (height < 20 || r.width < 20) return null;
    return { x: Math.max(0, Math.round(r.x)), y, width: Math.round(r.width), height };
  }, selector);
  if (!clip) continue;
  const buffer = await page.screenshot({ clip });
  const sample = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const lum = (p) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2]);
    };
    const hist = new Map();
    let far = [0, 0, 0];
    for (let i = 0; i < data.length; i += 4) {
      const p = [data[i], data[i + 1], data[i + 2]];
      hist.set(p.join(","), (hist.get(p.join(",")) || 0) + 1);
    }
    const bg = [...hist.entries()].sort((a, b) => b[1] - a[1])[0][0].split(",").map(Number);
    // Text is the ink furthest in luminance from the panel it sits on.
    let best = -1;
    for (const key of hist.keys()) {
      const p = key.split(",").map(Number);
      const d = Math.abs(lum(p) - lum(bg));
      if (d > best) { best = d; far = p; }
    }
    return { bg, ink: far };
  }, buffer.toString("base64"));
  const measured = ratio(sample.ink, sample.bg);
  if (measured < 4.5) {
    add(
      "low-contrast-rendered",
      `${selector}: ink rgb(${sample.ink}) on painted panel rgb(${sample.bg}) = ${measured.toFixed(2)}:1`,
    );
  } else {
    console.log(`  ok  ${selector.padEnd(20)} ${measured.toFixed(2)}:1`);
  }
}

// ---- 3. The rail must describe the document that is open -------------------
const railText = await page.evaluate(
  () => document.querySelector(".romer-rail")?.innerText.replace(/\s+/g, " ").trim() ?? "",
);
const totals = await page.evaluate(() => {
  const chip = [...document.querySelectorAll(".audit-filter, .audit-filters button")]
    .map((b) => b.innerText.replace(/\s+/g, " ").trim())
    .find((t) => /^All /.test(t));
  return chip ?? "";
});
if (/\b1 of 2 deadline statements\b/.test(railText)) {
  add("rail-describes-another-document", `rail still reads the seeded workspace: ${railText.slice(0, 120)}`);
}
console.log(`  rail: ${railText.slice(0, 160)}`);
console.log(`  chip: ${totals}`);

await page.setViewportSize({ width: 1440, height: 950 });
await page.screenshot({ path: OUT + "upload-path.png", fullPage: false });
writeFileSync(OUT + "upload-path.json", JSON.stringify({ pdf: PDF, findings }, null, 1));

console.log(`\n${findings.length} finding(s)`);
for (const f of findings) console.log(` - [${f.kind}] ${f.detail}`);
await browser.close();
process.exit(findings.length ? 1 : 0);
