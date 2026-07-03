"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from "react";
import Link from "next/link";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

/* Placeholder gradients standing in for the real photos. Each entry becomes
   a generated texture; swap for real images once they're in public/photos. */
const PLACEHOLDER_HUES: [number, number][] = [
  [210, 230], // dusk blue
  [25, 355], // warm sunset
  [140, 180], // sea green
  [270, 310], // violet haze
];

const CROSSFADE_SECONDS = 0.6;
const SNAP_IDLE_MS = 250;
const CHROME_FADE_END = 0.3; // progress at which the DOM UI is fully hidden

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform vec2 uRes;       // viewport in css px
  uniform vec4 uRect;      // window at rest: center x, center y (gl coords), half w, half h
  uniform float uProgress; // 0 = home, 1 = fully inside
  uniform float uTime;
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform float uMix;      // crossfade between A and B
  uniform vec2 uTexResA;
  uniform vec2 uTexResB;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  vec2 coverUv(vec2 uv, vec2 texRes, float zoom) {
    float screenAspect = uRes.x / uRes.y;
    float texAspect = texRes.x / texRes.y;
    vec2 s = screenAspect > texAspect
      ? vec2(1.0, texAspect / screenAspect)
      : vec2(screenAspect / texAspect, 1.0);
    return (uv - 0.5) * s / zoom + 0.5;
  }

  void main() {
    float e = smoothstep(0.0, 1.0, uProgress);

    // window mask: rect interpolating from the DOM square to the full viewport
    vec2 p = vUv * uRes;
    vec2 center = mix(uRect.xy, uRes * 0.5, e);
    vec2 halfSize = mix(uRect.zw, uRes * 0.5 + 2.0, e);
    vec2 d = abs(p - center) - halfSize;
    float sd = max(d.x, d.y);
    float alpha = 1.0 - smoothstep(-0.75, 0.75, sd);
    if (alpha <= 0.001) discard;

    // gentle dreamlike drift, stronger once inside
    vec2 uv = vUv;
    float amt = 0.0025 + 0.0035 * e;
    uv += amt * vec2(
      sin(uv.y * 7.0 + uTime * 0.35),
      cos(uv.x * 6.0 + uTime * 0.28)
    );

    // slight zoom as you enter the window
    float zoom = mix(1.0, 1.1, e);
    vec3 colA = texture2D(uTexA, coverUv(uv, uTexResA, zoom)).rgb;
    vec3 colB = texture2D(uTexB, coverUv(uv, uTexResB, zoom)).rgb;
    vec3 col = mix(colA, colB, uMix);

    // film grain
    float g = hash(vUv * uRes + fract(uTime) * 100.0) - 0.5;
    col += g * 0.035;

    // soft vignette once inside
    float vig = distance(vUv, vec2(0.5));
    col *= 1.0 - vig * 0.25 * e;

    gl_FragColor = vec4(col, alpha);
  }
