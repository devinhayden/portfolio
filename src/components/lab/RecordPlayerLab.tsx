"use client";

import "@/components/iso/iso.css";
import "./record/record.css";

import * as React from "react";

import { Plate } from "@/components/iso/react/draw";

import type { ConsoleArt } from "./record/art";
import { RecordLive } from "./record/live";
import { GROOVE_PITCH } from "./record/model";
import { LEAD_IN, RUN_OUT } from "./record/view";
import { RECORDS } from "./records";
import { SpotifyPlayer, type SpotifyPlayerHandle } from "./SpotifyPlayer";

const CAPTION = `A belt-drive turntable at 33⅓ rpm with a 9″ arm. The stylus lands in the lead-in groove ${LEAD_IN} mm from the spindle and tracks inward ${GROOVE_PITCH.toFixed(2)} mm a turn, toward the run-out at ${RUN_OUT} mm. The platter reaches speed in about 2.7 s; a real one coasts for half a minute when it stops, so this one is braked to a stop in about 3 s.`;

/**
 * A bench for the record console, with a Spotify player under it. Picking a
 * record loads its album; the music starts when the needle lands and stops
 * when it lifts. The drawing is built on the server and handed in as `art`.
 */
export function RecordPlayerLab({ art }: { art: ConsoleArt }) {
  const player = React.useRef<SpotifyPlayerHandle>(null);
  /** While a record plays, the next album waits until the needle lifts. */
  const playing = React.useRef(false);

  return (
    <main className="iso min-h-screen bg-white px-4 py-10 sm:py-16" data-theme="light">
      <div className="mx-auto w-full max-w-[760px]">
        <Plate fig="Fig 1" title="Record console" hint="Hover the crate. Click a record to play it." readout="Pick a record" caption={CAPTION}>
          <RecordLive
            {...art}
            onSelect={(album) => {
              if (!playing.current) player.current?.load(album.spotifyUri);
            }}
            onNeedleDown={(album) => {
              playing.current = true;
              player.current?.play(album.spotifyUri);
            }}
            onNeedleUp={() => {
              playing.current = false;
              player.current?.pause();
            }}
          />
        </Plate>
        <SpotifyPlayer ref={player} initialUri={RECORDS[0]!.spotifyUri} className="mt-6" />
      </div>
    </main>
  );
}
