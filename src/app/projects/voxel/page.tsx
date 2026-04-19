'use client';

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
                Ten weeks to go from zero to a working product.
              </p>
              <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                I worked as both designer and co-founder through a startup incubator alongside one PM and two developers. Research, design, and iteration were all happening in parallel. Every decision had to pull its weight.
              </p>
            </div>

            {/* Research */}
            <div className="flex flex-col gap-6">
              <SectionLabel>Research</SectionLabel>
              <p className="text-[20px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                The same friction kept coming up across every conversation.
              </p>
              <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                We talked to front-desk staff at local clinics to understand what the job actually looked like day to day. Three problems surfaced consistently, and none of their existing tools addressed any of them.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { stat: '1–2 hrs', label: 'spent after closing on manual reminder calls every day' },
                  { stat: 'Mid-call lookups', label: 'constantly flipping to their EMR during patient calls' },
                  { stat: 'Spreadsheets', label: 'used to track no-shows because nothing else could' },
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
                  Front-desk staff juggle manual reminder calls and fragmented patient information, creating unnecessary workload and gaps in communication.
                </p>
              </div>
              <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                Our initial instinct was to focus on reducing no-shows. But talking to staff made it clear the real issue was the cognitive load of the whole communication workflow. We shifted the problem frame entirely.
              </p>
              <Reframe
                before="How might we reduce no-show appointments by improving the consistency of patient reminders?"
                after="How might we simplify clinic workflows so staff can manage patient outreach without extra cognitive load?"
              />
            </div>

            {/* Solutions */}
            <div className="flex flex-col gap-16">
              <SectionLabel>Solutions</SectionLabel>

              {/* 1 */}
              <div className="flex flex-col gap-5">
                <Placeholder />
                <div className="flex flex-col gap-2">
                  <p className="text-[18px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                    A builder that felt familiar, not technical.
                  </p>
                  <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                    We tested three ways to let clinics build their own AI agents. Flowcharts exposed too much system logic and made even simple scripts feel intimidating. Linear forms were too rigid to handle the range of scenarios clinics actually needed. Drag-and-drop block builders were the right call. Structured enough to guide users, flexible enough to handle real workflows.
                  </p>
                </div>
                <KeyDecision>
                  Choosing drag-and-drop over a flowchart model meant giving up some configurability for a much shorter learning curve. For clinical staff without a technical background, that was the right trade.
                </KeyDecision>
              </div>

              {/* 2 */}
              <div className="flex flex-col gap-5">
                <Placeholder />
                <div className="flex flex-col gap-2">
                  <p className="text-[18px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                    Patient data, already in the script.
                  </p>
                  <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                    Shadowing clinic calls made one thing immediately clear: staff were pausing mid-call to look things up in a separate system. EMR-linked variable blocks pulled live data directly into scripts. Patient name, appointment time, visit type — all there before the call even starts.
                  </p>
                </div>
                <KeyDecision>
                  Proposing EMR integration mid-build was a scope risk. But a script with no patient context would have broken trust on every call. It wasn't a feature add. It was the product.
                </KeyDecision>
              </div>

              {/* 3 */}
              <div className="flex flex-col gap-5">
                <Placeholder />
                <div className="flex flex-col gap-2">
                  <p className="text-[18px] font-medium text-[#1e1e1e] leading-snug tracking-tight">
                    Hiding the complexity users didn&apos;t need.
                  </p>
                  <p className="text-[16px] text-[#4a4a4a] leading-relaxed">
                    The underlying Retell API had a lot of depth but was way too exposed for clinical staff. Working with the dev team, we unpacked the full data model and rebuilt it as a simplified set of building blocks. Coordinators could build and deploy agents without any engineering support.
                  </p>
                </div>
                <KeyDecision>
                  Limiting configurability wasn't a compromise. It was a product decision that made the difference between something staff could use on day one and something that needed IT involvement.
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
                  body: 'Working as founding designer meant writing pitch decks, running design critiques, and presenting to investors at LavaLab Demo Day. The design was the vehicle. The role was a lot bigger.',
                },
                {
                  number: '02',
                  label: 'Familiar patterns earn trust fast.',
                  body: "Drag-and-drop worked not because it was technically optimal but because it felt immediately recognizable. That familiarity reduced the learning curve more than any onboarding flow could have.",
                },
                {
                  number: '03',
                  label: 'Research gives you the confidence to push scope.',
                  body: "Proposing EMR integration wasn't in the original plan. The research backed it up. Defending it turned a potential delay into the product's most valuable feature.",
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
