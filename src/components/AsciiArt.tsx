'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';

interface FallingChar {
  id: number;
  x: number;
  y: number;
  char: string;
  duration: number;
  drift: number;
  rotate: number;
  fallDistance: number;
  opacity: number;
}

const LEAF_CHARS = ['.', '+', '-', '#'];
const FOLIAGE_CHARS = new Set(['.', '+', '#', '-']);

let nextLeafId = 0;

/** Simple seeded PRNG (mulberry32). Returns a function that yields [0, 1). */
function makePrng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function processAsciiArt(text: string): string {
  let lines = text.split('\n').map((line) => line.trimEnd());

  while (lines.length && lines[0].length === 0) lines.shift();
  while (lines.length && lines[lines.length - 1].length === 0) lines.pop();

  const nonEmptyLines = lines.filter((line) => line.length > 0);
  const minLeading = Math.min(
    ...nonEmptyLines.map((line) => line.length - line.trimStart().length)
  );
  return lines.map((line) => (line.length > 0 ? line.slice(minLeading) : '')).join('\n');
}

/**
 * Collects all edge foliage cells from a grid — cells containing a foliage
 * character that are adjacent (cardinal) to at least one space or boundary.
 * Interior cells are never returned, so the trunk is structurally unreachable.
 */
function collectEdgeCells(
  grid: string[][],
  height: number,
  width: number
): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (!FOLIAGE_CHARS.has(grid[r][c])) continue;
      const nbr = (dr: number, dc: number) => grid[r + dr]?.[c + dc] ?? ' ';
      if (nbr(-1, 0) === ' ' || nbr(1, 0) === ' ' || nbr(0, -1) === ' ' || nbr(0, 1) === ' ') {
        cells.push([r, c]);
      }
    }
  }
  return cells;
}

/**
 * Generates 3 pruned variants. Each variant runs two edge-only passes so the
 * shape change is clearly visible. Only cells on the outer boundary of the
 * foliage mass are ever candidates — interior cells and the trunk are safe.
 *
 * Pass 1 (all variants): full strip of the outer ring (prob = 1.0)
 * Pass 2 (directional):
 *   Variant 1 — uniform second pass: another full ring removed, tight all-around
 *   Variant 2 — top-biased:  probability falls from 1 → 0 top-to-bottom (flatter crown)
 *   Variant 3 — side-biased: probability falls from 1 → 0 edge-to-center (narrower form)
 */
function buildVariants(base: string): string[] {
  const rows = base.split('\n');
  const baseGrid: string[][] = rows.map((row) => row.split(''));
  const height = baseGrid.length;
  const width = Math.max(...baseGrid.map((r) => r.length));

  for (const row of baseGrid) {
    while (row.length < width) row.push(' ');
  }

  const centerCol = width / 2;

  const secondPassProbs: ((r: number, c: number) => number)[] = [
    () => 1.0,
    (r) => Math.pow(1 - r / height, 0.6),
    (_, c) => Math.pow(Math.abs(c - centerCol) / (width / 2), 0.6),
  ];

  return secondPassProbs.map((secondProb, i) => {
    const grid = baseGrid.map((row) => [...row]);
    const rand = makePrng(i + 1);

    // Pass 1: strip the full outer ring
    for (const [r, c] of collectEdgeCells(grid, height, width)) {
      grid[r][c] = ' ';
    }

    // Pass 2: directional removal of the newly exposed ring
    for (const [r, c] of collectEdgeCells(grid, height, width)) {
      if (rand() < secondProb(r, c)) {
        grid[r][c] = ' ';
      }
    }

    return grid.map((row) => row.join('').trimEnd()).join('\n');
  });
}

const PRUNE_LABELS = [
  'ASCII art bonsai tree',
  'ASCII art bonsai tree, lightly pruned',
  'ASCII art bonsai tree, moderately pruned',
  'ASCII art bonsai tree, alternately pruned',
];

