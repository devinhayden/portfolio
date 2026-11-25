"use client";

import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

import { AGENT, huddleFont } from "./huddle";

/** How long it holds at full strength, then how long it takes to fade. */
const HOLD = 2500;
const DRAIN = 8000;

type State = "arrives" | "fading" | "pinned" | "cleared" | "dismissed";
/** What the item is doing; "live" becomes arrives, fading or cleared by time. */
type Mode = "live" | "pinned" | "dismissed";

const STEPS: { state: State; label: string }[] = [
  { state: "arrives", label: "Arrives" },
  { state: "fading", label: "Fading" },
  { state: "pinned", label: "Pinned" },
  { state: "cleared", label: "Cleared" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

const TITLE = "Demo moved from Oct 14 to Oct 21, pending copy review.";

/**
 * Decision 02 of the Huddle agent (Paper "Messaging context", node 18D-0):
 * the life of one surfaced item. It arrives at full strength; left alone,
 * its rail drains and it dims, then clears itself. Pin keeps it (× lets it
 * go again); Dismiss clears it at once. Hovering a fading item holds the
 * timer and brings it back, so it never vanishes while being read.
 * The states, labelled as in the frame, double as a picker to jump between
 * them. The fade is compressed to seconds here.
 */
export function HuddleKeep() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();

  const [mode, setMode] = useState<Mode>("live");
  /** Time spent on screen unpinned, in ms; the rail, fade and clearing follow it. */
  const [elapsed, setElapsed] = useState(0);
  const [held, setHeld] = useState(false);

  const state: State =
    mode === "pinned"
      ? "pinned"
      : mode === "dismissed"
        ? "dismissed"
        : elapsed >= HOLD + DRAIN
          ? "cleared"
          : elapsed >= HOLD
            ? "fading"
            : "arrives";
  const live = state === "arrives" || state === "fading";

  // The timer: runs while the item is up, unpinned, in view and not held.
  const running = inView && live && !held && !reduceMotion;
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setElapsed((e) => Math.min(e + dt, HOLD + DRAIN));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  /** Jump to a state from the picker. */
  const go = (next: State) => {
    setHeld(false);
    if (next === "pinned") return setMode("pinned");
    setMode("live");
    setElapsed(
      next === "fading"
        ? HOLD + DRAIN * 0.35
        : next === "cleared"
          ? HOLD + DRAIN
          : 0,
    );
  };

  /** How much of the timer is left, 1 → 0. */
  const left = 1 - Math.max(0, elapsed - HOLD) / DRAIN;
  const fading = state === "fading" && !held;
  const shown: State = state === "dismissed" ? "cleared" : state;

  return (
    <div
      ref={ref}
      className={`${huddleFont.className} mx-auto flex w-full max-w-[392px] flex-col gap-4 text-left`}
    >
      {/* The states, as labelled in the frame; each one is a jump. */}
      <div
        role="group"
        aria-label="Item state"
        className="flex flex-wrap gap-x-4 gap-y-1"
      >
        {STEPS.map((step) => {
          const active = step.state === shown;
          return (
            <button
              key={step.state}
              type="button"
              aria-pressed={active}
              onClick={() => go(step.state)}
              className={`flex cursor-pointer items-center gap-1.5 text-[11px] leading-4 font-semibold tracking-[0.12em] uppercase transition-colors ${
                active
                  ? "text-[#1F1F1F]"
                  : "text-[#9B9B9B] hover:text-[#6A6A6A]"
              }`}
            >
              <span
                className="size-1.5 rounded-full transition-opacity"
                style={{ backgroundColor: AGENT, opacity: active ? 1 : 0 }}
              />
              {step.label}
            </button>
          );
        })}
      </div>

      {/* One height for every state: the arriving card's. */}
      <div className="grid min-h-[163px] items-start">
        <AnimatePresence mode="popLayout" initial={false}>
          {live && (
            <motion.div
              key="item"
              layoutId="huddle-item"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: fading ? 0.5 : 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, filter: "blur(2px)" }}
              transition={{ duration: 0.45, ease: EASE }}
              onPointerEnter={() => setHeld(true)}
              onPointerLeave={() => setHeld(false)}
              onFocus={() => setHeld(true)}
              onBlur={() => setHeld(false)}
              className={`flex gap-3.5 rounded-[14px] border border-[#E2E2E2] py-3.5 pr-4 pl-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] [grid-area:1/1] transition-colors duration-500 ${
                fading ? "bg-[#FAFAFA]" : "bg-white"
              }`}
            >
              {/* The timer: orange drains from the top as it fades. */}
              <div className="flex w-[3px] shrink-0 flex-col justify-end overflow-hidden rounded-[2px] bg-[#D6D6D6]">
                <div
                  className="w-full"
                  style={{ height: `${left * 100}%`, backgroundColor: AGENT }}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <div className="flex flex-wrap items-center gap-x-2">
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: AGENT }}
                  />
                  <span className="text-[12px] leading-4 font-medium text-[#1F1F1F]">
                    Heard “the demo date”
                  </span>
                  <span className="text-[12px] leading-4 text-[#6A6A6A]">
                    Checked 2 threads
                  </span>
                </div>
                <p className="text-[14px] leading-5 text-[#1F1F1F]">{TITLE}</p>
                <p className="text-[12px] leading-4 text-[#6A6A6A]">
                  #design › v8 copy · Jane · 2:19 PM
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("pinned")}
                    className="cursor-pointer rounded-[8px] bg-[#111111] px-3.5 py-1.5 text-[12px] leading-4 font-medium text-white transition-colors hover:bg-[#2a2a2a]"
                  >
                    Pin
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("dismissed")}
                    className="cursor-pointer rounded-[8px] border border-[#D6D6D6] bg-white px-3.5 py-1.5 text-[12px] leading-4 font-medium text-[#1F1F1F] transition-colors hover:bg-[#F6F6F6]"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {state === "pinned" && (
            <motion.div
              key="pinned"
              layoutId="huddle-item"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="flex overflow-hidden rounded-[14px] border border-[#CFCFCF] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_18px_rgba(0,0,0,0.05)] [grid-area:1/1]"
            >
              <div
                className="w-[3px] shrink-0"
                style={{ backgroundColor: AGENT }}
              />
              <div className="flex flex-1 flex-col gap-1.5 px-4 py-3.5">
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-[14px] leading-5 font-semibold text-[#111111]">
                    {TITLE}
                  </p>
                  <button
                    type="button"
                    onClick={() => go("arrives")}
                    aria-label="Unpin"
                    className="-m-1 shrink-0 cursor-pointer rounded-[6px] p-1 pt-[7px] transition-colors hover:bg-[#F2F2F2]"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                      <path
                        d="M3.5 3.5l7 7M10.5 3.5l-7 7"
                        fill="none"
                        stroke="#9B9B9B"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-[12px] leading-4 text-[#6A6A6A]">
                  Pinned by John · 2:36 PM · #design › v8 copy
                </p>
                <p className="mt-1.5 text-[12px] leading-4 text-[#9B9B9B]">
                  Stays for everyone until the call ends.
                </p>
              </div>
            </motion.div>
          )}

          {(state === "cleared" || state === "dismissed") && (
            <motion.div
              key="cleared"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="flex h-[163px] flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#D6D6D6] px-6 text-center [grid-area:1/1]"
            >
              <p className="text-[13px] leading-5 text-[#6A6A6A]">
                {state === "dismissed"
                  ? "Dismissed. It won’t come up again this call."
                  : "Nobody pinned it, so it cleared itself."}
              </p>
              <button
                type="button"
                onClick={() => go("arrives")}
                className="cursor-pointer text-[13px] leading-5 font-medium text-[#1F1F1F] underline-offset-2 hover:underline"
              >
                {state === "dismissed" ? "Undo" : "Bring it back"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
