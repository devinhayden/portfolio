"use client";

import Image from "next/image";
import { motion, type MotionValue } from "motion/react";

import type { Photo } from "@/components/photos";
import type { SceneLayout } from "@/components/sceneLayout";

type Props = {
  photos: readonly Photo[];
  activeIndex: number;
  onSelect: (index: number) => void;
  layout: SceneLayout | null;
  y: MotionValue<number>;
  /** Scroll has carried the scene far enough for the strip to be usable. */
  open: boolean;
};

export function PhotoCarousel({
  photos,
  activeIndex,
  onSelect,
  layout,
  y,
  open,
}: Props) {
  if (!layout) return null;

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
        aria-label="Background photo"
        style={{ gap: layout.gutter }}
        // Five thumbnails fill the track exactly; three do on a phone, and the
        // rest are a swipe away. `overflow-x-auto` makes this a scroll
        // container, which clips on *both* axes — so it is pulled out by 20px
        // and padded back in, giving the active thumbnail's shadow somewhere to
        // fall without moving the thumbnails themselves.
        className="-m-5 flex snap-x snap-mandatory scroll-p-5 overflow-x-auto p-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((photo, index) => {
          const selected = index === activeIndex;
          return (
            <li key={photo.src} className="shrink-0 snap-start">
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(index)}
                style={{ width: layout.thumbWidth, height: layout.thumbHeight }}
                className={`relative block cursor-pointer overflow-hidden rounded-[12px] transition-shadow duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-800 ${
                  selected ? "shadow-[0_2px_16px_rgba(0,0,0,0.15)]" : ""
                }`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="240px"
                  // The chosen photo is the only one shown in colour.
                  className={`object-cover transition-[filter] duration-300 ${
                    selected ? "" : "grayscale"
                  }`}
                />
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
