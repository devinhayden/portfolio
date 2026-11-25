/**
 * Soft, chalky, a little pastel: the claymorphic range. Neutral first.
 *
 * Kept apart from the engine so a page can name the clay's colour without
 * pulling three.js into its first-load bundle.
 */
export const CLAY_COLORS = [
  { name: "Stone", hex: "#d8cec2" },
  { name: "Peach", hex: "#f4a383" },
  { name: "Periwinkle", hex: "#9fb0f2" },
  { name: "Butter", hex: "#f3d68a" },
  { name: "Mint", hex: "#a9d8bd" },
] as const;
