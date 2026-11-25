/*
 * Turns a photo into block ASCII: one shade character (░ ▒ ▓ █) and one
 * colour per cell. The shades are drawn as dither patterns, so the white
 * paper shows through the lighter ones.
 */

/** The ground the characters are drawn on. */
export const PAPER: [number, number, number] = [255, 255, 255];

/** Width and height of one cell, in canvas pixels. */
export const CELL_W = 3;
export const CELL_H = 5;

/**
 * Lit pixels for each shade, row-major inside a cell. Index 0 is an empty
 * cell, then ░ ▒ ▓ █.
 */
const PATTERNS: ((x: number, y: number) => number)[] = [
  () => 0,
  (x, y) => +(x % 2 === 0 && y % 2 === 0),
  (x, y) => +((x + y) % 2 === 0),
  (x, y) => +!(x % 2 === 1 && y % 2 === 1),
  () => 1,
];

export const SHADES: Uint8Array[] = PATTERNS.map((lit) => {
  const mask = new Uint8Array(CELL_W * CELL_H);
  for (let y = 0; y < CELL_H; y++) for (let x = 0; x < CELL_W; x++) mask[y * CELL_W + x] = lit(x, y);
  return mask;
});

/**
 * Share of cells at or below each shade, lightest first, after the reference
 * export: almost no ░, a fifth ▒, a third ▓, the rest █.
 */
const SHARE = [0, 0.01, 0.21, 0.53];
/** Random spread added to each cell's tone so shades speckle into each other. */
const GRAIN = 0.14;

export type Grid = {
  cols: number;
  rows: number;
  /** Index into SHADES for each cell, row-major. */
  shade: Uint8Array;
  /** r, g, b for each cell, row-major. */
  rgb: Uint8ClampedArray;
};

/** Samples the image down to `cols × rows` and picks each cell's shade by rank: darker cells, denser blocks. */
export function sample(image: CanvasImageSource, cols: number, rows: number): Grid {
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, cols, rows);
  const { data } = ctx.getImageData(0, 0, cols, rows);

  const n = cols * rows;
  const tone = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const l = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
    tone[i] = 1 - l + (hash(i % cols, (i / cols) | 0) - 0.5) * GRAIN;
  }
  // Thresholds from the tones' own spread, so every season gets the same mix of shades.
  const sorted = tone.slice().sort();
  const cuts = SHARE.map((s) => sorted[Math.min(n - 1, Math.floor(s * n))]);

  const shade = new Uint8Array(n);
  const rgb = new Uint8ClampedArray(n * 3);
  for (let i = 0; i < n; i++) {
    let s = 4;
    while (s > 1 && tone[i] < cuts[s - 1]) s--;
    shade[i] = s;
    rgb[i * 3] = data[i * 4];
    rgb[i * 3 + 1] = data[i * 4 + 1];
    rgb[i * 3 + 2] = data[i * 4 + 2];
  }
  return { cols, rows, shade, rgb };
}

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Smooth value noise in 0–1, for uneven fronts. */
export function noise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Packs a colour as ABGR, the byte order ImageData has on little-endian machines. */
export function pack(r: number, g: number, b: number) {
  return (
    (0xff000000 |
      (Math.min(255, Math.max(0, b)) << 16) |
      (Math.min(255, Math.max(0, g)) << 8) |
      Math.min(255, Math.max(0, r))) >>> 0
  );
}
