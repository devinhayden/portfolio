"use client";

import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import Image from "next/image";
import { Fragment, useEffect, useRef, useState } from "react";

import { AGENT, HUDDLE_ASSETS, huddleFont } from "./huddle";

/** What John says, word by word. The keyword is the agent's cue. */
const WORDS = [
  "Jane,",
  "did",
  "you",
  "get",
  "a",
  "chance",
  "to",
  "look",
  "at",
  "the",
  "daily",
  "report",
  "UI",
  "before",
  "the",
  "demo?",
];
const KEYWORD = new Set([10, 11, 12]);
const FIRST = 10;
const LAST = 12;

/**
 * The beats, in ms. Slow enough to read along: the words arrive at about
 * speaking pace, the agent holds on the keyword, then takes a visible
 * moment to check the threads before the result arrives.
 */
const START = 1000;
const PER_WORD = 320;
const HEARD = START + PER_WORD * WORDS.length + 1200;
const FOUND = HEARD + 3000;

type Phase = "listening" | "checking" | "found";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Decision 01 of the Huddle agent (Paper "Messaging context", node 1BN-0),
 * told as it happens on a call: the agent listens to the live transcript,
 * hears a keyword ("daily report UI"), checks the thread, and surfaces the
 * matching file with the reason it appeared. It plays once, when scrolled
 * into view; Reset replays it. Pin and Dismiss work on the result.
 */
