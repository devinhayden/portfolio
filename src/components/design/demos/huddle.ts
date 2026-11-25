import { Geist } from "next/font/google";

/**
 * Shared by the Huddle agent demos: the concept's own typeface (Geist, as
 * in the Paper file), so a slice reads as the product rather than the
 * site, and where its images live.
 */
export const huddleFont = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const HUDDLE_ASSETS = "/design/huddle";

/** The agent's colour: its mark, the listening state, the reason dot. */
export const AGENT = "#FF5A1F";
