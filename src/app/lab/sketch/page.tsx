import type { Metadata } from "next";

import { SketchLab } from "@/components/lab/SketchLab";

export const metadata: Metadata = {
  title: "Sketch lab — Devin Hayden",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SketchLab />;
}
