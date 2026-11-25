import localFont from "next/font/local";

/**
 * Shared by the Huddle agent demos: the concept's own typeface (Geist, as
 * in the Paper file), so a slice reads as the product rather than the
 * site, and where its images live.
 *
 * Geist ships with the site (its latin subset, as one variable file from
 * 400 to 600) rather than coming from Google at build time: Vercel's
 * builds failed to resolve the Google-hosted Geist files.
 */
export const huddleFont = localFont({
  src: "./fonts/Geist-latin.woff2",
  weight: "400 600",
  display: "swap",
});

export const HUDDLE_ASSETS = "/design/huddle";

/** The agent's colour: its mark, the listening state, the reason dot. */
export const AGENT = "#FF5A1F";
