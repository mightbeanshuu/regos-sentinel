# Turning the live model on (Render)

The production API ships **sealed**: no model key, no outbound calls, recorded
Gemini traces replay. To let the four agents plan live in production:

1. Render dashboard → service **regos-sentinel-api-sebi** → **Environment**.
2. Add:

   ```
   GEMINI_API_KEY=PASTE_YOUR_KEY_HERE
   ```

3. **Delete the `REGOS_OFFLINE` variable** — its presence is what keeps the
   engine sealed. Render redeploys automatically (~3 min).

The planner walks the Gemini ladder (2.5-pro → flash-latest → 2.0-flash →
flash-lite) and records which model actually answered on every trace. To go
back to sealed mode, re-add `REGOS_OFFLINE=1` and remove the key.

Recommendation for the jury demo: stay sealed. The cassettes are real Gemini
traces, and a hermetic server is the stronger regulator story; a rate-limit
mid-demo is the only thing live mode can add.
