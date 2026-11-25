import type { Metadata } from "next";

import { ClayLab } from "@/components/lab/ClayLab";

export const metadata: Metadata = {
  title: "Clay lab — Devin Hayden",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ClayLab />;
}
