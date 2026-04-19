'use client';

import Image from 'next/image';
import TransitionLink from '@/components/TransitionLink';

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

function Placeholder() {
  return (
    <div className="w-full aspect-video bg-[#f0eeec] rounded-[4px] flex items-center justify-center">
      <p className="text-[12px] text-[#ccc] tracking-wide uppercase">Image coming soon</p>
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
                A ten-week window to design, test, and ship a product from scratch.
              </p>
              <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                As founding designer on Voxel, I worked within a startup incubator alongside one PM and two developers. The tight timeline compressed every stage of the design process — research, ideation, and iteration all had to happen in parallel rather than sequence.
              </p>
            </div>

            {/* Problem */}
            <div className="flex flex-col gap-6">
              <SectionLabel>Problem</SectionLabel>
              <div className="border-l-2 border-[#c22222] pl-4">
                <p className="text-[20px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                  The bottleneck wasn&apos;t the technology. It was the workflow around it.
                </p>
              </div>
              <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                Front-desk staff at healthcare clinics were spending up to two hours after closing on manual reminder calls — cross-referencing patient data in their EMR, improvising scripts on the fly, and tracking no-shows in spreadsheets. The cognitive load wasn&apos;t just inefficient. It was burning out the people keeping clinics running.
              </p>
            </div>

            {/* Solutions */}
            <div className="flex flex-col gap-16">
              <SectionLabel>Solutions</SectionLabel>

              {/* 1 — Agent builder */}
              <div className="flex flex-col gap-5">
                <Placeholder />
                <div className="flex flex-col gap-2">
                  <p className="text-[18px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                    A builder that felt familiar, not technical.
                  </p>
                  <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                    Testing three interaction models made the tradeoffs clear. Flowcharts exposed too much system logic for non-technical staff. Linear forms were too rigid to cover the range of scenarios clinics needed. Drag-and-drop block builders hit the right balance — structured enough to guide users, flexible enough to reflect real workflows.
                  </p>
                </div>
                <KeyDecision>
                  Choosing drag-and-drop over a more powerful flowchart model meant trading raw configurability for a much shallower learning curve — the right call for clinical coordinators with no technical background.
                </KeyDecision>
              </div>

              {/* 2 — EMR variable blocks */}
              <div className="flex flex-col gap-5">
                <Placeholder />
                <div className="flex flex-col gap-2">
                  <p className="text-[18px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                    Patient data, already in the script.
                  </p>
                  <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                    After shadowing clinic calls, the constant context-switching was unmistakable — staff pausing mid-call to pull up patient records in a separate system. EMR-linked variable blocks for patient name, appointment time, and visit type pulled live data directly into the call script, removing the platform switch entirely.
                  </p>
                </div>
                <KeyDecision>
                  Proposing EMR integration mid-build was a scope risk. But a script with no patient context would have undermined every call. The integration wasn&apos;t a feature — it was the product.
                </KeyDecision>
              </div>

              {/* 3 — API abstraction */}
              <div className="flex flex-col gap-5">
                <Placeholder />
                <div className="flex flex-col gap-2">
                  <p className="text-[18px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                    Hiding the complexity users didn&apos;t need.
                  </p>
                  <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                    The underlying voice API was capable but overwhelming. Exposing it directly to clinic staff would have killed adoption. I defined a constrained set of building blocks covering the vast majority of use cases — abstracting the technical layer entirely so coordinators could build and deploy agents without any engineering support.
                  </p>
                </div>
                <KeyDecision>
                  Limiting what users could configure wasn&apos;t a compromise — it was a product decision. A narrower interface meant clinic staff could onboard without training and ship agents that actually worked.
                </KeyDecision>
              </div>
            </div>

            {/* Takeaways */}
            <div className="flex flex-col gap-8">
              <SectionLabel>Takeaways</SectionLabel>
              {[
                {
                  number: '01',
                  label: '0→1 is more than design.',
                  body: 'Working as founding designer meant writing pitch decks, running design critiques, and sitting in investor conversations. The design work was the vehicle — but the role was much broader.',
                },
                {
                  number: '02',
                  label: 'Familiar patterns earn trust fast.',
                  body: 'Drag-and-drop worked not because it was technically optimal, but because it felt immediately recognizable. Pattern familiarity reduced friction more than any onboarding flow could have.',
                },
                {
                  number: '03',
                  label: 'Scope creep can be the right call.',
                  body: 'Proposing EMR integration wasn\'t in the original plan. Defending it with research turned a potential delay into the product\'s most valuable feature.',
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
