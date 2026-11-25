"use client";

import Image from "next/image";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useDialKit, type TransitionConfig } from "dialkit";

import { LandingHero } from "@/components/LandingHero";
import { MobileSite } from "@/components/MobileSite";
import { ProjectCarousel } from "@/components/ProjectCarousel";
import { ScrollCue } from "@/components/ScrollCue";
import { DesignCarousel } from "@/components/design/DesignCarousel";
import { DesignDeepDive } from "@/components/design/DesignDeepDive";
import { DESIGN_PROJECTS } from "@/components/design/designProjects";
import {
  CARDS,
  DESIGN,
  PHOTOS,
  WRITING,
} from "@/components/projects";
import { PhotoGrid } from "@/components/photos/PhotoGrid";
import { WritingIndex } from "@/components/writing/WritingIndex";
import { WritingReader } from "@/components/writing/WritingReader";
import { PHONE, useMedia } from "@/components/useMedia";
import {
  COLLAPSED_SCALE,
  CONTAINER_RADIUS,
  RUNWAY_VH,
  useRunwayProgress,
  useSceneLayout,
  ZOOM_END,
} from "@/components/sceneLayout";

/** Reveal anyway if something stalls. */
const LOAD_TIMEOUT_MS = 6000;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
/** The crossfade between covers: unhurried, but over before you wait on it. */
const SWAP_DURATION = 0.75;
/** The card the page opens on, and the only one that isn't a project. */
const HOME_INDEX = 0;
/** The writing card: live like home, its cover the writing index itself. */
const WRITING_INDEX = CARDS.indexOf(WRITING);
/** The design card: the project carousel, with a deep dive below it. */
const DESIGN_INDEX = CARDS.indexOf(DESIGN);
/** The photos card: the grid of stacks. */
const PHOTOS_INDEX = CARDS.indexOf(PHOTOS);
/** Cards whose cover is a live page rather than a photo. */
const isLive = (index: number) =>
  index === HOME_INDEX ||
  index === WRITING_INDEX ||
  index === DESIGN_INDEX ||
  index === PHOTOS_INDEX;

/** How long the opening holds at full bleed before pulling back. */
const INTRO_HOLD = 1.5;
/** And how long the pull-back itself takes. */
const INTRO_COLLAPSE = 1.25;
/** A quick release that glides into place. */
const INTRO_EASE: [number, number, number, number] = [0.07, 1.02, 0.66, 1.01];
/** The cover crossfade's curve. */
const SWAP_EASE: [number, number, number, number] = [0.65, 0, 0.36, 0.98];

/** Openness at which the carousel has finished arriving. */
const CAROUSEL_IN = 0.45;
/** Below this the strip is settled enough to click. */
const CAROUSEL_LIVE = 0.04;
/** In the opening, the beat between the window settling and the strip rising. */
const CAROUSEL_DELAY = 0.2;
/** And how long the strip takes to rise. */
const CAROUSEL_RISE = 0.75;
const CAROUSEL_EASE: [number, number, number, number] = [0.37, -0.03, 0.62, 1.02];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * The address a card has once its cover fills the screen. Home has no page
 * of its own: it is `/` however far in you are.
 */
const pathFor = (index: number) => {
  const card = CARDS[index];
  if (index === HOME_INDEX) return "/";
  if (card === WRITING) return "/writing";
  if (card === DESIGN) return "/design";
  if (card === PHOTOS) return "/photos";
  return `/${card.slug}`;
};

/** A DialKit curve (easing or spring) as options for motion's `animate`. */
function toAnimation(transition: TransitionConfig, reduceMotion: boolean | null) {
  if (reduceMotion) return { duration: 0 };
  return transition.type === "easing"
    ? { duration: transition.duration, ease: transition.ease }
    : transition;
}

/** Resolves once the photo can be drawn, however far along it already is. */
function decoded(image: HTMLImageElement) {
  const loaded = image.complete
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
  return loaded.then(() => image.decode().catch(() => {}));
}

/**
 * The site. On a phone the cards don't have room to sit side by side, so
 * the same pages come as plain tabs instead (`MobileSite`); everywhere else
 * it's the scroll-in picker below. Either way a piece of writing opens as a
 * sheet over the page (`WritingReader`), and `initialPiece` is the one a
 * direct link to it opened on.
 */
