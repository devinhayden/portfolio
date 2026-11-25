import * as React from "react";

import { Dots, Line, Solid } from "@/components/iso/react/draw";

import { RECORDS } from "../records";
import {
  ARM_BASE,
  BRUSH_ART,
  CONSOLE,
  CONTROLS,
  COVER_ART,
  DRIVE,
  PLATTER,
  PLINTH_ART,
  RACK,
  SLEEVES,
} from "./geometry";
import { COUNT, SLEEVE, slotOf } from "./view";

/**
 * The static drawing, built on the server and handed to the live component
 * as elements, in painter's order. Every root carries a key (see the kit's
 * react.md on large payloads).
 */

export interface ConsoleArt {
  /** The rack's opening swept up the screen: what can show of anything in it. */
  sweep: string;
  /** The console and the rack's well, behind everything in it. */
  console: React.ReactNode;
  /** Per slot, back to front: the fin in front of it, the sleeve's back and front. */
  fins: React.ReactNode[];
  sleeveBacks: React.ReactNode[];
  sleeveFronts: React.ReactNode[];
  /** The brush, plinth, dust cover, drive and platter. */
  turntable: React.ReactNode;
  mat: React.ReactNode;
  spindle: React.ReactNode;
  controls: React.ReactNode;
  armBase: React.ReactNode;
  liftBar: React.ReactNode;
}

function consoleArt() {
  return (
    <g key="console">
      <path className="iso-halo" d={CONSOLE.halo} />
      {CONSOLE.feet.map((foot, index) => (
        <g key={index}>
          <Solid paths={foot.cap} tone="mid" crease="faint" className="rc-brass" />
          <Solid paths={foot.leg} tone="mid" crease="none" className="rc-walnut" inner={<Line d={foot.seam} tone="faint" />} />
          <Solid paths={foot.plate} tone="mid" crease="faint" className="rc-brass" />
        </g>
      ))}
      <g className="rc-oak">
        <Solid paths={CONSOLE.carcass} tone="mid" crease="faint" inner={<Line d={CONSOLE.carcassSeam} tone="faint" />} />
        <Line d={CONSOLE.joint} tone="faint" />
        <Line d={CONSOLE.doors} tone="mid" />
        <Line d={CONSOLE.doorInsets} tone="lo" />
        <Line d={CONSOLE.endFrame} tone="lo" />
        <Line d={CONSOLE.endInset} tone="lo" />
      </g>
      <g className="rc-brass">
        {CONSOLE.pulls.map((paths, index) => (
          <Solid key={index} paths={paths} tone="mid" crease="faint" />
        ))}
        <Solid paths={CONSOLE.plate} tone="mid" crease="faint" />
        <Line d={CONSOLE.plateRules} tone="mid" free />
        <Dots points={CONSOLE.platePins} size={0.55} tone="mid" />
      </g>
      <g className="rc-oak">
        <Solid paths={CONSOLE.top} tone="mid" crease="faint" inner={<Line d={CONSOLE.lipping} tone="faint" />} />
        <Line d={CONSOLE.seams} tone="faint" />
      </g>

      <clipPath id="rc-opening">
        <path d={RACK.opening} />
      </clipPath>
      <g className="rc-well rc-oak-shadow" clipPath="url(#rc-opening)">
        <path className="rc-well-fill" d={RACK.opening} />
        <path className="iso-shade" data-shade="1" d={RACK.floor} />
        <path className="iso-shade" data-shade="0" d={RACK.back} />
        <path className="iso-shade" data-shade="2" d={RACK.left} />
        <Line d={RACK.corner} tone="lo" />
        <Line d={RACK.joins} tone="lo" />
        {RACK.felt.map((paths, index) => (
          <Solid key={index} paths={paths} tone="lo" crease="faint" />
        ))}
      </g>
      <g className="rc-oak">
        <Line d={RACK.opening} tone="mid" />
      </g>
    </g>
  );
}

function finArt(slot: number) {
  return (
    <g key={`fin-${slot}`} clipPath="url(#rc-sweep)">
      <Solid paths={RACK.fins[slot]!} tone="mid" crease="faint" className="rc-oak" />
    </g>
  );
}

