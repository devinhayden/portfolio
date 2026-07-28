"use client";

import { useState } from "react";

const EMAIL = "dhydn04@gmail.com";

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

export function ContactLine() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText(EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <p className="text-[16px] leading-[1.4] text-black/70 whitespace-nowrap">
      You can reach him on{" "}
      <SocialLink href="https://www.linkedin.com/in/devin-hayden" label="LinkedIn" />,{" "}
      <SocialLink href="https://x.com/devinxhayden" label="X" />, via{" "}
      <button
        type="button"
        onClick={handleCopyEmail}
        className="underline underline-offset-2 transition-colors hover:text-black"
      >
        {copied ? "Copied" : "email"}
      </button>
      , or most likely on{" "}
      <SocialLink href="https://beli.com/devinxhayden" label="Beli" />.
    </p>
  );
}
