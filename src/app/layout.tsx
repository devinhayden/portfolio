import type { Metadata } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Instrument_Serif, Caveat } from 'next/font/google';
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

export const metadata: Metadata = {
  title: 'Devin Hayden | Product Designer',
  description: 'Building intelligence with an understanding of real human rhythms.',
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
      <body className={`${GeistMono.variable} ${GeistSans.variable} ${instrumentSerif.variable} ${caveat.variable} font-sans`}>
        <div className="h-screen bg-[#f7f6f4] p-4 font-geist">
          <PageTransitionWrapper>
            <main className="h-full">{children}</main>
          </PageTransitionWrapper>
        </div>
      </body>
    </html>
  );
}
