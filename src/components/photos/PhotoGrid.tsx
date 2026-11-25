"use client";

import Image from "next/image";
import {
  addTransitionType,
  startTransition,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  ViewTransition,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

import { PHOTO_GROUPS, type Photo, type PhotoGroup } from "./photoGroups";

/**
 * The photo grid: each group of similar photos is a stack, with its next
 * two photos peeking out behind the cover. Clicking a stack opens it in
 * place — its photos fly out into cells of their own and every group after
 * it reflows — and the other groups dim. Clicking a photo then enlarges it
 * with its details. One group is open at a time; Escape steps back out.
 *
 * All of the motion is the browser's View Transitions API, through React's
 * `<ViewTransition>`: every photo is named, so a state change is all it
 * takes for each one to travel from where it was to where it lands.
 *
 * `active` is whether the grid is the page on show; leaving closes it.
 */

/** Marks this page's transitions, so the page-fade on navigations sits out. */
const TYPE = "photos";

/**
 * A cell is a square print (the photo cropped to it from its focal point
 * until it's enlarged) plus its label. Its size: up to 240px, as many as
 * fit across (four, or two on a phone), and small enough that the closed
 * grid's two rows fit the screen. Never below 160px for that, though: an
 * open group, or a short screen, scrolls instead of shrinking the photos.
 */
const CELL =
  "min(240px, calc((100vw - 32px - (var(--cols) - 1) * var(--gap)) / var(--cols)), max(160px, calc((100svh - 160px) / 2 - 76px)))";

/**
 * The cards behind a stack's cover: a small deck, each a little smaller and
 * peeking a few pixels above the one in front, its frame a shade darker so
 * the layers read. It stays inside the cell's own top margin, so it never
 * reaches the row above; on hover the deck lifts a touch.
 */
const STACK_POSES = [
  { pose: "", tone: "" },
  {
    pose: "scale-[0.93] -translate-y-[calc(3.5%+6px)] group-hover/stack:-translate-y-[calc(3.5%+9px)]",
    tone: "border-[#ececec]! bg-[#ececec]!",
  },
  {
    pose: "scale-[0.86] -translate-y-[calc(7%+12px)] group-hover/stack:-translate-y-[calc(7%+16px)]",
    tone: "border-[#e2e2e2]! bg-[#e2e2e2]!",
  },
];

/**
 * Runs a state change as a view transition: "stack" for a group opening or
 * closing, "zoom" for a photo enlarging or shrinking back.
 */
const noSubscribe = () => () => {};

/** The enlarged photo's details line: camera · f-stop · shutter · date. */
function details(photo: Photo) {
  // A full date or just a month ("2026-06" → "Jun 2026").
  const [y, m, d] = photo.date.split("-").map(Number);
  const date = m
    ? new Date(Date.UTC(y, m - 1, d || 1)).toLocaleDateString("en-US", {
        month: "short",
        ...(d ? { day: "numeric" } : {}),
        year: "numeric",
        timeZone: "UTC",
      })
    : photo.date;
  return [photo.camera, photo.aperture, photo.shutter, date]
    .filter(Boolean)
    .join(" · ");
}

function go(kind: "stack" | "zoom-in" | "zoom-out", update: () => void) {
  startTransition(() => {
    addTransitionType(TYPE);
    if (kind === "stack") addTransitionType(`${TYPE}-stack`);
    else {
      addTransitionType(`${TYPE}-zoom`);
      addTransitionType(`${TYPE}-${kind}`);
    }
    update();
  });
}

const photoById = (id: string) =>
  PHOTO_GROUPS.flatMap((group) => group.photos).find((p) => p.id === id);

/**
 * While a group opens or closes, its photos keep their places front to back
 * in the stack: the cover in front, then the ones peeking, then the rest.
 * Left alone, the browser layers moving photos by their order in the grid,
 * so on the way back in the last ones would pass over the cover. The groups
 * opening or closing (`moving`) ride above the rest, so the stacks sliding
 * aside to make room never pass over them.
 */
function stackOrder(moving: readonly string[]) {
  return PHOTO_GROUPS.flatMap((group) =>
    group.photos.map((photo, i) => {
      const z = (moving.includes(group.id) ? 100 : 0) + group.photos.length - i;
      return `html:active-view-transition-type(${TYPE}-stack)::view-transition-group(photo-${photo.id}){z-index:${z}}`;
    }),
  ).join("\n");
}

/**
 * While a photo enlarges or shrinks back, it, the backdrop and the caption
 * ride above the whole grid. Otherwise the browser layers the photo by its
 * place in the grid, and it grows under its neighbours before jumping on top.
 */
function zoomOrder(zooming: string | null) {
  const rule = (name: string, z: number) =>
    `html:active-view-transition-type(${TYPE}-zoom)::view-transition-group(${name}){z-index:${z}}`;
  return [
    rule("photo-backdrop", 200),
    zooming ? rule(`photo-${zooming}`, 201) : "",
    rule("photo-caption", 202),
    zooming ? zoomImages(zooming) : "",
  ].join("\n");
}

/**
 * The moving photo shows one image the whole way: the enlarged one, filling
 * the moving frame and cropped from the thumbnail's focal point, so at the
 * small end it matches the square in the grid. The browser's default is to
 * cross-fade the thumbnail into the enlarged photo across the whole move,
 * which shows both at once, at different crops and sharpness: ghosting.
 *
 * Enlarging swaps to the enlarged image on the first frame, where the two
 * are the same size. Shrinking blends back to the thumbnail only over the
 * last moment, once the move has all but landed.
 */
function zoomImages(id: string) {
  const focus = photoById(id)?.focus ?? "50% 50%";
  // plus-lighter is the browser's own blend for this: two images fading
  // in and out add up to one solid image. Replacing the default animation
  // drops it, and without it the page shows through mid-blend as a white
  // flash.
  const fill = `width:100%;height:100%;object-fit:cover;object-position:${focus};overflow:clip;mix-blend-mode:plus-lighter`;
  const pseudo = (type: string, part: "old" | "new", rest: string) =>
    `html:active-view-transition-type(${TYPE}-${type})::view-transition-${part}(photo-${id}){${fill};${rest}}`;
  return [
    pseudo("zoom-in", "old", "animation:none;opacity:0"),
    pseudo("zoom-in", "new", "animation:none;opacity:1"),
    // Linear, so the two always sum to exactly full under plus-lighter;
    // any easing would wash the photo brighter.
    pseudo(
      "zoom-out",
      "old",
      "animation:0.12s linear 0.32s both page-fade reverse",
    ),
    pseudo("zoom-out", "new", "animation:0.12s linear 0.32s both page-fade"),
  ].join("\n");
}

/**
 * A photo as a print, framed like the portrait on the landing: an 8px pale
 * border, softly rounded. It fills whatever box it's given: a square cell
 * in the grid.
 */
function Print({
  photo,
  named = true,
  dim = false,
  className = "",
  style,
}: {
  photo: Photo;
  /** Off while this photo is enlarged, so the enlarged one has the name. */
  named?: boolean;
  /**
   * Faded back while another group is open. A white veil rather than
   * opacity, so the prints stacked under it don't show through.
   */
  dim?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const print = (
    <div
      data-print={photo.id}
      style={style}
      // Unnamed means it's enlarged: its place in the grid stays empty, or
      // a second copy would sit here while the first flies out and back.
      className={`relative size-full rounded-[8px] border-8 border-[#f7f7f7] bg-[#f7f7f7] ${named ? "" : "invisible"} ${className}`}
    >
      <div className="relative size-full overflow-hidden rounded-[8px]">
        <Image
          src={photo.src}
          alt=""
          fill
          sizes="240px"
          draggable={false}
          style={{ objectPosition: photo.focus }}
          className="object-cover"
        />
      </div>
      <div
        aria-hidden
        className={`absolute -inset-2 rounded-[8px] bg-white transition-opacity duration-300 ${
          dim ? "opacity-65" : "opacity-0"
        }`}
      />
    </div>
  );
  return named ? (
    <ViewTransition name={`photo-${photo.id}`} default="photo">
      {print}
    </ViewTransition>
  ) : (
    print
  );
}

export function PhotoGrid({ active }: { active: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null);
  /** The groups the last open or close moved: the one shut, the one opened. */
  const [moving, setMoving] = useState<string[]>([]);
  /** The photo the last enlarge or shrink moved. */
  const [zooming, setZooming] = useState<string | null>(null);
  const [enlarged, setEnlarged] = useState<{
    photo: Photo;
    group: PhotoGroup;
  } | null>(null);

  // Leaving the page puts everything back, so coming back finds the grid.
  const [wasActive, setWasActive] = useState(active);
  if (active !== wasActive) {
    setWasActive(active);
    if (!active) {
      setOpenId(null);
      setEnlarged(null);
    }
  }

  const openGroup = (group: PhotoGroup) =>
    go("stack", () => {
      setMoving([group.id]);
      setOpenId(group.id);
    });
  const closeGroup = () =>
    go("stack", () => {
      setMoving(openId ? [openId] : []);
      setOpenId(null);
    });
  const enlarge = (photo: Photo, group: PhotoGroup) =>
    go("zoom-in", () => {
      setZooming(photo.id);
      setEnlarged({ photo, group });
    });
  /**
   * Closing an enlarged photo is two steps. First it settles into a print
   * (in EnlargedPhoto): the caption fades, and the photo crops to its
   * thumbnail's shape while its frame thickens to the thumbnail's
   * proportions. Then it flies back. What flies is then an exact scaled-up
   * copy of the thumbnail, so nothing changes as it lands.
   */
  const [closing, setClosing] = useState(false);
  const shrink = () => {
    if (!enlarged || closing) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) finishShrink();
    else setClosing(true);
  };
  const finishShrink = () =>
    go("zoom-out", () => {
      setZooming(enlarged?.photo.id ?? null);
      setEnlarged(null);
      setClosing(false);
    });

  // Escape steps back one level: the enlarged photo, then the open group.
  const back = useRef<() => void>(() => {});
  useEffect(() => {
    back.current = () => {
      if (enlarged) shrink();
      else if (openId) closeGroup();
    };
  });
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      back.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <div
      onClick={(event) => {
        // A click on the ground closes the open group; clicks on other
        // groups close it from their own handlers. Clicks in the enlarged
        // photo reach here too (React passes portal events up the tree),
        // but they only close the photo, back to the open group: so only
        // clicks that landed inside the grid itself count.
        const target = event.target as Element;
        if (!event.currentTarget.contains(target)) return;
        if (openId && !target.closest("li")) closeGroup();
      }}
      style={{ "--cell": CELL } as CSSProperties}
      // Top-aligned, so opening a group only ever grows the grid downward.
      // When an open group won't fit (a short screen, a phone), the grid
      // scrolls; at its top, scrolling on up carries on to the menu.
      className="text-ink flex size-full items-start justify-center overflow-y-auto px-4 pt-[clamp(72px,11svh,112px)] pb-16 [--cols:2] [--gap:16px] sm:[--cols:4] sm:[--gap:32px] lg:[--gap:40px]"
    >
      <style>{`${stackOrder(moving)}\n${zoomOrder(zooming)}`}</style>
      <ul
        aria-label="Photos"
        className="grid grid-cols-[repeat(var(--cols),var(--cell))] gap-x-(--gap) gap-y-[calc(var(--gap)*0.6)]"
      >
        {PHOTO_GROUPS.flatMap((group) => {
          const dim = openId !== null && group.id !== openId;

          if (group.id !== openId) {
            const single = group.photos.length === 1;
            return [
              <li key={`stack-${group.id}`} className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    // With a group open, any click outside it only closes
                    // it, putting the grid back before anything else opens.
                    if (openId) closeGroup();
                    else if (single) enlarge(group.photos[0], group);
                    else openGroup(group);
                  }}
                  aria-label={
                    single
                      ? `Enlarge: ${group.photos[0].alt}`
                      : `Open ${group.title}, ${group.photos.length} photos`
                  }
                  className="group/stack relative flex aspect-square w-(--cell) cursor-pointer items-end justify-center rounded-[8px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                >
                  {/* Every photo in the group is here, so each one has
                      somewhere to fly out from: the cover on top, two
                      peeking behind it, the rest hidden beneath. The deck
                      takes the cover's shape. */}
                  <div className="relative size-full">
                    {group.photos.map((photo, i) => (
                      <Print
                        key={photo.id}
                        photo={photo}
                        named={enlarged?.photo.id !== photo.id}
                        // Dimmed on the print itself, not the button: a named
                        // element's snapshot leaves out its parents' effects.
                        dim={dim}
                        style={{ zIndex: group.photos.length - i }}
                        className={`absolute! inset-0 transition-transform duration-300 ease-out ${
                          i < STACK_POSES.length
                            ? `${STACK_POSES[i].pose} ${STACK_POSES[i].tone}`
                            : "opacity-0"
                        }`}
                      />
                    ))}
                  </div>
                </button>
                {/* Only stacks are named; a standalone is just the photo. */}
                {!single && (
                  <Label group={group} className={dim ? "opacity-35" : ""}>
                    <span className="type-mono rounded-[6px] border border-ink/15 bg-white px-1.5 leading-[20px] text-ink/70">
                      {group.photos.length}
                    </span>
                  </Label>
                )}
              </li>,
            ];
          }

          return group.photos.map((photo, i) => (
            <li key={`photo-${photo.id}`} className="pt-4">
              <button
                type="button"
                onClick={() => enlarge(photo, group)}
                aria-label={`Enlarge: ${photo.alt}`}
                className="flex aspect-square w-(--cell) cursor-zoom-in items-end justify-center rounded-[8px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
              >
                <div className="size-full">
                  <Print
                    photo={photo}
                    named={enlarged?.photo.id !== photo.id}
                  />
                </div>
              </button>
              {i === 0 ? (
                <Label group={group}>
                  <button
                    type="button"
                    onClick={closeGroup}
                    aria-label={`Close ${group.title}`}
                    className="type-mono flex size-[22px] cursor-pointer items-center justify-center rounded-[6px] border border-ink/15 bg-white text-ink/70 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    ×
                  </button>
                </Label>
              ) : (
                <div aria-hidden className="h-9" />
              )}
            </li>
          ));
        })}
      </ul>

      <Enlarged
        photo={enlarged?.photo ?? null}
        group={enlarged?.group ?? null}
        onClose={shrink}
        closing={closing}
        onSettled={finishShrink}
      />
    </div>
  );
}

