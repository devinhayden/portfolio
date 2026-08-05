"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const PX = 4; // css pixels per game pixel
const GROUND_H = 14;
const MAX_STAGE = 4;
const AI_MAX_STAGE = 2; // the idle character never grows plants past this
const WATER_RANGE = 13;
const WATER_DURATION = 0.7;
const MOVE_SPEED = 58;
const JUMP_VELOCITY = -150;
const GRAVITY = 520;

const COLOR: Record<string, string> = {
  bg: "#f6f0e4",
  cloud: "#eee6d4",
  ground: "#e4ddd0",
  edge: "#d3c7b0",
  speckle: "#d8cdb7",
  K: "#1c1b1a", // ink
  S: "#e6d3b3", // skin
  G: "#6f7f5e", // leaf
  D: "#556248", // stem / dark leaf
  B: "#fffaf2", // petal
  C: "#c9a96a", // flower core
  T: "#c9bda3", // dirt mound
  W: "#a3b6c2", // water
};

// Sprite maps: one char per game pixel, "." is transparent, letters index COLOR.
const BODY = [
  "..KKKK..",
  ".KKKKKK.",
  ".KSSSSK.",
  ".KSKKSK.",
  ".KSSSSK.",
  "..KKKK..",
  ".KKKKKK.",
  ".KKKKKK.",
  ".KKKKKK.",
];
const LEGS_STAND = ["..K..K..", "..K..K..", "..K..K.."];
const LEGS_APART = ["..K..K..", ".K....K.", ".K....K."];
const LEGS_PASS = ["...KK...", "...KK...", "...KK..."];
const LEGS_JUMP = ["..K..K..", "..K..K..", "........"];

const CAN = ["...KK.", "KKKKK.", "KKKK.."];

const PLANT_STAGES: string[][] = [
  ["..TTT..", ".TTTTT."],
  ["..G.G..", "...G...", "...D...", ".TTTTT."],
  [".G...G.", "..G.G..", "...G...", "...D...", "...D...", ".TTTTT."],
  ["..G.G..", ".GGGGG.", ".GDGDG.", ".GGGGG.", "...D...", "...D...", ".TTTTT."],
  ["..BBB..", ".BBCBB.", "..BBB..", "...D...", ".G.D.G.", "..GDG..", "...D...", ".TTTTT."],
];

const HANDLED_KEYS = new Set([
  "arrowleft",
  "arrowright",
  "arrowup",
  "arrowdown",
  " ",
  "a",
  "d",
  "w",
  "e",
]);

