"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { VOXEL_ICONS as ICONS, voxelFont } from "./voxel";

type Variable = { name: string; token: string };
type Group = { id: string; name: string; variables: Variable[] };

// The variables shown in the frame, plus the ones clinics most often need
// on a call. Clinic and Provider are closed in the frame, so theirs are
// written to match (and cover the ones the call-script demo uses).
const GROUPS: Group[] = [
  {
    id: "appointment",
    name: "Appointment",
    variables: [
      { name: "Appointment date", token: "appointment_date" },
      { name: "Appointment time", token: "appointment_time" },
      { name: "Appointment location", token: "appointment_location" },
    ],
  },
  {
    id: "patient",
    name: "Patient",
    variables: [
      { name: "Patient name", token: "patient_name" },
      { name: "Preferred name", token: "preferred_name" },
      { name: "Date of birth", token: "date_of_birth" },
    ],
  },
  {
    id: "clinic",
    name: "Clinic",
    variables: [
      { name: "Clinic name", token: "clinic_name" },
      { name: "Clinic address", token: "clinic_address" },
      { name: "Clinic phone", token: "clinic_phone" },
      { name: "Office hours", token: "office_hours" },
    ],
  },
  {
    id: "provider",
    name: "Provider",
    variables: [
      { name: "Provider name", token: "provider_name" },
      { name: "Provider title", token: "provider_title" },
      { name: "Next available", token: "next_available" },
    ],
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/** How long the pretend sync takes. */
const SYNC_MS = 1800;

/**
 * The EMR variables panel from Voxel's agent builder (Figma "Voxel Design
 * Files", node 603:288), told as a small story: it opens empty, with no EMR
 * connected; "Sync with EMR" loads for a moment, then the variables arrive.
 * (The sync is staged; in the product they're there once the EMR is
 * integrated.) After that it's live: groups open and close, search narrows
 * them (opening any group with a match), and clicking a variable really
 * copies its token, confirming with "Copied" for a moment.
 */
export function VoxelVariables() {
  const [query, setQuery] = useState("");
  // One group open at a time, so the panel keeps one height.
  const [open, setOpen] = useState<string | null>("appointment");
  const [copied, setCopied] = useState<string | null>(null);
  const [sync, setSync] = useState<"idle" | "syncing" | "synced">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const syncTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reduceMotion = useReducedMotion();

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(syncTimer.current);
    },
    [],
  );

  const startSync = () => {
    setSync("syncing");
    syncTimer.current = setTimeout(() => setSync("synced"), SYNC_MS);
  };
  const synced = sync === "synced";

  const q = query.trim().toLowerCase();
  const groups = GROUPS.map((g) => ({
    ...g,
    variables: q
      ? g.variables.filter((v) =>
          `${v.name} ${v.token}`.toLowerCase().includes(q),
        )
      : g.variables,
  })).filter((g) => !q || g.variables.length > 0);

  const toggle = (id: string) => setOpen((o) => (o === id ? null : id));

  const copy = (v: Variable) => {
    navigator.clipboard?.writeText(`{{${v.token}}}`).catch(() => {});
    setCopied(v.token);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div
      className={`${voxelFont.className} mx-auto flex w-full max-w-[513px] flex-col gap-5 rounded-[12px] border border-[#dde3e7] bg-white p-5 text-left text-[#18262c] shadow-[0_1px_2px_rgba(15,23,41,0.05)] max-sm:p-4`}
    >
      <div className="flex flex-col gap-2">
        <label
          className={`flex items-center gap-2 rounded-[8px] border border-[#c5ced5] bg-white p-2 transition-opacity focus-within:border-[#18262c] ${
            synced ? "" : "opacity-50"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${ICONS}/search.svg`} alt="" width={16} height={16} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for variables…"
            aria-label="Search variables"
            disabled={!synced}
            className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[#5c6f7c] disabled:cursor-not-allowed [&::-webkit-search-cancel-button]:hidden"
          />
        </label>
        <p
          aria-live="polite"
          className="text-[14px] text-[#5c6f7c] max-sm:min-h-[2lh]"
        >
          {synced
            ? "Click to copy. Paste anywhere in your call script."
            : sync === "syncing"
              ? "Pulling fields from your EMR…"
              : "No EMR connected yet."}
        </p>
      </div>

      {/* A fixed height for every state, sized to the tallest open group, so
          the demo never changes size. Search can open several groups at
          once; past that height, the list scrolls. */}
      <div className="h-[344px] overflow-y-auto overscroll-contain">
        {sync === "idle" && <Empty onSync={startSync} />}
        {sync === "syncing" && <Loading />}

        {synced && (
          <div className="flex flex-col gap-5">
            {groups.map((group, gi) => {
              // A search shows every group with a match, open.
              const isOpen = q ? true : open === group.id;
              return (
                <motion.section
                  key={group.id}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    ease: EASE,
                    // Arriving one group after another, as if streamed in.
                    delay: q ? 0 : gi * 0.08,
                  }}
                  className="flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => toggle(group.id)}
                    disabled={!!q}
                    aria-expanded={isOpen}
                    className="flex cursor-pointer items-center gap-2 self-start text-[14px] font-medium disabled:cursor-default"
                  >
                    {group.name}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${ICONS}/chevron-right.svg`}
                      alt=""
                      width={16}
                      height={16}
                      className={`transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.ul
                        key="list"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.3,
                          ease: EASE,
                        }}
                        className="overflow-hidden"
                      >
                        {group.variables.map((v) => {
                          const done = copied === v.token;
                          return (
                            <li key={v.token} className="pt-2">
                              <button
                                type="button"
                                onClick={() => copy(v)}
                                aria-label={`Copy ${v.name}`}
                                className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-[8px] border border-[#dde3e7] px-3 py-2 text-left transition-colors hover:bg-[#f8f8f9] ${
                                  done ? "bg-[#f8f8f9]" : "bg-white"
                                }`}
                              >
                                <span className="truncate text-[16px]">
                                  {v.name}
                                </span>
                                <span
                                  aria-live="polite"
                                  className="flex shrink-0 items-center gap-3"
                                >
                                  {done ? (
                                    <span className="text-[14px] font-medium text-[#264653]">
                                      Copied
                                    </span>
                                  ) : (
                                    <span className="font-mono text-[14px] text-[#5c6f7c] max-sm:hidden">
                                      {`{{${v.token}}}`}
                                    </span>
                                  )}
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`${ICONS}/${done ? "check" : "copy"}.svg`}
                                    alt=""
                                    width={16}
                                    height={16}
                                  />
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </motion.section>
              );
            })}
            {groups.length === 0 && (
              <p className="py-6 text-center text-[14px] text-[#5c6f7c]">
                No variables match “{query.trim()}”.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Before the sync: nothing to show yet, and the one thing to do. */
function Empty({ onSync }: { onSync: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-[8px] border border-dashed border-[#c5ced5] px-6 text-center">
      <div className="flex flex-col gap-1">
        <p className="text-[16px] font-medium">No variables yet</p>
        <p className="text-[14px] text-balance text-[#5c6f7c]">
          Sync with your clinic’s EMR to pull in appointment, patient and
          provider details.
        </p>
      </div>
      <button
        type="button"
        onClick={onSync}
        className="cursor-pointer rounded-[8px] bg-[#264653] px-4 py-2 text-[16px] font-medium text-white transition-colors hover:bg-[#1c3640]"
      >
        Sync with EMR
      </button>
    </div>
  );
}

/** During the sync: the shape of what's coming, pulsing. */
function Loading() {
  return (
    <div aria-hidden className="flex flex-col gap-5">
      {[3, 0, 0, 0].map((rows, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-[18px] w-24 animate-pulse rounded-[4px] bg-[#eff1f2]" />
          {Array.from({ length: rows }, (_, j) => (
            <div
              key={j}
              className="flex h-[42px] items-center justify-between rounded-[8px] border border-[#dde3e7] px-3"
            >
              <div className="h-3 w-36 animate-pulse rounded-[4px] bg-[#eff1f2]" />
              <div className="h-3 w-20 animate-pulse rounded-[4px] bg-[#eff1f2]" />
            </div>
          ))}
        </div>
      ))}
      <div className="flex items-center justify-center gap-2 text-[14px] text-[#5c6f7c]">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="animate-spin motion-reduce:animate-none"
        >
          <circle cx="8" cy="8" r="6.25" stroke="#dde3e7" strokeWidth="1.5" />
          <path
            d="M14.25 8A6.25 6.25 0 0 0 8 1.75"
            stroke="#264653"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Syncing with EMR
      </div>
    </div>
  );
}
