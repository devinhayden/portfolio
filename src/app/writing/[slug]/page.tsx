import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { WritingCover } from "@/components/writing/WritingCover";
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
 * A piece of writing (Figma "Wireframe - 2"): a way back, the experiment as
 * a live cover, then the title and the piece itself, in one 561px column.
 */
export default async function Page(props: PageProps<"/writing/[slug]">) {
  const { slug } = await props.params;
  const piece = pieceBySlug(slug);
  if (!piece) notFound();

  return (
    <main className="page-ground relative min-h-svh px-4 pt-[clamp(48px,12svh,126px)] pb-24 text-ink">
      <article className="mx-auto w-full max-w-[561px]">
        <Link
          href="/writing"
          aria-label="Back to writing"
          className="type-lede inline-block rounded-sm transition-transform hover:-translate-x-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          ←
        </Link>

        <div className="mt-[13px]">
          <WritingCover experiment={piece.cover} label={piece.title} />
          <p className="type-mono mt-3 text-ink/45">
            {piece.hint}
          </p>
        </div>

        <h1 className="type-display mt-[clamp(32px,6svh,56px)]">
          {piece.title}
        </h1>
        <div className="type-body mt-6 space-y-[1em]">
          {piece.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </article>
    </main>
  );
}
