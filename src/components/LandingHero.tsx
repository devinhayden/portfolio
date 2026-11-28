"use client";

import {
  animate,
  motion,
  motionValue,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type Easing,
  type MotionValue,
} from "motion/react";
import Image from "next/image";
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useDialKit } from "dialkit";

import {
  INK_FILTER,
  MAGNIFIER_MEDIA,
  Magnifier,
  MagnifierIcon,
  MagnifierMark,
} from "@/components/Magnifier";
import { PHONE, useMedia } from "@/components/useMedia";

/**
 * The About card: the page the site opens on.
 *
 * It has two states, taken from the Figma frames (Section 3, 31110021–29):
 *
 * - The intro — one sentence saying who Devin is and where to find him, with
 *   his portrait peeking up from the bottom edge beside a "click to learn
 *   more" bubble, which hops now and then to say it can be clicked.
 * - The about — the portrait tossed up, spun once, landed, fanned out into
 *   seven copies that line up over a short bio and three links.
 *
 * `about` says which state to be in. The sequence between them plays on its
 * own once triggered (the bubble starts it); going back is a crossfade, not
 * the sequence in reverse.
 *
 * Positions are set in a 1440×1024 frame in Figma. Here they are offsets from
 * the section's centre, with vertical ones scaled to the section's height so
 * the toss keeps its shape on shorter screens.
 */

const LINKS = {
  linkedin: "https://www.linkedin.com/in/devin-hayden",
  x: "https://x.com/devinxhayden",
  email: "mailto:dhydn04@gmail.com",
};

const PORTRAIT = "/about/portrait.jpeg";
/** The card's outer size in the design, border included. */
const CARD = 95;
const FRAME_HEIGHT = 1024;

const EASE_OUT: Easing = [0.22, 1, 0.36, 1];
const EASE_IN_OUT: Easing = [0.65, 0, 0.35, 1];
/** Rising: quick off the ground, slowing to the top of the arc. */
const RISE: Easing = [0.25, 0.8, 0.4, 1];
/** Falling: gathering speed, then a soft catch. */
const FALL: Easing = [0.55, 0, 0.3, 1];

/** Frame 1: the portrait's centre sits 22px above the bottom edge. */
const PEEK_FROM_BOTTOM = 22.1;
const PEEK_ROTATE = -14.53;
/** Frames 3–7, as offsets from the frame's centre (before height scaling). */
const APEX_Y = -102.8;
const LAND_Y = 30.5;
/** Frame 8: the landed card rises a touch as the fan opens behind it. */
const FAN_Y = -0.5;

/**
 * Frame 8's fan: the six copies spread like a hand of cards, three a side,
 * each a step further round an arc whose pivot sits below the portrait.
 *
 * Built from the arc rather than read off the frame: the frame's mirrored
 * cards sat ~18px further out than their originals (where Figma measures a
 * flipped layer from), which left the fan lopsided, and its cards ran flat
 * where a fan curves away.
 */
/** Degrees each step turns, inner card first. */
const FAN_SPREAD = 14;
/** Distance from the pivot to a card's centre, at full card scale. */
const FAN_RADIUS = 170;
/** How much of the arc's drop to keep: 0 lays the fan flat, 1 is a true arc. */
const FAN_ARC = 0.6;
/** Shifts the whole fan up (−) or down (+) against the portrait. */
const FAN_LIFT = 0;

/** Where fan step `step` (1 = innermost) sits, on the left; mirror x for the right. */
function fanPose(
  step: number,
  fan: { spread: number; radius: number; arc: number; lift: number },
) {
  const angle = fan.spread * step;
  const radians = (angle * Math.PI) / 180;
  return {
    x: -fan.radius * Math.sin(radians),
    y: fan.radius * (1 - Math.cos(radians)) * fan.arc + fan.lift,
    rotate: -angle,
  };
}

/**
 * Every card, in paint order (later is on top): the outer fan cards sit over
 * the inner ones, and the portrait over all of them. `slot` is its place in
 * frame 9's row of seven, left to right; `photo` is the square snapshot it
 * shows (the portrait has its own crop). Left to right the row alternates
 * people and things, with the portrait in the middle: Yosemite, grad
 * friends, matcha, portrait, watercolor, the grad group, the café.
 */
const CARDS = [
  { fan: 0, side: "left", slot: 2, photo: "/about/matcha.jpg" },
  { fan: 0, side: "right", slot: 4, photo: "/about/watercolor.jpg" },
  { fan: 1, side: "left", slot: 1, photo: "/about/grad-friends.jpg" },
  { fan: 1, side: "right", slot: 5, photo: "/about/grad-group.jpg" },
  { fan: 2, side: "left", slot: 0, photo: "/about/yosemite.jpg" },
  { fan: 2, side: "right", slot: 6, photo: "/about/cafe.jpg" },
  { fan: null, side: null, slot: 3, photo: null },
] as const;
const PORTRAIT_CARD = CARDS.length - 1;

