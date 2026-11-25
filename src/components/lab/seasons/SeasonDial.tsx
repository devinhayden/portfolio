"use client";

import * as React from "react";

import { SEASONS } from "./scene";

const SIZE = 176;
const C = SIZE / 2;
/** Radius of the coloured season ring, the icons around it, and the knob. */
const RING = 52;
const ICONS = 74;
const KNOB = 35;
/** Bumps around the knob's edge, for grip. */
const SCALLOPS = 14;
/** Seasons per radian of hand movement: below 2/π, so the knob lags the hand. */
const GAIN = 0.55 * (2 / Math.PI);
/** Either side of a season, the share of the way that stays locked to it. */
const DETENT = 0.14;

/** Each season's colour: blossom, sun, leaf, ice. */
const TINTS: [number, number, number][] = [
  [240, 160, 190],
  [244, 192, 62],
  [230, 116, 58],
  [120, 172, 226],
];

const mod = (n: number, m: number) => ((n % m) + m) % m;
/** Rounded so server and client agree on the last digit of the trig. */
const px = (n: number) => Math.round(n * 100) / 100;
const rgb = ([r, g, b]: [number, number, number]) => `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;

/** Holds the value on a season near whole numbers, then lets go: the dial's detents. */
function detent(raw: number) {
  const n = Math.floor(raw);
  const f = raw - n;
  if (f < DETENT) return n;
  if (f > 1 - DETENT) return n + 1;
  return n + (f - DETENT) / (1 - 2 * DETENT);
}

/** The knob's outline: a circle with soft bumps around it. */
const KNOB_PATH = (() => {
  const steps = 168;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = KNOB + 1.4 * Math.cos(a * SCALLOPS);
    d += `${i ? "L" : "M"}${px(C + Math.cos(a) * r)},${px(C + Math.sin(a) * r)}`;
  }
  return d + "Z";
})();

/** An arc of the ring, from one angle to another (0 is twelve o'clock). */
function arc(from: number, to: number) {
  const point = (a: number) => `${px(C + Math.sin(a) * RING)},${px(C - Math.cos(a) * RING)}`;
  return `M${point(from)}A${RING},${RING} 0 0 1 ${point(to)}`;
}

/** Little drawings for each season, centred on 0,0, about 24 across. */
function Icon({ season }: { season: number }) {
  if (season === 0) {
    return (
      <g>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          return <circle key={i} cx={px(Math.cos(a) * 5.5)} cy={px(Math.sin(a) * 5.5)} r={4.6} fill="currentColor" />;
        })}
        <circle r={3} fill="#fff6c8" />
      </g>
    );
  }
  if (season === 1) {
    return (
      <g stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
        <circle r={5.6} fill="currentColor" stroke="none" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={px(Math.cos(a) * 8.5)}
              y1={px(Math.sin(a) * 8.5)}
              x2={px(Math.cos(a) * 11.5)}
              y2={px(Math.sin(a) * 11.5)}
            />
          );
        })}
      </g>
    );
  }
  if (season === 2) {
    return (
      <g transform="rotate(35)">
        <path d="M0,-11 C7,-7 8.5,3 0,11 C-8.5,3 -7,-7 0,-11Z" fill="currentColor" />
        <path d="M0,-7 L0,13" stroke="#fff" strokeOpacity={0.7} strokeWidth={1.3} strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g stroke="currentColor" strokeWidth={2} strokeLinecap="round" fill="none">
      {[0, 60, 120].map((deg) => (
        <g key={deg} transform={`rotate(${deg})`}>
          <path d="M0,-11 L0,11" />
          <path d="M-3.4,-8.6 L0,-5.4 L3.4,-8.6 M-3.4,8.6 L0,5.4 L3.4,8.6" />
        </g>
      ))}
    </g>
  );
}

/**
 * A chunky knob that turns through the year: a full turn is four seasons,
 * each with its colour and a little drawing around the rim. It's heavy to
 * turn, sticks at each season, and clicks to the nearest one when let go.
 * `value` is unbounded, so it keeps turning past winter back into spring.
 */
export function SeasonDial({
  value,
  onChange,
  size = SIZE,
}: {
  value: number;
  onChange: (value: number) => void;
  /** Drawn size in pixels; everything scales with it. */
  size?: number;
}) {
  /** The hand's position in seasons, before the detents shape it. */
  const drag = React.useRef<{ angle: number; raw: number } | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const nearest = mod(Math.round(value), SEASONS.length);
  const f = value - Math.floor(value);
  const fromIndex = mod(Math.floor(value), SEASONS.length);
  const toIndex = mod(Math.floor(value) + 1, SEASONS.length);
  const text =
    f < 0.02 || f > 0.98
      ? SEASONS[nearest]
      : `${SEASONS[fromIndex]}, turning to ${SEASONS[toIndex]}, ${Math.round(f * 100)}%`;
  // The pointer takes on the colour of wherever it sits between two seasons.
  const tint = TINTS[fromIndex].map((v, k) => v + (TINTS[toIndex][k] - v) * f) as [number, number, number];

  const angleOf = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return Math.atan2(e.clientY - rect.top - rect.height / 2, e.clientX - rect.left - rect.width / 2);
  };
  const release = () => {
    drag.current = null;
    setDragging(false);
    onChange(Math.round(value));
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="shrink-0 cursor-grab touch-none select-none text-ink outline-none active:cursor-grabbing [&:focus-visible_.knob-rim]:stroke-ink/50"
      role="slider"
      tabIndex={0}
      aria-label="Season"
      aria-valuemin={0}
      aria-valuemax={SEASONS.length}
      aria-valuenow={Number(mod(value, SEASONS.length).toFixed(2))}
      aria-valuetext={text}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { angle: angleOf(e), raw: value };
        setDragging(true);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const angle = angleOf(e);
        // Unwrap across ±π so the knob turns smoothly past nine o'clock.
        const delta = mod(angle - d.angle + Math.PI, Math.PI * 2) - Math.PI;
        d.angle = angle;
        d.raw += delta * GAIN;
        const next = detent(d.raw);
        // A tap on phones that support it, as the knob drops into a season.
        if (Number.isInteger(next) && next !== value) navigator.vibrate?.(8);
        onChange(next);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.floor(value) + 1);
        else if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.ceil(value) - 1);
        else return;
        e.preventDefault();
      }}
    >
      <defs>
        <radialGradient id="season-knob" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ece8e1" />
        </radialGradient>
      </defs>

      {/* The ring: one soft arc per season, the current one bolder. */}
      {SEASONS.map((s, i) => {
        const mid = (i / SEASONS.length) * Math.PI * 2;
        const half = Math.PI / 4 - 0.2;
        return (
          <path
            key={s}
            d={arc(mid - half, mid + half)}
            fill="none"
            stroke={rgb(TINTS[i])}
            strokeOpacity={i === nearest ? 1 : 0.28}
            strokeWidth={i === nearest ? 6 : 4}
            strokeLinecap="round"
            className="transition-[stroke-opacity,stroke-width] duration-300"
          />
        );
      })}

      {/* The drawings, the current season's popping up in colour. */}
      {SEASONS.map((s, i) => {
        const a = (i / SEASONS.length) * Math.PI * 2;
        const on = i === nearest;
        return (
          <g
            key={s}
            style={{
              transform: `translate(${px(C + Math.sin(a) * ICONS)}px, ${px(C - Math.cos(a) * ICONS)}px) scale(${on ? 0.8 : 0.6})`,
              transition: "transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1), color 300ms",
              color: on ? rgb(TINTS[i]) : "rgb(56 56 56 / 0.22)",
            }}
          >
            <Icon season={i} />
          </g>
        );
      })}

      {/* A shadow that stays put while the knob turns over it. */}
      <circle cx={C} cy={C + 3} r={KNOB} fill="#000" opacity={0.07} style={{ filter: "blur(4px)" }} />

      <g
        style={{
          transform: `rotate(${value * 90}deg)`,
          transformOrigin: `${C}px ${C}px`,
          // Under the hand it follows exactly; let go and it clicks home with a slight overshoot.
          transition: dragging ? "none" : "transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <path
          d={KNOB_PATH}
          fill="url(#season-knob)"
          stroke="#d9d3c9"
          strokeWidth={1}
          className="knob-rim transition-[stroke]"
        />
        <circle cx={C} cy={C - KNOB + 10} r={4.5} fill={rgb(tint)} />
      </g>
    </svg>
  );
}
