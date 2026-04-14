'use client';

import { AnimatedMousePointerClick } from '@/components/AnimatedMousePointerClick';
import { AnimatedPencil } from '@/components/AnimatedPencil';
import { AnimatedEraser } from '@/components/AnimatedEraser';
import { AnimatedFlaskConical } from '@/components/AnimatedFlaskConical';
import { type ToolMode } from '@/components/DrawingCanvas';

interface HubToolbarProps {
  mode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
}

export default function HubToolbar({ mode, onModeChange }: HubToolbarProps) {
  const btnClass = (active: boolean) =>
    `flex items-center rounded-[6px] p-1.5 transition-all cursor-pointer ${
      active
        ? 'bg-[#1a1a1a] text-white shadow-sm'
        : 'text-[#1a1a1a] hover:bg-[#f0ece6]'
    }`;

  return (
    <div className="fixed right-10 top-1/2 z-20 -translate-y-1/2">
      <div className="relative flex flex-col items-center gap-3 rounded-[8px] border border-[#e1dcd3] bg-white p-1.5">

        {/* Pointer — default */}
        <button
          aria-label="Pointer mode"
          onClick={() => onModeChange('pointer')}
          className={btnClass(mode === 'pointer')}
        >
          <AnimatedMousePointerClick size={22} />
        </button>

        {/* Pencil — draw mode */}
        <button
          aria-label="Draw mode"
          onClick={() => onModeChange('draw')}
          className={btnClass(mode === 'draw')}
        >
          <AnimatedPencil size={22} />
        </button>

        {/* Eraser — erase mode */}
        <button
          aria-label="Erase mode"
          onClick={() => onModeChange('erase')}
          className={btnClass(mode === 'erase')}
        >
          <AnimatedEraser size={22} />
        </button>

        {/* Divider */}
        <div className="h-px w-full bg-[#e1dcd3]" />

        {/* Flask — reserved */}
        <button
          aria-label="Experiment mode"
          className={btnClass(false)}
        >
          <AnimatedFlaskConical size={18} />
        </button>


      </div>
    </div>
  );
}
