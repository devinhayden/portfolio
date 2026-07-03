export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-24">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">
          Scroll to take a peak.
        </p>

        <div className="flex items-center gap-4 sm:gap-14 md:gap-20">
          <button
            type="button"
            aria-label="Previous"
            className="shrink-0 text-black transition-opacity hover:opacity-60"
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path d="M10 0L0 8L10 16V0Z" fill="currentColor" />
            </svg>
          </button>

          <div className="h-52 w-52 shrink-0 bg-white sm:h-64 sm:w-64 md:h-72 md:w-72" />

          <button
            type="button"
            aria-label="Next"
            className="shrink-0 text-black transition-opacity hover:opacity-60"
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path d="M0 0L10 8L0 16V0Z" fill="currentColor" />
            </svg>
          </button>
        </div>

        <p className="max-w-sm text-center font-serif text-lg leading-relaxed text-foreground sm:max-w-md">
          Devin is daydreaming about a finished portfolio. Until it&apos;s
          real: a look at his work, and a few scenes he&apos;s captured.
        </p>
      </main>

      <footer className="flex items-center justify-center gap-10 pb-14 font-serif text-neutral-500">
        <a href="/" className="transition-colors hover:text-neutral-800">
          Home
        </a>
        <a href="/work" className="transition-colors hover:text-neutral-800">
          Work
        </a>
        <a href="/about" className="transition-colors hover:text-neutral-800">
          About
        </a>
      </footer>
    </div>
  );
}