/** The sequence's beats, in seconds from the trigger. */
const T = {
  launch: 0.25,
  apex: 0.95,
  land: 1.4,
  fanStart: 1.5,
  fanEnd: 1.85,
  rowStart: 2.0,
  rowEnd: 2.6,
  /** Each card waits this much longer per step out from the centre. */
  rowStagger: 0.04,
  copyStart: 2.3,
  copyEnd: 3.0,
};
const FADE_OUT = 0.3;
const FADE_IN = 0.5;

/**
 * On a phone, seven cards across the screen would each be a thumbnail. The
 * row there is a strip of full-size cards running off both edges, the
 * portrait in the middle; once the cards land, it starts drifting sideways,
 * an endless carousel.
 */
/** A strip card's size, and the space after it, in px. */
const STRIP_CARD = 104;
const STRIP_GAP = 12;
/** One pass of the strip: seven cards and their gaps. */
const STRIP_PERIOD = CARDS.length * (STRIP_CARD + STRIP_GAP);
/** Seconds for one pass: an unhurried drift. */
const STRIP_SECONDS = 32;
/** Copies of the row after the first, so the drift never runs out. */
const STRIP_COPIES = 2;

/** The bubble's call for attention: a hop, every few seconds. */
const NUDGE_EVERY = 4;
const NUDGE_SIZE = 6;
const NUDGE_DURATION = 0.6;
/** The first one comes sooner, once the visitor has had a moment to look. */
const NUDGE_FIRST = 1.5;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

type Pose = { x: number; y: number; rotate: number; flip: number; scale: number };
type Geometry = {
  width: number;
  height: number;
  /** Vertical scale against the 1024px frame, for the toss. */
  k: number;
  /** Card scale before the row: phones get a narrower fan. */
  base: number;
  slots: { x: number; y: number; scale: number }[];
};

type CardMotion = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotate: MotionValue<number>;
  flip: MotionValue<number>;
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
};

/**
 * Animates one value through a list of `[time, value, ease]` beats, so each
 * track reads as a row of the timeline rather than a delay and a duration.
 */
function play(
  value: MotionValue<number>,
  beats: [number, number, Easing?][],
): AnimationPlaybackControls {
  const start = beats[0][0];
  const span = Math.max(0.001, beats[beats.length - 1][0] - start);
  return animate(
    value,
    beats.map(([, v]) => v),
    {
      delay: start,
      duration: span,
      times: beats.map(([t]) => (t - start) / span),
      ease: beats.slice(1).map(([, , ease]) => ease ?? EASE_OUT),
    },
  );
}

type Props = {
  /** Show the about state (true) or the intro (false). */
  about: boolean;
  /** The bubble was clicked: start the sequence. */
  onLearnMore?: () => void;
  /** The intro is on screen and settled, so the bubble may ask for a click. */
  attention?: boolean;
  /** The portrait has loaded: ready to reveal. */
  onReady?: () => void;
  /**
   * Raises the peeking portrait and its bubble by this many px. On a phone
   * the tab pill covers the bottom edge, and the portrait tucks in behind
   * it, so it peeks further to stay in view.
   */
  peekLift?: number;
};

