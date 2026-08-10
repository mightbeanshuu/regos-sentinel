/**
 * The catch-and-clear beat: the same clause, twice.
 *
 * A is the wording SEBI actually published — a six-month reporting duty with no
 * stated clock-start. B adds the missing clock-start and changes nothing else.
 * Both PDFs carry a banner saying they are demonstration documents and that the
 * edit in B is ours, not SEBI's, because the one thing this film must never do
 * is imply a regulator published a correction it did not publish.
 *
 * Filmed as one continuous session so the second read is visibly the same
 * product in the same state, not a second take with different framing.
 */
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { clipper, launch, press, tab } from "./demo-lib.mjs";

const DEMO = fileURLToPath(new URL("../../../demo-pdfs/", import.meta.url));
const browser = await launch();
const clip = clipper(browser);

const upload = async (page, file) => {
  const input = await page.$("input[type=file]");
  await input.setInputFiles(join(DEMO, file));
  await page.waitForSelector(".docreview-layout", { timeout: 120000 }).catch(() => {});
  await page.waitForTimeout(2500);
};

await clip("fix", async (page) => {
  // ---- A · the gap, caught ------------------------------------------------
  await tab(page, 2);
  await page.waitForTimeout(2000);
  await upload(page, "A-as-published.pdf");
  await page.waitForTimeout(3500);

  // The deadline-clarity read, then the case it raises.
  await page.evaluate(() => {
    const h = [...document.querySelectorAll("h2,h3")].find((e) => /how clear/i.test(e.innerText));
    h?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  await page.waitForTimeout(6000);

  await tab(page, 1);
  await page.waitForTimeout(2500);
  await press(page, "Find the case in this document|Find the deadline gap");
  await page.waitForTimeout(9000);
  await page.mouse.wheel(0, 320);
  await page.waitForTimeout(7000);

  // ---- B · the same clause, with the clock-start ---------------------------
  await tab(page, 2);
  await page.waitForTimeout(1800);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => /add another document/i.test(x.innerText));
    b?.scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(1200);
  await upload(page, "B-with-clock-start-added.pdf");
  await page.waitForTimeout(4000);

  await page.evaluate(() => {
    const h = [...document.querySelectorAll("h2,h3")].find((e) => /how clear/i.test(e.innerText));
    h?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  await page.waitForTimeout(7000);

  await tab(page, 1);
  await page.waitForTimeout(2500);
  await press(page, "Find the case in this document|Find the deadline gap");
  await page.waitForTimeout(8000);
  await page.mouse.wheel(0, 260);
  await page.waitForTimeout(7000);
});

await browser.close();
console.log("captured fix");
