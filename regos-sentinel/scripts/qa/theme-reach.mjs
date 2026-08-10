/**
 * Can the dark skin reach every colour in this design system?
 *
 * The whole reskin works one way: `parts/romer.css` redefines the tokens on
 * `:root` and is imported last, so every surface that says `var(--…)` follows.
 * A rule that names a colour outright does not follow, and nothing said so.
 *
 * That is not hypothetical. `.review-drawer` carried
 * `linear-gradient(178deg, oklch(0.965 …), oklch(0.945 …))`, copied from the light
 * mock it was designed against. Under the dark skin it stayed a near-white slab
 * with the app's light ink printed on it, and the passage under review — the most
 * important text on the screen — rendered at 1.23:1. It shipped, and it survived
 * a full prod verification, because the drawer only exists once a document has
 * been uploaded and that pass walked five tabs with none.
 *
 * A rendered-pixel check catches that on the one screen it is asked to look at.
 * This catches the whole class, on every rule, without rendering anything: find
 * literal LIGHT colours painted by rules the dark theme never overrides.
 *
 * Deliberately narrow, because a gate nobody runs is worth nothing:
 *   - only paint properties (background*, color), where a light literal shows;
 *   - only literals light enough to read as a light surface (L >= 0.72);
 *   - only near-opaque ones (alpha >= 0.5) — a 5% white highlight is fine;
 *   - and only where `romer.css` does not already restate the selector.
 *
 * Usage (from scripts/qa):  node theme-reach.mjs
 * Exit 1 on a finding.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

// fileURLToPath, not .pathname — the repo path contains a space.
const WEB = fileURLToPath(new URL("../../web/", import.meta.url));
const THEME = "app/parts/romer.css";
const SHEETS = [
  "app/globals.css",
  ...readdirSync(WEB + "app/parts")
    .filter((f) => f.endsWith(".css") && f !== "romer.css")
    .map((f) => `app/parts/${f}`),
];

// Backgrounds only, and that is a deliberate scope, not an oversight. Light TEXT
// under a dark skin is usually right — `.console-line--finding` is pale green ink
// on a terminal that is dark in both themes, and flagging it would bury the one
// finding that matters. A light SLAB is the failure: it survives the reskin, and
// then the app's own light ink prints on top of it. Whether any given text/
// background pair actually passes is measured on the rendered page by
// upload-path.mjs. Two gates, two jobs, neither of them noisy.
const PAINT = /^(background|background-color|background-image)$/;
const LIGHTNESS_FLOOR = 0.72;
const ALPHA_FLOOR = 0.5;

/** Perceived lightness of one literal colour, plus its alpha. Null if not a colour. */
function readColour(literal) {
  const oklch = literal.match(
    /oklch\(\s*([\d.]+%?)\s+[\d.]+\s+[\d.]+\s*(?:\/\s*([\d.]+%?)\s*)?\)/i,
  );
  if (oklch) {
    const l = oklch[1].endsWith("%") ? parseFloat(oklch[1]) / 100 : parseFloat(oklch[1]);
    const a = oklch[2] ? (oklch[2].endsWith("%") ? parseFloat(oklch[2]) / 100 : parseFloat(oklch[2])) : 1;
    return { lightness: l, alpha: a, text: oklch[0] };
  }
  const hex = literal.match(/#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\b/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
    const srgb = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const y = 0.2126 * srgb(n(0)) + 0.7152 * srgb(n(2)) + 0.0722 * srgb(n(4));
    // WCAG luminance is not OKLCH lightness; ^(1/3) puts it on a comparable scale.
    return { lightness: Math.cbrt(y), alpha: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1, text: hex[0] };
  }
  const rgb = literal.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[/,]\s*([\d.%]+))?\)/i);
  if (rgb) {
    const srgb = (v) => { v = parseFloat(v) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const y = 0.2126 * srgb(rgb[1]) + 0.7152 * srgb(rgb[2]) + 0.0722 * srgb(rgb[3]);
    const raw = rgb[4];
    const a = raw === undefined ? 1 : raw.endsWith("%") ? parseFloat(raw) / 100 : parseFloat(raw);
    return { lightness: Math.cbrt(y), alpha: a, text: rgb[0] };
  }
  if (/\b(white|ivory|snow|azure|floralwhite|ghostwhite)\b/i.test(literal)) {
    return { lightness: 1, alpha: 1, text: literal.trim() };
  }
  return null;
}

/** Every selector the dark theme restates, so it can override a literal. */
function themedSelectors(css) {
  const out = new Set();
  for (const match of css.matchAll(/(^|})\s*([^{}@]+?)\s*\{/g)) {
    for (const part of match[2].split(",")) {
      const selector = part.trim();
      if (selector && !selector.startsWith("@")) out.add(selector);
    }
  }
  return out;
}

