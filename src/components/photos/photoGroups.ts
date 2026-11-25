/**
 * The photo grid's contents, in grid order: one stack per kind of work
 * (Portraits, Graduation, Couples, Concerts, Travel), with single
 * landscapes standing on their own between them.
 *
 * A group's first photo is its stack's cover; the next two peek out behind
 * it. A group of one is a standalone: untitled, it opens straight to the
 * enlarged view. Stack titles say what kind of work is inside. Enlarged,
 * every photo shows one details line: camera, f-stop, shutter, date.
 *
 * The files are web copies of the originals in `public/photoGallery/`:
 * 2400px on the long side, colour profile kept, other metadata (camera,
 * GPS) stripped. They keep the names from the first grouping (e.g.
 * `after-dark-3.jpg`), which also serve as each photo's id.
 *
 * PLACEHOLDER: the camera and date of every photo not in SHOTS.
 */

export type Photo = {
  /** Unique across the grid: it names the photo's view transition. */
  id: string;
  src: string;
  width: number;
  height: number;
  /** Describes the photo for anyone who can't see it. */
  alt: string;
  /**
   * The details line under the enlarged photo: camera, f-stop, shutter
   * speed, date. Film doesn't record exposure, so a film photo's line is
   * just its camera and date.
   */
  camera: string;
  aperture?: string;
  shutter?: string;
  /** "YYYY-MM-DD" (shown "Mar 17, 2024") or "YYYY-MM" (shown "Jun 2026"). */
  date: string;
  /**
   * Where a square crop centres on the photo, as a CSS object-position.
   * Only set where the middle would cut the subject.
   */
  focus: string;
};

export type PhotoGroup = {
  id: string;
  /** Stacks only: a standalone is shown without a title. */
  title?: string;
  /** The first is the stack's cover; the next two peek out behind it. */
  photos: Photo[];
};

type Shot = Pick<Photo, "camera" | "aperture" | "shutter" | "date">;

/**
 * Each photo's camera and exposure: the Sony shots from their originals'
 * metadata, the rest as Devin gave them (film records no exposure, and two
 * concert files kept none, so theirs is estimated).
 */
