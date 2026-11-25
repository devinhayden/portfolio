"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  CLAY_COLORS,
  type ClayEngine,
  type ClayParam,
} from "@/components/clay/clayStage";

/**
 * A bench for the two clay prototypes, laid out like the landing would be
 * (Figma "Desktop - 25"): the lump above, the line and the introduction
 * under it. Both engines are plain three.js and load only on this page.
 */

const PROTOTYPES = {
  a: {
    label: "A · Sculpt",
    hints: [
      "Drag to pull",
      "Hold still to press",
      "Shift-drag to twist",
      "Double-click to smash",
      "Drag the background to turn",
    ],
    load: () =>
      import("@/components/lab/sculptClay").then((m) => m.createSculptClay),
  },
  b: {
    label: "B · Soft body",
    hints: [
      "Drag to carry",
      "Throw it",
      "Hold still to press",
      "Double-click to smash",
    ],
    load: () =>
      import("@/components/clay/softClay").then((m) => m.createSoftClay),
  },
} as const;

type PrototypeKey = keyof typeof PROTOTYPES;

// The hash holds the chosen prototype, so it survives reloads and links.
const subscribeToHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};
const prototypeFromHash = (): PrototypeKey =>
  window.location.hash === "#b" ? "b" : "a";

const chip =
  "whitespace-nowrap rounded-full px-3 py-1.5 transition-colors focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#383838]";

export function ClayLab() {
  const prototype = useSyncExternalStore(
    subscribeToHash,
    prototypeFromHash,
    () => "a" as const,
  );
  const [color, setColor] = useState<string>(CLAY_COLORS[0].hex);
  const [params, setParams] = useState<ClayParam[]>([]);
  const [presets, setPresets] = useState<ClayEngine["presets"]>([]);
  const [tuning, setTuning] = useState(false);
  const [failed, setFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ClayEngine>(null);
  // Read by the loader without making colour a reason to rebuild the scene.
  const colorRef = useRef(color);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    PROTOTYPES[prototype]
      .load()
      .then((create) => {
        if (cancelled) return;
        const engine = create(canvas, colorRef.current);
        engineRef.current = engine;
        setParams(engine.params.map((param) => ({ ...param })));
        setPresets(engine.presets ?? []);
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
  }, [prototype]);

  const choose = (key: PrototypeKey) => {
    setFailed(false);
    window.location.replace(`#${key}`);
  };

  const paint = (hex: string) => {
    colorRef.current = hex;
    setColor(hex);
    engineRef.current?.setColor(hex);
  };

  const tune = (key: string, value: number) => {
    engineRef.current?.setParam(key, value);
    setParams((current) =>
      current.map((param) => (param.key === key ? { ...param, value } : param)),
    );
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-white text-[#383838] select-none">
      {/* Keyed so each prototype gets a fresh canvas and GL context. */}
      <canvas
        key={prototype}
        ref={canvasRef}
        aria-label="A lump of clay you can shape"
        className="absolute inset-0 size-full touch-none"
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-4 font-mono text-xs sm:p-6">
        <p className="hidden pt-1.5 tracking-wider uppercase opacity-50 sm:block">
          Lab / Clay
        </p>
        <div className="flex flex-col items-center gap-2">
          <nav
            aria-label="Prototype"
            className="pointer-events-auto flex rounded-full bg-black/5 p-1"
          >
            {(Object.keys(PROTOTYPES) as PrototypeKey[]).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={prototype === key}
                onClick={() => choose(key)}
                className={`${chip} ${
                  prototype === key
                    ? "bg-white shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {PROTOTYPES[key].label}
              </button>
            ))}
          </nav>
          {presets && presets.length > 0 && (
            <div
              aria-label="Shape it into"
              role="group"
              className="pointer-events-auto flex flex-wrap justify-center gap-1"
            >
              {presets.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => engineRef.current?.morph?.(preset.key)}
                  className={`${chip} opacity-60 hover:bg-black/5 hover:opacity-100`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => engineRef.current?.reset()}
          className={`${chip} pointer-events-auto bg-black/5 hover:bg-black/10`}
        >
          Reset
        </button>
      </header>

      {failed && (
        <p className="absolute inset-x-0 top-1/3 text-center font-mono text-xs opacity-60">
          WebGL isn’t available here.
        </p>
      )}

      {/* The landing copy, as Figma has it: the line, then who's saying it. */}
      <section className="pointer-events-none absolute inset-x-0 top-[66%] flex flex-col items-center gap-6 px-4 text-center">
        <h1 className="font-serif text-[clamp(1.5rem,4.2vw,2rem)] leading-tight tracking-[-0.03em]">
          Shaping what exists and pushing it beyond.
        </h1>
        <p className="flex items-center gap-[15px] font-ui text-[20px] font-medium tracking-[-0.03em]">
          <span className="relative size-8 shrink-0 overflow-hidden rounded-[3.2px]">
            <Image
              src="/profile.JPEG"
              alt=""
              width={3362}
              height={5043}
              sizes="64px"
              className="absolute top-[-55.47%] left-[-46.83%] h-[288.71%] w-[192.5%] max-w-none"
            />
          </span>
          Hi, I’m Devin!
        </p>
      </section>

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-4 p-4 font-mono text-xs sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 opacity-50">
          {PROTOTYPES[prototype].hints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>

        <div className="pointer-events-auto flex flex-col items-start gap-3 sm:items-end">
          {tuning && (
            <div className="flex w-64 flex-col gap-2 rounded-2xl bg-black/5 p-4">
              {params.map((param) => (
                <label key={param.key} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 opacity-60">
                    {param.label}
                  </span>
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={param.value}
                    onChange={(event) =>
                      tune(param.key, Number(event.currentTarget.value))
                    }
                    className="min-w-0 flex-1 accent-[#383838]"
                  />
                  <span className="w-10 shrink-0 text-right tabular-nums">
                    {param.value}
                  </span>
                </label>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <div
              className="flex gap-2"
              role="radiogroup"
              aria-label="Clay colour"
            >
              {CLAY_COLORS.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  role="radio"
                  aria-checked={color === swatch.hex}
                  aria-label={swatch.name}
                  onClick={() => paint(swatch.hex)}
                  style={{ backgroundColor: swatch.hex }}
                  className={`size-5 rounded-full transition-transform focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#383838] ${
                    color === swatch.hex
                      ? "scale-125 ring-2 ring-white ring-offset-0"
                      : "hover:scale-110"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-expanded={tuning}
              onClick={() => setTuning((open) => !open)}
              className={`${chip} bg-black/5 hover:bg-black/10`}
            >
              Tune
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
