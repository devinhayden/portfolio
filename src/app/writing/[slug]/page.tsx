import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectIndex } from "@/components/ProjectIndex";
import { WRITING } from "@/components/projects";
import { pieceBySlug, PIECES } from "@/components/writing/pieces";

export function generateStaticParams() {
  return PIECES.map((piece) => ({ slug: piece.slug }));
}

export async function generateMetadata(
  props: PageProps<"/writing/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const piece = pieceBySlug(slug);
  if (!piece) return {};
  return {
    title: `${piece.title} — Devin Hayden`,
    description: piece.body[0],
  };
}

/**
 * A piece of writing opens as a sheet over the writing index, so a direct
 * link lands on the index with this piece's sheet already up. Closing it
 * shows the index underneath, as it would had the piece been opened there.
 */
export default async function Page(props: PageProps<"/writing/[slug]">) {
  const { slug } = await props.params;
  if (!pieceBySlug(slug)) notFound();
  return <ProjectIndex initialSlug={WRITING.slug} initialPiece={slug} />;
}
