"use client";

import { createPortal } from "react-dom";

import { SEASONS } from "../seasons/scene";
import { SeasonsCanvas } from "../seasons/SeasonsCanvas";
import { useYear } from "../seasons/useYear";
import type { SpecimenSlots } from "./types";

/** 96 characters across draws the scene at 288 × 215, shown one to one. */
const COLS = 96;

const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * The changing-seasons scene, small. Clicking it sweeps the next season in on
 * its own, so the dock only carries a hint.
 */
export default function SeasonsSpecimen({ figure, dock }: SpecimenSlots) {
  const year = useYear({ ease: 4, pace: 0.4 });
  const next = SEASONS[mod(year.dial + 1, SEASONS.length)];
  return (
    <>
      {createPortal(
        <button
          type="button"
          onClick={() => year.turnTo(year.dial + 1)}
          aria-label={`Change the season to ${next}`}
          className="block w-[288px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          <SeasonsCanvas cols={COLS} attach={year.attach} />
        </button>,
        figure,
      )}
      {createPortal(
        <p className="text-ink/45 pb-3 font-mono text-[11px] tracking-[0.06em] uppercase">Click to change the season</p>,
        dock,
      )}
    </>
  );
}
