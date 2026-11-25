"use client";

import { useEffect, useRef, useState } from "react";

import { ClayDock, type ClayPresetKey } from "@/components/clay/ClayDock";
import type { ClayEngine } from "@/components/clay/clayStage";
import { CLAY_COLORS } from "@/components/clay/colors";

/**
 * The landing's clay with none of the landing: the lump in the middle of the
 * page and its controls just under it, for playing with on its own.
 */
export function ClayPlayground() {
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

  const choose = (key: ClayPresetKey) => {
    setShape(key);
    engineRef.current?.morph?.(key);
  };

  const reset = () => {
    setShape("ball");
    engineRef.current?.reset();
  };

  return (
    <main className="text-ink fixed inset-0 overflow-hidden bg-white select-none">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="A lump of clay. Drag it, throw it, hold to press a thumbprint into it, or double-click to smash it."
        className="absolute inset-0 size-full"
      />

      {/* The canvas takes every pointer the dock doesn't. */}
      <div className="pointer-events-none relative flex h-full flex-col items-center justify-center gap-[35px] px-4">
        <div
          ref={anchorRef}
          aria-hidden
          className="h-[109px] w-[137px] shrink-0"
        />
        <ClayDock
          shape={shape}
          onChoose={choose}
          onReset={reset}
          className="pointer-events-auto"
        />
        {failed && (
          <p className="font-mono text-xs opacity-60">
            WebGL isn’t available here.
          </p>
        )}
      </div>
    </main>
  );
}
