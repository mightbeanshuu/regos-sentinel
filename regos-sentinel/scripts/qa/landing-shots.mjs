/**
 * Screenshot the landing page, section by section, at several widths.
 *
 * Scrolls to each section and waits, because the reveals are driven by
 * IntersectionObserver — a full-page capture resizes the viewport instead of
 * scrolling it, so nothing ever intersects and every section photographs blank.
 * That is a property of the screenshot, not of the page, but it means a
 * full-page shot cannot be used to check this page at all.
 *
 * Also measures the two things a DOM probe gets wrong on its own: whether the
 * body scrolls sideways, and whether any reveal is still invisible after its
 * section has been on screen.
 */
import { chromium } from "playwright-core";

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "out", "landing-shots");
mkdirSync(OUT, { recursive: true });
const URL = process.argv[2] ?? "http://localhost:3400/";
const SECTIONS = ["gap", "how", "refusal", "assistants", "record"];

const browser = await chromium.launch({
  channel: "chrome",
  args: ["--force-device-scale-factor=1", "--use-gl=angle", "--enable-unsafe-swiftshader"],
});

for (const [name, width, height] of [
  ["desktop", 1512, 950],
  ["phone", 390, 844],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const probe = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    gl: !!document.querySelector(".lp-canvas canvas"),
  }));
  const sideways = probe.scrollW - probe.clientW;
  console.log(
    `\n${name} ${width}px — h-overflow ${sideways > 1 ? `${sideways}px SIDEWAYS SCROLL` : "none"}, webgl ${probe.gl ? "yes" : "NO"}`,
  );
  await page.screenshot({ path: `${OUT}/${name}-00-hero.png` });

  for (const [index, id] of SECTIONS.entries()) {
    await page.evaluate((sectionId) => {
      document.getElementById(sectionId)?.scrollIntoView({ block: "start" });
    }, id);
    await page.waitForTimeout(1100);
    await page.screenshot({ path: `${OUT}/${name}-0${index + 1}-${id}.png` });
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1100);
  await page.screenshot({ path: `${OUT}/${name}-06-foot.png` });

  /* This check runs LAST, after the scroll to the bottom, because `.lp-foot` is
     in its selector and SECTIONS does not include the footer. Run before that
     scroll and it reports the footer's own reveal as a failure every time — the
     element was simply never given the chance to intersect. Anything still
     transparent once every section INCLUDING the footer has been on screen is a
     real bug. */
  const unrevealed = await page.evaluate(() =>
    [...document.querySelectorAll(".lp-section, .lp-foot")]
      .flatMap((section) => [...section.querySelectorAll("*")])
      .filter((element) => {
        const style = getComputedStyle(element);
        return Number(style.opacity) < 0.05 && element.textContent?.trim();
      })
      .map((element) => `${element.className || element.tagName}: ${element.textContent.slice(0, 40)}`),
  );
  console.log(`  still invisible after scroll: ${unrevealed.length}`);
  unrevealed.slice(0, 4).forEach((entry) => console.log(`    ${entry}`));

  await page.close();
}

await browser.close();
console.log("\nshots in", OUT);
