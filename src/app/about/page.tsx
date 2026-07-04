export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-24">
      <nav className="flex gap-2 font-mono text-xs uppercase text-neutral-500">
        <a
          href="mailto:dhydn04@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-gray-600"
        >
          EMAIL
        </a>
        <span className="text-neutral-400">|</span>
        <a
          href="https://www.linkedin.com/in/devin-hayden"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-gray-600"
        >
          LINKEDIN
        </a>
        <span className="text-neutral-400">|</span>
        <a
          href="https://x.com/devinxhayden"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-gray-600"
        >
          X
        </a>
      </nav>
 

      <img
        src="/profile.jpg"
        alt="Profile"
        className="h-52 w-52 shrink-0 border border-foreground/10 bg-neutral-100 object-cover sm:h-64 sm:w-64 md:h-72 md:w-72"
        width={288}
        height={288}
        />

      <p className="max-w-xs text-center font-serif text-md font-medium leading-relaxed text-foreground sm:max-w-sm">
        A true creative at heart, Devin is a designer constantly in pursuit of the smallest, most human way to make something click. He believes that the best ideas are usually already lying around, just waiting for someone to notice them.
      </p>
    </main>
  );
}
