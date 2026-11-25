"use client";

import { SeasonDial } from "./seasons/SeasonDial";
import { useYear } from "./seasons/useYear";
import { TreeCanvas } from "./tree/TreeCanvas";

/** Characters across the tree. */
const COLS = 160;

/**
 * A hawthorn drawn in block characters, living through the year as the dial
 * turns: leaves bud, deepen, colour, fall and rot, then bud again. It moves
 * at a steady pace, so a click to the next season plays the change out.
 */
export function TreeLab() {
  const year = useYear({ ease: 4, pace: 0.45 });

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10 font-mono text-ink">
      <figure className="flex w-full flex-col items-center gap-4">
        <TreeCanvas cols={COLS} attach={year.attach} className="max-w-[480px]" />
        <SeasonDial value={year.dial} onChange={year.turnTo} />
      </figure>
    </main>
  );
}
