#!/bin/bash
# Opens Remotion Studio for the RegOS Sentinel product film.
#
#   ./studio.sh          # http://localhost:3010
#   ./studio.sh 3011     # pick another port
#
# Port 3010, not Remotion's default 3000 — the RegOS web app's dev server
# already holds 3000, and Remotion silently hopping to another port is the
# kind of thing you only notice after staring at the wrong tab.
#
# In the studio, choose the "RegOSSiteDemo" composition in the left sidebar.
# It is 7537 frames @ 30fps (4:11). Scrub with the timeline; the beat names
# (hook, chrome, dashboard, …) appear as nested sequences so you can jump
# straight to one. Press Space to play with sound.
set -euo pipefail
cd "$(dirname "$0")"

PORT="${1:-3010}"

echo "==> Remotion Studio on http://localhost:${PORT}"
echo "    composition: RegOSSiteDemo  (7537 frames @ 30fps = 4:11)"
echo

# Open the browser once the studio is actually listening.
(
  for _ in $(seq 1 60); do
    if curl -s -o /dev/null "http://localhost:${PORT}"; then
      open "http://localhost:${PORT}"
      break
    fi
    sleep 1
  done
) &

exec npx remotion studio --port "${PORT}"
