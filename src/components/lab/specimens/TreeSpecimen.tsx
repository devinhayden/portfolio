"use client";

import { createPortal } from "react-dom";

import { SeasonDial } from "../seasons/SeasonDial";
import { useYear } from "../seasons/useYear";
import { TreeCanvas } from "../tree/TreeCanvas";
import type { SpecimenSlots } from "./types";

/** 72 characters across draws the tree at 216 × 245, shown one to one. */
const COLS = 72;

/** The hawthorn, small, with a compact dial where the clay's controls sit. */
export default function TreeSpecimen({ figure, dock }: SpecimenSlots) {
  const year = useYear({ ease: 4, pace: 0.45 });
  return (
    <>
      {createPortal(
        <div className="w-[216px]">
          <TreeCanvas cols={COLS} attach={year.attach} />
        </div>,
        figure,
      )}
      {createPortal(<SeasonDial value={year.dial} onChange={year.turnTo} size={112} />, dock)}
    </>
  );
}
