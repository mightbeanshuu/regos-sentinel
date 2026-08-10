#!/bin/bash
# Renders the RegOS Sentinel product film locally.
#
#   ./render-demo.sh            # verification stills, then the full 4:11 render
#   ./render-demo.sh stills     # stills only (fast — check before spending minutes)
#   ./render-demo.sh audio      # regenerate the voice track + timing, then stills
#
# The film is 1920x1080 @ 30fps, 7537 frames, driven entirely by script/timing.json.
set -euo pipefail
cd "$(dirname "$0")"

MODE="${1:-full}"
OUT_FILE="out/RegOS_Sentinel_Demo.mp4"

if [ "$MODE" = "audio" ]; then
  echo "==> rebuilding narration + timing"
  node script/build-audio.mjs
fi

echo "==> typecheck"
npx tsc --noEmit

echo "==> verification stills (one per beat kind)"
mkdir -p out/verify
for FRAME in 212 607 1016 3079 4392 6153 7440; do
  npx remotion still RegOSSiteDemo "out/verify/f${FRAME}.png" --frame="$FRAME" --log=error
  echo "    out/verify/f${FRAME}.png"
done

if [ "$MODE" = "stills" ]; then
  echo "==> stills only; stopping here"
  exit 0
fi

echo "==> rendering $OUT_FILE  (7537 frames @ 30fps = 4:11)"
npx remotion render RegOSSiteDemo "$OUT_FILE" \
  --codec h264 \
  --crf 17 \
  --concurrency 4 \
  --log=info

echo
echo "==> done"
ls -lh "$OUT_FILE"
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$OUT_FILE" || true
echo
echo "Open it with:  open '$OUT_FILE'"
