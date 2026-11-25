/*
 * Reads two cut-out photos of one tree, in leaf and bare, into parts the life
 * cycle can move separately: the bare branches as a fixed layer, and each
 * leafy cell as its own leaf. The bare photo is lined up to the leafy one by
 * trunk base and height, since the two are framed a little differently.
 */
import { CELL_H, CELL_W } from "../seasons/ascii";

/** Rows of ground under the trunk, where leaves land. */
export const GROUND_ROWS = 4;

/** Share of cells at or below each shade, after the block ASCII reference. */
const SHARE = [0, 0.01, 0.21, 0.53];
/** Random spread added to each cell's tone so shades speckle into each other. */
const GRAIN = 0.14;
/**
 * Share of the bare photo's cells at or below each shade, ranked by how much
 * dark wood they hold (coverage times darkness): the faintest stay empty, and
 * only the solid limbs reach █.
 */
const WOOD = [0.28, 0.48, 0.73, 0.88];

export type Leaf = {
  /** Cell column and row on the tree. */
  c: number;
  r: number;
  shade: number;
  rgb: [number, number, number];
  /** Bark showing through the summer canopy: it fades out rather than turning and falling. */
  wood: boolean;
  /** 0 near the trunk, 1 at the canopy's edge. */
  order: number;
  /** Four independent randoms in 0–1. */
  rand: [number, number, number, number];
};

export type Anatomy = {
  cols: number;
  rows: number;
  /** Row of the trunk's base, and its centre and the canopy's half-width in canvas pixels. */
  base: number;
  trunkX: number;
  spread: number;
  /** Shade and colour for branch cells, from the bare photo; shade 0 is empty. */
  barkShade: Uint8Array;
  barkRgb: Uint8ClampedArray;
  /** 1 where the bark is a twig, which frosts more than the limbs. */
  barkThin: Uint8Array;
  leaves: Leaf[];
};

