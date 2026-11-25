"use client";

import * as React from "react";

/** Anything drawn from a position along the year: 0 spring, 1 summer, and on round. */
export interface YearScene {
  setPosition(position: number): void;
  draw(now: number): void;
  /** True while something needs frames even with the dial at rest. */
  readonly turning?: boolean;
}

type Options = {
  /** How quickly the scene catches up with the dial, per second, near the end of a move. */
  ease: number;
  /** The most seasons a second the scene moves, or none for no cap. */
  pace?: number;
};

/**
 * Drives a year scene from the season dial: the dial's value is the target,
 * and the scene eases toward it, drawing only while it's moving (or while
 * the scene says it's mid-turn). Reduced motion jumps straight there.
 */
export function useYear({ ease, pace = Infinity }: Options) {
  const scene = React.useRef<YearScene | null>(null);
  const [dial, setDial] = React.useState(0);
  const target = React.useRef(0);
  const shown = React.useRef(0);
  const wake = React.useRef<() => void>(() => {});

  React.useEffect(() => {
    let raf = 0;
    let last = 0;
    let disposed = false;
    const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const frame = (now: number) => {
      const current = scene.current;
      if (!current) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const gap = target.current - shown.current;
      const step = Math.sign(gap) * Math.min(Math.abs(gap) * (1 - Math.exp(-dt * ease)), pace * dt);
      shown.current = Math.abs(gap) < 1e-4 || reduced() ? target.current : shown.current + step;
      current.setPosition(shown.current);
      current.draw(now / 1000);
      raf = shown.current !== target.current || current.turning ? requestAnimationFrame(frame) : 0;
    };
    wake.current = () => {
      if (raf || disposed) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
    };
  }, [ease, pace]);

  /** Hands the hook its scene once it's built, and draws it where the dial already is. */
  const attach = React.useCallback((next: YearScene | null) => {
    scene.current = next;
    if (next) {
      next.setPosition(shown.current);
      wake.current();
    }
  }, []);

  const turnTo = React.useCallback((value: number) => {
    target.current = value;
    setDial(value);
    wake.current();
  }, []);

  return { dial, turnTo, attach, wake: () => wake.current() };
}
