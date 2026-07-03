"use client";

import { createContext, useContext, type RefObject } from "react";

/* Bridges SiteShell (which owns the WebGL canvas, refs, and scroll state)
   to the Home page's own content (which renders the DOM square the window
   mask locks onto, and the prev/next buttons). They're siblings in the
   tree - SiteShell can't reach into {children} for a ref, so the ref
   itself is handed down through context instead. */
type PeekWindowContextValue = {
  squareRef: RefObject<HTMLDivElement | null>;
  homeChromeRef: RefObject<HTMLDivElement | null>;
  photosReady: boolean;
  goToPhoto: (dir: 1 | -1) => void;
};

export const PeekWindowContext = createContext<PeekWindowContextValue | null>(
  null,
);

export function usePeekWindow() {
  const ctx = useContext(PeekWindowContext);
  if (!ctx) {
    throw new Error("usePeekWindow must be used within SiteShell");
  }
  return ctx;
}
