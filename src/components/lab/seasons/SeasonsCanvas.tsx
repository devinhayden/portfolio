"use client";

import * as React from "react";

import { SEASONS, SeasonScene, type Season } from "./scene";
import type { YearScene } from "./useYear";

/** The source photos are 2544 × 1904; these are smaller copies for sampling. */
export const SEASONS_ASPECT = 2544 / 1904;

function load(season: Season) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `/seasons/small/${season}.jpeg`;
  });
}

/**
 * The stand of trees in block characters. It builds its scene once the four
 * photos are in and hands it to `attach`, which the season dial drives.
 * `cols` sets how many characters across, and so the canvas's own size.
 */
export function SeasonsCanvas({
  cols,
  attach,
  className = "",
}: {
  cols: number;
  attach: (scene: YearScene | null) => void;
  className?: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current!;
    let disposed = false;
    let scene: SeasonScene | null = null;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => {
      scene?.setReducedMotion(motion.matches);
      attach(scene);
    };

    Promise.all(SEASONS.map(load)).then((images) => {
      if (disposed) return;
      scene = new SeasonScene(canvas, images, SEASONS_ASPECT, cols);
      scene.setReducedMotion(motion.matches);
      attach(scene);
      setReady(true);
    });
    motion.addEventListener("change", onMotion);

    return () => {
      disposed = true;
      motion.removeEventListener("change", onMotion);
      attach(null);
    };
  }, [cols, attach]);

  return (
    <canvas
      ref={canvasRef}
      className={`block h-auto w-full [image-rendering:pixelated] transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"} ${className}`}
      style={{ aspectRatio: SEASONS_ASPECT }}
      aria-label="A stand of trees drawn in block characters, changing with the season dial"
      role="img"
    />
  );
}
