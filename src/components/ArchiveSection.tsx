'use client';

import { useState } from 'react';

interface ArchiveItem {
  id: string;
  title: string;
  description: string;
  mediaCount: number;
  mediaAspect: string;
  href: string;
}

const archiveItems: ArchiveItem[] = [
  {
    id: 'movie-ticket',
    title: 'Movie ticket interaction',
    description:
      'A micro-interaction exploration for mobile movie ticketing, focusing on delight through motion and considered haptic feedback.',
    mediaCount: 3,
    mediaAspect: 'aspect-[2453/1380]',
    href: '#',
  },
  {
    id: 'agentic-browser',
    title: 'Agentic browser security',
    description:
      'An exploration of surfacing agent permissions in AI browsers through onboarding and motion via Jitter.',
    mediaCount: 3,
    mediaAspect: 'aspect-[2453/1380]',
    href: '#',
  },
  {
    id: 'experiential-marketing',
    title: 'Experiential marketing for consumer tech',
    description:
      'Concept work for consumer technology activations, bridging physical and digital experiences across live event touchpoints.',
    mediaCount: 3,
    mediaAspect: 'aspect-[2453/1380]',
    href: '#',
  },
];

interface ArchiveItemProps {
  item: ArchiveItem;
  isExpanded: boolean;
  isMuted: boolean;
  onToggle: () => void;
}

function ArchiveItem({ item, isExpanded, isMuted, onToggle }: ArchiveItemProps) {
  return (
    <div>
      {/* Row header */}
      <button
        onClick={onToggle}
        className={`flex w-full items-center justify-between py-4 text-left transition-opacity duration-200 ${
          isMuted ? 'opacity-50' : 'opacity-100'
        }`}
      >
        <span className="text-[16px] font-normal leading-normal text-foreground">
          {item.title}
        </span>
        <span
          className={`inline-block text-[14px] font-normal text-foreground transition-transform duration-300 ${
            isExpanded ? 'rotate-90' : ''
          }`}
          aria-hidden="true"
        >
          →
        </span>
      </button>

      {/* Expandable content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col gap-4 pb-5">
          <p className="text-[16px] font-normal leading-normal text-foreground/50">
            {item.description}
          </p>
          <div className="flex gap-4">
            {Array.from({ length: item.mediaCount }).map((_, i) => (
              <div key={i} className={`${item.mediaAspect} flex-1 bg-white`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArchiveSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section>
      <p className="mb-4 text-[14px] font-medium tracking-widest text-foreground/50">ARCHIVE</p>
      <div className="h-px w-full bg-foreground/15" />

      {archiveItems.map((item) => (
        <div key={item.id}>
          <ArchiveItem
            item={item}
            isExpanded={openId === item.id}
            isMuted={openId !== null && openId !== item.id}
            onToggle={() => setOpenId(openId === item.id ? null : item.id)}
          />
          <div className="h-px w-full bg-foreground/15" />
        </div>
      ))}
    </section>
  );
}
