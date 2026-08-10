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
rmSync(AUDIO, { recursive: true, force: true });
mkdirSync(AUDIO, { recursive: true });
mkdirSync(TMP, { recursive: true });

const spec = JSON.parse(readFileSync(join(HERE, "narration.json"), "utf8"));
const FPS = 30;

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

    execFileSync("say", ["-v", spec.voice, "-r", String(spec.rate), "-o", aiff, text]);
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

console.log(`voice: ${spec.voice} @ ${spec.rate} wpm`);
for (const beat of beats) {
  console.log(
    `  ${beat.id.padEnd(12)} ${(beat.durationFrames / FPS).toFixed(1)}s` +
      `  (${beat.lines.length} line${beat.lines.length === 1 ? "" : "s"})`,
  );
}
console.log(`\ntotal ${(cursorFrames / FPS).toFixed(1)}s · ${cursorFrames} frames @ ${FPS}fps`);
