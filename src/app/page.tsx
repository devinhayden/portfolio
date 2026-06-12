'use client';

import { useEffect, useRef, useState } from 'react';
import TracingPaperSheet from '@/components/TracingPaperSheet';
import ProjectCard from '@/components/ProjectCard';
import ProjectModal, { type ProjectData } from '@/components/ProjectModal';
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react';

// ─── Repel wrapper ────────────────────────────────────────────────────────────
// Subscribes to shared cursor motion values. When the cursor enters the repel
// radius, springs the sheet away in translation + rotation — like physically
// disturbing a page on a desk.

interface RepelSheetProps {
  cursorX: MotionValue<number>;
  cursorY: MotionValue<number>;
  baseLeft: number;
  baseTop: number;
  baseRotate: number;
  zIndex: number;
  children: React.ReactNode;
}

function RepelSheet({ cursorX, cursorY, baseLeft, baseTop, baseRotate, zIndex, children }: RepelSheetProps) {
  const ref = useRef<HTMLDivElement>(null);

  const springConfig = { stiffness: 180, damping: 24 };
  const x      = useSpring(0, springConfig);
  const y      = useSpring(0, springConfig);
  const rotate = useSpring(baseRotate, springConfig);

  useEffect(() => {
    function update() {
      const el = ref.current;
      if (!el) return;

      const rect     = el.getBoundingClientRect();
      const centerX  = rect.left + rect.width  / 2;
      const centerY  = rect.top  + rect.height / 2;
      const dx       = cursorX.get() - centerX;
      const dy       = cursorY.get() - centerY;
      const dist     = Math.sqrt(dx * dx + dy * dy);
      const threshold = 320;

      if (dist < threshold && dist > 0) {
        // Non-linear falloff — effect ramps up sharply as cursor gets close
        const strength = Math.pow(1 - dist / threshold, 1.5);
        x.set(-dx * strength * 0.22);
        y.set(-dy * strength * 0.12);
        // Rotation: cursor from the right pushes the sheet counterclockwise, and vice versa
        rotate.set(baseRotate + (-dx * strength * 0.07));
      } else {
        x.set(0);
        y.set(0);
        rotate.set(baseRotate);
      }
    }

    const unsubX = cursorX.on('change', update);
    const unsubY = cursorY.on('change', update);
    return () => { unsubX(); unsubY(); };
  }, [cursorX, cursorY, x, y, rotate, baseRotate]);

  return (
    <motion.div
      ref={ref}
      className="absolute pointer-events-none"
      style={{ left: baseLeft, top: baseTop, x, y, rotate, zIndex }}
    >
      {children}
    </motion.div>
  );
}

// ─── Socials ──────────────────────────────────────────────────────────────────

