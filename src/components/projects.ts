/**
 * The menu's cards: the site's four pages, led by home.
 *
 * Each is a live page: zooming in lands on the page itself, drawn as the
 * card's cover. The image is that page as a still, for the menu's thumbnail
 * and for the cover crossfade to start from.
 */
export type Card = {
  /** The page's URL segment ("home" is `/`). */
  slug: string;
  title: string;
  /** The thumbnail's accessible description. */
  summary: string;
  cover: {
    src: string;
    /** Describes the image itself, for anyone who cannot see it. */
    alt: string;
  };
};

export const HOME: Card = {
  slug: "home",
  title: "About",
  summary: "Who Devin is, and where to find him.",
  cover: {
    src: "/photos/home-landing.jpeg",
    alt: "A sentence introducing Devin, with his portrait below it",
  },
};

/**
 * The writing index, as a card. Like home, its cover is live: zooming in
 * lands on the list itself, and a row opens its piece. The image is the
 * list as a still, for the thumbnail and the channel change.
 */
export const WRITING: Card = {
  slug: "writing",
  title: "Writing",
  summary: "Notes on the experiments, each with the experiment as its cover.",
  cover: {
    src: "/photos/writing-index.jpeg",
    alt: "A list of pieces of writing, each with its word count and date",
  },
};

/**
 * The design work, as a card. Live too: zooming in lands on the project
 * carousel, and scrolling on goes into the deep dive of the one on show.
 */
export const DESIGN: Card = {
  slug: "design",
  title: "Design",
  summary: "Product design work, with a deeper look at each project.",
  cover: {
    src: "/photos/design-index.jpeg",
    alt: "A carousel of product design work, showing a voice agent builder",
  },
};

/**
 * The photo grid, as a card. Live as well: zooming in lands on the grid of
 * stacks, which open in place.
 */
export const PHOTOS: Card = {
  slug: "photos",
  title: "Photos",
  summary: "Photographs, grouped into stacks that open in place.",
  cover: {
    src: "/photos/photos-index.jpeg",
    alt: "A grid of stacked photographs, each stack labelled with its count",
  },
};

export const CARDS: readonly Card[] = [HOME, DESIGN, WRITING, PHOTOS];
