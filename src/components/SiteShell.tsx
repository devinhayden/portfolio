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
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PeekWindowContext } from "./peek-window-context";

/* Per-photo treatment: `effect` selects the shader's light pass, `drift`
   is the dreamlike uv-warp amount (only the clouds want it), and `tint`
   is the ambient page-background wash while that photo is showing - a
   faint echo of its mood, close enough to the base cream that it reads
   as light spilling from the window rather than a color change. */
const PHOTOS = [
  { src: "/photos/1.jpg", effect: 0, drift: 0.02, tint: "#ecece9" }, // clouds, cool
  { src: "/photos/2.jpg", effect: 1, drift: 0, tint: "#edece2" }, // bamboo, sage
  { src: "/photos/4.jpg", effect: 3, drift: 0, tint: "#f2ebdd" }, // highway, gold
];
const BASE_BACKGROUND = "#f3eee5";

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
  uniform vec2 uParallax;  // smoothed cursor position, -1..1
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
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p *= 2.03; // lacunarity
      a *= 0.5;  // gain
    }
    return v;
  }

  // cheap 2-octave fbm for building the warp field below; the warp only
  // needs to be soft and large-scale, not detailed
  float fbm2(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 2; i++) {
      v += a * vnoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  // domain warping (Quilez): feed fbm's own output back in as a coordinate
  // offset, twice, producing the swirling/marbled look plain fbm can't —
  // this is what turns "noisy" into "atmospheric"
  float warpedFbm(vec2 p, float t) {
    vec2 q = vec2(fbm2(p), fbm2(p + vec2(5.2, 1.3)));
    vec2 r = vec2(
      fbm2(p + 2.0 * q + vec2(1.7, 9.2) + t * 0.015),
      fbm2(p + 2.0 * q + vec2(8.3, 2.8) + t * 0.02)
    );
    return fbm(p + 2.5 * r);
  }

  // crepuscular rays: a converging fan of light shafts below a light
  // source, drifting slowly sideways; computed in photo space so the
  // rays stick to the scene
  float lightShafts(vec2 uv, vec2 lightPos, float t, float freq, float soft) {
    float denom = max(lightPos.y - uv.y, 0.1);
    float fan = (uv.x - lightPos.x) / denom;
    float n = fbm(vec2(fan * freq + t * 0.05, uv.y * 1.2));
    float shaft = smoothstep(soft, 0.95, n);
    float fall = exp(-max(lightPos.y - uv.y, 0.0) * 0.85);
    return shaft * fall;
  }

  vec2 coverUv(vec2 uv, vec2 texRes, float zoom) {
    float screenAspect = uRes.x / uRes.y;
    float texAspect = texRes.x / texRes.y;
    vec2 s = screenAspect > texAspect
      ? vec2(1.0, texAspect / screenAspect)
      : vec2(screenAspect / texAspect, 1.0);
    return (uv - 0.5) * s / zoom + 0.5;
  }

  // Worley/cellular F1 search: nearest feature point across the 3x3
  // neighborhood, not just the current cell. A naive "one random point
  // per cell" scatter (what we had before) betrays its grid at a glance;
  // searching neighbors lets points cluster and space irregularly like
  // real dust or glints while keeping the same O(1) cost per pixel.
  vec3 worley(vec2 p) {
    vec2 cell = floor(p);
    vec2 local = fract(p);
    float minDist = 8.0;
    float h = 0.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 offset = vec2(float(x), float(y));
        vec2 point = hash22(cell + offset);
        float dist = length(offset + point - local);
        if (dist < minDist) {
          minDist = dist;
          h = hash12(cell + offset);
        }
      }
    }
    return vec3(minDist, h, 0.0);
  }

  // fine dust motes, rising slowly while swaying on a shared soft current;
  // pinpricks, not bokeh
  float motes(vec2 uv, float t, float scale, float thresh) {
    vec2 sway = vec2(
      sin(uv.y * 2.6 + t * 0.24),
      cos(uv.x * 2.1 + t * 0.19)
    ) * 0.16;
    vec2 p = (uv + sway) * vec2(uRes.x / uRes.y, 1.0) * scale + vec2(0.0, -t * 0.012);
    vec3 w = worley(p);
    float h = w.y;
    float twinkle = 0.55 + 0.45 * sin(t * (0.6 + h) + h * 6.2831);
    return smoothstep(0.09, 0.0, w.x) * twinkle * step(thresh, h);
  }

  // glints that twinkle in place, varied in size and rhythm
  float sparkle(vec2 uv, float t, float scale) {
    vec2 p = uv * vec2(uRes.x / uRes.y, 1.0) * scale;
    vec3 w = worley(p);
    float h = w.y;
    float twinkle = pow(0.5 + 0.5 * sin(t * (1.2 + h * 2.5) + h * 6.2831), 3.0);
    float radius = 0.16 + 0.22 * h;
    return smoothstep(radius, 0.0, w.x) * twinkle * step(0.4, h);
  }

  // --- pond water surface: raymarched-style height field --------------
  // Stylized adaptation of the layered ridge-fold octave technique used in
  // raymarched ocean shaders (each octave sums two drifting, ridge-folded
  // sine fields and shears the domain before the next octave, so the chop
  // reads as natural rather than a repeating grid). We don't have a real
  // camera/scene to raymarch against here — this stands in for the height
  // field a raymarcher would step through to find the water surface.
  float waveRidge(vec2 uv) {
    vec2 wv = 1.0 - abs(sin(uv));
    vec2 swv = abs(cos(uv));
    wv = mix(wv, swv, wv);
    return pow(1.0 - pow(wv.x * wv.y, 0.65), 3.0);
  }

  float waterHeight(vec2 p, float t) {
    mat2 shear = mat2(1.5, 1.1, -1.1, 1.5);
    float freq = 2.6;
    float amp = 0.55;
    float h = 0.0;
    vec2 uv = p;
    for (int i = 0; i < 2; i++) {
      float d = waveRidge((uv + t) * freq) + waveRidge((uv - t) * freq);
      h += d * amp;
      uv = shear * uv;
      freq *= 1.8;
      amp *= 0.22;
    }
    return h;
  }

  // normal from finite differences of the height field, reusing the
  // already-computed center height to halve the redundant sampling
  vec3 waterNormal(vec2 p, float t, float h) {
    float eps = 0.12;
    float hx = waterHeight(p + vec2(eps, 0.0), t);
    float hy = waterHeight(p + vec2(0.0, eps), t);
    return normalize(vec3(h - hx, eps * 1.5, h - hy));
  }

  // caustic light-net: two ridge-fold fields counter-scrolling at
  // different speeds and scales, combined with min() so only their
  // intersections stay bright. A single scrolling noise field just reads
  // as a wobbling blob of brightness; real (and most convincing procedural)
  // caustics come from two interfering patterns - the net of thin bright
  // curves is the intersections, not either pattern alone.
  float causticNet(vec2 p, float t) {
    vec2 uv1 = p * 13.0 + vec2(t * 0.55, -t * 0.35);
    vec2 uv2 = p * 17.0 + vec2(-t * 0.4, t * 0.5);
    float c1 = waveRidge(uv1);
    float c2 = waveRidge(uv2);
    return min(c1, c2);
  }

  // frequency-modulated halftone: the dot grid's spacing (not just each
  // dot's radius) is driven by amount, so the screen itself breathes
  // denser and sparser with the underlying signal, like an engraving
  // reacting to light rather than a fixed-pitch print screen
  float fmHalftone(vec2 uv, float amount, float baseFreq, float modAmount) {
    float freq = baseFreq + amount * modAmount;
    vec2 g = uv * freq;
    vec2 cell = fract(g) - 0.5;
    float d = length(cell);
    float radius = 0.2 + amount * 0.22;
    return smoothstep(radius, radius - 0.14, d);
  }

  vec3 renderPhoto(sampler2D tex, vec2 texRes, float effect, float drift,
                   vec2 suv, float t, float zoom, float e) {
    // per-photo dreamlike drift (clouds only), stronger once inside;
    // lower frequency reads as a broad, sweeping sway rather than jitter
    vec2 uv = suv + drift * (0.7 + 0.9 * e) * vec2(
      sin(suv.y * 3.5 + t * 0.16),
      cos(suv.x * 3.0 + t * 0.13)
    );
    vec2 tuv = coverUv(uv, texRes, zoom);

    // highway: faint heat shimmer hugging the horizon
    if (effect > 2.5) {
      float band = exp(-pow((tuv.y - 0.44) * 10.0, 2.0));
      tuv.x += band * 0.0005 * sin(tuv.y * 150.0 + t * 1.3);
    }

    vec3 col = texture2D(tex, tuv).rgb;
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    float breathe = 0.85 + 0.15 * sin(t * 0.19);

    if (effect < 0.5) {
      // clouds: traveling light + drifting mist veils + breathing sun + grade
      float sweep = fbm(tuv * 1.6 + vec2(t * 0.022, t * 0.008));
      col *= 0.92 + 0.18 * sweep;
      float mist = warpedFbm(tuv * 2.2 - vec2(t * 0.012, t * 0.016), t);
      col += vec3(0.9, 0.93, 1.0) * smoothstep(0.45, 0.85, mist) * 0.22;
      float glow = exp(-length(tuv - vec2(0.7, 0.95)) * 1.7) * breathe;
      col += vec3(1.0, 0.93, 0.78) * glow * 0.38;
      col += vec3(1.0, 0.9, 0.7) * pow(lum, 2.0) * glow * 0.35;
      col = mix(col, col * vec3(0.96, 1.0, 1.07), (1.0 - lum) * 0.25);
    } else if (effect < 1.5) {
      // bamboo: volumetric shafts + canopy halation + fine motes + green grade
      // light source sits off-frame past the top-right corner so the fan of
      // shafts reads as a consistent diagonal sweep down toward the bottom-left;
      // it also wanders slowly in a small loop so the shaft angle drifts
      // gently, like leaves stirring in the canopy above
      vec2 bambooLight = vec2(1.5, 1.45)
        + vec2(sin(t * 0.06) * 0.09, cos(t * 0.045) * 0.05);
      float rays = lightShafts(tuv, bambooLight, t, 9.0, 0.45);
      col += vec3(1.0, 0.97, 0.8) * rays * 0.4 * breathe;
      col += vec3(1.0, 0.98, 0.85) * pow(lum, 3.0) * 0.3;
      float dust = motes(suv, t, 60.0, 0.82) + motes(suv, t, 110.0, 0.86);
      col += vec3(1.0, 0.98, 0.9) * dust * 0.22;
      col = mix(col, col * vec3(0.93, 1.05, 0.9), 0.22);
    } else if (effect < 2.5) {
      // pond: raymarched-style wave field drives specular glints, post-
      // processed into discrete sparkle points, and textured with a
      // frequency-modulated halftone screen; a geometric mask (below)
      // holds it all to the water
      // rays kept soft and faint here - the raymarched water field below
      // carries this photo's visual interest, rays are just ambience
      float rays = lightShafts(tuv, vec2(0.8, 1.2), t, 4.5, 0.25);
      col += vec3(1.0, 0.93, 0.7) * rays * 0.16 * breathe;
      // color keying kept leaking onto warm, low-blue surfaces (rock, skin,
      // the person's shirt) no matter how the thresholds were tuned - this
      // photo's water sits in a fixed, known region of the frame, so an
      // untextured elliptical mask in photo space isolates it far more
      // reliably than any color heuristic
      vec2 waterCenter = vec2(0.4, 0.56);
      vec2 waterRadius = vec2(0.55, 0.25);
      float waterDist = length((tuv - waterCenter) / waterRadius);
      float waterMask = smoothstep(1.3, 0.7, waterDist);

      vec2 wp = suv * vec2(uRes.x / uRes.y, 1.0) * 3.4;
      float wt = t * 0.3;
      float wh = waterHeight(wp, wt);
      vec3 wn = waterNormal(wp, wt, wh);
      vec3 lightDir = normalize(vec3(0.4, 0.7, 0.45));
      float spec = pow(max(dot(wn, normalize(lightDir + vec3(0.0, 0.0, 1.0))), 0.0), 55.0);

      // caustic light-net replaces the old flat brightness shimmer: sample
      // three slightly offset copies so the bright veins fringe red/blue
      // like light dispersing through water, instead of a flat white net.
      // Gated by the photo's own local brightness so caustics stay near
      // the water's already-sunlit patches rather than floating uniformly
      // over shadowed water too.
      float causticG = pow(causticNet(wp, wt), 1.8);
      float causticR = pow(causticNet(wp + vec2(0.006, 0.0), wt), 1.8);
      float causticB = pow(causticNet(wp - vec2(0.006, 0.0), wt), 1.8);
      vec3 caustic = vec3(causticR, causticG, causticB);
      float causticGate = smoothstep(0.04, 0.35, lum);
      col += caustic * vec3(0.85, 1.0, 0.9) * 0.3 * waterMask * causticGate;

      // post-process the raw specular field into discrete twinkling points
      // by gating the Worley glint field with the raymarched sparkle response
      // instead of letting either drive brightness alone
      float glint = sparkle(suv, t, 70.0) * smoothstep(0.1, 0.7, spec * 4.0);
      col += vec3(1.0, 0.98, 0.9) * glint * waterMask * 1.6;

      // frequency-modulated halftone screen, densest where the light catches
      float halftone = fmHalftone(wp, spec, 55.0, 90.0);
      col += vec3(0.85, 1.0, 0.9) * halftone * spec * waterMask * 0.9;

      col += vec3(1.0, 0.97, 0.85) * pow(lum, 3.0) * 0.22;
      col = mix(col, col * vec3(0.94, 1.04, 0.94), 0.2);
    } else {
      // highway: golden horizon glow + drifting cloud-shadow bands + floating
      // sunlit dust + sky grade
      float horizonGlow = exp(-pow((tuv.y - 0.46) * 3.0, 2.0));
      col += vec3(1.0, 0.82, 0.55) * horizonGlow * 0.2 * breathe;
      float ground = smoothstep(0.55, 0.35, tuv.y);
      // large, slow-drifting shadow bands crossing the hills, like cloud
      // shadow moving over open ground on a breezy day
      float sweep = fbm(tuv * vec2(1.1, 1.6) + vec2(t * 0.05, t * 0.008));
      col *= 1.0 + (sweep - 0.5) * 0.3 * ground;
      float sky = smoothstep(0.42, 0.6, tuv.y);
      col = mix(col, col * vec3(1.09, 0.99, 0.87), sky * 0.45);
      col += vec3(1.0, 0.9, 0.7) * pow(lum, 3.0) * 0.2;
      // fine sunlit dust drifting across the golden-hour air
      float dust = motes(suv, t, 40.0, 0.85) + motes(suv, t, 80.0, 0.9);
      col += vec3(1.0, 0.88, 0.62) * dust * 0.32;
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
    // cursor parallax: the photo drifts a couple percent opposite the
    // cursor, like looking through a pane of glass at a scene behind it.
    // Only a sampling-coordinate offset (not a mask change), and it fades
    // out by the time the window is half open - a resting-state detail,
    // not something that should fight the immersive full-screen view.
    vec2 parallax = uParallax * 0.02 * (1.0 - smoothstep(0.0, 0.5, e));
    vec2 puv = vUv + parallax;
    // uMix is a uniform (not per-pixel), so this branch is coherent across
    // the whole draw call: outside the brief crossfade window we skip the
    // second photo's full effect stack entirely rather than paying for it
    // and discarding it via mix().
    vec3 col;
    if (uMix > 0.001) {
      vec3 colA = renderPhoto(uTexA, uTexResA, uEffectA, uDriftA, puv, uTime, zoom, e);
      vec3 colB = renderPhoto(uTexB, uTexResB, uEffectB, uDriftB, puv, uTime, zoom, e);
      col = mix(colA, colB, uMix);
    } else {
      col = renderPhoto(uTexA, uTexResA, uEffectA, uDriftA, puv, uTime, zoom, e);
    }

    // inner recessed edge: an even inset shadow around the whole perimeter
    // seats the photo in a well with real depth. The darkening keys off sd
    // (distance to the nearest wall, equal on all four sides) so every edge
    // reads the same, rather than pooling in one corner. A whisper of
    // directional shading (upper-left key) adds realism without biasing the
    // depth toward any side. Tied to the mask geometry so it tracks through
    // the scroll; holds at full strength through the middle of the
    // transition and only recedes in the last stretch as the photo
    // approaches full-screen, where there's no frame left to recess.
    float frameFade = 1.0 - smoothstep(0.55, 0.9, e);
    if (frameFade > 0.001) {
      float bevelWidth = min(halfSize.x, halfSize.y) * 0.18;
      float edge = smoothstep(-bevelWidth, 0.0, sd); // 1 at edge, 0 inside
      float ao = edge * frameFade;
      col *= 1.0 - ao * 0.30;                    // even inset shadow, all sides
      vec2 wallProx = smoothstep(-bevelWidth, 0.0, d);
      vec2 n = normalize(sign(p - center) * wallProx * wallProx + 1e-5);
      float lit = dot(n, normalize(vec2(-0.7, 1.0)));
      col += ao * 0.05 * lit;                    // subtle, symmetric light cue
    }

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
type ParallaxState = { tx: number; ty: number; x: number; y: number };

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
  progressRef: MutableRefObject<ProgressState>;
  controllerRef: MutableRefObject<PhotoController | null>;
  parallaxRef: MutableRefObject<ParallaxState>;
  onPhotoChange: (index: number) => void;
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
  progressRef,
  controllerRef,
  parallaxRef,
  onPhotoChange,
  textures,
  onReady,
}: {
  squareRef: RefObject<HTMLDivElement | null>;
  progressRef: MutableRefObject<ProgressState>;
  controllerRef: MutableRefObject<PhotoController | null>;
  parallaxRef: MutableRefObject<ParallaxState>;
  onPhotoChange: (index: number) => void;
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
      uParallax: { value: new THREE.Vector2(0, 0) },
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
        onPhotoChange(f.index);
      },
    };
    return () => {
      controllerRef.current = null;
    };
  }, [controllerRef, textures, uniforms, onPhotoChange]);

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

    const px = parallaxRef.current;
    px.x += (px.tx - px.x) * Math.min(1, delta * 4);
    px.y += (px.ty - px.y) * Math.min(1, delta * 4);
    uniforms.uParallax.value.set(px.x, px.y);

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
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
];

