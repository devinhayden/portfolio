export default function HeroSection() {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 text-[14px] text-foreground">
        <p className="font-medium">DEVIN HAYDEN</p>
        <p className="font-normal">Designer based in Los Angeles</p>
      </div>
      <p className="text-[16px] font-normal leading-relaxed text-[#8d8482] lg:w-[303px]">
        Crafting beginnings worth exploring, and trusting you with what follows.
      </p>

      <div className="h-px w-full bg-foreground/20" />

      <nav className="flex flex-col gap-4 text-[14px] text-foreground">
        <a
          href="https://x.com/devinhayden"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-between transition-opacity hover:opacity-60"
        >
          <span className="font-normal">X / Twitter</span>
          <span className="font-normal">→</span>
        </a>
        <a
          href="https://linkedin.com/in/devinhayden"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-between transition-opacity hover:opacity-60"
        >
          <span className="font-normal">LinkedIn</span>
          <span className="font-normal">→</span>
        </a>
        <a
          href="/resume.pdf"
          target="_blank"
          className="flex w-full items-center justify-between transition-opacity hover:opacity-60"
        >
          <span className="font-normal">Resume</span>
          <span className="font-normal">→</span>
        </a>
      </nav>
    </section>
  );
}
