# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow

Before editing any file, always read it first to check for manual changes made since the last session. Never overwrite edits that weren't made by you.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
npm run format   # Prettier (auto-formats all files)
```

No test suite exists in this project.

## Environment

The app requires two env vars in `.env.local` for the Supabase sticky-notes feature:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Architecture

Next.js 14 App Router project (`src/app/`). All pages are under `src/app/`, shared UI lives in `src/components/`, and thin utilities are in `src/lib/`.

### Routes

| Route | File | Notes |
|---|---|---|
| `/` | `src/app/page.tsx` | Main hub — the primary landing page |
| `/bonsai` | `src/app/bonsai/page.tsx` | Alternate portfolio layout (paper-texture aesthetic) |
| `/projects/trimble` | `src/app/projects/trimble/page.tsx` | Trimble case study |
| `/projects/voxel` | `src/app/projects/voxel/page.tsx` | Voxel case study |

### Key architectural patterns

**Page transitions** — `PageTransitionWrapper` (`src/components/PageTransitionWrapper.tsx`) wraps the root layout and exposes a `useNavigate()` hook. All internal navigation must use this hook (not `<Link>`) so the fade-out animation runs before the route change. `TransitionLink` is a convenience wrapper around it.

**Drawing canvas** — `DrawingCanvas` (`src/components/DrawingCanvas.tsx`) is a freehand canvas overlay rendered on top of the hub page. It tracks three `ToolMode` states (`pointer` | `draw` | `erase`) controlled by `HubToolbar`. The canvas is desktop-only and sized to match the scrollable content area via `ResizeObserver`.

**Sticky notes (Supabase)** — `NotesOverlay` (`src/components/NotesOverlay.tsx`) is a modal with a 5000×3000 virtual panning canvas. Notes are stored in a Supabase `sticky_notes` table and synced in real-time via Postgres `channel` subscriptions. Session identity is kept in `localStorage` (name + UUID token). On mobile the overlay is `readOnly` (view-only, no drag-to-place).

**Intro animation** — The hub page runs a sequenced `motion/react` animation on first load, gated by `sessionStorage` (`intro_played`). On repeat visits the animation is skipped and all elements are set to their final state instantly.

**Handwriting rendering** — `TegakiRenderer` (from the `tegaki` package) animates text as if being handwritten. It is used in the intro sequence (writing the headline) and for sticky note content.

### Fonts

Four font families are configured:

- `font-sans` → Satoshi (loaded via Fontshare CDN in `layout.tsx`)
- `font-geist` → Geist Sans (next/font)
- `font-mono` → Geist Mono (next/font)
- `font-serif` → Instrument Serif (Google Fonts)
- `font-handwriting` → Caveat (Google Fonts, also bundled separately as a Tegaki font for handwriting animation)

### Styling conventions

- Tailwind CSS with `prettier-plugin-tailwindcss` (classes auto-sorted on format)
- Inline `style` props are used for values that aren't Tailwind-expressible (e.g. arbitrary pixel offsets, animation targets, canvas dimensions)
- Brand accent color is `#c22222` (red); neutral background is `#f7f6f4`
- No CSS modules or styled-components — Tailwind only