/** Walk declarations, tracking the selector and whether we are inside a token block. */
function* declarations(css) {
  const rule = /(^|[};])\s*([^{}@;]+?)\s*\{([^{}]*)\}/g;
  for (const match of css.matchAll(rule)) {
    const selector = match[2].trim().replace(/\s+/g, " ");
    const body = match[3];
    const line = css.slice(0, match.index).split("\n").length;
    for (const decl of body.split(";")) {
      const colon = decl.indexOf(":");
      if (colon < 0) continue;
      yield {
        selector,
        property: decl.slice(0, colon).trim(),
        value: decl.slice(colon + 1).trim(),
        line,
      };
    }
  }
}

/** Every class name any component actually emits. */
function emittedClasses() {
  const seen = new Set();
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = dir + entry;
      if (statSync(full).isDirectory()) { walk(full + "/"); continue; }
      if (!/\.tsx?$/.test(entry)) continue;
      const source = readFileSync(full, "utf8");
      // Only what a `className` actually carries. Harvesting every string in the
      // file would let `role="tab"` vouch for a `.tab` RULE, and harvesting every
      // word would let the identifier `setTab` do it — both of which kept a dead
      // pre-Romer pill style looking live.
      for (const attr of source.matchAll(/className=(?:"([^"]*)"|\{([^}]*(?:\{[^}]*\}[^}]*)*)\})/g)) {
        const body = attr[1] ?? attr[2] ?? "";
        for (const token of body.split(/[\s${}()?:"'`+,]+/)) {
          if (/^[a-z][\w-]*$/i.test(token)) seen.add(token);
        }
      }
      // Class names also reach the DOM through helpers that build them.
      for (const helper of source.matchAll(/class(?:Name)?\s*[:=]\s*[`"']([^`"']*)[`"']/g)) {
        for (const token of helper[1].split(/[\s${}]+/)) {
          if (/^[a-z][\w-]*$/i.test(token)) seen.add(token);
        }
      }
    }
  };
  walk(WEB + "components/");
  walk(WEB + "app/");
  walk(WEB + "lib/");
  return seen;
}

const theme = readFileSync(WEB + THEME, "utf8");
const themed = themedSelectors(theme);
const emitted = emittedClasses();

/** The class names a selector depends on, e.g. ".a .b--on:hover" -> [a, b--on]. */
const classesIn = (selector) =>
  [...selector.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
const findings = [];
const dormant = [];
let scanned = 0;

for (const sheet of SHEETS) {
  const css = readFileSync(WEB + sheet, "utf8");
  for (const { selector, property, value, line } of declarations(css)) {
    // Token definitions are the mechanism, not a violation of it.
    if (property.startsWith("--")) continue;
    if (/^:root/.test(selector) || /\[data-theme/.test(selector)) continue;
    if (!PAINT.test(property)) continue;
    scanned += 1;
    const colour = readColour(value);
    if (!colour) continue;
    if (colour.lightness < LIGHTNESS_FLOOR || colour.alpha < ALPHA_FLOOR) continue;
    // A selector the theme restates can be reskinned; that is the escape hatch.
    const reachable = [...themed].some(
      (candidate) => candidate === selector || candidate.includes(selector.split(/[ >]/)[0]),
    );
    if (reachable) continue;
    // Inverse reachability: a rule whose classes no component emits is dead
    // decoration, not a live defect. It is still worth saying — a light slab left
    // in the sheet is a bug waiting for the day something renders it — but it must
    // not fail the gate, or the gate becomes something people skip.
    const dead = classesIn(selector).some((name) => !emitted.has(name));
    const entry = { sheet, line, selector, property, literal: colour.text, lightness: +colour.lightness.toFixed(3) };
    (dead ? dormant : findings).push(entry);
  }
}

console.log(`${scanned} paint declarations scanned across ${SHEETS.length} stylesheets`);
if (dormant.length) {
  console.log(`\n${dormant.length} light literal(s) in rules nothing currently renders:`);
  for (const f of dormant) console.log(`  ${f.sheet}:${f.line}  ${f.selector} — ${f.property}: ${f.literal}`);
  console.log("  (dead decoration from the light UI. Safe today; delete on the next pass.)");
}
if (!findings.length) {
  console.log("0 findings — every light literal is either tokenised or restated by the dark theme");
  process.exit(0);
}
console.log(`\n${findings.length} light literal(s) the dark theme cannot reach:`);
for (const f of findings) {
  console.log(`  ${f.sheet}:${f.line}  ${f.selector}`);
  console.log(`      ${f.property}: ${f.literal}   (lightness ${f.lightness})`);
}
console.log(
  "\nUse a token, or restate the selector in app/parts/romer.css. A literal here is a\n" +
  "surface that keeps its light colour under the dark skin — which is how the passage\n" +
  "drawer came to print light ink on a near-white panel at 1.23:1.",
);
process.exit(1);
