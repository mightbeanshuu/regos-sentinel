/**
 * Second capture pass — the tabs and features the first pass did not cover:
 * AI assistants (+ the live agent console), Full record, How it works, the
 * scenario catalogue, and the Ask RegOS assistant answering a real question.
 *
 * All five open the worked example first: the assistants, the record and the
 * scenarios are gated behind having something to read, so on an empty workspace
 * these clips filmed the "Start here" panel.
 */
import { clipper, enterDemo, launch, press, scrollTo, tab } from "./demo-lib.mjs";

const browser = await launch();
const clip = clipper(browser);

// ---- 8 · AI assistants: four named readers, and what each one recorded ----
// `capture-demo3.mjs` re-takes this one properly — each assistant carries its
// own "Run this check" and there is no "Run all", so this pass only frames the
// tab. Kept because the framing is still what the film uses either side of it.
await clip("assistants", async (page) => {
  await enterDemo(page);
  await tab(page, 3);
  await page.waitForTimeout(3500);
  await press(page, "^Run this check");
  await page.waitForTimeout(15000);
  await page.mouse.wheel(0, 420);
  await page.waitForTimeout(6000);
  await page.mouse.wheel(0, 420);
  await page.waitForTimeout(5000);
});

// ---- 9 · Ask RegOS: a real question, answered from the source ------------
await clip("ask", async (page) => {
  await enterDemo(page);
  await tab(page, 3);
  await page.waitForTimeout(3000);
  await scrollTo(page, ".chat, .chat-composer-glow");
  await page.waitForTimeout(2000);
  const box = await page.$(".chat textarea, .chat input[type=text], .chat-composer-glow textarea");
  if (box) {
    await box.click();
    await box.type("How long do I have to close a high-severity VAPT finding?", { delay: 42 });
    await page.waitForTimeout(1200);
    await page.keyboard.press("Enter");
  }
  await page.waitForTimeout(16000);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(4000);
});

// ---- 10 · Full record: the ledger every decision lands in -----------------
await clip("record", async (page) => {
  await enterDemo(page);
  await tab(page, 4);
  await page.waitForTimeout(4000);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(5000);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(5000);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(4000);
});

// ---- 11 · How it works: the pipeline, as the product explains it ---------
// This one is reachable from the empty state too, but it is filmed with the
// workspace open so the overlay sits over a page with something behind it.
await clip("howitworks", async (page) => {
  await enterDemo(page);
  await press(page, "^How it works");
  await page.waitForTimeout(14000);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(5000);
});

// ---- 12 · The scenario catalogue: four worked cases, not one demo path ---
await clip("scenarios", async (page) => {
  await enterDemo(page);
  await tab(page, 1);
  await page.waitForTimeout(2500);
  await press(page, "Choose an?(other)? example");
  await page.waitForTimeout(5000);
  await page.mouse.wheel(0, 260);
  await page.waitForTimeout(5000);
  await page.evaluate(() => [...document.querySelectorAll(".cp-card")].at(-1)?.click());
  await page.waitForTimeout(7000);
});

await browser.close();
console.log("\ndone");
