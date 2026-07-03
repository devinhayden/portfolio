/* Masonry via CSS multi-column layout: this is the one layout primitive
   that gives equal-width columns while letting every item keep its own
   natural (image) height, rather than a uniform grid-row height. CSS
   Grid's `grid-template-rows: masonry` would be the "correct" tool but
   is Firefox-only; multi-column is the broadly-supported equivalent.
   `break-inside-avoid` stops an item from being split across columns,
   and column-gap (`gap-3`) plus per-item bottom margin (`mb-3`) give the
    12px gutters between columns and rows respectively. */
const PLACEHOLDER_RATIOS = [
  "4 / 5",
  "16 / 10",
  "1 / 1",
  "3 / 4",
  "16 / 9",
  "4 / 3",
  "9 / 16",
  "1 / 1",
  "5 / 4",
];

export default function WorkPage() {
  return (
    <div className="p-3">
      <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
        {PLACEHOLDER_RATIOS.map((ratio, i) => (
          <div key={i} className="mb-3 break-inside-avoid">
            <div
              className="w-full bg-neutral-300/50"
              style={{ aspectRatio: ratio }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
