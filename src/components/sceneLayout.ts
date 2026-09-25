"use client";

import { useMotionValue } from "motion/react";
import { type RefObject, useEffect, useState } from "react";

/**
 * Geometry for the collapsed state, derived from the Figma frames. The three
 * frames are one uniform transform apart — the container, the lens window, the
 * headline and the links all shrink by the same factor — so the whole scene
 * collapses with a single scale, and only the carousel is laid out in real
 * pixels underneath it.
 */

/** 1024.875px of container inside a 1440px viewport. */
export const COLLAPSED_SCALE = 1024.875 / 1440;
/** Phones need a gentler collapse, or the 18px headline lands under 14px. */
const COLLAPSED_SCALE_SM = 0.78;
const SMALL_VIEWPORT = 640;

/** Container corner radius, measured after the collapse. */
export const CONTAINER_RADIUS = 24;

/** Five thumbnails and four gutters span the container exactly. */
const GUTTER_RATIO = 78.704 / 1024.875;
const THUMB_ASPECT = 3 / 2;
/** Space between the container's bottom edge and the carousel. */
const CAROUSEL_GAP_RATIO = 50.2 / 1024;
/** Figma leaves 89px above the container and 61.8px below the carousel. */
const BOTTOM_TO_TOP_RATIO = 61.8 / 89;
/** Keep the scene off the edge on viewports too short for the full spacing. */
const MIN_TOP = 8;

export type SceneLayout = {
  /** Scale of the collapsed scene. */
  scale: number;
  /** How far the collapsed scene lifts to clear room for the carousel, in px. */
  shiftY: number;
  trackWidth: number;
  thumbWidth: number;
  thumbHeight: number;
  gutter: number;
  carouselTop: number;
  /** Where the carousel waits, just past the stage's bottom edge. */
  carouselRestY: number;
};

function measure(width: number, height: number): SceneLayout {
  const small = width < SMALL_VIEWPORT;
  const scale = small ? COLLAPSED_SCALE_SM : COLLAPSED_SCALE;
  // A phone fits three thumbnails across; the rest are a swipe away.
  const columns = small ? 3 : 5;

  const trackWidth = width * scale;
  const gutter = trackWidth * GUTTER_RATIO;
  const thumbWidth = (trackWidth - gutter * (columns - 1)) / columns;
  const thumbHeight = thumbWidth / THUMB_ASPECT;

  const gap = height * CAROUSEL_GAP_RATIO;
  const free = height * (1 - scale) - gap - thumbHeight;
  const top = Math.max(MIN_TOP, free / (1 + BOTTOM_TO_TOP_RATIO));
  const carouselTop = top + height * scale + gap;

  return {
    scale,
    shiftY: top - (height * (1 - scale)) / 2,
    trackWidth,
    thumbWidth,
    thumbHeight,
    gutter,
    carouselTop,
    // Far enough down for the stage's clip to hide it, shadow included.
    carouselRestY: height - carouselTop + thumbHeight * 0.25,
  };
}

/**
 * Measures the pinned stage rather than the window: on mobile the stage is
 * sized in `svh`, which does not track `window.innerHeight`.
 */
export function useSceneLayout(stageRef: RefObject<HTMLElement | null>) {
  const [layout, setLayout] = useState<SceneLayout | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () =>
      setLayout(measure(stage.clientWidth, stage.clientHeight));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [stageRef]);

  return layout;
}

/**
 * Progress through the pinned runway, 0 to 1.
 *
 * This is deliberately hand-rolled rather than `useScroll({ target })`: when
 * the browser restores a scroll position on reload, motion measures the
 * runway before the restore lands and the returned value stays pinned at 0
 * for the life of the page — the scene renders its opening frame while the
 * document sits at the bottom, and no amount of scrolling recovers it. The
 * geometry here is trivial enough to read directly, and a plain motion value
 * also keeps it off the ViewTimeline path that mangles scroll-linked opacity.
 */
export function useRunwayProgress(
  runwayRef: RefObject<HTMLElement | null>,
  stageRef: RefObject<HTMLElement | null>,
) {
  const progress = useMotionValue(0);

  useEffect(() => {
    const runway = runwayRef.current;
    const stage = stageRef.current;
    if (!runway || !stage) return;

    // The stage stays pinned for everything past its own height.
    let distance = 1;
    const update = () => {
      const travelled = window.scrollY - runway.offsetTop;
      progress.set(Math.min(1, Math.max(0, travelled / distance)));
    };
    const remeasure = () => {
      distance = Math.max(1, runway.offsetHeight - stage.offsetHeight);
      update();
    };

    remeasure();
    window.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(remeasure);
    observer.observe(runway);
    observer.observe(stage);
    return () => {
      window.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [runwayRef, stageRef, progress]);

  return progress;
}
