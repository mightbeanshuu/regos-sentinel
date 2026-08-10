/**
 * Third capture pass — the features needed to carry a 3–5 minute film:
 * the live source re-check, a case generated from the user's own uploaded PDF,
 * the empty first screen, the limitation disclosures, and the workspace chrome
 * (entity profile + what is waiting on a person).
 */
import { addDocument, clipper, enterDemo, launch, press, scrollTo, tab } from "./demo-lib.mjs";

const browser = await launch();
const clip = clipper(browser);

// ---- 13 · the saved copy is checked against the page SEBI serves today ----
await clip("verify", async (page) => {
  await enterDemo(page);
  await tab(page, 1);
  await page.waitForTimeout(3000);
  await scrollTo(page, ".quote");
  await page.waitForTimeout(2500);
  await press(page, "Check it against the official page");
  await page.waitForTimeout(22000);
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(6000);
});

// ---- 14 · a case built out of the user's own uploaded circular -----------
// No `enterDemo`: this is the bring-your-own-document path, and it starts from
// the empty workspace a visitor actually meets.
await clip("upload_case", async (page) => {
  await tab(page, 2);
  await page.waitForTimeout(2500);
  await addDocument(page);
  // The case now lives on "Review a requirement", which follows the open
  // document rather than the seeded walkthrough.
  await tab(page, 1);
  await page.waitForTimeout(3000);
  await press(page, "Find the case in this document|Find the deadline gap");
  await page.waitForTimeout(18000);
  await page.mouse.wheel(0, 340);
  await page.waitForTimeout(9000);
  await page.mouse.wheel(0, 420);
  await page.waitForTimeout(9000);
});

// ---- 15 · the empty first screen, and the choice out of it ---------------
// This used to be filmed by pressing "Restart demo" to reach a blank dashboard.
// The blank dashboard is the DEFAULT now, so the clip opens on it and films the
// real thing: nothing claimed, one action, and the example a click away.
await clip("restart", async (page) => {
  await page.waitForTimeout(4000);
  await tab(page, 1);
  await page.waitForTimeout(3500);
  await tab(page, 4);
  await page.waitForTimeout(3500);
  await tab(page, 0);
  await page.waitForTimeout(3000);
  await enterDemo(page);
  await page.waitForTimeout(7000);
});

// ---- 16 · what each check may and may not do ----------------------------
await clip("limits", async (page) => {
  await enterDemo(page);
  await tab(page, 3);
  await page.waitForTimeout(3000);
  await page.evaluate(() => {
    [...document.querySelectorAll("details")]
      .filter((d) => /may and may not do/i.test(d.textContent ?? ""))
      .slice(0, 2)
      .forEach((d) => { d.open = true; });
    document.querySelector("details[open]")?.scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(9000);
  await page.mouse.wheel(0, 320);
  await page.waitForTimeout(7000);
});

// ---- 17 · the workspace chrome: who this is, and what waits on a person --
// With the worked example open, so the profile names a workspace instead of
// reading "No workspace yet".
await clip("chrome", async (page) => {
  await enterDemo(page);
  await page.waitForTimeout(2000);
  await page.evaluate(() => { const d = document.querySelector("details.romer-bell"); if (d) d.open = true; });
  await page.waitForTimeout(7000);
  await page.evaluate(() => { const d = document.querySelector("details.romer-bell"); if (d) d.open = false;
                              const p = document.querySelector("details.profile"); if (p) p.open = true; });
  await page.waitForTimeout(8000);
});

await browser.close();
console.log("\ndone");
