"use client";

import * as React from "react";

import { translateAlong, type SolidPaths } from "@/components/iso/iso-kit";
import { IsoFigure } from "@/components/iso/react/draw";
import { spring, useInView, useLoop, useReadout, type Spring } from "@/components/iso/react/live";

import { RECORDS, type Album } from "../records";
import type { ConsoleArt } from "./art";
import {
  ARM_SWING_S,
  BRAKE_TAU,
  CUE_DOWN_S,
  CUE_LIFT,
  CUE_UP_S,
  GROOVE_PITCH,
  LEAD_IN_ANGLE,
  REST_STYLUS_Z,
  RPM,
  SEATED,
  SLIDE_S,
  SPIN_UP_TAU,
  SURFACE_Z,
  TRIP_S,
  armAngleFor,
  readoutOf,
  smooth,
  tripPose,
  type RecordPose,
} from "./model";
import { FADE_STEPS, LABEL_PRINT, armArt, recordArt, strobeDots } from "./parts";
import { COUNT, HEIGHT, HOVER_RISE, LEAD_IN, LP_T, P, PLAY_RISE, REST_ANGLE, RUN_OUT, SPINDLE_TOP, WIDTH, slotOf } from "./view";

/**
 * The record console, live. One loop runs a queue of steps (raise a sleeve,
 * carry a record, cue the arm), springs the sleeves, spins the platter and
 * writes the moving parts straight to the DOM.
 */

const LABEL = "A record console seen from above: a rack of six sleeves beside a belt-drive turntable. Choosing a sleeve carries its record to the platter, and the arm lowers onto it.";

/** A sleeve whose record is out stays raised this far, to mark it. */
const MARK_RISE = 26;
const SLEEVE_SPRING = { stiffness: 150, damping: 19 };
const TOUR_START = 1.4;
const QUIET = 3.6;
const TOUR_HOLD = 0.95;
const TOUR_REST = 1.8;

type Step =
  | { kind: "raise"; index: number; to: number | null; wait: boolean }
  | { kind: "trip"; index: number; out: boolean }
  | { kind: "motor"; on: boolean }
  | { kind: "cue"; up: boolean }
  | { kind: "swing"; to: "lead" | "rest" }
  | { kind: "needle"; down: boolean }
  | { kind: "stop" };

interface State {
  clock: number;
  steps: Step[];
  /** Seconds into the current step. */
  age: number;
  pending: number | null;
  /** The record on the platter (or on its way there or back). */
  record: number | null;
  /** The trip in progress: which record, how far (seconds from its sleeve). */
  trip: { index: number; t: number } | null;
  seated: boolean;
  playing: boolean;
  motor: boolean;
  rpm: number;
  /** The platter's turn, in radians. */
  turn: number;
  /** Revolutions since the needle went down. */
  revs: number;
  arm: { angle: number; lift: number; from: number };
  sleeves: Spring[];
  holds: Array<number | null>;
  hover: number | null;
  lastInput: number;
  /** What was last drawn, so a still frame draws nothing. */
  drawn: { layer: number; key: string; spin: number; arm: string; strobe: number };
}

const initial = (): State => ({
  clock: 0,
  steps: [],
  age: 0,
  pending: null,
  record: null,
  trip: null,
  seated: false,
  playing: false,
  motor: false,
  rpm: 0,
  turn: 0,
  revs: 0,
  arm: { angle: REST_ANGLE, lift: 0, from: REST_ANGLE },
  sleeves: Array.from({ length: COUNT }, () => ({ at: 0, rate: 0 })),
  holds: Array.from({ length: COUNT }, () => null),
  hover: null,
  lastInput: -Infinity,
  drawn: { layer: -1, key: "", spin: NaN, arm: "", strobe: NaN },
});

function loadSteps(index: number): Step[] {
  return [
    { kind: "raise", index, to: PLAY_RISE, wait: true },
    { kind: "trip", index, out: true },
    { kind: "motor", on: true },
    { kind: "cue", up: true },
    { kind: "swing", to: "lead" },
    { kind: "cue", up: false },
    { kind: "needle", down: true },
  ];
}

