'use client';

import { useEffect, useRef, useState } from 'react';
import { Caveat } from 'next/font/google';
import { motion, useAnimate, AnimatePresence } from 'motion/react';
import { EnvelopeSimple, XLogo, LinkedinLogo } from '@phosphor-icons/react';
import Image from 'next/image';
import { TegakiRenderer } from 'tegaki/react';
import caveat from 'tegaki/fonts/caveat';
import HubToolbar from '@/components/HubToolbar';
import DrawingCanvas, { type ToolMode } from '@/components/DrawingCanvas';
import NotesOverlay from '@/components/NotesOverlay';
import { useNavigate } from '@/components/PageTransitionWrapper';

const caveatFont = Caveat({ subsets: ['latin'], weight: ['400'] });

const EMAIL = 'dhydn04@gmail.com';

function CopyEmailIcon() {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(EMAIL).then(() => {
      setCopied(true);
      setHovered(true);
      setTimeout(() => {
        setCopied(false);
        setHovered(false);
      }, 2000);
    });
  };

  return (
    <span className="relative">
      <button
        onClick={handleCopy}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { if (!copied) setHovered(false); }}
        aria-label="Copy email"
        className="text-black/50 hover:text-black/80 transition-colors duration-150"
      >
        <EnvelopeSimple size={20} />
      </button>
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 flex items-center gap-2 whitespace-nowrap rounded-[4px] bg-white border border-[rgba(176,176,176,0.4)] px-2.5 py-1.5 pointer-events-none z-10"
          >
            <span className="text-[12px] text-[#1e1e1e] font-medium">{EMAIL}</span>
            <span className="text-[11px] text-[#aaa]">{copied ? '✓ Copied' : 'Click to copy'}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

const projects = [
  {
    id: 'voxel',
    description: 'Intuitive and secure voice AI for healthcare clinics',
    video: '/projectFiles/voxelCoverAnimation.mp4',
    href: '/projects/voxel',
  },
  {
    id: 'trimble',
    description: 'Enterprise construction tooling for global workflows',
    video: '/projectFiles/trimbleCoverAnimation.mp4',
    href: '/projects/trimble',
  },
];



