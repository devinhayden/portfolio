"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import { EXPERIMENTS, type ExperimentKey } from "@/components/lab/experiments";

type Props = {
  open: boolean;
  current: ExperimentKey;
  onChoose: (key: ExperimentKey) => void;
  onClose: () => void;
};

/**
 * The list of experiments, over a softened page: a small white card with a
 * picture, a name and a number for each, the one on show marked. Choosing one
 * closes the card. A native dialog, so focus, Escape and the backdrop come
 * with it.
 */
export function ExperimentsMenu({ open, current, onChoose, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return;
    // The page scrolls into the case studies, so it holds still while the list is up.
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = before;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Experiments"
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog itself, outside its box.
        const box = event.currentTarget.getBoundingClientRect();
        const outside =
          event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
        if (event.target === event.currentTarget && outside) onClose();
      }}
      className="text-ink m-auto w-[480px] max-w-[calc(100vw-32px)] scale-[0.98] rounded-[18px] bg-white p-4 pt-5 opacity-0 shadow-[0_16px_48px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.05)] transition-[opacity,scale,overlay,display] transition-discrete duration-200 ease-out backdrop:bg-white/70 backdrop:backdrop-blur-[10px] backdrop:transition-[opacity,overlay,display] backdrop:transition-discrete backdrop:duration-200 open:scale-100 open:opacity-100 starting:open:scale-[0.98] starting:open:opacity-0 motion-reduce:transition-none"
    >
      <div className="flex items-center justify-between px-2 pb-3 font-mono text-[11px] tracking-[0.04em] uppercase">
        <h2>Experiments</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-ink/35 hover:text-ink rounded-sm uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Esc
        </button>
      </div>
      <ul className="flex flex-col gap-1">
        {EXPERIMENTS.map((experiment, index) => {
          const on = experiment.key === current;
          return (
            <li key={experiment.key}>
              <button
                type="button"
                autoFocus={on}
                aria-current={on || undefined}
                onClick={() => onChoose(experiment.key)}
                className="hover:bg-paper focus-visible:bg-paper flex w-full items-center gap-[18px] rounded-xl p-2 text-left transition-colors outline-none"
              >
                <span className="bg-paper relative block h-16 w-[84px] shrink-0 overflow-hidden rounded-lg">
                  <Image src={experiment.thumb} alt="" fill sizes="84px" className="object-contain p-1" />
                </span>
                <span className="flex-1 font-serif text-[22px] leading-tight tracking-[-0.02em]">
                  {experiment.name}
                </span>
                <span
                  className={`flex items-center gap-3 font-mono text-[11px] tracking-[0.04em] ${on ? "text-ink" : "text-ink/35"}`}
                >
                  {on && <span aria-hidden className="bg-ink block size-2 rounded-full" />}
                  {String(index + 1).padStart(2, "0")}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </dialog>
  );
}
