"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import Image from "next/image";
import {
  Fragment,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useDialKit } from "dialkit";

/**
 * A magnifying glass for the landing hero: "worth a closer look", taken at
 * its word.
 *
 * Its own inline icon in the sentence (see `MagnifierIcon`) lifts out into a
 * full glass that follows the pointer. Through the lens is a second copy of
 * the scene (`children`), drawn at the section's own size and scaled up about
 * the point under the glass, so text stays vector-sharp at any zoom. Two
 * filters treat it:
 *
 * - The lens (`#magnifier-lens`), on the round window: a bulge — more
 *   magnification in the middle, squeezed toward the rim — with lateral
 *   chromatic fringing that grows toward the rim, the way a single cheap
 *   element does. Each colour channel gets its own displacement map, made
 *   once on a canvas, and the three are added back together.
 * - The ink (`#magnifier-ink`), which the scene puts on its text: up close,
 *   the type stops looking typeset and starts looking printed. Its edges
 *   wick into the paper's fibres, a faint halo spreads round each stroke,
 *   and the ink lies unevenly. It soaks in over a second or so after the
 *   glass comes up, as if the closer look is what shows it.
 *
 * Desktop only: it wants a mouse and room to move. The glass is a photo
 * (`/about/magnifier.png`, 1707×2048) with a transparent lens; LENS_* below
 * locate the clear opening in it.
 */

export const MAGNIFIER_SRC = "/about/magnifier.png";
const IMG_W = 1707;
const IMG_H = 2048;
/** The clear opening in the photo: centre and radius, in its own pixels. */
const LENS_X = 624;
const LENS_Y = 523;
const LENS_R = 466;

/** Mouse and room to move: the glass is no use to a finger. */
export const MAGNIFIER_MEDIA =
  "(hover: hover) and (pointer: fine) and (min-width: 1024px)";

export const INK_FILTER = "magnifier-ink";
const LENS_FILTER = "magnifier-lens";

/** Margin round the lens circle inside the filtered box, so the fringe at
 *  the rim samples picture rather than the box's empty outside. */
const PAD = 12;

/**
 * Where the lens filter samples from, per channel, as three displacement
 * maps. Positions are in units of the lens radius, `r` from its centre:
 *
 * - bulge: samples pulled in by `bulge · (1 − r²)` — the middle magnified a
 *   further 1/(1 − bulge), easing to none at the rim, which leaves the rim
 *   compressed. It's what makes the glass read as curved.
 * - fringe: red sampled `fringe · r²` further out, blue as far in, green
 *   true. Zero on-axis, most at the rim.
 *
 * Every map shares one encoding so one `scale` serves all three.
 */