export function ProjectIndex({
  initialSlug,
  initialPiece,
}: {
  initialSlug?: string;
  initialPiece?: string;
}) {
  const phone = useMedia(PHONE);
  return (
    <WritingReader initialSlug={initialPiece}>
      {phone ? (
        <MobileSite initialSlug={initialSlug} />
      ) : (
        <PickerIndex initialSlug={initialSlug} />
      )}
    </WritingReader>
  );
}

/**
 * The scroll-in picker: one document that opens on the landing full bleed, pulls back to
 * a picker of cards, and dives into whichever card is chosen.
 *
 * The cards are the site's four pages: home (the landing and About),
 * Writing, Design and Photos. Each cover is the live page itself, so
 * diving into a card brings that page up to full bleed.
 *
 * `initialSlug` is set when a direct link to one of those pages (`/writing`,
 * `/design`, `/photos`) is what loaded the page. The site is one document either way: that entry just starts at
 * the far end of the zoom instead of at the picker, so scrolling up from a
 * shared link pulls back to the shelf exactly as it would have done had the
 * visitor scrolled in themselves.
 */
function PickerIndex({ initialSlug }: { initialSlug?: string }) {
  const cardIndex = CARDS.findIndex((card) => card.slug === initialSlug);
  const entryIndex = cardIndex < 0 ? HOME_INDEX : cardIndex;
  const entered = initialSlug !== undefined;

  const runwayRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const photoRefs = useRef(new Map<number, HTMLImageElement>());
  const swapAnimation = useRef<AnimationPlaybackControls>(null);

  /** Crossfade between the cover on screen and the one the carousel picked. */
  const swap = useMotionValue(0);

  const reduceMotion = useReducedMotion();

  // Live tuning (dev only). Values persist locally, so an intro tweak
  // survives the reload it takes to see it again.
  const dial = useDialKit(
    "Home index",
    {
      intro: {
        hold: [INTRO_HOLD, 0, 4, 0.05],
        collapse: {
          type: "easing",
          duration: INTRO_COLLAPSE,
          ease: INTRO_EASE,
        },
      },
      swap: { type: "easing", duration: SWAP_DURATION, ease: SWAP_EASE },
      menu: {
        delay: [CAROUSEL_DELAY, 0, 1.5, 0.05],
        rise: { type: "easing", duration: CAROUSEL_RISE, ease: CAROUSEL_EASE },
      },
      grayscale: false,
    },
    { id: "home-index", persist: true },
  );
  // Read at the moment an animation starts, so moving a dial never restarts
  // one already running.
  const introOptions = useEffectEvent(() => ({
    delay: reduceMotion ? 0 : dial.intro.hold,
    ...toAnimation(dial.intro.collapse, reduceMotion),
  }));
  const swapOptions = useEffectEvent(() =>
    toAnimation(dial.swap, reduceMotion),
  );
  const menuOptions = useEffectEvent(() => ({
    delay: reduceMotion ? 0 : dial.menu.delay,
    ...toAnimation(dial.menu.rise, reduceMotion),
  }));

  const [photoReady, setPhotoReady] = useState(false);
  const [homeReady, setHomeReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  // The cover on screen, and the one fading in over it during a swap.
  const [base, setBase] = useState(entryIndex);
  const [top, setTop] = useState<number | null>(null);
  const active = top ?? base;
  const activeCard = CARDS[active];
  /** Photo covers only: the live covers are layered apart. */
  const photoLayers = (top === null ? [base] : [base, top]).filter(
    (index) => !isLive(index),
  );
  /**
   * The About card's second state. Arriving full bleed shows the intro;
   * clicking its bubble plays the sequence to the about. Scrolling back out
   * returns it to the intro on the way to the picker.
   *
   * It used to open on one more scroll down, but no threshold could tell a
   * deliberate scroll from the momentum of the one that zoomed in. A click
   * can't be mistaken.
   */
  const [aboutOpen, setAboutOpen] = useState(false);
  /** The design project on show, shared by the carousel and its deep dive. */
  const [designIndex, setDesignIndex] = useState(0);
  const aboutOpenRef = useRef(false);
  /** The active card fills the screen: its live cover, if any, is in use. */
  const [fullBleed, setFullBleed] = useState(false);
  /** The bubble was clicked from the picker: open once the zoom lands. */
  const openOnArrival = useRef(false);
  /** The last scroll position seen, to tell if the visitor turned back. */
  const lastY = useRef(0);

  const layout = useSceneLayout(stageRef);
  const collapsedScale = layout?.scale ?? COLLAPSED_SCALE;
  // `layout` is a fresh object on every resize; the opening only cares that
  // one exists, or a window drag mid-animation would start it over.
  const measured = layout !== null;

  const scrollYProgress = useRunwayProgress(runwayRef, stageRef);

  /**
   * Openness: 0 at the resting picker, 1 with the cover filling the screen.
   * The opening animates it down from 1; scroll drives it back up. One value
   * means the two can never disagree about where the scene is.
   */
  const openness = useMotionValue(1);

  const sceneScale = useTransform(openness, [0, 1], [collapsedScale, 1]);
  const sceneY = useTransform(openness, [0, 1], [layout?.shiftY ?? 0, 0]);
  const frameRadius = useTransform(
    openness,
    [0, 1],
    [CONTAINER_RADIUS / collapsedScale, 0],
  );
  // The strip trails the scene: it only starts moving once most of the
  // collapse has happened, so the two reads as cause and effect.
  /**
   * How far the strip sits below its resting place: 0 in place, 1 tucked
   * away. Scroll keeps it locked to openness; the opening instead lets the
   * window settle first, then raises it on its own beat.
   */
  const carouselHidden = useMotionValue(1);
  const carouselY = useTransform(
    carouselHidden,
    [0, 1],
    [0, layout?.carouselRestY ?? 0],
  );
  const [carouselOpen, setCarouselOpen] = useState(false);
  // One subscription covers every way the strip can settle — the opening
  // finishing, a restored scroll position, or diving back out of a project.
  useMotionValueEvent(carouselHidden, "change", (value) =>
    setCarouselOpen(value * CAROUSEL_IN <= CAROUSEL_LIVE),
  );

  // The way in: visible only at rest — gone during the opening, gone once
  // you move.
  const openCue = useTransform(
    [carouselHidden, scrollYProgress],
    ([hidden, progress]: number[]) =>
      (1 - clamp01((hidden * CAROUSEL_IN) / CAROUSEL_LIVE)) *
      (1 - clamp01(progress / 0.1)),
  );
  // The way back: arrives as the zoom lands on a page.
  const backCue = useTransform(
    scrollYProgress,
    [ZOOM_END * 0.9, ZOOM_END],
    [0, 1],
    { clamp: true },
  );

  const ready =
    timedOut ||
    (fontsReady &&
      (entryIndex === HOME_INDEX
        ? homeReady
        : // Writing and Design draw their covers live, with no photo to wait on.
          isLive(entryIndex) || photoReady));

  /**
   * Clicking the selected thumbnail is the shortcut for the scroll. It moves
   * the page rather than navigating, so it lands in exactly the state the
   * gesture would have reached.
   */
  const openProject = () => {
    const runway = runwayRef.current;
    const stage = stageRef.current;
    if (!runway || !stage) return;
    const distance = Math.max(1, runway.offsetHeight - stage.offsetHeight);
    window.scrollTo({
      top: runway.offsetTop + distance * ZOOM_END,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  /** Scroll position past the runway's top, and where full bleed begins. */
  const runwayPosition = () => {
    const runway = runwayRef.current;
    const stage = stageRef.current;
    if (!runway || !stage) return null;
    const distance = Math.max(1, runway.offsetHeight - stage.offsetHeight);
    return {
      y: window.scrollY - runway.offsetTop,
      zoomEnd: distance * ZOOM_END,
    };
  };

  const setAbout = (open: boolean) => {
    aboutOpenRef.current = open;
    setAboutOpen(open);
  };

  /**
   * The bubble: plays the About sequence. From the picker it zooms in
   * first, and the sequence starts once the zoom lands.
   */
  const learnMore = () => {
    const position = runwayPosition();
    if (!position || active !== HOME_INDEX) return;
    if (position.y >= position.zoomEnd - 1) {
      setAbout(true);
      return;
    }
    openOnArrival.current = true;
    window.scrollTo({
      top: runwayRef.current!.offsetTop + position.zoomEnd,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  /**
   * Keeps the About card's state in step with the scroll: leaving full
   * bleed closes it, and a zoom the bubble asked for opens it on landing.
   */
  const updateAbout = () => {
    const position = runwayPosition();
    if (!position) return;
    const { y, zoomEnd } = position;
    // Turning back cancels a pending open.
    if (y < lastY.current) openOnArrival.current = false;
    lastY.current = y;

    setFullBleed(y >= zoomEnd - 1);
    const focused = active === HOME_INDEX && y >= zoomEnd - 1;
    if (!focused) {
      if (aboutOpenRef.current) setAbout(false);
      if (active !== HOME_INDEX) openOnArrival.current = false;
      return;
    }
    if (openOnArrival.current) {
      openOnArrival.current = false;
      setAbout(true);
    }
  };

  /** The cue's shortcut back: the same place the scroll up would reach. */
  const backToMenu = () => {
    const runway = runwayRef.current;
    if (!runway) return;
    window.scrollTo({
      top: runway.offsetTop,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  /** True once scroll, rather than the opening, owns `openness`. */
  const scrollOwns = useRef(false);
  const introAnimation = useRef<AnimationPlaybackControls>(null);
  /** The path the URL currently shows, so it is only rewritten on a change. */
  const shownPath = useRef(entered ? pathFor(entryIndex) : "/");
  /** The strip's own rise at the end of the opening, while it plays. */
  const menuAnimation = useRef<AnimationPlaybackControls>(null);

  // Outside the opening, the strip simply follows the scene.
  useMotionValueEvent(openness, "change", (value) => {
    if (scrollOwns.current && !menuAnimation.current) {
      carouselHidden.set(clamp01(value / CAROUSEL_IN));
    }
  });
  /** Stop the strip's own rise and lock it back to the scene. */
  const handOverMenu = () => {
    if (!menuAnimation.current) return;
    menuAnimation.current.stop();
    menuAnimation.current = null;
    carouselHidden.set(clamp01(openness.get() / CAROUSEL_IN));
  };

  // A reload of the index always starts at the opening. Left to itself the
  // browser restores the old scroll position — on the picker that is often a
  // few px of leftover momentum, enough to read as "already past the
  // opening" and land, unannounced, in a half-revealed scene. Opting this
  // entry out of restoration, and resetting before any effect reads the
  // scroll, keeps the reload looking like a first visit.
  useLayoutEffect(() => {
    if (entered) return;
    history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [entered]);

  // A direct link skips the opening and starts where the zoom ends. The
  // scene already renders full bleed at this point, and the stage is
  // sticky, so moving the page under it changes nothing on screen.
  useEffect(() => {
    if (!entered || !measured || scrollOwns.current) return;
    scrollOwns.current = true;

    const runway = runwayRef.current;
    const stage = stageRef.current;
    if (runway && stage && scrollYProgress.get() < 0.001) {
      const distance = Math.max(1, runway.offsetHeight - stage.offsetHeight);
      window.scrollTo({
        top: runway.offsetTop + distance * ZOOM_END,
        behavior: "instant",
      });
    }
    openness.set(1);
  }, [entered, measured, openness, scrollYProgress]);

  // The opening. It only plays from a cold start at the top of the runway —
  // a restored scroll position means the visitor is already past it.
  useEffect(() => {
    if (!ready || !measured || scrollOwns.current) return;

    if (scrollYProgress.get() > 0.001) {
      scrollOwns.current = true;
      openness.set(clamp01(scrollYProgress.get() / ZOOM_END));
      return;
    }

    const controls = animate(openness, 0, {
      ...introOptions(),
      onComplete: () => {
        // The window has settled; after a beat, the strip rises to meet it.
        menuAnimation.current = animate(carouselHidden, 0, {
          ...menuOptions(),
          onComplete: () => {
            menuAnimation.current = null;
          },
        });
        scrollOwns.current = true;
      },
    });
    introAnimation.current = controls;
    return () => {
      controls.stop();
      if (menuAnimation.current) {
        menuAnimation.current.stop();
        menuAnimation.current = null;
        carouselHidden.set(clamp01(openness.get() / CAROUSEL_IN));
      }
    };
  }, [ready, measured, reduceMotion, openness, carouselHidden, scrollYProgress]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    // Scrolling during the opening cuts it short rather than fighting it.
    if (!scrollOwns.current && progress > 0.002) {
      introAnimation.current?.stop();
      scrollOwns.current = true;
    }
    if (!scrollOwns.current) return;
    // Scrolling before the strip has risen takes it straight to the scene.
    handOverMenu();

    openness.set(clamp01(progress / ZOOM_END));
    updateAbout();

    // Once the cover fills the screen the visitor is on that page, so the
    // address bar should say so — but by rewriting the current entry rather
    // than navigating. Nothing unmounts, nothing reloads, and the same
    // scroll run in reverse puts it back. Each page is a real route too, so
    // the URL this leaves behind is shareable. Home has no page of its own:
    // it is `/` however far in you are.
    const path = progress >= ZOOM_END ? pathFor(active) : "/";
    if (path !== shownPath.current) {
      shownPath.current = path;
      window.history.replaceState(null, "", path);
      document.title =
        path === "/"
          ? "Devin Hayden"
          : `${CARDS[active].title} — Devin Hayden`;
    }
  });

  /**
   * A live cover sits under the photos and shows by their fading away from
   * it, or fades up over them when it's the one arriving.
   */
  const liveLayer = (index: number) => ({
    opacity: base === index ? 1 : top === index ? swap : 0,
    zIndex: top === index ? 2 : 0,
  });
  /** Live pages only take input once they fill the screen. */
  const liveInert = (index: number) => active !== index || !fullBleed;

  const registerPhoto = (index: number) => (el: HTMLImageElement | null) => {
    if (el) photoRefs.current.set(index, el);
    else photoRefs.current.delete(index);
  };

  const handlePhotoLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget
      .decode()
      .catch(() => {})
      .then(() => setPhotoReady(true));
  };

  useEffect(() => {
    const first = photoRefs.current.get(entryIndex);
    if (first?.complete) decoded(first).then(() => setPhotoReady(true));
    document.fonts.ready.then(() => setFontsReady(true));
    const timeout = setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [entryIndex]);

  // Runs the swap once the incoming cover can be drawn: a photo once it has
  // decoded, home straight away (it's already mounted).
  useEffect(() => {
    if (top === null) return;
    const image = photoRefs.current.get(top);
    if (!isLive(top) && !image) return;

    let cancelled = false;
    (image ? decoded(image) : Promise.resolve()).then(() => {
      if (cancelled) return;
      swapAnimation.current = animate(swap, 1, {
        ...swapOptions(),
        onComplete: () => {
          setBase(top);
          setTop(null);
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [top, swap, reduceMotion]);

  const selectProject = (index: number) => {
    if (index === active) return;
    swapAnimation.current?.stop();
    swap.set(0);
    if (top !== null) setBase(top);
    setTop(index);
  };

  return (
    <>
      <main
        ref={runwayRef}
        className="relative"
        style={{ height: `${RUNWAY_VH}svh` }}
      >
        <div
          ref={stageRef}
          className="bg-background sticky top-0 h-[100svh] overflow-hidden"
        >
          {/* The ground the collapsed scene sits on: the menu's wall. It
              carries the texture instead of the pages when the Grain
              panel's placement is "menu". */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={ready ? { opacity: 1 } : undefined}
            transition={{ duration: 0.4, delay: 1.1 }}
            className="bg-paper menu-ground absolute inset-0"
          />

          <motion.div
            style={{ scale: sceneScale, y: sceneY }}
            className="absolute inset-0"
          >
            {/* This is the case study's header. It is not a copy of one on
              another page — the zoom simply lands on it, and the prose
              scrolls up underneath. */}
            <motion.div
              ref={frameRef}
              initial={{ opacity: 0 }}
              animate={ready ? { opacity: 1 } : undefined}
              transition={{ duration: 1.1, ease: EASE_OUT }}
              style={{ borderRadius: frameRadius }}
              className="reveal absolute inset-0 overflow-hidden"
            >
              {/* Home's cover is the live About page. It sits under the photos
                  and is shown by fading photos away from it, or by fading
                  it up over them when it's the one arriving. */}
              <motion.div
                inert={active !== HOME_INDEX}
                style={liveLayer(HOME_INDEX)}
                className="absolute inset-0"
              >
                <LandingHero
                  about={aboutOpen}
                  onLearnMore={learnMore}
                  attention={
                    fullBleed && active === HOME_INDEX && !aboutOpen
                  }
                  onReady={() => setHomeReady(true)}
                />
              </motion.div>

              {/* Writing's cover is the live index, layered the same way.
                  It only takes clicks once it fills the screen: in the
                  picker a click should choose the card, not a piece. */}
              <motion.div
                inert={liveInert(WRITING_INDEX)}
                style={liveLayer(WRITING_INDEX)}
                className="page-ground absolute inset-0 flex items-center justify-center px-4 text-ink"
              >
                <WritingIndex />
              </motion.div>

              {/* Design's cover is the project carousel; its deep dive
                  follows the runway, like a case study's prose. */}
              <motion.div
                inert={liveInert(DESIGN_INDEX)}
                style={liveLayer(DESIGN_INDEX)}
                className="page-ground absolute inset-0 flex items-center justify-center"
              >
                <DesignCarousel
                  index={designIndex}
                  onChange={setDesignIndex}
                  keyboard={!liveInert(DESIGN_INDEX)}
                />
              </motion.div>

              {/* Photos' cover is the grid; its stacks open in place. */}
              <motion.div
                inert={liveInert(PHOTOS_INDEX)}
                style={liveLayer(PHOTOS_INDEX)}
                className="page-ground absolute inset-0"
              >
                <PhotoGrid active={!liveInert(PHOTOS_INDEX)} />
              </motion.div>

              {photoLayers.map((index) => (
                <motion.div
                  key={index}
                  // The cover underneath holds steady while the new one fades
                  // in over it.
                  style={
                    index === top
                      ? { opacity: swap, zIndex: 2 }
                      : { opacity: 1, zIndex: 1 }
                  }
                  className="absolute inset-0"
                >
                  <Image
                    ref={registerPhoto(index)}
                    src={CARDS[index].cover.src}
                    alt=""
                    fill
                    // Cover crops a 3:2 photo, so a portrait viewport needs it
                    // ~1.5× its height wide.
                    sizes="max(100vw, 151vh)"
                    loading="eager"
                    fetchPriority={index === entryIndex ? "high" : "auto"}
                    onLoad={handlePhotoLoad}
                    className={`object-cover ${dial.grayscale ? "grayscale" : ""}`}
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <ProjectCarousel
            projects={CARDS}
            activeIndex={active}
            onSelect={selectProject}
            onOpen={openProject}
            layout={layout}
            y={carouselY}
            open={carouselOpen}
          />

          {/* The scroll rule, taught where it applies: down under the
              picker opens the chosen card, up from a page goes back. Raised
              explicitly: at full bleed the scene drops its transform, and
              the covers' own stacking order would otherwise land on top. */}
          {layout && (
            <div
              style={{ top: layout.cueY }}
              className="pointer-events-none absolute inset-x-0 z-10 flex -translate-y-1/2 justify-center"
            >
              <ScrollCue
                direction="down"
                label={`Scroll to open ${activeCard.title}`}
                visibility={openCue}
                onClick={openProject}
              />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 top-5 z-10 flex justify-center sm:top-6">
            <ScrollCue
              direction="up"
              label="Scroll up to go back"
              visibility={backCue}
              onClick={backToMenu}
            />
          </div>
        </div>
      </main>

      {/* Design's deep dive follows the runway, for whichever project the
          carousel is on. */}
      {active === DESIGN_INDEX && (
        <div className="page-ground relative">
          <DesignDeepDive project={DESIGN_PROJECTS[designIndex]} />
        </div>
      )}
    </>
  );
}