export default function SiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const squareRef = useRef<HTMLDivElement>(null);
  const homeChromeRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<PhotoController | null>(null);
  const progressRef = useRef<ProgressState>({
    target: 0,
    current: 0,
    lastInput: 0,
  });
  const parallaxRef = useRef<ParallaxState>({ tx: 0, ty: 0, x: 0, y: 0 });
  const [photosReady, setPhotosReady] = useState(false);
  const onPhotosReady = useCallback(() => setPhotosReady(true), []);
  const [activePhoto, setActivePhoto] = useState(0);
  const onPhotoChange = useCallback((index: number) => setActivePhoto(index), []);

  const goToPhoto = useCallback((dir: 1 | -1) => {
    controllerRef.current?.go(dir);
  }, []);

  // Footer and the Home page's own content (label/arrows/square/tagline)
  // both fade out together as you scroll into the window, reading the
  // live progress value directly each frame - separate from Scene's
  // useFrame (which only runs shader uniform updates) since these are
  // plain DOM nodes, not part of the R3F tree.
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const opacity = 1 - smooth01(progressRef.current.current / CHROME_FADE_END);
      const pointerEvents = opacity < 0.4 ? "none" : "auto";
      if (footerRef.current) {
        footerRef.current.style.opacity = opacity.toFixed(3);
        footerRef.current.style.pointerEvents = pointerEvents;
      }
      if (homeChromeRef.current) {
        homeChromeRef.current.style.opacity = opacity.toFixed(3);
        homeChromeRef.current.style.pointerEvents = pointerEvents;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // reset to a clean rest state whenever leaving home, so returning always
  // shows the window closed rather than mid-scroll
  useEffect(() => {
    if (!isHome) {
      const p = progressRef.current;
      p.target = 0;
      p.current = 0;
    }
  }, [isHome]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const px = parallaxRef.current;
      px.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      px.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  useEffect(() => {
    if (!isHome) return;
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
  }, [isHome]);

  const contextValue = useMemo(
    () => ({ squareRef, homeChromeRef, photosReady, goToPhoto }),
    [photosReady, goToPhoto],
  );

  return (
    <PeekWindowContext.Provider value={contextValue}>
      <div
        className="h-screen overflow-hidden text-foreground transition-colors duration-[1200ms] ease-out"
        style={{ backgroundColor: isHome ? PHOTOS[activePhoto].tint : BASE_BACKGROUND }}
      >
        {/* Paper-grain texture over the page fill only. Sits at z-0 below
            the canvas (z-10); the opaque photo window covers it, so the
            texture never touches the images themselves. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 opacity-20 mix-blend-multiply"
          style={{
            backgroundImage: "url(/texture.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* The canvas stays mounted across every route - unmounting and
            remounting it would re-fetch and re-decode all four photo
            textures and reinit the WebGL context on every nav. Only its
            opacity toggles, so it's an instant, free show/hide. */}
        <div
          className="fixed inset-0 z-10 transition-opacity duration-500 ease-out"
          style={{
            opacity: isHome ? 1 : 0,
            pointerEvents: isHome ? "auto" : "none",
          }}
        >
          <Canvas gl={{ alpha: true, antialias: true }} dpr={[1, 2]}>
            <SceneLoader
              squareRef={squareRef}
              progressRef={progressRef}
              controllerRef={controllerRef}
              parallaxRef={parallaxRef}
              onPhotoChange={onPhotoChange}
              onReady={onPhotosReady}
            />
          </Canvas>
        </div>

        <div className="relative z-20 flex h-full flex-col">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex flex-1 flex-col"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          <footer
            ref={footerRef}
            className="flex items-center justify-center gap-20 pb-14 font-serif text-sm text-neutral-500"
          >
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "text-foreground underline underline-offset-4 decoration-neutral-400"
                      : "transition-colors hover:text-neutral-800"
                  }
                >
                  {label}
                </Link>
              );
            })}
          </footer>
        </div>
      </div>
    </PeekWindowContext.Provider>
  );
}
