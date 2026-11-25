"use client";

import "@/components/iso/iso.css";
import "@/components/lab/record/record.css";

import { useMemo } from "react";

import { consoleArtProps } from "@/components/lab/record/art";
import { RecordLive } from "@/components/lab/record/live";

/**
 * The record console, in a card. It plays silently here; the music lives on
 * its lab page.
 */
export default function RecordCover() {
  // Drawn on the client, so the writing index never pays for it.
  const art = useMemo(() => consoleArtProps(), []);
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="iso w-[500px] max-w-full" data-theme="light">
        <RecordLive {...art} />
      </div>
    </div>
  );
}