`;

type ProgressState = { target: number; current: number; lastInput: number };
type PhotoController = { go: (dir: 1 | -1) => void };

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function smooth01(t: number) {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

function makePlaceholderTexture([h1, h2]: [number, number]) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1067;
  const ctx = canvas.getContext("2d")!;
  const { width: w, height: h } = canvas;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, `hsl(${h1} 50% 70%)`);
  sky.addColorStop(0.6, `hsl(${(h1 + h2) / 2} 55% 52%)`);
  sky.addColorStop(1, `hsl(${h2} 60% 30%)`);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(
    w * 0.5,
    h * 0.35,
    0,
    w * 0.5,
    h * 0.35,
    w * 0.3,
  );
  glow.addColorStop(0, "rgba(255,245,225,0.4)");
  glow.addColorStop(1, "rgba(255,245,225,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function Scene({
  squareRef,
  chromeRef,
  progressRef,
  controllerRef,
}: {
  squareRef: RefObject<HTMLDivElement | null>;
  chromeRef: RefObject<HTMLDivElement | null>;
  progressRef: MutableRefObject<ProgressState>;
  controllerRef: MutableRefObject<PhotoController | null>;
}) {
  const size = useThree((s) => s.size);
  const textures = useMemo(
    () => PLACEHOLDER_HUES.map(makePlaceholderTexture),
    [],
  );
  const fade = useRef({ active: false, mix: 0, index: 0 });

  const uniforms = useMemo(
    () => ({
      uRes: { value: new THREE.Vector2(1, 1) },
      uRect: { value: new THREE.Vector4(0, 0, 0, 0) },
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uTexA: { value: textures[0] },
      uTexB: { value: textures[0] },
      uMix: { value: 0 },
      uTexResA: { value: new THREE.Vector2(1600, 1067) },
      uTexResB: { value: new THREE.Vector2(1600, 1067) },
    }),
    [textures],
  );

  // Built imperatively so the material shares our exact uniforms object —
  // r3f clones a `uniforms` prop, which would orphan our per-frame updates.
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
      }),
    [uniforms],
  );

  useEffect(
    () => () => {
      material.dispose();
      textures.forEach((t) => t.dispose());
    },
    [material, textures],
  );

  useEffect(() => {
    controllerRef.current = {
      go(dir) {
        const f = fade.current;
        if (f.active) return;
        f.index = (f.index + dir + textures.length) % textures.length;
        uniforms.uTexB.value = textures[f.index];
        f.mix = 0;
        f.active = true;
      },
    };
    return () => {
      controllerRef.current = null;
    };
  }, [controllerRef, textures, uniforms]);

  // keep the shader's rest rect aligned with the DOM square
  useEffect(() => {
    const measure = () => {
      const el = squareRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      uniforms.uRect.value.set(
        r.left + r.width / 2,
        size.height - (r.top + r.height / 2), // flip to gl coords
        r.width / 2,
        r.height / 2,
      );
      uniforms.uRes.value.set(size.width, size.height);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    if (squareRef.current) ro.observe(squareRef.current);
    return () => ro.disconnect();
  }, [size, uniforms, squareRef]);

  // Per-frame imperative updates are r3f's escape hatch; uniforms and the
  // progress object are mutable three.js/animation state, not React state.
  /* eslint-disable react-hooks/immutability */
  useFrame((state, delta) => {
    const p = progressRef.current;

    // magnetic settle: when input goes idle, ease toward the nearest endpoint
    if (performance.now() - p.lastInput > SNAP_IDLE_MS) {
      const nearest = p.target > 0.5 ? 1 : 0;
      p.target += (nearest - p.target) * Math.min(1, delta * 3);
    }
    p.current += (p.target - p.current) * Math.min(1, delta * 7);
    if (Math.abs(p.target - p.current) < 0.0005) p.current = p.target;

    uniforms.uProgress.value = p.current;
    uniforms.uTime.value = state.clock.elapsedTime;

    const f = fade.current;
    if (f.active) {
      f.mix = Math.min(1, f.mix + delta / CROSSFADE_SECONDS);
      uniforms.uMix.value = smooth01(f.mix);
      if (f.mix >= 1) {
        uniforms.uTexA.value = uniforms.uTexB.value;
        uniforms.uTexResA.value.copy(uniforms.uTexResB.value);
        uniforms.uMix.value = 0;
        f.active = false;
      }
    }

    const chrome = chromeRef.current;
    if (chrome) {
      const opacity = 1 - smooth01(p.current / CHROME_FADE_END);
      chrome.style.opacity = opacity.toFixed(3);
      chrome.style.pointerEvents = opacity < 0.4 ? "none" : "auto";
    }
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export default function Home() {
  const squareRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<PhotoController | null>(null);
  const progressRef = useRef<ProgressState>({
    target: 0,
    current: 0,
    lastInput: 0,
  });
  const [glReady, setGlReady] = useState(false);

  useEffect(() => {
    const p = progressRef.current;
    const onWheel = (e: WheelEvent) => {
      p.target = clamp01(p.target + e.deltaY / 1400);
      p.lastInput = performance.now();
    };
    let lastY = 0;
    const onTouchStart = (e: TouchEvent) => {
      lastY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const y = e.touches[0].clientY;
      p.target = clamp01(p.target + (lastY - y) / 600);
      lastY = y;
      p.lastInput = performance.now();
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <div className="fixed inset-0 z-10">
        <Canvas
          gl={{ alpha: true, antialias: true }}
          dpr={[1, 2]}
          onCreated={() => setGlReady(true)}
        >
          <Scene
            squareRef={squareRef}
            chromeRef={chromeRef}
            progressRef={progressRef}
            controllerRef={controllerRef}
          />
        </Canvas>
      </div>

      <div ref={chromeRef} className="relative z-20 flex h-full flex-col">
        <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-24">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">
            Scroll to take a peek
          </p>

          <div className="flex items-center gap-4 sm:gap-14 md:gap-20">
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => controllerRef.current?.go(-1)}
              className="shrink-0 text-black transition-opacity hover:opacity-60"
            >
              <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                <path d="M10 0L0 8L10 16V0Z" fill="currentColor" />
              </svg>
            </button>

            <div
              ref={squareRef}
              className="h-52 w-52 shrink-0 sm:h-64 sm:w-64 md:h-72 md:w-72"
              style={{ background: glReady ? "transparent" : "#ffffff" }}
            />

            <button
              type="button"
              aria-label="Next photo"
              onClick={() => controllerRef.current?.go(1)}
              className="shrink-0 text-black transition-opacity hover:opacity-60"
            >
              <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                <path d="M0 0L10 8L0 16V0Z" fill="currentColor" />
              </svg>
            </button>
          </div>

          <p className="max-w-sm text-center font-serif text-lg leading-relaxed text-foreground sm:max-w-md">
            Devin is daydreaming about a finished portfolio. Until it&apos;s
            real: a look at his work, and a few scenes he&apos;s captured.
          </p>
        </main>

        <footer className="flex items-center justify-center gap-10 pb-14 font-serif text-neutral-500">
          <Link href="/" className="transition-colors hover:text-neutral-800">
            Home
          </Link>
          <Link
            href="/work"
            className="transition-colors hover:text-neutral-800"
          >
            Work
          </Link>
          <Link
            href="/about"
            className="transition-colors hover:text-neutral-800"
          >
            About
          </Link>
        </footer>
      </div>
    </div>
  );
}
