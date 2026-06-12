'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';

interface TracingPaperProps {
  src: string;
  width: number;
  height: number;
  style?: CSSProperties;
}

export default function TracingPaper({ src, width, height, style }: TracingPaperProps) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width,
        height,
        background: 'rgba(241, 237, 226, 0.10)',
        backdropFilter: 'blur(1.5px)',
        WebkitBackdropFilter: 'blur(1.5px)',
        ...style,
      }}
    >
      <Image
        src={src}
        alt=""
        width={width}
        height={height}
        className="block h-full w-full"
        style={{ filter: 'drop-shadow(0 16px 64px rgba(0,0,0,0.10)) drop-shadow(0 4px 16px rgba(0,0,0,0.06))' }}
      />
    </div>
  );
}
