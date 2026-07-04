"use client";

import { useSyncExternalStore } from "react";

/* Chrome and Firefox decode alpha in .webm (VP9) but not HEVC; Safari is
   the mirror image - HEVC-with-alpha .mov plays transparently, but its
   .webm decoding (where it decodes .webm at all) doesn't reliably keep
   the alpha channel. No single container/codec covers both, so this
   picks a source at runtime rather than relying on the browser's own
   <source> negotiation, which only knows "can I decode this codec," not
   "can I decode this codec's alpha channel."

   navigator.userAgent doesn't exist on the server, and computing the
   real answer during a normal render would mismatch whatever the client
   picks once it hydrates. useSyncExternalStore is the sanctioned way to
   read that kind of client-only external state: getServerSnapshot always
   returns null (matching the client's first paint before it's read
   navigator), then the real snapshot takes over immediately after. */
function isSafari() {
  return (
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
    navigator.vendor.includes("Apple")
  );
}

function subscribe() {
  return () => {};
}

export default function AlphaVideo({
  webmSrc,
  movSrc,
  width,
  height,
  className,
}: {
  webmSrc: string;
  movSrc: string;
  width: number;
  height: number;
  className?: string;
}) {
  const src = useSyncExternalStore(
    subscribe,
    () => (isSafari() ? movSrc : webmSrc),
    () => null,
  );

  if (!src) return null;

  return (
    <video
      src={src}
      autoPlay
      muted
      loop
      playsInline
      width={width}
      height={height}
      className={className}
      style={{ aspectRatio: `${width} / ${height}` }}
    />
  );
}
