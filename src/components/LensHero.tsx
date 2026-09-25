"use client";

import Image from "next/image";
import {
  animate,
  correctParentTransform,
  frame,
  motion,
  MotionConfig,
  useDragControls,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { glitchSeed } from "@/components/glitch";
import { createLensRenderer, type LensParams } from "@/components/lensRenderer";
import { createPhotoTransition } from "@/components/photoTransition";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { PHOTOS } from "@/components/photos";
import {
  COLLAPSED_SCALE,
  CONTAINER_RADIUS,
  useRunwayProgress,
  useSceneLayout,
} from "@/components/sceneLayout";

/** Values from the Figma "Lens distortion" effect on the hero window. */
const LENS: LensParams = {
  distortionStrength: 0.12,
  aberrationStrength: 0.06,
  quality: 1,
};

const EMAIL = "dhydn04@gmail.com";
const KEY_STEP = 24;
/** Reveal anyway if something stalls, falling back to the CSS window. */
const LOAD_TIMEOUT_MS = 6000;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Scroll progress at which the scene has finished shrinking… */
const COLLAPSE_END = 0.55;
/** …and at which it starts lifting to clear room for the carousel. */
const LIFT_START = 0.64;
const CAROUSEL_START = LIFT_START + 0.06;
/** Long enough for the tear to read, short enough to feel like a cut. */
const SWAP_DURATION = 0.62;

const linkClass =
  "transition-opacity hover:opacity-70 focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white";

/** Resolves once the photo can be drawn, however far along it already is. */
function decoded(image: HTMLImageElement) {
  const loaded = image.complete
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
  return loaded.then(() => image.decode().catch(() => {}));
}

export function LensHero() {
  const runwayRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const photoRefs = useRef(new Map<number, HTMLImageElement>());
  /** Kept past unmount: it seeds the lens texture for the life of the page. */
  const firstPhotoRef = useRef<HTMLImageElement>(null);
  const rendererRef = useRef<ReturnType<typeof createLensRenderer>>(null);
  const swapAnimation = useRef<AnimationPlaybackControls>(null);

  const glitchCanvasRef = useRef<HTMLCanvasElement>(null);
  const glitchRef = useRef<ReturnType<typeof createPhotoTransition>>(null);
  const seedRef = useRef(0);
  const [glitching, setGlitching] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  /** Crossfade between the photo on screen and the one the carousel picked. */
  const swap = useMotionValue(0);
  const dragControls = useDragControls();

  const reduceMotion = useReducedMotion();
  // Drag deltas arrive in page pixels; without this the window trails the
  // cursor by the collapse scale once the scene has shrunk.
  const transformPagePoint = useMemo(
    () =>
      // Built per event so the ref is only read once a pointer is down.
      (point: { x: number; y: number }) =>
        correctParentTransform(sceneRef)(point),
    [],
  );

  const [photoReady, setPhotoReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [lens, setLens] = useState<"pending" | "ready" | "failed">("pending");
  const [timedOut, setTimedOut] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  // The photo on screen, and the one fading in over it during a swap.
  const [base, setBase] = useState(0);
  const [top, setTop] = useState<number | null>(null);
  const active = top ?? base;
  const layers = top === null ? [base] : [base, top];

  const [carouselOpen, setCarouselOpen] = useState(false);

  const layout = useSceneLayout(stageRef);
  const collapsedScale = layout?.scale ?? COLLAPSED_SCALE;

  const scrollYProgress = useRunwayProgress(runwayRef, stageRef);

  // The whole scene — photo, window, headline, links — collapses as one
  // transform, then lifts to open a gap for the carousel beneath it.
  const sceneScale = useTransform(
    scrollYProgress,
    [0, COLLAPSE_END],
    [1, collapsedScale],
    { clamp: true },
  );
  const sceneY = useTransform(
    scrollYProgress,
    [LIFT_START, 1],
    [0, layout?.shiftY ?? 0],
    { clamp: true },
  );
  // Rounds to CONTAINER_RADIUS once the collapse has scaled it down.
  const frameRadius = useTransform(
    scrollYProgress,
    [0, COLLAPSE_END],
    [0, CONTAINER_RADIUS / collapsedScale],
    { clamp: true },
  );
  // The carousel rises into the gap the lift opens, from just below the
  // stage's clip. Sliding rather than fading is deliberate: motion hands a
  // lone scroll-linked opacity to a ViewTimeline, which ignores the input
  // range and leaves the value stuck.
  const carouselY = useTransform(
    scrollYProgress,
    [LIFT_START, 0.96],
    [layout?.carouselRestY ?? 0, 0],
    { clamp: true },
  );

  // A short ramp at each end: the glitch is flat there, so the canvas can
  // appear and leave without a seam against the photo underneath.
  const glitchOpacity = useTransform(swap, [0, 0.06, 0.94, 1], [0, 1, 1, 0]);

  useMotionValueEvent(scrollYProgress, "change", (progress) =>
    setCarouselOpen(progress > CAROUSEL_START),
  );

  // Hold the whole scene back until the photo is decoded, the fonts are in,
  // and the lens has drawn its first frame, then reveal it in one sequence.
  const ready = timedOut || (photoReady && fontsReady && lens !== "pending");

  const registerPhoto = (index: number) => (el: HTMLImageElement | null) => {
    if (el) {
      photoRefs.current.set(index, el);
      if (index === 0) firstPhotoRef.current = el;
    } else {
      photoRefs.current.delete(index);
    }
  };

  const handlePhotoLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const photo = event.currentTarget;
    photo
      .decode()
      .catch(() => {})
      .then(() => setPhotoReady(true));
  };

  useEffect(() => {
    const first = firstPhotoRef.current;
    if (first?.complete) decoded(first).then(() => setPhotoReady(true));
    document.fonts.ready.then(() => setFontsReady(true));
    const timeout = setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const photo = firstPhotoRef.current;
    const stage = frameRef.current;
    const win = windowRef.current;
    const canvas = canvasRef.current;
    if (!photoReady || !photo || !stage || !win || !canvas) return;

    let renderer: ReturnType<typeof createLensRenderer> = null;
    try {
      renderer = createLensRenderer(canvas, photo, LENS);
    } catch (error) {
      console.error(error);
    }
    if (!renderer) {
      setLens("failed");
      return;
    }
    const lens = renderer;
    rendererRef.current = lens;

    // The window's untransformed layout position; drag offsets add to it.
    const layout = { left: 0, top: 0, width: 0, height: 0 };
    const viewport = { width: 0, height: 0 };

    // Everything is measured in the scene's own unscaled space, so the
    // collapse never touches the lens: the shader keeps drawing the window at
    // full size and the scroll transform simply scales the canvas down.
    const measure = () => {
      const stageRect = stage.getBoundingClientRect();
      const scale = stageRect.width / stage.offsetWidth || 1;
      const rect = win.getBoundingClientRect();
      layout.left = (rect.left - stageRect.left) / scale - x.get();
      layout.top = (rect.top - stageRect.top) / scale - y.get();
      layout.width = win.offsetWidth;
      layout.height = win.offsetHeight;
      viewport.width = stage.offsetWidth;
      viewport.height = stage.offsetHeight;
    };

    const draw = () =>
      lens.render({
        x: layout.left + x.get(),
        y: layout.top + y.get(),
        width: layout.width,
        height: layout.height,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        mix: swap.get(),
        glitchSeed: seedRef.current,
      });

    const schedule = () => frame.render(draw);
    const remeasure = () => {
      measure();
      schedule();
    };

    measure();
    draw();
    setLens("ready");

    const resizeObserver = new ResizeObserver(remeasure);
    resizeObserver.observe(win);
    resizeObserver.observe(stage);
    window.addEventListener("resize", remeasure);
    const unsubscribeX = x.on("change", schedule);
    const unsubscribeY = y.on("change", schedule);
    const unsubscribeSwap = swap.on("change", schedule);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", remeasure);
      unsubscribeX();
      unsubscribeY();
      unsubscribeSwap();
      lens.dispose();
      rendererRef.current = null;
      setLens("pending");
    };
  }, [photoReady, x, y, swap]);

  // Runs the swap once the incoming photo has decoded. Background, window and
  // glitch all read the same `swap` value, so they tear in step.
  useEffect(() => {
    if (top === null) return;
    const image = photoRefs.current.get(top);
    if (!image) return;

    let cancelled = false;
    decoded(image).then(() => {
      if (cancelled) return;
      rendererRef.current?.setNextPhoto(image);

      const outgoing = photoRefs.current.get(base);
      const canvas = glitchCanvasRef.current;
      const frameEl = frameRef.current;
      if (!reduceMotion && outgoing && canvas && frameEl) {
        if (!glitchRef.current) {
          try {
            glitchRef.current = createPhotoTransition(canvas);
          } catch (error) {
            console.error(error);
          }
        }
        const glitch = glitchRef.current;
        if (glitch) {
          glitch.setPhotos(outgoing, image);
          setGlitching(true);
          // Draw frame zero now: it matches the photo underneath, so the
          // canvas can appear without a seam.
          glitch.render({
            progress: 0,
            seed: seedRef.current,
            width: frameEl.offsetWidth,
            height: frameEl.offsetHeight,
          });
        }
      }

      swapAnimation.current = animate(swap, 1, {
        duration: reduceMotion ? 0 : SWAP_DURATION,
        ease: "linear",
        onComplete: () => {
          setGlitching(false);
          setBase(top);
          setTop(null);
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [top, base, swap, reduceMotion]);

  // Redraws the channel change as the swap runs.
  useEffect(() => {
    if (!glitching) return;
    const draw = () => {
      const glitch = glitchRef.current;
      const frameEl = frameRef.current;
      if (!glitch || !frameEl) return;
      glitch.render({
        progress: swap.get(),
        seed: seedRef.current,
        width: frameEl.offsetWidth,
        height: frameEl.offsetHeight,
      });
    };
    return swap.on("change", () => frame.render(draw));
  }, [glitching, swap]);

  const selectPhoto = (index: number) => {
    if (index === active) return;
    swapAnimation.current?.stop();
    // Commit the photo the last swap landed on, on the GPU and in the DOM
    // alike, so the new crossfade can start from a clean 0.
    rendererRef.current?.promotePhoto();
    swap.set(0);
    seedRef.current = glitchSeed();
    if (top !== null) setBase(top);
    setTop(index);
  };

  // The transition context is built on the first swap and kept for later ones.
  useEffect(
    () => () => {
      glitchRef.current?.dispose();
      glitchRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (!dragging) return;
    document.documentElement.style.cursor = "grabbing";
    return () => {
      document.documentElement.style.cursor = "";
    };
  }, [dragging]);

  const nudge = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? KEY_STEP * 4 : KEY_STEP;
    const delta = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }[event.key];
    const stage = frameRef.current;
    const bounds = boundsRef.current?.getBoundingClientRect();
    const rect = windowRef.current?.getBoundingClientRect();
    if (!delta || !bounds || !rect || !stage) return;
    event.preventDefault();

    // Both rects are on screen, so the room left has to come back out of the
    // collapse scale before it can be added to the window's own offset.
    const scale = stage.getBoundingClientRect().width / stage.offsetWidth || 1;
    const dx = Math.min(
      Math.max(delta[0], (bounds.left - rect.left) / scale),
      (bounds.right - rect.right) / scale,
    );
    const dy = Math.min(
      Math.max(delta[1], (bounds.top - rect.top) / scale),
      (bounds.bottom - rect.bottom) / scale,
    );
    const transition = { type: "spring", stiffness: 500, damping: 40 } as const;
    animate(x, x.get() + dx, transition);
    animate(y, y.get() + dy, transition);
  };

  const copyEmail = async () => {
    await navigator.clipboard.writeText(EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 10 },
    animate: ready ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.8, delay, ease: EASE_OUT },
  });

  return (
    <main ref={runwayRef} className="relative h-[250svh]">
      <div
        ref={stageRef}
        className="bg-background sticky top-0 h-[100svh] overflow-hidden"
      >
        {/* The plain ground the collapsing scene uncovers. The photo covers
            it at rest, so it only has to wait out the intro fade — tying it to
            scroll instead would hand motion a lone accelerable opacity, which
            it offloads to a ScrollTimeline spanning the wrong range. */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : undefined}
          transition={{ duration: 0.4, delay: 1.1 }}
          className="bg-paper absolute inset-0"
        />

        <motion.div
          ref={sceneRef}
          style={{ scale: sceneScale, y: sceneY }}
          className="absolute inset-0"
        >
          <MotionConfig transformPagePoint={transformPagePoint}>
            <motion.div
              ref={frameRef}
              initial={{ opacity: 0 }}
              animate={ready ? { opacity: 1 } : undefined}
              transition={{ duration: 1.1, ease: EASE_OUT }}
              style={{ borderRadius: frameRadius }}
              className="reveal absolute inset-0 overflow-hidden"
            >
              {layers.map((index, depth) => (
                <motion.div
                  key={index}
                  // The lower layer holds steady while the upper one fades in.
                  style={depth === 0 ? { opacity: 1 } : { opacity: swap }}
                  className="absolute inset-0"
                >
                  <Image
                    ref={registerPhoto(index)}
                    src={PHOTOS[index].src}
                    alt=""
                    fill
                    // Cover crops a 3:2 photo, so a portrait viewport needs it
                    // ~1.5× its height wide.
                    sizes="max(100vw, 151vh)"
                    loading="eager"
                    fetchPriority={index === 0 ? "high" : "auto"}
                    onLoad={handlePhotoLoad}
                    className="object-cover grayscale"
                  />
                </motion.div>
              ))}

              {/* Always mounted so a swap can reach it, but transparent
                  until one runs — and it holds no GL context until then. */}
              <motion.canvas
                ref={glitchCanvasRef}
                aria-hidden
                style={{ opacity: glitchOpacity }}
                className="pointer-events-none absolute inset-0 size-full"
              />
            </motion.div>

            <div
              ref={boundsRef}
              aria-hidden
              className="pointer-events-none absolute inset-4"
            />

            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <motion.section
                ref={windowRef}
                drag
                dragListener={false}
                dragControls={dragControls}
                dragConstraints={boundsRef}
                dragElastic={0.08}
                dragTransition={{ power: 0.2, timeConstant: 200 }}
                onDragStart={() => setDragging(true)}
                onDragEnd={() => setDragging(false)}
                style={{ x, y }}
                className="pointer-events-auto relative flex w-[min(610px,calc(100vw-32px))] flex-col items-center px-6 pt-[88px] pb-12 text-white sm:h-[382px] sm:px-0 sm:pt-[133px] sm:pb-[74px]"
              >
                <motion.canvas
                  ref={canvasRef}
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={ready ? { opacity: 1 } : undefined}
                  transition={{ duration: 0.8, delay: 0.3, ease: EASE_OUT }}
                  className="pointer-events-none absolute inset-0 size-full"
                />
                {ready && lens !== "ready" && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[12px] border-6 border-white bg-black/50 backdrop-blur-[2px]"
                  />
                )}

                <button
                  type="button"
                  aria-label="Drag to move window. Arrow keys also move it."
                  aria-busy={!ready}
                  onPointerDown={(event) => ready && dragControls.start(event)}
                  onKeyDown={(event) => ready && nudge(event)}
                  className={`loader-appear absolute top-[15px] left-1/2 grid size-8 -translate-x-1/2 touch-none place-items-center rounded-md focus-visible:outline-1 focus-visible:outline-white ${
                    dragging ? "cursor-grabbing" : "cursor-grab"
                  }`}
                >
                  {/* Doubles as the loading indicator: it pulses until ready. */}
                  <motion.img
                    src="/grab.svg"
                    alt=""
                    width={28}
                    height={16}
                    draggable={false}
                    animate={ready ? { opacity: 1 } : { opacity: [1, 0.3, 1] }}
                    transition={
                      ready
                        ? { duration: 0.3 }
                        : { duration: 1.4, ease: "easeInOut", repeat: Infinity }
                    }
                  />
                </button>

                <motion.h1
                  {...reveal(0.5)}
                  className="reveal relative max-w-[452px] text-center font-serif text-[18px] leading-[normal] font-medium sm:text-[22px]"
                >
                  Devin is a product designer shaping boundless digital
                  experiences. He’s currently working on new stuff, so stay
                  tuned!
                </motion.h1>

                <motion.ul
                  {...reveal(0.65)}
                  className="reveal relative mt-10 flex gap-6 font-mono text-[14px] leading-[normal] uppercase sm:mt-[58px] sm:gap-10"
                >
                  <li>
                    <a
                      href="https://www.linkedin.com/in/devin-hayden"
                      target="_blank"
                      rel="noreferrer"
                      className={linkClass}
                    >
                      LinkedIn
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://x.com/devinxhayden"
                      target="_blank"
                      rel="noreferrer"
                      className={linkClass}
                    >
                      X/Twitter
                    </a>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={copyEmail}
                      className={`uppercase ${linkClass}`}
                    >
                      <span aria-live="polite">
                        {copied ? "Copied" : "Email"}
                      </span>
                    </button>
                  </li>
                </motion.ul>
              </motion.section>
            </div>
          </MotionConfig>
        </motion.div>

        <PhotoCarousel
          photos={PHOTOS}
          activeIndex={active}
          onSelect={selectPhoto}
          layout={layout}
          y={carouselY}
          open={carouselOpen}
        />
      </div>
    </main>
  );
}
