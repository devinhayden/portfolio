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
    <p className="text-[11px] font-medium tracking-widest text-[rgba(110,110,110,0.5)]">
      {children}
    </p>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] text-[#9a9a9a] leading-snug">{children}</p>
  );
}

function Divider() {
  return <div className="h-px w-full bg-black/8" />;
}

export default function TrimblePage() {
  return (
    <div className="min-h-screen bg-[#f7f6f4] p-4 font-geist">
      <div className="relative min-h-full rounded-[12px] bg-white">
        <div className="flex items-start justify-center px-6 pb-32 pt-16">
          <div className="flex w-[680px] shrink-0 flex-col gap-16">

            {/* Back */}
            <Link
              href="/"
              className="text-[13px] font-medium text-[#b0b0b0] hover:text-[#888] transition-colors w-fit"
            >
              ← BACK
            </Link>

            {/* ── Hero ── */}
            <div className="flex flex-col gap-8">
              <h1 className="text-[22px] font-semibold text-black leading-snug">
                Designing adaptable, scalable UX patterns across project management and ecommerce
              </h1>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
                {[
                  { label: 'ROLE', value: 'UX Design Intern' },
                  { label: 'TIMELINE', value: 'May – Aug 2025' },
                  { label: 'PRODUCT SPACE', value: 'Enterprise B2B SaaS' },
                  { label: 'TOOLS', value: 'Figma, v0, Jira' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <SectionLabel>{label}</SectionLabel>
                    <p className="text-[14px] text-[#6e6e6e]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            {/* ── Context ── */}
            <div className="flex flex-col gap-5">
              <SectionLabel>CONTEXT</SectionLabel>
              <h2 className="text-[18px] font-semibold text-black leading-snug">
                Working across teams, domains, and product constraints.
              </h2>
              <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                As a UX Design Intern at Trimble, I worked across two distinct product domains — ProjectSight (construction project management) and Trimble's global ecommerce platform. Across three projects, I designed scalable components that clarified complex data, reduced cognitive load, and aligned multiple teams during a web-framework migration.
              </p>
            </div>

            <Divider />

            {/* ── Problem ── */}
            <div className="flex flex-col gap-5">
              <SectionLabel>PROBLEM</SectionLabel>
              <h2 className="text-[18px] font-semibold text-black leading-snug">
                Legacy components weren't built for the scale, complexity, or content structure of modern workflows.
              </h2>
              <p className="text-[15px] font-medium text-black">
                Each product area had critical UX gaps rooted in the same issue.
              </p>
              <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                This showed up differently across teams, but despite different surfaces, the underlying design challenge was the same: The components were not adaptable to evolving data models, user needs, or business constraints.
              </p>

              <div className="flex flex-col gap-3 pt-1">
                {[
                  { label: 'PROJECTSIGHT', text: "Users couldn't filter massive daily-report datasets by multiple categories (e.g., company + location)." },
                  { label: 'ECOMMERCE', text: "Pricing cards didn't support global requirements or drive conversion." },
                  { label: 'PRODUCT COMPARISON', text: 'Subscription-style tables broke when applied to long technical specs and multi-industry content.' },
                ].map(({ label, text }) => (
                  <div key={label} className="flex gap-4 rounded-[4px] border border-[rgba(176,176,176,0.4)] px-4 py-3">
                    <SectionLabel>{label}</SectionLabel>
                    <p className="text-[14px] text-[#6e6e6e] leading-snug">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            {/* ── ProjectSight ── */}
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-3">
                <SectionLabel>PROJECTSIGHT</SectionLabel>
                <h2 className="text-[18px] font-semibold text-black leading-snug">
                  Rebuilding a component-based workflow for scale and function.
                </h2>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  ProjectSight is Trimble's flagship project management tool, used by thousands of construction job sites around the globe. Field teams needed to filter 50–100+ job site locations for daily reporting, but the existing dropdown couldn't support multi-category filtering or large data sets.
                </p>
              </div>

              {/* Subsection 1 */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold text-black leading-snug">
                  Exploring interaction patterns for data filtering in the context of construction project management.
                </h3>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  I explored several interaction models for filtering — from simple dropdowns to multi-category panels — with the goal of reducing cognitive load while giving field teams more powerful ways to refine their data. Early iterations tried to let users filter within each data-type panel (like Labor or Equipment), but constant feedback with PMs showed this was over-engineering the workflow. Users needed more control, but not that much granularity; I was solving a deeper problem than the one actually blocking their efficiency.
                </p>
                <ImagePlaceholder />
                <Caption>[Early iterations of filtering within data panels – scrapped but reused component patterns for future iterations.]</Caption>
              </div>

              {/* Subsection 2 */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold text-black leading-snug">
                  Preserving UX while navigating engineering constraints.
                </h3>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  My initial concept reordered active filters in real time to keep selected items visible — but engineers couldn't support dynamic list movement without performance issues. Instead of removing the behavior entirely, I redesigned the interaction so reordering happened after users applied changes. This maintained clarity and predictability while staying fully buildable within engineering constraints.
                </p>
                <ImagePlaceholder />
                <Caption>[To abide by technical constraints from engineering, I created an updated interaction for sorting active filters that preserved UX.]</Caption>
              </div>

              {/* Subsection 3 */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold text-black leading-snug">
                  Designing a compact component for a multi-category future.
                </h3>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  The new filtering UI needed to sit alongside other categories without overwhelming the layout or introducing visual clutter. I created a narrower, modular component that aligned with Trimble's evolving design system and could scale to additional data types during the framework migration. This turned a one-off solution into a reusable building block other teams could adopt.
                </p>
                <ImagePlaceholder />
                <Caption>[I created a small, modular component responsible for one category of filtering, allowing for multi-category filtering via multiple components when used in conjunction on the same page.]</Caption>
              </div>
            </div>

            <Divider />

            {/* ── Ecommerce ── */}
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-3">
                <SectionLabel>ECOMMERCE</SectionLabel>
                <h2 className="text-[18px] font-semibold text-black leading-snug">
                  Creating pricing cards that drive product clarity and conversion.
                </h2>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  Trimble E-commerce serves global customers, driving sales and user acquisition for its growing product line. New pricing cards needed to support global tax laws, localization, discount logic, and responsiveness — while staying consistent with both the Global DS and Marketing Experience styling.
                </p>
              </div>

              {/* Subsection 1 */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold text-black leading-snug">
                  Rebuilding pricing hierarchy to communicate value clearly.
                </h3>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  I reorganized the pricing cards to surface the elements users scan first: deal indicators, product name, price, and key actions. This required tightening the hierarchy so information remained scannable even as content density increased. The result was a layout that made value instantly recognizable across both web and mobile.
                </p>
                <ImagePlaceholder />
                <Caption>[After ~50 iterations of layout design, I landed on a hierarchy that hooked customers in, provided them with necessary info, and left them with the option to secure a deal on any product.]</Caption>
              </div>

              {/* Subsection 2 */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold text-black leading-snug">
                  Designing for global localization and legal requirements.
                </h3>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  With upcoming support for multiple languages, tax formats, and region-specific disclaimer text, the cards needed to flex without breaking. I built patterns that accommodated long strings, variable pricing structures, and legal copy — delivering a globally ready component earlier than planned. This prevented future rollout issues and ensured consistency across international markets.
                </p>
                <ImagePlaceholder />
                <Caption>[Working with Figma tokens and variables, I created localized components across multiple languages and currencies.]</Caption>
              </div>

              {/* Subsection 3 */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold text-black leading-snug">
                  Crafting a responsive component that adapts across breakpoints.
                </h3>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  Designing for desktop and mobile wasn't the challenge — the transition between them was. I created a responsive system that preserved clarity and hierarchy as the layout compressed, adjusting spacing, touch targets, and visual balance to avoid overwhelming mobile users. This transformed the pricing card from a resized component into one intentionally tailored for every breakpoint.
                </p>
                <ImagePlaceholder />
                <Caption>[Testing responsiveness for pricing cards components across web and mobile sizes to ensure there were no broken layouts or errors.]</Caption>
              </div>
            </div>

            <Divider />

            {/* ── Product Comparison ── */}
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-3">
                <SectionLabel>PRODUCT COMPARISON</SectionLabel>
                <h2 className="text-[18px] font-semibold text-black leading-snug">
                  Rethinking comparison for complex product decisions.
                </h2>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  Comparison tables are critical moments in the ecommerce flow — but Trimble's legacy subscription tables couldn't support the depth, nuance, or industry-specific details of hardware and technical products.
                </p>
              </div>

              {/* Subsection 1 */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold text-black leading-snug">
                  Recognizing that legacy subscription tables couldn't scale to technical content.
                </h3>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  Subscription-style tables worked for checkmarks, not long-form specs or industry differences. As products grew more complex, the old tables broke — cluttered grids, empty cells, and 11-column scrolls. I identified this as a structural IA issue, not a visual one.
                </p>
                <ImagePlaceholder />
                <Caption>[I conducted several audits of previous table components to identify issues and pain points.]</Caption>
              </div>

              {/* Subsection 2 */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold text-black leading-snug">
                  Creating two new comparison patterns for different decision flows.
                </h3>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  I introduced two scalable models: an updated traditional table for spec-heavy product families, and a card-based layout for cross-industry comparisons. The card layout let users filter by their industry, removing empty cells and reducing cognitive load.
                </p>
                <ImagePlaceholder />
                <Caption>[Going beyond the initial product requirements, I pitched a new component-type that allowed for scalability and easier integration with other product types.]</Caption>
              </div>

              {/* Subsection 3 */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold text-black leading-snug">
                  Improving clarity through better information structure and responsive behavior.
                </h3>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  I created clear content rules — like character limits, spec formatting, and interaction behaviors — to keep tables readable and consistent across products. This work went beyond visuals; it required restructuring the information architecture so technical specs, industry tags, and long descriptions fit predictable patterns. The result was a comparison system that's easier to scan, easier to maintain, and ready to scale across future products.
                </p>
                <ImagePlaceholder />
                <Caption>[I created annotations with content and interaction guidelines for both table components for not only developers, but for the marketing experience team to develop content for each product.]</Caption>
              </div>
            </div>

            <Divider />

            {/* ── Takeaways ── */}
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <SectionLabel>TAKEAWAYS</SectionLabel>
                <h2 className="text-[18px] font-semibold text-black leading-snug">
                  Designing for scale in two very different product worlds.
                </h2>
                <p className="text-[15px] text-[#6e6e6e] leading-relaxed">
                  Working across construction project management and global ecommerce taught me how to design patterns that stay clear under pressure — whether supporting 100+ data points or dense technical specs. Trimble pushed me to shape not just UI, but information architecture, content rules, and cross-team alignment.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  {
                    label: 'SMALL DECISIONS SHAPE LARGE SYSTEMS',
                    body: 'Designing filters, pricing, and comparison tables showed me how micro-choices — spacing, hierarchy, character limits — directly affect clarity and usability at scale. The details became just as important as the big ideas.',
                  },
                  {
                    label: 'STRUCTURE THE CONTENT, NOT JUST THE UI',
                    body: "Many challenges weren't visual problems but IA and content-design problems. Defining guidelines for table behavior, formatting, and copy length made the components more resilient and reusable across teams.",
                  },
                  {
                    label: 'ADVOCATE PAST THE REQUIREMENTS',
                    body: 'Several projects started as simple UI updates, but deeper investigation revealed broader UX issues. Pushing respectfully for better solutions led to new patterns that teams adopted beyond the original scope.',
                  },
                ].map(({ label, body }) => (
                  <div key={label} className="flex flex-col gap-2 rounded-[4px] border border-[rgba(176,176,176,0.4)] px-5 py-4">
                    <SectionLabel>{label}</SectionLabel>
                    <p className="text-[14px] text-[#6e6e6e] leading-relaxed">{body}</p>
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
