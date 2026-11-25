import type { Metadata } from "next";

import { TreeLab } from "@/components/lab/TreeLab";

export const metadata: Metadata = {
  title: "Tree lab — Devin Hayden",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <TreeLab />;
}
