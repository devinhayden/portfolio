'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import TransitionLink from '@/components/TransitionLink';

const EMAIL = 'dhayden@usc.edu';

function ReachOut() {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(EMAIL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <span className="relative inline-block">
      <button
        onClick={handleCopy}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="underline underline-offset-2 decoration-[rgba(176,176,176,0.6)] hover:decoration-[#c22222] transition-colors duration-150"
      >
        Reach out
      </button>
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1.5 flex items-center gap-2 whitespace-nowrap rounded-[4px] bg-white border border-[rgba(176,176,176,0.4)] px-2.5 py-1.5 pointer-events-none"
          >
            <span className="text-[12px] text-[#1e1e1e] font-medium">{EMAIL}</span>
            <span className="text-[11px] text-[#aaa]">{copied ? '✓ Copied' : 'Click to copy'}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-semibold tracking-widest text-[#c22222] uppercase">
      {children}
    </p>
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

function Reframe({ before, after }: { before: string; after: string }) {
  return (
    <div className="overflow-hidden rounded-[4px] border border-[rgba(176,176,176,0.4)]">
      <div className="flex flex-col gap-1.5 px-5 py-4 bg-[#fafaf8]">
        <p className="text-[11px] font-semibold tracking-widest text-[#aaa] uppercase">Initial framing</p>
        <p className="text-[14px] text-[#6e6e6e] leading-relaxed">{before}</p>
      </div>
      <div className="h-px w-full bg-[rgba(176,176,176,0.4)]" />
      <div className="flex flex-col gap-1.5 px-5 py-4">
        <p className="text-[11px] font-semibold tracking-widest text-[#c22222] uppercase">Reframed</p>
        <p className="text-[14px] text-[#1e1e1e] leading-relaxed">{after}</p>
      </div>
    </div>
  );
}

function Img({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="w-full overflow-hidden rounded-[4px]">
      <Image src={src} alt={alt} width={0} height={0} sizes="100vw" className="w-full h-auto" />
    </div>
  );
}

// — Video carousel —
const PREVIEW_ITEMS = [
  {
    src: '/projectFiles/voxel/voxelProduct1.mp4',
    label: 'Agent Builder',
    description: 'Build structured call flows with modular blocks',
  },
  {
    src: '/projectFiles/voxel/voxelProduct2.mp4',
    label: 'EMR Variables',
    description: 'Insert EMR data directly into your script',
  },
];

function VideoCarousel() {
  const [active, setActive] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Restart the active video from the beginning when switching tabs
  useEffect(() => {
    const vid = videoRefs.current[active];
    if (vid) {
      vid.currentTime = 0;
      vid.play().catch(() => {});
    }
  }, [active]);

  return (
    <div className="overflow-hidden rounded-[4px] border border-[rgba(176,176,176,0.4)]">
      {/* Video area — 4:3 crop */}
      <div className="relative w-full aspect-[1518/1080] bg-[#f0eeec]">
        {PREVIEW_ITEMS.map((item, i) => (
          <video
            key={i}
            ref={el => { videoRefs.current[i] = el; }}
            src={item.src}
            autoPlay
            loop
            muted
            playsInline
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${i === active ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-t border-[rgba(176,176,176,0.4)]">
        {PREVIEW_ITEMS.map((item, i) => (
          <button
            key={item.label}
            onClick={() => setActive(i)}
            className={`relative flex-1 flex flex-col gap-1 px-4 py-3 text-left transition-colors duration-150 ${i > 0 ? 'border-l border-[rgba(176,176,176,0.4)]' : ''}`}
          >
            <p className={`text-[13px] font-medium transition-colors duration-150 ${i === active ? 'text-[#1e1e1e]' : 'text-[#aaa] hover:text-[#777]'}`}>
              {item.label}
            </p>
            <p className="text-[12px] text-[#bbb] leading-snug">{item.description}</p>
            {i === active && (
              <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#c22222]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function VoxelPage() {
  return (
    <div className="h-full">
      <div className="relative h-full rounded-[12px] bg-white overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-start justify-center px-6 pb-32 pt-14">
          <div className="flex w-[600px] shrink-0 flex-col gap-14">

            {/* Back */}
            <TransitionLink href="/" className="text-[12px] font-semibold tracking-widest text-[#9a9a9a] hover:text-[#777] transition-colors w-fit uppercase">
              ← Back
            </TransitionLink>

            {/* Hero */}
            <div className="flex flex-col gap-8">
              <p className="text-[20px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                Improving clinic workflows and patient outcomes with agentic voice AI
              </p>
              <div className="relative w-full aspect-[1518/1080] overflow-hidden rounded-[4px]">
                <video autoPlay loop muted playsInline className="h-full w-full object-cover" src="/projectFiles/voxelCoverAnimation.mp4" />
              </div>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: 'ROLE',     value: 'Founding Designer' },
                  { label: 'TIMELINE', value: 'Feb – May 2025' },
                  { label: 'TOOLS',    value: 'Figma, v0, Notion' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <p className="text-[11px] font-semibold tracking-widest text-[#ababab] uppercase">{label}</p>
                    <p className="text-[14px] text-[#1e1e1e] leading-snug">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Context */}
            <div className="flex flex-col gap-4">
              <SectionLabel>Context</SectionLabel>
              <p className="text-[20px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                Ten weeks to go from zero to a working product.
              </p>
              <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                I was the founding designer at a startup incubator, working alongside one PM and two developers. Research, design, and building were all happening at the same time, so every decision had to count.
              </p>
            </div>

            {/* Research */}
            <div className="flex flex-col gap-6">
              <SectionLabel>Research</SectionLabel>
              <p className="text-[20px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                The same friction kept coming up in every conversation.
              </p>
              <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                We talked to front-desk staff at local clinics to get a real sense of what their day looked like. Three things kept coming up, and none of their existing tools were doing anything about them.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { stat: '1–2 hrs',        label: 'spent after closing on manual reminder calls every day' },
                  { stat: 'Mid-call lookups', label: 'constantly flipping to their EMR during patient calls' },
                  { stat: 'Spreadsheets',    label: 'used to track no-shows because nothing else could' },
                ].map(({ stat, label }) => (
                  <div key={stat} className="flex flex-col gap-2 bg-[#fafaf8] rounded-[4px] px-4 py-3 border border-[rgba(176,176,176,0.3)]">
                    <p className="text-[15px] font-semibold text-[#1e1e1e] leading-tight">{stat}</p>
                    <p className="text-[12px] text-[#6e6e6e] leading-snug">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Problem */}
            <div className="flex flex-col gap-6">
              <SectionLabel>Problem</SectionLabel>
              <div className="border-l-2 border-[#c22222] pl-4">
                <p className="text-[20px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                  Front-desk staff are spending hours on manual reminder calls while constantly context-switching to look up patient info mid-conversation.
                </p>
              </div>
              <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                We went in thinking the problem was no-shows. Talking to staff made it clear the real pain was just how much cognitive overhead the whole communication workflow added to their day. That shifted everything.
              </p>
              <Reframe
                before="How might we reduce no-show appointments by improving the consistency of patient reminders?"
                after="How might we simplify clinic workflows so staff can manage patient outreach without extra cognitive load?"
              />
            </div>

            {/* The Product */}
            <div className="flex flex-col gap-6">
              <SectionLabel>The Product</SectionLabel>
              <p className="text-[20px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                A platform for building and deploying AI voice agents.
              </p>
              <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                Voxel lets clinics build custom call agents that connect directly to their EMR. Staff can write scripts, pull in live patient data, and deploy without needing any technical help.
              </p>
              <VideoCarousel />
            </div>

            {/* Process */}
            <div className="flex flex-col gap-16">
              <SectionLabel>Process</SectionLabel>

              {/* 1 */}
              <div className="flex flex-col gap-5">
                <Img src="/projectFiles/voxel/voxelSolution1.png" alt="Agent builder interface" />
                <div className="flex flex-col gap-2">
                  <p className="text-[18px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                    A builder that felt familiar, not technical.
                  </p>
                  <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                    We tested three approaches: flowcharts, linear forms, and drag-and-drop blocks. Flowcharts felt like looking at a system diagram. Forms were too rigid for the variety of scenarios clinics actually deal with. Blocks hit the sweet spot — enough structure to guide someone, enough flexibility to handle real workflows.
                  </p>
                </div>
                <KeyDecision>
                  Going with drag-and-drop over a flowchart meant trading some configurability for a much shorter learning curve. For staff without any technical background, that was an easy call.
                </KeyDecision>
              </div>

              {/* 2 */}
              <div className="flex flex-col gap-5">
                <Img src="/projectFiles/voxel/voxelSolution2.png" alt="EMR variable blocks" />
                <div className="flex flex-col gap-2">
                  <p className="text-[18px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                    Patient data, already in the script.
                  </p>
                  <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                    Shadowing a few clinic calls made it obvious: staff were constantly pausing to flip over to their EMR mid-conversation. EMR variable blocks let us pull that data directly into the script — patient name, appointment time, visit type — so it&apos;s all there before the call even starts.
                  </p>
                </div>
                <KeyDecision>
                  Pushing for EMR integration mid-build was a real scope risk. But a script with no patient context would have felt generic on every call. It wasn&apos;t a nice-to-have — it was what made the product actually useful.
                </KeyDecision>
              </div>

              {/* 3 */}
              <div className="flex flex-col gap-5">
                <Img src="/projectFiles/voxel/voxelSolution3.png" alt="Simplified agent configuration" />
                <div className="flex flex-col gap-2">
                  <p className="text-[18px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                    Hiding the complexity they didn&apos;t need.
                  </p>
                  <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                    The Retell API had a lot going on under the hood — way too much to expose directly to clinic staff. Working with the devs, we mapped out the full data model and distilled it into a handful of building blocks. Coordinators could set up and launch agents on their own, no IT required.
                  </p>
                </div>
                <KeyDecision>
                  Pulling back on configurability wasn&apos;t a concession — it was the point. The difference between something staff could use on day one and something that needed an IT ticket was exactly how much we were willing to simplify.
                </KeyDecision>
              </div>
            </div>

            {/* Takeaways */}
            <div className="flex flex-col gap-8">
              <SectionLabel>Takeaways</SectionLabel>
              {[
                {
                  number: '01',
                  label: '0→1 is more than design work.',
                  body: "Founding designer meant pitch decks, design critiques, and presenting to investors at LavaLab Demo Day. Design was the vehicle, but the role stretched well beyond it.",
                },
                {
                  number: '02',
                  label: 'Familiar patterns earn trust quickly.',
                  body: "Drag-and-drop worked because it felt like something people had already used. That recognition did more for the learning curve than any onboarding flow would have.",
                },
                {
                  number: '03',
                  label: 'Research gives you cover to push back.',
                  body: "EMR integration wasn't part of the original scope. The research made the case for it, and having that foundation made it a lot easier to defend when it added complexity mid-build.",
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
                I&apos;d love to walk through my design process in more depth. <ReachOut /> and I can share a full case study.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