function unloadSteps(index: number, playing: boolean): Step[] {
  const arm: Step[] = playing
    ? [
        { kind: "needle", down: false },
        { kind: "cue", up: true },
        { kind: "motor", on: false },
        { kind: "swing", to: "rest" },
        { kind: "cue", up: false },
      ]
    : [{ kind: "motor", on: false }];
  return [
    ...arm,
    { kind: "stop" },
    { kind: "raise", index, to: PLAY_RISE, wait: true },
    { kind: "trip", index, out: false },
    { kind: "raise", index, to: null, wait: false },
  ];
}

// --- Drawing helpers ----------------------------------------------------------

const SHADES = [0, 1, 2, 3];

/** A solid whose paths the loop rewrites; every path is always present. */
function LiveSolid({
  name,
  paths,
  tone = "hi",
  crease = "faint",
  inner,
  className,
}: {
  name: string;
  paths: SolidPaths;
  tone?: string;
  crease?: string;
  inner?: React.ReactNode;
  className?: string;
}) {
  return (
    <g className={className ? `iso-solid ${className}` : "iso-solid"} data-part={name}>
      <path className="iso-fill" d={paths.fill} />
      {SHADES.map((shade) => (
        <path key={shade} className="iso-shade" data-shade={shade} d={paths.shades[shade] ?? ""} />
      ))}
      <path className="iso-top" d={paths.top} />
      <path className="iso-line iso-crease" data-tone={crease} d={paths.crease} />
      {inner}
      <path className="iso-line iso-edge" data-tone={tone} d={paths.outline} />
    </g>
  );
}

function writeSolid(root: Element | null, name: string, paths: SolidPaths) {
  const g = root?.querySelector(`[data-part="${name}"]`);
  if (!g) return;
  g.querySelector(".iso-fill")?.setAttribute("d", paths.fill);
  g.querySelectorAll(".iso-shade").forEach((node, shade) => node.setAttribute("d", paths.shades[shade] ?? ""));
  g.querySelector(".iso-top")?.setAttribute("d", paths.top);
  g.querySelector(".iso-crease")?.setAttribute("d", paths.crease);
  g.querySelector(".iso-edge")?.setAttribute("d", paths.outline);
}

const EMPTY: SolidPaths = { fill: "", outline: "", crease: "", top: "", shades: ["", "", "", ""] };

/** One place a record can be drawn: in a slot of the rack, on the platter, or in the air. */
function RecordLayer({ layerRef }: { layerRef: (node: SVGGElement | null) => void }) {
  return (
    <g ref={layerRef} className="rc-vinyl" display="none">
      <LiveSolid name="vinyl" paths={EMPTY} tone="mid" inner={<path className="iso-line rc-grooves" data-tone="faint" />} />
      <path className="iso-line rc-rim" data-tone="faint" />
      <path className="rc-label" />
      <g className="rc-print">
        <path className="iso-line" data-tone="hi" data-free="" d={LABEL_PRINT.title} />
        <path className="iso-line" data-tone="mid" data-free="" d={LABEL_PRINT.lines} />
        <path className="iso-line" data-tone="mid" data-free="" d={LABEL_PRINT.catalog} />
        <path className="iso-line" data-tone="mid" data-free="" d={LABEL_PRINT.side} />
        <path className="iso-line" data-tone="faint" d={LABEL_PRINT.ring} />
      </g>
      <path className="rc-hole" />
    </g>
  );
}

function paintRecord(layer: SVGGElement, pose: RecordPose, album: Album) {
  const art = recordArt(pose);
  writeSolid(layer, "vinyl", art.vinyl);
  layer.querySelector(".rc-grooves")?.setAttribute("d", art.grooves);
  layer.querySelector(".rc-rim")?.setAttribute("d", art.rim);
  const label = layer.querySelector(".rc-label");
  label?.setAttribute("d", art.label);
  label?.setAttribute("fill", album.label);
  layer.querySelector(".rc-hole")?.setAttribute("d", art.hole);
  layer.dataset.face = art.face;
  layer.removeAttribute("display");
}

function spinLabel(layer: SVGGElement, turn: number) {
  const face = layer.dataset.face ?? "";
  layer.querySelector(".rc-print")?.setAttribute("transform", `${face} rotate(${((turn * 180) / Math.PI).toFixed(2)})`);
}

// --- The component --------------------------------------------------------------

