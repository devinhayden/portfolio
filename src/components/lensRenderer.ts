/**
 * WebGL2 port of Figma's "Lens distortion" effect (lateral chromatic mode),
 * applied to the window of color that follows the draggable hero card.
 *
 * Pass 1 composites the effect's input — the color photo (blurred, dimmed)
 * inside a white rounded border — into a framebuffer, matching what the
 * shader sees in Figma. Pass 2 runs the lens math from Figma's WGSL source.
 *
 * Two photos are kept on the GPU at once so the window can change photo along
 * with the background. The change itself is the shared channel-change tear, in
 * page space, so a rip runs straight through the window instead of stopping at
 * its border — the border stays crisp while the picture inside it breaks up.
 */

import { GLITCH_GLSL } from "@/components/glitch";
import {
  VERTEX,
  compileProgram,
  createQuad,
  uploadPhoto,
} from "@/components/webgl";

export type LensParams = {
  /** Distortion on the optical axis — the middle of the screen. */
  minDistortion: number;
  /** Distortion at full field height, the furthest the window can be dragged. */
  maxDistortion: number;
  /** Lateral chromatic aberration is zero on-axis in a real lens, so this is low. */
  minAberration: number;
  /**
   * Aberration at full field height. Kept under 0.08: past that Figma's effect
   * doubles its kernel, and the window redraws on every frame of a drag.
   */
  maxAberration: number;
  /**
   * How far the distortion centre is pulled toward the middle of the screen at
   * full field, as a share of the window's half-size. This is what makes the
   * warp asymmetric off-axis — the edge facing away from the centre bows most.
   */
  axisPull: number;
  /** Figma quality select: 0 = high, 1 = medium, 2 = low. */
  quality: number;
};

export type LensFrame = {
  /** Window's top-left corner in viewport CSS px. */
  x: number;
  y: number;
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
  /** 0 shows the current photo, 1 the one the carousel picked. */
  mix: number;
  /** Ties this window's tear to the one running across the background. */
  glitchSeed: number;
};

/** Smallest travel, as a share of the viewport, that counts as full field. */
const MIN_REACH = 0.15;

const BORDER_WIDTH = 6;
const OUTER_RADIUS = 12;
const BLUR_RADIUS = 2;
const DIM = 0.5;
const SAMPLE_SPREAD = 1.4;

const COMPOSITE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uImage;
uniform sampler2D uNextImage;
uniform vec2 uImageSize;
uniform vec2 uNextImageSize;
uniform float uMix;
uniform float uGlitchSeed;
uniform vec2 uViewport;
uniform vec2 uWinPos;
uniform vec2 uWinSize;
uniform float uDpr;

const float BORDER = ${BORDER_WIDTH.toFixed(1)};
const float RADIUS = ${OUTER_RADIUS.toFixed(1)};
const float BLUR = ${BLUR_RADIUS.toFixed(1)};
const float DIM = ${DIM.toFixed(3)};

${GLITCH_GLSL}

const vec2 DISK[12] = vec2[12](
  vec2(-0.326, -0.406), vec2(-0.840, -0.074), vec2(-0.696, 0.457),
  vec2(-0.203, 0.621), vec2(0.962, -0.195), vec2(0.473, -0.480),
  vec2(0.519, 0.767), vec2(0.185, -0.893), vec2(0.507, 0.064),
  vec2(0.896, 0.412), vec2(-0.322, -0.933), vec2(-0.792, -0.598)
);

