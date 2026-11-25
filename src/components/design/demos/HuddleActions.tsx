"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { AGENT, HUDDLE_ASSETS, huddleFont } from "./huddle";

type Action = "screenshot" | "questions" | "find";

const ACTIONS: { id: Action; label: string; icon: React.ReactNode }[] = [
  {
    id: "screenshot",
    label: "Show a screenshot",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2.5" />
        <circle cx="9" cy="10" r="1.8" />
        <path d="M4 18l5.5-5.5 4 4 3-3L21 18" />
      </>
    ),
  },
  {
    id: "questions",
    label: "Open questions",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.6 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.8M12 17h.01" />
      </>
    ),
  },
  {
    id: "find",
    label: "Find a message",
    icon: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5L20 20" />
      </>
    ),
  },
];

/** How long the agent takes to look, in ms. */
const LOOK = 900;

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Decision 03 of the Huddle agent (Paper "Messaging context", node 18J-0):
 * the agent's control panel. It does three things, and only when asked;
 * each chip runs one and shows its result in a fixed slot below. The
 * switch pauses it outright, as in the frame's Paused state. The results'
 * content is written to match the rest of the call.
 */
export function HuddleActions() {
  const [on, setOn] = useState(true);
  const [asked, setAsked] = useState<Action | null>(null);
  const [looking, setLooking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reduceMotion = useReducedMotion();

  useEffect(() => () => clearTimeout(timer.current), []);

  const ask = (action: Action) => {
    clearTimeout(timer.current);
    setAsked(action);
    setLooking(true);
    timer.current = setTimeout(
      () => setLooking(false),
      reduceMotion ? 0 : LOOK,
    );
  };

  const toggle = () => {
    clearTimeout(timer.current);
    setOn((v) => !v);
    setAsked(null);
    setLooking(false);
  };

  return (
    // Holds the listening panel's height, so pausing doesn't move the page.
    <div
      className={`${huddleFont.className} mx-auto flex min-h-[392px] w-full max-w-[392px] flex-col justify-center text-left`}
    >
      <motion.div
        layout
        transition={{ duration: 0.4, ease: EASE }}
        className={`overflow-hidden rounded-[16px] border border-[#E2E2E2] transition-[background-color,box-shadow] duration-300 ${
          on
            ? "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]"
            : "bg-[#F6F6F6] shadow-none"
        }`}
      >
        {/* Header: the agent and its switch. */}
        <motion.div
          layout="position"
          className="flex items-center px-[18px] pt-4 pb-2.5"
        >
          <span
            className={`text-[15px] leading-[22px] font-semibold transition-colors ${on ? "text-[#111111]" : "text-[#6A6A6A]"}`}
          >
            Agent
          </span>
          <span className="flex-1" />
          <span
            className={`mr-2.5 text-[13px] leading-[18px] font-medium transition-colors ${on ? "text-[#1F1F1F]" : "text-[#6A6A6A]"}`}
          >
            {on ? "Listening" : "Paused"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label="Agent listening"
            onClick={toggle}
            className={`flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-300 ${on ? "justify-end" : "justify-start"}`}
            style={{ backgroundColor: on ? AGENT : "#D0D0D0" }}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 600, damping: 35 }}
              className="size-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
            />
          </button>
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          {on ? (
            <motion.div
              key="on"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <div className="flex items-start gap-2 px-[18px] pb-4">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="mt-px shrink-0"
                  fill="none"
                  stroke="#6A6A6A"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="8.5" r="3" />
                  <path d="M3.5 19c.5-3 2.8-4.5 5.5-4.5s5 1.5 5.5 4.5" />
                  <path d="M16 5.8a3 3 0 0 1 0 5.4M17.5 14.8c1.9.5 3 2 3.3 4.2" />
                </svg>
                <p className="text-[12px] leading-4 text-[#6A6A6A]">
                  Everyone on this call can see this · cleared when the call
                  ends
                </p>
              </div>
              <div className="h-px bg-[#EEEEEE]" />
              <div className="flex flex-col gap-2.5 px-[18px] pt-3.5 pb-[18px]">
                <p className="text-[11px] leading-4 font-semibold tracking-[0.12em] text-[#9B9B9B] uppercase">
                  Ask for
                </p>
                <div className="flex flex-wrap gap-2">
                  {ACTIONS.map((action) => {
                    const active = asked === action.id;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => ask(action.id)}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-full border py-[7px] pr-3 pl-2.5 text-[13px] leading-[18px] font-medium transition-colors ${
                          active
                            ? "border-[#111111] bg-[#111111] text-white"
                            : "border-[#D6D6D6] bg-white text-[#1F1F1F] hover:bg-[#F6F6F6]"
                        }`}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          aria-hidden
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0"
                        >
                          {action.icon}
                        </svg>
                        {action.label}
                      </button>
                    );
                  })}
                </div>

                {/* The answer, in one fixed slot. */}
                <div
                  aria-live="polite"
                  className="mt-1.5 h-[132px] overflow-hidden rounded-[12px] bg-[#F7F7F7]"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={looking ? "looking" : (asked ?? "idle")}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.25, ease: EASE }}
                      className="h-full"
                    >
                      <Result asked={asked} looking={looking} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="off"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="px-[18px] pb-4 text-[12px] leading-4 text-[#9B9B9B]"
            >
              Not listening. Nothing new appears until it’s back on.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/** What fills the slot: a prompt, the agent looking, or what it found. */
function Result({
  asked,
  looking,
}: {
  asked: Action | null;
  looking: boolean;
}) {
  if (!asked) {
    return (
      <p className="flex h-full items-center justify-center px-6 text-center text-[12px] leading-4 text-[#9B9B9B]">
        The agent only does these three things, and only when asked.
      </p>
    );
  }
  if (looking) {
    return (
      <p className="flex h-full items-center justify-center gap-2 text-[12px] leading-4 text-[#6A6A6A]">
        <svg
          aria-hidden
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          className="animate-spin"
        >
          <circle cx="8" cy="8" r="6" stroke="#E2E2E2" strokeWidth="2" />
          <path
            d="M14 8a6 6 0 0 0-6-6"
            stroke={AGENT}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        Looking through #design › v8 copy
      </p>
    );
  }
  if (asked === "screenshot") {
    return (
      <div className="flex h-full gap-3 p-3">
        <div className="relative h-full w-[150px] shrink-0 overflow-hidden rounded-[8px] border border-[#DADADA] bg-white">
          <Image
            src={`${HUDDLE_ASSETS}/daily-report.jpg`}
            alt="The Daily report screen for Westminster Office Campus"
            fill
            sizes="150px"
            className="object-cover object-top-left"
          />
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-1">
          <p className="text-[13px] leading-[18px] font-medium text-[#1F1F1F]">
            Latest screenshot
          </p>
          <p className="text-[12px] leading-4 text-[#6A6A6A]">
            Daily report · Westminster Office Campus
          </p>
          <p className="text-[12px] leading-4 text-[#9B9B9B]">Jane · 2:19 PM</p>
        </div>
      </div>
    );
  }
  if (asked === "questions") {
    return (
      <ul className="flex h-full flex-col justify-center gap-2.5 px-4">
        {[
          ["Who signs off on the v8 copy before the 21st?", "Jane · 2:12 PM"],
          ["Does the demo move again if review slips?", "John · 2:24 PM"],
        ].map(([q, who]) => (
          <li key={q} className="flex gap-2">
            <span
              className="mt-[6px] size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: AGENT }}
            />
            <span className="flex flex-col">
              <span className="text-[13px] leading-[18px] text-[#1F1F1F]">
                {q}
              </span>
              <span className="text-[12px] leading-4 text-[#9B9B9B]">
                {who} · no reply yet
              </span>
            </span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="flex h-full flex-col justify-center gap-2 px-4">
      <p className="text-[12px] leading-4 text-[#9B9B9B]">
        Heard “the demo date”, so searched for that
      </p>
      <div className="rounded-[10px] border border-[#E2E2E2] bg-white px-3 py-2.5">
        <p className="text-[13px] leading-[18px] text-[#1F1F1F]">
          Demo moved from Oct 14 to Oct 21, pending copy review.
        </p>
        <p className="mt-1 text-[12px] leading-4 text-[#6A6A6A]">
          #design › v8 copy · Jane · 2:19 PM
        </p>
      </div>
    </div>
  );
}
