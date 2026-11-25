"use client";

import { useEffect, useRef, useState } from "react";

import { ClayDock, type ClayPresetKey } from "@/components/clay/ClayDock";
import type { ClayEngine } from "@/components/clay/clayStage";
import { CLAY_COLORS } from "@/components/clay/colors";

/**
 * The soft-body clay, in a card. The canvas fills the card, so the lump can
 * be thrown anywhere inside it; the anchor sets where it rests, with its
 * shapes just under it.
 */
export default function ClayCover() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ClayEngine>(null);
  const [shape, setShape] = useState<ClayPresetKey>("ball");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const anchor = anchorRef.current;
    if (!canvas || !anchor) return;

    let cancelled = false;
    import("@/components/clay/softClay")
      .then(({ createSoftClay }) => {
        if (cancelled) return;
        engineRef.current = createSoftClay(canvas, CLAY_COLORS[0].hex, {
          anchor,
        });
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <div className="absolute inset-0 select-none">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="A lump of clay. Drag it, throw it, hold to press a thumbprint into it, or double-click to smash it."
        className="absolute inset-0 size-full touch-none"
      />
      {/* The canvas takes every pointer the dock doesn't. */}
      <div className="pointer-events-none relative flex h-full flex-col items-center justify-center gap-[28px] px-4">
        <div ref={anchorRef} aria-hidden className="h-[109px] w-[137px] shrink-0" />
        <ClayDock
          shape={shape}
          onChoose={(key) => {
            setShape(key);
            engineRef.current?.morph?.(key);
          }}
          onReset={() => {
            setShape("ball");
            engineRef.current?.reset();
          }}
          className="pointer-events-auto"
        />
        {failed && (
          <p className="font-mono text-xs opacity-60">WebGL isn’t available here.</p>
        )}
      </div>
    </div>
  );
}
