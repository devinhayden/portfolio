import type { Metadata } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Instrument_Serif, Caveat } from 'next/font/google';
import localFont from 'next/font/local';
import GrainFilter from '@/components/GrainFilter';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import './globals.css';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
});

const rowan = localFont({
  src: [
    { path: '../../public/fonts/Rowan-Variable.woff2', style: 'normal' },
    { path: '../../public/fonts/Rowan-VariableItalic.woff2', style: 'italic' },
  ],
  variable: '--font-rowan',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Devin Hayden',
  description: 'Devin Hayden is a product designer who loves to experiment.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700&display=swap"
        />
      </head>
      <body className={`${GeistMono.variable} ${GeistSans.variable} ${instrumentSerif.variable} ${caveat.variable} ${rowan.variable} font-geist`}>
        <GrainFilter />
        <PageTransitionWrapper>
          <main>{children}</main>
        </PageTransitionWrapper>
      </body>
    </html>
  );
}