function sleeveBackArt(index: number) {
  const sleeve = SLEEVES[index]!;
  return (
    <g key={`back-${index}`} className="rc-card">
      <Solid paths={sleeve.back} tone="mid" crease="none" />
      <path className="rc-slit" d={sleeve.slit} />
    </g>
  );
}

function sleeveFrontArt(index: number) {
  const sleeve = SLEEVES[index]!;
  const album = RECORDS[index]!;
  const clip = `rc-cover-${index}`;
  return (
    <g key={`front-${index}`} className="rc-card">
      <Solid paths={sleeve.front} tone="mid" crease="faint" className="rc-panel" />
      <g transform={sleeve.cover}>
        <clipPath id={clip}>
          <rect width={SLEEVE} height={SLEEVE} />
        </clipPath>
        <g clipPath={`url(#${clip})`}>
          <rect className="rc-cover" width={SLEEVE} height={SLEEVE} fill={album.color} />
          {album.cover ? (
            <image href={album.cover} width={SLEEVE} height={SLEEVE} preserveAspectRatio="xMidYMid slice" />
          ) : null}
          <rect className="rc-cover-light" width={SLEEVE} height={SLEEVE} />
        </g>
      </g>
      <Solid paths={sleeve.top} tone="mid" crease="none" />
      <path className="iso-line iso-edge rc-cover-edge" data-tone="mid" d={sleeve.front.outline} />
    </g>
  );
}

function turntableArt() {
  return (
    <g key="turntable">
      <path className="iso-halo" d={BRUSH_ART.body.fill} />
      <g className="rc-black">
        <Solid paths={BRUSH_ART.pad} tone="mid" crease="none" className="rc-felt" />
        <Solid paths={BRUSH_ART.body} tone="mid" crease="faint" />
        <Line d={BRUSH_ART.grip} tone="lo" />
      </g>

      <path className="iso-halo" d={PLINTH_ART.halo} />
      {PLINTH_ART.feet.map((foot, index) => (
        <g key={index}>
          <Solid paths={foot.ring} tone="mid" crease="faint" className="rc-black" />
          <Solid paths={foot.foot} tone="mid" crease="faint" className="rc-chrome" inner={<Line d={foot.seam} tone="faint" />} />
        </g>
      ))}
      <Solid paths={PLINTH_ART.body} tone="mid" crease="faint" className="rc-walnut" inner={<Line d={PLINTH_ART.bodySeam} tone="faint" />} />
      <g className="rc-brass">
        <Solid paths={PLINTH_ART.badge} tone="mid" crease="faint" />
        <Line d={PLINTH_ART.badgeRules} tone="mid" free />
      </g>
      <g className="rc-alu">
        <Solid paths={PLINTH_ART.deck} tone="mid" crease="faint" />
        <Line d={PLINTH_ART.deckGroove} tone="faint" />
        <Line d={PLINTH_ART.deckScrewRings} tone="lo" />
        <Dots points={PLINTH_ART.deckScrews} size={0.5} tone="mid" />
      </g>

      {COVER_ART.hinges.map((paths, index) => (
        <Solid key={index} paths={paths} tone="mid" crease="faint" className="rc-chrome" />
      ))}
      <g className="rc-glass">
        {COVER_ART.panes.map((d, index) => (
          <path key={index} className="rc-pane" d={d} />
        ))}
        <Line d={COVER_ART.edges} tone="faint" />
        <Line d={COVER_ART.lid} tone="lo" />
        <Line d={COVER_ART.rim} tone="mid" />
        <path className="rc-shine" d={COVER_ART.shine} />
        <path className="rc-shine" data-thin="" d={COVER_ART.shineThin} />
      </g>
      <Line d={COVER_ART.hingePins} tone="lo" />

      <g className="rc-black">
        <Solid paths={DRIVE.pod} tone="mid" crease="faint" />
        <Dots points={DRIVE.podScrews} size={0.5} tone="lo" />
        <Line d={DRIVE.belt} tone="mid" />
      </g>
      <g className="rc-chrome">
        <Solid paths={DRIVE.pulley} tone="mid" crease="faint" inner={<Line d={DRIVE.pulleyBelt} tone="hi" />} />
        <Solid paths={DRIVE.step} tone="mid" crease="faint" />
        <Solid paths={DRIVE.collar} tone="mid" crease="faint" />
      </g>

      <Solid paths={PLATTER.body} tone="mid" crease="faint" className="rc-alu" inner={<Line d={PLATTER.strobeSeams} tone="faint" />} />
    </g>
  );
}

