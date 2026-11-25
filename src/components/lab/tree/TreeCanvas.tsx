"use client";

import * as React from "react";

import type { YearScene } from "../seasons/useYear";
import { dissect } from "./anatomy";
import { TreeLife } from "./life";

function load(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * The hawthorn in block characters. It reads the leafy and bare photos into
 * a tree once both are in and hands it to `attach`, which the season dial
 * drives. `cols` sets how many characters across, and so the canvas's size.
 */
export function TreeCanvas({
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
    Promise.all([load("/tree/small/leafy.png"), load("/tree/small/bare.png")]).then(([leafy, bare]) => {
      if (disposed) return;
      attach(new TreeLife(canvas, dissect(leafy, bare, cols)));
      setReady(true);
    });
    return () => {
      disposed = true;
      attach(null);
    };
  }, [cols, attach]);

  return (
    <canvas
      ref={canvasRef}
      className={`block h-auto w-full [image-rendering:pixelated] transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"} ${className}`}
      aria-label="A hawthorn drawn in block characters, living through the seasons as the dial turns"
      role="img"
    />
  );
}
