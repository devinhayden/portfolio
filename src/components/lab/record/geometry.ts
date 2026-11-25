import {
  corners,
  cylinder,
  depthOf,
  extrude,
  haloOf,
  insetPlan,
  iso,
  knurl,
  lineOnTop,
  pathOf,
  planOutline,
  pointsAt,
  radialTicks,
  ring,
  rise,
  roundedPlan,
  segment,
  sideArc,
  sideMatrix,
  sideSeam,
  slabOf,
  type Flat,
  type Plan,
  type Plane,
  type Point3,
  type SolidPaths,
} from "@/components/iso/iso-kit";
import * as G from "@/components/iso/lathe.mjs";

import { armArt } from "./parts";
import { CUE_LIFT, REST_STYLUS_Z } from "./model";
import {
  ARM_LENGTH,
  ARM_Z,
  BIN,
  BIN_FLOOR,
  BRUSH,
  CARCASS,
  CARCASS_Z0,
  COUNT,
  COVER,
  COVER_H,
  COVER_OPEN,
  CUE,
  DECK,
  DECK_TOP,
  FEET_INSET,
  FIN_H,
  FIN_T,
  FOOT_Z0,
  HINGE_Y,
  HINGE_Z,
  MAT_R,
  MAT_TOP,
  MOTOR,
  OFFSET_ANGLE,
  P,
  PANEL_T,
  PIVOT,
  PLATTER_R,
  PLATTER_TOP,
  PLATTER_Z,
  PLINTH,
  PLINTH_FOOT,
  PLINTH_TOP,
  POWER,
  PULLEY_R,
  RAIL_H,
  REST_ANGLE,
  SLEEVE,
  SLEEVE_T,
  SLEEVE_X,
  SLEEVE_Z,
  SPEED_KNOB,
  SPINDLE,
  SPINDLE_R,
  SPINDLE_TOP,
  TOP,
  TOP_Z0,
  finY,
  sleeveY,
} from "./view";

/** Every static path, computed once on the server. */

const DEG = Math.PI / 180;
const byDepth = (points: Plane[], z = 0) => [...points].sort((a, b) => depthOf([a[0], a[1], z], P) - depthOf([b[0], b[1], z], P));
const at = (point: Point3) => iso(point, P);

// --- The console -------------------------------------------------------------

function footOf([x, y]: Plane) {
  return {
    plate: cylinder(x, y, 26, CARCASS_Z0 - 5, 5, P, 40),
    leg: cylinder(x, y, 15, FOOT_Z0 + 8, CARCASS_Z0 - 5 - FOOT_Z0 - 8, P, 32),
    cap: cylinder(x, y, 17, FOOT_Z0, 8, P, 32, 0.5),
    seam: sideArc(x, y, 15, CARCASS_Z0 - 18, P, 24),
  };
}

const CARCASS_PLAN: Plan = { ...CARCASS, r: 0 };
const CORNER: Plane = [CARCASS.x + CARCASS.w, CARCASS.y + CARCASS.d];
const JOINT = 18;
const FINGER = 22;

function boxJoint() {
  const [cx, cy] = CORNER;
  const top = TOP_Z0;
  const lines: string[] = [rise([cx, cy], CARCASS_Z0, top, P), rise([cx - JOINT, cy], CARCASS_Z0, top, P), rise([cx, cy - JOINT], CARCASS_Z0, top, P)];
  let row = 0;
  for (let z = CARCASS_Z0 + FINGER; z < top - 4; z += FINGER, row++) {
    lines.push(row % 2 ? segment([cx - JOINT, cy, z], [cx, cy, z], P) : segment([cx, cy - JOINT, z], [cx, cy, z], P));
  }
  return lines.join("");
}

const FRONT_Y = CARCASS.y + CARCASS.d;
const END_X = CARCASS.x + CARCASS.w;

