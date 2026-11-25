"use client";

import dynamic from "next/dynamic";

import type { ExperimentKey } from "@/components/lab/experiments";

/**
 * Each experiment loads on its own, and only in the browser: the clay needs
 * WebGL, and a page only pays for the one cover it shows.
 */
const COVERS = {
  clay: dynamic(() => import("./covers/ClayCover"), { ssr: false }),
  record: dynamic(() => import("./covers/RecordCover"), { ssr: false }),
  seasons: dynamic(() => import("./covers/SeasonsCover"), { ssr: false }),
  tree: dynamic(() => import("./covers/TreeCover"), { ssr: false }),
} satisfies Record<ExperimentKey, unknown>;

/**
 * A piece's cover: its experiment, live, in the card from the design
 * (Figma "Wireframe - 2", 561 × 382, an 8px radius and a hairline border).
 */
export function WritingCover({
  experiment,
  label,
}: {
  experiment: ExperimentKey;
  label: string;
}) {
  const Cover = COVERS[experiment];
  return (
    <figure
      aria-label={label}
      className="relative aspect-[561/382] w-full overflow-hidden rounded-[8px] border border-[#d9d9d9] bg-white"
    >
      <Cover />
    </figure>
  );
}
