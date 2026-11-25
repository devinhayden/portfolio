import type { Metadata } from "next";

import { ClayPlayground } from "@/components/lab/ClayPlayground";

export const metadata: Metadata = {
  title: "Clay playground — Devin Hayden",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ClayPlayground />;
}
