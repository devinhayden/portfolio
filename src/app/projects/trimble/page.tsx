import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trimble — Devin Hayden',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium tracking-widest text-[rgba(110,110,110,0.5)] uppercase">
      {children}
    </p>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] text-[#b0b0b0] leading-snug">{children}</p>
  );
}

function Divider() {
  return <div className="h-px w-full bg-black/[0.06]" />;
}

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-[2px] border-black/15 pl-5 py-0.5">
      <p className="text-[16px] italic text-black/60 leading-relaxed">{children}</p>
    </blockquote>
  );
}

function Img({
  src,
  alt,
  aspect,
}: {
  src: string;
  alt: string;
  aspect: string;
}) {
  return (
    <div className={`relative w-full ${aspect} overflow-hidden rounded-[4px]`}>
      <Image src={src} alt={alt} fill className="object-cover" />
    </div>
  );
}

function ChapterOpener({
  number,
  label,
  headline,
  intro,
}: {
  number: string;
  label: string;
  headline: string;
  intro: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-medium text-[rgba(110,110,110,0.35)] tabular-nums shrink-0">
          {number}
        </span>
        <div className="h-px flex-1 bg-black/[0.06]" />
        <SectionLabel>{label}</SectionLabel>
      </div>
      <h2 className="text-[20px] font-semibold text-black leading-snug">{headline}</h2>
      <p className="text-[15px] text-[#6e6e6e] leading-relaxed">{intro}</p>
    </div>
  );
}

