'use client';

import { useRef, useEffect, useCallback } from 'react';

export type ToolMode = 'pointer' | 'draw' | 'erase';

interface DrawingCanvasProps {
  mode: ToolMode;
  contentRef: React.RefObject<HTMLDivElement>;
}

export default function DrawingCanvas({ mode, contentRef }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const points = useRef<{ x: number; y: number }[]>([]);

  // Resize canvas to match the full scrollable content dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    const content = contentRef.current;
    if (!canvas || !content) return;

    const resize = () => {
      const ctx = canvas.getContext('2d');
      const newW = content.offsetWidth;
      const newH = content.offsetHeight;
      if (newW === canvas.width && newH === canvas.height) return;

      // Snapshot existing strokes before clearing
      const snapshot =
        canvas.width > 0 && canvas.height > 0
          ? ctx?.getImageData(0, 0, canvas.width, canvas.height)
          : null;

      canvas.width = newW;
      canvas.height = newH;

      if (snapshot) ctx?.putImageData(snapshot, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(content);
    return () => ro.disconnect();
  }, [contentRef]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (mode === 'pointer') return;
      e.currentTarget.setPointerCapture(e.pointerId);

      const pos = getPos(e);
      isDrawing.current = true;
      lastPoint.current = pos;
      points.current = [pos];

      // Paint a dot at the start so short taps are visible
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      if (mode === 'draw') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(194, 34, 34, 0.9)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [mode]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current || mode === 'pointer') return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pos = getPos(e);
      points.current.push(pos);

      if (mode === 'draw') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(194, 34, 34, 0.88)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const pts = points.current;
        const len = pts.length;

        if (len >= 3) {
          const mid1 = {
            x: (pts[len - 3].x + pts[len - 2].x) / 2,
            y: (pts[len - 3].y + pts[len - 2].y) / 2,
          };
          const mid2 = {
            x: (pts[len - 2].x + pts[len - 1].x) / 2,
            y: (pts[len - 2].y + pts[len - 1].y) / 2,
          };
          ctx.beginPath();
          ctx.moveTo(mid1.x, mid1.y);
          ctx.quadraticCurveTo(pts[len - 2].x, pts[len - 2].y, mid2.x, mid2.y);
          ctx.stroke();
        } else if (len === 2) {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
        }
      } else if (mode === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 28;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,1)';

        if (lastPoint.current) {
          ctx.beginPath();
          ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
        }
      }

      lastPoint.current = pos;
    },
    [mode]
  );

  const onPointerUp = useCallback(() => {
    isDrawing.current = false;
    lastPoint.current = null;
    points.current = [];
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.globalCompositeOperation = 'source-over';
  }, []);

  const pencilCursor = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M25.1739 10.8124C25.7026 10.2838 25.9997 9.56685 25.9998 8.81923C25.9999 8.07162 25.703 7.35459 25.1744 6.82588C24.6459 6.29717 23.9289 6.00009 23.1813 6C22.4337 5.99991 21.7166 6.2968 21.1879 6.82538L7.84193 20.1744C7.60975 20.4059 7.43805 20.6909 7.34193 21.0044L6.02093 25.3564C5.99509 25.4429 5.99314 25.5347 6.01529 25.6222C6.03743 25.7097 6.08285 25.7896 6.14673 25.8534C6.21061 25.9172 6.29055 25.9624 6.37809 25.9845C6.46563 26.0065 6.55749 26.0044 6.64393 25.9784L10.9969 24.6584C11.3101 24.5631 11.5951 24.3925 11.8269 24.1614L25.1739 10.8124Z" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.9999 9L22.9999 13" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  )}") 6 26, crosshair`;

  const eraserCursor = `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M6.58557 19.4141C6.96052 19.7891 10.5796 23.4131 10.5796 23.4131C10.5796 23.4131 11.4996 24.5 12.6665 25.5C13.8334 26.5 14.9996 25.5 14.9996 25.5L25.4136 15.4141C25.7885 15.039 25.9991 14.5304 25.9991 14.0001C25.9991 13.4697 25.7885 12.9611 25.4136 12.5861L19.4146 6.58607C19.2288 6.40027 19.0083 6.25288 18.7656 6.15232C18.5229 6.05176 18.2628 6 18.0001 6C17.7374 6 17.4772 6.05176 17.2345 6.15232C16.9918 6.25288 16.7713 6.40027 16.5856 6.58607L6.58557 16.5861C6.21063 16.9611 6 18.0001 6 18.0001C6 18.0001 6.21063 19.039 6.58557 19.4141Z" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.99963 14L17.9996 22" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 26H22" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/></svg>`
  )}") 6 19, crosshair`;

  const cursor =
    mode === 'draw' ? pencilCursor : mode === 'erase' ? eraserCursor : 'default';

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10"
      style={{
        pointerEvents: mode === 'pointer' ? 'none' : 'auto',
        cursor,
        touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  );
}
