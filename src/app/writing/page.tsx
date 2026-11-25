import type { Metadata } from "next";

import { ProjectIndex } from "@/components/ProjectIndex";
import { WRITING } from "@/components/projects";

export const metadata: Metadata = {
  title: "Writing — Devin Hayden",
  description: "Notes on the experiments, each with the experiment as its cover.",
};

/**
 * The writing index is the Writing card, entered full bleed — not a page of
 * its own — so arriving here (from a piece's back link, a reload or a shared
 * link) still scrolls back out to the menu.
 */
export default function Page() {
  return <ProjectIndex initialSlug={WRITING.slug} />;
}
