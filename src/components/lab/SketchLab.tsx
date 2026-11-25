"use client";

import { SEASONS } from "./seasons/scene";
import { SeasonsCanvas } from "./seasons/SeasonsCanvas";
import { useYear } from "./seasons/useYear";

/** Characters across the scene. */
const COLS = 180;

const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * A stand of trees drawn in block characters. Click it and the next season
 * sweeps in from the bottom-left corner on its own, at a steady pace.
 */
export function SketchLab() {
  const year = useYear({ ease: 4, pace: 0.4 });
  const next = SEASONS[mod(year.dial + 1, SEASONS.length)];

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10 font-mono text-ink">
      <figure className="flex w-full flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => year.turnTo(year.dial + 1)}
          aria-label={`Change the season to ${next}`}
          className="block w-full max-w-[540px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          <SeasonsCanvas cols={COLS} attach={year.attach} />
        </button>
        <figcaption className="text-ink/40 text-[11px] tracking-[0.06em] uppercase">
          Click to change the season
        </figcaption>
      </figure>
    </main>
  );
}
