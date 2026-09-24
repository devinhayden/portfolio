"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const GLYPHS = ["✳", "❋", "✽", "*", ","];
const COLORS = ["rgba(28,27,26,0.16)", "rgba(28,27,26,0.1)", "#e4ddd0"];
const INITIAL_COUNT = 8;
const MAX_COUNT = 56;
const GROWTH_INTERVAL_MS = 6000;

type Edge = "bottom" | "top" | "left" | "right";

/** Orients each glyph so its base sits on the edge it grows from. */
const EDGE_ROTATION: Record<Edge, number> = {
  bottom: 0,
  top: 180,
  left: 90,
  right: -90,
};

const EDGE_ORIGIN: Record<Edge, string> = {
  bottom: "50% 100%",
  top: "50% 0%",
  left: "0% 50%",
  right: "100% 50%",
};

type Sprout = {
  id: number;
  glyph: string;
  color: string;
  edge: Edge;
  /** Position along the edge as a % of its length. */
  along: number;
  /** Inset (px) from the edge the sprout grows out of. */
  inset: number;
  size: number;
  rotate: number;
  swayDuration: number;
};

function pickEdge(): Edge {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const r = Math.random() * (2 * w + 2 * h);
  if (r < w) return "bottom";
  if (r < 2 * w) return "top";
  if (r < 2 * w + h) return "left";
  return "right";
}

function makeSprout(id: number): Sprout {
  const edge = pickEdge();
  return {
    id,
    glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    edge,
    along: 1 + Math.random() * 98,
    inset: 4 + Math.random() * 24,
    size: 12 + Math.random() * 10,
    rotate: EDGE_ROTATION[edge] - 22 + Math.random() * 44,
    swayDuration: 4 + Math.random() * 4,
  };
}

function edgePosition(sprout: Sprout): React.CSSProperties {
  switch (sprout.edge) {
    case "bottom":
      return { left: `${sprout.along}%`, bottom: sprout.inset };
    case "top":
      return { left: `${sprout.along}%`, top: sprout.inset };
    case "left":
      return { top: `${sprout.along}%`, left: sprout.inset };
    case "right":
      return { top: `${sprout.along}%`, right: sprout.inset };
  }
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
      className="pointer-events-none absolute inset-0 -z-10 font-serif"
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
            ...edgePosition(sprout),
            fontSize: sprout.size,
            color: sprout.color,
            transformOrigin: EDGE_ORIGIN[sprout.edge],
          }}
        >
          {sprout.glyph}
        </motion.span>
      ))}
    </div>
  );
}
