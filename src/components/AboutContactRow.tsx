"use client";

import { useCopyEmail } from "@/components/useCopyEmail";

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 transition-colors hover:text-black"
    >
      {label}
    </a>
  );
}

export function AboutContactRow() {
  const { copied, copyEmail } = useCopyEmail();

  return (
    <div className="flex items-center gap-6 text-[16px] leading-[1.4] text-black/70">
      <SocialLink href="https://www.linkedin.com/in/devin-hayden" label="LinkedIn" />
      <SocialLink href="https://x.com/devinxhayden" label="X" />
      <button
        type="button"
        onClick={copyEmail}
        className="underline underline-offset-2 transition-colors hover:text-black"
      >
        {copied ? "Copied" : "Email"}
      </button>
      <SocialLink href="https://beli.com/devinxhayden" label="Beli" />
    </div>
  );
}
