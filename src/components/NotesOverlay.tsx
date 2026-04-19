'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TegakiRenderer } from 'tegaki/react';
import caveatBundle from 'tegaki/fonts/caveat';
import { supabase } from '@/lib/supabase';

const COLORS = ['#fde047', '#f9a8d4', '#86efac', '#93c5fd'];
const ROTATIONS = [-4, -1.5, 1.5, 4];
const NOTE_SIZE = 200;
const SIDEBAR_H = 100;
const NOTE_PEEK = 62;        // how many px of each sidebar note are visible
const CANVAS_W = 5000;
const CANVAS_H = 3000;
const MAX_NOTES = 150;
const MAX_CHARS = 200;

interface Note {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  rotation: number;
  created_at: string;
}

interface PendingNote {
  x: number;
  y: number;
  color: string;
  text: string;
  phase: 'editing' | 'animating';
  rotation: number;
}

interface DragState {
  colorIndex: number;
  screenX: number;
  screenY: number;
}

export default function NotesOverlay({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [pending, setPending] = useState<PendingNote | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [profanityError, setProfanityError] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  offsetRef.current = canvasOffset;
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;
  const pendingRef = useRef<PendingNote | null>(null);
  pendingRef.current = pending;
  const tegakiKey = useRef(0);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  // Center canvas when overlay opens
  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const { width, height } = panel.getBoundingClientRect();
      setCanvasOffset({
        x: -(CANVAS_W / 2 - width / 2),
        y: -(CANVAS_H / 2 - (height - SIDEBAR_H) / 2),
      });
    }, 50);
    return () => clearTimeout(id);
  }, [isOpen]);

  // Load notes + realtime
  useEffect(() => {
    if (!isOpen) return;

    supabase
      .from('sticky_notes')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setNotes(data as Note[]);
      });

    const ch = supabase
      .channel('overlay-notes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sticky_notes' }, p => {
        setNotes(prev =>
          prev.some(n => n.id === (p.new as Note).id) ? prev : [...prev, p.new as Note]
        );
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'sticky_notes' }, p => {
        setNotes(prev => prev.filter(n => n.id !== (p.old as Note).id));
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [isOpen]);

  const getPanelRect = () => panelRef.current?.getBoundingClientRect();

  const isOverCanvas = (sx: number, sy: number) => {
    const r = getPanelRect();
    if (!r) return false;
    return sx >= r.left && sx <= r.right && sy >= r.top && sy <= r.bottom - SIDEBAR_H;
  };

  // ── Sidebar drag ──────────────────────────────────────────────────────────

  const handleSidebarPointerDown = useCallback((e: React.PointerEvent, idx: number) => {
    e.preventDefault();
    setDrag({ colorIndex: idx, screenX: e.clientX, screenY: e.clientY });
  }, []);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setDrag(d => d ? { ...d, screenX: e.clientX, screenY: e.clientY } : null);
  }, []);

  const handleDragUp = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) { setDrag(null); return; }

    if (isOverCanvas(e.clientX, e.clientY)) {
      const rect = getPanelRect()!;
      const off = offsetRef.current;
      const x = e.clientX - NOTE_SIZE / 2 - rect.left - off.x;
      const y = e.clientY - NOTE_SIZE / 2 - rect.top - off.y;
      tegakiKey.current += 1;
      setPending({
        x, y,
        color: COLORS[d.colorIndex % COLORS.length],
        text: '',
        phase: 'editing',
        rotation: (Math.random() - 0.5) * 10,
      });
    }
    // If not over canvas: drag state clears, sidebar note snaps back naturally
    setDrag(null);
  }, []);

  // ── Inline editing ────────────────────────────────────────────────────────

  const handleKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const pn = pendingRef.current;
    if (!pn || pn.phase !== 'editing') return;

    if (e.key === 'Escape') { setPending(null); return; }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = pn.text.trim();
      if (!trimmed) return;

      try {
        const { Filter } = await import('bad-words');
        if (new Filter().isProfane(trimmed)) {
          setProfanityError(true);
          setTimeout(() => setProfanityError(false), 2500);
          return;
        }
      } catch { /* proceed */ }

      setPending(p => p ? { ...p, phase: 'animating' } : null);
    }
  }, []);

  const handleTegakiComplete = useCallback(async () => {
    const pn = pendingRef.current;
    if (!pn) return;

    const { count } = await supabase
      .from('sticky_notes')
      .select('*', { count: 'exact', head: true });

    if (count !== null && count >= MAX_NOTES) {
      const { data: oldest } = await supabase
        .from('sticky_notes')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1);
      if (oldest?.[0]) await supabase.from('sticky_notes').delete().eq('id', oldest[0].id);
    }

    await supabase.from('sticky_notes').insert({
      text: pn.text.trim(),
      color: pn.color,
      x: Math.round(pn.x),
      y: Math.round(pn.y),
      rotation: pn.rotation,
    });

    setPending(null);
  }, []);

  // ── Canvas pan ────────────────────────────────────────────────────────────

  const handleBgDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current || pendingRef.current) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, ox: offsetRef.current.x, oy: offsetRef.current.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handleBgMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return;
    const r = getPanelRect();
    if (!r) return;
    const pw = r.width, ph = r.height - SIDEBAR_H;
    setCanvasOffset({
      x: Math.min(pw * 0.85, Math.max(-(CANVAS_W - pw * 0.15), panStart.current.ox + (e.clientX - panStart.current.x))),
      y: Math.min(ph * 0.85, Math.max(-(CANVAS_H - ph * 0.15), panStart.current.oy + (e.clientY - panStart.current.y))),
    });
  }, []);

  const handleBgUp = useCallback(() => { isPanning.current = false; }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const r = getPanelRect();
    if (!r) return;
    const pw = r.width, ph = r.height - SIDEBAR_H;
    setCanvasOffset(prev => ({
      x: Math.min(pw * 0.85, Math.max(-(CANVAS_W - pw * 0.15), prev.x - e.deltaX)),
      y: Math.min(ph * 0.85, Math.max(-(CANVAS_H - ph * 0.15), prev.y - e.deltaY)),
    }));
  }, []);

  const handleClose = () => { setPending(null); setDrag(null); onClose(); };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dim backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={handleClose}
          />

          {/* Global drag tracking overlay */}
          {drag && (
            <div
              className="fixed inset-0 z-[70]"
              style={{ cursor: 'grabbing' }}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragUp}
            />
          )}

          {/* Ghost note following cursor */}
          {drag && (
            <div
              className="fixed pointer-events-none rounded-[2px] shadow-xl z-[75]"
              style={{
                left: drag.screenX - NOTE_SIZE / 2,
                top: drag.screenY - NOTE_SIZE / 2,
                width: NOTE_SIZE,
                height: NOTE_SIZE,
                backgroundColor: COLORS[drag.colorIndex % COLORS.length],
                rotate: '2deg',
              }}
            />
          )}

          {/* Floating panel */}
          <motion.div
            ref={panelRef}
            className="fixed z-[60] overflow-hidden rounded-2xl shadow-2xl select-none"
            style={{
              left: '50%',
              top: '50%',
              width: 'min(90vw, 1100px)',
              height: 'min(80vh, 780px)',
              background: '#f7f6f4',
            }}
            initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.96, x: '-50%', y: '-50%' }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
          >
            {/* Close button */}
            <button
              className="absolute top-3.5 right-3.5 z-20 w-7 h-7 flex items-center justify-center rounded-full text-[#bbb] hover:text-[#555] hover:bg-black/[0.06] transition-all duration-150 text-[20px] leading-none"
              onClick={handleClose}
            >
              ×
            </button>

            {/* ── Canvas area ──────────────────────────── */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ bottom: SIDEBAR_H, cursor: isPanning.current ? 'grabbing' : 'grab' }}
              onPointerDown={handleBgDown}
              onPointerMove={handleBgMove}
              onPointerUp={handleBgUp}
              onWheel={handleWheel}
            >
              {/* Virtual canvas */}
              <div
                className="absolute pointer-events-none"
                style={{
                  width: CANVAS_W,
                  height: CANVAS_H,
                  left: canvasOffset.x,
                  top: canvasOffset.y,
                }}
              >
                {/* Placed notes from Supabase */}
                <AnimatePresence>
                  {notes.map(note => (
                    <motion.div
                      key={note.id}
                      className="absolute rounded-[2px] shadow-md"
                      style={{
                        left: note.x,
                        top: note.y,
                        width: NOTE_SIZE,
                        height: NOTE_SIZE,
                        backgroundColor: note.color,
                        rotate: note.rotation,
                      }}
                      initial={{ scale: 0.88, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.88, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                    >
                      <div className="p-3 w-full h-full overflow-hidden">
                        <TegakiRenderer
                          font={caveatBundle}
                          time={{ mode: 'controlled', unit: 'progress', value: 1 }}
                          style={{
                            fontSize: '15px',
                            color: '#1e1e1e',
                            lineHeight: '1.5',
                            width: '100%',
                            height: '100%',
                          }}
                        >
                          {note.text}
                        </TegakiRenderer>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Pending note (being edited / animating) */}
                {pending && (
                  <motion.div
                    className="absolute rounded-[2px] shadow-lg pointer-events-auto"
                    style={{
                      left: pending.x,
                      top: pending.y,
                      width: NOTE_SIZE,
                      height: NOTE_SIZE,
                      backgroundColor: pending.color,
                      rotate: pending.rotation,
                    }}
                    initial={{ scale: 0.88, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                  >
                    <div className="p-3 w-full h-full relative overflow-hidden">
                      {pending.phase === 'editing' && (
                        <>
                          <textarea
                            autoFocus
                            maxLength={MAX_CHARS}
                            value={pending.text}
                            onChange={e =>
                              setPending(p => p ? { ...p, text: e.target.value } : null)
                            }
                            onKeyDown={handleKeyDown}
                            placeholder="Write something..."
                            className="w-full h-full bg-transparent outline-none resize-none text-[15px] text-[#1e1e1e] placeholder-[#1e1e1e]/30 leading-snug font-sans"
                          />
                          {profanityError ? (
                            <p className="absolute bottom-2 left-3 text-[11px] text-red-600">
                              Let&apos;s keep it kind :)
                            </p>
                          ) : (
                            <p className="absolute bottom-2 right-3 text-[10px] text-black/25 pointer-events-none">
                              ↵ to place
                            </p>
                          )}
                        </>
                      )}
                      {pending.phase === 'animating' && (
                        <TegakiRenderer
                          key={tegakiKey.current}
                          font={caveatBundle}
                          time={{ mode: 'uncontrolled', playing: true, speed: 4.5 }}
                          onComplete={handleTegakiComplete}
                          style={{
                            fontSize: '15px',
                            color: '#1e1e1e',
                            lineHeight: '1.5',
                            width: '100%',
                            height: '100%',
                          }}
                        >
                          {pending.text.trim()}
                        </TegakiRenderer>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* ── Sidebar strip ─────────────────────────── */}
            <div
              className="absolute bottom-0 left-0 right-0 border-t border-black/[0.07] pointer-events-none"
              style={{ height: SIDEBAR_H, background: '#edeae7' }}
            />

            {/* ── Sidebar notes (fan) ───────────────────── */}
            {/*
              Position: absolute, relative to panel.
              bottom: -(NOTE_SIZE - NOTE_PEEK) places each note so only NOTE_PEEK px
              of its top is visible. Panel's overflow:hidden clips the rest.
              whileHover y:-32 reveals more of the note.
            */}
            <div
              className="absolute left-0 right-0 flex items-end justify-center pointer-events-none"
              style={{ gap: 20, bottom: -(NOTE_SIZE - NOTE_PEEK) }}
            >
              {COLORS.map((color, i) => {
                const isDragging = drag?.colorIndex === i;
                return (
                  <motion.div
                    key={color}
                    className="shrink-0 rounded-[2px] shadow-md pointer-events-auto"
                    style={{
                      width: NOTE_SIZE,
                      height: NOTE_SIZE,
                      backgroundColor: color,
                      rotate: ROTATIONS[i],
                      opacity: isDragging ? 0.2 : 1,
                      cursor: 'grab',
                      touchAction: 'none',
                      transformOrigin: 'bottom center',
                    }}
                    whileHover={
                      !isDragging
                        ? { y: -32, transition: { duration: 0.2, ease: [0.2, 0, 0, 1] } }
                        : {}
                    }
                    onPointerDown={e => {
                      if (!isDragging) handleSidebarPointerDown(e, i);
                    }}
                  />
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