/** The front: three doors, each a framed panel with a brass pull. */
const DOOR_EDGES = [CARCASS.x, -196, 196, END_X];
const DOOR_GAP = 10;
const DOOR_Z: [number, number] = [CARCASS_Z0 + 14, TOP_Z0 - 12];
const doors = DOOR_EDGES.slice(0, -1).map((x0, index) => {
  const x1 = DOOR_EDGES[index + 1]!;
  return { x0: x0 + (index ? DOOR_GAP / 2 : JOINT + 8), x1: x1 - (index < 2 ? DOOR_GAP / 2 : JOINT + 8) };
});
const facePanel = (x0: number, x1: number, z0: number, z1: number) =>
  pathOf(
    [
      [x0, FRONT_Y, z0],
      [x1, FRONT_Y, z0],
      [x1, FRONT_Y, z1],
      [x0, FRONT_Y, z1],
    ].map((p) => at(p as Point3)),
    true,
  );
const endPanel = (inset: number) =>
  pathOf(
    [
      [END_X, CARCASS.y + inset, CARCASS_Z0 + inset],
      [END_X, FRONT_Y - JOINT - inset, CARCASS_Z0 + inset],
      [END_X, FRONT_Y - JOINT - inset, TOP_Z0 - inset],
      [END_X, CARCASS.y + inset, TOP_Z0 - inset],
    ].map((p) => at(p as Point3)),
    true,
  );
const PULL_Z = DOOR_Z[1] - 34;

const PLATE: Plan = { x: 470, y: FRONT_Y, w: 64, d: 1.6, r: 0 };
const PLATE_Z = CARCASS_Z0 + 30;
const PLATE_H = 22;

const SEAMS_X = [-104, 344];

export const CONSOLE = {
  halo: haloOf(insetPlan(TOP, -14), FOOT_Z0, 30, P),
  feet: byDepth(corners(CARCASS, FEET_INSET), FOOT_Z0).map(footOf),
  carcass: slabOf(CARCASS_PLAN, CARCASS_Z0, TOP_Z0 - CARCASS_Z0, P, 2),
  carcassSeam: sideSeam(CARCASS_PLAN, CARCASS_Z0 + 16, P, 2),
  joint: boxJoint(),
  doors: doors.map(({ x0, x1 }) => facePanel(x0, x1, DOOR_Z[0], DOOR_Z[1])).join(""),
  doorInsets: doors.map(({ x0, x1 }) => facePanel(x0 + 14, x1 - 14, DOOR_Z[0] + 14, DOOR_Z[1] - 14)).join(""),
  pulls: doors.map(({ x0, x1 }) => slabOf({ x: (x0 + x1) / 2 - 26, y: FRONT_Y, w: 52, d: 7, r: 3 }, PULL_Z, 7, P, 3, 0.4)),
  endFrame: endPanel(22),
  endInset: endPanel(36),
  plate: slabOf(PLATE, PLATE_Z, PLATE_H, P, 2, 0.3),
  plateRules: [
    segment([PLATE.x + 10, PLATE.y + PLATE.d, PLATE_Z + 16], [PLATE.x + 48, PLATE.y + PLATE.d, PLATE_Z + 16], P),
    segment([PLATE.x + 10, PLATE.y + PLATE.d, PLATE_Z + 11], [PLATE.x + 36, PLATE.y + PLATE.d, PLATE_Z + 11], P),
    segment([PLATE.x + 10, PLATE.y + PLATE.d, PLATE_Z + 6], [PLATE.x + 42, PLATE.y + PLATE.d, PLATE_Z + 6], P),
  ].join(""),
  platePins: pointsAt(
    [
      [PLATE.x + 4.5, PLATE.y + PLATE.d, PLATE_Z + PLATE_H / 2],
      [PLATE.x + PLATE.w - 4.5, PLATE.y + PLATE.d, PLATE_Z + PLATE_H / 2],
    ],
    P,
  ),
  top: slabOf(TOP, TOP_Z0, -TOP_Z0, P, 8, 1.6),
  lipping: sideSeam(TOP, -4, P, 8),
  seams: SEAMS_X.map((x) =>
    x > BIN.x && x < BIN.x + BIN.w
      ? lineOnTop([x, TOP.y], [x, BIN.y], 0, P) + lineOnTop([x, BIN.y + BIN.d], [x, TOP.y + TOP.d], 0, P)
      : lineOnTop([x, TOP.y], [x, TOP.y + TOP.d], 0, P),
  ).join(""),
};

// --- The rack ----------------------------------------------------------------

const RIM = roundedPlan(BIN, 4).map(([x, y]) => at([x, y, 0]));

