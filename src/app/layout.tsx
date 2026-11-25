import type { Metadata } from "next";
import { DialRoot } from "dialkit";
import "dialkit/styles.css";
import { DM_Mono, Instrument_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Grain } from "@/components/Grain";

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: "400",
});

/**
 * Reading text (`type-body`): articles and project write-ups, where Rowan, a
 * display face, would crowd. Also the clay's controls. Variable, so every
 * weight is there.
 */
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

/** Quiet metadata: the word counts and dates on the writing index. */
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
    "Devin is a creative crafting moments worth a closer look, on screen and off.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmMono.variable} ${instrumentSans.variable} ${rowan.variable} antialiased`}
    >
      <body>
        {children}
        <Grain />
        {/* Live tuning panels, for development only. Mounting DialKit at
            all starts its version thumbnails, which snapshot the whole page
            (every image at full size) on load, so it never ships. */}
        {process.env.NODE_ENV === "development" && (
          <DialRoot position="bottom-right" />
        )}
        {/* The hero holds its content back until it has loaded; without JS, show it. */}
        <noscript>
          <style>
            {".reveal{opacity:1!important;transform:none!important}"}
          </style>
        </noscript>
      </body>
    </html>
  );
}
