"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useState } from "react";

import type { DecisionMedia, DesignProject } from "./designProjects";

const label = "type-mono text-ink/45";

/** Each part of the deep dive rises in as it scrolls into view. */
function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * A decision's screen, or a live slice of the UI to try, on the same tray
 * so the two read as one kind of thing. A demo gets a Reset beside its
 * caption, which remounts it, so it's back to its opening state whatever
 * was done to it.
 */
function Media({ media }: { media: DecisionMedia }) {
  const [run, setRun] = useState(0);
  return (
    <figure className="mx-auto mt-8 max-w-[561px]">
      <div className="rounded-[16px] border border-[#e9e9e9] bg-[#fafafa] p-6 max-sm:p-3">
        {media.kind === "image" ? (
          <Image
            src={media.src}
            alt={media.alt}
            width={media.width}
            height={media.height}
            sizes="(max-width: 720px) 100vw, 513px"
            className="mx-auto h-auto max-h-[440px] w-auto max-w-full rounded-[8px]"
          />
        ) : (
          <media.component key={run} />
        )}
      </div>
      {(media.caption || media.kind === "demo") && (
        <div className="mt-3 flex items-center justify-between gap-4">
          {media.caption && (
            <figcaption className={label}>{media.caption}</figcaption>
          )}
          {media.kind === "demo" && (
            <button
              type="button"
              onClick={() => setRun((n) => n + 1)}
              className={`${label} group/reset ml-auto flex shrink-0 cursor-pointer items-center gap-1.5 transition-colors hover:text-ink`}
            >
              <svg
                aria-hidden
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-500 group-hover/reset:-rotate-180 motion-reduce:transition-none"
              >
                <path d="M2.5 8a5.5 5.5 0 1 0 1.7-3.97" />
                <path d="M2.5 2.5v3h3" />
              </svg>
              Reset
            </button>
          )}
        </div>
      )}
    </figure>
  );
}

/**
 * Text with ==phrases== picked out by a marker stroke that sweeps across
 * when it scrolls into view.
 */
function Marked({ text }: { text: string }) {
  const reduceMotion = useReducedMotion();
  return text.split(/==(.+?)==/).map((part, i) =>
    i % 2 === 0 ? (
      part
    ) : (
      <motion.mark
        key={i}
        initial={{ backgroundSize: reduceMotion ? "100% 100%" : "0% 100%" }}
        whileInView={{ backgroundSize: "100% 100%" }}
        viewport={{ once: true, margin: "0px 0px -20% 0px" }}
        transition={{
          duration: 0.7,
          delay: 0.35 + i * 0.12,
          ease: [0.65, 0, 0.35, 1],
        }}
        className="text-ink bg-transparent bg-no-repeat [box-decoration-break:clone] [-webkit-box-decoration-break:clone] [background-image:linear-gradient(transparent_58%,#f6e3a1_58%,#f6e3a1_92%,transparent_92%)]"
      >
        {part}
      </motion.mark>
    ),
  );
}

/**
 * The problem, broken up so its key parts are seen at a glance: the
 * context, then the figure that sizes it set apart as a callout, then the
 * stakes, their key phrases marked. All in the lede's serif; the callout is
 * only a step larger, on the demos' tray.
 */
function Problem({ problem }: { problem: DesignProject["problem"] }) {
  return (
    <div className="mx-auto max-w-[561px]">
      <Reveal>
        <h3 className={label}>The problem</h3>
        <p className="type-lede mt-3 text-pretty">
          <Marked text={problem.context} />
        </p>
      </Reveal>
      <Reveal>
        <p className="my-8 rounded-[16px] border border-[#e9e9e9] bg-[#fafafa] px-6 py-5 font-serif text-[clamp(1.125rem,4.8vw,1.5rem)] leading-[1.45] tracking-[-0.03em] text-pretty max-sm:px-5">
          <Marked text={problem.callout} />
        </p>
      </Reveal>
      <Reveal>
        <p className="type-lede text-pretty">
          <Marked text={problem.stakes} />
        </p>
      </Reveal>
    </div>
  );
}

/**
 * The deeper dive under the carousel, for whichever project is on show. The
 * carousel already gives its headline and facts; this is what follows, kept
 * to a quick read:
 * - the problem, and why it matters;
 * - each key decision, under the part of the problem it answers, with its
 *   screen or a live demo;
 * - a closing line.
 * Skimming the bold lines alone (problem, decision headings, closing line) should
 * tell the whole story. Sections are set apart by space rather than rules.
 * Text and screens share the writing pages' 561px measure.
 */
export function DesignDeepDive({ project }: { project: DesignProject }) {
  return (
    // Keyed by project, so switching fades the new one in rather than
    // swapping text under the reader.
    <motion.article
      key={project.slug}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      aria-label={project.title}
      className="text-ink mx-auto w-full max-w-[671px] px-4 pt-[clamp(48px,8svh,80px)] pb-32"
    >
      {/* The carousel's heading is hidden too; this one heads the dive. */}
      <h2 className="sr-only">{project.title}</h2>

      <Problem problem={project.problem} />

      <ol className="mt-[clamp(72px,12svh,120px)] space-y-[clamp(72px,12svh,120px)]">
        {project.decisions.map((decision, i) => (
          <li key={i}>
            <Reveal className="mx-auto max-w-[561px]">
              <p className={label}>
                {String(i + 1).padStart(2, "0")} · {decision.tension}
              </p>
              <h3 className="type-lede mt-2">{decision.heading}</h3>
              <div className="type-body mt-4 space-y-[1em]">
                {decision.body.map((paragraph, j) => (
                  <p key={j}>{paragraph}</p>
                ))}
              </div>
            </Reveal>
            {decision.media && (
              <Reveal>
                <Media media={decision.media} />
              </Reveal>
            )}
          </li>
        ))}
      </ol>

      <Reveal className="mx-auto mt-[clamp(96px,16svh,160px)] max-w-[562px] text-center">
        <p className="type-display">{project.closing}</p>
      </Reveal>
    </motion.article>
  );
}
