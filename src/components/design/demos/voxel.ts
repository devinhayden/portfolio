import { DM_Sans } from "next/font/google";

/**
 * Shared by the Voxel demos: the product's own typeface, so a slice reads as
 * Voxel rather than the site, and where its icons (exported from Figma) live.
 */
export const voxelFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const VOXEL_ICONS = "/design/voxel-icons";