export default function AsciiArt() {
  const [variants, setVariants] = useState<string[]>([]);
  const [stateIndex, setStateIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [leaves, setLeaves] = useState<FallingChar[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/ascii-bonsai.txt')
      .then((res) => res.text())
      .then((text) => {
        const base = processAsciiArt(text);
        setVariants([base, ...buildVariants(base)]);
      });
  }, []);

  // Ambient falling characters
  useEffect(() => {
    if (!variants.length) return;

    const spawnLeaf = () => {
      const leaf: FallingChar = {
        id: nextLeafId++,
        x: 10 + Math.random() * 80,
        y: 5 + Math.random() * 50,
        char: LEAF_CHARS[Math.floor(Math.random() * LEAF_CHARS.length)],
        duration: 3500 + Math.random() * 4500,
        drift: (Math.random() - 0.5) * 70,
        rotate: (Math.random() - 0.5) * 80,
        fallDistance: 180 + Math.random() * 160,
        opacity: 0.45 + Math.random() * 0.45,
      };

      setLeaves((prev) => {
        const updated = [...prev, leaf];
        return updated.length > 18 ? updated.slice(-18) : updated;
      });
    };

    const schedule = () => {
      timeoutRef.current = setTimeout(() => {
        spawnLeaf();
        schedule();
      }, 800 + Math.random() * 2200);
    };

    schedule();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [variants]);

  const removeLeaf = useCallback((id: number) => {
    setLeaves((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const spawnBurst = useCallback((clickX: number, clickY: number) => {
    const count = 6 + Math.floor(Math.random() * 5); // 6–10
    setLeaves((prev) => {
      const burst: FallingChar[] = Array.from({ length: count }, () => ({
        id: nextLeafId++,
        x: clickX + (Math.random() - 0.5) * 20,
        y: clickY + (Math.random() - 0.5) * 20,
        char: LEAF_CHARS[Math.floor(Math.random() * LEAF_CHARS.length)],
        duration: 2000 + Math.random() * 1500,
        drift: (Math.random() - 0.5) * 80,
        rotate: (Math.random() - 0.5) * 120,
        fallDistance: 150 + Math.random() * 120,
        opacity: 0.6 + Math.random() * 0.35,
      }));
      const updated = [...prev, ...burst];
      return updated.length > 30 ? updated.slice(-30) : updated;
    });
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!variants.length || isTransitioning) return;

      // Compute click position as % of container
      const rect = containerRef.current?.getBoundingClientRect();
      const clickX = rect ? ((e.clientX - rect.left) / rect.width) * 100 : 50;
      const clickY = rect ? ((e.clientY - rect.top) / rect.height) * 100 : 30;

      const nextIndex = (stateIndex + 1) % variants.length;

      setIsTransitioning(true);
      spawnBurst(clickX, clickY);

      transitionRef.current = setTimeout(() => {
        setStateIndex(nextIndex);
        setIsTransitioning(false);
      }, 150);
    },
    [variants, stateIndex, isTransitioning, spawnBurst]
  );

  useEffect(() => {
    return () => {
      if (transitionRef.current) clearTimeout(transitionRef.current);
    };
  }, []);

  // Compute fixed dimensions from the original (largest) art so that pruned
  // variants never cause the pre to shrink and shift the surrounding layout.
  const baseDims = useMemo(() => {
    if (!variants.length) return null;
    const lines = variants[0].split('\n');
    return {
      chars: Math.max(...lines.map((l) => l.length)),
      lines: lines.length,
    };
  }, [variants]);

  if (!variants.length) return null;

  const currentArt = variants[stateIndex];

  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer"
      onClick={handleClick}
      title="Click to prune"
      role="button"
      tabIndex={0}
      aria-label={PRUNE_LABELS[stateIndex]}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      }}
    >
      <pre
        className="font-mono text-[1.6px] leading-[1.15] text-foreground mix-blend-darken transition-opacity duration-150 lg:text-[3px]"
        style={{
          opacity: isTransitioning ? 0.3 : 1,
          minWidth: baseDims ? `${baseDims.chars}ch` : undefined,
          minHeight: baseDims ? `calc(${baseDims.lines} * 1.15em)` : undefined,
        }}
        aria-hidden="true"
      >
        {currentArt}
      </pre>

      {leaves.map((leaf) => (
        <span
          key={leaf.id}
          aria-hidden="true"
          className="pointer-events-none absolute font-mono text-[7px] text-foreground will-change-transform lg:text-[9px]"
          style={
            {
              left: `${leaf.x}%`,
              top: `${leaf.y}%`,
              '--leaf-drift': `${leaf.drift}px`,
              '--leaf-rotate': `${leaf.rotate}deg`,
              '--leaf-fall': `${leaf.fallDistance}px`,
              '--leaf-opacity': leaf.opacity,
              animation: `leaf-fall ${leaf.duration}ms ease-in forwards`,
            } as React.CSSProperties
          }
          onAnimationEnd={() => removeLeaf(leaf.id)}
        >
          {leaf.char}
        </span>
      ))}
    </div>
  );
}
