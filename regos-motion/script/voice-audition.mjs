/**
 * Audition every non-compact voice on this machine against the real script.
 *
 * Picking a narrator from a name in a list is guesswork. This speaks the film's
 * actual opening lines — the ones whose cadence the edit was cut to — in every
 * Premium/Enhanced voice installed, so the choice is made by ear.
 *
 * macOS ships only "compact" voices by default: small, robotic, and the reason
 * the first cut of this film sounded synthetic. The Premium and Enhanced voices
 * are neural and are a different class of thing, but they are an opt-in
 * download (System Settings > Accessibility > Spoken Content > System Voice >
 * Manage Voices). Until at least one is installed this script has nothing to
 * offer and says so rather than silently auditioning the compact set.
 *
 * Usage: node script/voice-audition.mjs [--all]
 *   --all  also audition compact voices, for comparison
 */
import {execFileSync} from "node:child_process";
import {mkdirSync, rmSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out", "voice-audition");

/* The film's opening. Chosen because it carries the whole tonal problem: a
   factual clause, a short blunt sentence, and a turn that has to land dry. */
const LINE =
  "SEBI's cyber framework tells a broker to close a high severity finding " +
  "within one week. It never says one week from when. So there's no date you " +
  "can actually work out.";

const wanted = process.argv.includes("--all") ? /./ : /\((Premium|Enhanced)\)/;

const voices = execFileSync("say", ["-v", "?"], {encoding: "utf8"})
  .split("\n")
  .map((row) => row.match(/^(.+?)\s{2,}(\S+)\s+#/))
  .filter(Boolean)
  .map(([, name, locale]) => ({name: name.trim(), locale}))
  .filter((v) => v.locale.startsWith("en"))
  .filter((v) => wanted.test(v.name));

if (voices.length === 0) {
  console.error("No Premium or Enhanced English voices are installed.\n");
  console.error("Install one first:");
  console.error("  System Settings > Accessibility > Spoken Content >");
  console.error("  System Voice > (the ⓘ / Manage Voices…) > English");
  console.error("\nWorth downloading: Ava (Premium), Serena (Premium),");
  console.error("Evan (Enhanced), Isha (Premium, Indian English).");
  console.error("\nThen re-run this. Add --all to audition compact voices too.");
  process.exit(1);
}

rmSync(OUT, {recursive: true, force: true});
mkdirSync(OUT, {recursive: true});

console.log(`Auditioning ${voices.length} voice(s) on the film's opening lines.\n`);

for (const {name, locale} of voices) {
  // A filename per voice, safe for the shell and sorted by how it will be read.
  const slug = name.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const file = join(OUT, `${slug}.aiff`);
  try {
    execFileSync("say", ["-v", name, "-r", "168", "-o", file, LINE]);
    const seconds = Number(
      execFileSync(
        "ffprobe",
        ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
        {encoding: "utf8"},
      ).trim(),
    );
    console.log(`  ${name.padEnd(28)} ${locale.padEnd(6)} ${seconds.toFixed(1)}s`);
  } catch (error) {
    console.log(`  ${name.padEnd(28)} ${locale.padEnd(6)} FAILED ${error.message}`);
  }
}

console.log(`\nWritten to ${OUT}`);
console.log("Play them all in order:");
console.log(`  for f in "${OUT}"/*.aiff; do echo "$f"; afplay "$f"; done`);
console.log("\nThen set `voice` in script/narration.json to the winner and run");
console.log("  node script/build-audio.mjs");