export interface RecordLiveProps extends ConsoleArt {
  /** A record chosen from outside (by id), or null to stop. */
  selected?: string | null;
  /** Someone picked a record in the figure. */
  onSelect?: (album: Album) => void;
  /** The stylus has landed in the lead-in groove. */
  onNeedleDown?: (album: Album) => void;
  /** The stylus has left the record. */
  onNeedleUp?: () => void;
}

export function RecordLive(props: RecordLiveProps) {
  const { anchor, say } = useReadout<HTMLDivElement>();
  const visible = useInView(anchor);
  const state = React.useRef<State>(initial());
  const sleeveBacks = React.useRef<Array<SVGGElement | null>>([]);
  const sleeveFronts = React.useRef<Array<SVGGElement | null>>([]);
  const layers = React.useRef<Array<SVGGElement | null>>([]);
  const strobe = React.useRef<SVGGElement>(null);
  const arm = React.useRef<SVGGElement>(null);
  const bar = React.useRef<SVGGElement>(null);
  const live = React.useRef<HTMLParagraphElement>(null);
  const callbacks = React.useRef(props);
  React.useEffect(() => {
    callbacks.current = props;
  });

  /** Slot layers 0..COUNT-1, then the platter, then the air. */
  const PLATTER_LAYER = COUNT;
  const AIR_LAYER = COUNT + 1;

  const announce = React.useCallback((text: string) => {
    if (live.current) live.current.textContent = text;
  }, []);

  const start = React.useCallback((s: State, index: number) => {
    const steps: Step[] = [];
    if (s.record !== null) steps.push(...unloadSteps(s.record, s.playing));
    if (s.record !== index) steps.push(...loadSteps(index));
    s.steps = steps;
    s.age = 0;
  }, []);

  /** Runs the step at the head of the queue; true once it's done. */
  const advance = React.useCallback(
    (s: State, dt: number, calm: boolean): boolean => {
      const step = s.steps[0];
      if (!step) return false;
      s.age += dt;
      const t = s.age;
      switch (step.kind) {
        case "raise": {
          s.holds[step.index] = step.to;
          if (!step.wait || calm) return true;
          const sleeve = s.sleeves[step.index]!;
          return (Math.abs(sleeve.at - (step.to ?? 0)) < 0.6 && Math.abs(sleeve.rate) < 20) || t > 1.6;
        }
        case "trip": {
          const progress = calm ? TRIP_S : Math.min(TRIP_S, t);
          s.trip = { index: step.index, t: step.out ? progress : TRIP_S - progress };
          s.record = step.index;
          s.seated = false;
          if (step.out && s.trip.t > SLIDE_S) s.holds[step.index] = null;
          if (progress < TRIP_S) return false;
          s.trip = null;
          if (step.out) s.seated = true;
          else s.record = null;
          return true;
        }
        case "motor":
          s.motor = step.on;
          return true;
        case "cue": {
          const length = step.up ? CUE_UP_S : CUE_DOWN_S;
          const share = calm ? 1 : Math.min(1, t / length);
          s.arm.lift = step.up ? smooth(share) : 1 - share * share * (3 - 2 * share);
          return share >= 1;
        }
        case "swing": {
          if (t <= dt) s.arm.from = s.arm.angle;
          const to = step.to === "lead" ? LEAD_IN_ANGLE : REST_ANGLE;
          const share = calm ? 1 : Math.min(1, t / ARM_SWING_S);
          s.arm.angle = s.arm.from + (to - s.arm.from) * smooth(share);
          return share >= 1;
        }
        case "needle": {
          s.playing = step.down;
          const album = s.record !== null ? RECORDS[s.record]! : null;
          if (step.down && album) {
            s.revs = 0;
            callbacks.current.onNeedleDown?.(album);
            announce(`Playing ${album.title} by ${album.artist}`);
          } else if (!step.down) {
            callbacks.current.onNeedleUp?.();
            announce("Stopped");
          }
          return true;
        }
        case "stop":
          return calm || s.rpm < 0.05;
      }
    },
    [announce],
  );

  const draw = React.useCallback(
    (s: State, calm: boolean) => {
      // Sleeves.
      s.sleeves.forEach((sleeve, index) => {
        const slot = slotOf(index);
        const transform = sleeve.at ? translateAlong(P, [0, 0, sleeve.at]) : "";
        for (const node of [sleeveBacks.current[slot], sleeveFronts.current[slot]]) {
          if (!node) continue;
          if (transform) node.setAttribute("transform", transform);
          else node.removeAttribute("transform");
        }
        const front = sleeveFronts.current[slot]?.parentElement;
        if (front) front.toggleAttribute("data-active", s.record === index);
      });

      // The record: which layer, where, turned how far.
      let layer = -1;
      let pose: RecordPose | null = null;
      if (s.trip) {
        pose = tripPose(s.trip.index, s.trip.t);
        if (s.trip.t <= SLIDE_S) layer = slotOf(s.trip.index);
        else if (pose.tilt >= 89.9 && pose.c[2] - LP_T / 2 < SPINDLE_TOP) layer = PLATTER_LAYER;
        else layer = AIR_LAYER;
      } else if (s.record !== null && s.seated) {
        pose = SEATED;
        layer = PLATTER_LAYER;
      }
      const key = pose ? `${s.record}|${pose.c.map((v) => v.toFixed(2)).join(",")}|${pose.tilt.toFixed(2)}` : "";
      if (layer !== s.drawn.layer || key !== s.drawn.key) {
        layers.current.forEach((node, index) => {
          if (node && index !== layer) node.setAttribute("display", "none");
        });
        const node = layers.current[layer];
        if (node && pose && s.record !== null) paintRecord(node, pose, RECORDS[s.record]!);
        s.drawn.layer = layer;
        s.drawn.key = key;
        s.drawn.spin = NaN;
      }
      const shownTurn = calm ? 0 : s.turn;
      if (layer >= 0 && shownTurn !== s.drawn.spin) {
        const node = layers.current[layer];
        if (node) spinLabel(node, layer === PLATTER_LAYER && !s.trip ? shownTurn : 0);
        s.drawn.spin = shownTurn;
      }

      // The strobe turns with the platter.
      if (strobe.current && shownTurn !== s.drawn.strobe) {
        const dots = strobeDots(shownTurn);
        strobe.current.querySelectorAll("circle").forEach((circle, index) => {
          const [x, y, alpha] = dots[index]!;
          circle.setAttribute("cx", x.toFixed(1));
          circle.setAttribute("cy", y.toFixed(1));
          circle.setAttribute("fill-opacity", alpha.toFixed(2));
        });
        s.drawn.strobe = shownTurn;
      }

      // The arm.
      const over = smooth((s.arm.angle - REST_ANGLE) / (LEAD_IN_ANGLE - REST_ANGLE));
      const stylusZ = REST_STYLUS_Z + (SURFACE_Z - REST_STYLUS_Z) * over + s.arm.lift * CUE_LIFT;
      const armKey = `${s.arm.angle.toFixed(3)}|${stylusZ.toFixed(2)}`;
      if (armKey !== s.drawn.arm && arm.current) {
        const art = armArt({ angle: s.arm.angle, stylusZ });
        writeSolid(arm.current, "stub", art.stub);
        writeSolid(arm.current, "weight", art.weight);
        arm.current.querySelectorAll(".rc-knurl path").forEach((node, step) => node.setAttribute("d", art.weightRibs[step] ?? ""));
        writeSolid(arm.current, "tube", art.tube);
        writeSolid(arm.current, "collar", art.collar);
        writeSolid(arm.current, "headshell", art.headshell);
        writeSolid(arm.current, "lift", art.lift);
        writeSolid(arm.current, "cartridge", art.cartridge);
        arm.current.querySelector(".rc-stylus")?.setAttribute("d", art.stylus);
        const tip = arm.current.querySelector(".rc-tip");
        tip?.setAttribute("cx", art.tip[0].toFixed(1));
        tip?.setAttribute("cy", art.tip[1].toFixed(1));
        s.drawn.arm = armKey;
      }
      const barLift = s.arm.lift * CUE_LIFT;
      if (bar.current) {
        if (barLift) bar.current.setAttribute("transform", translateAlong(P, [0, 0, barLift]));
        else bar.current.removeAttribute("transform");
      }

      say(readoutOf(s.record !== null ? RECORDS[s.record]! : null, s.rpm, s.playing));
    },
    [PLATTER_LAYER, AIR_LAYER, say],
  );

  const kick = useLoop((dt, calm) => {
    const s = state.current;
    s.clock += dt;

    // Run the queue; a step that finishes hands its leftover frame to the next.
    let guard = 0;
    while (s.steps.length && guard++ < 40) {
      if (!advance(s, dt, calm)) break;
      s.steps.shift();
      s.age = 0;
      if (!calm) break;
    }
    if (!s.steps.length && s.pending !== null) {
      const next = s.pending;
      s.pending = null;
      start(s, next);
    }

    // A newer choice skips the arm: a record still settling goes straight back.
    const head = s.steps[0];
    if (s.pending !== null && s.seated && !s.playing && head?.kind === "cue" && head.up && s.age === 0) s.steps = [];

    // The platter: spin up through the belt, or brake to a stop.
    if (s.motor) s.rpm += (RPM - s.rpm) * (1 - Math.exp(-dt / SPIN_UP_TAU));
    else s.rpm *= Math.exp(-dt / BRAKE_TAU);
    if (calm) s.rpm = s.motor ? RPM : 0;
    if (!s.motor && s.rpm < 0.05) s.rpm = 0;
    if (s.motor && RPM - s.rpm < 0.01) s.rpm = RPM;
    const turns = (s.rpm / 60) * dt;
    s.turn = (s.turn - turns * Math.PI * 2) % (Math.PI * 2);

    // Playing, the stylus follows the groove inward.
    if (s.playing) {
      s.revs += turns;
      const radius = Math.max(RUN_OUT, LEAD_IN - GROOVE_PITCH * s.revs);
      s.arm.angle = armAngleFor(radius);
    }

    // The idle tour: a slow pass along the rack while nobody's touching it.
    const quiet = s.clock - s.lastInput;
    const touring = !calm && s.clock > TOUR_START && quiet > QUIET && !s.steps.length;
    let hover = s.hover;
    if (touring) {
      const cycle = COUNT * TOUR_HOLD + TOUR_REST;
      const into = (s.clock - TOUR_START) % cycle;
      const slot = Math.floor(into / TOUR_HOLD);
      hover = slot < COUNT ? COUNT - 1 - slot : null;
      if (hover !== null && hover === s.record) hover = null;
    }

    let settled = true;
    s.sleeves.forEach((sleeve, index) => {
      const hold = s.holds[index];
      const out = s.record === index && (s.seated || (s.trip !== null && s.trip.t > SLIDE_S));
      const target = hold ?? Math.max(out ? MARK_RISE : 0, hover === index ? HOVER_RISE : 0);
      if (!spring(sleeve, target, dt, SLEEVE_SPRING.stiffness, SLEEVE_SPRING.damping, calm)) settled = false;
    });

    draw(s, calm);

    const spinning = s.rpm > 0 && !calm;
    return !settled || s.steps.length > 0 || s.pending !== null || spinning || touring || s.playing;
  }, visible);

  const request = React.useCallback(
    (index: number) => {
      anchor.current?.setAttribute("data-picked", "");
      const s = state.current;
      s.lastInput = s.clock;
      if (s.steps.length) s.pending = index;
      else start(s, index);
      kick();
    },
    [anchor, kick, start],
  );

  const choose = (index: number) => {
    request(index);
    callbacks.current.onSelect?.(RECORDS[index]!);
  };

  const hoverOn = (index: number | null) => {
    const s = state.current;
    s.hover = index;
    s.lastInput = s.clock;
    kick();
  };

  // A record chosen from outside.
  const { selected } = props;
  React.useEffect(() => {
    if (selected === undefined) return;
    const s = state.current;
    const index = selected === null ? null : RECORDS.findIndex((album) => album.id === selected);
    if (index === null) {
      if (s.record !== null) request(s.record);
    } else if (index >= 0 && index !== s.record) request(index);
  }, [selected, request]);

  const sleeveOf = (target: EventTarget | null) => {
    const node = (target as Element | null)?.closest?.("[data-sleeve]");
    return node ? Number(node.getAttribute("data-sleeve")) : null;
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(index);
      return;
    }
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + COUNT) % COUNT;
    anchor.current?.querySelector<SVGGElement>(`[data-sleeve="${next}"][tabindex]`)?.focus();
  };

  return (
    <div
      ref={anchor}
      className="rc"
      role="group"
      aria-label="Record console. Tab to a record and press Enter to play it."
      onPointerLeave={() => hoverOn(null)}
    >
      <IsoFigure width={WIDTH} height={HEIGHT} label={LABEL}>
        <defs>
          <clipPath id="rc-sweep">
            <path d={props.sweep} />
          </clipPath>
        </defs>
        <g
          onPointerMove={(event) => {
            const index = sleeveOf(event.target);
            if (index !== state.current.hover) hoverOn(index);
          }}
          onClick={(event) => {
            const index = sleeveOf(event.target);
            if (index !== null) choose(index);
          }}
        >
          {props.console}
          {Array.from({ length: COUNT }, (_, slot) => {
            const index = RECORDS.findIndex((_, i) => slotOf(i) === slot);
            const album = RECORDS[index]!;
            return (
              <React.Fragment key={slot}>
                {props.fins[slot]}
                <g clipPath="url(#rc-sweep)" data-sleeve={index} className="rc-sleeve">
                  <g ref={(node) => void (sleeveBacks.current[slot] = node)}>{props.sleeveBacks[slot]}</g>
                </g>
                <RecordLayer layerRef={(node) => void (layers.current[slot] = node)} />
                <g
                  clipPath="url(#rc-sweep)"
                  data-sleeve={index}
                  className="rc-sleeve"
                  tabIndex={0}
                  role="button"
                  aria-label={`Play ${album.title} by ${album.artist}`}
                  onFocus={() => hoverOn(index)}
                  onBlur={() => hoverOn(null)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                >
                  <g ref={(node) => void (sleeveFronts.current[slot] = node)}>{props.sleeveFronts[slot]}</g>
                </g>
              </React.Fragment>
            );
          })}
          {props.fins[COUNT]}
        </g>
        {props.turntable}
        <g ref={strobe} className="iso-dots rc-alu" data-tone="mid">
          {strobeDots(0).map(([x, y, alpha], index) => (
            <circle key={index} cx={x.toFixed(1)} cy={y.toFixed(1)} r={0.55} fillOpacity={alpha.toFixed(2)} />
          ))}
        </g>
        {props.mat}
        <RecordLayer layerRef={(node) => void (layers.current[PLATTER_LAYER] = node)} />
        {props.spindle}
        {props.controls}
        {props.armBase}
        <g ref={bar}>{props.liftBar}</g>
        <ArmLayer armRef={arm} />
        <RecordLayer layerRef={(node) => void (layers.current[AIR_LAYER] = node)} />
      </IsoFigure>
      <p ref={live} className="rc-live" aria-live="polite" />
    </div>
  );
}

