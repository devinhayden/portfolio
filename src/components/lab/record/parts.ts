import { extrude, iso, segment, type Flat, type Projection, type Plane, type Point3, type SolidPaths } from "@/components/iso/iso-kit";
import * as G from "@/components/iso/lathe.mjs";

import type { RecordPose } from "./model";
import {
  ARM_LENGTH,
  ARM_Z,
  LABEL_R,
  LEAD_IN,
  LP_HOLE,
  LP_R,
  LP_T,
  OFFSET_ANGLE,
  P,
  PIVOT,
  PLATTER_R,
  RUN_OUT,
  SPINDLE,
} from "./view";

/**
 * The parts that move, rebuilt from their pose. The server draws them at
 * rest and the live component redraws them each frame, from the same code.
 */

const DEG = Math.PI / 180;
const fine = (value: number) => Math.round(value * 1000) / 1000;

type Frame = { o: Point3; a: Point3; u: Point3; v: Point3 };

/** `G.ribsOf` with fading on, typed (the kit is plain JS). */
const ribsOf = G.ribsOf as unknown as (
  F: Frame,
  s0: number,
  s1: number,
  r: number,
  count: number,
  P: Projection,
  options: { fade: [number, number]; seams?: boolean },
) => Array<{ d: string; alpha: number }>;

/** The SVG matrix that maps a plane's (u, v) millimetres onto the screen. */
function planeMatrix(o: Point3, u: Point3, v: Point3) {
  const origin = iso(o, P);
  const along = (d: Point3): Flat => {
    const [x, y] = iso([o[0] + d[0], o[1] + d[1], o[2] + d[2]], P);
    return [x - origin[0], y - origin[1]];
  };
  const [ux, uy] = along(u);
  const [vx, vy] = along(v);
  return `matrix(${fine(ux)} ${fine(uy)} ${fine(vx)} ${fine(vy)} ${fine(origin[0])} ${fine(origin[1])})`;
}

// --- The record --------------------------------------------------------------

/** The rings that part the tracks, out from the label. */
const TRACK_GAPS = [79, 95, 111, 128];

export interface RecordArt {
  vinyl: SolidPaths;
  /** The lead-in band's inner edge, the track gaps and the run-out. */
  grooves: string;
  /** The smooth unrecorded band at the very edge. */
  rim: string;
  label: string;
  hole: string;
  /** Maps the record face's millimetres (centre at 0, 0) onto the screen. */
  face: string;
}

export function recordArt({ c, tilt }: RecordPose): RecordArt {
  const t = tilt * DEG;
  const a: Point3 = [0, Math.cos(t), Math.sin(t)];
  const u: Point3 = [1, 0, 0];
  const v: Point3 = [0, Math.sin(t), -Math.cos(t)];
  const F: Frame = G.frameOf(c, a, u, v);
  const top = LP_T / 2;
  const ring = (r: number) => G.circleOf(F, top, r, P) as string;
  const o: Point3 = [c[0] + a[0] * top, c[1] + a[1] * top, c[2] + a[2] * top];
  return {
    vinyl: G.disc(-top, top, LP_R, F, P) as SolidPaths,
    grooves: [LEAD_IN, ...TRACK_GAPS, RUN_OUT].map(ring).join(""),
    rim: ring(LP_R - 1.2),
    label: ring(LABEL_R),
    hole: ring(LP_HOLE),
    face: planeMatrix(o, u, v),
  };
}

/** The label's printing, in the face's millimetres: turned by the spin. */
export const LABEL_PRINT = {
  title: "M-24 -14H24",
  lines: "M-18 -6H18M-12 1H12",
  catalog: "M10 28H26",
  side: "M-26 26h6",
  ring: "M0 -44A44 44 0 1 1 0 44A44 44 0 1 1 0 -44Z",
};

// --- The platter -------------------------------------------------------------

