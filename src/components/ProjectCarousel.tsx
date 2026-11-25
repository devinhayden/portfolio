"use client";

import Image from "next/image";
import { motion, type MotionValue } from "motion/react";
import { useRef } from "react";

import { type Card, HOME } from "@/components/projects";
import type { SceneLayout } from "@/components/sceneLayout";

type Props = {
  projects: readonly Card[];
  activeIndex: number;
  /** Bring a project up into the preview above. */
  onSelect: (index: number) => void;
  /** Commit to a project and open its case study. */
  onOpen: (index: number) => void;
  layout: SceneLayout | null;
  y: MotionValue<number>;
  /** The opening has settled, so the strip is ready to be clicked. */
  open: boolean;
};

export function ProjectCarousel({
  projects,
  activeIndex,
  onSelect,
  onOpen,
  layout,
  y,
  open,
}: Props) {
  const buttonRefs = useRef(new Map<number, HTMLButtonElement>());

  if (!layout) return null;

  const step = (from: number, delta: number) => {
    const next = Math.min(projects.length - 1, Math.max(0, from + delta));
    if (next === from) return;
    onSelect(next);
    buttonRefs.current.get(next)?.focus();
  };

  return (
    <motion.div
      inert={!open}
      style={{
        y,
        x: "-50%",
        left: "50%",
        top: layout.carouselTop,
        width: layout.trackWidth,
      }}
      className="absolute"
    >
      <ul
        aria-label="Work"
        style={{ gap: layout.gutter }}
        // Five thumbnails fill the track exactly; three do on a phone, and the
        // rest are a swipe away. `overflow-x-auto` makes this a scroll
        // container, which clips on *both* axes — so it is pulled out by 20px
        // and padded back in, giving the active thumbnail's shadow somewhere to
        // fall without moving the thumbnails themselves.
        // Centred when they all fit; when they don't (a phone), "safe"
        // centring falls back to the start so none is cut off.
        className="-m-5 flex justify-center-safe snap-x snap-mandatory scroll-p-5 overflow-x-auto p-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {projects.map((project, index) => {
          const selected = index === activeIndex;
          return (
            <li key={project.slug} className="group/thumb shrink-0 snap-start">
              <button
                ref={(el) => {
                  if (el) buttonRefs.current.set(index, el);
                  else buttonRefs.current.delete(index);
                }}
                type="button"
                aria-pressed={selected}
                // Selecting is a preview; the chosen one opens on a second
                // press, which is the same two-step the scroll makes you take.
                aria-label={
                  selected
                    ? project.slug === HOME.slug
                      ? "Open the home page"
                      : `Open ${project.title}`
                    : `Show ${project.title}. ${project.summary}`
                }
                onClick={() => (selected ? onOpen(index) : onSelect(index))}
                onKeyDown={(event) => {
                  const delta = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
                  if (delta === undefined) return;
                  event.preventDefault();
                  step(index, delta);
                }}
                style={{ width: layout.thumbWidth, height: layout.thumbHeight }}
                // Hover lifts the thumbnail a touch and darkens its title,
                // rather than covering the preview.
                className={`relative block cursor-pointer overflow-hidden rounded-[12px] transition-[box-shadow,translate] duration-300 ease-out group-hover/thumb:-translate-y-[3px] motion-reduce:group-hover/thumb:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-800 ${
                  selected ? "shadow-[0_2px_16px_rgba(0,0,0,0.15)]" : ""
                }`}
              >
                <Image
                  src={project.cover.src}
                  alt=""
                  fill
                  sizes="240px"
                  className="object-cover"
                />
                {/* The page's name over a dark veil: shown on hover, and
                    kept while the card is the one selected. */}
                <span
                  aria-hidden
                  className={`type-mono absolute inset-0 flex items-center justify-center rounded-[12px] bg-black/40 text-white transition-opacity duration-300 group-hover/thumb:opacity-100 group-has-[:focus-visible]/thumb:opacity-100 ${
                    selected ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {project.title}
                </span>
                <span
                  aria-hidden
                  className={`absolute inset-0 rounded-[12px] border-4 border-white transition-opacity duration-300 ${
                    selected ? "opacity-100" : "opacity-0"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
