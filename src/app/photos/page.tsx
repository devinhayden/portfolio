import type { Metadata } from "next";

import { ProjectIndex } from "@/components/ProjectIndex";
import { PHOTOS } from "@/components/projects";

export const metadata: Metadata = {
  title: "Photos — Devin Hayden",
  description: "Photographs, grouped into stacks that open in place.",
};

/**
 * The photo grid is the Photos card, entered full bleed, so a reload or a
 * shared link still scrolls back out to the menu.
 */
export default function Page() {
  return <ProjectIndex initialSlug={PHOTOS.slug} />;
}