function matArt() {
  return (
    <g key="mat" className="rc-felt">
      <Solid paths={PLATTER.mat} tone="mid" crease="none" className="rc-felt" />
      <Line d={PLATTER.matRing} tone="faint" />
    </g>
  );
}

function spindleArt() {
  return (
    <g key="spindle" className="rc-chrome">
      <Solid paths={PLATTER.spindle} tone="mid" crease="none" />
      <Solid paths={PLATTER.spindleTip} tone="mid" crease="none" />
    </g>
  );
}

function controlsArt() {
  return (
    <g key="controls">
      <g className="rc-alu">
        <Line d={CONTROLS.knobRing} tone="lo" />
        <Dots points={CONTROLS.speedMarks} size={0.7} tone="mid" />
        <Line d={CONTROLS.powerRing} tone="lo" />
      </g>
      <g className="rc-chrome">
        <Solid paths={CONTROLS.knob} tone="mid" crease="faint" inner={<Line d={CONTROLS.knobKnurl} tone="faint" />} />
        <Line d={CONTROLS.knobPointer} tone="hi" />
        <Solid paths={CONTROLS.power} tone="mid" crease="faint" />
      </g>
      <Dots points={CONTROLS.powerDot} size={0.8} tone="mid" />
      <g className="rc-black">
        <Solid paths={CONTROLS.cueBase} tone="mid" crease="faint" />
        <Line d={CONTROLS.cueSlot} tone="lo" />
      </g>
    </g>
  );
}

function armBaseArt() {
  return (
    <g key="arm-base">
      <g className="rc-black">
        <Solid paths={ARM_BASE.skate} tone="mid" crease="faint" />
        <Line d={ARM_BASE.skateTicks.minor} tone="lo" />
        <Line d={ARM_BASE.skateTicks.major} tone="hi" />
        <Line d={ARM_BASE.skatePointer} tone="hi" free="end" />
        <Solid paths={ARM_BASE.board} tone="mid" crease="faint" />
        <Dots points={ARM_BASE.boardScrews} size={0.5} tone="lo" />
      </g>
      <g className="rc-chrome">
        <Solid paths={ARM_BASE.housing} tone="mid" crease="faint" inner={<Line d={ARM_BASE.housingKnurl + ARM_BASE.housingSeams} tone="faint" />} />
        <Solid paths={ARM_BASE.collar} tone="mid" crease="faint" />
        <Solid paths={ARM_BASE.lockScrew} tone="mid" crease="faint" />
      </g>
      <Solid paths={ARM_BASE.yoke} tone="mid" crease="faint" className="rc-black" />
      <Solid paths={ARM_BASE.restFoot} tone="mid" crease="faint" className="rc-black" />
      <Solid paths={ARM_BASE.restPost} tone="mid" crease="none" className="rc-chrome" />
      <Solid paths={ARM_BASE.cradle} tone="mid" crease="faint" className="rc-black" />
      <Solid paths={ARM_BASE.tower} tone="mid" crease="faint" className="rc-chrome" />
    </g>
  );
}

export function consoleArtProps(): ConsoleArt {
  const order = Array.from({ length: COUNT }, (_, slot) => RECORDS.findIndex((_, index) => slotOf(index) === slot));
  return {
    sweep: RACK.sweep,
    console: consoleArt(),
    fins: Array.from({ length: COUNT + 1 }, (_, slot) => finArt(slot)),
    sleeveBacks: order.map((index) => sleeveBackArt(index)),
    sleeveFronts: order.map((index) => sleeveFrontArt(index)),
    turntable: turntableArt(),
    mat: matArt(),
    spindle: spindleArt(),
    controls: controlsArt(),
    armBase: armBaseArt(),
    liftBar: <Solid key="lift-bar" paths={ARM_BASE.bar} tone="mid" crease="faint" className="rc-black" />,
  };
}
