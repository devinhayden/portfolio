export type Photo = {
  src: string;
  /** Doubles as the accessible name of the photo's carousel button. */
  alt: string;
};

/**
 * The order here is the order of the carousel, left to right. Each `alt`
 * doubles as its button's accessible name, so they are written to tell the
 * five apart rather than to describe them exhaustively.
 */
export const PHOTOS: readonly Photo[] = [
  {
    src: "/photos/photo-1.jpeg",
    alt: "Mountains beyond a highway guardrail, streaked by a moving car",
  },
  {
    src: "/photos/photo-2.jpeg",
    alt: "Evening sun through a stand of young pines above tall grass",
  },
  {
    src: "/photos/photo-3.jpeg",
    alt: "A dock ramp facing a riverside factory at dusk",
  },
  {
    src: "/photos/photo-4.jpeg",
    alt: "Umbrellas crowding a rainy market street under shop signs",
  },
  {
    src: "/photos/photo-5.jpeg",
    alt: "A bamboo grove blurred by camera motion",
  },
];
