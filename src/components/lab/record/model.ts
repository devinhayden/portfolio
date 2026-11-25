import type { Point3 } from "@/components/iso/iso-kit";

import type { Album } from "../records";
import {
  ARM_LENGTH,
  LEAD_IN,
  LP_T,
  MAT_TOP,
  PIVOT,
  PLAY_RISE,
  RUN_OUT,
  SLEEVE,
  SLEEVE_T,
  SLEEVE_X,
  SLEEVE_Z,
  SPINDLE,
  HOVER_Z,
  sleeveY,
} from "./view";

/**
 * The turntable's behaviour, as numbers. Everything the figure shows and
 * says comes from here.
 */

export const RPM = 100 / 3;
/** Belt drive spin-up: first order, 95% of speed in about 2.7 s. */
export const SPIN_UP_TAU = 0.9;
/**
 * A belt-drive platter coasts for half a minute once the motor stops; the
 * figure brakes it instead, to a stop in about 3 s.
 */
export const BRAKE_TAU = 0.48;
/** A side runs from the lead-in to the run-out in about 20 minutes. */
export const SIDE_MINUTES = 20;
export const GROOVE_PITCH = (LEAD_IN - RUN_OUT) / (SIDE_MINUTES * RPM);

/** The cue: up in a third of a second, down slowly through its oil damping. */
export const CUE_LIFT = 12;
export const CUE_UP_S = 0.35;
export const CUE_DOWN_S = 1.5;
export const ARM_SWING_S = 1.1;

/** A record's trip from its sleeve to the spindle, in seconds per leg. */
export const SLIDE_S = 0.95;
export const TILT_S = 1.05;
export const CARRY_S = 0.95;
export const LOWER_S = 0.75;
export const TRIP_S = SLIDE_S + TILT_S + CARRY_S + LOWER_S;
/** How far the record slides along its sleeve to come clear of it. */
export const SLIDE_OUT = SLEEVE + 16;

export const SEATED_Z = MAT_TOP + LP_T / 2;
export const SURFACE_Z = MAT_TOP + LP_T;
/** The stylus height while the arm lies on its rest. */
export const REST_STYLUS_Z = SURFACE_Z + 6;

export const smooth = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// --- The record's trip ---------------------------------------------------------

export interface RecordPose {
  /** The record's centre. */
  c: Point3;
  /** 0 standing in its sleeve, facing the viewer; 90 lying flat. */
  tilt: number;
}

/** Where record `index` is, `t` seconds along its trip from sleeve to spindle. */
export function tripPose(index: number, t: number): RecordPose {
  const x0 = SLEEVE_X + SLEEVE / 2;
  const y0 = sleeveY(index) + SLEEVE_T / 2;
  const z0 = SLEEVE_Z + PLAY_RISE + SLEEVE / 2;
  const xOut = x0 + SLIDE_OUT;
  if (t <= SLIDE_S) return { c: [mix(x0, xOut, smooth(t / SLIDE_S)), y0, z0], tilt: 0 };
  t -= SLIDE_S;
  if (t <= TILT_S) {
    const s = smooth(t / TILT_S);
    return { c: [xOut, mix(y0, SPINDLE[1], s), mix(z0, HOVER_Z, s)], tilt: 90 * s };
  }
  t -= TILT_S;
  if (t <= CARRY_S) return { c: [mix(xOut, SPINDLE[0], smooth(t / CARRY_S)), SPINDLE[1], HOVER_Z], tilt: 90 };
  t -= CARRY_S;
  return { c: [SPINDLE[0], SPINDLE[1], mix(HOVER_Z, SEATED_Z, smooth(t / LOWER_S))], tilt: 90 };
}

export const SEATED: RecordPose = { c: [SPINDLE[0], SPINDLE[1], SEATED_Z], tilt: 90 };

// --- The tonearm ---------------------------------------------------------------

const DEG = Math.PI / 180;
const toPivot = Math.hypot(SPINDLE[0] - PIVOT[0], SPINDLE[1] - PIVOT[1]);
const towardSpindle = Math.atan2(SPINDLE[1] - PIVOT[1], SPINDLE[0] - PIVOT[0]) / DEG;

/** The arm's angle (from +x toward +y, at the pivot) that puts the stylus `radius` from the spindle. */
export function armAngleFor(radius: number) {
  const cos = (ARM_LENGTH ** 2 + toPivot ** 2 - radius ** 2) / (2 * ARM_LENGTH * toPivot);
  return towardSpindle - Math.acos(Math.min(1, Math.max(-1, cos))) / DEG;
}

export const LEAD_IN_ANGLE = armAngleFor(LEAD_IN);
export const RUN_OUT_ANGLE = armAngleFor(RUN_OUT);

// --- Words -------------------------------------------------------------------

const RPM_TEXT = "33⅓ rpm";
/** The readout shares the card's bottom edge with the hint, so long titles are cut. */
const TITLE_MOST = 24;
const titleOf = (title: string) => (title.length > TITLE_MOST ? `${title.slice(0, TITLE_MOST - 1).trimEnd()}…` : title);

/** The readout, from the platter's speed and what's on it. */
export function readoutOf(album: Album | null, rpm: number, playing: boolean) {
  if (!album) return "Pick a record";
  const title = titleOf(album.title);
  if (!playing && rpm < 0.05) return `${title}, ${album.artist}`;
  const speed = Math.abs(rpm - RPM) < 0.05 ? RPM_TEXT : `${rpm.toFixed(1)} rpm`;
  return `${playing ? "Now playing — " : ""}${title}, ${album.artist} · ${speed}`;
}
