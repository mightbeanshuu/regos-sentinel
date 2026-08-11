/**
 * Re-capture of the AI assistants beat. The first pass looked for a "Run all"
 * control that does not exist — each assistant carries its own "Run this check",
 * so every card stayed "Not run yet" and the clip proved nothing.
 *
 * It also has to open the worked example now: the assistants tab is gated behind
 * having something to read, so on an empty workspace there are no cards at all.
 */
import { renameSync } from "node:fs";
import { join } from "node:path";

import { APP, OUT, enterDemo, launch } from "./demo-lib.mjs";

const browser = await launch();
const HIDE = `::-webkit-scrollbar{width:0!important;height:0!important;display:none!important}
html,body{scrollbar-width:none!important}`;

const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } },
});
const page = await ctx.newPage();
await page.goto(APP, { waitUntil: "networkidle" });
await page.waitForSelector(".romer", { timeout: 90000 });
await page.addStyleTag({ content: HIDE });
await page.waitForTimeout(1500);

console.log("worked example opened:", await enterDemo(page));

await page.evaluate(() => document.querySelectorAll("[role=tab]")[3]?.click());
await page.waitForTimeout(3000);

// Run the first assistant and let its steps stream.
const ran = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(
    (x) => /^Run this check/i.test(x.textContent?.trim() ?? "") && !x.disabled,
  );
  b?.scrollIntoView({ block: "center" });
  b?.click();
  return Boolean(b);
});
console.log("first assistant started:", ran);
await page.waitForTimeout(20000);

// Run a second one so the tab shows more than a single result.
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(
    (x) => /^Run this check/i.test(x.textContent?.trim() ?? "") && !x.disabled,
  );
  b?.scrollIntoView({ block: "center" });
  b?.click();
});
await page.waitForTimeout(20000);

// Open the technical details so the live log and planner are on screen.
await page.evaluate(() => {
  const d = [...document.querySelectorAll("details, summary")].find((x) =>
    /Technical details/i.test(x.textContent ?? ""),
  );
  const details = d?.tagName === "SUMMARY" ? d.parentElement : d;
  if (details) { details.open = true; details.scrollIntoView({ block: "center" }); }
});
await page.waitForTimeout(9000);

const video = page.video();
await ctx.close();
renameSync(await video.path(), join(OUT, "assistants.webm"));
await browser.close();
console.log("captured assistants (re-take)");
