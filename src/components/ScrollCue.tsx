"use client";

import {
  motion,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useLayoutEffect, useRef } from "react";

/**
 * Says which way to scroll, and what that does.
 *
 * The site has one scroll rule — down goes deeper, up comes back — and two
 * cues teach it: one under the picker pointing down ("open this"), and one at
 * the top of an opened page pointing up ("back to the menu"). They share a
 * shape so they read as the same instruction in two directions. Each is also
 * a shortcut that does what the scroll would.
 *
 * Just the arrow, in a round chip: the direction says enough once you've
 * seen it. The label stays as the button's name, for screen readers and as
 * a tooltip on hover.
 */
export function ScrollCue({
  direction,
  label,
  visibility,
  onClick,
}: {
  direction: "up" | "down";
  /** Not shown: names the button for screen readers, and as its tooltip. */
  label: string;
  /** 0–1: drives both the fade and a short rise into place. */
  visibility: MotionValue<number>;
  onClick: () => void;
}) {
  const rise = direction === "down" ? 6 : -6;
  const y = useTransform(visibility, [0, 1], [rise, 0]);
  // A faded cue would still take clicks and focus; an invisible one mustn't.
  // Set on the element rather than through state: `visibility` can change
  // while the parent renders, and a state update then is an error.
  const buttonRef = useRef<HTMLButtonElement>(null);
  const setShown = (value: number) => {
    if (buttonRef.current) buttonRef.current.inert = value < 0.5;
  };
  useLayoutEffect(() => setShown(visibility.get()));
  useMotionValueEvent(visibility, "change", setShown);

  return (
    <motion.button
      type="button"
      ref={buttonRef}
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{ opacity: visibility, y }}
      className="text-ink pointer-events-auto flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06),0_2px_10px_rgba(0,0,0,0.08)] backdrop-blur-sm transition-colors hover:bg-white"
    >
      <span
        aria-hidden
        className={`block size-3 ${
          direction === "down"
            ? "motion-safe:animate-cue-down"
            : "motion-safe:animate-cue-up"
        }`}
      >
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-full"
        >
          {direction === "down" ? (
            <path d="M6 2.5v7M2.75 6.25 6 9.5l3.25-3.25" />
          ) : (
            <path d="M6 9.5v-7M2.75 5.75 6 2.5l3.25 3.25" />
          )}
        </svg>
      </span>
    </motion.button>
  );
}
