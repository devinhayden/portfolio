'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-semibold tracking-widest text-[#c22222] uppercase">
      {children}
    </p>
  );
}

function Img({ src, alt, aspect }: { src: string; alt: string; aspect: string }) {
  return (
    <div className={`relative w-full ${aspect} overflow-hidden rounded-[4px]`}>
      <Image src={src} alt={alt} fill className="object-cover" />
    </div>
  );
}

function KeyDecision({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 bg-[#fafaf8] px-5 py-4 border-l-2 border-[#c22222]">
      <p className="text-[11px] font-semibold tracking-widest text-[#c22222] uppercase">Key Decision</p>
      <p className="text-[15px] text-[#1e1e1e] leading-relaxed">{children}</p>
    </div>
  );
}

const TABS = [
  {
    label: 'ProjectSight',
    text: "Users couldn't filter massive daily-report datasets by multiple categories (e.g., company + location).",
  },
  {
    label: 'Ecommerce',
    text: "Pricing cards didn't support global requirements or drive conversion.",
  },
  {
    label: 'Product Comparison',
    text: 'Subscription-style tables broke when applied to long technical specs and multi-industry content.',
  },
];

const INTERVAL = 4000;

function ProblemTabs() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const startRef = useRef<number>(Date.now());
  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  const goTo = useCallback((idx: number) => {
    setActive(idx);
    setProgress(0);
    startRef.current = Date.now();
  }, []);

  useEffect(() => {
    const tick = () => {
      if (!pausedRef.current) {
        const elapsed = Date.now() - startRef.current;
        const pct = Math.min(elapsed / INTERVAL, 1);
        setProgress(pct);
        if (pct >= 1) {
          setActive(a => {
            const next = (a + 1) % TABS.length;
            startRef.current = Date.now();
            return next;
          });
          setProgress(0);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div
      className="flex flex-col gap-0 overflow-hidden rounded-[6px] border border-[rgba(176,176,176,0.4)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); startRef.current = Date.now() - progress * INTERVAL; }}
    >
      <div className="flex border-b border-[rgba(176,176,176,0.4)]">
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => goTo(i)}
            className={`relative flex-1 px-4 py-3 text-left text-[13px] font-medium transition-colors duration-150 ${
              i === active ? 'text-[#1e1e1e]' : 'text-[#aaa] hover:text-[#777]'
            } ${i > 0 ? 'border-l border-[rgba(176,176,176,0.4)]' : ''}`}
          >
            {tab.label}
            {i === active && (
              <motion.span
                className="absolute bottom-0 left-0 h-[2px] bg-[#c22222]"
                style={{ width: `${progress * 100}%` }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="relative overflow-hidden" style={{ minHeight: 220 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            className="flex flex-col gap-4 p-5"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <p className="text-[14px] text-[#1e1e1e] leading-relaxed">{TABS[active].text}</p>
            <div className="w-full aspect-[16/7] rounded-[4px] bg-[#f0eeec] flex items-center justify-center">
              <p className="text-[12px] text-[#ccc] tracking-wide uppercase">Image coming soon</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function TrimblePage() {
  const [annotationsVisible, setAnnotationsVisible] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f6f4] p-4 font-geist">
      <div className="relative min-h-full rounded-[12px] bg-white overflow-hidden">
        <div className="flex items-start justify-center px-6 pb-32 pt-14">
          <div className="flex w-[600px] shrink-0 flex-col gap-14">

            {/* Back */}
            <Link href="/" className="text-[12px] font-semibold tracking-widest text-[#9a9a9a] hover:text-[#777] transition-colors w-fit uppercase">
              ← Back
            </Link>

            {/* Hero */}
            <div className="flex flex-col gap-8">
              <p className="text-[20px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                Designing adaptable, scalable UX patterns across project management and ecommerce
              </p>
              <div className="relative w-full aspect-video overflow-hidden rounded-[4px]">
                <video autoPlay loop muted playsInline className="h-full w-full object-cover" src="/projectFiles/trimbleCoverAnimation.mp4" />
              </div>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: 'ROLE', value: 'UX Design Intern' },
                  { label: 'TIMELINE', value: 'May – Aug 2025' },
                  { label: 'TOOLS', value: 'Figma, v0, Jira' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <p className="text-[11px] font-semibold tracking-widest text-[#ababab] uppercase">{label}</p>
                    <p className="text-[14px] text-[#1e1e1e] leading-snug">{value}</p>
                  </div>
                ))}
              </div>

              {/* Annotation toggle */}
              <p className="text-[15px] text-[#6e6e6e]">
                Feel free to{' '}
                <button
                  onClick={() => setAnnotationsVisible(v => !v)}
                  className="relative inline cursor-pointer group"
                  aria-label={annotationsVisible ? 'Hide annotations' : 'Show annotations'}
                >
                  <span
                    className="absolute rounded-[3px] bg-[#fef08a] opacity-0 group-hover:opacity-60 transition-opacity duration-150 pointer-events-none"
                    style={{ inset: '0px -3px' }}
                  />
                  <motion.span
                    className="absolute rounded-[3px] bg-[#fde047] pointer-events-none"
                    style={{ inset: '0px -3px', originX: 0 }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: annotationsVisible ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  />
                  <span className="relative text-[#1e1e1e] border-b border-dashed border-[#aaa]">
                    {annotationsVisible ? 'hide' : 'show'}
                  </span>
                </button>
                {' '}process annotations.
              </p>
            </div>

            {/* Context */}
            <div className="flex flex-col gap-4">
              <SectionLabel>Context</SectionLabel>
              <p className="text-[20px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                Working across teams, domains, and product constraints can be messy.
              </p>
              <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                Designing within two distinct product domains, project management tooling and global ecommerce, forced me to wear many hats. But there was one throughline I noticed across all teams.
              </p>
            </div>

            {/* Problem */}
            <div className="flex flex-col gap-6">
              <SectionLabel>Problem</SectionLabel>
              <div className="border-l-2 border-[#c22222] pl-4">
                <p className="text-[20px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                  Legacy components weren&apos;t built for the scale, complexity, or content structure of modern Trimble workflows.
                </p>
              </div>
              <ProblemTabs />
              <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                Each product area had critical UX gaps rooted in the same issue: the components were not adaptable to evolving data models, user needs, or business constraints.
              </p>
            </div>

            {/* Solutions */}
            <div className="flex flex-col gap-16">
              <SectionLabel>Solutions</SectionLabel>

              {/* 1 */}
              <div className="flex flex-col gap-5">
                <Img src="/projectFiles/trimble/trimble14.png" alt="Modular filter component" aspect="aspect-[1156/1323]" />
                <div className="flex flex-col gap-2">
                  <p className="text-[18px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                    A compact component for a multi-category future.
                  </p>
                  <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                    I created a modular component that aligned with Trimble&apos;s design system and could scale to additional data categories during their framework migration.
                  </p>
                </div>
                <KeyDecision>
                  Prioritizing multi-select at the component level — not the filter group — kept the UI compact while giving teams room to scale to new data categories without a redesign.
                </KeyDecision>
              </div>

              {/* 2 */}
              <div className="flex flex-col gap-5">
                <Img src="/projectFiles/trimble/trimble18.png" alt="Localized pricing cards" aspect="aspect-[1156/1323]" />
                <div className="flex flex-col gap-2">
                  <p className="text-[18px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                    Designing for globalization and legal requirements.
                  </p>
                  <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                    I designed the pricing cards to handle multiple languages, tax formats, and region-specific disclaimers, preventing future rollout issues and ensuring the component worked globally from day one.
                  </p>
                </div>
                <KeyDecision>
                  Building a single flexible card template with content slots for currency, tax, and legal copy meant one component could serve every market — rather than maintaining region-specific variants that would diverge over time.
                </KeyDecision>
              </div>

              {/* 3 */}
              <div className="flex flex-col gap-5">
                <Img src="/projectFiles/trimble/trimble22.png" alt="Comparison table guidelines" aspect="aspect-[1080/1350]" />
                <div className="flex flex-col gap-2">
                  <p className="text-[18px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                    Improving clarity through better IA and responsive behavior.
                  </p>
                  <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                    I established content rules and restructured the information architecture so technical specs, industry tags, and descriptions followed predictable patterns, making the comparison system scannable, maintainable, and ready to scale.
                  </p>
                </div>
                <KeyDecision>
                  Defining strict content hierarchy rules — category, feature name, tier value — meant editors couldn&apos;t break the layout with non-conforming content, making the system self-maintaining without constant design oversight.
                </KeyDecision>
              </div>
            </div>

            {/* Takeaways */}
            <div className="flex flex-col gap-8">
              <SectionLabel>Takeaways</SectionLabel>
              {[
                {
                  number: '01',
                  label: 'Small decisions shape large systems.',
                  body: 'Designing filters, pricing, and comparison tables showed me how micro-choices like spacing, hierarchy, and character limits directly affect clarity and usability at scale.',
                },
                {
                  number: '02',
                  label: 'Structure the content, not just the UI.',
                  body: "Many challenges weren't visual problems but IA and content-design problems. Defining guidelines for table behavior, formatting, and copy length made the components more resilient.",
                },
                {
                  number: '03',
                  label: 'Advocate past the requirements.',
                  body: 'Several projects started as simple UI updates, but deeper investigation revealed broader UX issues. Pushing for better solutions led to patterns teams adopted beyond the original scope.',
                },
              ].map(({ number, label, body }) => (
                <div key={number} className="flex gap-5">
                  <span className="text-[13px] font-medium text-[#c22222] tabular-nums shrink-0 pt-0.5">{number}</span>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[17px] font-medium text-[#1e1e1e]">{label}</p>
                    <p className="text-[15px] text-[#4a4a4a] leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Interested to learn more */}
            <div className="flex flex-col gap-3 bg-[#fafaf8] border border-[rgba(176,176,176,0.4)] rounded-[6px] px-6 py-5">
              <SectionLabel>Interested to learn more?</SectionLabel>
              <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                I&apos;d love to walk through my design process more in-depth and highlight the decisions I made. Please reach out if you want to see a full case study!
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