const ARM_REST = armArt({ angle: REST_ANGLE, stylusZ: REST_STYLUS_Z });

function ArmLayer({ armRef }: { armRef: React.RefObject<SVGGElement | null> }) {
  return (
    <g ref={armRef} className="rc-arm">
      <LiveSolid name="stub" paths={ARM_REST.stub} tone="mid" crease="none" className="rc-chrome" />
      <LiveSolid
        name="weight"
        paths={ARM_REST.weight}
        tone="mid"
        className="rc-black"
        inner={
          <g className="rc-knurl">
            {Array.from({ length: FADE_STEPS }, (_, step) => (
              <path key={step} className="iso-line" data-tone="lo" opacity={(step + 1) / FADE_STEPS} d={ARM_REST.weightRibs[step]} />
            ))}
          </g>
        }
      />
      <LiveSolid name="tube" paths={ARM_REST.tube} tone="mid" crease="none" className="rc-chrome" />
      <LiveSolid name="collar" paths={ARM_REST.collar} tone="mid" className="rc-black" />
      <LiveSolid name="headshell" paths={ARM_REST.headshell} tone="mid" className="rc-black" />
      <LiveSolid name="lift" paths={ARM_REST.lift} tone="mid" crease="none" className="rc-chrome" />
      <LiveSolid name="cartridge" paths={ARM_REST.cartridge} tone="mid" className="rc-red" />
      <path className="iso-line rc-stylus" data-tone="hi" d={ARM_REST.stylus} />
      <circle className="rc-tip" cx={ARM_REST.tip[0].toFixed(1)} cy={ARM_REST.tip[1].toFixed(1)} r={0.7} />
    </g>
  );
}
