// Asset registry for the pitch film.
//
// The film is CODE-FIRST: every beat renders fully without any external asset.
// Canva plates / Jitter overlays / isolated 3D stills are OPTIONAL enrichment.
// Drop a file into public/assets/pitch/<name>, flip its flag to `true` here,
// and the corresponding beat swaps its coded background for the cinematic plate.
//
// Filenames map to the director-brief Canva prompts A–E + the app icon + Jitter.

export const ASSET_DIR = 'assets/pitch';

export const ASSET_FILES = {
  bloom: 'plate_bloom.mp4', // A — dark logo bloom (void + brand)
  signal: 'plate_signal.mp4', // B — regulatory signal field, near-black (product stage)
  light: 'plate_light.mp4', // E — light contrast plate (verify / reg-diff)
  monolith: 'art_monolith.png', // C — compliance monolith (transparent PNG)
  docgraph: 'art_docgraph.png', // D — documents→obligation graph (transparent PNG)
  appIcon: 'icon_app.png', // isolated 3D app icon (transparent PNG)
  logoSplash: 'jitter_logo_splash.json', // Jitter Lottie (or .webm) — brand splash
} as const;

// Flip to true per asset when the real file is dropped into public/assets/pitch/.
export const HAS: Record<keyof typeof ASSET_FILES, boolean> = {
  bloom: false, // ✗ Canva plate read as cheap AI-slop (sonar rings) → SignalFieldSVG
  signal: false, // ✗ Canva plate read as cheap AI-slop (laser streaks) → SignalFieldSVG
  light: false, // ✗ Canva plate read as cheap AI-slop → SignalFieldSVG (light tone)
  monolith: true, // art_monolith.png ✓ (944×1680 RGBA) — KEEP, looks genuinely good
  docgraph: false, // art_docgraph.png is RGB (white bg, no alpha) — don't composite on dark
  appIcon: true, // icon_app.png ✓ (822×812 RGBA) — KEEP, looks genuinely good
  logoSplash: false,
};
