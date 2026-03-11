import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Voxel — Devin Hayden',
};

export default function VoxelPage() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-10 mix-blend-hard-light">
        <Image
          src="/paper-texture.png"
          alt=""
          fill
          className="object-cover opacity-15"
          priority
        />
      </div>

      <div className="relative px-8 py-12 md:px-16 md:py-16">
        <Link
          href="/"
          className="text-sm font-light text-foreground/60 transition-opacity hover:opacity-60"
        >
          ← Back
        </Link>

        <div className="mt-16">
          <p className="font-serif text-sm italic tracking-wide text-foreground/40">
            / case study /
          </p>
          <h1 className="mt-2 text-4xl font-bold text-foreground">Voxel</h1>
        </div>
      </div>
    </>
  );
}
