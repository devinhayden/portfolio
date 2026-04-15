import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trimble — Devin Hayden',
};

function ImagePlaceholder({ aspectRatio = 'aspect-video' }: { aspectRatio?: string }) {
  return (
    <div className={`w-full ${aspectRatio} rounded-[4px] bg-[#f0ede8]`} />
  );
}

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
        <span className="text-[11px] font-medium text-[rgba(110,110,110,0.35)] tabular-nums">{number}</span>
        <div className="h-px flex-1 bg-black/[0.06]" />
        <SectionLabel>{label}</SectionLabel>
      </div>
      <h2 className="text-[20px] font-semibold text-black leading-snug">{headline}</h2>
      <p className="text-[15px] text-[#6e6e6e] leading-relaxed">{intro}</p>
    </div>
  );
}

function Subsection({
  headline,
  body,
  imageAspect = 'aspect-video',
  twoCol = false,
  caption,
  pullQuote,
  stats,
}: {
  headline: string;
  body: string;
  imageAspect?: string;
  twoCol?: boolean;
  caption: string;
  pullQuote?: string;
  stats?: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[15px] font-semibold text-black leading-snug">{headline}</h3>
      <p className="text-[15px] text-[#6e6e6e] leading-relaxed">{body}</p>
      {stats && (
        <div className="flex gap-10 py-1">
          {stats.map(s => (
            <div key={s.value} className="flex flex-col gap-0.5">
              <span className="text-[26px] font-semibold text-black leading-none">{s.value}</span>
              <span className="text-[12px] text-[#b0b0b0]">{s.label}</span>
            </div>
          ))}
        </div>
      )}
      {pullQuote && <PullQuote>{pullQuote}</PullQuote>}
      {twoCol ? (
        <div className="grid grid-cols-2 gap-3">
          <ImagePlaceholder aspectRatio={imageAspect} />
          <ImagePlaceholder aspectRatio={imageAspect} />
        </div>
      ) : (
        <ImagePlaceholder aspectRatio={imageAspect} />
      )}
      <Caption>{caption}</Caption>
    </div>
  );
}

