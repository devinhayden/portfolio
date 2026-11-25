/**
 * The experiments the landing can show above its sentence, in the order the
 * menu lists them. The clay is first and the one the page opens on.
 */
export const EXPERIMENTS = [
  { key: "clay", name: "Moldable clay", thumb: "/clay/ball.png" },
  { key: "record", name: "Record console", thumb: "/lab/record.png" },
  { key: "seasons", name: "Changing seasons", thumb: "/lab/seasons.png" },
  { key: "tree", name: "A year of a tree", thumb: "/lab/tree.png" },
] as const;

export type ExperimentKey = (typeof EXPERIMENTS)[number]["key"];
