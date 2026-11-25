"use client";

import {
  AnimatePresence,
  motion,
  Reorder,
  useDragControls,
  useReducedMotion,
} from "motion/react";
import { useState } from "react";

import { VOXEL_ICONS as ICONS, voxelFont } from "./voxel";

/** A run of the prompt: plain words, or an EMR variable shown as a chip. */
type Part = string | { variable: string };

type Step = {
  id: string;
  icon: string;
  name: string;
  /** The block type, as a chip beside the name. End call has none. */
  kind?: string;
  field: { label: string; prompt: Part[] };
};

// The first step is as designed. The other three are hidden in the frame
// (collapsed), so their contents are written to match.
const STEPS: Step[] = [
  {
    id: "confirm",
    icon: "message-20",
    name: "Confirm appointment",
    kind: "Script",
    field: {
      label: "What the agent says",
      prompt: [
        "Inform the patient of their",
        { variable: "Appointment date" },
        "and confirm if this appointment still works for them.",
      ],
    },
  },
  {
    id: "offer",
    icon: "message-20",
    name: "Offer another time",
    kind: "Script",
    field: {
      label: "What the agent says",
      prompt: [
        "If it doesn’t, offer the next opening on",
        { variable: "Next available" },
        "and book the time they choose.",
      ],
    },
  },
  {
    id: "parking",
    icon: "sparkles-20",
    name: "Answer parking questions",
    kind: "Handle a topic",
    field: {
      label: "The agent’s goal",
      prompt: [
        "Help the patient find parking near",
        { variable: "Clinic address" },
        "and answer any questions about it.",
      ],
    },
  },
  {
    id: "end",
    icon: "phone-missed-20",
    name: "End call",
    field: {
      label: "What the agent says",
      prompt: ["Thank the patient for their time and say goodbye."],
    },
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The call script from Voxel's agent builder (Figma "Voxel Design Files",
 * node 617:2), live: each step opens to show what the agent does, steps
 * drag by their grip to reorder, and the trash removes one, with a way to
 * add it back. One step is open at a time, so the flow stays readable top
 * to bottom.
 */
export function VoxelCallScript() {
  const [steps, setSteps] = useState(STEPS);
  const [open, setOpen] = useState<string | null>("confirm");
  const [removed, setRemoved] = useState<Step[]>([]);

  const remove = (step: Step) => {
    setSteps((s) => s.filter((x) => x.id !== step.id));
    setRemoved((r) => [...r, step]);
  };

  // Put the last removed step back after the step it originally followed
  // (wherever that is now), or first if none of those are left.
  const restore = () => {
    const step = removed.at(-1);
    if (!step) return;
    setRemoved((r) => r.slice(0, -1));
    setSteps((s) => {
      const before = STEPS.slice(0, STEPS.indexOf(step)).reverse();
      const anchor = before.find((x) => s.includes(x));
      const at = anchor ? s.indexOf(anchor) + 1 : 0;
      return [...s.slice(0, at), step, ...s.slice(at)];
    });
  };

  const last = removed.at(-1);

  return (
    <div
      className={`${voxelFont.className} mx-auto flex w-full max-w-[505px] flex-col gap-4 text-left text-[#18262c]`}
    >
      <Reorder.Group
        axis="y"
        values={steps}
        onReorder={setSteps}
        className="flex flex-col gap-4"
      >
        <AnimatePresence initial={false}>
          {steps.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              open={open === step.id}
              onToggle={() => setOpen(open === step.id ? null : step.id)}
              onRemove={() => remove(step)}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>

      <AnimatePresence initial={false}>
        {last && (
          <motion.button
            key="restore"
            type="button"
            onClick={restore}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="cursor-pointer overflow-hidden rounded-[12px] border border-dashed border-[#c5ced5] text-[14px] text-[#5c6f7c] transition-colors hover:border-[#5c6f7c] hover:text-[#18262c]"
          >
            <span className="block py-3">+ Add back “{last.name}”</span>
          </motion.button>
        )}
      </AnimatePresence>

      <p className="text-[14px] text-[#5c6f7c]">
        If the agent can’t help, it transfers the call to your front desk.
      </p>
    </div>
  );
}

function StepCard({
  step,
  open,
  onToggle,
  onRemove,
}: {
  step: Step;
  open: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const controls = useDragControls();
  const reduceMotion = useReducedMotion();
  const panel = `step-${step.id}`;

  return (
    <Reorder.Item
      value={step}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: reduceMotion ? 0 : 0.25, ease: EASE }}
      whileDrag={{ scale: 1.02, boxShadow: "0 8px 20px rgba(15,23,41,0.12)" }}
      className="overflow-hidden rounded-[12px] border border-[#dde3e7] bg-white px-5 shadow-[0_1px_2px_rgba(15,23,41,0.05)] max-sm:px-4"
    >
      <div className="flex items-center gap-2 py-4">
        <span
          aria-hidden
          onPointerDown={(e) => controls.start(e)}
          className="-m-2 shrink-0 cursor-grab touch-none p-2 active:cursor-grabbing"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${ICONS}/grip.svg`}
            alt=""
            width={16}
            height={16}
            draggable={false}
            className="block"
          />
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panel}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${ICONS}/${step.icon}.svg`}
            alt=""
            width={20}
            height={20}
            draggable={false}
            className="shrink-0"
          />
          <span className="truncate text-[16px] font-medium">{step.name}</span>
          {step.kind && (
            <span className="shrink-0 rounded-[6px] bg-[#eff1f2] px-2 py-0.5 text-[14px] whitespace-nowrap text-[#5c6f7c] max-sm:hidden">
              {step.kind}
            </span>
          )}
          <span className="flex-1" />
        </button>
        <div className="flex shrink-0 items-center gap-4 max-sm:gap-1">
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${step.name}`}
            className="flex size-[30px] cursor-pointer items-center justify-center rounded-[6px] transition-colors hover:bg-[#eff1f2]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${ICONS}/trash.svg`} alt="" width={16} height={16} />
          </button>
          <button
            type="button"
            onClick={onToggle}
            tabIndex={-1}
            aria-hidden
            className="flex size-[30px] cursor-pointer items-center justify-center rounded-[6px] transition-colors hover:bg-[#eff1f2]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${ICONS}/chevron-right.svg`}
              alt=""
              width={16}
              height={16}
              className={`transition-transform duration-300 ${open ? "rotate-90" : ""}`}
            />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panel}
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.35, ease: EASE }}
          >
            <div className="flex flex-col gap-2 pt-1 pb-5">
              <p className="text-[14px] font-medium">{step.field.label}</p>
              <p className="min-h-[96px] rounded-[8px] border border-[#dde3e7] px-4 py-2 text-[16px] leading-[2]">
                {step.field.prompt.map((part, i) =>
                  typeof part === "string" ? (
                    <span key={i}>{part} </span>
                  ) : (
                    <span
                      key={i}
                      className="mr-1 inline-flex items-center gap-2 rounded-[6px] bg-[#e6eef1] px-2 py-0.5 align-middle leading-normal whitespace-nowrap text-[#264653]"
                    >
                      <span className="text-[12px]">{"<>"}</span>
                      <span className="text-[14px] font-medium">
                        {part.variable}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${ICONS}/x.svg`}
                        alt=""
                        width={14}
                        height={14}
                        className="ml-4"
                      />
                    </span>
                  ),
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}