function lensMaps(radius: number, bulge: number, fringe: number) {
  const box = 2 * (radius + PAD);
  const n = 160;
  // The largest displacement anywhere: the bulge peaks at r = 1/√3.
  const most = 0.385 * bulge + fringe + 1e-4;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = n;
  const ctx = canvas.getContext("2d")!;
  const urls = [1, 0, -1].map((channel) => {
    const image = ctx.createImageData(n, n);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        let u = (((i + 0.5) / n) * box - box / 2) / radius;
        let v = (((j + 0.5) / n) * box - box / 2) / radius;
        let r2 = u * u + v * v;
        // Past the rim, hold the rim's displacement.
        if (r2 > 1) {
          const s = 1 / Math.sqrt(r2);
          u *= s;
          v *= s;
          r2 = 1;
        }
        const k = -bulge * (1 - r2) + channel * fringe * r2;
        const p = (j * n + i) * 4;
        image.data[p] = Math.round((0.5 + (u * k) / (2 * most)) * 255);
        image.data[p + 1] = Math.round((0.5 + (v * k) / (2 * most)) * 255);
        image.data[p + 2] = 128;
        image.data[p + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    return canvas.toDataURL();
  });
  return { urls, scale: 2 * most * radius, box };
}

type Props = {
  /** The glass is up (true) or being put back (false). */
  out: boolean;
  /** Asks for it to be put back: Escape, or a click on nothing. */
  onClose: () => void;
  /** It's back in the sentence and can disappear. */
  onReturned: () => void;
  /** The hero; the glass moves in its unscaled pixels. */
  sectionRef: RefObject<HTMLElement | null>;
  /** The inline icon the glass lifts out of and goes back into. */
  iconRef: RefObject<HTMLElement | null>;
  /** The scene again, laid out at the section's size, for under the lens. */
  children: ReactNode;
};

export function Magnifier({
  out,
  onClose,
  onReturned,
  sectionRef,
  iconRef,
  children,
}: Props) {
  const reduceMotion = useReducedMotion();
  const dial = useDialKit(
    "Magnifier",
    {
      /** Radius of the lens's clear opening, in CSS px. */
      radius: [125, 70, 220, 1],
      /** Magnification at the rim; the middle gets more (see bulge). */
      zoom: [1.7, 1, 4, 0.05],
      bulge: [0.28, 0, 0.6, 0.01],
      fringe: [0.018, 0, 0.08, 0.001],
      ink: {
        /** How far the ink wicks: 0 is clean type, 1 the intended look. */
        bleed: [1, 0, 2.5, 0.05],
        /** How long it takes to soak in once the glass is up. */
        soak: [1.4, 0, 4, 0.1],
        /** The paper's tooth, which only shows this close. */
        paper: [0.28, 0, 0.8, 0.01],
      },
      motion: {
        /** How tightly the glass follows the hand. */
        follow: [520, 100, 1500, 10],
        damping: [42, 10, 80, 1],
        /** Most the handle tilts as the glass is swept sideways (deg). */
        tilt: [9, 0, 25, 0.5],
      },
    },
    { id: "magnifier", persist: true },
  );

  const radius = dial.radius;
  const zoomValue = dial.zoom;
  /** The photo, scaled so its opening is the lens's radius. */
  const k = radius / LENS_R;

  // Where the lens centre is, in the section's unscaled pixels: the hand
  // (`target`), and the glass easing after it.
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const spring = {
    stiffness: dial.motion.follow,
    damping: dial.motion.damping,
    mass: 0.6,
  };
  const x = useSpring(targetX, reduceMotion ? { duration: 0 } : spring);
  const y = useSpring(targetY, reduceMotion ? { duration: 0 } : spring);
  const scale = useMotionValue(0);

  // The handle leans into a sideways sweep, as a held thing does.
  const velocity = useVelocity(x);
  const lean = useTransform(velocity, (v) => {
    if (reduceMotion) return 0;
    const t = dial.motion.tilt;
    return Math.max(-t, Math.min(t, v / 120));
  });
  const tilt = useSpring(lean, { stiffness: 220, damping: 22 });

  const zoom = useMotionValue(zoomValue);
  useEffect(() => zoom.set(zoomValue), [zoom, zoomValue]);
  const box = 2 * (radius + PAD);
  // The scene's point under the lens centre lands on the box's centre,
  // scaled up about it.
  const sceneTransform = useTransform(
    [x, y, zoom],
    ([cx, cy, z]: number[]) =>
      `translate(${box / 2 - cx * z}px, ${box / 2 - cy * z}px)`,
  );

  const [size, setSize] = useState({ width: 0, height: 0 });

  /** The section's unscaled pixels for a point on screen. */
  const toSection = (clientX: number, clientY: number) => {
    const section = sectionRef.current;
    if (!section) return null;
    const rect = section.getBoundingClientRect();
    const ratio = rect.width / section.offsetWidth || 1;
    return {
      x: (clientX - rect.left) / ratio,
      y: (clientY - rect.top) / ratio,
    };
  };
  /** The icon's own lens, and the scale that makes the glass its size. */
  const home = () => {
    const icon = iconRef.current;
    if (!icon) return null;
    const r = icon.getBoundingClientRect();
    const at = toSection(
      r.left + (LENS_X / IMG_W) * r.width,
      r.top + (LENS_Y / IMG_H) * r.height,
    );
    const section = sectionRef.current!;
    const ratio = section.getBoundingClientRect().width / section.offsetWidth || 1;
    return at && { ...at, scale: r.height / ratio / (IMG_H * k) };
  };

  // Up: out of the icon, to the hand. Back: into the icon, then gone.
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const lift = useEffectEvent(() => {
    const section = sectionRef.current;
    if (section) setSize({ width: section.offsetWidth, height: section.offsetHeight });
    const from = home();
    if (from) {
      x.jump(from.x);
      y.jump(from.y);
      scale.jump(from.scale);
    }
    const to = lastPointer.current ?? from;
    if (to) {
      targetX.set(to.x);
      targetY.set(to.y);
    }
    animate(
      scale,
      1,
      reduceMotion
        ? { duration: 0.2 }
        : { type: "spring", stiffness: 260, damping: 18 },
    );
  });
  const putBack = useEffectEvent(() => {
    const to = home();
    if (!to) return onReturned();
    targetX.set(to.x);
    targetY.set(to.y);
    animate(
      scale,
      to.scale,
      reduceMotion
        ? { duration: 0.2 }
        : { type: "spring", stiffness: 300, damping: 30, restDelta: 0.002 },
    ).then(onReturned);
  });
  useEffect(() => {
    if (out) lift();
    else putBack();
  }, [out]);

  // Follow the hand; Escape or a click on nothing puts the glass down.
  // (Clicks on links and the bubble go through it, as they would.)
  const close = useEffectEvent(() => onClose());
  useEffect(() => {
    if (!out) return;
    const section = sectionRef.current;
    const move = (event: PointerEvent) => {
      const at = toSection(event.clientX, event.clientY);
      if (!at) return;
      lastPointer.current = at;
      targetX.set(at.x);
      targetY.set(at.y);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const click = (event: MouseEvent) => {
      if (!(event.target as Element).closest("a, button")) close();
    };
    const resize = () => {
      if (section) setSize({ width: section.offsetWidth, height: section.offsetHeight });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("keydown", key);
    window.addEventListener("resize", resize);
    section?.addEventListener("click", click);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("keydown", key);
      window.removeEventListener("resize", resize);
      section?.removeEventListener("click", click);
    };
    // `toSection` reads only refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [out, sectionRef, targetX, targetY]);

  // The ink soaks in once the glass is up, and dries back out as it goes.
  const soak = useMotionValue(0);
  const inkRef = useRef<SVGFilterElement>(null);
  const bleed = dial.ink.bleed;
  const soakTime = dial.ink.soak;
  useEffect(() => {
    const controls = animate(soak, out ? 1 : 0, {
      duration: reduceMotion ? 0 : out ? soakTime : 0.3,
      ease: [0.3, 0, 0.2, 1],
    });
    return () => controls.stop();
  }, [out, soak, soakTime, reduceMotion]);
  useEffect(() => {
    const paint = (s: number) => {
      const filter = inkRef.current;
      if (!filter) return;
      const amount = s * bleed;
      const set = (id: string, attr: string, value: number) =>
        filter.querySelector(`[data-ink="${id}"]`)?.setAttribute(attr, String(value));
      set("rough", "scale", 2.2 * amount);
      set("soft", "stdDeviation", 0.15 * amount);
      set("spread", "stdDeviation", 0.9 * amount);
      set("halo", "slope", 0.22 * Math.min(1, amount));
      set("mottle", "slope", 0.55 * Math.min(1, amount));
      set("mottle", "intercept", 1.15 - 0.6 * Math.min(1, amount));
    };
    paint(soak.get());
    return soak.on("change", paint);
  }, [soak, bleed]);

  const maps = useMemo(
    () => lensMaps(radius, dial.bulge, dial.fringe),
    [radius, dial.bulge, dial.fringe],
  );

  return (
    <>
      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          <filter
            id={LENS_FILTER}
            filterUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={maps.box}
            height={maps.box}
            colorInterpolationFilters="sRGB"
          >
            {maps.urls.map((url, i) => (
              <feImage
                key={i}
                href={url}
                x="0"
                y="0"
                width={maps.box}
                height={maps.box}
                preserveAspectRatio="none"
                result={`map${i}`}
              />
            ))}
            {["1 0 0 0 0", "0 1 0 0 0", "0 0 1 0 0"].map((keep, i) => (
              <Fragment key={i}>
                <feDisplacementMap
                  in="SourceGraphic"
                  in2={`map${i}`}
                  scale={maps.scale}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result={`shifted${i}`}
                />
                {/* Just this channel: the others zeroed, alpha kept. */}
                <feColorMatrix
                  in={`shifted${i}`}
                  type="matrix"
                  values={[0, 1, 2]
                    .map((row) => (row === i ? keep : "0 0 0 0 0"))
                    .concat("0 0 0 1 0")
                    .join(" ")}
                  result={`channel${i}`}
                />
              </Fragment>
            ))}
            <feComposite
              in="channel0"
              in2="channel1"
              operator="arithmetic"
              k2="1"
              k3="1"
              result="rg"
            />
            <feComposite in="rg" in2="channel2" operator="arithmetic" k2="1" k3="1" />
          </filter>

          <filter
            ref={inkRef}
            id={INK_FILTER}
            x="-4%"
            y="-10%"
            width="108%"
            height="120%"
            colorInterpolationFilters="sRGB"
          >
            {/* Paper fibres: coarse enough that edges wander and wick
                rather than scatter (fine noise just reads as blur), and
                stretched along the grain. */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.09 0.22"
              numOctaves="3"
              seed="4"
              result="fibre"
            />
            <feDisplacementMap
              data-ink="rough"
              in="SourceGraphic"
              in2="fibre"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
              result="rough"
            />
            <feGaussianBlur data-ink="soft" in="rough" stdDeviation="0" result="soft" />
            {/* A faint spread round each stroke, where the ink travelled. */}
            <feGaussianBlur data-ink="spread" in="rough" stdDeviation="0" result="spread" />
            <feComponentTransfer in="spread" result="halo">
              <feFuncA data-ink="halo" type="linear" slope="0" />
            </feComponentTransfer>
            {/* Uneven density: the ink took better in some places. */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.06"
              numOctaves="3"
              seed="11"
              result="blots"
            />
            <feColorMatrix
              in="blots"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0"
              result="density"
            />
            <feComponentTransfer in="density" result="mottle">
              <feFuncA data-ink="mottle" type="linear" slope="0" intercept="1" />
            </feComponentTransfer>
            <feComposite in="soft" in2="mottle" operator="in" result="inked" />
            <feMerge>
              <feMergeNode in="halo" />
              <feMergeNode in="inked" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* The glass, its origin on the lens centre. Clicks fall through it. */}
      <motion.div
        aria-hidden
        style={{ x, y, scale }}
        className="pointer-events-none absolute top-0 left-0 z-30"
      >
        {/* The lens: the scene again, enlarged and bent. */}
        <div
          style={{
            left: -box / 2,
            top: -box / 2,
            width: box,
            height: box,
            clipPath: `circle(${radius}px at 50% 50%)`,
          }}
          className="absolute"
        >
          <div style={{ filter: `url(#${LENS_FILTER})` }} className="absolute inset-0">
            {/* Laid out again at the zoomed size (`zoom`, not a scale
                transform), so the text and its ink are drawn at full
                resolution rather than enlarged after. */}
            <motion.div
              style={{ transform: sceneTransform }}
              className="absolute top-0 left-0"
            >
              <div
                style={{ width: size.width, height: size.height, zoom: zoomValue }}
                className="relative overflow-hidden bg-white"
              >
                {/* The paper's tooth, plain at this distance. */}
                <div
                  style={{
                    backgroundImage: "url(/textures/paper.webp)",
                    backgroundSize: "256px",
                    opacity: dial.ink.paper,
                  }}
                  className="absolute inset-0"
                />
                {children}
              </div>
            </motion.div>
          </div>
          {/* Light on the glass: a soft sheen up top, darkening to the rim. */}
          <div
            style={{
              left: PAD,
              top: PAD,
              width: 2 * radius,
              height: 2 * radius,
              background:
                "radial-gradient(circle at 34% 28%, rgba(255,255,255,0.32), rgba(255,255,255,0) 38%), radial-gradient(circle, rgba(40,36,30,0) 72%, rgba(40,36,30,0.14) 100%)",
            }}
            className="absolute rounded-full"
          />
        </div>

        {/* The frame and handle, leaning about the lens centre. */}
        <motion.div
          style={{
            left: -LENS_X * k,
            top: -LENS_Y * k,
            width: IMG_W * k,
            height: IMG_H * k,
            rotate: tilt,
            transformOrigin: `${LENS_X * k}px ${LENS_Y * k}px`,
          }}
          className="absolute drop-shadow-[0_18px_24px_rgba(0,0,0,0.18)]"
        >
          <Image
            src={MAGNIFIER_SRC}
            alt=""
            fill
            sizes={`${Math.round(IMG_W * k)}px`}
            loading="eager"
            draggable={false}
          />
        </motion.div>
      </motion.div>
    </>
  );
}

/**
 * The glass at rest, as an inline mark in the sentence like the social
 * icons beside it. Clicking it lifts the glass out.
 */
export function MagnifierIcon({
  ref,
  away,
  onClick,
}: {
  ref?: RefObject<HTMLButtonElement | null>;
  /** The glass is out: leave its place in the line empty. */
  away: boolean;
  onClick: () => void;
}) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label="Take a closer look"
      aria-pressed={away}
      title="Take a closer look"
      onClick={onClick}
      style={{ visibility: away ? "hidden" : undefined }}
      className="relative -top-[0.07em] ml-[0.2em] mr-[0.12em] inline-block cursor-zoom-in align-middle transition-transform duration-200 ease-out hover:-translate-y-[0.06em] hover:-rotate-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      <MagnifierMark />
    </button>
  );
}

/** The icon's picture alone, for the copy of the sentence under the lens. */
export function MagnifierMark() {
  return (
    <Image
      src={MAGNIFIER_SRC}
      alt=""
      width={IMG_W}
      height={IMG_H}
      sizes="64px"
      className="block h-[1em] w-auto"
      draggable={false}
    />
  );
}
