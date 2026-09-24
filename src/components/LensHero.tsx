"use client";

import Image from "next/image";
import {
  animate,
  frame,
  motion,
  useDragControls,
  useMotionValue,
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

  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [lensReady, setLensReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (photoRef.current?.complete) setPhotoLoaded(true);
  }, []);

  useEffect(() => {
    const photo = photoRef.current;
    const win = windowRef.current;
    const canvas = canvasRef.current;
    if (!photoLoaded || !photo || !win || !canvas) return;

    let renderer: ReturnType<typeof createLensRenderer> = null;
    try {
      renderer = createLensRenderer(canvas, photo, LENS);
    } catch (error) {
      console.error(error);
    }
    if (!renderer) return;
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
    setLensReady(true);

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
      setLensReady(false);
    };
  }, [photoLoaded, x, y]);

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

  return (
    <main className="fixed inset-0 overflow-hidden">
      <Image
        ref={photoRef}
        src={PHOTO_SRC}
        alt=""
        fill
        // Cover crops a 3:2 photo, so a portrait viewport needs it ~1.5× its height wide.
        sizes="max(100vw, 151vh)"
        loading="eager"
        fetchPriority="high"
        onLoad={() => setPhotoLoaded(true)}
        className="object-cover grayscale"
      />

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
          <canvas
            ref={canvasRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full"
          />
          {!lensReady && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[12px] border-6 border-white bg-black/50 backdrop-blur-[2px]"
            />
          )}

          <button
            type="button"
            aria-label="Drag to move window. Arrow keys also move it."
            onPointerDown={(event) => dragControls.start(event)}
            onKeyDown={nudge}
            className={`absolute top-[15px] left-1/2 grid size-8 -translate-x-1/2 touch-none place-items-center rounded-md focus-visible:outline-1 focus-visible:outline-white ${
              dragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/grab.svg" alt="" width={28} height={16} draggable={false} />
          </button>

          <h1 className="relative max-w-[452px] text-center font-serif text-[18px] leading-[normal] font-medium sm:text-[22px]">
            Devin is a product designer shaping boundless digital experiences.
            He’s currently working on new stuff, so stay tuned!
          </h1>

          <ul className="relative mt-10 flex gap-6 font-mono text-[14px] leading-[normal] uppercase sm:mt-[58px] sm:gap-10">
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
              <button type="button" onClick={copyEmail} className={`uppercase ${linkClass}`}>
                <span aria-live="polite">{copied ? "Copied" : "Email"}</span>
              </button>
            </li>
          </ul>
        </motion.section>
      </div>
    </main>
  );
}
