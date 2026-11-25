import Link from "next/link";

import { formatDate, PIECES, wordCount } from "@/components/writing/pieces";

/**
 * The list of pieces (after Figma "Wireframe - 1"): an opening line in the
 * landing hero's voice, then one row per piece in a 678px column — the
 * title on the left, its length and date on the right. Rows are set apart
 * by space, not rules, as the hero is. Live as the Writing card's cover.
 */
export function WritingIndex() {
  return (
    <div className="flex w-full max-w-[678px] flex-col items-center">
      <h1 className="type-display max-w-[562px] text-center">
        Notes on the things I&rsquo;ve been making.
      </h1>
      <ul className="mt-[clamp(32px,8svh,80px)] w-full space-y-1">
        {PIECES.map((piece) => (
          <li key={piece.slug}>
            <Link
              href={`/writing/${piece.slug}`}
              className="group flex h-[60px] items-center justify-between gap-6 rounded-[8px] px-3 transition-colors hover:bg-ink/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <span className="type-title">{piece.title}</span>
              <span className="type-mono flex shrink-0 items-center gap-3 text-ink/45 transition-colors group-hover:text-ink/70">
                <span>{wordCount(piece)} words</span>
                <span aria-hidden>·</span>
                <time dateTime={piece.date}>{formatDate(piece.date)}</time>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