float sdRoundBox(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Maps a viewport point to the photo's UV under object-fit: cover.
vec2 coverUv(vec2 page, vec2 imageSize) {
  float scale = max(uViewport.x / imageSize.x, uViewport.y / imageSize.y);
  vec2 drawn = imageSize * scale;
  return (page - (uViewport - drawn) * 0.5) / drawn;
}

vec3 blurredPhoto(sampler2D image, vec2 imageSize, vec2 page) {
  vec3 sum = texture(image, coverUv(page, imageSize)).rgb;
  for (int i = 0; i < 12; i++) {
    sum += texture(image, coverUv(page + DISK[i] * BLUR, imageSize)).rgb;
  }
  return sum / 13.0;
}

void main() {
  vec2 local = vUv * uWinSize;
  vec2 p = local - uWinSize * 0.5;
  float outer = sdRoundBox(p, uWinSize * 0.5, RADIUS);
  float inner = sdRoundBox(p, uWinSize * 0.5 - BORDER, RADIUS - BORDER);
  float outerAlpha = clamp(0.5 - outer * uDpr, 0.0, 1.0);
  float innerMix = clamp(0.5 - inner * uDpr, 0.0, 1.0);

  vec2 page = uWinPos + local;
  vec3 photo;
  if (uMix > 0.0) {
    // Page space, so the bands line up with the ones tearing the background
    // and a rip carries straight through the window.
    vec2 torn = glitchDisplace(page, uViewport, uMix, uGlitchSeed);
    float cut = glitchCut(glitchBand(page, uViewport), uMix, uGlitchSeed);
    photo = mix(
      blurredPhoto(uImage, uImageSize, torn),
      blurredPhoto(uNextImage, uNextImageSize, torn),
      cut
    );
  } else {
    photo = blurredPhoto(uImage, uImageSize, page);
  }
  photo *= DIM;

  vec3 color = mix(vec3(1.0), photo, innerMix);
  outColor = vec4(color * outerAlpha, outerAlpha);
}`;

function kernelData(quality: number, aberrationStrength: number) {
  let bucket = 4;
  if (aberrationStrength <= 0.001) bucket = 0;
  else if (aberrationStrength < 0.08) bucket = 1;
  else if (aberrationStrength < 0.18) bucket = 2;
  else if (aberrationStrength < 0.35) bucket = 3;
  const kernelScale = [0, 0.25, 0.5, 0.75, 1][bucket];
  const baseKernelSize = 64 / (quality + 1);
  const kernelSize =
    kernelScale === 0 ? 3 : Math.max(3, baseKernelSize * kernelScale);
  const taps = Math.ceil(kernelSize);
  const invKernelSize = 1 / Math.max(kernelSize - 1, 1);
  let weightSum = 0;
  for (let i = 0; i < taps; i += 1) {
    const fi = i * invKernelSize - 0.5;
    weightSum += 1 - Math.abs(fi * 2);
  }
  return { bucket, taps, invKernelSize, weightSum };
}

function lensShader(params: LensParams) {
  // Sized for the strongest aberration the window can reach, so the kernel
  // stays valid across the whole field.
  const k = kernelData(params.quality, params.maxAberration);
  return `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uInput;
uniform vec2 uDims;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uDistortion;
uniform float uAberration;

const int KERNEL_TAPS = ${k.taps};
const float INV_KERNEL_SIZE = ${k.invKernelSize.toFixed(9)};
const float KERNEL_WEIGHT_SUM = ${k.weightSum.toFixed(9)};
const int ABERRATION_BUCKET = ${k.bucket};
const float SPREAD = ${SAMPLE_SPREAD.toFixed(2)};

const vec2 JITTER[4] = vec2[4](
  vec2(0.0, 0.0),
  vec2(0.5, -0.333333),
  vec2(-0.25, 0.333333),
  vec2(0.25, -0.111111)
);

vec4 sampleInput(vec2 localPos) {
  vec2 uv = localPos / uDims;
  bool inBounds = uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0;
  vec2 clamped = clamp(uv, 0.0, 1.0);
  // Framebuffer rows run bottom-up; local space is top-down.
  vec4 col = texture(uInput, vec2(clamped.x, 1.0 - clamped.y));
  return inBounds ? col : vec4(0.0);
}

vec2 lensDistort(vec2 localPos, float amount) {
  vec2 centered = localPos - uCenter;
  vec2 norm = centered / uRadius;
  float dist2 = dot(norm, norm);
  return centered * (1.0 + amount * (dist2 + dist2 * dist2)) + uCenter;
}

vec4 distorted(vec2 localPos, float amount) {
  return sampleInput(lensDistort(localPos, amount));
}

vec3 unpremult(vec4 s) {
  return s.a > 0.01 ? s.rgb / max(0.001, s.a) : vec3(1.0);
}

void main() {
  vec2 localPos = vUv * max(uDims, vec2(1.0));
  float amount = uDistortion;
  float chroma = (1.0 + abs(amount)) * uAberration;

  vec4 accum = vec4(0.0);
  for (int j = 0; j < 4; j++) {
    vec2 tapPos = localPos + JITTER[j] * SPREAD;

    if (ABERRATION_BUCKET == 0) {
      vec4 s = distorted(tapPos, amount);
      accum += vec4(unpremult(s) * s.a, s.a);
      continue;
    }

    vec4 tap = vec4(0.0);
    for (int i = 0; i < KERNEL_TAPS; i++) {
      float fi = float(i) * INV_KERNEL_SIZE - 0.5;
      float window = 1.0 - abs(fi * 2.0);
      vec4 r = distorted(tapPos, amount + (fi + 0.5) * chroma);
      vec4 g = distorted(tapPos, amount + fi * chroma);
      vec4 b = distorted(tapPos, amount + (fi - 0.5) * chroma);
      float alpha = max(max(r.a, g.a), b.a);
      vec3 rgb = vec3(unpremult(r).r, unpremult(g).g, unpremult(b).b);
      tap += vec4(rgb * alpha, alpha) * window;
    }
    accum += tap / max(KERNEL_WEIGHT_SUM, 0.0001);
  }

  outColor = accum / 4.0;
}`;
}

export function createLensRenderer(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  params: LensParams,
) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
  });
  if (!gl) return null;

  const composite = compileProgram(gl, VERTEX, COMPOSITE);
  const lens = compileProgram(gl, VERTEX, lensShader(params));
  const quad = createQuad(gl);

  // `current` is what the window shows; `next` is what the carousel picked.
  // Both start on the same photo so the second slot is always complete.
  const slot = (source: HTMLImageElement) => {
    const texture = gl.createTexture()!;
    uploadPhoto(gl, texture, source);
    return {
      texture,
      width: source.naturalWidth,
      height: source.naturalHeight,
    };
  };
  let current = slot(image);
  let next = slot(image);

  const inputTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, inputTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    inputTex,
    0,
  );

  const u = (program: WebGLProgram, name: string) =>
    gl.getUniformLocation(program, name);
  let size = { w: 0, h: 0 };

  function render(frame: LensFrame) {
    if (!gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(frame.width * dpr));
    const h = Math.max(1, Math.round(frame.height * dpr));
    if (w !== size.w || h !== size.h) {
      size = { w, h };
      canvas.width = w;
      canvas.height = h;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, inputTex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        w,
        h,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
    }
    gl.viewport(0, 0, w, h);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.useProgram(composite);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, current.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, next.texture);
    gl.uniform1i(u(composite, "uImage"), 0);
    gl.uniform1i(u(composite, "uNextImage"), 1);
    gl.uniform2f(u(composite, "uImageSize"), current.width, current.height);
    gl.uniform2f(u(composite, "uNextImageSize"), next.width, next.height);
    gl.uniform1f(u(composite, "uMix"), frame.mix);
    gl.uniform1f(u(composite, "uGlitchSeed"), frame.glitchSeed);
    gl.uniform2f(
      u(composite, "uViewport"),
      frame.viewportWidth,
      frame.viewportHeight,
    );
    gl.uniform2f(u(composite, "uWinPos"), frame.x, frame.y);
    gl.uniform2f(u(composite, "uWinSize"), frame.width, frame.height);
    gl.uniform1f(u(composite, "uDpr"), dpr);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(lens);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTex);
    gl.uniform1i(u(lens, "uInput"), 0);
    // Field height: 0 with the window centred on the screen, 1 once it has
    // been dragged as far as it goes in any direction. Normalising per axis
    // means an edge counts as full field, not just a corner.
    // Floored, because on a phone the window nearly fills the screen: without
    // this its tiny reach would count a 16px nudge as full field height, when
    // in truth it has barely left the axis.
    const reachX = Math.max(
      (frame.viewportWidth - frame.width) / 2,
      frame.viewportWidth * MIN_REACH,
    );
    const reachY = Math.max(
      (frame.viewportHeight - frame.height) / 2,
      frame.viewportHeight * MIN_REACH,
    );
    const offX = (frame.x + frame.width / 2 - frame.viewportWidth / 2) / reachX;
    const offY =
      (frame.y + frame.height / 2 - frame.viewportHeight / 2) / reachY;
    const field = Math.min(1, Math.hypot(offX, offY));

    // Distortion climbs with the square of field height, the way it does in a
    // real lens: flat and square through the middle, bowing near the edges.
    const falloff = field * field;
    const lerp = (min: number, max: number) => min + (max - min) * falloff;

    // Off-axis, the centre of the distortion sits toward the screen's middle.
    const toward = field > 0.0001 ? params.axisPull * field : 0;
    const centerX =
      w * 0.5 - (offX / Math.max(field, 0.0001)) * toward * w * 0.5;
    const centerY =
      h * 0.5 - (offY / Math.max(field, 0.0001)) * toward * h * 0.5;

    gl.uniform2f(u(lens, "uDims"), w, h);
    gl.uniform2f(u(lens, "uCenter"), centerX, centerY);
    gl.uniform1f(u(lens, "uRadius"), Math.hypot(w, h) * 0.5);
    gl.uniform1f(
      u(lens, "uDistortion"),
      lerp(params.minDistortion, params.maxDistortion),
    );
    gl.uniform1f(
      u(lens, "uAberration"),
      lerp(params.minAberration, params.maxAberration),
    );
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  /** Uploads the photo that `mix` fades towards. */
  function setNextPhoto(source: HTMLImageElement) {
    if (!gl) return;
    uploadPhoto(gl, next.texture, source);
    next.width = source.naturalWidth;
    next.height = source.naturalHeight;
  }

  /** Makes the faded-to photo the current one, so `mix` can return to 0. */
  function promotePhoto() {
    [current, next] = [next, current];
  }

  // Frees resources but keeps the context alive: a remount (Strict Mode,
  // Fast Refresh) gets the same context back from this canvas.
  function dispose() {
    if (!gl) return;
    gl.deleteProgram(composite);
    gl.deleteProgram(lens);
    gl.deleteBuffer(quad);
    gl.deleteTexture(current.texture);
    gl.deleteTexture(next.texture);
    gl.deleteTexture(inputTex);
    gl.deleteFramebuffer(framebuffer);
  }

  return { render, setNextPhoto, promotePhoto, dispose };
}
