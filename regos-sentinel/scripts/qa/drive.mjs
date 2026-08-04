/**
 * Phase 6 validation harness for the Evidence Desk.
 *
 * Drives every tab across four viewports and fails on the defects this project
 * keeps re-growing: horizontal page scroll, clipped panels, raw backend enums on
 * screen, jargon, one-word-per-line boxes, DOM classes with no CSS rule, and JS
 * exceptions. Writes screenshots + report.json to ./out.
 *
 * Local stack:
 *   api  REGOS_OFFLINE=1 .venv/bin/python -m uvicorn app.main:app --port 8000
 *   web  npm run build && npx next start -p 3000
 *
 * Usage: node drive.mjs [--capture-boot] [baseUrl]
 *
 * `--capture-boot` opens all four target viewports together and records the
 * state before waiting for the API. It is deliberately a separate gate from
 * the full warm-state run: a hosted API may take time to wake and the loading
 * view is a first-visit experience, not a test artefact.
 */
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const CAPTURE_BOOT = args.includes("--capture-boot");
const BASE = args.find((arg) => !arg.startsWith("--")) ?? "http://127.0.0.1:3000";
// fileURLToPath, not .pathname — the repo path contains a space.
const OUT = fileURLToPath(new URL("./out/", import.meta.url));
mkdirSync(OUT, { recursive: true });

// Viewports named in the Phase 6 plan.
const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1024", width: 1024, height: 768 },
  { name: "768", width: 768, height: 1024 },
  { name: "390", width: 390, height: 844 },
];

const TABS = ["dashboard", "review", "upload", "assistants", "record"];

// Raw backend enums must never reach visible prose.
const ENUM_RE = /\b[A-Z]{3,}(_[A-Z0-9]+)+\b/g;
// Words a SEBI officer should never have to decode.
const JARGON = [
  "corpus", "span", "spans", "deterministic", "schema", "metadata", "seeded",
  "artifact", "artefact", "hash chain", "idempotent", "provenance", "orchestrator",
  "toolbox", "cassette", "planner kind", "serialise", "payload", "enum",
  "boolean", "null", "undefined", "stdout", "regex", "traceback",
];
// Elements allowed to hold machine text.
const MONO_SEL = ".mono, .console, code, pre, .hash, .fingerprint, .visually-hidden";

function chromePath() {
  try {
    return execSync(
      "ls -d ~/Library/Caches/ms-playwright/chromium-*/chrome-mac*/Chromium.app/Contents/MacOS/Chromium 2>/dev/null | head -1",
      { shell: "/bin/zsh" },
    ).toString().trim();
  } catch { return ""; }
}

const findings = [];
const add = (viewport, tab, kind, detail) =>
  findings.push({ viewport, tab, kind, detail });

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath() || undefined,
});

