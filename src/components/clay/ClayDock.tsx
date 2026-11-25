"use client";

import Image from "next/image";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";

import {
  ClayBallIcon,
  ClayCameraIcon,
  ClayDumplingIcon,
  ClayMatchaIcon,
} from "@/components/icons";

/** The clay's controls: a row of shapes to morph it into, and a reset. */

export const CLAY_PRESETS = [
  { key: "ball", label: "Ball", Icon: ClayBallIcon },
  { key: "camera", label: "Camera", Icon: ClayCameraIcon },
  { key: "dumpling", label: "Dumpling", Icon: ClayDumplingIcon },
  { key: "matcha", label: "Matcha", Icon: ClayMatchaIcon },
] as const;

export type ClayPresetKey = (typeof CLAY_PRESETS)[number]["key"];

type Props = {
  shape: ClayPresetKey;
  onChoose: (key: ClayPresetKey) => void;
  onReset: () => void;
  className?: string;
};

export function ClayDock({ shape, onChoose, onReset, className = "" }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LayoutGroup>
        <div
          role="radiogroup"
          aria-label="Shape the clay into"
          className="bg-track flex rounded-full p-1"
        >
          {CLAY_PRESETS.map((preset) => {
            const selected = preset.key === shape;
            return (
              <button
                key={preset.key}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={preset.label}
                title={preset.label}
                onClick={() => onChoose(preset.key)}
                className={`relative rounded-full px-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                  selected ? "text-ink" : "text-ink/55 hover:text-ink"
                }`}
              >
                {/* One pill that slides to whichever shape is current. */}
                {selected && (
                  <motion.span
                    layoutId="clay-preset"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 500, damping: 38 }
                    }
                    className="absolute inset-0 rounded-full bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.08)]"
                  />
                )}
                <preset.Icon className="relative block size-4" />
              </button>
            );
          })}
        </div>
      </LayoutGroup>
      <button
        type="button"
        onClick={onReset}
        aria-label="Reset the clay"
        className="bg-track grid size-9 place-items-center rounded-full transition-transform duration-200 ease-out hover:-rotate-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <Image src="/clay/reset.svg" alt="" width={16} height={16} />
      </button>
    </div>
  );
}