const SONY_A7II = { camera: "Sony A7 II", aperture: "f/2.8" };
const SONY_A7RIII = { camera: "Sony A7R III", aperture: "f/2.8" };
const CANON_AE1 = { camera: "Canon AE-1" };
const SHOTS: Record<string, Shot> = {
  "studio-1": { ...SONY_A7II, shutter: "1/200", date: "2024-03-17" },
  "studio-3": { ...SONY_A7II, shutter: "1/200", date: "2024-03-17" },
  "studio-7": { ...SONY_A7RIII, shutter: "1/125", date: "2026-03-11" },
  "studio-8": { ...SONY_A7RIII, shutter: "1/125", date: "2026-03-11" },
  "studio-9": { ...SONY_A7RIII, shutter: "1/125", date: "2026-03-09" },
  "on-stage-1": { ...SONY_A7II, shutter: "1/200", date: "2024-04-11" },
  "on-stage-3": { ...SONY_A7II, shutter: "1/125", date: "2024-02-13" },
  "on-stage-5": { ...SONY_A7II, shutter: "1/200", date: "2024-04-11" },
  // Graduation: from the original JPEGs. The cover's settings come from the
  // frame beside it (Joanna/Haha/Lauren -57); its own original wasn't there.
  "class-of-2026-1": { ...SONY_A7RIII, shutter: "1/640", date: "2026-04-29" },
  "class-of-2026-2": { ...SONY_A7RIII, shutter: "1/640", date: "2026-04-29" },
  "class-of-2026-3": {
    ...SONY_A7RIII,
    aperture: "f/3.2",
    shutter: "1/800",
    date: "2026-05-02",
  },
  "class-of-2026-4": { ...SONY_A7RIII, shutter: "1/800", date: "2026-05-02" },
  "class-of-2026-5": { ...SONY_A7RIII, shutter: "1/400", date: "2026-05-02" },
  "class-of-2026-6": {
    ...SONY_A7RIII,
    aperture: "f/4.5",
    shutter: "1/160",
    date: "2026-04-29",
  },
  "class-of-2026-7": { ...SONY_A7RIII, shutter: "1/500", date: "2026-05-05" },
  // Couples (the Maria and Ryan engagement).
  "engaged-1": { ...SONY_A7RIII, shutter: "1/1000", date: "2026-06-06" },
  "engaged-2": { ...SONY_A7RIII, shutter: "1/1000", date: "2026-06-06" },
  "engaged-3": { ...SONY_A7RIII, shutter: "1/500", date: "2026-06-06" },
  "engaged-4": { ...SONY_A7RIII, shutter: "1/1000", date: "2026-06-06" },
  // The two unnamed concerts, Aug 24, 2024. No metadata survived, so the
  // exposure is an estimate: wide open, as on the other shows, and fast
  // enough to freeze the headbang.
  "on-stage-2": { ...SONY_A7RIII, shutter: "1/160", date: "2024-08-24" },
  "on-stage-4": { ...SONY_A7RIII, shutter: "1/250", date: "2024-08-24" },
  // Film, all on a Canon AE-1, which records no exposure: camera and date.
  "after-dark-3": { ...CANON_AE1, date: "2026-11-06" },
  "after-dark-5": { ...CANON_AE1, date: "2026-11-06" },
  "after-dark-6": { ...CANON_AE1, date: "2026-11-06" },
  "studio-4": { ...CANON_AE1, date: "2025-10-26" },
  "studio-5": { ...CANON_AE1, date: "2025-10-26" },
  "studio-6": { ...CANON_AE1, date: "2025-10-26" },
  "japan-1": { ...CANON_AE1, date: "2026-06" },
  "japan-2": { ...CANON_AE1, date: "2026-06" },
  "japan-3": { ...CANON_AE1, date: "2026-06" },
  "japan-4": { ...CANON_AE1, date: "2026-06" },
  "japan-5": { ...CANON_AE1, date: "2026-06" },
  "japan-6": { ...CANON_AE1, date: "2026-06" },
  // The dusk roll was shot through August 2026; these days are stand-ins.
  "dusk-1": { ...CANON_AE1, date: "2026-08-09" },
  "dusk-3": { ...CANON_AE1, date: "2026-08-16" },
  "dusk-4": { ...CANON_AE1, date: "2026-08-23" },
};
const UNKNOWN: Shot = {
  camera: "PLACEHOLDER camera",
  date: "PLACEHOLDER date",
};

/** Crops that need moving off-centre to keep their subject. */
const FOCUS: Record<string, string> = {
  /** Keep her face, at the left edge. */
  "engaged-2": "15% 50%",
  /** The roof is on the right; the middle is mostly sky. */
  "japan-5": "80% 50%",
};

/** A photo by its file name (without `.jpg`) in `public/photos/gallery/`. */
const photo = (
  id: string,
  width: number,
  height: number,
  alt: string,
): Photo => ({
  id,
  src: `/photos/gallery/${id}.jpg`,
  width,
  height,
  alt,
  ...(SHOTS[id] ?? UNKNOWN),
  focus: FOCUS[id] ?? "50% 50%",
});

