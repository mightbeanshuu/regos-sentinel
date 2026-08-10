/**
 * Captures the demo film's product footage from the deployed site.
 *
 * One browser context per clip so each recording is its own file, at exactly
 * 1920x1080 so the film never upscales. Every clip is a real interaction — no
 * mockups, no stitched stills.
 *
 * Every clip here opens the worked example first. The app opens empty by
 * design, so without that step these six recorded the "Start here" panel and
 * proved nothing.
 *
 * Usage: node capture-demo.mjs [baseUrl]
 * Writes: <OUT>/<clip>.webm
 */
import { readdirSync } from "node:fs";

import {
  OUT,
  addDocument,
  clipper,
  enterDemo,
  launch,
  press,
  scrollTo,
  tab,
} from "./demo-lib.mjs";

const browser = await launch();
const clip = clipper(browser);

// ---- 1 · dashboard: the desk, the blocking decision -----------------------
await clip("dashboard", async (page) => {
  await enterDemo(page);
  await page.waitForTimeout(3000);
  await page.mouse.wheel(0, 320);
  await page.waitForTimeout(3500);
  await page.mouse.wheel(0, -320);
  await page.waitForTimeout(3000);
});

// ---- 2 · source: the cited passage and its fingerprint --------------------
await clip("source", async (page) => {
  await enterDemo(page);
  await tab(page, 1);
  await page.waitForTimeout(3000);
  await scrollTo(page, "#step-source, .quote");
  await page.waitForTimeout(4500);
  await page.mouse.wheel(0, 260);
  await page.waitForTimeout(5000);
});

// ---- 3 · blocked: duration stated, clock-start absent, no due date --------
await clip("blocked", async (page) => {
  await enterDemo(page);
  await tab(page, 1);
  await page.waitForTimeout(2500);
  await press(page, "^Start the review");
  await page.waitForTimeout(9000);
  await scrollTo(page, "#step-compare, .rcx-actionbar");
  await page.waitForTimeout(5000);
});

// ---- 4 · decide: the gate, then the named reading -------------------------
await clip("decide", async (page) => {
  await enterDemo(page);
  await tab(page, 1);
  await page.waitForTimeout(2500);
  await press(page, "^Start the review");
  await page.waitForTimeout(9000);
  await scrollTo(page, "#step-human");
  await page.waitForTimeout(2500);
  await press(page, "^Fill a synthetic demo response");
  await page.waitForTimeout(2500);          // the gate hint is readable here
  await press(page, "^Load the .* cited sections");
  await page.waitForTimeout(6000);
  await press(page, "^Record my reading");
  await page.waitForTimeout(7000);
});

// ---- 5 · impact: the deadline computes, the control splits ----------------
// ---- 6 · proof: the record downloads --------------------------------------
// Both come from one continuous run so the state is genuinely reached.
await clip("impact", async (page) => {
  await enterDemo(page);
  await tab(page, 1);
  await page.waitForTimeout(2500);
  await press(page, "^Start the review");
  await page.waitForTimeout(9000);
  await press(page, "^Load the .* cited sections");
  await page.waitForTimeout(6000);
  await press(page, "^Fill a synthetic demo response");
  await page.waitForTimeout(1500);
  await press(page, "^Record my reading");
  await page.waitForTimeout(8000);
  // Fill the approval, then approve.
  await page.evaluate(() => {
    const area = [...document.querySelectorAll("#panel-guided textarea")].at(-1);
    if (area) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      setter.call(area, "The firm adopts date of discovery as the clock-start for high-severity patch findings.");
      area.dispatchEvent(new Event("input", { bubbles: true }));
    }
    [...document.querySelectorAll("#panel-guided .decision-agree-chip")]
      .find((b) => /agree/i.test(b.textContent ?? "") && !/differ|disagree/i.test(b.textContent ?? ""))
      ?.click();
  });
  await page.waitForTimeout(2000);
  await press(page, "^Approve final decision");
  await page.waitForTimeout(9000);
  await scrollTo(page, ".jr-tiles");
  await page.waitForTimeout(6000);
});

// ---- 7 · upload: a live SEBI circular, read on the spot -------------------
// The one clip that must NOT open the worked example: it is about bringing
// your own document to an empty workspace, which is now what a visitor meets.
await clip("upload", async (page) => {
  await tab(page, 2);
  await page.waitForTimeout(2500);
  await addDocument(page);
  await page.mouse.wheel(0, 420);
  await page.waitForTimeout(5000);
});

await browser.close();
console.log("\nclips in", OUT);
readdirSync(OUT).forEach((f) => console.log("  " + f));
