export default function HeroSection() {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 text-foreground">
        <p className="text-base font-bold">Devin Hayden</p>
        <p className="font-serif text-sm italic tracking-wide">/ product designer /</p>
        <p className="max-w-[243px] text-base font-normal">
          Designing for beginnings, and trusting you with what follows.
        </p>
      </div>

      <div className="h-px w-full bg-foreground/20" />

      <nav className="flex flex-col gap-4 text-sm font-light text-foreground">
        <a
          href="https://x.com/devinhayden"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-between transition-opacity hover:opacity-60"
        >
          <span>X / Twitter</span>
          <span>→</span>
        </a>
        <a
          href="https://linkedin.com/in/devinhayden"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-between transition-opacity hover:opacity-60"
        >
          <span>LinkedIn</span>
          <span>→</span>
        </a>
        <a
          href="/resume.pdf"
          target="_blank"
          className="flex w-full items-center justify-between transition-opacity hover:opacity-60"
        >
          <span>Resume</span>
          <span>→</span>
        </a>
      </nav>
    </section>
  );
}