export default function TrimblePage() {
  return (
    <div className="min-h-screen bg-[#f7f6f4] p-4 font-geist">
      <div className="relative min-h-full rounded-[12px] bg-white">
        <div className="flex items-start justify-center px-6 pb-32 pt-14">
          <div className="flex w-[720px] shrink-0 flex-col gap-16">

            {/* Back */}
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
                (construction project management) and Trimble's global ecommerce platform. Across three projects,
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
                  Legacy components weren't built for the scale, complexity, or content structure of modern workflows.
                </h2>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  This showed up differently across teams, but despite different surfaces, the underlying design
                  challenge was the same: the components were not adaptable to evolving data models, user needs,
                  or business constraints.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {[
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
                ].map(({ label, text }) => (
                  <div key={label} className="flex items-baseline gap-4 rounded-[4px] bg-[#faf9f8] px-4 py-3.5">
                    <span className="shrink-0 text-[11px] font-medium tracking-widest text-[rgba(110,110,110,0.5)] uppercase w-[120px]">{label}</span>
                    <p className="text-[14px] text-[#6e6e6e] leading-snug">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Chapter 01: ProjectSight ── */}
            <div className="flex flex-col gap-10 pt-4">
              <ChapterOpener
                number="01"
                label="ProjectSight"
                headline="Rebuilding a component-based workflow for scale and function."
                intro="ProjectSight is Trimble's flagship project management tool, used by thousands of construction job sites around the globe. Field teams needed to filter 50–100+ job site locations for daily reporting, but the existing dropdown couldn't support multi-category filtering or large data sets."
              />

              <div className="flex gap-10 py-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[28px] font-semibold text-black leading-none">50–100+</span>
                  <span className="text-[12px] text-[#b0b0b0]">job site locations to filter</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[28px] font-semibold text-black leading-none">3</span>
                  <span className="text-[12px] text-[#b0b0b0]">projects across two product domains</span>
                </div>
              </div>

              <Subsection
                headline="Exploring interaction patterns for data filtering in the context of construction project management."
                body="I explored several interaction models for filtering — from simple dropdowns to multi-category panels — with the goal of reducing cognitive load while giving field teams more powerful ways to refine their data. Early iterations tried to let users filter within each data-type panel (like Labor or Equipment), but constant feedback with PMs showed this was over-engineering the workflow."
                twoCol
                imageAspect="aspect-[4/3]"
                pullQuote="I was solving a deeper problem than the one actually blocking their efficiency."
                caption="Early iterations of filtering within data panels — scrapped but reused component patterns for future iterations."
              />

              <Subsection
                headline="Preserving UX while navigating engineering constraints."
                body="My initial concept reordered active filters in real time to keep selected items visible — but engineers couldn't support dynamic list movement without performance issues. Instead of removing the behavior entirely, I redesigned the interaction so reordering happened after users applied changes. This maintained clarity and predictability while staying fully buildable within engineering constraints."
                caption="Updated interaction for sorting active filters that preserved UX while abiding by technical constraints from engineering."
              />

              <Subsection
                headline="Designing a compact component for a multi-category future."
                body="The new filtering UI needed to sit alongside other categories without overwhelming the layout or introducing visual clutter. I created a narrower, modular component that aligned with Trimble's evolving design system and could scale to additional data types during the framework migration. This turned a one-off solution into a reusable building block other teams could adopt."
                caption="A small, modular component responsible for one category of filtering — allowing multi-category filtering via multiple components used in conjunction."
              />
            </div>

            {/* ── Chapter 02: Ecommerce ── */}
            <div className="flex flex-col gap-10 pt-4">
              <ChapterOpener
                number="02"
                label="Ecommerce"
                headline="Creating pricing cards that drive product clarity and conversion."
                intro="Trimble E-commerce serves global customers, driving sales and user acquisition for its growing product line. New pricing cards needed to support global tax laws, localization, discount logic, and responsiveness — while staying consistent with both the Global DS and Marketing Experience styling."
              />

              <Subsection
                headline="Rebuilding pricing hierarchy to communicate value clearly."
                body="I reorganized the pricing cards to surface the elements users scan first: deal indicators, product name, price, and key actions. This required tightening the hierarchy so information remained scannable even as content density increased. The result was a layout that made value instantly recognizable across both web and mobile."
                twoCol
                imageAspect="aspect-[4/3]"
                caption="After ~50 iterations of layout design, a hierarchy that hooks customers in, surfaces necessary info, and leaves them with the option to secure a deal on any product."
              />

              <Subsection
                headline="Designing for global localization and legal requirements."
                body="With upcoming support for multiple languages, tax formats, and region-specific disclaimer text, the cards needed to flex without breaking. I built patterns that accommodated long strings, variable pricing structures, and legal copy — delivering a globally ready component earlier than planned. This prevented future rollout issues and ensured consistency across international markets."
                pullQuote="Delivering a globally ready component earlier than planned prevented future rollout issues and ensured consistency across international markets."
                caption="Working with Figma tokens and variables, localized components across multiple languages and currencies."
              />

              <Subsection
                headline="Crafting a responsive component that adapts across breakpoints."
                body="Designing for desktop and mobile wasn't the challenge — the transition between them was. I created a responsive system that preserved clarity and hierarchy as the layout compressed, adjusting spacing, touch targets, and visual balance to avoid overwhelming mobile users. This transformed the pricing card from a resized component into one intentionally tailored for every breakpoint."
                twoCol
                imageAspect="aspect-[3/4]"
                caption="Testing responsiveness for pricing card components across web and mobile sizes to ensure no broken layouts or errors."
              />
            </div>

            {/* ── Chapter 03: Product Comparison ── */}
            <div className="flex flex-col gap-10 pt-4">
              <ChapterOpener
                number="03"
                label="Product Comparison"
                headline="Rethinking comparison for complex product decisions."
                intro="Comparison tables are critical moments in the ecommerce flow — but Trimble's legacy subscription tables couldn't support the depth, nuance, or industry-specific details of hardware and technical products."
              />

              <Subsection
                headline="Recognizing that legacy subscription tables couldn't scale to technical content."
                body="Subscription-style tables worked for checkmarks, not long-form specs or industry differences. As products grew more complex, the old tables broke — cluttered grids, empty cells, and 11-column scrolls. I identified this as a structural IA issue, not a visual one."
                caption="Several audits of previous table components to identify issues and pain points."
              />

              <Subsection
                headline="Creating two new comparison patterns for different decision flows."
                body="I introduced two scalable models: an updated traditional table for spec-heavy product families, and a card-based layout for cross-industry comparisons. The card layout let users filter by their industry, removing empty cells and reducing cognitive load."
                twoCol
                imageAspect="aspect-video"
                pullQuote="Going beyond the initial requirements, I pitched a new component-type that allowed for scalability and easier integration with other product types."
                caption="Two new comparison patterns — a spec table and a card-based layout for cross-industry filtering."
              />

              <Subsection
                headline="Improving clarity through better information structure and responsive behavior."
                body="I created clear content rules — like character limits, spec formatting, and interaction behaviors — to keep tables readable and consistent across products. This work went beyond visuals; it required restructuring the information architecture so technical specs, industry tags, and long descriptions fit predictable patterns. The result was a comparison system that's easier to scan, easier to maintain, and ready to scale across future products."
                caption="Content and interaction guidelines annotated for developers and the marketing experience team to develop content for each product."
              />
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
                  patterns that stay clear under pressure — whether supporting 100+ data points or dense technical
                  specs. Trimble pushed me to shape not just UI, but information architecture, content rules,
                  and cross-team alignment.
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
