"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import { DESIGN_PROJECTS } from "./designProjects";

/**
 * The Design page's landing: one project's hero screen in a soft card, its
 * summary as the headline beneath, then its facts as a one-line mono
 * byline (company · role · timeline · team). Arrows beside the card
 * switch projects (under the byline on a phone, with the dots), and a swipe
 * on the card or the arrow keys do too.
 *
 * The card's shape follows the screen's, so it eases wider or narrower as
 * the projects change; the screens, headlines and bylines crossfade.
 *
 * Controlled: `index` is the project on show. Arrow keys only switch when
 * `keyboard` is on.
 */

const PADDING = 24;
/**
 * The card's height, padding included: whatever the headline and facts
 * leave of the screen, between 200 and 500px…
 */
const FIT_HEIGHT = "clamp(200px, 100svh - 420px, 500px)";
/** A swipe has to travel this far, in px, to count. */
const SWIPE = 40;

const mod = (n: number, m: number) => ((n % m) + m) % m;

export function DesignCarousel({
  index,
  onChange,
  keyboard = false,
}: {
  index: number;
  onChange: (index: number) => void;
  keyboard?: boolean;
}) {
  const count = DESIGN_PROJECTS.length;
  const project = DESIGN_PROJECTS[index];
  const step = (delta: number) => onChange(mod(index + delta, count));

  const indexRef = useRef(index);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    indexRef.current = index;
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!keyboard) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      const delta = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
      if (delta === undefined) return;
      event.preventDefault();
      onChangeRef.current(mod(indexRef.current + delta, count));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keyboard, count]);

  const swipeFrom = useRef<number | null>(null);
  const aspect = project.hero.width / project.hero.height;
  // …and no wider than the row has room for: the whole width less the
  // gutters on a phone, less the arrows beside it too from `sm` up.
  const height = `min(${FIT_HEIGHT}, calc((var(--room) - ${PADDING * 2}px) / ${aspect} + ${PADDING * 2}px))`;

  const arrow = (delta: -1 | 1, className = "") => (
    <button
      type="button"
      onClick={() => step(delta)}
      aria-label={delta < 0 ? "Previous project" : "Next project"}
      className={`shrink-0 cursor-pointer rounded-sm opacity-90 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink ${className}`}
    >
      <Image
        src="/design/arrow-left.svg"
        alt=""
        width={24}
        height={24}
        className={delta > 0 ? "rotate-180" : undefined}
      />
    </button>
  );

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Design projects"
      className="text-ink flex w-full flex-col items-center px-4 [--room:calc(100vw-32px)] sm:[--room:calc(100vw-160px)]"
    >
      <div className="flex max-w-full items-center gap-8">
        {arrow(-1, "hidden sm:block")}
        <div
          onPointerDown={(event) => {
            swipeFrom.current = event.clientX;
          }}
          onPointerUp={(event) => {
            if (swipeFrom.current === null) return;
            const dx = event.clientX - swipeFrom.current;
            swipeFrom.current = null;
            if (Math.abs(dx) >= SWIPE) step(dx < 0 ? 1 : -1);
          }}
          onPointerCancel={() => {
            swipeFrom.current = null;
          }}
          className="relative min-w-0 touch-pan-y overflow-hidden rounded-[16px] border border-[#e9e9e9] bg-[#fafafa] select-none"
        >
          <div
            style={{
              height,
              width: `calc((${height} - ${PADDING * 2}px) * ${aspect} + ${PADDING * 2}px)`,
            }}
            className="relative max-w-full transition-[width,height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          >
            {DESIGN_PROJECTS.map((item, i) => (
              <div
                key={item.slug}
                aria-hidden={i !== index}
                className={`absolute inset-[24px] transition-opacity duration-500 ease-out motion-reduce:transition-none ${
                  i === index ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={item.hero.src}
                  alt={item.hero.alt}
                  fill
                  sizes="(max-width: 720px) 100vw, 680px"
                  priority={i === 0}
                  draggable={false}
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
        {arrow(1, "hidden sm:block")}
      </div>

      {/* Every project's headline and byline share one cell and crossfade,
          so switching never shifts what's around them. */}
      <div
        aria-live="polite"
        className="mt-[clamp(20px,3.5svh,36px)] grid w-full max-w-[720px] text-center"
      >
        {DESIGN_PROJECTS.map((item, i) => (
          <div
            key={item.slug}
            aria-hidden={i !== index}
            className={`[grid-area:1/1] transition-opacity duration-500 ease-out motion-reduce:transition-none ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <h2 className="sr-only">{item.title}</h2>
            <p className="type-display mx-auto max-w-[562px]">{item.summary}</p>
            {/* The facts as a byline: one line, like a photo credit. */}
            <p className="type-mono text-ink/45 mx-auto mt-[clamp(14px,2.5svh,24px)] max-w-[620px] text-balance">
              {item.facts.map((fact) => fact.value).join(" · ")}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-[clamp(16px,3svh,28px)] flex items-center gap-8">
        {arrow(-1, "sm:hidden")}
        <div className="flex items-center gap-2">
          {DESIGN_PROJECTS.map((item, i) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => onChange(i)}
              aria-label={`Show ${item.title}`}
              aria-current={i === index}
              className="cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <Image
                src={i === index ? "/design/dot-on.svg" : "/design/dot-off.svg"}
                alt=""
                width={10}
                height={10}
              />
            </button>
          ))}
        </div>
        {arrow(1, "sm:hidden")}
      </div>
    </section>
  );
}
