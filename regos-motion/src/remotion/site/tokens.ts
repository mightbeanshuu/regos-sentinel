/**
 * The film's palette is the product's palette, copied from the deployed
 * stylesheet (`web/app/parts/romer.css`) rather than re-invented.
 *
 * This matters more than usual here: most of the runtime is real screen
 * recording, so any colour the film adds sits directly against the real thing.
 * The old pitch palette was royal blue, which would have fought every frame.
 */

export const BG = '#070708'; // --bg
export const INK = '#f7f8f7'; // --ink
export const INK_2 = '#a1a3a6'; // --ink-2
export const INK_3 = '#7c7f83'; // --ink-3, the AA floor
export const LINE = '#202124'; // --line
export const LINE_2 = '#2b2c2f'; // --line-2
export const BRAND = '#d0fe67'; // --brand, lime: brand and action only
export const ACCENT = '#c8cbff'; // --accent, periwinkle: computed / informational
export const OK = '#76d2e3'; // --ok
export const REVIEW = '#ffc297'; // --review, "needs a person"
export const FAIL = '#ff9d9d'; // --fail

export const SANS =
  'ui-sans-serif, -apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
export const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

/** Timing tokens, in frames at 30fps. */
export const T = {
  micro: 5,
  fast: 9,
  base: 15,
  slow: 24,
} as const;
