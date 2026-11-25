"use client";

import { SeasonDial } from "@/components/lab/seasons/SeasonDial";
import { useYear } from "@/components/lab/seasons/useYear";
import { TreeCanvas } from "@/components/lab/tree/TreeCanvas";

/** 80 characters across draws the tree at 240 wide, shown one to one. */
const COLS = 80;

/** The hawthorn, in a card, with its dial beside it. */
export default function TreeCover() {
  const year = useYear({ ease: 4, pace: 0.45 });
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-6 p-6 max-sm:gap-2">
      <TreeCanvas cols={COLS} attach={year.attach} className="w-[240px] max-w-[55%]" />
      <div className="shrink-0">
        <SeasonDial value={year.dial} onChange={year.turnTo} size={128} />
      </div>
    </div>
  );
}
