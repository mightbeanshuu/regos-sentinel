/**
 * Shared rig for the demo-film capture passes.
 *
 * The four capture scripts had grown three copies of the same boilerplate —
 * which is how `capture-demo3.mjs` came to exist at all: the first pass hunted a
 * "Run all" control that does not exist, every assistant card stayed "Not run
 * yet", and the fix was a whole new file instead of an edit. One rig now, so a
 * change to how the app is entered is made once.
 *
 * The rig also carries the thing that broke every clip: the app opens EMPTY.
 * Fourteen of the sixteen clips assumed a seeded workspace was already on
 * screen, so without `enterDemo` they record the "Start here" panel and prove
 * nothing. That is not a regression to route around — an empty first screen is
 * deliberate — so the footage now opens the worked example on purpose, the same
 * way a viewer would.
 */
import { chromium } from "playwright-core";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const BASE = process.argv[2] ?? "https://regos-sentinel.vercel.app";

/* The product moved from / to /app when the landing page was promoted
   (2026-08-11). Resolving against BASE keeps a bare origin working and is
   idempotent if someone passes the /app URL explicitly. */
export const APP = new URL("/app", BASE).toString();

// fileURLToPath, not .pathname — the repo path contains a space, and
// `new URL(...).pathname` URL-encodes it into a directory that does not exist.
export const OUT = fileURLToPath(
  new URL("../../../regos-motion/public/capture/", import.meta.url),
);

/**
 * The circular the film uploads.
 *
 * Was a path inside an ephemeral `~/.claude/jobs/...` scratch directory, which
 * is a dependency on something nobody can rely on existing. It now resolves to
 * the corpus in the repo, and it is deliberately the transmission circular:
 * SEBI HO/38/13/11(14)2026-MIRSD-POD/I/17111/2026, 23 July 2026. Page 3 states a
 * clock-start for one duty in paragraph 4 and omits it for the next in
 * paragraph 6 — so the footage shows RegOS telling the two apart on a page a
 * viewer can read in ten seconds and check for themselves.
 */
export const PDF = fileURLToPath(
  new URL(
    "../../../real-pdfs/circ-ease-of-doing-investment-and-ease-of-doing-business-simplifi.pdf",
    import.meta.url,
  ),
);

export function chromePath() {
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

/** No OS chrome in the recording. */
const HIDE_SCROLLBAR = `::-webkit-scrollbar{width:0!important;height:0!important;display:none!important}
html,body{scrollbar-width:none!important}`;

export async function launch() {
  mkdirSync(OUT, { recursive: true });
  if (!existsSync(PDF)) {
    console.log(`!! no PDF at ${PDF} — the upload clips will record an empty picker.`);
  }
  return chromium.launch({ headless: true, executablePath: chromePath() || undefined });
}

/** One context per clip, so each recording is its own file at exactly 1920×1080. */
export function clipper(browser) {
  return async function clip(name, steps) {
    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
      acceptDownloads: true,
    });
    const page = await ctx.newPage();
    await page.goto(APP, { waitUntil: "networkidle" });
    await page.waitForSelector(".romer", { timeout: 90000 });
    await page.addStyleTag({ content: HIDE_SCROLLBAR });
    await page.waitForTimeout(1500);
    try {
      await steps(page);
    } catch (error) {
      console.log(`  !! ${name} step error:`, String(error).split("\n")[0]);
    }
    const video = page.video();
    await ctx.close();
    renameSync(await video.path(), join(OUT, `${name}.webm`));
    console.log(`captured ${name}`);
  };
}

/**
 * Leave the empty first screen by opening the worked example, the way a viewer
 * would. Waits for the desk to actually paint rather than sleeping a guess —
 * on the free tier a fixed wait is the difference between footage and a blank.
 *
 * Both button labels are matched: the current one and the one it replaced, so a
 * capture run against an older deploy still enters the workspace instead of
 * silently filming the empty state.
 */
export async function enterDemo(page) {
  const opened = await page.evaluate(() => {
    const rx = /worked SEBI example|built-in SEBI sources|Continue with the built-in/i;
    const button = [...document.querySelectorAll("button")].find(
      (b) => rx.test(b.textContent ?? "") && !b.disabled,
    );
    button?.click();
    return Boolean(button);
  });
  if (!opened) return false;
  await page
    .waitForSelector(".romer-stats, .dash-decision", { timeout: 30000 })
    .catch(() => {});
  await page.waitForTimeout(1200);
  return true;
}

/**
 * Add a document and wait for it to be read. The passage table appearing is the
 * signal; the previous scripts slept 32–34s, which is both too long when the
 * read is quick and too short when it is not.
 */
export async function addDocument(page, timeoutMs = 180000) {
  const input = await page.$("input[type=file]");
  if (!input) return false;
  await input.setInputFiles(PDF);
  await page
    .waitForSelector(".docreview-layout", { timeout: timeoutMs })
    .catch(() => {});
  await page.waitForTimeout(2500);
  return true;
}

export const tab = (page, index) =>
  page.evaluate((i) => document.querySelectorAll("[role=tab]")[i]?.click(), index);

export const press = (page, source) =>
  page.evaluate((src) => {
    const rx = new RegExp(src, "i");
    const button = [...document.querySelectorAll("button")].find(
      (b) => rx.test(b.textContent?.trim() ?? "") && !b.disabled,
    );
    button?.scrollIntoView({ block: "center" });
    button?.click();
    return Boolean(button);
  }, source);

export const scrollTo = (page, selector) =>
  page.evaluate(
    (s) => document.querySelector(s)?.scrollIntoView({ behavior: "smooth", block: "center" }),
    selector,
  );
