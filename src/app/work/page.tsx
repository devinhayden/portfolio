import Image from "next/image";
import AlphaVideo from "@/components/AlphaVideo";

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
   ground across every browser.

   For a video that needs real alpha transparency, add a `movSrc`
   alongside `src` (a VP9-alpha .webm): Chrome/Firefox get `src`, Safari
   gets `movSrc`, picked at runtime by AlphaVideo since no single
   container/codec keeps alpha across both. */
type WorkItem = {
  src: string;
  movSrc?: string;
  alt: string;
  width: number;
  height: number;
  description: string;
  // Skips next/image's default lazy-loading and preloads via <link
  // rel="preload">. Reserve for images confirmed above the fold - set on
  // the first image right under the top video (visible at every
  // breakpoint) and on trimble3.png, which Chrome's own LCP warning
  // flagged as the actual largest-paint candidate in testing. Not a
  // "first N items" heuristic: this masonry is CSS multi-column, which
  // fills column-by-column (all of column 1, then column 2, ...) rather
  // than row-by-row, so array position doesn't line up with what's
  // visually above the fold once there's more than one column.
  priority?: boolean;
};

const WORK_ITEMS: WorkItem[] = [
  {
    src: "/work/voxel.webm",
    movSrc: "/work/voxel.mov",
    alt: "Voxel",
    width: 1518,
    height: 1080,
    description: "Customizable voice agents for healthcare clinics",
  },
  {
    src: "/work/createsc.png",
    alt: "Create screen",
    width: 796,
    height: 448,
    description: "Hosting a nationwide designathon for university students",
    priority: true,
  },
  {
    src: "/work/nova.png",
    alt: "Nova",
    width: 1200,
    height: 912,
    description: "Offline AI learning for students with little to no internet access ",
  },
  {
    src: "/work/trimble2.png",
    alt: "Trimble, view 2",
    width: 1534,
    height: 1598,
    description: "Content design and information architecture for product comparison",
    priority: true,
  },
  {
    src: "/work/nrg1.png",
    alt: "NRG, view 1",
    width: 796,
    height: 546,
    description: "Physical product demo experience for Meta AI Glasses in retail stores",
  },
  {
    src: "/work/browserAnimations.mov",
    alt: "Browser animations",
    width: 1426,
    height: 796,
    description: "Playful micro-interactions prototyped for AI browsers",
  },
  {
    src: "/work/trimble3.png",
    alt: "Trimble, view 3",
    width: 3560,
    height: 3762,
    description: "Globalization and design system work for Trimble e-commerce",
    priority: true,
  },
  {
    src: "/work/nrg2.png",
    alt: "NRG, view 2",
    width: 796,
    height: 546,
    description: "Interactive F1 car display for T-Mobile x Las Vegas Grand Prix",
  },
  {
    src: "/work/trimble1.png",
    alt: "Trimble, view 1",
    width: 1016,
    height: 776,
    description: "Data filtering and project management workflows for construction sites",
    priority: true,
  },
  {
    src: "/work/beacon.png",
    alt: "Beacon",
    width: 3936,
    height: 2760,
    description: "XR Holographic interface utilizing eye-tracking for patients with limited mobility",
  },
  {
    src: "/work/fuser.mp4",
    alt: "Fuser",
    width: 1080,
    height: 1350,
    description: "Motion exploration for canvas-based AI creation",
  },
  {
    src: "/work/photography.png",
    alt: "Photography",
    width: 1058,
    height: 572,
    description: "Series of freelance photography sessions",
  },
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
                itself. `group` is scoped to just the media, not the outer
                mat/padding, so only the image itself dims on hover. */}
            <div className="group relative overflow-hidden">
              {item.movSrc ? (
                <AlphaVideo
                  webmSrc={item.src}
                  movSrc={item.movSrc}
                  width={item.width}
                  height={item.height}
                  className="h-auto w-full transition-opacity duration-300 ease-out group-hover:opacity-40"
                />
              ) : VIDEO_SRC.test(item.src) ? (
                <video
                  src={item.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  width={item.width}
                  height={item.height}
                  className="h-auto w-full transition-opacity duration-300 ease-out group-hover:opacity-40"
                  style={{ aspectRatio: `${item.width} / ${item.height}` }}
                />
              ) : (
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  priority={item.priority}
                  className="h-auto w-full transition-opacity duration-300 ease-out group-hover:opacity-40"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              )}

              {/* Caption veil: a per-image reveal rather than a nav that
                  changes on hover - the nav stays universal (see SiteShell),
                  and this keeps the description tied to the thing it's
                  describing instead of requiring eye travel to the bottom
                  of the page. Warm and light (bg-background), not a dark
                  scrim, to stay in the same tonal family as the rest of the
                  site instead of reading as an app-style overlay; the image
                  dimming underneath (above) is what carries the "reveal"
                  instead of overlay opacity/contrast. */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/70 p-6 text-center opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
                <p className="font-mono text-sm leading-relaxed text-foreground uppercase">
           
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* extra scroll room so the last row can clear the floating nav's
          gradient fade at the bottom instead of stopping just under it */}
      <div aria-hidden className="h-32" />
    </div>
  );
}