export const PHOTO_GROUPS: PhotoGroup[] = [
  {
    id: "portraits",
    title: "Portraits",
    photos: [
      photo(
        "studio-8",
        1601,
        2400,
        "A woman resting her chin on a dark table, framed between photographers' shoulders",
      ),
      photo(
        "studio-9",
        1601,
        2400,
        "A woman in a black top standing by a sheer curtain in warm window light",
      ),
      photo(
        "studio-7",
        1601,
        2400,
        "A woman in a patterned dress leaning by a piano in soft window light",
      ),
      photo(
        "studio-5",
        2285,
        1535,
        "A woman in a long coat holding a single red rose against a white backdrop",
      ),
      photo(
        "studio-6",
        1535,
        2285,
        "A woman seated on a director's chair with a red rose, petals scattered on the floor",
      ),
      photo(
        "studio-4",
        2285,
        1535,
        "A woman in black lace seated against a deep red wall",
      ),
      photo(
        "studio-1",
        1600,
        2400,
        "A woman in heart-shaped sunglasses holding a pink rotary phone in a circle of spotlight",
      ),
      photo(
        "studio-3",
        1600,
        2400,
        "Two women peeking out together between pink curtains in a spotlight",
      ),
      photo(
        "after-dark-3",
        2400,
        1591,
        "A figure standing before a passing train, streaks of red light behind them",
      ),
      photo(
        "after-dark-5",
        1591,
        2400,
        "A face tilted up in low light against a ribbed metal shutter",
      ),
      photo(
        "after-dark-6",
        2400,
        1591,
        "A figure lit in magenta, face turned up toward a light out of frame",
      ),
    ],
  },
  {
    id: "riverside-dock",
    photos: [
      photo(
        "dusk-3",
        2400,
        1591,
        "A dock ramp facing a riverside factory at dusk",
      ),
    ],
  },
  {
    id: "graduation",
    title: "Graduation",
    photos: [
      photo(
        "class-of-2026-1",
        1548,
        2088,
        "Three graduates in white dresses and red stoles, looking back over their shoulders",
      ),
      photo(
        "class-of-2026-7",
        2400,
        1601,
        "Three graduates in red stoles smiling together beneath a stone archway",
      ),
      photo(
        "class-of-2026-2",
        1548,
        2088,
        "A graduate in a white dress and red stole on a tiled staircase in warm light",
      ),
      photo(
        "class-of-2026-6",
        1601,
        2400,
        "A graduate writing at a desk before a chalkboard that reads Class of 2026",
      ),
      photo(
        "class-of-2026-5",
        1601,
        2400,
        "A graduate in a white dress and red stole walking along a garden path",
      ),
      photo(
        "class-of-2026-3",
        1548,
        2088,
        "A graduate lying on the grass in a white dress, looking off to the side",
      ),
      photo(
        "class-of-2026-4",
        2088,
        1424,
        "A graduate resting her chin on her folded hands, leaves in front of her",
      ),
    ],
  },
  {
    id: "couples",
    title: "Couples",
    photos: [
      photo(
        "engaged-4",
        1548,
        2088,
        "A couple holding hands, her engagement ring catching the light",
      ),
      photo(
        "engaged-2",
        2048,
        1366,
        "A close embrace, her ringed hand resting on his shoulder",
      ),
      photo(
        "engaged-1",
        1601,
        2400,
        "A couple kissing in golden light, her hand raised to show the ring",
      ),
      photo(
        "engaged-3",
        1601,
        2400,
        "A couple facing each other in golden light, almost touching foreheads",
      ),
    ],
  },
  {
    id: "highway-bridge",
    photos: [
      photo(
        "dusk-1",
        2400,
        1591,
        "A pink cloud above the silhouette of a highway bridge and trees",
      ),
    ],
  },
  {
    id: "concerts",
    title: "Concerts",
    photos: [
      photo(
        "on-stage-2",
        1920,
        2400,
        "A singer at a mic stand under blue light and beams of white haze",
      ),
      photo(
        "on-stage-4",
        1920,
        2400,
        "A singer mid-headbang under stage lights, in black and white",
      ),
      photo(
        "on-stage-1",
        1600,
        2400,
        "A singer in a football jersey, arm raised as she sings, lit red from the side",
      ),
      photo(
        "on-stage-5",
        1600,
        2400,
        "A singer leaning into the mic, a blur of red light around her",
      ),
      photo(
        "on-stage-3",
        1600,
        2400,
        "A singer in a pale suit with arms outstretched on a lamp-lit stage",
      ),
    ],
  },
  {
    id: "travel",
    title: "Travel",
    photos: [
      photo(
        "japan-1",
        2400,
        1591,
        "Umbrellas crowding a rainy market street under shop signs",
      ),
      photo("japan-2", 2400, 1591, "A bamboo grove blurred by camera motion"),
      photo(
        "japan-3",
        2400,
        1591,
        "A forested hill with a red pagoda half hidden among the trees",
      ),
      photo(
        "japan-4",
        2400,
        1591,
        "People with umbrellas walking a wet side street past small shops",
      ),
      photo(
        "japan-5",
        2400,
        1591,
        "The curved eaves of a red temple roof against a pale sky",
      ),
      photo("japan-6", 2400, 1591, "Billowing white clouds in a blue sky"),
    ],
  },
  {
    id: "pines",
    photos: [
      photo(
        "dusk-4",
        2400,
        1591,
        "Evening sun through a stand of young pines above tall grass",
      ),
    ],
  },
];