const PLATTER_FRAME: Frame = G.frameOf([SPINDLE[0], SPINDLE[1], 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);

const STROBE_ROWS: Array<[number, number]> = [
  [112.5, 108],
  [117.5, 90],
];
export const STROBE_COUNT = STROBE_ROWS.reduce((sum, [, count]) => sum + count, 0);
const STROBE_FADE: [number, number] = [0.04, 0.42];

/**
 * The strobe's two rows of dots on the platter's rim, turned by `angle`
 * (radians): always the same number of dots, each fading toward the turn.
 */
export function strobeDots(angle: number) {
  const out: Array<[number, number, number]> = [];
  for (const [z, count] of STROBE_ROWS) {
    for (let index = 0; index < count; index++) {
      const t = angle + (index / count) * Math.PI * 2;
      const alpha = G.fadeOf(G.facingOf(PLATTER_FRAME, t, P), STROBE_FADE) as number;
      const [x, y] = iso(G.pointOf(PLATTER_FRAME, z, PLATTER_R, t) as Point3, P);
      out.push([x, y, alpha]);
    }
  }
  return out;
}

/** Lines that fade one by one, gathered by opacity: one path per step of 0.05. */
export const FADE_STEPS = 20;
export function byOpacity(list: Array<{ d: string; alpha: number }>) {
  const out = Array.from({ length: FADE_STEPS }, () => "");
  for (const { d, alpha } of list) {
    const step = Math.min(FADE_STEPS - 1, Math.max(0, Math.round(alpha * FADE_STEPS) - 1));
    out[step] += d;
  }
  return out;
}

// --- The tonearm -------------------------------------------------------------

export interface ArmPose {
  /** The arm's angle at the pivot, from +x toward +y. */
  angle: number;
  /** The stylus tip's height. */
  stylusZ: number;
}

export interface ArmArt {
  stub: SolidPaths;
  weight: SolidPaths;
  /** The weight's knurl, one path per opacity step (`byOpacity`). */
  weightRibs: string[];
  tube: SolidPaths;
  collar: SolidPaths;
  headshell: SolidPaths;
  lift: SolidPaths;
  cartridge: SolidPaths;
  stylus: string;
  tip: Flat;
}

const rectAlong = (from: Plane, dir: Plane, back: number, ahead: number, half: number): Plane[] => {
  const side: Plane = [-dir[1], dir[0]];
  const at = (s: number, w: number): Plane => [from[0] + dir[0] * s + side[0] * w, from[1] + dir[1] * s + side[1] * w];
  return [at(-back, -half), at(ahead, -half), at(ahead, half), at(-back, half)];
};

export function armArt({ angle, stylusZ }: ArmPose): ArmArt {
  const t = angle * DEG;
  const stylus: Plane = [PIVOT[0] + ARM_LENGTH * Math.cos(t), PIVOT[1] + ARM_LENGTH * Math.sin(t)];
  const h = (angle + OFFSET_ANGLE) * DEG;
  const axis: Plane = [Math.cos(h), Math.sin(h)];
  const root: Plane = [stylus[0] - axis[0] * 46, stylus[1] - axis[1] * 46];
  const cartridgeZ = stylusZ + 2.6;
  const shellZ = cartridgeZ + 15.5;
  const tubeEnd: Point3 = [root[0], root[1], shellZ + 4.4];
  const pivot: Point3 = [PIVOT[0], PIVOT[1], ARM_Z];
  const run: Point3 = [tubeEnd[0] - pivot[0], tubeEnd[1] - pivot[1], tubeEnd[2] - pivot[2]];
  const length = Math.hypot(run[0], run[1], run[2]);
  const F = G.frameAlong(pivot, run) as Frame;

  const liftAt: Plane = [stylus[0] - axis[0] * 6 - axis[1] * 9, stylus[1] - axis[1] * 6 + axis[0] * 9];
  const liftOut: Point3 = [-axis[1], axis[0], 0.22];
  const liftFrame = G.frameAlong([liftAt[0], liftAt[1], shellZ + 1.5], liftOut) as Frame;

  const nose: Point3 = [stylus[0] - axis[0] * 3, stylus[1] - axis[1] * 3, cartridgeZ];
  return {
    stub: G.disc(-64, -8, 2.8, F, P) as SolidPaths,
    weight: G.disc(-56, -28, 15, F, P) as SolidPaths,
    weightRibs: byOpacity(ribsOf(F, -50, -34, 15, 44, P, { fade: [0.1, 0.55], seams: true })),
    tube: G.disc(-4, length - 4, 3.6, F, P) as SolidPaths,
    collar: G.disc(length - 12, length + 1, 5.2, F, P) as SolidPaths,
    headshell: extrude(rectAlong(root, axis, 2, 50, 8.5), shellZ, 3, P, { bevel: 0.4 }),
    lift: G.disc(0, 11, 1.2, liftFrame, P) as SolidPaths,
    cartridge: extrude(rectAlong(stylus, axis, 25, 3, 7.5), cartridgeZ, 15.5, P),
    stylus: segment(nose, [stylus[0], stylus[1], stylusZ], P),
    tip: iso([stylus[0], stylus[1], stylusZ], P),
  };
}
