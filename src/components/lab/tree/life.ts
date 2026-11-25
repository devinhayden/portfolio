/*
 * A hawthorn's year in block ASCII. Every leaf's state is a pure function of
 * the position along the year, so the dial can scrub it either way:
 *
 *   0 spring  fresh leaves under pink may blossom, deepening to lush
 *   1 summer  green; from here leaves turn yellow, orange and brown
 *   2 autumn  outer leaves first; then they let go, drift down, and heap
 *   3 winter  bare, frosted branches; the heap has rotted away; buds swell
 *             from the trunk outward, then the blossom opens, back to spring at 4
 */
import { CELL_H, CELL_W, noise, pack, PAPER, SHADES } from "../seasons/ascii";
import type { Anatomy } from "./anatomy";

/** Brightness of each cell's last pixel column: the faint seams between characters. */
const SEAM = 0.82;
/** How far summer pushes the photo's greens away from grey. */
const LUSH = 2.4;
/** Share of leaves that flower in spring. */
const BLOSSOMS = 0.16;
/** How many rows the leaf heap stands at its middle. */
const HEAP = 9;

// Colours.
const BUD: Rgb = [176, 214, 118];
/** May blossom, blushed pink so it reads against the white paper. */
const BLOSSOM: Rgb = [244, 184, 206];
const AUTUMN: Rgb[] = [
  [232, 184, 56],
  [222, 118, 36],
  [150, 66, 34],
];
const DEAD: Rgb = [112, 76, 44];
const FROST: Rgb = [132, 156, 188];

type Rgb = [number, number, number];

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => {
  t = clamp01(t);
  return t * t * (3 - 2 * t);
};
/** 0 before `a`, 1 after `a + span`, eased between. */
const ramp = (u: number, a: number, span: number) => smooth((u - a) / span);
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Everything about one leaf's year that doesn't change frame to frame. */
type Life = {
  c: number;
  r: number;
  shade: number;
  wood: boolean;
  blossom: boolean;
  /** The leaf as photographed, for bark seen through the canopy. */
  photo: Rgb;
  summer: Rgb;
  spring: Rgb;
  autumn: Rgb;
  dead: Rgb;
  /** When it deepens to summer green, sheds its blossom, turns, falls, lands, rots, buds, and flowers. */
  deepen: number;
  shed: number;
  turn: number;
  fall: number;
  land: number;
  rot: number;
  bud: number;
  flower: number;
  /** Where it falls from and to, in canvas pixels, and how it sways. */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  sway: number;
  phase: number;
};

