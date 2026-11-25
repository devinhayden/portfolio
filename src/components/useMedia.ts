"use client";

import { useSyncExternalStore } from "react";

/** Phones: the site drops the scroll-in picker for plain tabs. */
export const PHONE = "(max-width: 639px)";
/**
 * Phones, tablets and anything driven by touch: the photo grid swaps its
 * view-transition flights for plain fades there, which mobile browsers draw
 * smoothly.
 */
export const TOUCH = "(max-width: 1023px), (pointer: coarse)";

/**
 * Whether a media query matches, kept live. The server can't know, so it
 * (and the first client render, for hydration) gets `fallback`; the real
 * answer follows straight after.
 */
export function useMedia(query: string, fallback = false) {
  return useSyncExternalStore(
    (onChange) => {
      const list = matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => matchMedia(query).matches,
    () => fallback,
  );
}
