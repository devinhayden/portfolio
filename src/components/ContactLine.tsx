"use client";

import { useCopyEmail } from "@/components/useCopyEmail";

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 transition-colors hover:text-foreground"
    >
      {label}
    </a>
  );
}

export function ContactLine() {
  const { copied, copyEmail } = useCopyEmail();

  return (
    <p className="text-[16px] leading-[1.4] text-foreground/70 whitespace-nowrap">
      You can reach him on{" "}
      <SocialLink href="https://www.linkedin.com/in/devin-hayden" label="LinkedIn" />,{" "}
      <SocialLink href="https://x.com/devinxhayden" label="X" />, via{" "}
      <button
        type="button"
        onClick={copyEmail}
        className="underline underline-offset-2 transition-colors hover:text-foreground"
      >
        {copied ? "Copied" : "email"}
      </button>
      , or most likely on{" "}
      <SocialLink href="https://beli.com/devinxhayden" label="Beli" />.
    </p>
  );
}