function Socials() {
  const [copied, setCopied] = useState(false);

  function copyEmail() {
    navigator.clipboard.writeText('dhydn04@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const linkClass =
    'flex items-center gap-1.5 font-mono text-[13px] font-medium text-[#2c2c2c]/50 transition-colors hover:text-[#2c2c2c]';

  return (
    <div className="flex items-center gap-8">
      <a href="https://linkedin.com/in/devin-hayden" target="_blank" rel="noopener noreferrer" className={linkClass}>
        LINKEDIN
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      <a href="https://x.com/devinxhayden" target="_blank" rel="noopener noreferrer" className={linkClass}>
        X/TWITTER
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      <button onClick={copyEmail} className={linkClass}>
        {copied ? 'COPIED!' : 'EMAIL'}
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
          <rect x="3.5" y="0.5" width="7" height="7" rx="1" stroke="currentColor" />
          <rect x="0.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" fill="none" />
        </svg>
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────


export default function HomePage() {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const { scrollY } = useScroll();
  const papersY = useTransform(scrollY, (s) => s * -0.18);
  const [openProject, setOpenProject] = useState<ProjectData | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [cursorX, cursorY]);

  return (
    <div className="relative flex min-h-screen flex-col items-center gap-40 overflow-hidden px-20 py-20">

      {/* Background texture — multiply blended, below all content */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url('/backgroundTexture.png')",
          backgroundRepeat: 'repeat',
          mixBlendMode: 'multiply',
          opacity: 0.4,
          zIndex: -1,
        }}
      />

      {/* ── Hero papers ──────────────────────────────────────── */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-0"
        style={{ x: '-50%', y: papersY }}
      >
        <div style={{ position: 'relative', width: 1920, height: 540 }}>
          <RepelSheet
            cursorX={cursorX}
            cursorY={cursorY}
            baseLeft={700}
            baseTop={-240}
            baseRotate={72}
            zIndex={3}
          >
            <TracingPaperSheet className="w-[400px] h-[566px]" />
          </RepelSheet>
          <RepelSheet
            cursorX={cursorX}
            cursorY={cursorY}
            baseLeft={900}
            baseTop={-150}
            baseRotate={-12}
            zIndex={4}
          >
            <TracingPaperSheet src="/papers/tracingOverlay1.png" className="w-[400px] h-[566px]" />
          </RepelSheet>
          <RepelSheet
            cursorX={cursorX}
            cursorY={cursorY}
            baseLeft={1200}
            baseTop={-100}
            baseRotate={-40}
            zIndex={5}
          >
            <TracingPaperSheet src="/papers/tracingOverlay2.png" className="w-[400px] h-[566px]" />
          </RepelSheet>
          <RepelSheet
            cursorX={cursorX}
            cursorY={cursorY}
            baseLeft={900}
            baseTop={-220}
            baseRotate={120}
            zIndex={1}
          >
            <TracingPaperSheet className="w-[400px] h-[566px]" />
          </RepelSheet>
          <RepelSheet
            cursorX={cursorX}
            cursorY={cursorY}
            baseLeft={1400}
            baseTop={-100}
            baseRotate={-40}
            zIndex={2}
          >
            <TracingPaperSheet className="w-[400px] h-[566px]" />
          </RepelSheet>
          <RepelSheet
            cursorX={cursorX}
            cursorY={cursorY}
            baseLeft={1600}
            baseTop={150}
            baseRotate={14}
            zIndex={6}
          >
            <TracingPaperSheet className="w-[400px] h-[566px]" />
          </RepelSheet>

        </div>
      </motion.div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative flex h-[600px] w-full flex-col justify-end">
        {/* Name + role — top left */}
        <div className="absolute left-0 top-0 flex flex-col gap-0.5">
          <p className="font-mono text-[13px] font-medium text-[#2c2c2c]/60">DEVIN HAYDEN</p>
          <p className="font-mono text-[13px] text-[#2c2c2c]/40">PRODUCT + DESIGN</p>
        </div>

        {/* Text stack — lower left */}
        <div className="flex flex-col">
          <p className="w-[437px] font-rowan text-[32px] leading-snug text-[#2c2c2c]">
            Tracing the lines between product, craft, and experience.
          </p>
          <p className="mt-4 w-[500px] font-geist text-[18px] leading-normal text-[#2c2c2c]/60">
            Currently building the future of industrial AI @ Emanate –{' '}
            and occasionally pointing a camera at things.
          </p>
          <div className="mt-10">
            <Socials />
          </div>
        </div>
      </section>

      {/* ── Project Grid ─────────────────────────────────────── */}
      <section className="flex w-full items-start gap-6">

        {/* Left column */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <ProjectCard src="/projectFiles/voxelCover.png" title="Custom Voice Agents for Healthcare" label="Voxel"
            onClick={() => setOpenProject({ src: '/projectFiles/voxelCover.png', title: 'Custom Voice Agents for Healthcare', label: 'Voxel', href: '/projects/voxel' })} />
          <ProjectCard src="/projectFiles/experientialMarketing2.png" title="T-Mobile x F1 Interactive Game" label="NRG Experiential Marketing"
            onClick={() => setOpenProject({ src: '/projectFiles/experientialMarketing2.png', title: 'T-Mobile x F1 Interactive Game', label: 'NRG Experiential Marketing' })} />
          <ProjectCard src="/projectFiles/agenticBrowserAnimation.mov" title="Agentic Browser UI Animations" label="Motion Exploration"
            onClick={() => setOpenProject({ src: '/projectFiles/agenticBrowserAnimation.mov', title: 'Agentic Browser UI Animations', label: 'Motion Exploration' })} />
          <ProjectCard src="/projectFiles/createsc.png" title="Hosting a Nationwide Designathon" label="Innovative Design @ USC"
            onClick={() => setOpenProject({ src: '/projectFiles/createsc.png', title: 'Hosting a Nationwide Designathon', label: 'Innovative Design @ USC' })} />
        </div>

        {/* Middle column */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <ProjectCard src="/projectFiles/experientialMarketing1.png" title="Meta AI Retail Experience" label="NRG Experiential Marketing"
            onClick={() => setOpenProject({ src: '/projectFiles/experientialMarketing1.png', title: 'Meta AI Retail Experience', label: 'NRG Experiential Marketing' })} />
          <ProjectCard src="/projectFiles/trimble1.png" title="Global Ecommerce UI Components" label="Trimble" padding="pt-6 pr-6"
            onClick={() => setOpenProject({ src: '/projectFiles/trimble1.png', title: 'Global Ecommerce UI Components', label: 'Trimble', href: '/projects/trimble' })} />
          <ProjectCard src="/projectFiles/musicPhotos.png" title="Live Music Media Coverage" label="Freelance Photography"
            onClick={() => setOpenProject({ src: '/projectFiles/musicPhotos.png', title: 'Live Music Media Coverage', label: 'Freelance Photography' })} />
          <ProjectCard src="/projectFiles/nova.png" title="Offline AI Learning Platform" label="Nova"
            onClick={() => setOpenProject({ src: '/projectFiles/nova.png', title: 'Offline AI Learning Platform', label: 'Nova' })} />
        </div>

        {/* Right column */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <ProjectCard src="/projectFiles/trimble2.png" title="Construction Report Filtering" label="Trimble"
            onClick={() => setOpenProject({ src: '/projectFiles/trimble2.png', title: 'Construction Report Filtering', label: 'Trimble', href: '/projects/trimble' })} />
          <ProjectCard src="/projectFiles/beaconcover.png" title="XR Holographic UI for Limited Mobility Patients" label="Design Competition Sprint"
            onClick={() => setOpenProject({ src: '/projectFiles/beaconcover.png', title: 'XR Holographic UI for Limited Mobility Patients', label: 'Design Competition Sprint' })} />
          <ProjectCard src="/projectFiles/trimble3.png" title="Product Comparison UI Components" label="Trimble" padding="pt-6 pl-6 pb-6"
            onClick={() => setOpenProject({ src: '/projectFiles/trimble3.png', title: 'Product Comparison UI Components', label: 'Trimble', href: '/projects/trimble' })} />
          <ProjectCard src="/projectFiles/experientialMarketing3.png" title="Google Gemini Interactive Demo" label="NRG Experiential Marketing"
            onClick={() => setOpenProject({ src: '/projectFiles/experientialMarketing3.png', title: 'Google Gemini Interactive Demo', label: 'NRG Experiential Marketing' })} />
        </div>

      </section>

      {/* ── Footer papers — add exports when ready ───────────── */}

      {/* ── Footer ───────────────────────────────────────────── */}
      <section className="flex w-full flex-col items-start gap-6">
        <div className="flex flex-col gap-6">
          <p className="font-rowan text-[24px] text-[#2c2c2c]">Thanks for stopping by :)</p>
          <p className="w-[650px] text-[16px] leading-[1.5] text-[#2c2c2c]">
            I&apos;m Devin, a designer exploring all the ways in which human touch can bring
            software to life. Previously studied Cognitive Science @ USC and currently building
            the future of industrial AI @ Emanate. Feel free to reach out!
          </p>
        </div>
        <Socials />
      </section>

      <ProjectModal project={openProject} onClose={() => setOpenProject(null)} />
    </div>
  );
}