export function LandingHero({
  about,
  onLearnMore,
  attention = false,
  onReady,
  peekLift = 0,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reduceMotion = useReducedMotion();
  /** Phones: the row is the drifting strip (see STRIP_CARD). */
  const strip = useMedia(PHONE);
  const stripRef = useRef(strip);
  useEffect(() => {
    stripRef.current = strip;
  });

  /** Settled states take pointer input; the ones in between take none. */
  const [phase, setPhase] = useState<"intro" | "toAbout" | "about" | "toIntro">(
    "intro",
  );
  const phaseRef = useRef(phase);
  const go = (next: typeof phase) => {
    phaseRef.current = next;
    setPhase(next);
  };
  const running = useRef<AnimationPlaybackControls[]>([]);

  // Live tuning (dev only).
  const dial = useDialKit(
    "About",
    {
      play: { type: "action", label: "Play" },
      toss: {
        apex: [APEX_Y, -400, 100, 1],
        turns: [1, 0, 3, 1],
      },
      fan: {
        spread: [FAN_SPREAD, 0, 40, 0.5],
        radius: [FAN_RADIUS, 40, 400, 1],
        arc: [FAN_ARC, 0, 1.5, 0.05],
        lift: [FAN_LIFT, -80, 80, 1],
        innerOnTop: true,
      },
      beats: {
        launch: [T.launch, 0, 3, 0.05],
        apex: [T.apex, 0, 3, 0.05],
        land: [T.land, 0, 4, 0.05],
        fanStart: [T.fanStart, 0, 4, 0.05],
        fanEnd: [T.fanEnd, 0, 4, 0.05],
        rowStart: [T.rowStart, 0, 5, 0.05],
        rowEnd: [T.rowEnd, 0, 5, 0.05],
        rowStagger: [T.rowStagger, 0, 0.3, 0.01],
        copyStart: [T.copyStart, 0, 5, 0.05],
        copyEnd: [T.copyEnd, 0, 6, 0.05],
        _collapsed: true,
      },
      back: {
        fadeOut: [FADE_OUT, 0, 1.5, 0.05],
        fadeIn: [FADE_IN, 0, 1.5, 0.05],
        _collapsed: true,
      },
      nudge: {
        style: { type: "select", options: ["bounce", "shake", "off"] },
        every: [NUDGE_EVERY, 1, 12, 0.5],
        size: [NUDGE_SIZE, 1, 20, 0.5],
        duration: [NUDGE_DURATION, 0.2, 1.5, 0.05],
        preview: { type: "action", label: "Nudge" },
      },
    },
    {
      id: "about",
      persist: true,
      onAction: (path) => {
        if (path === "play") {
          // Replays from the intro if the about is already up; otherwise
          // asks for it the way the bubble does, so the page stays in step.
          if (about) {
            settle("intro");
            toAbout();
          } else onLearnMore?.();
        }
        if (path === "nudge.preview") nudgeBubble();
      },
    },
  );

  const bubbleY = useMotionValue(0);
  const bubbleRotate = useMotionValue(0);
  const nudging = useRef<AnimationPlaybackControls>(null);
  /** One hop (or wag) of the bubble. */
  const nudgeBubble = () => {
    const { style, size, duration } = dial.nudge;
    nudging.current?.stop();
    if (style === "bounce") {
      nudging.current = animate(bubbleY, [0, -size, 0, -size * 0.35, 0], {
        duration,
        times: [0, 0.3, 0.55, 0.75, 1],
        ease: ["easeOut", "easeIn", "easeOut", "easeIn"],
      });
    } else if (style === "shake") {
      // Pivots on the tail, like a word said with a nod toward the portrait.
      nudging.current = animate(
        bubbleRotate,
        [0, -size, size * 0.8, -size * 0.5, size * 0.25, 0],
        { duration, ease: "easeInOut" },
      );
    }
  };
  const nudgeTick = useEffectEvent(() => nudgeBubble());

  const introOpacity = useMotionValue(1);
  const introY = useMotionValue(0);
  const copy = useMotionValue(0);

  // Hooks can't be called in a loop, so the seven cards' values are made
  // once, up front, and kept for the life of the component.
  const [cards] = useState<CardMotion[]>(() =>
    CARDS.map((_, i) => ({
      x: motionValue(0),
      y: motionValue(0),
      rotate: motionValue(0),
      flip: motionValue(1),
      scale: motionValue(1),
      opacity: motionValue(i === PORTRAIT_CARD ? 1 : 0),
    })),
  );

  // The bio's four blocks arrive one after another off one value.
  const headingOpacity = useTransform(copy, [0, 0.55], [0, 1]);
  const headingY = useTransform(copy, [0, 0.55], [12, 0]);
  const bioOpacity = useTransform(copy, [0.15, 0.7], [0, 1]);
  const bioY = useTransform(copy, [0.15, 0.7], [12, 0]);
  const nowOpacity = useTransform(copy, [0.3, 0.85], [0, 1]);
  const nowY = useTransform(copy, [0.3, 0.85], [12, 0]);
  const linksOpacity = useTransform(copy, [0.45, 1], [0, 1]);
  const linksY = useTransform(copy, [0.45, 1], [12, 0]);

  /**
   * Where everything goes at the current size. Read from layout, not the
   * screen: in the picker the whole scene is scaled down, and the poses are
   * set in the section's own, unscaled pixels.
   */
  const measure = (): Geometry | null => {
    const section = sectionRef.current;
    if (!section || section.offsetWidth === 0) return null;
    const width = section.offsetWidth;
    const height = section.offsetHeight;
    const rect = section.getBoundingClientRect();
    const ratio = rect.width / width || 1;
    const slots = slotRefs.current.map((slot) => {
      if (!slot) return { x: 0, y: 0, scale: 1 };
      const r = slot.getBoundingClientRect();
      return {
        x: (r.left + r.width / 2 - rect.left) / ratio - width / 2,
        y: (r.top + r.height / 2 - rect.top) / ratio - height / 2,
        scale: r.width / ratio / CARD,
      };
    });
    return {
      width,
      height,
      k: clamp(height / FRAME_HEIGHT, 0.6, 1.2),
      base: clamp((width - 32) / 420, 0.6, 1),
      slots,
    };
  };

  const peekPose = (g: Geometry): Pose => ({
    x: 0,
    y: g.height / 2 - PEEK_FROM_BOTTOM * g.base - peekLift,
    rotate: PEEK_ROTATE,
    flip: 1,
    scale: g.base,
  });
  const slotPose = (g: Geometry, i: number): Pose => {
    const slot = g.slots[CARDS[i].slot];
    return { x: slot.x, y: slot.y, rotate: 0, flip: 1, scale: slot.scale };
  };

  const setPose = (card: CardMotion, pose: Pose) => {
    card.x.set(pose.x);
    card.y.set(pose.y);
    card.rotate.set(pose.rotate);
    card.flip.set(pose.flip);
    card.scale.set(pose.scale);
  };

  const stopAll = () => {
    running.current.forEach((controls) => controls.stop());
    running.current = [];
  };

  /** Jumps straight to a settled state: first paint, resizes, reduced motion. */
  const settle = (state: "intro" | "about") => {
    const g = measure();
    if (!g) return;
    cards.forEach((card, i) => {
      if (state === "about") {
        setPose(card, slotPose(g, i));
        // On a phone the strip's own cards stand in for these once settled.
        card.opacity.set(stripRef.current ? 0 : 1);
      } else if (i === PORTRAIT_CARD) {
        setPose(card, peekPose(g));
        card.opacity.set(1);
      } else {
        card.opacity.set(0);
      }
    });
    introOpacity.set(state === "intro" ? 1 : 0);
    introY.set(0);
    copy.set(state === "about" ? 1 : 0);
  };

  const toAbout = () => {
    const g = measure();
    if (!g) return;
    stopAll();
    go("toAbout");
    if (reduceMotion) {
      settle("about");
      go("about");
      return;
    }

    const { k, base } = g;
    const { beats, toss } = dial;
    const tracks: AnimationPlaybackControls[] = [];
    const add = (controls: AnimationPlaybackControls) => tracks.push(controls);

    // Frames 1→3: the sentence lifts away as it fades, the bubble just fades.
    add(play(introOpacity, [[0, introOpacity.get()], [0.6, 0, EASE_IN_OUT]]));
    add(play(introY, [[0, introY.get()], [0.35, -52], [0.6, -90, EASE_IN_OUT]]));

    // Frames 2→7: the portrait is tossed, turns once, and lands.
    const portrait = cards[PORTRAIT_CARD];
    const peek = peekPose(g);
    setPose(portrait, peek);
    portrait.opacity.set(1);
    const final = slotPose(g, PORTRAIT_CARD);
    add(
      play(portrait.y, [
        [beats.launch, peek.y],
        [beats.apex, toss.apex * k, RISE],
        [beats.land, LAND_Y * k, FALL],
        [beats.fanStart, LAND_Y * k],
        [beats.fanEnd, FAN_Y * k],
        [beats.rowStart, FAN_Y * k],
        [beats.rowEnd, final.y, EASE_IN_OUT],
      ]),
    );
    add(play(portrait.x, [[beats.rowStart, 0], [beats.rowEnd, final.x, EASE_IN_OUT]]));
    add(
      play(portrait.rotate, [
        [beats.launch, PEEK_ROTATE],
        [beats.land, -360 * toss.turns, [0.3, 0.15, 0.25, 1]],
      ]),
    );
    add(play(portrait.scale, [[beats.rowStart, base], [beats.rowEnd, final.scale, EASE_IN_OUT]]));

    // Frame 8: six copies fan out from behind it, the outer ones last.
    // Frame 9: everything lines up in the row, the mirrored ones turning
    // face-forward on the way — a card flip.
    CARDS.forEach((spec, i) => {
      if (spec.fan === null) return;
      const card = cards[i];
      const mirrored = spec.side === "right";
      // Measured from the portrait, so the fan opens around wherever it lands.
      const pose = fanPose(spec.fan + 1, dial.fan);
      const at = {
        x: (mirrored ? -pose.x : pose.x) * base,
        y: FAN_Y * k + pose.y * base,
      };
      // A mirrored card's flip turns its rotation the other way on screen,
      // so both sides take the same value and come out symmetric.
      const fan = { rotate: pose.rotate };
      const fanEnd = beats.fanEnd + spec.fan * 0.05;
      const rowStart = beats.rowStart + (spec.fan + 1) * beats.rowStagger;
      const rowEnd = beats.rowEnd + (spec.fan + 1) * beats.rowStagger;
      const slot = slotPose(g, i);

      setPose(card, {
        x: 0,
        y: LAND_Y * k,
        rotate: 0,
        flip: mirrored ? -1 : 1,
        scale: base,
      });
      card.opacity.set(0);
      add(play(card.opacity, [[beats.fanStart, 0], [beats.fanStart + 0.01, 1]]));
      add(
        play(card.x, [
          [beats.fanStart, 0],
          [fanEnd, at.x],
          [rowStart, at.x],
          [rowEnd, slot.x, EASE_IN_OUT],
        ]),
      );
      add(
        play(card.y, [
          [beats.fanStart, LAND_Y * k],
          [fanEnd, at.y],
          [rowStart, at.y],
          [rowEnd, slot.y, EASE_IN_OUT],
        ]),
      );
      add(
        play(card.rotate, [
          [beats.fanStart, 0],
          [fanEnd, fan.rotate],
          [rowStart, fan.rotate],
          [rowEnd, 0, EASE_IN_OUT],
        ]),
      );
      if (mirrored)
        add(play(card.flip, [[rowStart, -1], [rowEnd, 1, EASE_IN_OUT]]));
      add(play(card.scale, [[rowStart, base], [rowEnd, slot.scale, EASE_IN_OUT]]));
    });

    // And the bio comes up under the row.
    add(play(copy, [[beats.copyStart, 0], [beats.copyEnd, 1, "linear"]]));

    running.current = tracks;
    Promise.all(tracks.map((controls) => controls.finished)).then(() => {
      if (phaseRef.current !== "toAbout") return;
      cards[PORTRAIT_CARD].rotate.set(0);
      go("about");
    });
  };

  const toIntro = () => {
    stopAll();
    go("toIntro");
    if (reduceMotion) {
      settle("intro");
      go("intro");
      return;
    }

    // Everything on screen fades where it stands...
    const out = [
      animate(copy, 0, { duration: dial.back.fadeOut, ease: EASE_OUT }),
      animate(introOpacity, 0, { duration: dial.back.fadeOut / 2 }),
      ...cards.map((card) =>
        animate(card.opacity, 0, { duration: dial.back.fadeOut, ease: EASE_OUT }),
      ),
    ];
    running.current = out;
    Promise.all(out.map((controls) => controls.finished)).then(() => {
      if (phaseRef.current !== "toIntro") return;
      const g = measure();
      if (!g) return;

      // ...and the intro comes back as it was, the portrait rising into its
      // peek from just below.
      const peek = peekPose(g);
      setPose(cards[PORTRAIT_CARD], { ...peek, y: peek.y + 40 });
      introY.set(16);
      const back = [
        animate(introOpacity, 1, { duration: dial.back.fadeIn, ease: EASE_OUT }),
        animate(introY, 0, { duration: dial.back.fadeIn, ease: EASE_OUT }),
        animate(cards[PORTRAIT_CARD].opacity, 1, { duration: dial.back.fadeIn, ease: EASE_OUT }),
        animate(cards[PORTRAIT_CARD].y, peek.y, { duration: dial.back.fadeIn, ease: EASE_OUT }),
      ];
      running.current = back;
      Promise.all(back.map((controls) => controls.finished)).then(() => {
        if (phaseRef.current === "toIntro") go("intro");
      });
    });
  };

  // Place the portrait before the first paint, and keep the settled state
  // right as the section changes size.
  useLayoutEffect(() => {
    settle("intro");
    const section = sectionRef.current;
    if (!section) return;
    const observer = new ResizeObserver(() => {
      const current = phaseRef.current;
      if (current === "intro" || current === "about") settle(current);
    });
    observer.observe(section);
    return () => {
      observer.disconnect();
      stopAll();
    };
    // `settle` reads only refs and stable motion values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const current = phaseRef.current;
    if (about && (current === "intro" || current === "toIntro")) toAbout();
    if (!about && (current === "about" || current === "toAbout")) toIntro();
    // The transitions read refs; only the requested state should start one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [about]);

  const introLive = phase === "intro";

  // The magnifier: desktop only, and only while the intro is up and settled.
  // "out" is in the hand; "back" is on its way into the sentence.
  const magnifiable = useMedia(MAGNIFIER_MEDIA);
  const iconRef = useRef<HTMLButtonElement>(null);
  const [glass, setGlass] = useState<"off" | "out" | "back">("off");
  // Leaving the intro (the bubble, a scroll into the picker) puts it back.
  const glassOut = glass === "out" && attention && introLive;

  // Every few seconds while the intro waits, the bubble hops to say it can
  // be clicked. It waits for the visitor to settle on the card, and stays
  // still for anyone who asked for less motion.
  const nudgeStyle = dial.nudge.style;
  const nudgeEvery = dial.nudge.every;
  useEffect(() => {
    if (!attention || !introLive || reduceMotion || nudgeStyle === "off")
      return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const first = setTimeout(
      () => {
        nudgeTick();
        interval = setInterval(nudgeTick, nudgeEvery * 1000);
      },
      Math.min(NUDGE_FIRST, nudgeEvery) * 1000,
    );
    return () => {
      clearTimeout(first);
      clearInterval(interval);
      nudging.current?.stop();
      bubbleY.set(0);
      bubbleRotate.set(0);
    };
  }, [attention, introLive, reduceMotion, nudgeStyle, nudgeEvery, bubbleY, bubbleRotate]);
  const aboutLive = phase === "about";

  // The handoff to the strip: the moving cards have landed exactly where
  // its first copy sits, so they hide as it appears and nothing shifts.
  useLayoutEffect(() => {
    if (!strip) return;
    if (phase === "about") cards.forEach((card) => card.opacity.set(0));
  }, [strip, phase, cards]);

  return (
    <section
      ref={sectionRef}
      aria-label="About Devin"
      className={`text-ink page-ground relative size-full overflow-hidden ${glassOut ? "cursor-none [&_*]:cursor-none!" : ""}`}
    >
      {/* Frame 1: the sentence, centred. */}
      <motion.div
        inert={!introLive}
        aria-hidden={!introLive && phase !== "toIntro"}
        style={{ opacity: introOpacity, y: introY }}
        className="absolute inset-0 flex items-center justify-center px-4"
      >
        <Sentence
          slot={
            magnifiable && (
              <MagnifierIcon
                ref={iconRef}
                away={glass !== "off"}
                onClick={() => setGlass("out")}
              />
            )
          }
        />
      </motion.div>

      {/* The bubble beside the peeking portrait, its tail toward it. */}
      <motion.button
        type="button"
        inert={!introLive}
        onClick={onLearnMore}
        style={{
          opacity: introOpacity,
          y: bubbleY,
          rotate: bubbleRotate,
          originX: 0,
          originY: 1,
          bottom: 80 + peekLift,
        }}
        className="text-ink absolute left-[calc(50%+58px)] z-20 cursor-pointer rounded-t-[8px] rounded-br-[8px] border border-[#ececec] bg-[rgba(213,213,213,0.2)] px-4 py-2 font-mono text-[12px] leading-[1.5] tracking-[-0.03em] whitespace-nowrap uppercase transition-colors hover:bg-[rgba(213,213,213,0.35)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink max-sm:left-auto max-sm:right-4"
      >
        <span className="pointer-coarse:hidden">Click to learn more!</span>
        <span className="hidden pointer-coarse:inline">Tap to learn more!</span>
      </motion.button>

      {/* Frame 9: the row the cards land in, and the bio under it. The row
          is empty: its slots only say where the cards go. */}
      <div
        inert={!aboutLive}
        aria-hidden={!aboutLive && phase !== "toAbout"}
        className="absolute inset-0 flex flex-col items-center justify-center px-4 pt-[clamp(48px,9svh,90px)] pb-6 text-center"
      >
        {strip ? (
          // One copy's width, centred, so the portrait's slot is mid-screen;
          // the track runs on past it to the right, and drifts left.
          <div
            style={{ width: STRIP_PERIOD - STRIP_GAP }}
            className="shrink-0"
          >
            <div
              style={
                {
                  "--strip-period": `${STRIP_PERIOD}px`,
                  animationDuration: `${STRIP_SECONDS}s`,
                } as React.CSSProperties
              }
              className={`flex w-max ${
                aboutLive && !reduceMotion ? "about-strip" : ""
              }`}
            >
              {Array.from({ length: STRIP_COPIES + 1 }, (_, copy) =>
                [...CARDS]
                  .map((card, i) => ({ card, i }))
                  .sort((a, b) => a.card.slot - b.card.slot)
                  .map(({ card, i }) => (
                    <div
                      key={`${copy}-${card.slot}`}
                      ref={
                        copy === 0
                          ? (el) => {
                              slotRefs.current[card.slot] = el;
                            }
                          : undefined
                      }
                      style={{
                        width: STRIP_CARD,
                        height: STRIP_CARD,
                        marginRight: STRIP_GAP,
                      }}
                      className={`shrink-0 ${
                        aboutLive
                          ? "opacity-100"
                          : "opacity-0 transition-opacity duration-300"
                      }`}
                    >
                      <div
                        style={{
                          transform: `scale(${STRIP_CARD / CARD})`,
                          transformOrigin: "top left",
                        }}
                      >
                        <CardFace index={i} />
                      </div>
                    </div>
                  )),
              )}
            </div>
          </div>
        ) : (
          <div className="grid w-full max-w-[875px] grid-cols-7 gap-x-[clamp(6px,2.43vw,35px)]">
            {CARDS.map((_, slot) => (
              <div
                key={slot}
                ref={(el) => {
                  slotRefs.current[slot] = el;
                }}
                className="aspect-square"
              />
            ))}
          </div>
        )}

        <motion.h2
          style={{ opacity: headingOpacity, y: headingY }}
          className="type-display mt-[clamp(28px,7.5svh,77px)]"
        >
          Hi, I’m Devin!
        </motion.h2>
        <motion.p
          style={{ opacity: bioOpacity, y: bioY }}
          className="font-ui text-[clamp(1rem,4.2vw,1.125rem)] leading-[1.6] tracking-[-0.005em] text-pretty mt-[clamp(12px,2.8svh,29px)] max-w-[522px]"
        >
          As a creative, I’ve always been drawn away from one specific niche.
          Moving between product, design, and photo allows me to stretch
          creative muscles to bring any kind of experience to life, whether
          it’s a digital interaction or physical environment.
        </motion.p>
        <motion.p
          style={{ opacity: nowOpacity, y: nowY }}
          className="font-ui text-[clamp(1rem,4.2vw,1.125rem)] leading-[1.6] tracking-[-0.005em] text-pretty mt-[clamp(20px,5svh,52px)] max-w-[522px]"
        >
          Currently, I’m exploring Creative Tech @ NRG Experiential.
          Previously, I studied Cognitive Science @ USC and contributed to UX
          Design @ Trimble.
        </motion.p>
        <motion.ul
          style={{ opacity: linksOpacity, y: linksY }}
          className="mt-[clamp(28px,7.5svh,77px)] flex flex-wrap justify-center gap-x-[28px] gap-y-2 font-mono text-[13px] leading-[1.5] tracking-[-0.02em] uppercase sm:text-[14px]"
        >
          <li>
            <TextLink href={LINKS.linkedin}>LinkedIn</TextLink>
          </li>
          <li>
            <TextLink href={LINKS.x}>X/Twitter</TextLink>
          </li>
          <li>
            <TextLink href={LINKS.email}>Email</TextLink>
          </li>
        </motion.ul>
      </div>

      {/* The cards themselves: the portrait and six snapshots, positioned from
          the section's centre. Above the copy so the toss passes over it. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            style={{
              x: card.x,
              y: card.y,
              rotate: card.rotate,
              scaleX: card.flip,
              scale: card.scale,
              opacity: card.opacity,
              // Stacked like a held hand: the portrait on top, each copy
              // under the one inside it. Off, the outer cards cover the inner.
              zIndex: CARDS[i].fan === null ? 4 : dial.fan.innerOnTop ? 3 - CARDS[i].fan : undefined,
            }}
            className="absolute top-1/2 left-1/2 -mt-[47.5px] -ml-[47.5px]"
          >
            <CardFace index={i} onLoad={i === PORTRAIT_CARD ? onReady : undefined} />
          </motion.div>
        ))}
      </div>

      {magnifiable && glass !== "off" && (
        <Magnifier
          out={glassOut}
          onClose={() => setGlass("back")}
          onReturned={() => setGlass("off")}
          sectionRef={sectionRef}
          iconRef={iconRef}
        >
          <LensScene
            portrait={cards[PORTRAIT_CARD]}
            bubbleY={bubbleY}
            bubbleRotate={bubbleRotate}
            peekLift={peekLift}
          />
        </Magnifier>
      )}
    </section>
  );
}

/**
 * One card as it looks at rest: a 95px print with a pale frame, showing its
 * snapshot, or the portrait cropped to head and shoulders. The tossed cards
 * and the phone's strip share it, so the handoff between them is exact.
 */
function CardFace({ index, onLoad }: { index: number; onLoad?: () => void }) {
  const photo = CARDS[index].photo;
  return (
    <div className="relative size-[95px] rounded-[8px] border-8 border-[#f7f7f7] bg-[#f7f7f7]">
      <div className="absolute inset-0 overflow-hidden rounded-[8px]">
        {photo ? (
          <Image
            src={photo}
            alt=""
            fill
            sizes="240px"
            loading="eager"
            className="object-cover"
          />
        ) : (
          // The crop the design uses: the head and shoulders of a
          // portrait-format photo.
          <div className="absolute top-[-35.46%] left-[-27.75%] h-[232.89%] w-[155.28%]">
            <Image
              src={PORTRAIT}
              alt=""
              fill
              sizes="240px"
              loading="eager"
              onLoad={onLoad}
              className="object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The intro's one sentence. `slot` is the magnifier's icon, after "closer
 * look", on screens that get the glass. `ghost` is the copy drawn under the
 * glass: the same layout, but nothing in it is a link.
 */
function Sentence({
  slot,
  ghost = false,
  className = "",
  style,
}: {
  slot?: ReactNode;
  ghost?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <p
      style={style}
      className={`max-w-[612px] text-center font-serif text-[clamp(1.5rem,6.4vw,2rem)] leading-[1.5] font-normal tracking-[-0.03em] ${className}`}
    >
      Devin is a creative crafting moments worth a closer{" "}
      <span className="whitespace-nowrap">
        look
        {slot}
        ,
      </span>{" "}
      on screen and off. You can learn more about him on{" "}
      {/* Each mark is held to its punctuation, so a line never starts
          with a stray comma. */}
      <span className="whitespace-nowrap">
        <InlineIcon
          href={LINKS.linkedin}
          label="Devin on LinkedIn"
          src="/social/linkedin.png"
          ghost={ghost}
        />
        ,
      </span>{" "}
      check out more of his work on{" "}
      <span className="whitespace-nowrap">
        <InlineIcon
          href={LINKS.x}
          label="Devin on X"
          src="/social/x.png"
          ghost={ghost}
        />
        ,
      </span>{" "}
      or reach him via{" "}
      <span className="whitespace-nowrap">
        <InlineIcon
          href={LINKS.email}
          label="Email Devin"
          src="/social/gmail.png"
          ghost={ghost}
        />
        .
      </span>
    </p>
  );
}

/**
 * Everything the intro shows, again, for under the magnifier: the sentence,
 * the peeking portrait and its bubble, on the same motion values as the real
 * ones so they stay in step. The text is drawn twice — once with the ink
 * filter and the icons hidden, once with only the icons — so the ink bleeds
 * but the app icons stay as crisp as stickers.
 */
function LensScene({
  portrait,
  bubbleY,
  bubbleRotate,
  peekLift,
}: {
  portrait: CardMotion;
  bubbleY: MotionValue<number>;
  bubbleRotate: MotionValue<number>;
  peekLift: number;
}) {
  const slot = (
    <span className="invisible relative -top-[0.07em] ml-[0.2em] mr-[0.12em] inline-block align-middle">
      <MagnifierMark />
    </span>
  );
  const layer = "absolute inset-0 flex items-center justify-center px-4";
  return (
    <>
      <div className={`${layer} text-ink`}>
        <Sentence
          ghost
          slot={slot}
          className="[&_img]:invisible"
          style={{ filter: `url(#${INK_FILTER})` }}
        />
      </div>
      <div className={`${layer} text-transparent`}>
        <Sentence ghost slot={slot} />
      </div>
      <motion.div
        style={{
          x: portrait.x,
          y: portrait.y,
          rotate: portrait.rotate,
          scaleX: portrait.flip,
          scale: portrait.scale,
        }}
        className="absolute top-1/2 left-1/2 -mt-[47.5px] -ml-[47.5px]"
      >
        <CardFace index={PORTRAIT_CARD} />
      </motion.div>
      <motion.div
        style={{
          y: bubbleY,
          rotate: bubbleRotate,
          originX: 0,
          originY: 1,
          bottom: 80 + peekLift,
          filter: `url(#${INK_FILTER})`,
        }}
        className="text-ink absolute left-[calc(50%+58px)] rounded-t-[8px] rounded-br-[8px] border border-[#ececec] bg-[rgba(213,213,213,0.2)] px-4 py-2 font-mono text-[12px] leading-[1.5] tracking-[-0.03em] whitespace-nowrap uppercase"
      >
        Click to learn more!
      </motion.div>
    </>
  );
}

const iconLink =
  "inline-block align-middle rounded-[0.1em] transition-transform duration-200 ease-out hover:-translate-y-[0.06em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";

function InlineIcon({
  href,
  label,
  src,
  ghost = false,
}: {
  href: string;
  label: string;
  src: string;
  ghost?: boolean;
}) {
  const external = href.startsWith("http");
  if (ghost) {
    return (
      <span className={`${iconLink} relative -top-[0.07em] mx-[0.12em]`}>
        <Image
          src={src}
          alt=""
          width={32}
          height={32}
          className="block size-[1em] rounded-[0.1em]"
        />
      </span>
    );
  }
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      className={`${iconLink} relative -top-[0.07em] mx-[0.12em]`}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      <Image
        src={src}
        alt=""
        width={32}
        height={32}
        className="block size-[1em] rounded-[0.1em]"
      />
    </a>
  );
}

/**
 * A way out to elsewhere, in the site's utility voice (DM Mono, as the
 * labels and captions are), with an arrow that nudges up and out on hover.
 */
function TextLink({ href, children }: { href: string; children: string }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className="group/link decoration-ink/30 inline-flex items-center gap-1.5 rounded-sm underline-offset-4 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
      <svg
        aria-hidden
        width="9"
        height="9"
        viewBox="0 0 10 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 transition-transform duration-200 ease-out group-hover/link:translate-x-[1.5px] group-hover/link:-translate-y-[1.5px] motion-reduce:transition-none"
      >
        <path d="M2.5 7.5l5-5M3.5 2.5h4v4" />
      </svg>
    </a>
  );
}
