import Image from "next/image";

/* Masonry via CSS multi-column layout: this is the one layout primitive
   that gives equal-width columns while letting every item keep its own
   natural (image) height, rather than a uniform grid-row height. CSS
   Grid's `grid-template-rows: masonry` would be the "correct" tool but
   is Firefox-only; multi-column is the broadly-supported equivalent.
   `break-inside-avoid` stops an item from being split across columns,
   and column-gap (`gap-3`) plus per-item bottom margin (`mb-3`) give the
   12px gutters between columns and rows respectively.

   To add, remove, or reorder projects: edit this array. `width`/`height`
   are each file's real pixel dimensions (not a display size) - that's
   what tells the browser the aspect ratio so the grid can hug it before
   the file itself finishes loading. Reorder items here to reorder them
   on the page; move a src to a different index to swap its spot.

   Video files (.mp4/.webm/.mov) work the same way as images - just point
   `src` at one and give its real width/height. They play silently on
   loop as soon as they're visible, like a live preview rather than a
   video player (no controls, no sound). Prefer .mp4/.webm over .mov:
   most .mov files record with codecs Chrome and Firefox can't play,
   while Safari plays them natively - .mp4 (H.264) is the safe common
   ground across every browser. */
const WORK_ITEMS = [
  { src: "/work/voxel.webm", alt: "Voxel", width: 1518, height: 1080 },
  { src: "/work/createsc.png", alt: "Create screen", width: 796, height: 448 },
  { src: "/work/nova.png", alt: "Nova", width: 1200, height: 912 },
  { src: "/work/trimble2.png", alt: "Trimble, view 2", width: 1534, height: 1598 },
  { src: "/work/nrg1.png", alt: "NRG, view 1", width: 796, height: 546 },
  { src: "/work/browserAnimations.mov", alt: "Browser animations", width: 1426, height: 796 },
  { src: "/work/trimble3.png", alt: "Trimble, view 3", width: 3560, height: 3762 },
  { src: "/work/nrg2.png", alt: "NRG, view 2", width: 796, height: 546 },
  { src: "/work/trimble1.png", alt: "Trimble, view 1", width: 1016, height: 776 },
  { src: "/work/beacon.png", alt: "Beacon", width: 3936, height: 2760 },
  { src: "/work/fuser.mp4", alt: "Fuser", width: 1080, height: 1350 },
  { src: "/work/photography.png", alt: "Photography", width: 1058, height: 572 },
];

const VIDEO_SRC = /\.(mp4|webm|mov|m4v)$/i;

export default function WorkPage() {
  return (
    <div className="p-3">
      <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
        {WORK_ITEMS.map((item) => (
          <div
            key={item.src}
            className="mb-3 break-inside-avoid bg-neutral-100/50 p-3"
       
       
          >
            {/* w-full h-auto plus the real width/height above is what keeps
                this hugging the file's own aspect ratio - the padding just
                shrinks the box it scales to, it doesn't touch the ratio
                itself */}
            {VIDEO_SRC.test(item.src) ? (
              <video
                src={item.src}
                autoPlay
                muted
                loop
                playsInline
                width={item.width}
                height={item.height}
                className="h-auto w-full"
                style={{ aspectRatio: `${item.width} / ${item.height}` }}
              />
            ) : (
              <Image
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                className="h-auto w-full"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
            )}
          </div>
        ))}
      </div>
      {/* extra scroll room so the last row can clear the floating nav's
          gradient fade at the bottom instead of stopping just under it */}
      <div aria-hidden className="h-32" />
    </div>
  );
}