export default function TrimblePage() {
  return (
    <div className="min-h-screen bg-[#f7f6f4] p-4 font-geist">
      <div className="relative min-h-full rounded-[12px] bg-white">
        <div className="flex items-start justify-center px-6 pb-32 pt-14">
          <div className="flex w-[720px] shrink-0 flex-col gap-16">

            {/* ── Back ── */}
            <Link
              href="/"
              className="text-[12px] font-medium tracking-widest text-[#b0b0b0] hover:text-[#888] transition-colors w-fit"
            >
              ← BACK
            </Link>

            {/* ── Hero ── */}
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-5">
                <SectionLabel>Trimble · UX Design Intern</SectionLabel>
                <h1 className="text-[26px] font-semibold text-black leading-snug max-w-[560px]">
                  Designing adaptable, scalable UX patterns across project management and ecommerce
                </h1>
              </div>
              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: 'ROLE', value: 'UX Design Intern' },
                  { label: 'TIMELINE', value: 'May – Aug 2025' },
                  { label: 'PRODUCT SPACE', value: 'Enterprise B2B SaaS' },
                  { label: 'TOOLS', value: 'Figma, v0, Jira' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <SectionLabel>{label}</SectionLabel>
                    <p className="text-[14px] text-[#6e6e6e] leading-snug">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            {/* ── Context ── */}
            <div className="flex flex-col gap-5">
              <SectionLabel>Context</SectionLabel>
              <h2 className="text-[18px] font-semibold text-black leading-snug">
                Working across teams, domains, and product constraints.
              </h2>
              <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                As a UX Design Intern at Trimble, I worked across two distinct product domains — ProjectSight
                (construction project management) and Trimble&apos;s global ecommerce platform. Across three projects,
                I designed scalable components that clarified complex data, reduced cognitive load, and aligned
                multiple teams during a web-framework migration.
              </p>
            </div>

            <Divider />

            {/* ── Problem ── */}
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-5">
                <SectionLabel>Problem</SectionLabel>
                <h2 className="text-[18px] font-semibold text-black leading-snug">
                  Legacy components weren&apos;t built for the scale, complexity, or content structure of modern workflows.
                </h2>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  This showed up differently across teams, but despite different surfaces, the underlying design
                  challenge was the same: the components were not adaptable to evolving data models, user needs,
                  or business constraints.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'ProjectSight', text: "Users couldn't filter massive daily-report datasets by multiple categories (e.g., company + location)." },
                  { label: 'Ecommerce', text: "Pricing cards didn't support global requirements or drive conversion." },
                  { label: 'Product Comparison', text: 'Subscription-style tables broke when applied to long technical specs and multi-industry content.' },
                ].map(({ label, text }) => (
                  <div key={label} className="flex items-baseline gap-4 rounded-[4px] bg-[#faf9f8] px-4 py-3.5">
                    <span className="shrink-0 text-[11px] font-medium tracking-widest text-[rgba(110,110,110,0.5)] uppercase w-[130px]">
                      {label}
                    </span>
                    <p className="text-[14px] text-[#6e6e6e] leading-snug">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ══════════════════════════════════════════
                CHAPTER 01 — PROJECTSIGHT
            ══════════════════════════════════════════ */}
            <div className="flex flex-col gap-10 pt-4">
              <ChapterOpener
                number="01"
                label="ProjectSight"
                headline="Rebuilding a component-based workflow for scale and function."
                intro="ProjectSight is Trimble's flagship project management tool, used by thousands of construction job sites around the globe. Field teams needed to filter 50–100+ job site locations for daily reporting, but the existing dropdown couldn't support multi-category filtering or large data sets."
              />

              {/* Stat callouts */}
              <div className="flex gap-10">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[28px] font-semibold text-black leading-none">50–100+</span>
                  <span className="text-[12px] text-[#b0b0b0]">job site locations to filter</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[28px] font-semibold text-black leading-none">3</span>
                  <span className="text-[12px] text-[#b0b0b0]">projects across two product domains</span>
                </div>
              </div>

              {/* Subsection 1 — Exploring interaction patterns */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold text-black leading-snug">
                  Exploring interaction patterns for data filtering in the context of construction project management.
                </h3>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  I explored several interaction models for filtering — from simple dropdowns to multi-category
                  panels — with the goal of reducing cognitive load while giving field teams more powerful ways
                  to refine their data. Early iterations tried to let users filter within each data-type panel
                  (like Labor or Equipment), but constant feedback with PMs showed this was over-engineering
                  the workflow.
                </p>
                <PullQuote>
                  I was solving a deeper problem than the one actually blocking their efficiency.
                </PullQuote>
                {/* 2-col: old component audit (left) + new interaction exploration (right) */}
                <div className="grid grid-cols-2 gap-3">
                  <Img
                    src="/projectFiles/trimble/Instagram post - 11.png"
                    alt="Previous filter component audit showing UX issues"
                    aspect="aspect-[4/5]"
                  />
                  <Img
                    src="/projectFiles/trimble/trimble14.png"
                    alt="New interaction exploration for multi-select filtering"
                    aspect="aspect-[4/5]"
                  />
                </div>
                <Caption>
                  Left: audit of the previous filter component — wasted space, no clickable area, no chip fallback. Right: early interaction explorations for the redesigned filter.
                </Caption>
              </div>

              {/* Subsection 2 — Engineering constraints */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold text-black leading-snug">
                  Preserving UX while navigating engineering constraints.
                </h3>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  My initial concept reordered active filters in real time to keep selected items visible —
                  but engineers couldn&apos;t support dynamic list movement without performance issues. Instead of
                  removing the behavior entirely, I redesigned the interaction so reordering happened after
                  users applied changes. This maintained clarity and predictability while staying fully
                  buildable within engineering constraints.
                </p>
                <Img
                  src="/projectFiles/trimble/trimble12.png"
                  alt="Final multi-category filter UI with Company and Location panels"
                  aspect="aspect-[16/9]"
                />
                <Caption>
                  Final filter UI — stacked modular components for Company and Location, with reordering applied on confirm rather than in real time.
                </Caption>
              </div>

              {/* Subsection 3 — Compact component */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold text-black leading-snug">
                  Designing a compact component for a multi-category future.
                </h3>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  The new filtering UI needed to sit alongside other categories without overwhelming the layout
                  or introducing visual clutter. I created a narrower, modular component that aligned with
                  Trimble&apos;s evolving design system and could scale to additional data types during the framework
                  migration. This turned a one-off solution into a reusable building block other teams could adopt.
                </p>
                <Img
                  src="/projectFiles/trimble/trimble15.png"
                  alt="Modular filter component showing current and future scalability"
                  aspect="aspect-[7/8]"
                />
                <Caption>
                  A small, modular component responsible for one filter category — designed to stack with additional categories as the product scales.
                </Caption>
              </div>
            </div>

            {/* ══════════════════════════════════════════
                CHAPTER 02 — ECOMMERCE
            ══════════════════════════════════════════ */}
            <div className="flex flex-col gap-10 pt-4">
              <ChapterOpener
                number="02"
                label="Ecommerce"
                headline="Creating pricing cards that drive product clarity and conversion."
                intro="Trimble E-commerce serves global customers, driving sales and user acquisition for its growing product line. New pricing cards needed to support global tax laws, localization, discount logic, and responsiveness — while staying consistent with both the Global DS and Marketing Experience styling."
              />

              {/* Subsection 1 — Pricing hierarchy */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold text-black leading-snug">
                  Rebuilding pricing hierarchy to communicate value clearly.
                </h3>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  I reorganized the pricing cards to surface the elements users scan first: deal indicators,
                  product name, price, and key actions. This required tightening the hierarchy so information
                  remained scannable even as content density increased. The result was a layout that made value
                  instantly recognizable across both web and mobile.
                </p>
                {/* Before → After stacked */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <SectionLabel>Previous state</SectionLabel>
                    <Img
                      src="/projectFiles/trimble/trimble16.png"
                      alt="Previous pricing card design"
                      aspect="aspect-[4/5]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <SectionLabel>Redesign</SectionLabel>
                    <Img
                      src="/projectFiles/trimble/trimble17.png"
                      alt="Redesigned pricing card with new hierarchy"
                      aspect="aspect-[16/9]"
                    />
                  </div>
                </div>
                <Caption>
                  After ~50 iterations of layout design — a hierarchy that hooks customers in, surfaces necessary info, and ends with a clear path to a deal.
                </Caption>
              </div>

              {/* Subsection 2 — Localization */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold text-black leading-snug">
                  Designing for global localization and legal requirements.
                </h3>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  With upcoming support for multiple languages, tax formats, and region-specific disclaimer
                  text, the cards needed to flex without breaking. I built patterns that accommodated long
                  strings, variable pricing structures, and legal copy — delivering a globally ready component
                  earlier than planned. This prevented future rollout issues and ensured consistency across
                  international markets.
                </p>
                <PullQuote>
                  Delivering a globally ready component earlier than planned prevented future rollout issues and ensured consistency across international markets.
                </PullQuote>
                <div className="grid grid-cols-2 gap-3">
                  <Img
                    src="/projectFiles/trimble/trimble18.png"
                    alt="Pricing cards localized across five languages"
                    aspect="aspect-[7/8]"
                  />
                  <Img
                    src="/projectFiles/trimble/trimble19.png"
                    alt="Figma tokens and variables for localized components"
                    aspect="aspect-[7/8]"
                  />
                </div>
                <Caption>
                  Left: localized pricing cards across English, Portuguese, French, German, and Italian. Right: Figma token structure powering the localization system.
                </Caption>
              </div>

              {/* Subsection 3 — Responsive */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold text-black leading-snug">
                  Crafting a responsive component that adapts across breakpoints.
                </h3>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  Designing for desktop and mobile wasn&apos;t the challenge — the transition between them was. I
                  created a responsive system that preserved clarity and hierarchy as the layout compressed,
                  adjusting spacing, touch targets, and visual balance to avoid overwhelming mobile users.
                  This transformed the pricing card from a resized component into one intentionally tailored
                  for every breakpoint.
                </p>
                <div className="relative w-full aspect-video overflow-hidden rounded-[4px]">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                    src="/projectFiles/trimble/trimbleResponsiveness.mp4"
                  />
                </div>
                <Caption>
                  Pricing card responsiveness tested across web and mobile breakpoints — no broken layouts, adjusted touch targets and spacing at each size.
                </Caption>
              </div>
            </div>

            {/* ══════════════════════════════════════════
                CHAPTER 03 — PRODUCT COMPARISON
            ══════════════════════════════════════════ */}
            <div className="flex flex-col gap-10 pt-4">
              <ChapterOpener
                number="03"
                label="Product Comparison"
                headline="Rethinking comparison for complex product decisions."
                intro="Comparison tables are critical moments in the ecommerce flow — but Trimble's legacy subscription tables couldn't support the depth, nuance, or industry-specific details of hardware and technical products."
              />

              {/* Subsection 1 — Legacy audit */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold text-black leading-snug">
                  Recognizing that legacy subscription tables couldn&apos;t scale to technical content.
                </h3>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  Subscription-style tables worked for checkmarks, not long-form specs or industry differences.
                  As products grew more complex, the old tables broke — cluttered grids, empty cells, and
                  11-column scrolls. I identified this as a structural IA issue, not a visual one.
                </p>
                {/* 2-col: actual table (left) + annotated audit (right) */}
                <div className="grid grid-cols-2 gap-3">
                  <Img
                    src="/projectFiles/trimble/trimble22.png"
                    alt="Legacy comparison table showing structural problems"
                    aspect="aspect-[4/5]"
                  />
                  <Img
                    src="/projectFiles/trimble/trimble23.png"
                    alt="Annotated audit of the legacy table component"
                    aspect="aspect-[4/5]"
                  />
                </div>
                <Caption>
                  Left: the legacy feature comparison table with cluttered rows and empty cells. Right: annotated audit identifying unnecessary tooltips, poor copy, and broken empty-state handling.
                </Caption>
              </div>

              {/* Subsection 2 — Two new patterns */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold text-black leading-snug">
                  Creating two new comparison patterns for different decision flows.
                </h3>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  I introduced two scalable models: an updated traditional table for spec-heavy product
                  families, and a card-based layout for cross-industry comparisons. The card layout let users
                  filter by their industry, removing empty cells and reducing cognitive load.
                </p>
                <PullQuote>
                  Going beyond the initial requirements, I pitched a new component-type that allowed for scalability and easier integration with other product types.
                </PullQuote>
                <Img
                  src="/projectFiles/trimble/trimble24.png"
                  alt="Initial requirement vs additional card-based comparison component"
                  aspect="aspect-[16/9]"
                />
                <Caption>
                  Initial requirement (left): updated spec table. Additional component pitched (right): card-based layout with industry filtering to eliminate empty cells.
                </Caption>
              </div>

              {/* Subsection 3 — Content guidelines */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold text-black leading-snug">
                  Improving clarity through better information structure and responsive behavior.
                </h3>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  I created clear content rules — like character limits, spec formatting, and interaction
                  behaviors — to keep tables readable and consistent across products. This work went beyond
                  visuals; it required restructuring the information architecture so technical specs, industry
                  tags, and long descriptions fit predictable patterns. The result was a comparison system
                  that&apos;s easier to scan, easier to maintain, and ready to scale across future products.
                </p>
                <Img
                  src="/projectFiles/trimble/trimble25.png"
                  alt="Content and interaction guidelines annotated for both table components"
                  aspect="aspect-[16/9]"
                />
                <Caption>
                  Annotated content and interaction guidelines for developers and the marketing experience team — character limits, spec formatting rules, and interaction behaviors for both components.
                </Caption>
              </div>
            </div>

            <Divider />

            {/* ── Takeaways ── */}
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-5">
                <SectionLabel>Takeaways</SectionLabel>
                <h2 className="text-[18px] font-semibold text-black leading-snug">
                  Designing for scale in two very different product worlds.
                </h2>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  Working across construction project management and global ecommerce taught me how to design
                  patterns that stay clear under pressure — whether supporting 100+ data points or dense
                  technical specs. Trimble pushed me to shape not just UI, but information architecture,
                  content rules, and cross-team alignment.
                </p>
              </div>
              <div className="flex flex-col gap-8">
                {[
                  {
                    number: '01',
                    label: 'Small decisions shape large systems',
                    body: 'Designing filters, pricing, and comparison tables showed me how micro-choices — spacing, hierarchy, character limits — directly affect clarity and usability at scale. The details became just as important as the big ideas.',
                  },
                  {
                    number: '02',
                    label: 'Structure the content, not just the UI',
                    body: "Many challenges weren't visual problems but IA and content-design problems. Defining guidelines for table behavior, formatting, and copy length made the components more resilient and reusable across teams.",
                  },
                  {
                    number: '03',
                    label: 'Advocate past the requirements',
                    body: 'Several projects started as simple UI updates, but deeper investigation revealed broader UX issues. Pushing respectfully for better solutions led to new patterns that teams adopted beyond the original scope.',
                  },
                ].map(({ number, label, body }) => (
                  <div key={number} className="flex gap-6">
                    <span className="text-[11px] font-medium text-[rgba(110,110,110,0.35)] tabular-nums shrink-0 pt-0.5">
                      {number}
                    </span>
                    <div className="flex flex-col gap-2">
                      <p className="text-[15px] font-semibold text-black">{label}</p>
                      <p className="text-[15px] text-[#6e6e6e] leading-relaxed">{body}</p>
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