/** A group's name under its stack, or over its first photo once open. */
function Label({
  group,
  className = "",
  children,
}: {
  group: PhotoGroup;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <ViewTransition name={`label-${group.id}`} default="photo">
      <div
        className={`mt-2.5 flex h-[26px] w-(--cell) items-center justify-between gap-2 transition-opacity duration-300 ${className}`}
      >
        <span className="type-title truncate">{group.title}</span>
        {children}
      </div>
    </ViewTransition>
  );
}

/**
 * One photo, large, with its details line: drawn over the whole page, outside the
 * index's stage. The photo carries the thumbnail's name, so it grows out of
 * the grid and shrinks back into it.
 *
 * The portal itself stays mounted, empty while no photo is open: React only
 * gives the backdrop and details their entering and leaving animations when
 * they come and go inside a container that's already there.
 */
function Enlarged({
  photo,
  group,
  onClose,
  closing,
  onSettled,
}: {
  photo: Photo | null;
  group: PhotoGroup | null;
  onClose: () => void;
  /** Settling into a print, before flying back. */
  closing: boolean;
  onSettled: () => void;
}) {
  const open = photo !== null;
  // Hold the page still underneath: a scroll here would leave the page.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  // The portal needs the document, which the server doesn't have.
  const onClient = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  if (!onClient) return null;

  return createPortal(
    <div
      role={open ? "dialog" : undefined}
      aria-modal={open || undefined}
      aria-label={photo?.alt}
      className={`text-ink fixed inset-0 z-[70] ${open ? "" : "pointer-events-none"}`}
    >
      {photo && group && (
        <EnlargedPhoto
          photo={photo}
          onClose={onClose}
          closing={closing}
          onSettled={onSettled}
        />
      )}
    </div>,
    document.body,
  );
}

