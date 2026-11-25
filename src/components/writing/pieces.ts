import type { ExperimentKey } from "@/components/lab/experiments";

/**
 * The writing: one piece per experiment, each with the experiment itself as
 * its cover. Listed newest first.
 *
 * DRAFT COPY: each body below is a stand-in that describes what its
 * experiment does. Replace the paragraphs with the real piece; the word
 * count on the index follows on its own.
 */
export type Piece = {
  slug: string;
  title: string;
  /** Year and month, as `YYYY-MM`. */
  date: string;
  /** The experiment that is this piece's cover. */
  cover: ExperimentKey;
  /** A line under the cover saying how to play with it. */
  hint: string;
  /** Paragraphs, in order. */
  body: string[];
};

export const PIECES: Piece[] = [
  {
    slug: "changing-seasons",
    title: "Appreciating cycles, and the lack thereof",
    date: "2026-10",
    cover: "seasons",
    hint: "Click the scene to change the season",
    body: [
      "I’ve lived in LA for most of the past four years, and one of the biggest adjustments has been the lack of seasons.",
      "Back in Portland, the changing seasons are quite predictable, and very distinct. Autumn brings vibrant red and yellow leaves that are (sometimes) replaced by snow in the winter. Spring and summer follow with rainy days and blooming foliage.",
      "I came to take this for granted. Not just the change in physical environment, but the structure and predictable cycle present all around me.",
      "During school, there is some level of predictability. Semesters are a set number of weeks, with the usual breaks and finals schedules. But there’s also an overwhelming amount of uncertainty. Friendships fade, career plans shift, and everything you thought you knew about yourself three months ago can be gone in an instant.",
      "But, after four years without the seasons, I’ve come to realize that the change itself was never the hard part. It was not seeing it coming, and not having autumn around to remind me that good things are supposed to end, and that the ending is part of what makes them good.",
      "While most things are never permanent, I believe you can find comfort in the present, the current moments that simply exist, rather than anticipating that things will change. I don’t get the red and yellow leaves anymore, so I’m learning to notice when something is good while it’s still here.",
    ],
  },
  {
    slug: "music-as-creative-fuel",
    title: "Music as creative fuel",
    date: "2026-10",
    cover: "record",
    hint: "Click a record to play it",
    body: [
      "Modern music is such an awesome source of inspiration, and I’m not necessarily talking about the music itself.",
      "One thing I’ve found so fascinating over the past couple of years is the growth of music rollouts as campaigns and artistic movements, not just single or album releases.",
      "For many artists, dropping a song or an album is an opportunity to dip their toes into many creative arenas: designing album art, directing or producing music videos, creative directing live tours, or even developing immersive installations and fan experiences.",
      "What starts as a simple melody can evolve into an entire movement. It’s not the most unique example, but I always come back to BRAT by Charli XCX.",
      "Charli is no stranger to music as a form of creative expression in every sense, and BRAT showed how an intentional, multidisciplinary rollout can have a large cultural impact beyond just listening to the music itself.",
      "Hence why I can’t start a project without consuming a huge amount of music in some shape or form. If you’ve never gone down an obsessively deep rabbit hole after discovering a new song or artist, I highly recommend it.",
    ],
  },
  {
    slug: "play-doh-as-a-mindset",
    title: "Play-Doh as a mindset",
    date: "2026-10",
    cover: "clay",
    hint: "Drag it, throw it, hold to press, double-click to smash",
    body: [
      "I miss the experience of opening up a fresh set of Play-Doh. Few things in life give me the same sense of excitement I had as a kid cracking open a new tub.",
      "The possibilities were endless. One color, four ounces of dough, but the world was truly your oyster. I wish I still had that childlike sense of wonder.",
      "But I think we all still do, somewhere inside. We just have to find a way to bring it back out, unearthing it from a deeper place than we did as kids.",
      "Recently, I tried to get back into watercolor painting, but found myself facing so many roadblocks, or what I thought were roadblocks. I sat down with a fresh sheet of paper, a set of paints, brushes, everything I’d need to unleash the creative juices. Instead, I found myself asking questions like “What is worth painting today?” and “What can I actually pull off in a short amount of time, with so little experience?”",
      "These are mental blocks built from pressures, fears and ideas that, as kids, we just don’t think about.",
      "I want to let go of these expectations and “practical” thoughts, and channel my inner kid again. The kid who sat down with a fresh lump of dough and never stopped to ask what was worth making, because the making was the whole point.",
    ],
  },
];

export const pieceBySlug = (slug: string) =>
  PIECES.find((piece) => piece.slug === slug);

export const wordCount = (piece: Piece) =>
  piece.body.join(" ").split(/\s+/).filter(Boolean).length;

/** `2026-10` → `Oct 2026`. Fixed to UTC so server and client agree. */
export const formatDate = (date: string) =>
  new Date(`${date}-01T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
