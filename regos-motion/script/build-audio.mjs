/**
 * Builds the film's voice track and the timing the captions are driven from.
 *
 * One audio file per SENTENCE, not per beat. That is the whole trick: macOS
 * `say` reports no word timings, so any single-file approach has to *estimate*
 * where each caption starts and drifts audibly by the third line. Rendering each
 * sentence separately makes its duration a measured fact, so a caption can be
 * shown for exactly as long as it is spoken.
 *
 * Writes  public/audio/<beat>-<n>.wav
 *         script/timing.json   (consumed by the Remotion composition)
 *
 * Usage: node build-audio.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const AUDIO = join(ROOT, "public", "audio");
const TMP = join(ROOT, ".audio-tmp");

const spec = JSON.parse(readFileSync(join(HERE, "narration.json"), "utf8"));
const FPS = 30;

/**
 * Resolve the configured voice to the best tier of it actually installed.
 *
 * macOS exposes the same narrator at up to three qualities — "Isha (Premium)",
 * "Isha (Enhanced)", plain "Isha" — and only the compact one ships by default;
 * the neural tiers are an opt-in download. Pinning the exact string in
 * narration.json would mean the config is wrong both before the download and
 * after, depending on which tier landed. So the config names the PERSON and
 * this picks the best available body for them.
 *
 * Falling back to compact silently would be the worst outcome: the build would
 * succeed, the film would re-time around a robotic take, and nothing would say
 * why it still sounded synthetic. So a fallback is loud, and a voice that is
 * not installed at all stops the build with the download path.
 */
const resolveVoice = (wanted) => {
  /* `say -v ?` prints "<name> <locale> # <sample>", and the name is not a bare
     word: when one narrator exists in several locales the locale is folded into
     it — "Aman (English (India)) en_IN" — and the column padding collapses to a
     single space. Anchoring on the locale code is the only stable landmark. */
  const installed = execFileSync("say", ["-v", "?"], { encoding: "utf8" })
    .split("\n")
    .map((row) => row.match(/^(.*?)\s+([a-z]{2}(?:_[A-Z]{2})?)\s+#/))
    .filter(Boolean)
    .map(([, name]) => name.trim())
    .map((name) => ({
      name,
      tier: /\((Premium|Enhanced)\)/.exec(name)?.[1] ?? "Compact",
      // Strip the tier and any "(English (India))" locale label to get the person.
      base: name
        .replace(/\s*\((Premium|Enhanced)\)/, "")
        .replace(/\s*\(.*\)\s*$/, "")
        .trim(),
    }));

  const base = wanted.replace(/\s*\((Premium|Enhanced)\)\s*$/, "").trim();
  const mine = installed.filter((v) => v.base === base);
  for (const tier of ["Premium", "Enhanced"]) {
    const hit = mine.find((v) => v.tier === tier);
    if (hit) return hit.name;
  }
  const compact = mine[0]?.name;
  if (compact) {
    console.warn(
      `\n  ! Only the COMPACT "${base}" is installed — the robotic tier.\n` +
        `    System Settings > Accessibility > Spoken Content > System Voice >\n` +
        `    Manage Voices, then download "${base}" and re-run this.\n`,
    );
    return compact;
  }
  console.error(`\nNo voice named "${base}" is installed on this machine.`);
  console.error("System Settings > Accessibility > Spoken Content > System Voice >");
  console.error(`Manage Voices > English, then download "${base}".`);
  console.error("\n`node script/voice-audition.mjs` lists what you do have.\n");
  process.exit(1);
};

/* Resolve BEFORE anything destructive. The wipe used to sit at the top of the
   file, which meant a voice that was configured but not yet downloaded deleted
   the working narration track and only then exited — losing a good take to a
   preflight check. Nothing is removed until there is a voice to rebuild with. */
const VOICE = resolveVoice(spec.voice);

rmSync(AUDIO, { recursive: true, force: true });
mkdirSync(AUDIO, { recursive: true });
mkdirSync(TMP, { recursive: true });

const durationOf = (file) =>
  Number(
    execFileSync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file,
    ]).toString().trim(),
  );

const beats = [];
let cursorFrames = 0;

