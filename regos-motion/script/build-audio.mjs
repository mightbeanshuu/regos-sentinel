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
  const installed = execFileSync("say", ["-v", "?"], { encoding: "utf8" })
    .split("\n")
    .map((row) => row.match(/^(.+?)\s{2,}\S+\s+#/))
    .filter(Boolean)
    .map(([, name]) => name.trim());

  const base = wanted.replace(/\s*\((Premium|Enhanced)\)\s*$/, "");
  for (const tier of ["Premium", "Enhanced"]) {
    const hit = installed.find((name) => name === `${base} (${tier})`);
    if (hit) return hit;
  }
  const compact = installed.find((name) => name === base);
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

    execFileSync("say", ["-v", VOICE, "-r", String(spec.rate), "-o", aiff, text]);
    // 48k mono PCM — what Remotion mixes without resampling surprises.
    execFileSync("ffmpeg", [
      "-v", "error", "-y", "-i", aiff, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", wav,
    ]);

    const seconds = durationOf(wav);
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