// The full Phase 6 pass waits for network idle, which is correct for operating
// screens but cannot see a sleeping hosted API's loading state. Start all four
// viewports together so a single first visit cannot warm the service before
// the narrow-screen view has been captured.
const boot = [];
if (CAPTURE_BOOT) {
  const probes = await Promise.all(VIEWPORTS.map(async (vp) => {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const response = await page.goto(BASE, { waitUntil: "domcontentloaded" });
    const observed = await page.waitForFunction(
      () => document.querySelector(".boot") || document.querySelector("main"),
      { timeout: 4000 },
    ).then(() => true).catch(() => false);
    // A short settle allows React to paint its first asynchronous state, but
    // intentionally does not wait for a backend response.
    await page.waitForTimeout(250);
    const snapshot = await page.evaluate(() => {
      const visible = (el) => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
      };
      const selectorSet = new Set();
      for (const sheet of document.styleSheets) {
        let rules; try { rules = sheet.cssRules; } catch { continue; }
        const walk = (items) => {
          for (const rule of items) {
            if (rule.selectorText) selectorSet.add(rule.selectorText);
            if (rule.cssRules) walk(rule.cssRules);
          }
        };
        walk(rules);
      }
      const skeletons = [...document.querySelectorAll(".skel-group")].map((el) => ({
        classes: [...el.classList],
        visible: visible(el),
        display: getComputedStyle(el).display,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }));
      const boot = document.querySelector(".boot");
      const requiredRules = [".skel-group--dial", ".skel-group--row", ".skel-group--lines", ".skel-group--stat"];
      return {
        viewport: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        boot: boot ? {
          visible: visible(boot),
          text: (boot.textContent ?? "").replace(/\s+/g, " ").trim(),
        } : null,
        skeletons,
        requiredRules: Object.fromEntries(requiredRules.map((selector) => [
          selector,
          [...selectorSet].some((rule) => rule.includes(selector)),
        ])),
      };
    });
    await page.screenshot({ path: `${OUT}boot-${vp.name}.png`, fullPage: true });
    await context.close();
    return { name: vp.name, responseStatus: response?.status() ?? null, observed, ...snapshot };
  }));

  for (const probe of probes) {
    boot.push(probe);
    if (!probe.observed || !probe.boot?.visible) {
      add(probe.name, "boot", "boot-state-not-observed", "loading shell was not visible before the normal run");
    }
    if (probe.scrollWidth > probe.viewport + 1) {
      add(probe.name, "boot", "horizontal-scroll", `page scrollWidth ${probe.scrollWidth} > viewport ${probe.viewport}`);
    }
    for (const [selector, present] of Object.entries(probe.requiredRules)) {
      if (!present) add(probe.name, "boot", "unstyled-class", `missing stylesheet rule ${selector}`);
    }
  }
}

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

  await page.goto(BASE, { waitUntil: "networkidle" });
  // Confirm the CSS viewport actually followed (headless can clamp).
  const real = await page.evaluate(() => window.innerWidth);
  if (real !== vp.width) add(vp.name, "-", "viewport-clamped", `innerWidth ${real} != ${vp.width}`);

  for (const tab of TABS) {
    const clicked = await page.evaluate((t) => {
      const els = [...document.querySelectorAll("button, [role=tab], a")];
      const el = els.find((e) => (e.dataset?.tab ?? "") === t)
        ?? els.find((e) => (e.getAttribute("aria-controls") ?? "").includes(t));
      if (el) { el.click(); return true; }
      return false;
    }, tab);
    if (!clicked) {
      // Fall back to visible tab order.
      await page.evaluate((i) => {
        const t = document.querySelectorAll(".tabs button, [role=tab]");
        if (t[i]) t[i].click();
      }, TABS.indexOf(tab));
    }
    await page.waitForTimeout(900);

    const result = await page.evaluate(({ enumSrc, jargon, monoSel }) => {
      const out = { scrollW: 0, viewport: 0, overflow: [], enums: [], jargon: [], cramped: [], truncated: [], unstyled: [], contrast: [] };

      /* Colour contrast. The palette is defined once in :root, but what reaches the
         eye is the composited result — a translucent card over a tinted canvas is not
         the token value. So resolve the real background by compositing every ancestor
         until something opaque is found, and judge the pair that actually renders. */
      /* Parse via canvas, not a regex. This palette is authored in `oklch()` and
         Chrome reports those computed values verbatim, so a `rgb()`-only regex
         silently skips every accent, ok, review and fail surface — which then reads
         as white-on-white. Painting one pixel makes the browser resolve any colour
         space for us, alpha included. */
      const _cvs = document.createElement("canvas");
      _cvs.width = 1; _cvs.height = 1;
      const _ctx = _cvs.getContext("2d", { willReadFrequently: true });
      const parseRgb = (v) => {
        const s = String(v || "").trim();
        if (!s || s === "transparent" || s === "none") return null;
        _ctx.clearRect(0, 0, 1, 1);
        // A value the browser rejects leaves fillStyle unchanged; detect that.
        _ctx.fillStyle = "#010203";
        _ctx.fillStyle = s;
        if (_ctx.fillStyle === "#010203" && !/^#010203$/i.test(s)) return null;
        _ctx.fillRect(0, 0, 1, 1);
        const d = _ctx.getImageData(0, 0, 1, 1).data;
        return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
      };
      const over = (top, bottom) => top.a >= 0.999 ? top : {
        r: top.r * top.a + bottom.r * (1 - top.a),
        g: top.g * top.a + bottom.g * (1 - top.a),
        b: top.b * top.a + bottom.b * (1 - top.a),
        a: 1,
      };
      const relLum = ({ r, g, b }) => {
        const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const PAPER = { r: 255, g: 255, b: 255, a: 1 };
      /* Returns null when the backdrop is a gradient or image — its colour under the
         text is genuinely unknowable from computed style, and guessing there would
         produce confident nonsense. An unchecked element is better than a false
         failure: a harness that cries wolf stops being read. */
      const effectiveBg = (el) => {
        let acc = null;
        for (let n = el; n; n = n.parentElement) {
          const st = getComputedStyle(n);
          if (st.backgroundImage && st.backgroundImage !== "none") return null;
          const c = parseRgb(st.backgroundColor);
          if (!c || c.a === 0) continue;
          acc = acc ? over(acc, c) : { ...c };
          if (acc.a >= 0.999) return acc;
        }
        return acc ? over(acc, PAPER) : PAPER;
      };
      out.scrollW = document.documentElement.scrollWidth;
      out.viewport = window.innerWidth;

      const monos = new Set(document.querySelectorAll(monoSel));
      const isMono = (el) => { for (let n = el; n; n = n.parentElement) if (monos.has(n)) return true; return false; };
      const visible = (el) => {
        const s = getComputedStyle(el);
        if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0") return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };

      // Text defects — walk leaf-ish elements only, so text is not counted twice.
      for (const el of document.querySelectorAll("body *")) {
        if (!visible(el) || isMono(el)) continue;
        const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" ").trim();
        if (!own) continue;
        const re = new RegExp(enumSrc, "g");
        const hits = own.match(re);
        if (hits) out.enums.push({ text: own.slice(0, 120), hits: [...new Set(hits)] });
        const low = " " + own.toLowerCase() + " ";
        for (const j of jargon) {
          if (low.includes(" " + j + " ") || low.includes(" " + j + ",") || low.includes(" " + j + ".")) {
            out.jargon.push({ word: j, text: own.slice(0, 120) });
          }
        }
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.width < 150 && own.length > 24) {
          out.cramped.push({ text: own.slice(0, 80), width: Math.round(r.width) });
        }
        const s = getComputedStyle(el);
        if (s.textOverflow === "ellipsis" && el.scrollWidth > el.clientWidth + 1) {
          out.truncated.push({ text: own.slice(0, 80), scroll: el.scrollWidth, client: el.clientWidth });
        }

        // WCAG 1.4.3: 4.5:1 for normal text, 3:1 once it is large (>=24px, or
        // >=18.66px when bold). Judged on composited colours, not token values.
        const fgRaw = parseRgb(s.color);
        const bg = fgRaw && fgRaw.a > 0.05 ? effectiveBg(el) : null;
        if (fgRaw && bg) {
          const fg = over(fgRaw, bg);
          const lf = relLum(fg), lb = relLum(bg);
          const ratio = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
          const px = parseFloat(s.fontSize) || 16;
          const weight = parseInt(s.fontWeight, 10) || 400;
          const need = (px >= 24 || (px >= 18.66 && weight >= 700)) ? 3 : 4.5;
          if (ratio + 0.005 < need) {
            out.contrast.push({
              text: own.slice(0, 80),
              ratio: Math.round(ratio * 100) / 100,
              need,
              px: Math.round(px),
              fg: s.color,
              bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
            });
          }
        }
      }

      // Clipped / overflowing panels. `.visually-hidden` is 1px by design, and a
      // skeleton's sheen is a pseudo-element translated outside a clipped box on
      // purpose — it reports ~2x scrollWidth and is not a layout defect.
      for (const el of document.querySelectorAll("body *")) {
        if (!visible(el) || el.closest(".visually-hidden") || el.closest(".skel")) continue;
        const s = getComputedStyle(el);
        if (s.overflow === "visible" && s.overflowX === "visible") continue;
        if (el.scrollWidth > el.clientWidth + 2 && s.overflowX !== "auto" && s.overflowX !== "scroll") {
          out.overflow.push({ cls: el.className?.toString().slice(0, 60), scroll: el.scrollWidth, client: el.clientWidth });
        }
      }

      // Classes present in the DOM with no matching CSS rule anywhere.
      const declared = new Set();
      for (const sheet of document.styleSheets) {
        let rules; try { rules = sheet.cssRules; } catch { continue; }
        const walk = (rs) => {
          for (const r of rs) {
            if (r.selectorText) for (const m of r.selectorText.matchAll(/\.([A-Za-z0-9_-]+)/g)) declared.add(m[1]);
            if (r.cssRules) walk(r.cssRules);
          }
        };
        walk(rules);
      }
      const used = new Set();
      for (const el of document.querySelectorAll("body *")) {
        for (const c of el.classList) used.add(c);
      }
      out.unstyled = [...used].filter((c) => !declared.has(c));
      return out;
    }, { enumSrc: ENUM_RE.source, jargon: JARGON, monoSel: MONO_SEL });

    if (result.scrollW > result.viewport + 1) {
      add(vp.name, tab, "horizontal-scroll", `page scrollWidth ${result.scrollW} > viewport ${result.viewport}`);
    }
    for (const o of result.overflow) add(vp.name, tab, "clipped-element", `${o.cls} scrollWidth ${o.scroll} > clientWidth ${o.client}`);
    for (const e of result.enums) add(vp.name, tab, "raw-enum", `${e.hits.join(",")} in "${e.text}"`);
    for (const j of result.jargon) add(vp.name, tab, "jargon", `"${j.word}" in "${j.text}"`);
    for (const c of result.cramped) add(vp.name, tab, "cramped-box", `${c.width}px holds "${c.text}"`);
    for (const t of result.truncated) add(vp.name, tab, "truncated", `"${t.text}"`);
    for (const u of result.unstyled) add(vp.name, tab, "unstyled-class", u);
    for (const c of result.contrast) {
      add(vp.name, tab, "low-contrast", `${c.ratio}:1 needs ${c.need}:1 — ${c.px}px ${c.fg} on ${c.bg} — "${c.text}"`);
    }

    await page.screenshot({ path: `${OUT}${vp.name}-${tab}.png`, fullPage: true });
  }

  for (const e of [...new Set(errors)]) add(vp.name, "-", "js-error", e.slice(0, 200));
  await context.close();
}

