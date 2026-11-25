/*
 * The seasons scene: four aligned photos drawn as one grid of block ASCII.
 * A position along the year picks what's shown: whole numbers are seasons,
 * and in between, the next season sweeps diagonally across the scene from
 * the bottom-left corner, cells flickering through shades as they turn.
 */
import { CELL_H, CELL_W, noise, pack, PAPER, sample, SHADES, type Grid } from "./ascii";

export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export type Season = (typeof SEASONS)[number];

/** Width of the turning band, as a share of the sweep. */
const BAND = 0.14;
/** How ragged the front is, as a share of the sweep. */
const JITTER = 0.22;
/** How often a turning cell picks a new shade, in seconds. */
const FLICKER = 0.06;
/** Brightness of each cell's last pixel column: the faint seams between characters. */
const SEAM = 0.82;
/** At the middle of a turn, how much of a cell's colour washes into its gaps. */
const GAP_FILL = 0.4;

const smooth = (t: number) => t * t * (3 - 2 * t);

export class SeasonScene {
  private ctx: CanvasRenderingContext2D;
  private image: ImageData;
  private pixels: Uint32Array;
  readonly cols: number;
  readonly rows: number;

  private grids: Grid[];
  /** When each cell starts turning, 0–1 along the sweep. */
  private order: Float32Array;
  private position = 0;
  private reduced = false;

  constructor(
    private canvas: HTMLCanvasElement,
    images: CanvasImageSource[],
    aspect: number,
    cols: number,
  ) {
    this.cols = cols;
    this.rows = Math.round((cols * CELL_W) / aspect / CELL_H);
    canvas.width = this.cols * CELL_W;
    canvas.height = this.rows * CELL_H;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("2D canvas unavailable");
    this.ctx = ctx;
    this.image = ctx.createImageData(canvas.width, canvas.height);
    this.pixels = new Uint32Array(this.image.data.buffer);
    this.grids = images.map((img) => sample(img, this.cols, this.rows));

    // Project each cell onto the diagonal from bottom-left to top-right, in pixels.
    const { rows } = this;
    const w = cols * CELL_W;
    const h = rows * CELL_H;
    const len2 = w * w + h * h;
    this.order = new Float32Array(cols * rows);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const along = ((c + 0.5) * CELL_W * w + (rows - r - 0.5) * CELL_H * h) / len2;
        const wobble = noise(c * 0.07, r * 0.11);
        this.order[r * cols + c] = along + wobble * JITTER;
      }
    }
    this.draw(0);
  }

  /** True while some cells sit mid-turn, so the flicker needs frames. */
  get turning() {
    const f = this.position - Math.floor(this.position);
    return !this.reduced && f > 1e-3 && f < 1 - 1e-3;
  }

  setReducedMotion(reduced: boolean) {
    this.reduced = reduced;
  }

  /** Where in the year to show: 0 is spring, 1 summer, and on round; fractions sweep between. */
  setPosition(position: number) {
    this.position = position;
  }

  draw(now: number) {
    const { cols, rows, order, pixels } = this;
    const whole = Math.floor(this.position);
    const f = this.position - whole;
    const from = this.grids[mod(whole, SEASONS.length)];
    const to = this.grids[mod(whole + 1, SEASONS.length)];
    // Stretched so that at f = 0 nothing has turned and at f = 1 everything has.
    const front = f * (1 + JITTER + BAND);
    const tick = Math.floor(now / FLICKER);
    const stride = cols * CELL_W;
    const paper = pack(...PAPER);

    for (let i = 0; i < cols * rows; i++) {
      const raw = (front - order[i]) / BAND;
      let shade: number, r: number, g: number, b: number;
      let gap = paper;
      if (raw <= 0) {
        shade = from.shade[i];
        r = from.rgb[i * 3];
        g = from.rgb[i * 3 + 1];
        b = from.rgb[i * 3 + 2];
      } else if (raw >= 1) {
        shade = to.shade[i];
        r = to.rgb[i * 3];
        g = to.rgb[i * 3 + 1];
        b = to.rgb[i * 3 + 2];
      } else {
        const k = smooth(raw);
        r = from.rgb[i * 3] + (to.rgb[i * 3] - from.rgb[i * 3]) * k;
        g = from.rgb[i * 3 + 1] + (to.rgb[i * 3 + 1] - from.rgb[i * 3 + 1]) * k;
        b = from.rgb[i * 3 + 2] + (to.rgb[i * 3 + 2] - from.rgb[i * 3 + 2]) * k;
        if (this.reduced) {
          shade = k < 0.5 ? from.shade[i] : to.shade[i];
        } else {
          // The front glows a little, and the shades churn between ▒ ▓ █.
          // The gaps take a pale wash of the cell's colour, so the band
          // shimmers instead of punching holes in the scene.
          const bump = Math.sin(raw * Math.PI);
          const wash = GAP_FILL * bump;
          gap = pack(
            PAPER[0] + (r - PAPER[0]) * wash,
            PAPER[1] + (g - PAPER[1]) * wash,
            PAPER[2] + (b - PAPER[2]) * wash,
          );
          const glow = bump * 40;
          r += glow;
          g += glow;
          b += glow;
          const h = Math.sin((i + 1) * 12.9898 + tick * 78.233) * 43758.5453;
          shade = 2 + Math.floor((h - Math.floor(h)) * 3);
        }
      }

      const lit = pack(r, g, b);
      const seam = pack(r * SEAM, g * SEAM, b * SEAM);
      const mask = SHADES[shade];
      const x0 = (i % cols) * CELL_W;
      const y0 = ((i / cols) | 0) * CELL_H;
      for (let y = 0; y < CELL_H; y++) {
        const row = (y0 + y) * stride + x0;
        for (let x = 0; x < CELL_W; x++) {
          pixels[row + x] = mask[y * CELL_W + x] ? (x === CELL_W - 1 ? seam : lit) : gap;
        }
      }
    }
    this.ctx.putImageData(this.image, 0, 0);
  }
}

const mod = (n: number, m: number) => ((n % m) + m) % m;
