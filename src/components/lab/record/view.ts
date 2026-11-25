import { boxCorners, fitProjection, iso, type Plan, type Point3 } from "@/components/iso/iso-kit";

import { RECORDS } from "../records";

/**
 * The world, in millimetres: x along the console to the right, y toward the
 * viewer, z up, the console's top surface at z = 0.
 */

export const WIDTH = 680;
export const HEIGHT = 470;
const PAD = 26;
export const AZIMUTH = 58;
/** High enough to look down into the rack and onto the platter. */
export const ELEVATION = 40;

// --- The console -------------------------------------------------------------

export const TOP: Plan = { x: -600, y: -215, w: 1200, d: 430, r: 10 };
export const TOP_Z0 = -24;
export const CARCASS: Plan = { x: -592, y: -207, w: 1184, d: 414, r: 6 };
export const CARCASS_Z0 = -200;
export const FOOT_Z0 = -252;
export const FEET_INSET = 34;

/** The rack: a well cut into the top, sleeves standing in slots. */
export const BIN: Plan = { x: -566, y: -178, w: 346, d: 330, r: 6 };
export const BIN_FLOOR = -170;
export const RAIL_H = 10;
export const FIN_H = 46;
export const FIN_T = 5;

// --- The sleeves -------------------------------------------------------------

export const COUNT = RECORDS.length;
export const SLEEVE = 314;
export const SLEEVE_T = 4;
/** Each panel of the jacket; the record rides between them. */
export const PANEL_T = 1.2;
export const SLEEVE_X = BIN.x + 16;
export const SLEEVE_Z = BIN_FLOOR + 6;
const BIN_MARGIN = 22;
export const PITCH = (BIN.d - BIN_MARGIN * 2) / COUNT;
/** Slot 0 is at the back; the first record sits in the front slot. */
export const slotOf = (index: number) => COUNT - 1 - index;
export const sleeveY = (index: number) => BIN.y + BIN_MARGIN + PITCH * (slotOf(index) + 0.5) - SLEEVE_T / 2;
/** Where a fin stands between two slots (and at both ends). */
export const finY = (slot: number) => BIN.y + BIN_MARGIN + PITCH * slot - FIN_T / 2;

/** A hovered sleeve rises this far; one being played rises clear of the rim. */
export const HOVER_RISE = 72;
export const PLAY_RISE = 196;

// --- The turntable -----------------------------------------------------------

export const PLINTH: Plan = { x: 130, y: -185, w: 450, d: 360, r: 10 };
export const PLINTH_FOOT = 18;
export const PLINTH_TOP = 92;
export const DECK: Plan = { x: 144, y: -171, w: 422, d: 332, r: 5 };
export const DECK_TOP = 95;

export const SPINDLE: [number, number] = [310, -5];
export const PLATTER_R = 150;
export const PLATTER_Z = 100;
export const PLATTER_TOP = 122;
export const MAT_R = 146;
export const MAT_TOP = 125;
export const SPINDLE_R = 3.6;
export const SPINDLE_TOP = 141;

export const LP_R = 150.8;
export const LP_T = 1.8;
export const LABEL_R = 50;
export const LP_HOLE = 3.62;
/** Where the program starts and ends, from the spindle. */
export const LEAD_IN = 146;
export const RUN_OUT = 60;

export const MOTOR: [number, number] = [180, -138];
export const PULLEY_R = 8;

/** The tonearm: a 9" arm, its pivot 211 mm from the spindle. */
export const PIVOT: [number, number] = [SPINDLE[0] + 190, SPINDLE[1] - 92];
export const ARM_LENGTH = 229;
/** The arm tube's height at the pivot: level when the stylus is in the groove. */
export const ARM_Z = 150.8;
/** The headshell's offset from the arm tube. */
export const OFFSET_ANGLE = 23;
/** Where the arm lies at rest, as an angle from +x toward +y. */
export const REST_ANGLE = 96;

export const CUE: [number, number] = [548, 128];
export const SPEED_KNOB: [number, number] = [178, 138];
export const POWER: [number, number] = [222, 146];

/** The dust cover, hinged along the plinth's back edge and propped open. */
export const COVER: Plan = { x: 133, y: -183, w: 444, d: 356, r: 8 };
export const COVER_H = 74;
export const HINGE_Y = PLINTH.y;
export const HINGE_Z = PLINTH_TOP;
export const COVER_OPEN = 88;

export const BRUSH: Plan = { x: -168, y: 172, w: 128, d: 26, r: 6 };

/** Above the spindle, where a record turns flat before it lowers. */
export const HOVER_Z = 330;

// --- Camera ------------------------------------------------------------------

const coverTop = HINGE_Z + COVER.d * Math.sin((COVER_OPEN * Math.PI) / 180) + 12;

export const P = fitProjection(
  [
    ...boxCorners(TOP, FOOT_Z0, 0),
    ...boxCorners(COVER, HINGE_Z, coverTop),
    ...boxCorners({ x: SLEEVE_X, y: BIN.y, w: SLEEVE, d: BIN.d, r: 0 }, 0, SLEEVE_Z + SLEEVE + PLAY_RISE),
    [SPINDLE[0], SPINDLE[1], HOVER_Z + 20] as Point3,
  ],
  WIDTH,
  HEIGHT,
  { pad: PAD, azimuth: AZIMUTH, elevation: ELEVATION },
);

export const at = (point: Point3) => iso(point, P);
