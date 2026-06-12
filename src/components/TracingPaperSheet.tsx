import Image from 'next/image';
import type { ReactNode } from 'react';

interface TracingPaperSheetProps {
  children?: ReactNode;
  /** Optional PNG to composite as the top texture layer */
  src?: string;
  /** Stacking offset — rotates and shifts the sheet for physical fan effect */
  offset?: { rotate: number; y: number };
  /** backdrop-filter blur amount in px (default 3) */
  blurStrength?: number;
  /** background opacity (default 0.22) */
  opacity?: number;
  className?: string;
}

export default function TracingPaperSheet({
  children,
  src,
  offset,
  blurStrength = 1.0,
  opacity = 0.3,
  className = '',
}: TracingPaperSheetProps) {
  const offsetTransform = offset
    ? `rotate(${offset.rotate}deg) translateY(${offset.y}px)`
    : undefined;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `rgba(255, 251, 247, ${opacity})`,
        backdropFilter: `blur(${blurStrength}px)`,
        WebkitBackdropFilter: `blur(${blurStrength}px)`,
        border: '0.5px solid rgba(255, 252, 249, 0.1)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.03)',
        transform: offsetTransform,
      }}
    >
      {/* Overlay PNG — sits below paper scan so fibers appear over the marks */}
      {src && (
        <Image
          src={src}
          alt=""
          fill
          aria-hidden="true"
          className="pointer-events-none object-cover"
        />
      )}

      {/* Real tracing paper scan — multiply blend darkens only where fibers/density exist */}
      <Image
        src="/papers/tracing.jpg"
        alt=""
        fill
        unoptimized
        aria-hidden="true"
        className="pointer-events-none object-cover"
        style={{ mixBlendMode: 'multiply', opacity: 0.2, filter: 'brightness(1.1)' }}
      />

      {/* SVG grain for micro-detail on top of the photo texture */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
        <rect width="100%" height="100%" filter="url(#grain)" opacity="0.08" />
      </svg>

      {/* Children sit above the texture layers */}
      {children && <div className="relative">{children}</div>}
    </div>
  );
}
