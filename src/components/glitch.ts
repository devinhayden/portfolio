/**
 * The channel change, shared as GLSL source by both canvases.
 *
 * Everything here works in *page space* — pixels relative to the scene's
 * untransformed top-left — so the background and the lens window break into
 * the same bands at the same heights, and a tear runs straight through the
 * window instead of stopping at its border.
 */
export const GLITCH_GLSL = `
const float GLITCH_BANDS = 42.0;
/** Share of bands that lose the signal at the peak. */
const float GLITCH_TEAR_DENSITY = 0.45;
/** How far a torn band slides, as a share of the viewport width. */
const float GLITCH_TEAR_WIDTH = 0.055;
/** How hard a torn band smears from a single held column. */
const float GLITCH_STRETCH = 0.85;

float glitchHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

/** 0 at both ends of a swap, 1 at its peak. */
float glitchBurst(float t) {
  return pow(sin(clamp(t, 0.0, 1.0) * 3.14159265), 0.75);
}

float glitchBand(vec2 page, vec2 viewport) {
  return floor(page.y / max(viewport.y, 1.0) * GLITCH_BANDS);
}

float glitchTorn(float band, float seed) {
  return step(1.0 - GLITCH_TEAR_DENSITY, glitchHash(vec2(band, seed + 17.0)));
}

/**
 * Which photo a band is showing. Bands flip one by one rather than together,
 * so the picture changes underneath the noise instead of dissolving through it.
 */
float glitchCut(float band, float t, float seed) {
  return step(glitchHash(vec2(band, seed + 91.0)), smoothstep(0.3, 0.7, t));
}

/**
 * Breaks the picture into horizontal bands that slide sideways and smear from
 * a held column — pixels stretched by a signal that dropped, rather than
 * pixels simply moved.
 */
vec2 glitchDisplace(vec2 page, vec2 viewport, float t, float seed) {
  float burst = glitchBurst(t);
  if (burst <= 0.0) return page;

  float band = glitchBand(page, viewport);
  float torn = glitchTorn(band, seed);

  float slide = (glitchHash(vec2(band, seed)) - 0.5) * 2.0
    * GLITCH_TEAR_WIDTH * viewport.x * burst * torn;
  float hold = glitchHash(vec2(band, seed + 41.0)) * viewport.x;
  float stretch = GLITCH_STRETCH * burst * torn
    * glitchHash(vec2(band, seed + 7.0));

  return vec2(mix(page.x + slide, hold, stretch), page.y);
}
`;

/** A fresh seed per swap, so no two channel changes tear alike. */
export const glitchSeed = () => Math.random() * 100;
