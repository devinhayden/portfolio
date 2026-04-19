import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trimble — Devin Hayden',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
