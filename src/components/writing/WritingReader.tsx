"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { WritingCover } from "@/components/writing/WritingCover";
import { pieceBySlug, type Piece } from "@/components/writing/pieces";

/**
 * A piece of writing opens as a sheet over the page it was chosen from,
 * rather than as a page of its own, the way a photo enlarges over the grid.
 * Nothing underneath unmounts, so closing it finds the index exactly as it
 * was left.
 *
 * The address still follows: opening pushes `/writing/<slug>`, so the back
 * button closes the sheet and the link can be shared. Loading that link
 * directly opens the site on the writing index with the sheet already up.
 */

type Reader = { open: (slug: string) => void };

const ReaderContext = createContext<Reader | null>(null);

/** Opens a piece, or null outside a `WritingReader` (fall back to the link). */
export const useWritingReader = () => useContext(ReaderContext);

const EASE = [0.22, 1, 0.36, 1] as const;

const slugFromPath = (path: string) =>
  /^\/writing\/([^/]+)\/?$/.exec(path)?.[1] ?? null;

export function WritingReader({
  initialSlug,
  children,
}: {
  /** The piece a direct link opened on. */
  initialSlug?: string;
  children: React.ReactNode;
}) {
  const [slug, setSlug] = useState<string | null>(initialSlug ?? null);
  /** Whether this sheet added a history entry, which closing should pop. */
  const pushed = useRef(false);
  const piece = slug ? pieceBySlug(slug) : undefined;

  const open = (next: string) => {
    if (!pieceBySlug(next)) return;
    window.history.pushState(null, "", `/writing/${next}`);
    pushed.current = true;
    setSlug(next);
  };

  const close = () => {
    if (pushed.current) {
      // The popstate below does the closing, so back and × are one path.
      window.history.back();
      return;
    }
    // Opened by a direct link: there's nothing of ours to go back to.
    window.history.replaceState(null, "", "/writing");
    setSlug(null);
  };

  useEffect(() => {
    const onPop = () => {
      const next = slugFromPath(window.location.pathname);
      pushed.current = false;
      setSlug(next && pieceBySlug(next) ? next : null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <ReaderContext.Provider value={{ open }}>
      {children}
      <AnimatePresence>
        {piece && <Sheet key={piece.slug} piece={piece} onClose={close} />}
      </AnimatePresence>
    </ReaderContext.Provider>
  );
}

function Sheet({ piece, onClose }: { piece: Piece; onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  // Hold the page still underneath, and let Escape close the sheet.
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    document.title = `${piece.title} — Devin Hayden`;
    return () => {
      document.title = "Writing — Devin Hayden";
    };
  }, [piece.title]);

  const fade = reduceMotion ? { duration: 0 } : { duration: 0.32, ease: EASE };

  return (
    <motion.div
      role="dialog"
      aria-modal
      aria-label={piece.title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: reduceMotion ? { duration: 0 } : { duration: 0.22, ease: "easeIn" } }}
      transition={fade}
      className="page-ground text-ink fixed inset-0 z-[60] overflow-y-auto overscroll-contain px-4 pt-[clamp(48px,12svh,126px)] pb-28"
    >
      <motion.article
        initial={{ y: reduceMotion ? 0 : 16 }}
        animate={{ y: 0 }}
        exit={{ y: reduceMotion ? 0 : 8 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: EASE }}
        className="mx-auto w-full max-w-[561px]"
      >
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label="Back to writing"
          className="type-lede inline-block cursor-pointer rounded-sm transition-transform hover:-translate-x-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          ←
        </button>

        <div className="mt-[13px]">
          <WritingCover experiment={piece.cover} label={piece.title} />
          <p className="type-mono mt-3 text-ink/45">{piece.hint}</p>
        </div>

        <h1 className="type-display mt-[clamp(32px,6svh,56px)]">
          {piece.title}
        </h1>
        <div className="type-body mt-6 space-y-[1em]">
          {piece.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </motion.article>
    </motion.div>
  );
}
