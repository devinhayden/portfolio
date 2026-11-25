"use client";

import { useEffect, useState } from "react";

import { LandingHero } from "@/components/LandingHero";
import { DesignCarousel } from "@/components/design/DesignCarousel";
import { DesignDeepDive } from "@/components/design/DesignDeepDive";
import { DESIGN_PROJECTS } from "@/components/design/designProjects";
import { PhotoGrid } from "@/components/photos/PhotoGrid";
import { CARDS, DESIGN, HOME, PHOTOS, WRITING, type Card } from "@/components/projects";
import { WritingIndex } from "@/components/writing/WritingIndex";

/**
 * The site on a phone. The scroll-in picker needs room to show the cards
 * side by side, which a phone doesn't have, so here the same four pages are
 * plain pages, switched by a tab pill along the bottom.
 *
 * Switching tabs pushes the page's address, so back steps through them and
 * a reload lands where you were.
 */

/** In the pill's order: home first, as on the picker. */
const TABS: readonly Card[] = [HOME, ...CARDS.filter((card) => card !== HOME)];

const pathFor = (card: Card) => (card === HOME ? "/" : `/${card.slug}`);

const cardForPath = (path: string) =>
  TABS.find((card) => card !== HOME && path.startsWith(`/${card.slug}`)) ??
  HOME;

const titleFor = (card: Card) =>
  card === HOME ? "Devin Hayden" : `${card.title} — Devin Hayden`;

export function MobileSite({ initialSlug }: { initialSlug?: string }) {
  const [tab, setTab] = useState<Card>(
    () => TABS.find((card) => card.slug === initialSlug) ?? HOME,
  );
  const [aboutOpen, setAboutOpen] = useState(false);
  const [designIndex, setDesignIndex] = useState(0);

  const show = (card: Card) => {
    // Home's tab, tapped on home, steps back from the about to the intro.
    if (card === tab) {
      if (card === HOME) setAboutOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.history.pushState(null, "", pathFor(card));
    document.title = titleFor(card);
    window.scrollTo({ top: 0, behavior: "instant" });
    setAboutOpen(false);
    setTab(card);
  };

  // Back and forward move between tabs. A piece of writing's sheet handles
  // its own entry; underneath it, the tab is Writing.
  useEffect(() => {
    const onPop = () => {
      const card = cardForPath(window.location.pathname);
      setTab(card);
      if (card !== HOME) setAboutOpen(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <>
      <main className="page-ground text-ink relative min-h-svh">
        {/* The landing ends above the pill, so nothing at its foot (the
            portrait peeking up, the bubble) sits under the tabs. */}
        {tab === HOME && (
          <div className="h-[calc(100svh-84px)]">
            <LandingHero
              about={aboutOpen}
              onLearnMore={() => setAboutOpen(true)}
              attention={!aboutOpen}
            />
          </div>
        )}

        {tab === WRITING && (
          <div className="flex min-h-svh items-center justify-center px-4 pt-20 pb-32">
            <WritingIndex />
          </div>
        )}

        {tab === DESIGN && (
          <>
            <div className="flex min-h-svh items-center justify-center pt-12 pb-28">
              <DesignCarousel index={designIndex} onChange={setDesignIndex} />
            </div>
            <div className="pb-24">
              <DesignDeepDive project={DESIGN_PROJECTS[designIndex]} />
            </div>
          </>
        )}

        {tab === PHOTOS && (
          <div className="min-h-svh pb-20">
            <PhotoGrid active />
          </div>
        )}
      </main>

      <TabPill tabs={TABS} current={tab} onSelect={show} />
    </>
  );
}

function TabPill({
  tabs,
  current,
  onSelect,
}: {
  tabs: readonly Card[];
  current: Card;
  onSelect: (card: Card) => void;
}) {
  return (
    <nav
      aria-label="Pages"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(16px,env(safe-area-inset-bottom))]"
    >
      <ul className="flex items-center gap-0.5 rounded-full border border-[#ececec] bg-white/85 p-1 shadow-[0_2px_16px_rgba(0,0,0,0.08)] backdrop-blur-md">
        {tabs.map((card) => {
          const selected = card === current;
          return (
            <li key={card.slug}>
              <a
                href={pathFor(card)}
                aria-current={selected ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  onSelect(card);
                }}
                className={`type-mono flex h-9 items-center rounded-full px-3.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                  selected ? "bg-ink text-white" : "text-ink/60 active:text-ink"
                }`}
              >
                {card.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
