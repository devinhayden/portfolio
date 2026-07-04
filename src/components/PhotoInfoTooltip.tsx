"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

const TOOLTIP_TEXT =
  "These are 35mm photos taken by me, with custom GLSL shaders overlayed on top.";

const CLOSE_DELAY_MS = 120;

export function PhotoInfoTooltip({
  containerRef,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    closeTimerRef.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }, []);

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      style={{ viewTransitionName: "photo-info" }}
      className="pointer-events-none fixed bottom-6 left-6 z-30 opacity-0 transition-opacity duration-500 ease-out"
    >
      <button
        type="button"
        aria-label="About these photos"
        aria-expanded={open}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        data-open={open ? "" : undefined}
        className="pointer-events-auto h-9 w-9 overflow-hidden rounded-sm border border-foreground/10 bg-background/85 shadow-sm backdrop-blur-sm transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 data-open:h-auto data-open:w-[min(18rem,calc(100vw-3rem))]"
      >
        <span className="flex w-max items-start">
          <span className="flex size-9 shrink-0 items-center justify-center">
            <svg
              aria-hidden
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="text-neutral-500"
            >
              <circle
                cx="7"
                cy="7"
                r="6"
                stroke="currentColor"
                strokeWidth="1.25"
              />
              <path
                d="M7 6.25V10"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
              />
              <circle cx="7" cy="4.25" r="0.75" fill="currentColor" />
            </svg>
          </span>
          <span className="w-[calc(18rem-2.25rem)] max-w-[calc(100vw-3rem-2.25rem)] shrink-0 py-2.5 pl-2.5 pr-3.5 text-left font-mono text-xs uppercase leading-relaxed tracking-wide text-neutral-500">
            {TOOLTIP_TEXT}
          </span>
        </span>
      </button>
    </div>
  );
}
