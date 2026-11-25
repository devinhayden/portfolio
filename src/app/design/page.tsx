import type { Metadata } from "next";

import { ProjectIndex } from "@/components/ProjectIndex";
import { DESIGN } from "@/components/projects";

export const metadata: Metadata = {
  title: "Design — Devin Hayden",
  description: "Product design work, with a deeper look at each project.",
};

/**
 * The design carousel is the Design card, entered full bleed, so a reload
 * or a shared link still scrolls back out to the menu and down into the
 * deep dive.
 */
export default function Page() {
  return <ProjectIndex initialSlug={DESIGN.slug} />;
}
