"use client";

import {
  useCallback,
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

/* Per-photo treatment: `effect` selects the shader's light pass,
   `drift` is the dreamlike uv-warp amount (only the clouds want it). */
const PHOTOS = [
  { src: "/photos/1.jpg", effect: 0, drift: 0.0035 }, // clouds
  { src: "/photos/2.jpg", effect: 1, drift: 0 }, // bamboo
  { src: "/photos/3.jpg", effect: 2, drift: 0 }, // pond
  { src: "/photos/4.jpg", effect: 3, drift: 0 }, // highway
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
  uniform float uEffectA;  // per-photo light pass (0 clouds, 1 bamboo, 2 pond, 3 highway)
  uniform float uEffectB;
  uniform float uDriftA;   // per-photo uv-warp amount
  uniform float uDriftB;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x),
      mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * vnoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  vec2 coverUv(vec2 uv, vec2 texRes, float zoom) {
    float screenAspect = uRes.x / uRes.y;
    float texAspect = texRes.x / texRes.y;
    vec2 s = screenAspect > texAspect
      ? vec2(1.0, texAspect / screenAspect)
      : vec2(screenAspect / texAspect, 1.0);
    return (uv - 0.5) * s / zoom + 0.5;
  }

  // soft floating dust motes, drifting slowly upward
  float motes(vec2 uv, float t, float scale, float thresh) {
    vec2 p = uv * vec2(uRes.x / uRes.y, 1.0) * scale + vec2(0.0, -t * 0.018);
    vec2 cell = floor(p);
    float h = hash12(cell);
    vec2 pos = hash22(cell) * 0.6 + 0.2;
    float dist = length(fract(p) - pos);
    float twinkle = 0.55 + 0.45 * sin(t * (0.6 + h) + h * 6.2831);
    return smoothstep(0.16, 0.0, dist) * twinkle * step(thresh, h);
  }

  // sharp glints that twinkle in place
  float sparkle(vec2 uv, float t, float scale) {
    vec2 p = uv * vec2(uRes.x / uRes.y, 1.0) * scale;
    vec2 cell = floor(p);
    float h = hash12(cell);
    vec2 pos = hash22(cell) * 0.7 + 0.15;
    float dist = length(fract(p) - pos);
    float twinkle = pow(0.5 + 0.5 * sin(t * (1.5 + h * 2.0) + h * 6.2831), 6.0);
    return smoothstep(0.2, 0.0, dist) * twinkle * step(0.55, h);
  }

  vec3 renderPhoto(sampler2D tex, vec2 texRes, float effect, float drift,
                   vec2 suv, float t, float zoom, float e) {
    // per-photo dreamlike drift (clouds only), stronger once inside
    vec2 uv = suv + drift * (0.7 + 0.9 * e) * vec2(
      sin(suv.y * 7.0 + t * 0.35),
      cos(suv.x * 6.0 + t * 0.28)
    );
    vec2 tuv = coverUv(uv, texRes, zoom);

    // highway: heat shimmer confined to the horizon band
    if (effect > 2.5) {
      float band = exp(-pow((tuv.y - 0.42) * 7.0, 2.0));
      tuv.x += band * 0.0018 * sin(tuv.y * 240.0 + t * 2.2);
    }

    vec3 col = texture2D(tex, tuv).rgb;
    float lum = dot(col, vec3(0.299, 0.587, 0.114));

    if (effect < 0.5) {
      // clouds: drifting haze veil + a soft breathing sun
      float haze = fbm(tuv * 2.5 + vec2(t * 0.015, t * 0.008));
      col += (haze - 0.5) * 0.12;
      float sun = exp(-length(tuv - vec2(0.65, 0.85)) * 2.2)
        * (0.85 + 0.15 * sin(t * 0.2));
      col += vec3(1.0, 0.94, 0.82) * sun * 0.2;
    } else if (effect < 1.5) {
      // bamboo: god rays slanting through + floating dust motes
      vec2 rayDir = normalize(vec2(0.35, 1.0));
      float rayCoord = dot(suv, vec2(rayDir.y, -rayDir.x));
      float ray = vnoise(vec2(rayCoord * 14.0 - t * 0.12, 0.5));
      ray = pow(smoothstep(0.35, 0.95, ray), 2.0);
      float fade = smoothstep(0.0, 0.7, suv.y);
      col += vec3(1.0, 0.98, 0.85) * ray * fade * 0.18;
      float dust = motes(suv, t, 24.0, 0.78) + motes(suv, t, 46.0, 0.85);
      col += vec3(1.0, 0.98, 0.9) * dust * 0.35;
    } else if (effect < 2.5) {
      // pond: glints keyed to the bright green water + a slow roaming sheen;
      // the green-dominance key keeps sparkle off the rocks and the person
      float waterMask = smoothstep(0.3, 0.65, lum)
        * smoothstep(0.0, 0.08, col.g - max(col.r, col.b));
      float glint = sparkle(suv, t, 90.0);
      col += vec3(1.0, 0.98, 0.9) * glint * waterMask * 0.85;
      float sheenCoord = dot(tuv, normalize(vec2(0.3, 1.0)));
      float sheen = exp(-pow((sheenCoord - (0.45 + 0.18 * sin(t * 0.12))) * 6.0, 2.0));
      col += vec3(0.9, 1.0, 0.85) * sheen * waterMask * 0.1;
    } else {
      // highway: golden-hour bloom breathing over the bright sky
      float bloom = smoothstep(0.55, 0.85, lum) * (0.8 + 0.2 * sin(t * 0.1));
      col += vec3(1.0, 0.85, 0.62) * bloom * 0.1;
    }

    return col;
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

    // slight zoom as you enter the window
    float zoom = mix(1.0, 1.1, e);
    vec3 colA = renderPhoto(uTexA, uTexResA, uEffectA, uDriftA, vUv, uTime, zoom, e);
    vec3 colB = renderPhoto(uTexB, uTexResB, uEffectB, uDriftB, vUv, uTime, zoom, e);
    vec3 col = mix(colA, colB, uMix);

    // film grain
    float g = hash12(vUv * uRes + fract(uTime) * 100.0) - 0.5;
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

function textureSize(texture: THREE.Texture) {
  const img = texture.image as { width: number; height: number };
  return new THREE.Vector2(img.width, img.height);
}

/* Loads the photos, then mounts the scene; the DOM square stays white
   until the first textured frame can render. */
function SceneLoader({
  onReady,
  ...sceneProps
}: {
  squareRef: RefObject<HTMLDivElement | null>;
  chromeRef: RefObject<HTMLDivElement | null>;
  progressRef: MutableRefObject<ProgressState>;
  controllerRef: MutableRefObject<PhotoController | null>;
  onReady: () => void;
}) {
  const [textures, setTextures] = useState<THREE.Texture[] | null>(null);

  useEffect(() => {
    let alive = true;
    const loader = new THREE.TextureLoader();
    Promise.all(PHOTOS.map(({ src }) => loader.loadAsync(src))).then(
      (loaded) => {
        if (!alive) {
          loaded.forEach((t) => t.dispose());
          return;
        }
        loaded.forEach((t) => {
          t.colorSpace = THREE.SRGBColorSpace;
        });
        setTextures(loaded);
      },
    );
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => () => textures?.forEach((t) => t.dispose()), [textures]);

  if (!textures) return null;
  return <Scene {...sceneProps} textures={textures} onReady={onReady} />;
}

function Scene({
  squareRef,
  chromeRef,
  progressRef,
  controllerRef,
  textures,
  onReady,
}: {
  squareRef: RefObject<HTMLDivElement | null>;
  chromeRef: RefObject<HTMLDivElement | null>;
  progressRef: MutableRefObject<ProgressState>;
  controllerRef: MutableRefObject<PhotoController | null>;
  textures: THREE.Texture[];
  onReady: () => void;
}) {
  const size = useThree((s) => s.size);
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
      uTexResA: { value: textureSize(textures[0]) },
      uTexResB: { value: textureSize(textures[0]) },
      uEffectA: { value: PHOTOS[0].effect },
      uEffectB: { value: PHOTOS[0].effect },
      uDriftA: { value: PHOTOS[0].drift },
      uDriftB: { value: PHOTOS[0].drift },
    }),
    [textures],
  );

  useEffect(() => onReady(), [onReady]);

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

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    controllerRef.current = {
      go(dir) {
        const f = fade.current;
        if (f.active) return;
        f.index = (f.index + dir + textures.length) % textures.length;
        uniforms.uTexB.value = textures[f.index];
        uniforms.uTexResB.value.copy(textureSize(textures[f.index]));
        uniforms.uEffectB.value = PHOTOS[f.index].effect;
        uniforms.uDriftB.value = PHOTOS[f.index].drift;
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
        uniforms.uEffectA.value = uniforms.uEffectB.value;
        uniforms.uDriftA.value = uniforms.uDriftB.value;
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
  const [photosReady, setPhotosReady] = useState(false);
  const onPhotosReady = useCallback(() => setPhotosReady(true), []);

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
        <Canvas gl={{ alpha: true, antialias: true }} dpr={[1, 2]}>
          <SceneLoader
            squareRef={squareRef}
            chromeRef={chromeRef}
            progressRef={progressRef}
            controllerRef={controllerRef}
            onReady={onPhotosReady}
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
              style={{ background: photosReady ? "transparent" : "#ffffff" }}
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