export class TreeLife {
  private ctx: CanvasRenderingContext2D;
  private image: ImageData;
  private pixels: Uint32Array;
  private lives: Life[];
  private position = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private anatomy: Anatomy,
  ) {
    canvas.width = anatomy.cols * CELL_W;
    canvas.height = anatomy.rows * CELL_H;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("2D canvas unavailable");
    this.ctx = ctx;
    this.image = ctx.createImageData(canvas.width, canvas.height);
    this.pixels = new Uint32Array(this.image.data.buffer);

    let mean = 0;
    for (const l of anatomy.leaves) mean += lum(l.rgb);
    mean /= Math.max(1, anatomy.leaves.length);
    const { base, trunkX, spread } = anatomy;

    this.lives = anatomy.leaves.map((l) => {
      const [r1, r2, r3, r4] = l.rand;
      // Keep each leaf's light and shadow when it changes colour.
      const k = Math.min(1.4, Math.max(0.45, lum(l.rgb) / mean));
      // Clumps of the canopy turn together, yellow, orange or russet, with a little scatter.
      const hue = clamp01(noise(l.c * 0.07, l.r * 0.09) * 1.5 - 0.25 + (r4 - 0.5) * 0.35);
      const autumn = hue < 0.5 ? mix(AUTUMN[0], AUTUMN[1], hue * 2) : mix(AUTUMN[1], AUTUMN[2], hue * 2 - 1);
      const fall = 1.95 + 0.65 * clamp01(r1 * 0.7 + (1 - l.order) * 0.3);
      const land = fall + 0.12 + 0.08 * r2;
      const x0 = (l.c + 0.5) * CELL_W;
      const y0 = (l.r + 0.5) * CELL_H;
      // Leaves drift a little downwind and heap into a mound around the trunk:
      // deep in the middle, thinning to a scatter at the edges.
      const x1 = Math.min(canvas.width - 1, Math.max(0, x0 + (r3 + r1 - 0.85) * 26));
      const across = (x1 - trunkX) / (spread * 1.15);
      const height = HEAP * Math.max(0.12, 1 - across * across);
      const y1 = (base + 2.5 - Math.pow(r4, 1.6) * height) * CELL_H;
      const summer = lush(l.rgb);
      return {
        c: l.c,
        r: l.r,
        shade: l.shade,
        wood: l.wood,
        blossom: !l.wood && r2 < BLOSSOMS,
        photo: l.rgb,
        summer,
        spring: [l.rgb[0] * 0.95 + 22, l.rgb[1] * 1.12 + 36, l.rgb[2] * 0.85 + 10],
        autumn: [autumn[0] * k, autumn[1] * k, autumn[2] * k],
        dead: [DEAD[0] * k, DEAD[1] * k, DEAD[2] * k],
        deepen: 0.2 + 0.6 * (0.5 * l.order + 0.5 * r2),
        shed: 0.25 + 0.35 * r1,
        turn: 1.1 + 0.5 * clamp01((1 - l.order) * 0.6 + r3 * 0.4),
        fall,
        land,
        rot: Math.max(land + 0.04, 2.8 + 0.12 * r1),
        // Leaves fill the canopy first; the blossom opens over them once they're out.
        bud: 3.05 + 0.4 * l.order + 0.1 * r1,
        flower: 3.72 + 0.12 * l.order + 0.08 * r3,
        x0,
        y0,
        x1,
        y1,
        sway: 6 + 12 * r2,
        phase: r3 * Math.PI * 2,
      };
    });
    this.draw();
  }

  /** Where in the year to show: 0 is spring, 1 summer, and on round. */
  setPosition(position: number) {
    this.position = position;
  }

  draw() {
    const u = mod(this.position, 4);
    const { anatomy, pixels } = this;
    pixels.fill(pack(...PAPER));

    // The bare branches first, frosted around midwinter.
    const frost = ramp(u, 2.9, 0.15) * (1 - ramp(u, 3.25, 0.25));
    for (let i = 0; i < anatomy.barkShade.length; i++) {
      const shade = anatomy.barkShade[i];
      if (!shade) continue;
      const bark: Rgb = [anatomy.barkRgb[i * 3], anatomy.barkRgb[i * 3 + 1], anatomy.barkRgb[i * 3 + 2]];
      const rgb = frost ? mix(bark, FROST, frost * (anatomy.barkThin[i] ? 0.45 : 0.2)) : bark;
      this.cell(i % anatomy.cols, (i / anatomy.cols) | 0, shade, rgb);
    }

    // Leaves on the tree, then on the ground, then in the air, so falling ones pass in front.
    const ground: Life[] = [];
    const air: Life[] = [];
    for (const l of this.lives) {
      if (l.wood) {
        // Bark seen through the leaves: it fades with them, leaving the bare branches.
        const fade = u >= 3 ? 1 - ramp(u, l.bud, 0.2) : ramp(u, l.fall - 0.1, 0.2);
        const shade = Math.round(l.shade * (1 - fade));
        if (shade) this.cell(l.c, l.r, shade, l.photo);
      } else if (u >= 3) {
        // Budding: each leaf swells from nothing to its full shade, and some flower.
        const g = clamp01((u - l.bud) / 0.2);
        if (g < 0.15) continue;
        let rgb = mix(BUD, l.spring, g);
        if (l.blossom) rgb = mix(rgb, BLOSSOM, ramp(u, l.flower, 0.08));
        this.cell(l.c, l.r, Math.max(1, Math.round(g * l.shade)), rgb);
      } else if (u < l.fall) {
        this.cell(l.c, l.r, l.shade, this.colour(l, u));
      } else if (u < l.land) {
        air.push(l);
      } else if (u < l.rot + 0.07) {
        ground.push(l);
      }
    }
    // Lowest on the screen last, so the front of the heap overlaps the back.
    ground.sort((a, b) => a.y1 - b.y1);
    for (const l of ground) {
      const brown = mix(this.colour(l, l.fall), l.dead, ramp(u, l.land, 0.15));
      const decay = ramp(u, l.rot, 0.07);
      const shade = Math.round(3 * (1 - decay));
      if (shade) this.cell(Math.floor(l.x1 / CELL_W), Math.floor(l.y1 / CELL_H), shade, mix(brown, PAPER, decay * 0.6));
    }
    for (const l of air) {
      const q = (u - l.fall) / (l.land - l.fall);
      // Slow to let go, then a steady drop, swaying side to side and tumbling.
      const drop = q * q * 0.35 + q * 0.65;
      const x = l.x0 + (l.x1 - l.x0) * q + Math.sin(q * Math.PI * 3 + l.phase) * l.sway * (1 - q * 0.5);
      const y = l.y0 + (l.y1 - l.y0) * drop;
      const tumble = Math.floor(q * 10 + l.phase) % 2;
      this.cell(Math.floor(x / CELL_W), Math.floor(y / CELL_H), 3 + tumble, this.colour(l, l.fall));
    }

    this.ctx.putImageData(this.image, 0, 0);
  }

  /** A leaf's colour while it's still on the tree. */
  private colour(l: Life, u: number): Rgb {
    if (u < 1) {
      const green = mix(l.spring, l.summer, ramp(u, l.deepen, 0.2));
      return l.blossom ? mix(green, BLOSSOM, 1 - ramp(u, l.shed, 0.15)) : green;
    }
    const turned = mix(l.summer, l.autumn, ramp(u, l.turn, 0.25));
    // Just before letting go, it starts to die.
    return mix(turned, l.dead, 0.45 * ramp(u, l.fall - 0.15, 0.15));
  }

  private cell(c: number, r: number, shade: number, rgb: Rgb) {
    const { cols, rows } = this.anatomy;
    if (c < 0 || r < 0 || c >= cols || r >= rows) return;
    const lit = pack(rgb[0], rgb[1], rgb[2]);
    const seam = pack(rgb[0] * SEAM, rgb[1] * SEAM, rgb[2] * SEAM);
    const mask = SHADES[shade];
    const stride = cols * CELL_W;
    const x0 = c * CELL_W;
    const y0 = r * CELL_H;
    for (let y = 0; y < CELL_H; y++) {
      const row = (y0 + y) * stride + x0;
      for (let x = 0; x < CELL_W; x++) {
        if (mask[y * CELL_W + x]) this.pixels[row + x] = x === CELL_W - 1 ? seam : lit;
      }
    }
  }
}

/** High-summer green: the photo's colour pulled away from grey and leaned toward a rich leaf green. */
function lush(rgb: Rgb): Rgb {
  const l = lum(rgb);
  const [r, g, b] = rgb.map((v) => l + (v - l) * LUSH);
  return [r * 0.72, g * 1.18 + 8, b * 0.5];
}

function lum([r, g, b]: Rgb) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