function hull(points: Flat[]) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Flat, a: Flat, b: Flat) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Flat[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Flat[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/**
 * Below the top, a sleeve shows only through the opening; above it, nothing
 * of the console can hide it. So everything standing in the rack is clipped
 * to the opening swept straight up the screen.
 */
const SWEEP = pathOf(hull([...RIM, ...RIM.map(([x, y]): Flat => [x, y - 2000])]), true);

const wall = (points: Point3[]) => pathOf(points.map(at), true);
const { x: bx, y: by, w: bw, d: bd } = BIN;

export const RACK = {
  opening: pathOf(RIM, true),
  sweep: SWEEP,
  floor: wall([
    [bx, by, BIN_FLOOR],
    [bx + bw, by, BIN_FLOOR],
    [bx + bw, by + bd, BIN_FLOOR],
    [bx, by + bd, BIN_FLOOR],
  ]),
  back: wall([
    [bx, by, BIN_FLOOR],
    [bx + bw, by, BIN_FLOOR],
    [bx + bw, by, 0],
    [bx, by, 0],
  ]),
  left: wall([
    [bx, by, BIN_FLOOR],
    [bx, by + bd, BIN_FLOOR],
    [bx, by + bd, 0],
    [bx, by, 0],
  ]),
  corner: rise([bx, by], BIN_FLOOR, 0, P),
  joins: segment([bx, by, BIN_FLOOR], [bx + bw, by, BIN_FLOOR], P) + segment([bx, by, BIN_FLOOR], [bx, by + bd, BIN_FLOOR], P),
  felt: [SLEEVE_X + 40, SLEEVE_X + SLEEVE - 54].map((x) => slabOf({ x, y: by + 8, w: 14, d: bd - 16, r: 2 }, BIN_FLOOR, RAIL_H, P, 2)),
  fins: Array.from({ length: COUNT + 1 }, (_, slot) =>
    slabOf({ x: bx + 8, y: finY(slot), w: bw - 16, d: FIN_T, r: 1.2 }, BIN_FLOOR, FIN_H, P, 2, 0.4),
  ),
};

// --- The sleeves ---------------------------------------------------------------

export interface SleeveArt {
  back: SolidPaths;
  slit: string;
  front: SolidPaths;
  top: SolidPaths;
  /** Maps the cover's millimetres (0..314 across, 0..314 down) onto its face. */
  cover: string;
}

export function sleeveArt(index: number): SleeveArt {
  const y = sleeveY(index);
  const right = SLEEVE_X + SLEEVE;
  return {
    back: slabOf({ x: SLEEVE_X, y, w: SLEEVE, d: PANEL_T, r: 0 }, SLEEVE_Z, SLEEVE, P, 1),
    slit: wall([
      [right, y + PANEL_T, SLEEVE_Z],
      [right, y + SLEEVE_T - PANEL_T, SLEEVE_Z],
      [right, y + SLEEVE_T - PANEL_T, SLEEVE_Z + SLEEVE - 1.2],
      [right, y + PANEL_T, SLEEVE_Z + SLEEVE - 1.2],
    ]),
    front: slabOf({ x: SLEEVE_X, y: y + SLEEVE_T - PANEL_T, w: SLEEVE, d: PANEL_T, r: 0 }, SLEEVE_Z, SLEEVE, P, 1),
    top: slabOf({ x: SLEEVE_X, y, w: SLEEVE, d: SLEEVE_T, r: 0 }, SLEEVE_Z + SLEEVE - 1.2, 1.2, P, 1),
    cover: sideMatrix([SLEEVE_X, y + SLEEVE_T], SLEEVE_Z + SLEEVE, P, "left"),
  };
}

export const SLEEVES = Array.from({ length: COUNT }, (_, index) => sleeveArt(index));

// --- The brush ---------------------------------------------------------------

export const BRUSH_ART = {
  pad: slabOf(insetPlan(BRUSH, 3), 0, 5, P, 4),
  body: slabOf(BRUSH, 5, 20, P, 6, 0.8),
  grip: planOutline(insetPlan(BRUSH, 7), 25, P, 4),
};

// --- The plinth ----------------------------------------------------------------

function plinthFoot([x, y]: Plane) {
  return {
    ring: cylinder(x, y, 25, 0, 6, P, 40),
    foot: cylinder(x, y, 21, 6, PLINTH_FOOT - 6, P, 40),
    seam: sideArc(x, y, 21, 11, P, 28),
  };
}

const BADGE: Plan = { x: 486, y: PLINTH.y + PLINTH.d, w: 56, d: 1.2, r: 0 };

export const PLINTH_ART = {
  halo: haloOf(insetPlan(PLINTH, -6), 0, 20, P),
  feet: byDepth(corners(PLINTH, 36)).map(plinthFoot),
  body: slabOf(PLINTH, PLINTH_FOOT, PLINTH_TOP - PLINTH_FOOT, P, 8, 1.4),
  bodySeam: sideSeam(PLINTH, PLINTH_FOOT + 10, P, 8),
  badge: slabOf(BADGE, 46, 13, P, 2, 0.3),
  badgeRules: [
    segment([BADGE.x + 8, BADGE.y + BADGE.d, 55], [BADGE.x + 36, BADGE.y + BADGE.d, 55], P),
    segment([BADGE.x + 8, BADGE.y + BADGE.d, 50.5], [BADGE.x + 26, BADGE.y + BADGE.d, 50.5], P),
  ].join(""),
  deck: slabOf(DECK, PLINTH_TOP, DECK_TOP - PLINTH_TOP, P, 5, 0.6),
  deckGroove: planOutline(insetPlan(DECK, 7), DECK_TOP, P, 5),
  deckScrewRings: corners(DECK, 13).map(([x, y]) => ring(x, y, 3.2, DECK_TOP, P, 16)).join(""),
  deckScrews: pointsAt(corners(DECK, 13).map(([x, y]): Point3 => [x, y, DECK_TOP]), P),
};

// --- Controls ------------------------------------------------------------------

const KNOB_R = 10;
const knobPointer = (deg: number): [Plane, Plane] => {
  const t = deg * DEG;
  return [
    [SPEED_KNOB[0] + Math.cos(t) * 3, SPEED_KNOB[1] + Math.sin(t) * 3],
    [SPEED_KNOB[0] + Math.cos(t) * (KNOB_R - 2), SPEED_KNOB[1] + Math.sin(t) * (KNOB_R - 2)],
  ];
};
/** The speed knob is set to 33: its pointer at the single dot. */
const SPEED_33 = -140;
const SPEED_45 = -40;

const CUE_BASE: Plan = { x: CUE[0] - 11, y: CUE[1] - 8, w: 22, d: 16, r: 3 };

export const CONTROLS = {
  knobRing: ring(SPEED_KNOB[0], SPEED_KNOB[1], KNOB_R + 4, DECK_TOP, P, 40),
  knob: cylinder(SPEED_KNOB[0], SPEED_KNOB[1], KNOB_R, DECK_TOP, 9, P, 40, 0.5),
  knobKnurl: knurl(SPEED_KNOB[0], SPEED_KNOB[1], KNOB_R, DECK_TOP + 1.5, DECK_TOP + 7.5, 40, P, 0.4),
  knobPointer: lineOnTop(...knobPointer(SPEED_33), DECK_TOP + 9, P),
  speedMarks: pointsAt(
    [
      [SPEED_KNOB[0] + Math.cos(SPEED_33 * DEG) * 18, SPEED_KNOB[1] + Math.sin(SPEED_33 * DEG) * 18, DECK_TOP],
      [SPEED_KNOB[0] + Math.cos((SPEED_45 - 6) * DEG) * 18, SPEED_KNOB[1] + Math.sin((SPEED_45 - 6) * DEG) * 18, DECK_TOP],
      [SPEED_KNOB[0] + Math.cos((SPEED_45 + 6) * DEG) * 18, SPEED_KNOB[1] + Math.sin((SPEED_45 + 6) * DEG) * 18, DECK_TOP],
    ],
    P,
  ),
  powerRing: ring(POWER[0], POWER[1], 9.5, DECK_TOP, P, 32),
  power: cylinder(POWER[0], POWER[1], 7, DECK_TOP, 4, P, 32, 0.4),
  powerDot: pointsAt([[POWER[0], POWER[1], DECK_TOP + 4]], P),
  cueBase: slabOf(CUE_BASE, DECK_TOP, 9, P, 3, 0.4),
  cueSlot: planOutline({ x: CUE[0] - 7, y: CUE[1] - 2, w: 14, d: 4, r: 2 }, DECK_TOP + 9, P, 3),
};

/** The cue lever, raised (`up` = 1) or lowered (0). */
export function cueLever(up: number) {
  const z = DECK_TOP + 9;
  const lean = (up ? 1 : -1) * 0.5;
  const tip: Plane = [CUE[0] - 4, CUE[1] - 3 + lean * 3];
  return {
    stem: cylinder(CUE[0], CUE[1], 2, z, 7 + up * 4, P, 16),
    handle: slabOf({ x: tip[0] - 20, y: tip[1], w: 26, d: 6, r: 2.5 }, z + 7 + up * 4, 3.5, P, 3, 0.4),
  };
}

// --- The drive -----------------------------------------------------------------

const DRIVE_R = 138;
const BELT_Z = [101.5, 104.5];

/** The belt's two straight runs, tangent to the pulley and the platter's drive rim. */
function beltRuns() {
  const [px, py] = MOTOR;
  const [sx, sy] = SPINDLE;
  const dx = sx - px;
  const dy = sy - py;
  const d = Math.hypot(dx, dy);
  const base = Math.atan2(dy, dx);
  const spread = Math.acos((PULLEY_R - DRIVE_R) / d);
  const lines: string[] = [];
  for (const side of [-1, 1]) {
    const t = base + side * spread;
    const n: Plane = [Math.cos(t), Math.sin(t)];
    for (const z of BELT_Z) {
      lines.push(segment([px + n[0] * PULLEY_R, py + n[1] * PULLEY_R, z], [sx + n[0] * DRIVE_R, sy + n[1] * DRIVE_R, z], P));
    }
  }
  return lines.join("");
}

export const DRIVE = {
  pod: cylinder(MOTOR[0], MOTOR[1], 22, DECK_TOP, 3, P, 48, 0.5),
  podScrews: pointsAt(
    [0, 120, 240].map((deg): Point3 => [MOTOR[0] + Math.cos(deg * DEG) * 17, MOTOR[1] + Math.sin(deg * DEG) * 17, DECK_TOP + 3]),
    P,
  ),
  belt: beltRuns(),
  pulley: cylinder(MOTOR[0], MOTOR[1], PULLEY_R, DECK_TOP + 3, 8, P, 32),
  pulleyBelt: BELT_Z.map((z) => sideArc(MOTOR[0], MOTOR[1], PULLEY_R, z, P, 24)).join(""),
  step: cylinder(MOTOR[0], MOTOR[1], PULLEY_R + 1.6, DECK_TOP + 11, 5, P, 32),
  collar: cylinder(MOTOR[0], MOTOR[1], 5, DECK_TOP + 16, 3, P, 24, 0.3),
};

// --- The platter ---------------------------------------------------------------

const PLATTER_FRAME = G.frameOf([SPINDLE[0], SPINDLE[1], 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);

export const PLATTER = {
  body: G.solidOf(
    [
      [PLATTER_Z, DRIVE_R],
      [PLATTER_Z + 8, DRIVE_R],
      [PLATTER_Z + 8, PLATTER_R],
      [PLATTER_TOP - 0.8, PLATTER_R],
      [PLATTER_TOP, PLATTER_R - 0.8],
    ],
    PLATTER_FRAME,
    P,
  ) as SolidPaths,
  strobeSeams: [110, 120].map((z) => G.arcOf(PLATTER_FRAME, z, PLATTER_R, P) as string).join(""),
  mat: cylinder(SPINDLE[0], SPINDLE[1], MAT_R, PLATTER_TOP, MAT_TOP - PLATTER_TOP, P, 120),
  matRing: ring(SPINDLE[0], SPINDLE[1], 64, MAT_TOP, P, 96),
  spindle: cylinder(SPINDLE[0], SPINDLE[1], SPINDLE_R, MAT_TOP, SPINDLE_TOP - MAT_TOP - 2, P, 20),
  spindleTip: cylinder(SPINDLE[0], SPINDLE[1], SPINDLE_R - 1.2, SPINDLE_TOP - 2, 2, P, 16),
};

// --- The tonearm's base ----------------------------------------------------------

const [qx, qy] = PIVOT;
const SKATE: Plane = [qx + 28, qy + 22];
const towerAt = (deg: number, r: number): Plane => [qx + Math.cos(deg * DEG) * r, qy + Math.sin(deg * DEG) * r];

/** The cue's lift bar: a short bar under the arm, across its whole swing. */
const BAR_R = 44;
const BAR_FROM = 84;
const BAR_TO = 140;
const BAR_Z = ARM_Z - 3.6 - 6;

function liftBar() {
  const a = towerAt(BAR_FROM, BAR_R);
  const b = towerAt(BAR_TO, BAR_R);
  const along: Plane = [b[0] - a[0], b[1] - a[1]];
  const length = Math.hypot(along[0], along[1]);
  const dir: Plane = [along[0] / length, along[1] / length];
  const side: Plane = [-dir[1] * 2.5, dir[0] * 2.5];
  return extrude(
    [
      [a[0] - side[0], a[1] - side[1]],
      [b[0] - side[0], b[1] - side[1]],
      [b[0] + side[0], b[1] + side[1]],
      [a[0] + side[0], a[1] + side[1]],
    ],
    BAR_Z - 3,
    3,
    P,
    { bevel: 0.3 },
  );
}

/** The cue's post, under the bar's near end. */
const TOWER = towerAt(BAR_FROM, BAR_R);

/** Under the tube, where it lies at rest. */
function restSpot() {
  const t = REST_ANGLE * DEG;
  const stylus: Plane = [qx + ARM_LENGTH * Math.cos(t), qy + ARM_LENGTH * Math.sin(t)];
  const h = (REST_ANGLE + OFFSET_ANGLE) * DEG;
  const root: Plane = [stylus[0] - Math.cos(h) * 46, stylus[1] - Math.sin(h) * 46];
  const share = 0.8;
  const spot: Plane = [qx + (root[0] - qx) * share, qy + (root[1] - qy) * share];
  const tubeEndZ = REST_STYLUS_Z + 2.6 + 15.5 + 4.4;
  const z = ARM_Z + (tubeEndZ - ARM_Z) * share - 3.6;
  return { spot, z, dir: Math.atan2(root[1] - qy, root[0] - qx) };
}

const REST = restSpot();
const cradle = (): Plane[] => {
  const d: Plane = [Math.cos(REST.dir), Math.sin(REST.dir)];
  const s: Plane = [-d[1], d[0]];
  const [x, y] = REST.spot;
  return [
    [x - d[0] * 5 - s[0] * 7, y - d[1] * 5 - s[1] * 7],
    [x + d[0] * 5 - s[0] * 7, y + d[1] * 5 - s[1] * 7],
    [x + d[0] * 5 + s[0] * 7, y + d[1] * 5 + s[1] * 7],
    [x - d[0] * 5 + s[0] * 7, y - d[1] * 5 + s[1] * 7],
  ];
};

export const ARM_BASE = {
  board: cylinder(qx, qy, 38, DECK_TOP, 1.4, P, 64, 0.4),
  boardScrews: pointsAt([45, 165, 285].map((deg): Point3 => [qx + Math.cos(deg * DEG) * 32, qy + Math.sin(deg * DEG) * 32, DECK_TOP + 1.4]), P),
  housing: cylinder(qx, qy, 17, DECK_TOP + 1.4, 22, P, 48),
  housingKnurl: knurl(qx, qy, 17, DECK_TOP + 6, DECK_TOP + 16, 56, P, 0.4),
  housingSeams: sideArc(qx, qy, 17, DECK_TOP + 6, P, 32) + sideArc(qx, qy, 17, DECK_TOP + 16, P, 32),
  collar: cylinder(qx, qy, 19.5, DECK_TOP + 23.4, 6, P, 48, 0.5),
  lockScrew: G.disc(19.5, 25, 2.2, G.frameAlong([qx, qy, DECK_TOP + 26.4], [Math.cos(70 * DEG), Math.sin(70 * DEG), 0]), P) as SolidPaths,
  yoke: cylinder(qx, qy, 11, DECK_TOP + 29.4, ARM_Z - 6 - DECK_TOP - 29.4, P, 40, 0.4),
  skate: cylinder(SKATE[0], SKATE[1], 8.5, DECK_TOP, 8, P, 40, 0.4),
  skateTicks: radialTicks(SKATE[0], SKATE[1], 7.6, 12, 4, DECK_TOP + 8, [1.2, 2.4], P, -Math.PI * 0.75, Math.PI * 1.5),
  skatePointer: lineOnTop([SKATE[0], SKATE[1]], [SKATE[0] + 4.4, SKATE[1] - 4.4], DECK_TOP + 8, P),
  tower: cylinder(TOWER[0], TOWER[1], 4.6, DECK_TOP, BAR_Z - 3 - DECK_TOP, P, 24, 0.3),
  bar: liftBar(),
  restPost: cylinder(REST.spot[0], REST.spot[1], 3.4, DECK_TOP, REST.z - 4 - DECK_TOP, P, 20),
  restFoot: cylinder(REST.spot[0], REST.spot[1], 7, DECK_TOP, 2, P, 28, 0.3),
  cradle: extrude(cradle(), REST.z - 4, 4, P, { bevel: 0.3 }),
};

/** How far the lift bar rises when the cue is up. */
export const BAR_LIFT = CUE_LIFT;

// --- The dust cover --------------------------------------------------------------

const OPEN = COVER_OPEN * DEG;
const hinge = ([x, y, z]: Point3): Point3 => {
  const dy = y - HINGE_Y;
  const dz = z - HINGE_Z;
  return [x, HINGE_Y + dy * Math.cos(OPEN) - dz * Math.sin(OPEN), HINGE_Z + dy * Math.sin(OPEN) + dz * Math.cos(OPEN)];
};

function coverFaces() {
  const outline = roundedPlan(COVER, 4);
  const lid = outline.map(([x, y]) => hinge([x, y, HINGE_Z + COVER_H]));
  const rim = outline.map(([x, y]) => hinge([x, y, HINGE_Z]));
  const faces: Point3[][] = [lid];
  for (let i = 0; i < outline.length; i++) {
    const j = (i + 1) % outline.length;
    faces.push([rim[i]!, rim[j]!, lid[j]!, lid[i]!]);
  }
  const centre = (face: Point3[]) => face.reduce<Point3>((sum, p) => [sum[0] + p[0] / face.length, sum[1] + p[1] / face.length, sum[2] + p[2] / face.length], [0, 0, 0]);
  const sorted = faces.map((face) => ({ face, depth: depthOf(centre(face), P) })).sort((a, b) => a.depth - b.depth);
  return {
    panes: sorted.map(({ face }) => pathOf(face.map(at), true)),
    lid: pathOf(lid.map(at), true),
    rim: pathOf(rim.map(at), true),
    /** The four corner edges of the skirt, where its sides meet. */
    edges: [0, 1, 2, 3]
      .map((corner) => {
        const index = Math.round(((corner + 0.5) * outline.length) / 4) % outline.length;
        return segment(rim[index]!, lid[index]!, P);
      })
      .join(""),
    /** A streak of light across the lid. */
    shine: segment(hinge([COVER.x + 70, COVER.y + 40, HINGE_Z + COVER_H]), hinge([COVER.x + 230, COVER.y + 300, HINGE_Z + COVER_H]), P),
    shineThin: segment(hinge([COVER.x + 110, COVER.y + 40, HINGE_Z + COVER_H]), hinge([COVER.x + 262, COVER.y + 286, HINGE_Z + COVER_H]), P),
  };
}

const HINGES = [COVER.x + 34, COVER.x + COVER.w - 64];

export const COVER_ART = {
  ...coverFaces(),
  hinges: HINGES.map((x) => slabOf({ x, y: HINGE_Y - 9, w: 30, d: 15, r: 2 }, PLINTH_TOP - 14, 22, P, 2, 0.4)),
  hingePins: HINGES.map((x) => segment([x - 2, HINGE_Y - 2, HINGE_Z + 4], [x + 32, HINGE_Y - 2, HINGE_Z + 4], P)).join(""),
};

// --- At rest -------------------------------------------------------------------

export const ARM_AT_REST = armArt({ angle: REST_ANGLE, stylusZ: REST_STYLUS_Z });