export function dissect(leafy: HTMLImageElement, bare: HTMLImageElement, cols: number): Anatomy {
  const W = leafy.naturalWidth;
  const H = leafy.naturalHeight;
  const treeRows = Math.round((cols * CELL_W * H) / W / CELL_H);
  const rows = treeRows + GROUND_ROWS;
  const n = cols * treeRows;
  const random = mulberry32(7);

  // Line the bare photo up with the leafy one: same trunk base, same height.
  const L = silhouette(leafy);
  const B = silhouette(bare);
  const s = (L.bottom - L.top) / (B.bottom - B.top);
  const sx = cols / W;
  const sy = treeRows / H;
  const bareData = sample(bare, cols, treeRows, {
    x: (L.trunkX - B.trunkX * s) * sx,
    y: (L.bottom - B.bottom * s) * sy,
    w: bare.naturalWidth * s * sx,
    h: bare.naturalHeight * s * sy,
  });
  const leafData = sample(leafy, cols, treeRows, { x: 0, y: 0, w: cols, h: treeRows });

  // Branches: shade by how much dark wood each cell holds. Twig cells pick up
  // the white the photo was cut from, so they take the limbs' bark colour
  // instead, a little lighter, letting the limbs lead.
  const barkShade = new Uint8Array(cols * rows);
  const barkRgb = new Uint8ClampedArray(cols * rows * 3);
  const barkThin = new Uint8Array(cols * rows);
  const wood = new Float32Array(n);
  const woods: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = bareData[i * 4 + 3] / 255;
    if (a < 0.05) continue;
    const l = (0.2126 * bareData[i * 4] + 0.7152 * bareData[i * 4 + 1] + 0.0722 * bareData[i * 4 + 2]) / 255;
    wood[i] = a * (1 - l);
    woods.push(wood[i]);
  }
  woods.sort((a, b) => a - b);
  const woodCuts = WOOD.map((q) => woods[Math.min(woods.length - 1, Math.floor(q * woods.length))]);
  const limb = [0, 0, 0];
  let limbs = 0;
  for (let i = 0; i < n; i++) {
    if (!wood[i]) continue;
    let shade = 0;
    while (shade < 4 && wood[i] > woodCuts[shade]) shade++;
    if (!shade) continue;
    barkShade[i] = shade;
    barkThin[i] = shade < 4 ? 1 : 0;
    if (shade < 4) continue;
    for (let k = 0; k < 3; k++) {
      barkRgb[i * 3 + k] = bareData[i * 4 + k];
      limb[k] += bareData[i * 4 + k];
    }
    limbs++;
  }
  for (let i = 0; i < n; i++) {
    if (!barkThin[i]) continue;
    const k = (1.05 + 0.2 * random()) / Math.max(1, limbs);
    barkRgb.set([limb[0] * k + 12, limb[1] * k + 12, limb[2] * k + 12], i * 3);
  }

  // The trunk below the canopy: rows from the bottom up that are only a narrow run of cells.
  const opaque = (i: number) => leafData[i * 4 + 3] > 128;
  let trunkTop = treeRows;
  let base = 0;
  for (let r = treeRows - 1; r >= 0; r--) {
    let lo = cols;
    let hi = -1;
    for (let c = 0; c < cols; c++) {
      if (!opaque(r * cols + c)) continue;
      lo = Math.min(lo, c);
      hi = Math.max(hi, c);
    }
    if (hi < 0) continue;
    if (!base) base = r;
    if (hi - lo > cols * 0.12) break;
    trunkTop = r;
  }

  // Leaves: every opaque cell above the bare trunk, ranked by darkness so shadows get the densest blocks.
  const tone = new Float32Array(n).fill(-1);
  const tones: number[] = [];
  let left = cols;
  let right = 0;
  for (let i = 0; i < n; i++) {
    if (!opaque(i) || ((i / cols) | 0) >= trunkTop) continue;
    const l = (0.2126 * leafData[i * 4] + 0.7152 * leafData[i * 4 + 1] + 0.0722 * leafData[i * 4 + 2]) / 255;
    tone[i] = 1 - l + (random() - 0.5) * GRAIN;
    tones.push(tone[i]);
    left = Math.min(left, i % cols);
    right = Math.max(right, i % cols);
  }
  tones.sort((a, b) => a - b);
  const cuts = SHARE.map((q) => tones[Math.min(tones.length - 1, Math.floor(q * tones.length))]);
  const shadeOf = (t: number) => {
    let shade = 4;
    while (shade > 1 && t < cuts[shade - 1]) shade--;
    return shade;
  };

  const trunkX = (L.trunkX / W) * cols * CELL_W;
  const root = { x: trunkX, y: trunkTop * CELL_H };
  const cells: number[] = [];
  let far = 1;
  for (let i = 0; i < n; i++) {
    if (tone[i] < 0) continue;
    cells.push(i);
    far = Math.max(far, Math.hypot(((i % cols) + 0.5) * CELL_W - root.x, (((i / cols) | 0) + 0.5) * CELL_H - root.y));
  }
  const leaves: Leaf[] = cells.map((i) => {
    const c = i % cols;
    const r = (i / cols) | 0;
    const rgb: [number, number, number] = [leafData[i * 4], leafData[i * 4 + 1], leafData[i * 4 + 2]];
    const chroma = Math.max(...rgb) - Math.min(...rgb);
    return {
      c,
      r,
      shade: shadeOf(tone[i]),
      rgb,
      wood: chroma < 18 && tone[i] > cuts[3] && barkShade[i] === 4,
      order: Math.hypot((c + 0.5) * CELL_W - root.x, (r + 0.5) * CELL_H - root.y) / far,
      rand: [random(), random(), random(), random()],
    };
  });

  return {
    cols,
    rows,
    base,
    trunkX,
    spread: ((right - left + 1) / 2) * CELL_W,
    barkShade,
    barkRgb,
    barkThin,
    leaves,
  };
}

/** Top and bottom of the tree, and the middle of the trunk's base, in the image's own pixels. */
function silhouette(img: HTMLImageElement) {
  const w = 300;
  const h = Math.round((w * img.naturalHeight) / img.naturalWidth);
  const data = sample(img, w, h, { x: 0, y: 0, w, h });
  let top = -1;
  let bottom = -1;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (data[(r * w + c) * 4 + 3] <= 128) continue;
      if (top < 0) top = r;
      bottom = r;
    }
  }
  // The trunk's centre, averaged over the bottom few rows.
  let sum = 0;
  let count = 0;
  for (let r = Math.max(0, bottom - Math.round(h * 0.03)); r <= bottom; r++) {
    for (let c = 0; c < w; c++) {
      if (data[(r * w + c) * 4 + 3] <= 128) continue;
      sum += c;
      count++;
    }
  }
  const scale = img.naturalWidth / w;
  return { top: top * scale, bottom: (bottom + 1) * scale, trunkX: ((sum / Math.max(1, count)) + 0.5) * scale };
}

function sample(img: HTMLImageElement, cols: number, rows: number, at: { x: number; y: number; w: number; h: number }) {
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, at.x, at.y, at.w, at.h);
  return ctx.getImageData(0, 0, cols, rows).data;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
