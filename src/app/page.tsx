'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useAnimate } from 'motion/react';
import { EnvelopeSimple, XLogo, LinkedinLogo } from '@phosphor-icons/react';
import { TegakiRenderer } from 'tegaki/react';
import caveat from 'tegaki/fonts/caveat';
import HubToolbar from '@/components/HubToolbar';
import DrawingCanvas, { type ToolMode } from '@/components/DrawingCanvas';

const projects = [
  {
    id: 'trimble',
    description: 'Intuitive and secure voice AI for healthcare clinics',
    href: '/projects/trimble',
    video: '/projectFiles/trimbleCoverAnimation.mp4',
  },
  {
    id: 'voxel',
    description: 'Enterprise construction tooling for global workflows',
    href: '/projects/voxel',
    video: '/projectFiles/voxelCoverAnimation.mp4',
  },
];

export default function HubPage() {
  const [scope, animate] = useAnimate();
  const [isWriting, setIsWriting] = useState(false);
  const [toolMode, setToolMode] = useState<ToolMode>('pointer');
  const contentRef = useRef<HTMLDivElement>(null);
  const scribbleAnimRef = useRef<ReturnType<typeof animate> | null>(null);

  const handleScribbleEnter = () => {
    scribbleAnimRef.current = animate(
      '#scribble-path',
      {
        d: [
          'M 1,5 C 9,2 19,8 31,4 C 43,1 53,9 64,5 C 72,2 79,7 83,4',
          'M 1,5 C 9,0 19,10 31,4 C 43,0 53,10 64,5 C 72,0 79,10 83,4',
          'M 1,5 C 9,10 19,0 31,6 C 43,10 53,0 64,5 C 72,10 79,0 83,5',
          'M 1,5 C 9,2 19,8 31,4 C 43,1 53,9 64,5 C 72,2 79,7 83,4',
        ],
      },
      { duration: 0.35, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }
    );
  };

  const handleScribbleLeave = () => {
    scribbleAnimRef.current?.stop();
    animate(
      '#scribble-path',
      { d: 'M 1,5 C 9,2 19,8 31,4 C 43,1 53,9 64,5 C 72,2 79,7 83,4' },
      { duration: 0.2, ease: 'easeOut' }
    );
  };

  // Resolved when tegaki's onComplete fires
  const resolveWritingRef = useRef<(() => void) | null>(null);
  const writingDoneRef = useRef(false);

  useEffect(() => {
    const seq = async () => {
      await new Promise<void>(r => setTimeout(r, 700));

      // 1 ── "Devin Hayden is indecisive" fades up into view
      await animate(
        '#headline',
        { opacity: 1, y: 0 },
        { duration: 0.9, ease: 'easeOut' }
      );

      // 2 ── Red scribble draws over the word + it dims simultaneously
      await Promise.all([
        animate(
          '#scribble-path',
          { pathLength: 1 },
          { duration: 1.0, ease: [0.4, 0, 0.2, 1] }
        ),
        animate(
          '#indecisive',
          { opacity: 0.4 },
          { duration: 0.8, delay: 0.2 }
        ),
      ]);

      // 3 ── Tegaki writes in "someone who loves to experiment."
      setIsWriting(true);
      await new Promise<void>(resolve => {
        // Guard: if onComplete already fired before we got here
        if (writingDoneRef.current) {
          resolve();
        } else {
          resolveWritingRef.current = resolve;
        }
      });

      await new Promise<void>(r => setTimeout(r, 250));

      // 4 ── Everything else fades in with a slight stagger
      await Promise.all([
        animate('#subtext',  { opacity: 1 },       { duration: 0.8, ease: 'easeOut' }),
        animate('#contact',  { opacity: 1, y: 0 }, { duration: 0.9, ease: 'easeOut', delay: 0.1 }),
        animate('#divider',  { opacity: 1 },        { duration: 0.9, ease: 'easeOut', delay: 0.2 }),
        animate('#projects', { opacity: 1, y: 0 }, { duration: 1.0, ease: 'easeOut', delay: 0.3 }),
        animate('#toolbar',  { opacity: 1 },        { duration: 0.9, ease: 'easeOut', delay: 0.15 }),
      ]);
    };

    seq();
  }, [animate]);

  const handleWritingComplete = () => {
    writingDoneRef.current = true;
    resolveWritingRef.current?.();
    resolveWritingRef.current = null;
  };

  return (
    <div ref={scope} className="h-screen bg-[#edece8] p-4 font-geist">
      <div className="relative h-full rounded-[24px] bg-white overflow-hidden">

        <div id="toolbar" style={{ opacity: 0 }}>
          <HubToolbar mode={toolMode} onModeChange={setToolMode} />
        </div>

        <div className="relative h-full overflow-y-auto">
          {/* Canvas lives inside the scroll container so drawings scroll with content */}
          <DrawingCanvas mode={toolMode} contentRef={contentRef} />

          <div ref={contentRef} className="flex items-start justify-center px-6 pb-24 pt-[143px]">
            <div className="flex w-[465px] shrink-0 flex-col gap-20">

              {/* ── Intro + contact ─────────────────── */}
              <div className="flex flex-col gap-20">
                <div className="flex flex-col gap-4">

                  {/* Phases 1–3: animated headline */}
                  <div
                    id="headline"
                    className="flex items-baseline gap-2 whitespace-nowrap w-max"
                    style={{ opacity: 0, transform: 'translateY(6px)' }}
                  >
                    <p className="text-[16px] font-semibold text-black">
                      Devin Hayden is{' '}
                      <span
                        className="relative inline-block"
                        onMouseEnter={handleScribbleEnter}
                        onMouseLeave={handleScribbleLeave}
                      >
                        <span id="indecisive" className="font-semibold">indecisive</span>

                        {/* Hand-drawn scribble strikethrough */}
                        <svg
                          aria-hidden
                          className="pointer-events-none absolute left-0 top-[8px]"
                          width="84"
                          height="10"
                          viewBox="0 0 84 10"
                          fill="none"
                        >
                          <motion.path
                            id="scribble-path"
                            d="M 1,5 C 9,2 19,8 31,4 C 43,1 53,9 64,5 C 72,2 79,7 83,4"
                            stroke="#c22222"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                          />
                        </svg>
                      </span>
                    </p>

                    {/* Phase 3: tegaki handwriting */}
                    <TegakiRenderer
                      font={caveat}
                      time={{
                        mode: 'uncontrolled',
                        playing: isWriting,
                        speed: 4.5,
                        initialTime: 0,
                      }}
                      onComplete={handleWritingComplete}
                      style={{
                        fontSize: '24px',
                        color: '#c22222',
                        lineHeight: 1,
                        width: '520px',
                      }}
                    >
                      someone who loves to experiment.
                    </TegakiRenderer>
                  </div>

                  {/* Phase 4: second line */}
                  <p
                    id="subtext"
                    className="text-[16px] font-normal text-black"
                    style={{ opacity: 0 }}
                  >
                    So, he built{' '}
                    <mark className="bg-yellow-200/70 text-black rounded-[3px] px-0.5 -mx-0.5">
                      multiple portfolios
                    </mark>
                    {' '}for you to explore.
                  </p>
                </div>

                {/* Phase 4: contact */}
                <div
                  id="contact"
                  className="flex w-[293px] flex-col gap-4"
                  style={{ opacity: 0, transform: 'translateY(4px)' }}
                >
                  <p className="text-[16px] font-normal text-black">
                    Let him know which one is your favorite.
                  </p>
                  <div className="flex items-center gap-6">
                    <a
                      href="mailto:dhydn04@gmail.com"
                      aria-label="Email"
                      className="text-black/70 transition-opacity hover:opacity-50"
                    >
                      <EnvelopeSimple size={20} />
                    </a>
                    <a
                      href="https://x.com/devinxhayden"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="X / Twitter"
                      className="text-black/70 transition-opacity hover:opacity-50"
                    >
                      <XLogo size={16} />
                    </a>
                    <a
                      href="https://linkedin.com/in/devin-hayden"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn"
                      className="text-black/70 transition-opacity hover:opacity-50"
                    >
                      <LinkedinLogo size={20} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Phase 4: divider */}
              <div
                id="divider"
                className="h-px w-full bg-black/15"
                style={{ opacity: 0 }}
              />

              {/* Phase 4: project cards */}
              <div
                id="projects"
                className="flex flex-col gap-12"
                style={{ opacity: 0, transform: 'translateY(4px)' }}
              >
                {projects.map((project) => (
                  <div key={project.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[16px] font-normal text-black">
                      <span className="whitespace-nowrap">{project.description}</span>
                      <span className="-rotate-45 inline-block shrink-0 leading-none">
                        →
                      </span>
                    </div>
                    <div className="aspect-[1518/1080] w-full overflow-hidden rounded-[8px]">
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                        src={project.video}
                      />
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
