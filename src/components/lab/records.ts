/**
 * The records in the console's rack, front to back. `cover` is a square image
 * in /public, `label` the colour of the record's centre label, `spotifyUri`
 * what the player loads.
 */

export interface Album {
  id: string;
  title: string;
  artist: string;
  /** A square cover image under /public, or null for a flat colour. */
  cover: string | null;
  /** The cover's colour when there's no image, and its tint while loading. */
  color: string;
  /** The centre label's colour. */
  label: string;
  spotifyUri: string;
}

export const RECORDS: Album[] = [
  {
    id: "day-and-night",
    title: "Day and Night",
    artist: "Carly Rae Jepsen",
    cover: "/records/dayandnightCarlyRaeJepsen.jpeg",
    color: "#35312a",
    label: "#b8322c",
    spotifyUri: "spotify:album:1XWFzAYlF1ihMFPU4a9YQg",
  },
  {
    id: "sweet-fortune",
    title: "Sweet Fortune",
    artist: "Ryan Beatty",
    cover: "/records/sweetfortuneRyanBeatty.png",
    color: "#b28572",
    label: "#e8c4b2",
    spotifyUri: "spotify:album:6FYDpZcqoVFDb31Zo4KA5S",
  },
  {
    id: "popstar",
    title: "Popstar",
    artist: "Tinashe",
    cover: "/records/popstarTinashe.webp",
    color: "#5b4b46",
    label: "#e6a9b8",
    spotifyUri: "spotify:album:06CjF89lLSSiVWXujVVtQs",
  },
  {
    id: "angel",
    title: "Angel",
    artist: "Lizzy McAlpine",
    cover: "/records/angelLizzyMcAlpine.webp",
    color: "#7a5749",
    label: "#c4473d",
    spotifyUri: "spotify:album:6mQC4efviywahzfwgLvye0",
  },
  {
    id: "you-seem-pretty-sad",
    title: "you seem pretty sad for a girl so in love",
    artist: "Olivia Rodrigo",
    cover: "/records/youseemprettysadforagirlsoinloveOliviaRodrigo.png",
    color: "#8a9ca4",
    label: "#f2a7c3",
    spotifyUri: "spotify:album:3WZZF72ihlKPZBS4zSsNHl",
  },
  {
    id: "charm",
    title: "Charm",
    artist: "Clairo",
    cover: "/records/charmClairo.jpeg",
    color: "#563c20",
    label: "#e2c98f",
    spotifyUri: "spotify:album:1KNUCVXgIxKUGiuEB8eG0i",
  },
];