/** The settle before flying back: quick, and easing to a stop. */
const SETTLE = { duration: 300, easing: "cubic-bezier(0.32, 0.72, 0, 1)" };
/** The thumbnail print's frame: its border and corner radius, in px. */
const FRAME = 8;

function EnlargedPhoto({
  photo,
  onClose,
  closing,
  onSettled,
}: {
  photo: Photo;
  onClose: () => void;
  closing: boolean;
  onSettled: () => void;
}) {
  const aspect = photo.width / photo.height;
  const [sharp, setSharp] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const pictureRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const settled = useRef(onSettled);
  useEffect(() => {
    settled.current = onSettled;
  });

  // Settle into the thumbnail's form, at this size: its shape (cropping
  // from the same focal point) and its frame, scaled up by however much
  // larger this is than the thumbnail. Then hand over to the fly-back.
  useEffect(() => {
    if (!closing) return;
    const frame = frameRef.current;
    const picture = pictureRef.current;
    const thumb = document.querySelector(`[data-print="${photo.id}"]`);
    if (!frame || !picture || !thumb) {
      settled.current();
      return;
    }
    const from = frame.getBoundingClientRect();
    const to = thumb.getBoundingClientRect();
    const scale = Math.min(from.width / to.width, from.height / to.height);
    const width = to.width * scale;
    const height = to.height * scale;
    const edge = FRAME * scale;
    const animations = [
      frame.animate(
        [
          {
            width: `${from.width}px`,
            borderWidth: `${FRAME}px`,
            borderRadius: `${FRAME}px`,
          },
          {
            width: `${width}px`,
            borderWidth: `${edge}px`,
            borderRadius: `${edge}px`,
          },
        ],
        { ...SETTLE, fill: "forwards" },
      ),
      picture.animate(
        [
          {
            height: `${from.height - 2 * FRAME}px`,
            aspectRatio: "auto",
            borderRadius: `${FRAME}px`,
          },
          {
            height: `${height - 2 * edge}px`,
            aspectRatio: "auto",
            borderRadius: `${edge}px`,
          },
        ],
        { ...SETTLE, fill: "forwards" },
      ),
      ...[captionRef.current, closeRef.current].flatMap((el) =>
        el
          ? [
              el.animate([{ opacity: 1 }, { opacity: 0 }], {
                duration: 160,
                easing: "ease-out",
                fill: "forwards",
              }),
            ]
          : [],
      ),
    ];
    let cancelled = false;
    Promise.all(animations.map((a) => a.finished)).then(
      () => !cancelled && settled.current(),
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [closing, photo.id]);

  return (
    <>
      <ViewTransition
        name="photo-backdrop"
        enter="photo-fade"
        exit="photo-fade"
      >
        <div onClick={onClose} className="page-ground absolute inset-0" />
      </ViewTransition>

      {/* The column enters as one piece, which carries the caption in; the
          photo inside it has its own name, so it morphs on its own. */}
      <ViewTransition name="photo-caption" enter="photo-rise" exit="photo-fade">
        <div className="pointer-events-none relative flex h-full flex-col items-center justify-center px-4 py-16">
          <ViewTransition name={`photo-${photo.id}`} default="photo">
            <div
              ref={frameRef}
              onClick={onClose}
              style={{
                width: `min(1000px, 100vw - 32px, (100svh - 200px) * ${aspect})`,
              }}
              className="pointer-events-auto cursor-zoom-out rounded-[8px] border-8 border-[#f7f7f7] bg-[#f7f7f7]"
            >
              <div
                ref={pictureRef}
                className="relative overflow-hidden rounded-[8px]"
                style={{ aspectRatio: aspect }}
              >
                {/* The grid's copy, already loaded, holds the frame while the
                  full-size one arrives over it. */}
                <Image
                  src={photo.src}
                  alt=""
                  fill
                  sizes="240px"
                  style={{ objectPosition: photo.focus }}
                  className="object-cover"
                />
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  style={{ objectPosition: photo.focus }}
                  fill
                  sizes="(max-width: 1032px) 100vw, 1000px"
                  onLoad={() => setSharp(true)}
                  // Fades in over the grid's copy as it arrives, rather
                  // than popping sharper mid-look.
                  className={`object-cover transition-opacity duration-300 ease-out ${
                    sharp ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            </div>
          </ViewTransition>

          <div
            ref={captionRef}
            className="pointer-events-auto mt-[clamp(20px,4svh,36px)] max-w-[562px] text-center"
          >
            {/* Just the details: camera, f-stop, shutter speed, date. */}
            <p className="type-mono text-ink/45">{details(photo)}</p>
          </div>
        </div>
      </ViewTransition>

      <button
        ref={closeRef}
        type="button"
        autoFocus
        onClick={onClose}
        aria-label="Close photo"
        className="type-mono absolute top-5 right-5 flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink/70 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06),0_2px_10px_rgba(0,0,0,0.08)] transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        ×
      </button>
    </>
  );
}
