"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const GLYPHS = ["✳", "❋", "✽", "*", ","];
const COLORS = ["rgba(28,27,26,0.16)", "rgba(28,27,26,0.1)", "#e4ddd0"];
const INITIAL_COUNT = 6;
const MAX_COUNT = 40;
const GROWTH_INTERVAL_MS = 6000;

type Sprout = {
  id: number;
  glyph: string;
  color: string;
  /** Horizontal position as a % of the viewport width. */
  left: number;
  bottom: number;
  size: number;
  rotate: number;
  swayDuration: number;
};

function makeSprout(id: number): Sprout {
  return {
    id,
    glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    left: 1 + Math.random() * 98,
    bottom: 4 + Math.random() * 24,
    size: 12 + Math.random() * 10,
    rotate: -22 + Math.random() * 44,
    swayDuration: 4 + Math.random() * 4,
  };
}

export function GlyphMeadow() {
  const [sprouts, setSprouts] = useState<Sprout[]>([]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const seed = setTimeout(() => {
      setSprouts(Array.from({ length: INITIAL_COUNT }, (_, i) => makeSprout(i)));
    }, 0);

    const interval = setInterval(() => {
      setSprouts((prev) => {
        if (prev.length >= MAX_COUNT) {
          clearInterval(interval);
          return prev;
        }
        return [...prev, makeSprout(prev.length)];
      });
    }, GROWTH_INTERVAL_MS);

    return () => {
      clearTimeout(seed);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-16 font-serif"
    >
      {sprouts.map((sprout) => (
        <motion.span
          key={sprout.id}
          initial={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0, rotate: sprout.rotate }
          }
          animate={
            reduceMotion
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  scale: 1,
                  rotate: [sprout.rotate - 2, sprout.rotate + 2, sprout.rotate - 2],
                }
          }
          transition={{
            opacity: { duration: 0.5 },
            scale: {
              type: "spring",
              stiffness: 180,
              damping: 14,
              delay: sprout.id < INITIAL_COUNT ? sprout.id * 0.25 : 0,
            },
            rotate: {
              duration: sprout.swayDuration,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className="absolute leading-none"
          style={{
            left: `${sprout.left}%`,
            bottom: sprout.bottom,
            fontSize: sprout.size,
            color: sprout.color,
            transformOrigin: "50% 100%",
          }}
        >
          {sprout.glyph}
        </motion.span>
      ))}
    </div>
  );
}