export default function HubPage() {
  const [scope, animate] = useAnimate();
  const [isWriting, setIsWriting] = useState(false);
  const [skipIntro, setSkipIntro] = useState(false);
  const navigate = useNavigate();
  const [toolMode, setToolMode] = useState<ToolMode>('pointer');
  const [annotationsVisible, setAnnotationsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'work' | 'experiments'>('work');
  const [notesOpen, setNotesOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
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

  const handleAnnotationToggle = () => {
    setAnnotationsVisible(v => !v);
  };

  useEffect(() => {
    const hasPlayed = sessionStorage.getItem('intro_played') === '1';

    if (hasPlayed) {
      setSkipIntro(true);
      writingDoneRef.current = true;
      animate('#headline',     { opacity: 1, y: 0 }, { duration: 0 });
      animate('#scribble-path',{ pathLength: 1 },     { duration: 0 });
      animate('#chaotic',      { opacity: 0.4 },      { duration: 0 });
      animate('#subtext',      { opacity: 1 },        { duration: 0 });
      animate('#contact',      { opacity: 1, y: 0 }, { duration: 0 });
      animate('#divider',      { opacity: 1 },        { duration: 0 });
      animate('#projects',     { opacity: 1, y: 0 }, { duration: 0 });
      animate('#footer',       { opacity: 1, y: 0 }, { duration: 0 });
      animate('#toolbar',      { opacity: 1 },        { duration: 0 });
      return;
    }

    const seq = async () => {
      await new Promise<void>(r => setTimeout(r, 700));

      await animate('#headline', { opacity: 1, y: 0 }, { duration: 0.9, ease: 'easeOut' });

      await Promise.all([
        animate('#scribble-path', { pathLength: 1 }, { duration: 1.0, ease: [0.4, 0, 0.2, 1] }),
        animate('#chaotic',    { opacity: 0.4 },  { duration: 0.8, delay: 0.2 }),
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
        animate('#footer',   { opacity: 1, y: 0 }, { duration: 1.0, ease: 'easeOut', delay: 0.45 }),
        animate('#toolbar',  { opacity: 1 }, { duration: 0.9, ease: 'easeOut', delay: 0.15 }),
      ]);

      sessionStorage.setItem('intro_played', '1');
    };

    seq();
  }, [animate]);

  const handleWritingComplete = () => {
    writingDoneRef.current = true;
    resolveWritingRef.current?.();
    resolveWritingRef.current = null;
  };

  return (
    <>
    <NotesOverlay isOpen={notesOpen} onClose={() => setNotesOpen(false)} readOnly={isMobile} />
    <div ref={scope} className="h-full">
      <div className="relative h-full rounded-[12px] bg-white overflow-hidden">

        <div id="toolbar" className="hidden md:block" style={{ opacity: 0 }}>
          <HubToolbar mode={toolMode} onModeChange={setToolMode} />
        </div>

        <div className="relative h-full overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          <div className="hidden md:block">
            <DrawingCanvas mode={toolMode} contentRef={contentRef} />
          </div>

          {/* ── Annotation overlay — switches per tab, crops on resize ── */}
          <AnimatePresence mode="wait">
            {annotationsVisible && (
              <motion.img
                key={`annotation-${activeTab}`}
                src={activeTab === 'work' ? '/annotationOverlay.png' : '/annotationCover2.png'}
                alt=""
                aria-hidden
                loading="lazy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-10 hidden md:block"
                style={{ width: '1440px', maxWidth: 'none' }}
              />
            )}
          </AnimatePresence>

          <div ref={contentRef} className="flex items-start justify-center px-6 pb-24 pt-14 md:pt-[127px]">
            <div className="flex w-full md:w-[600px] md:shrink-0 flex-col gap-10">

              {/* ── Intro + contact ──────────────────── */}
              <div className="flex flex-col gap-10">

                {/* Headline + subtext */}
                <div className="flex flex-col gap-2">

                  {/* Animated headline */}
                  <div
                    id="headline"
                    className="flex flex-wrap md:flex-nowrap items-baseline gap-x-2 gap-y-1 md:whitespace-nowrap md:w-max"
                    style={{ opacity: 0, transform: 'translateY(6px)' }}
                  >
                    <p className="text-[16px] font-semibold text-black">
                      Devin Hayden is{' '}
                      <span
                        className="relative inline-block"
                        onMouseEnter={handleScribbleEnter}
                        onMouseLeave={handleScribbleLeave}
                      >
                        <span id="chaotic" className="font-semibold">scattered</span>
                        <svg
                          aria-hidden
                          className="pointer-events-none absolute left-0 top-[8px]"
                          width="100%" height="10" viewBox="0 0 84 10" fill="none"
                          preserveAspectRatio="none"
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

                    {skipIntro ? (
                      <span style={{ fontSize: '24px', color: '#c22222', lineHeight: 1, width: 'min(520px, 100%)', fontFamily: `${caveatFont.style.fontFamily}, cursive`, display: 'block' }}>
                        a designer who loves to experiment.
                      </span>
                    ) : (
                      <TegakiRenderer
                        font={caveat}
                        time={{ mode: 'uncontrolled', playing: isWriting, speed: 4.5, initialTime: 0 }}
                        onComplete={handleWritingComplete}
                        style={{ fontSize: '24px', color: '#c22222', lineHeight: 1, width: 'min(520px, 100%)' }}
                      >
                        a designer who loves to experiment.
                      </TegakiRenderer>
                    )}
                  </div>

                  {/* Subtext */}
                  <p
                    id="subtext"
                    className="text-[16px] font-normal text-[#6e6e6e]"
                    style={{ opacity: 0 }}
                  >
                    {/* Mobile */}
                    <span className="md:hidden">Check out his workspace on desktop for more detail.</span>
                    {/* Desktop */}
                    <span className="hidden md:inline">
                      Check out his{' '}
                      {/* Annotation toggle — "scribbles in the margins" */}
                      <button
                        onClick={handleAnnotationToggle}
                        className="relative inline cursor-pointer group"
                        aria-label={annotationsVisible ? 'Hide annotations' : 'Show annotations'}
                      >
                        <span className="relative inline-block">
                          <span
                            className="absolute rounded-[3px] bg-[#fef08a] opacity-0 group-hover:opacity-60 transition-opacity duration-150 pointer-events-none"
                            style={{ inset: '0px -2px' }}
                          />
                          <motion.span
                            className="absolute rounded-[3px] bg-[#fde047] pointer-events-none"
                            style={{ inset: '0px -2px', originX: 0 }}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: annotationsVisible ? 1 : 0 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                          />
                          <span className="relative border-b border-dashed border-[#aaa]">scribbles</span>
                        </span>
                        {' in the margins'}
                      </button>
                      {'.'}
                    </span>
                  </p>
                </div>

                {/* Contact */}
                <div
                  id="contact"
                  className="flex flex-col gap-4"
                  style={{ opacity: 0, transform: 'translateY(4px)' }}
                >
                  <p className="text-[16px] font-normal text-[#6e6e6e] whitespace-nowrap">
                    You can find and contact him below.
                  </p>
                  <div className="flex items-center gap-6">
                    <CopyEmailIcon />

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
                {/* Tabs */}
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => setActiveTab('work')}
                    className={`text-[14px] font-medium tracking-wide whitespace-nowrap transition-colors ${
                      activeTab === 'work'
                        ? 'text-[rgba(110,110,110,0.8)]'
                        : 'text-[rgba(110,110,110,0.35)] hover:text-[rgba(110,110,110,0.6)]'
                    }`}
                  >
                    SELECTED WORK
                  </button>
                  <button
                    onClick={() => setActiveTab('experiments')}
                    className={`text-[14px] font-medium tracking-wide whitespace-nowrap transition-colors ${
                      activeTab === 'experiments'
                        ? 'text-[rgba(110,110,110,0.8)]'
                        : 'text-[rgba(110,110,110,0.35)] hover:text-[rgba(110,110,110,0.6)]'
                    }`}
                  >
                    EXPERIMENTS
                  </button>
                </div>

                <AnimatePresence mode="wait">
                {activeTab === 'work' && (
                  <motion.div
                    key="work"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                    className="flex flex-col gap-12"
                  >
                    {projects.map((project) => {
                      const Card = (
                        <div className={`flex flex-col overflow-hidden rounded-[4px] border border-[rgba(176,176,176,0.5)] w-full${project.href ? ' hover:border-[rgba(176,176,176,0.9)] transition-colors' : ''}`}>
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
                            <p className="text-[14px] text-[#6e6e6e]">
                              {project.description}
                            </p>
                            <div className="-rotate-45 shrink-0">
                              <span className="text-[16px] text-[#6e6e6e]">→</span>
                            </div>
                          </div>
                        </div>
                      );
                      return project.href ? (
                        <button key={project.id} onClick={() => navigate(project.href!)} className="text-left w-full">{Card}</button>
                      ) : (
                        <div key={project.id}>{Card}</div>
                      );
                    })}
                  </motion.div>
                )}

                {activeTab === 'experiments' && (
                  <motion.div
                    key="experiments"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                    className="flex flex-col md:flex-row gap-6 items-start"
                  >

                    {/* ── Left column (main) ── */}
                    <div className="flex flex-1 flex-col gap-[26px] min-w-0">

                      {/* Agentic browser animation */}
                      <div className="relative w-full aspect-[2453/1380] overflow-hidden rounded-[4px] border border-[rgba(176,176,176,0.5)]">
                        <video autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover" src="/projectFiles/agenticBrowserAnimation.mov" />
                      </div>

                      {/* Experiential marketing — 2 landscape photos */}
                      <div className="flex gap-6">
                        <div className="relative flex-1 h-[197px] overflow-hidden rounded-[4px] border border-[rgba(176,176,176,0.5)]">
                          <Image src="/projectFiles/experientialMarketing1.png" alt="Experiential marketing at NRG" fill sizes="(max-width: 768px) 50vw, 280px" className="object-cover" />
                        </div>
                        <div className="relative flex-1 h-[197px] overflow-hidden rounded-[4px] border border-[rgba(176,176,176,0.5)]">
                          <Image src="/projectFiles/experientialMarketing2.png" alt="Experiential marketing at NRG" fill sizes="(max-width: 768px) 50vw, 280px" className="object-cover" />
                        </div>
                      </div>

                      {/* Beacon cover */}
                      <div className="relative w-full aspect-[2453/1380] overflow-hidden rounded-[4px] border border-[rgba(176,176,176,0.5)]">
                        <Image src="/projectFiles/beaconCover.png" alt="Beacon" fill sizes="(max-width: 768px) 100vw, 390px" className="object-cover" />
                      </div>

                      {/* Comet + Fuser — 2 portrait items */}
                      <div className="flex gap-6">
                        <div className="relative flex-1 aspect-[1080/1350] overflow-hidden rounded-[4px] border border-[rgba(176,176,176,0.5)]">
                          <Image src="/projectFiles/cometCover.png" alt="Comet" fill sizes="(max-width: 768px) 50vw, 190px" className="object-cover" />
                        </div>
                        <div className="relative flex-1 aspect-[1080/1350] overflow-hidden rounded-[4px] border border-[rgba(176,176,176,0.5)]">
                          <video autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover" src="/projectFiles/fuserAnimation.mp4" />
                        </div>
                      </div>
                    </div>

                    {/* ── Right column (narrow) ── */}
                    <div className="flex flex-col gap-6 w-full md:shrink-0 md:w-[193px]">

                      {/* Concert photos — 3 stacked */}
                      <div className="flex flex-row md:flex-col gap-3">
                        {[
                          { src: '/projectFiles/musicPhoto1.png', alt: 'Concert photography' },
                          { src: '/projectFiles/musicPhoto2.png', alt: 'Concert photography' },
                          { src: '/projectFiles/musicPhoto3.png', alt: 'Concert photography' },
                        ].map(({ src, alt }) => (
                          <div key={src} className="relative h-[125px] w-full overflow-hidden rounded-[4px] border border-[rgba(176,176,176,0.5)]">
                            <Image src={src} alt={alt} fill sizes="(max-width: 768px) 33vw, 193px" className="object-cover" />
                          </div>
                        ))}
                      </div>

                      {/* Movie ticket animation */}
                      <div className="relative w-full aspect-[193/419] overflow-hidden rounded-[4px] border border-[rgba(176,176,176,0.5)]">
                        <video autoPlay loop muted playsInline preload="none" className="h-full w-full object-cover" src="/projectFiles/movieTicketAnimation.mp4" />
                      </div>
                    </div>

                  </motion.div>
                )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div id="footer" className="flex flex-col gap-5 pt-6 pb-8" style={{ opacity: 0, transform: 'translateY(4px)' }}>
                <div className="h-px w-full bg-black/10" />
                <motion.div
                  className="relative cursor-pointer overflow-hidden rounded-[4px] border border-[rgba(176,176,176,0.4)] px-6 py-5 select-none"
                  style={{ minHeight: 96 }}
                  onClick={() => setNotesOpen(true)}
                  whileHover="hovered"
                  initial="idle"
                >
                  {/* Text */}
                  <div className="flex flex-col gap-2 max-w-[60%]">
                    <p className={`${caveatFont.className} text-[22px] text-[#c22222] leading-none`}>
                      Thanks for stopping by :)
                    </p>
                    <p className="text-[14px] text-[#aaa]">
                    {isMobile ? 'See what others have left behind' : 'Feel free to leave a note while you\u2019re here'}
                  </p>
                  </div>

                  {/* Sticky notes */}
                  {[
                    { color: '#fde047', right: 138, rotateIdle: -7,  rotateHover: -9,  yIdle: 46, yHover: 34, delay: 0    },
                    { color: '#5eead4', right: 72,  rotateIdle:  6,  rotateHover:  9,  yIdle: 46, yHover: 36, delay: 0.06 },
                    { color: '#e879f9', right: -6,  rotateIdle: -4,  rotateHover: -2,  yIdle: 46, yHover: 38, delay: 0.12 },
                  ].map(({ color, right, rotateIdle, rotateHover, yIdle, yHover, delay }, i) => (
                    <motion.div
                      key={i}
                      className="absolute bottom-0 w-[66px] h-[74px] rounded-[2px]"
                      style={{ backgroundColor: color, right }}
                      variants={{
                        idle:    { y: yIdle, rotate: rotateIdle, transition: { duration: 0.4, ease: 'easeOut' } },
                        hovered: { y: yHover, rotate: rotateHover, transition: { delay, duration: 0.3, ease: 'easeOut' } },
                      }}
                    />
                  ))}
                </motion.div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>

    </>
  );
}
