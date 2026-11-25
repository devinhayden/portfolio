"use client";

import { SEASONS } from "@/components/lab/seasons/scene";
import { SeasonsCanvas } from "@/components/lab/seasons/SeasonsCanvas";
import { useYear } from "@/components/lab/seasons/useYear";

/** 120 characters across draws the scene at 360 wide, shown one to one. */
const COLS = 120;

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** The changing-seasons scene, in a card. A click sweeps in the next season. */
export default function SeasonsCover() {
  const year = useYear({ ease: 4, pace: 0.4 });
  const next = SEASONS[mod(year.dial + 1, SEASONS.length)];
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <button
        type="button"
        onClick={() => year.turnTo(year.dial + 1)}
        aria-label={`Change the season to ${next}`}
        className="block w-[360px] max-w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        <SeasonsCanvas cols={COLS} attach={year.attach} />
      </button>
    </div>
  );
}
