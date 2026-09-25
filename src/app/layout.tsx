import type { Metadata } from "next";
import { DM_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: "400",
});

const rowan = localFont({
  src: [{ path: "./fonts/Rowan-Medium.woff2", weight: "500", style: "normal" }],
  variable: "--font-rowan",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Devin Hayden",
  description:
    "Devin is a product designer shaping boundless digital experiences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmMono.variable} ${rowan.variable} antialiased`}
    >
      <body>
        {children}
        {/* The hero holds its content back until it has loaded; without JS, show it. */}
        <noscript>
          <style>{".reveal{opacity:1!important;transform:none!important}"}</style>
        </noscript>
      </body>
    </html>
  );
}
