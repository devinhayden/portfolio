"use client";

import Image from "next/image";
import {
  animate,
  frame,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

import { createLensRenderer, type LensParams } from "@/components/lensRenderer";

const PHOTO_SRC = "/backgroundImage.JPEG";

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

const linkClass =
  "transition-opacity hover:opacity-70 focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white";

export function LensHero() {
  const photoRef = useRef<HTMLImageElement>(null);
  const boundsRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const dragControls = useDragControls();

  const reduceMotion = useReducedMotion();

  const [photoReady, setPhotoReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [lens, setLens] = useState<"pending" | "ready" | "failed">("pending");
  const [timedOut, setTimedOut] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  // Hold the whole scene back until the photo is decoded, the fonts are in,
  // and the lens has drawn its first frame, then reveal it in one sequence.
  const ready = timedOut || (photoReady && fontsReady && lens !== "pending");

  const handlePhotoLoad = () => {
    const photo = photoRef.current;
    if (!photo) return;
    photo
      .decode()
      .catch(() => {})
      .then(() => setPhotoReady(true));
  };

  useEffect(() => {
    if (photoRef.current?.complete) handlePhotoLoad();
    document.fonts.ready.then(() => setFontsReady(true));
    const timeout = setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const photo = photoRef.current;
    const win = windowRef.current;
    const canvas = canvasRef.current;
    if (!photoReady || !photo || !win || !canvas) return;

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

    // The window's untransformed layout position; drag offsets add to it.
    const layout = { left: 0, top: 0, width: 0, height: 0 };
    const viewport = { width: 0, height: 0 };

    const measure = () => {
      const rect = win.getBoundingClientRect();
      layout.left = rect.left - x.get();
      layout.top = rect.top - y.get();
      layout.width = win.offsetWidth;
      layout.height = win.offsetHeight;
      const photoRect = photo.getBoundingClientRect();
      viewport.width = photoRect.width;
      viewport.height = photoRect.height;
    };

    const draw = () =>
      lens.render({
        x: layout.left + x.get(),
        y: layout.top + y.get(),
        width: layout.width,
        height: layout.height,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
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
    window.addEventListener("resize", remeasure);
    const unsubscribeX = x.on("change", schedule);
    const unsubscribeY = y.on("change", schedule);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", remeasure);
      unsubscribeX();
      unsubscribeY();
      lens.dispose();
      setLens("pending");
    };
  }, [photoReady, x, y]);

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
    const bounds = boundsRef.current?.getBoundingClientRect();
    const rect = windowRef.current?.getBoundingClientRect();
    if (!delta || !bounds || !rect) return;
    event.preventDefault();

    const dx = Math.min(
      Math.max(delta[0], bounds.left - rect.left),
      bounds.right - rect.right,
    );
    const dy = Math.min(
      Math.max(delta[1], bounds.top - rect.top),
      bounds.bottom - rect.bottom,
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
    <main className="fixed inset-0 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : undefined}
        transition={{ duration: 1.1, ease: EASE_OUT }}
        className="reveal absolute inset-0"
      >
        <Image
          ref={photoRef}
          src={PHOTO_SRC}
          alt=""
          fill
          // Cover crops a 3:2 photo, so a portrait viewport needs it ~1.5× its height wide.
          sizes="max(100vw, 151vh)"
          loading="eager"
          fetchPriority="high"
          onLoad={handlePhotoLoad}
          className="object-cover grayscale"
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
            {/* Doubles as the loading indicator: it pulses until the scene is ready. */}
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
            Devin is a product designer shaping boundless digital experiences.
            He’s currently working on new stuff, so stay tuned!
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
                <span aria-live="polite">{copied ? "Copied" : "Email"}</span>
              </button>
            </li>
          </motion.ul>
        </motion.section>
      </div>
    </main>
  );
}
