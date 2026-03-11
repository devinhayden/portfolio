'use client';

import Image from 'next/image';
import Link from 'next/link';

// Absolute-positioned mosaic — tightened from Figma node 878-58
//
// Container: 1202 × 868 (aspect ratio preserved)
// All gaps between adjacent items reduced to 1.5%
//
// Fixed-aspect-ratio items (size unchanged from Figma, only position shifted):
//   Trimble, browserAnimation, movieTicket, Beacon, Comet, Fuser, Voxel
//
// Flexible items (resized to fill the tightened space):
//   musicPhoto1/2/3, experientialMarketing1/2

export default function ProjectsSection() {
  return (
    <section className="px-8 pb-24 pt-12">
      <div className="relative w-full" style={{ aspectRatio: '1202 / 868' }}>

        {/* ── TRIMBLE ──────────────────────────────────────────────────────────
            Anchor: flush left, flush top. Size unchanged from Figma.
            l=0%  t=0%  w=49.03%  h=48.30%                                  */}
        <Link
          href="/projects/trimble"
          className="absolute block overflow-hidden rounded-lg transition-opacity hover:opacity-80"
          style={{ left: '0%', top: '0%', width: '49.03%', height: '48.30%' }}
        >
          <video autoPlay loop muted playsInline className="h-full w-full object-cover">
            <source src="/projectFiles/trimbleCoverAnimation.mp4" type="video/mp4" />
          </video>
        </Link>

        {/* ── BROWSER ANIMATION ────────────────────────────────────────────────
            Gap left of Trimble (49.03%) = 1.5% → starts at 50.53%
            l=50.53%  t=0%  w=28.81%  h=22.45%  (size unchanged)            */}
        <div
          className="absolute overflow-hidden rounded-lg"
          style={{ left: '50.53%', top: '0%', width: '28.81%', height: '22.45%' }}
        >
          <video autoPlay loop muted playsInline className="h-full w-full object-cover">
            <source src="/projectFiles/agenticBrowserAnimation.mov" type="video/quicktime" />
            <source src="/projectFiles/agenticBrowserAnimation.mov" type="video/mp4" />
          </video>
        </div>

        {/* ── MOVIE TICKET ─────────────────────────────────────────────────────
            Gap left of browserAnimation end (50.53+28.81=79.34%) = 1.5% → 80.84%
            l=80.84%  t=0%  w=16.05%  h=48.27%  (size unchanged)            */}
        <div
          className="absolute overflow-hidden rounded-lg"
          style={{ left: '80.84%', top: '0%', width: '16.05%', height: '48.27%' }}
        >
          <video autoPlay loop muted playsInline className="h-full w-full object-cover">
            <source src="/projectFiles/movieTicketAnimation.mp4" type="video/mp4" />
          </video>
        </div>

        {/* ── BEACON ───────────────────────────────────────────────────────────
            Gap below Trimble (48.30%) = 1.5% → starts at 49.80%
            l=0%  t=49.80%  w=28.81%  h=22.45%  (size unchanged)            */}
        <div
          className="absolute overflow-hidden rounded-lg"
          style={{ left: '0%', top: '49.80%', width: '28.81%', height: '22.45%' }}
        >
          <div className="relative h-full w-full">
            <Image src="/projectFiles/beaconCover.png" alt="Beacon" fill className="object-cover" />
          </div>
        </div>

        {/* ── MUSIC PHOTO 1 ────────────────────────────────────────────────────
            Gap right of Beacon (28.81%) = 1.5% → starts at 30.31%
            Width fills to Voxel left (50.53%) minus 1.5% gap: 50.53-30.31-1.5 = 18.72%
            Height: three photos fill 49.80%→100% with two 1.5% gaps
              each = (100-49.80-3) / 3 = 15.73%
            t=49.80%                                                          */}
        <div
          className="absolute overflow-hidden rounded-lg"
          style={{ left: '30.31%', top: '49.80%', width: '18.72%', height: '15.73%' }}
        >
          <div className="relative h-full w-full">
            <Image src="/projectFiles/musicPhoto1.png" alt="" fill className="object-cover" />
          </div>
        </div>

        {/* ── MUSIC PHOTO 2 ────────────────────────────────────────────────────
            t = 49.80 + 15.73 + 1.5 = 67.03%                                */}
        <div
          className="absolute overflow-hidden rounded-lg"
          style={{ left: '30.31%', top: '67.03%', width: '18.72%', height: '15.73%' }}
        >
          <div className="relative h-full w-full">
            <Image src="/projectFiles/musicPhoto2.png" alt="" fill className="object-cover" />
          </div>
        </div>

        {/* ── MUSIC PHOTO 3 ────────────────────────────────────────────────────
            t = 67.03 + 15.73 + 1.5 = 84.26%                                */}
        <div
          className="absolute overflow-hidden rounded-lg"
          style={{ left: '30.31%', top: '84.26%', width: '18.72%', height: '15.73%' }}
        >
          <div className="relative h-full w-full">
            <Image src="/projectFiles/musicPhoto3.png" alt="" fill className="object-cover" />
          </div>
        </div>

        {/* ── EXPERIENTIAL MARKETING 1 ─────────────────────────────────────────
            Gap below browserAnimation (22.45%) = 1.5% → t=23.95%
            l aligns with browserAnimation: 50.53%
            Width: two images fill 50.53%→80.84% (movieTicket left) with one 1.5% gap between
              and 1.5% gap before movieTicket: (80.84-50.53-1.5-1.5)/2 = 13.66%
            Height fills to Voxel top (49.80%) minus 1.5% gap: 49.80-23.95-1.5 = 24.35%  */}
        <div
          className="absolute overflow-hidden rounded-lg"
          style={{ left: '50.53%', top: '23.95%', width: '13.66%', height: '24.35%' }}
        >
          <div className="relative h-full w-full">
            <Image src="/projectFiles/experientialMarketing1.png" alt="" fill className="object-cover" />
          </div>
        </div>

        {/* ── EXPERIENTIAL MARKETING 2 ─────────────────────────────────────────
            l = 50.53 + 13.66 + 1.5 = 65.69%                                */}
        <div
          className="absolute overflow-hidden rounded-lg"
          style={{ left: '65.69%', top: '23.95%', width: '13.66%', height: '24.35%' }}
        >
          <div className="relative h-full w-full">
            <Image src="/projectFiles/experientialMarketing2.png" alt="" fill className="object-cover" />
          </div>
        </div>

        {/* ── COMET ────────────────────────────────────────────────────────────
            Gap below Beacon (49.80+22.45=72.25%) = 1.5% → t=73.75%
            l=0%  w=12.95%  h=22.43%  (size unchanged)                      */}
        <div
          className="absolute overflow-hidden rounded-lg"
          style={{ left: '0%', top: '73.75%', width: '12.95%', height: '22.43%' }}
        >
          <div className="relative h-full w-full">
            <Image src="/projectFiles/cometCover.png" alt="Comet" fill className="object-cover" />
          </div>
        </div>

        {/* ── FUSER ────────────────────────────────────────────────────────────
            Gap right of Comet (12.95%) = 1.5% → l=14.45%
            t=73.75%  w=12.95%  h=22.43%  (size unchanged)                  */}
        <div
          className="absolute overflow-hidden rounded-lg"
          style={{ left: '14.45%', top: '73.75%', width: '12.95%', height: '22.43%' }}
        >
          <video autoPlay loop muted playsInline className="h-full w-full object-cover">
            <source src="/projectFiles/fuserAnimation.mp4" type="video/mp4" />
          </video>
        </div>

        {/* ── VOXEL ────────────────────────────────────────────────────────────
            Left aligns with browserAnimation: l=50.53%
            Flush right: w = 100 - 50.53 = 49.47%
            t = 49.80% (same as Beacon row)
            Height preserves Voxel AR (588.928×419 in 1202×868 container):
              AR_display = (49.47/h) × (1202/868) = 1.405 → h=48.75%        */}
        <Link
          href="/projects/voxel"
          className="absolute block overflow-hidden rounded-lg transition-opacity hover:opacity-80"
          style={{ left: '50.53%', top: '49.80%', width: '49.47%', height: '48.75%' }}
        >
          <video autoPlay loop muted playsInline className="h-full w-full object-cover">
            <source src="/projectFiles/voxelCoverAnimation.mp4" type="video/mp4" />
          </video>
        </Link>

      </div>
    </section>
  );
}
