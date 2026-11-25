"use client";

import "@/components/iso/iso.css";
import "../record/record.css";

import * as React from "react";
import { createPortal } from "react-dom";

import { consoleArtProps } from "../record/art";
import { RecordLive } from "../record/live";
import type { SpecimenSlots } from "./types";

/**
 * The record console, small. Its crate is its control, so the dock only
 * carries a hint. It plays silently here; the music lives on its lab page.
 */
export default function RecordSpecimen({ figure, dock }: SpecimenSlots) {
  // Built here rather than on the server, so the landing only pays for the
  // drawing once someone asks for it.
  const art = React.useMemo(() => consoleArtProps(), []);
  return (
    <>
      {createPortal(
        <div className="iso w-[340px] max-w-[calc(100vw-32px)]" data-theme="light">
          <RecordLive {...art} />
        </div>,
        figure,
      )}
      {createPortal(
        <p className="text-ink/45 pb-3 font-mono text-[11px] tracking-[0.06em] uppercase">Click a record to play it</p>,
        dock,
      )}
    </>
  );
}
