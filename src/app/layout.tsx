import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const rowan = localFont({
  src: [
    { path: "./fonts/Rowan-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Rowan-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-rowan",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Devin Hayden",
  description:
    "Devin Hayden is a designer shaping experiences meant to be outgrown.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${rowan.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
