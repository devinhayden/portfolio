import type { Metadata } from "next";

import { RecordPlayerLab } from "@/components/lab/RecordPlayerLab";
import { consoleArtProps } from "@/components/lab/record/art";

export const metadata: Metadata = {
  title: "Record player lab — Devin Hayden",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <RecordPlayerLab art={consoleArtProps()} />;
}
