/**
 * The site's marks. Inline so they inherit `currentColor` and need no extra
 * request: a late-arriving icon in a control would be obvious.
 */

type IconProps = { className?: string };

const base = "size-full";

export function LinkedInIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
      className={className ?? base}
    >
      <path d="M6.94 5.5a2.44 2.44 0 1 1-4.88 0 2.44 2.44 0 0 1 4.88 0ZM2.5 9.06h4.13V22H2.5V9.06Zm6.44 0h3.96v1.78h.06c.55-1 1.9-2.06 3.9-2.06 4.17 0 4.94 2.6 4.94 5.99V22h-4.13v-6.4c0-1.53-.03-3.5-2.18-3.5-2.18 0-2.51 1.66-2.51 3.38V22H8.94V9.06Z" />
    </svg>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
      className={className ?? base}
    >
      <path d="M18.24 2.25h3.31l-7.23 8.26L22.82 21.75h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
      className={className ?? base}
    >
      <path d="M2 6.44A2.44 2.44 0 0 1 4.44 4h15.12A2.44 2.44 0 0 1 22 6.44v.52l-10 5.93L2 6.96v-.52Zm0 2.85v8.27A2.44 2.44 0 0 0 4.44 20h15.12A2.44 2.44 0 0 0 22 17.56V9.29l-9.49 5.63a1 1 0 0 1-1.02 0L2 9.29Z" />
    </svg>
  );
}

/**
 * Window chrome rather than a brand mark, so these are line work — the social
 * glyphs stay solid and the two groups read as different kinds of thing.
 */
const line = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function EyeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      className={className ?? base}
      {...line}
    >
      <path d="M2.2 12S6 5.8 12 5.8 21.8 12 21.8 12 18 18.2 12 18.2 2.2 12 2.2 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      className={className ?? base}
      {...line}
    >
      <path d="M10.7 6A9.9 9.9 0 0 1 12 5.8c6 0 9.8 6.2 9.8 6.2a19 19 0 0 1-3.2 4" />
      <path d="M6.6 7.9A18.6 18.6 0 0 0 2.2 12S6 18.2 12 18.2a9.8 9.8 0 0 0 3.4-.6" />
      <path d="M10 10a2.8 2.8 0 0 0 3.9 4" />
      <path d="M4 4 20 20" />
    </svg>
  );
}

/*
 * The clay's presets, for the switcher under the landing. Drawn as line work
 * on the same 24px grid as the window chrome, and simple enough to read at
 * 16px: each is the figure's silhouette plus the one detail that names it.
 */

export function ClayBallIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      className={className ?? base}
      {...line}
    >
      <circle cx="12" cy="12.5" r="7.75" />
      <path d="M8.6 9.9a4.6 4.6 0 0 1 2.9-2.15" />
    </svg>
  );
}

export function ClayCameraIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      className={className ?? base}
      {...line}
    >
      <rect x="2.75" y="7" width="18.5" height="12.5" rx="3" />
      <path d="M8.25 7 9.6 4.6c.25-.4.65-.6 1.1-.6h2.6c.45 0 .85.2 1.1.6L15.75 7" />
      <circle cx="12" cy="13.25" r="3.25" />
    </svg>
  );
}

/** A xiao long bao: squat, pleated, gathered into a twist on top. */
export function ClayDumplingIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      className={className ?? base}
      {...line}
    >
      <path d="M3.25 18.25c0-4.4 3.9-7.75 8.75-7.75s8.75 3.35 8.75 7.75c0 .55-.45 1-1 1H4.25c-.55 0-1-.45-1-1Z" />
      <path d="M10.6 10.6c.1-1.15.6-2.1 1.4-2.85.8.75 1.3 1.7 1.4 2.85" />
      <path d="M10.7 10.7c-1.9 1.4-3.3 4-3.7 8.5M13.3 10.7c1.9 1.4 3.3 4 3.7 8.5M12 10.5v8.75" />
    </svg>
  );
}

export function ClayMatchaIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      className={className ?? base}
      {...line}
    >
      <path d="M5.75 9.5h12.5v6.25A4.25 4.25 0 0 1 14 20h-4a4.25 4.25 0 0 1-4.25-4.25V9.5Z" />
      <path d="M10.35 7c-.75-.9.75-1.6 0-2.5M13.85 7c-.75-.9.75-1.6 0-2.5" />
    </svg>
  );
}
