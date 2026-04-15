'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useAnimate, AnimatePresence, useAnimation } from 'motion/react';
import { EnvelopeSimple, XLogo, LinkedinLogo, Eye, EyeSlash } from '@phosphor-icons/react';
import { TegakiRenderer } from 'tegaki/react';
import caveat from 'tegaki/fonts/caveat';
import HubToolbar from '@/components/HubToolbar';
import DrawingCanvas, { type ToolMode } from '@/components/DrawingCanvas';

const projects = [
  {
    id: 'voxel',
    description: 'Enterprise construction tooling for global workflows',
    video: '/projectFiles/trimbleCoverAnimation.mp4',
  },
  {
    id: 'trimble',
    description: 'Intuitive and secure voice AI for healthcare clinics',
    video: '/projectFiles/voxelCoverAnimation.mp4',
  },
];

export default function HubPage() {
  const [scope, animate] = useAnimate();
  const [isWriting, setIsWriting] = useState(false);
  const [toolMode, setToolMode] = useState<ToolMode>('pointer');
  const [annotationsVisible, setAnnotationsVisible] = useState(false);
  const eyeControls = useAnimation();
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

  const resolveWritingRef = useRef<(() => void) | null>(null);
  const writingDoneRef = useRef(false);

  const handleAnnotationToggle = async () => {
    await eyeControls.start({ scaleY: 0, transition: { duration: 0.08, ease: 'easeIn' } });
    setAnnotationsVisible(v => !v);
    await eyeControls.start({ scaleY: 1, transition: { duration: 0.12, ease: 'easeOut' } });
  };

  useEffect(() => {
    const seq = async () => {
      await new Promise<void>(r => setTimeout(r, 700));

      await animate('#headline', { opacity: 1, y: 0 }, { duration: 0.9, ease: 'easeOut' });

      await Promise.all([
        animate('#scribble-path', { pathLength: 1 }, { duration: 1.0, ease: [0.4, 0, 0.2, 1] }),
        animate('#indecisive',    { opacity: 0.4 },  { duration: 0.8, delay: 0.2 }),
      ]);

      setIsWriting(true);
      await new Promise<void>(resolve => {
        if (writingDoneRef.current) resolve();
        else resolveWritingRef.current = resolve;
      });

      await new Promise<void>(r => setTimeout(r, 250));

      await Promise.all([
        animate('#subtext',  { opacity: 1 },       { duration: 0.8, ease: 'easeOut' }),
        animate('#contact',  { opacity: 1, y: 0 }, { duration: 0.9, ease: 'easeOut', delay: 0.1 }),
        animate('#divider',  { opacity: 1 },       { duration: 0.9, ease: 'easeOut', delay: 0.2 }),
        animate('#projects', { opacity: 1, y: 0 }, { duration: 1.0, ease: 'easeOut', delay: 0.3 }),
        animate('#toolbar',     { opacity: 1 },       { duration: 0.9, ease: 'easeOut', delay: 0.15 }),
        animate('#eye-toggle',  { opacity: 1 },       { duration: 0.9, ease: 'easeOut', delay: 0.25 }),
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
    <div ref={scope} className="h-screen bg-[#f7f6f4] p-4 font-geist">
      <div className="relative h-full rounded-[12px] bg-white overflow-hidden">

        <div id="toolbar" style={{ opacity: 0 }}>
          <HubToolbar mode={toolMode} onModeChange={setToolMode} />
        </div>

        {/* Eye / Annotations toggle */}
        <div
          id="eye-toggle"
          className="absolute bottom-5 left-5 z-20 group flex items-center gap-2 cursor-pointer"
          style={{ opacity: 0 }}
          onClick={handleAnnotationToggle}
        >
          <motion.div
            animate={eyeControls}
            className="text-[#b0b0b0] hover:text-[#888] transition-colors"
            style={{ originY: '50%' }}
          >
            {annotationsVisible ? <EyeSlash size={16} /> : <Eye size={16} />}
          </motion.div>
          <span className="text-[11px] font-medium text-[#b0b0b0] tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap select-none">
            {annotationsVisible ? 'HIDE ANNOTATIONS' : 'SHOW ANNOTATIONS'}
          </span>
        </div>

        <div className="relative h-full overflow-y-auto">
          <DrawingCanvas mode={toolMode} contentRef={contentRef} />

          {/* ── Annotation overlay — natural size, crops on resize ── */}
          <AnimatePresence>
            {annotationsVisible && (
              <motion.img
                key="annotation-overlay"
                src="/annotationOverlay.png"
                alt=""
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-10"
                style={{ width: '1440px', maxWidth: 'none' }}
              />
            )}
          </AnimatePresence>

          <div ref={contentRef} className="flex items-start justify-center px-6 pb-24 pt-[127px]">
            <div className="flex w-[600px] shrink-0 flex-col gap-10">

              {/* ── Intro + contact ──────────────────── */}
              <div className="flex flex-col gap-10">

                {/* Headline + subtext */}
                <div className="flex flex-col gap-2">

                  {/* Animated headline */}
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
                        <svg
                          aria-hidden
                          className="pointer-events-none absolute left-0 top-[8px]"
                          width="84" height="10" viewBox="0 0 84 10" fill="none"
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

                    <TegakiRenderer
                      font={caveat}
                      time={{ mode: 'uncontrolled', playing: isWriting, speed: 4.5, initialTime: 0 }}
                      onComplete={handleWritingComplete}
                      style={{ fontSize: '24px', color: '#c22222', lineHeight: 1, width: '520px' }}
                    >
                      someone who loves to experiment.
                    </TegakiRenderer>
                  </div>

                  {/* Subtext */}
                  <p
                    id="subtext"
                    className="text-[16px] font-normal text-[#6e6e6e]"
                    style={{ opacity: 0 }}
                  >
                    So, he built multiple portfolios for you to explore.
                  </p>
                </div>

                {/* Contact */}
                <div
                  id="contact"
                  className="flex flex-col gap-4"
                  style={{ opacity: 0, transform: 'translateY(4px)' }}
                >
                  <p className="text-[16px] font-normal text-[#6e6e6e] whitespace-nowrap">
                    Let him know which one is your favorite.
                  </p>
                  <div className="flex items-center gap-6">
                    <a href="mailto:dhydn04@gmail.com" aria-label="Email"
                      className="text-black/50 transition-opacity hover:text-black/80">
                      <EnvelopeSimple size={20} />
                    </a>
                    <a href="https://x.com/devinxhayden" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter"
                      className="text-black/50 transition-opacity hover:text-black/80">
                      <XLogo size={16} />
                    </a>
                    <a href="https://linkedin.com/in/devin-hayden" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                      className="text-black/50 transition-opacity hover:text-black/80">
                      <LinkedinLogo size={20} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div id="divider" className="h-px w-full bg-black/10" style={{ opacity: 0 }} />

              {/* Selected Work */}
              <div
                id="projects"
                className="flex flex-col gap-10"
                style={{ opacity: 0, transform: 'translateY(4px)' }}
              >
                <p className="text-[14px] font-medium text-[rgba(110,110,110,0.5)] whitespace-nowrap tracking-wide">
                  SELECTED WORK
                </p>

                <div className="flex flex-col gap-12">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex flex-col overflow-hidden rounded-[4px] border border-[rgba(176,176,176,0.5)] w-full"
                    >
                      {/* Full-bleed video */}
                      <div className="aspect-[1518/1080] w-full overflow-hidden">
                        <video
                          autoPlay loop muted playsInline
                          className="h-full w-full object-cover"
                          src={project.video}
                        />
                      </div>
                      {/* Caption bar */}
                      <div className="flex items-center justify-between border-t border-[rgba(176,176,176,0.5)] px-3 py-3">
                        <p className="text-[14px] text-[#6e6e6e] whitespace-nowrap">
                          {project.description}
                        </p>
                        <div className="-rotate-45 shrink-0">
                          <span className="text-[16px] text-[#6e6e6e]">→</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