type Plot = { x: number; stage: number };
type Droplet = { x: number; y: number; vx: number; vy: number };
type Sparkle = { x: number; y: number; life: number };
type Cloud = {
  x: number;
  y: number;
  speed: number;
  blocks: [number, number, number, number][];
};

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function GardenGame() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const activeRef = useRef(false);
  const [active, setActiveState] = useState(false);
  const isTouch = useMediaQuery("(pointer: coarse)");

  const setActive = (value: boolean) => {
    activeRef.current = value;
    setActiveState(value);
    if (!value) keysRef.current.clear();
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let gameW = 0;
    let gameH = 0;
    let groundTop = 0;
    let scale = PX;
    let placed = false;

    const player = {
      x: 40,
      feetY: 0,
      vy: 0,
      facing: 1,
      onGround: true,
      walkT: 0,
      waterT: 0,
      waterPlot: -1,
    };
    let plots: Plot[] = [];
    const droplets: Droplet[] = [];
    const sparkles: Sparkle[] = [];
    let clouds: Cloud[] = [];
    let tufts: { x: number; h: number }[] = [];
    let speckles: { x: number; y: number }[] = [];
    const ai = { waitT: 1.2, targetX: null as number | null };
    let dropletTimer = 0;

    const resize = () => {
      const cw = wrap.clientWidth;
      const ch = wrap.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      scale = PX * dpr;
      gameW = Math.floor(cw / PX);
      gameH = Math.floor(ch / PX);
      groundTop = gameH - GROUND_H;

      if (!placed) {
        player.x = gameW / 2;
        placed = true;
      }
      player.x = Math.min(Math.max(player.x, 6), gameW - 6);
      if (player.onGround) player.feetY = groundTop;

      const count = Math.min(8, Math.max(3, Math.round(gameW / 64)));
      const margin = 28;
      const spacing = (gameW - margin * 2) / (count - 1);
      const old = plots;
      plots = Array.from({ length: count }, (_, i) => ({
        x: Math.round(margin + i * spacing),
        stage: old[i]?.stage ?? (Math.random() < 0.5 ? 1 : 0),
      }));

      tufts = Array.from({ length: Math.floor(gameW / 40) }, () => ({
        x: Math.floor(Math.random() * gameW),
        h: Math.random() < 0.4 ? 2 : 1,
      }));
      speckles = Array.from({ length: Math.floor(gameW / 14) }, () => ({
        x: Math.floor(Math.random() * gameW),
        y: groundTop + 2 + Math.floor(Math.random() * (GROUND_H - 4)),
      }));
      clouds = [
        {
          x: gameW * 0.2,
          y: 7,
          speed: 1.2,
          blocks: [
            [0, 2, 12, 3],
            [3, 0, 7, 2],
            [8, 3, 9, 3],
          ],
        },
        {
          x: gameW * 0.65,
          y: 15,
          speed: 0.8,
          blocks: [
            [0, 1, 9, 3],
            [4, 0, 10, 4],
          ],
        },
      ];
    };

    const startWater = (cap: number) => {
      player.waterT = WATER_DURATION;
      dropletTimer = 0;
      let best = -1;
      let bestDist = Infinity;
      plots.forEach((plot, i) => {
        const dist = Math.abs(plot.x - player.x);
        if (dist <= WATER_RANGE && dist < bestDist && plot.stage < cap) {
          bestDist = dist;
          best = i;
        }
      });
      player.waterPlot = best;
    };

    const finishWater = () => {
      const plot = plots[player.waterPlot];
      if (plot) {
        plot.stage++;
        for (let i = 0; i < 6; i++) {
          sparkles.push({
            x: plot.x - 3 + Math.random() * 6,
            y: groundTop - 3 - Math.random() * 7,
            life: 0.5 + Math.random() * 0.3,
          });
        }
      }
      player.waterPlot = -1;
    };

    const aiStep = (dt: number) => {
      if (player.waterT > 0) return 0;
      if (ai.targetX == null) {
        ai.waitT -= dt;
        if (ai.waitT <= 0) {
          const needy = plots.filter((p) => p.stage < AI_MAX_STAGE);
          ai.targetX = needy.length
            ? needy[Math.floor(Math.random() * needy.length)].x
            : 20 + Math.random() * (gameW - 40);
        }
        return 0;
      }
      const dx = ai.targetX - player.x;
      if (Math.abs(dx) < 3) {
        ai.targetX = null;
        ai.waitT = 1.5 + Math.random() * 2.5;
        const nearNeedy = plots.some(
          (p) => Math.abs(p.x - player.x) <= WATER_RANGE && p.stage < AI_MAX_STAGE,
        );
        if (nearNeedy) startWater(AI_MAX_STAGE);
        return 0;
      }
      if (player.onGround && Math.random() < dt * 0.15) {
        player.vy = JUMP_VELOCITY;
        player.onGround = false;
      }
      return Math.sign(dx);
    };

    const update = (dt: number) => {
      const keys = keysRef.current;
      let dir = 0;
      let wantJump = false;
      let wantWater = false;

      if (activeRef.current) {
        if (keys.has("arrowleft") || keys.has("a")) dir -= 1;
        if (keys.has("arrowright") || keys.has("d")) dir += 1;
        wantJump = keys.has("arrowup") || keys.has("w") || keys.has(" ");
        wantWater = keys.has("e");
      } else if (!reducedMotion) {
        dir = aiStep(dt);
      }

      if (player.waterT > 0) dir = 0;
      if (dir !== 0) player.facing = dir;
      player.x = Math.min(Math.max(player.x + dir * MOVE_SPEED * dt, 6), gameW - 6);

      if (wantJump && player.onGround && player.waterT <= 0) {
        player.vy = JUMP_VELOCITY;
        player.onGround = false;
      }
      if (!player.onGround) {
        player.vy += GRAVITY * dt;
        player.feetY += player.vy * dt;
        if (player.feetY >= groundTop) {
          player.feetY = groundTop;
          player.vy = 0;
          player.onGround = true;
        }
      }

      if (wantWater && player.onGround && player.waterT <= 0) {
        startWater(MAX_STAGE);
      }
      if (player.waterT > 0) {
        player.waterT -= dt;
        dropletTimer -= dt;
        if (dropletTimer <= 0) {
          dropletTimer = 0.07;
          for (let i = 0; i < 2; i++) {
            droplets.push({
              x: player.x + player.facing * 8,
              y: player.feetY - 9,
              vx: player.facing * (5 + Math.random() * 6),
              vy: 4 + Math.random() * 10,
            });
          }
        }
        if (player.waterT <= 0) finishWater();
      }

      player.walkT = dir !== 0 && player.onGround ? player.walkT + dt : 0;

      for (let i = droplets.length - 1; i >= 0; i--) {
        const d = droplets[i];
        d.vy += 300 * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (d.y >= groundTop) droplets.splice(i, 1);
      }
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.life -= dt;
        s.y -= 10 * dt;
        if (s.life <= 0) sparkles.splice(i, 1);
      }
      if (!reducedMotion) {
        for (const cloud of clouds) {
          cloud.x += cloud.speed * dt;
          if (cloud.x > gameW + 30) cloud.x = -30;
        }
      }
    };

    const drawMap = (map: string[], x: number, y: number, flip = false) => {
      for (let r = 0; r < map.length; r++) {
        const row = map[r];
        for (let c = 0; c < row.length; c++) {
          const ch = flip ? row[row.length - 1 - c] : row[c];
          if (ch === ".") continue;
          ctx.fillStyle = COLOR[ch];
          ctx.fillRect(x + c, y + r, 1, 1);
        }
      }
    };

    const draw = () => {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.fillStyle = COLOR.bg;
      ctx.fillRect(0, 0, gameW + 1, gameH + 1);

      ctx.fillStyle = COLOR.cloud;
      for (const cloud of clouds) {
        for (const [bx, by, bw, bh] of cloud.blocks) {
          ctx.fillRect(Math.round(cloud.x + bx), cloud.y + by, bw, bh);
        }
      }

      ctx.fillStyle = COLOR.ground;
      ctx.fillRect(0, groundTop, gameW + 1, GROUND_H);
      ctx.fillStyle = COLOR.edge;
      ctx.fillRect(0, groundTop, gameW + 1, 1);
      ctx.fillStyle = COLOR.speckle;
      for (const s of speckles) ctx.fillRect(s.x, s.y, 1, 1);
      ctx.fillStyle = COLOR.D;
      for (const t of tufts) ctx.fillRect(t.x, groundTop - t.h, 1, t.h);

      for (const plot of plots) {
        const map = PLANT_STAGES[plot.stage];
        drawMap(map, plot.x - 4, groundTop - map.length + 1);
      }

      ctx.fillStyle = COLOR.C;
      for (const s of sparkles) ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);

      let legs = LEGS_STAND;
      if (player.waterT > 0) legs = LEGS_PASS;
      else if (!player.onGround) legs = LEGS_JUMP;
      else if (player.walkT > 0)
        legs = Math.floor(player.walkT * 7) % 2 === 0 ? LEGS_APART : LEGS_PASS;
      drawMap(
        BODY.concat(legs),
        Math.round(player.x) - 4,
        Math.round(player.feetY) - 12,
        player.facing < 0,
      );
      if (player.waterT > 0) {
        drawMap(
          CAN,
          Math.round(player.x) + (player.facing > 0 ? 3 : -9),
          Math.round(player.feetY) - 11,
          player.facing < 0,
        );
      }

      ctx.fillStyle = COLOR.W;
      for (const d of droplets) ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 1);
    };

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      draw();
      raf = requestAnimationFrame(frame);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const key = e.key.toLowerCase();
    if (key === "escape") {
      e.currentTarget.blur();
      return;
    }
    if (HANDLED_KEYS.has(key)) {
      e.preventDefault();
      keysRef.current.add(key);
    }
  };

  const onKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    keysRef.current.delete(e.key.toLowerCase());
  };

  return (
    <div
      ref={wrapRef}
      tabIndex={isTouch ? -1 : 0}
      onClick={() => {
        if (!isTouch) wrapRef.current?.focus();
      }}
      onFocus={() => {
        if (!isTouch) setActive(true);
      }}
      onBlur={() => setActive(false)}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      aria-label="A small pixel garden. Use the arrow keys to move, space to jump, and E to water the plants."
      className={`relative h-[min(300px,30vh)] w-full shrink-0 overflow-hidden rounded bg-[#f6f0e4] outline-none select-none ${
        active ? "" : "cursor-pointer"
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {!isTouch && (
        <>
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-3 flex justify-center transition-opacity duration-300 ${
              active ? "opacity-0" : "opacity-100"
            }`}
          >
            <span className="rounded border border-foreground/10 bg-background/90 px-2 py-1 text-[12px] leading-none text-foreground/70">
              click to play
            </span>
          </div>
          <div
            className={`pointer-events-none absolute right-3 bottom-3 transition-opacity duration-300 ${
              active ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="text-[12px] leading-none text-foreground/50">
              ← → move · space jump · E water · esc leave
            </span>
          </div>
        </>
      )}
    </div>
  );
}