export function HuddleSurface() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("listening");
  const [spoken, setSpoken] = useState(0);
  const [choice, setChoice] = useState<"pinned" | "dismissed" | null>(null);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      // Straight to the outcome, with the whole sentence heard.
      const t = setTimeout(() => {
        setSpoken(WORDS.length);
        setPhase("found");
      }, 0);
      return () => clearTimeout(t);
    }
    const timers = WORDS.map((_, i) =>
      setTimeout(() => setSpoken(i + 1), START + PER_WORD * i),
    );
    timers.push(setTimeout(() => setPhase("checking"), HEARD));
    timers.push(setTimeout(() => setPhase("found"), FOUND));
    return () => timers.forEach(clearTimeout);
  }, [inView, reduceMotion]);

  const heard = spoken > Math.max(...KEYWORD);

  return (
    <div
      ref={ref}
      className={`${huddleFont.className} mx-auto w-full max-w-[392px] rounded-[16px] border border-[#E2E2E2] bg-white p-4 text-left text-[#111111] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]`}
    >
      {/* Header: the agent, and what it's doing right now. */}
      <div className="flex h-5 items-center gap-2">
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: AGENT }}
        >
          <span className="size-2 rounded-full border-[1.5px] border-white" />
        </span>
        <span className="text-[13px] leading-5 font-semibold">Agent</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-1.5 text-[12px] leading-4 text-[#9B9B9B]"
          >
            {phase === "found" ? (
              "2:33 PM"
            ) : phase === "checking" ? (
              <>
                <Spinner /> Checking threads
              </>
            ) : (
              <>
                <Bars /> Listening
              </>
            )}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Both phases share one cell, so the card holds the final height
          the whole time. */}
      <div className="mt-3 grid">
        <AnimatePresence initial={false}>
          {phase !== "found" && (
            <motion.div
              key="live"
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: EASE }}
              className="[grid-area:1/1]"
            >
              <Transcript spoken={spoken} heard={heard} phase={phase} />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          aria-hidden={phase !== "found"}
          initial={false}
          animate={phase === "found" ? "shown" : "hidden"}
          variants={{
            hidden: { opacity: 0, transition: { duration: 0 } },
            shown: {
              opacity: 1,
              transition: {
                duration: 0.2,
                staggerChildren: 0.09,
                delayChildren: 0.2,
              },
            },
          }}
          className={`flex flex-col gap-3 [grid-area:1/1] ${phase === "found" ? "" : "pointer-events-none"}`}
        >
          <Rise className="flex items-center gap-2">
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: AGENT }}
            />
            <span className="text-[13px] leading-5 font-medium text-[#1F1F1F]">
              Heard “Daily report UI”
            </span>
            <span className="text-[13px] leading-5 text-[#6A6A6A]">
              Checked 2 threads
            </span>
          </Rise>

          <div className="grid border-l-2 border-[#D6D6D6] pl-3">
            {/* The item and its "Dismissed" note share one cell, so
                dismissing doesn't change the card's height. */}
            <motion.div
              animate={{
                opacity: choice === "dismissed" ? 0 : 1,
                scale: choice === "dismissed" ? 0.98 : 1,
              }}
              transition={{ duration: 0.25, ease: EASE }}
              inert={choice === "dismissed"}
              className="flex flex-col gap-3 [grid-area:1/1]"
            >
              <Rise>
                <div className="relative aspect-[346/184] w-full overflow-hidden rounded-[10px] border border-[#DADADA] bg-[#EFEFF2]">
                  <Image
                    src={`${HUDDLE_ASSETS}/daily-report.jpg`}
                    alt="The Daily report screen for Westminster Office Campus: weather, labor entries with their hours and status, and a date picker"
                    fill
                    sizes="346px"
                    className="object-cover object-top-left"
                  />
                </div>
              </Rise>
              <Rise className="flex flex-col gap-1">
                <p className="text-[13px] leading-[18px] font-medium text-[#1F1F1F]">
                  Daily report · Westminster Office Campus
                </p>
                <p className="flex flex-wrap items-center text-[12px] leading-4 text-[#6A6A6A]">
                  #design › v8 copy · Jane · 2:19 PM
                  <span className="px-1.5 text-[#9B9B9B]">·</span>
                  <span className="flex items-center gap-1 font-medium text-[#1F1F1F]">
                    Peek
                    <svg width="8" height="5" viewBox="0 0 8 5" aria-hidden>
                      <path
                        d="M1 1L4 4L7 1"
                        fill="none"
                        stroke="#1F1F1F"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </p>
              </Rise>
              <Rise className="flex items-center gap-2">
                <button
                  type="button"
                  tabIndex={phase === "found" ? 0 : -1}
                  onClick={() =>
                    setChoice(choice === "pinned" ? null : "pinned")
                  }
                  className="flex cursor-pointer items-center gap-1.5 rounded-[8px] bg-[#111111] px-3.5 py-1.5 text-[12px] leading-4 font-medium text-white transition-colors hover:bg-[#2a2a2a]"
                >
                  {choice === "pinned" && (
                    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                      <path
                        d="M1.5 5.2L4 7.5L8.5 2.5"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {choice === "pinned" ? "Pinned" : "Pin"}
                </button>
                {choice !== "pinned" && (
                  <button
                    type="button"
                    tabIndex={phase === "found" ? 0 : -1}
                    onClick={() => setChoice("dismissed")}
                    className="cursor-pointer rounded-[8px] border border-[#D6D6D6] bg-white px-3.5 py-1.5 text-[12px] leading-4 font-medium text-[#1F1F1F] transition-colors hover:bg-[#F6F6F6]"
                  >
                    Dismiss
                  </button>
                )}
              </Rise>
            </motion.div>
            <AnimatePresence>
              {choice === "dismissed" && (
                <motion.p
                  key="dismissed"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: 0.1 }}
                  className="flex items-center justify-center gap-2 text-[13px] leading-5 text-[#6A6A6A] [grid-area:1/1]"
                >
                  Dismissed. It won’t come up again this call.
                  <button
                    type="button"
                    onClick={() => setChoice(null)}
                    className="cursor-pointer font-medium text-[#1F1F1F] underline-offset-2 hover:underline"
                  >
                    Undo
                  </button>
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/** One piece of the surfaced item, rising in on its turn. */
function Rise({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        shown: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * The live call, as the agent hears it: who's speaking, their words
 * arriving one at a time, and the keyword lighting up once it's caught.
 */
function Transcript({
  spoken,
  heard,
  phase,
}: {
  spoken: number;
  heard: boolean;
  phase: Phase;
}) {
  return (
    <div className="flex flex-col gap-4 pt-1">
      <div className="flex items-center gap-2">
        <span className="relative size-7 shrink-0 overflow-hidden rounded-full bg-[#ddd]">
          <Image
            src={`${HUDDLE_ASSETS}/john.jpg`}
            alt=""
            fill
            sizes="28px"
            className="object-cover"
          />
        </span>
        <span className="text-[13px] leading-5 font-medium text-[#1F1F1F]">
          John
        </span>
        <span className="text-[12px] leading-4 text-[#9B9B9B]">
          speaking · live transcript
        </span>
      </div>

      <p
        aria-label={WORDS.join(" ")}
        className="min-h-[84px] text-[19px] leading-[28px] tracking-[-0.01em] text-[#1F1F1F]"
      >
        {WORDS.slice(0, spoken).map((word, i) => {
          const key = KEYWORD.has(i);
          return (
            <Fragment key={i}>
              <motion.span
                aria-hidden
                initial={{ opacity: 0, filter: "blur(3px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.25 }}
                className={`transition-colors duration-500 ${
                  key && heard
                    ? `bg-[#FFE7DC] text-[#C2410C] ${i === FIRST ? "rounded-l-[4px] pl-0.5" : ""} ${i === LAST ? "rounded-r-[4px] pr-0.5" : ""}`
                    : ""
                }`}
              >
                {word}
                {/* Inside the keyword the space is highlighted too, so it
                  reads as one phrase; after it, the space is plain. */}
                {i < spoken - 1 && i !== LAST && " "}
              </motion.span>
              {i === LAST && i < spoken - 1 && " "}
            </Fragment>
          );
        })}
        {phase === "listening" && (
          <motion.span
            aria-hidden
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="ml-0.5 inline-block h-[20px] w-[2px] translate-y-[3px] bg-[#1F1F1F]"
          />
        )}
      </p>

      <AnimatePresence>
        {heard && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="flex items-center gap-2 rounded-[10px] border border-[#F2E2DA] bg-[#FFF8F5] px-3 py-2.5 text-[13px] leading-5"
          >
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: AGENT }}
            />
            <span className="font-medium text-[#1F1F1F]">
              Heard “Daily report UI”
            </span>
            <span className="text-[#6A6A6A]">
              {phase === "checking" ? "Checking threads" : "Noted"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "checking" && (
        <div className="flex flex-col gap-1.5">
          <ThreadCheck name="#design › v8 copy" found after={1300} index={0} />
          <ThreadCheck name="#design › weekly sync" after={2100} index={1} />
        </div>
      )}
    </div>
  );
}

/**
 * One thread the agent is searching: a spinner, then whether it matched.
 */
function ThreadCheck({
  name,
  found,
  after,
  index,
}: {
  name: string;
  found?: boolean;
  after: number;
  index: number;
}) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), after);
    return () => clearTimeout(t);
  }, [after]);
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.12, ease: EASE }}
      className="flex items-center justify-between rounded-[8px] px-3 py-1.5 text-[12px] leading-4"
    >
      <span className="text-[#6A6A6A]">{name}</span>
      {done ? (
        <span
          className={found ? "font-medium" : "text-[#9B9B9B]"}
          style={found ? { color: AGENT } : undefined}
        >
          {found ? "1 match" : "No match"}
        </span>
      ) : (
        <Spinner />
      )}
    </motion.div>
  );
}

/** Three bars, rising and falling: the agent is listening. */
function Bars() {
  return (
    <span aria-hidden className="flex h-3 w-[10px] items-center gap-[2px]">
      {[0, 0.2, 0.4].map((delay) => (
        <motion.span
          key={delay}
          initial={{ height: 4 }}
          animate={{ height: [4, 12, 6, 10, 4] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay,
            ease: "easeInOut",
          }}
          className="w-[2px] rounded-full"
          style={{ backgroundColor: AGENT }}
        />
      ))}
    </span>
  );
}

function Spinner() {
  return (
    <svg
      aria-hidden
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      className="animate-spin"
    >
      <circle cx="8" cy="8" r="6" stroke="#E6E6E6" strokeWidth="2" />
      <path
        d="M14 8a6 6 0 0 0-6-6"
        stroke={AGENT}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