// Keyboard reachability + visible focus, desktop only.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  const focus = await page.evaluate(() => {
    const out = { noOutline: [], count: 0 };
    const els = [...document.querySelectorAll("a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])")]
      .filter((e) => e.offsetParent !== null);
    out.count = els.length;
    for (const el of els.slice(0, 60)) {
      el.focus();
      const s = getComputedStyle(el);
      const has = (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0)
        || s.boxShadow !== "none"
        || getComputedStyle(el, ":focus-visible").outlineStyle !== "none";
      if (!has) out.noOutline.push((el.textContent ?? "").trim().slice(0, 40) || el.tagName);
    }
    return out;
  });
  for (const f of [...new Set(focus.noOutline)]) add("1440", "-", "no-focus-ring", f);
  await context.close();
}

// Reduced motion must be honoured.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  const moving = await page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll("body *")) {
      const s = getComputedStyle(el);
      const dur = parseFloat(s.animationDuration) || 0;
      if (dur > 0.05 && s.animationIterationCount === "infinite") {
        bad.push(el.className?.toString().slice(0, 50) || el.tagName);
      }
    }
    return [...new Set(bad)];
  });
  for (const m of moving) add("1440", "-", "motion-under-reduce", m);
  await context.close();
}

await browser.close();

const byKind = {};
for (const f of findings) byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
writeFileSync(`${OUT}report.json`, JSON.stringify({
  base: BASE,
  bootCapture: CAPTURE_BOOT ? boot : null,
  total: findings.length,
  byKind,
  findings,
}, null, 2));

console.log(`\n=== Phase 6 validation — ${findings.length} findings ===`);
for (const [k, n] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${k}`);
for (const f of findings.slice(0, 60)) console.log(`  [${f.viewport}/${f.tab}] ${f.kind}: ${f.detail}`);
if (findings.length > 60) console.log(`  … ${findings.length - 60} more in out/report.json`);
console.log(`\nScreenshots + report: ${OUT}`);
process.exit(0);
