"use client";

import { usePeekWindow } from "@/components/peek-window-context";

export default function Page() {
  const { squareRef, homeChromeRef, photosReady, goToPhoto } = usePeekWindow();

  return (
    <div ref={homeChromeRef} className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-24">
        <p className="font-mono text-xs uppercase text-neutral-500">
          Scroll to take a peek
        </p>

        <div className="flex items-center gap-4 sm:gap-14 md:gap-20">
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => goToPhoto(-1)}
            className="shrink-0 text-neutral-400 transition-colors hover:text-neutral-700"
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path d="M10 0L0 8L10 16V0Z" fill="currentColor" />
            </svg>
          </button>

          <div
            ref={squareRef}
            className="h-52 w-52 shrink-0 sm:h-64 sm:w-64 md:h-72 md:w-72"
            style={{ background: photosReady ? "transparent" : "#ffffff" }}
          />

          <button
            type="button"
            aria-label="Next photo"
            onClick={() => goToPhoto(1)}
            className="shrink-0 text-neutral-400 transition-colors hover:text-neutral-700"
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path d="M0 0L10 8L0 16V0Z" fill="currentColor" />
            </svg>
          </button>
        </div>

        <p className="max-w-xs text-center font-serif text-md font-medium leading-relaxed text-foreground sm:max-w-sm">
          Devin is daydreaming about a finished portfolio. Until it&apos;s
          real: a look at his work, and a few scenes he&apos;s captured.
        </p>
      </main>
    </div>
  );
}