for (const beat of spec.beats) {
  const lines = [];
  let offset = 0; // seconds from the beat's first frame

  beat.sentences.forEach((text, index) => {
    const name = `${beat.id}-${index}`;
    const aiff = join(TMP, `${name}.aiff`);
    const wav = join(AUDIO, `${name}.wav`);

    /* Trim silence off both ends before measuring.
       `say` is not deterministic: the same sentence, same voice, same rate,
       rendered twice, can differ by seconds — it intermittently pads a take
       with dead air. That is normally invisible, but here every caption and
       every animation phase is derived from the MEASURED duration of these
       files, so a flaky measurement re-times the film and can push a beat past
       the end of its footage. Two runs of this script disagreed by 12 seconds
       and one of them failed the footage guard on a beat the other passed.
       Trimming to the speech itself makes the measurement a property of the
       sentence rather than of the run. Spacing is re-added deliberately below
       via gapSeconds/beatPadSeconds, where it is a decision rather than an
       accident. */
    const trim =
      "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0:detection=peak," +
      "areverse," +
      "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0:detection=peak," +
      "areverse";
    /* Render, then sanity-check the take against how long the sentence should
       plausibly last, and re-roll it if `say` glitched.

       This is not defensive padding — the failure is real and was measured.
       Rendering the whole script three times, 5 of 63 sentences came out
       different each time, and one of them ("Then it goes looking for one
       specific thing…") rendered at 4.6s, then 15.3s, then 4.6s. A 15-second
       take of a 13-word sentence silently stretches its beat past the end of
       its footage and desynchronises every caption after it.

       Word count over words-per-minute is a good enough expectation to catch a
       3x blow-out while never firing on ordinary variation, and taking the
       SHORTEST of the attempts means a run can only ever get closer to the
       sentence's true length. */
    const expected = (text.split(/\s+/).length / spec.rate) * 60;
    const ceiling = Math.max(expected * 1.8, expected + 2.5);
    let seconds = 0;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      execFileSync("say", ["-v", VOICE, "-r", String(spec.rate), "-o", aiff, text]);
      // 48k mono PCM — what Remotion mixes without resampling surprises.
      execFileSync("ffmpeg", [
        "-v", "error", "-y", "-i", aiff, "-af", trim,
        "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", wav,
      ]);
      seconds = durationOf(wav);
      if (seconds <= ceiling) break;
      if (attempt === 4) {
        console.warn(
          `  ! ${name}: ${seconds.toFixed(1)}s after 4 attempts, expected ~${expected.toFixed(1)}s. ` +
            `Keeping it — check this line by ear.`,
        );
      }
    }
    lines.push({
      text,
      src: `audio/${name}.wav`,
      startFrame: Math.round(offset * FPS),
      durationFrames: Math.round(seconds * FPS),
    });
    offset += seconds + spec.gapSeconds;
  });

  // Trailing pad so a beat never cuts the instant the voice stops.
  const beatSeconds = offset - spec.gapSeconds + spec.beatPadSeconds;
  const durationFrames = Math.round(beatSeconds * FPS);

  beats.push({
    id: beat.id,
    kind: beat.kind,
    clip: beat.clip ?? null,
    clipStart: beat.clipStart ?? 0,
    label: beat.label ?? null,
    // A beat may suppress the caption plate when its own artwork already sets
    // the words — the close card being the only one, since the caption would
    // otherwise render "RegOS Sentinel." directly beneath a headline reading
    // RegOS Sentinel.
    captions: beat.captions !== false,
    startFrame: cursorFrames,
    durationFrames,
    lines,
  });
  cursorFrames += durationFrames;
}

/* A beat may never outrun the clip it plays. When it does, the tail of the beat
   renders as black or as a frozen last frame while the narration keeps talking —
   the exact failure that is invisible in the studio's first second and obvious
   in the finished file. Fail here instead. */
const short = [];
for (const beat of beats) {
  if (beat.kind !== "clip") continue;
  const clipPath = join(ROOT, "public", "capture", `${beat.clip}.mp4`);
  const available = durationOf(clipPath) - beat.clipStart;
  const needed = beat.durationFrames / FPS;
  if (available < needed) {
    short.push(
      `  ${beat.id}: needs ${needed.toFixed(1)}s from ${beat.clip}.mp4 at ` +
        `${beat.clipStart}s, but only ${available.toFixed(1)}s remain ` +
        `(short by ${(needed - available).toFixed(1)}s)`,
    );
  }
}
if (short.length > 0) {
  console.error("\nBeats longer than their footage:\n" + short.join("\n"));
  console.error("\nLower clipStart in narration.json, or capture a longer clip.");
  process.exit(1);
}

const timing = { fps: FPS, totalFrames: cursorFrames, beats };
writeFileSync(join(HERE, "timing.json"), `${JSON.stringify(timing, null, 2)}\n`);
rmSync(TMP, { recursive: true, force: true });

console.log(`voice: ${VOICE} @ ${spec.rate} wpm`);
for (const beat of beats) {
  console.log(
    `  ${beat.id.padEnd(12)} ${(beat.durationFrames / FPS).toFixed(1)}s` +
      `  (${beat.lines.length} line${beat.lines.length === 1 ? "" : "s"})`,
  );
}
console.log(`\ntotal ${(cursorFrames / FPS).toFixed(1)}s · ${cursorFrames} frames @ ${FPS}fps`);
