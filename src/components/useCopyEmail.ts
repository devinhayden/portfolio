"use client";

import { useState } from "react";

export const EMAIL = "dhydn04@gmail.com";

export function useCopyEmail() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    await navigator.clipboard.writeText(EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return { copied, copyEmail };
}
