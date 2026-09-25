/**
 * Draws the channel change over the background photo while the carousel
 * swaps it, then gets out of the way.
 *
 * It borrows the lens window's own vocabulary — barrel distortion and lateral
 * chromatic aberration, pulsed over the swap — so the glitch reads as the same
 * optics losing their grip rather than as a separate effect. The page is
 * grayscale at rest, so colour is held back to the burst: the signal breaking
 * up is what lets it through.
 */

import { GLITCH_GLSL } from "@/components/glitch";
import {
  VERTEX,
  compileProgram,
  createQuad,
  uploadPhoto,
} from "@/components/webgl";

export type TransitionFrame = {
  /** 0 shows the outgoing photo, 1 the incoming one. */
  progress: number;
  seed: number;
  width: number;
  height: number;
};

/** Peak barrel distortion, a little over the window's resting 0.12. */
const DISTORT = 0.16;
/** Peak colour split, well past the window's 0.06, since it is brief. */
const ABERRATION = 0.22;
const SNOW = 0.42;
/** Snow is lighter where the picture held together. */
const SNOW_INTACT = 0.35;
/** Full-frame passes are costly; the noise hides the missing resolution. */
const MAX_DPR = 1.5;

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform vec2 uFromSize;
uniform vec2 uToSize;
uniform vec2 uViewport;
uniform float uProgress;
uniform float uSeed;

${GLITCH_GLSL}

const float DISTORT = ${DISTORT.toFixed(3)};
const float ABERRATION = ${ABERRATION.toFixed(3)};
const float SNOW = ${SNOW.toFixed(3)};
const float SNOW_INTACT = ${SNOW_INTACT.toFixed(3)};

vec2 coverUv(vec2 page, vec2 imageSize) {
  float scale = max(uViewport.x / imageSize.x, uViewport.y / imageSize.y);
  vec2 drawn = imageSize * scale;
  return (page - (uViewport - drawn) * 0.5) / drawn;
}

// The same radial pinch the lens window runs, about the frame's centre.
vec2 barrel(vec2 page, float amount) {
  vec2 centre = uViewport * 0.5;
  vec2 offset = page - centre;
  vec2 norm = offset / (length(uViewport) * 0.5);
  float dist2 = dot(norm, norm);
  return centre + offset * (1.0 + amount * (dist2 + dist2 * dist2));
}

vec3 photoAt(vec2 page, float amount, float cut) {
  vec2 p = barrel(glitchDisplace(page, uViewport, uProgress, uSeed), amount);
  return mix(
    texture(uFrom, coverUv(p, uFromSize)).rgb,
    texture(uTo, coverUv(p, uToSize)).rgb,
    cut
  );
}

void main() {
  vec2 page = vUv * uViewport;
  float burst = glitchBurst(uProgress);
  float band = glitchBand(page, uViewport);
  float cut = glitchCut(band, uProgress, uSeed);

  float amount = DISTORT * burst;
  float chroma = (1.0 + abs(amount)) * ABERRATION * burst;

  // Split the channels the way the window does: same distortion, shifted.
  vec3 color = vec3(
    photoAt(page, amount + chroma * 0.5, cut).r,
    photoAt(page, amount, cut).g,
    photoAt(page, amount - chroma * 0.5, cut).b
  );

  float snow = glitchHash(gl_FragCoord.xy + uSeed);
  float torn = mix(SNOW_INTACT, 1.0, glitchTorn(band, uSeed));
  color = mix(color, vec3(snow), SNOW * burst * torn);

  // Grey at rest so this matches the photo underneath exactly; colour only
  // while the signal is broken.
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  outColor = vec4(mix(vec3(luma), color, burst), 1.0);
}`;

export function createPhotoTransition(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: false });
  if (!gl) return null;

  const program = compileProgram(gl, VERTEX, FRAGMENT);
  const quad = createQuad(gl);

  const from = { texture: gl.createTexture()!, width: 1, height: 1 };
  const to = { texture: gl.createTexture()!, width: 1, height: 1 };

  const u = (name: string) => gl.getUniformLocation(program, name);
  let size = { w: 0, h: 0 };

  function setPhotos(outgoing: HTMLImageElement, incoming: HTMLImageElement) {
    if (!gl) return;
    for (const [slot, source] of [
      [from, outgoing],
      [to, incoming],
    ] as const) {
      uploadPhoto(gl, slot.texture, source);
      slot.width = source.naturalWidth;
      slot.height = source.naturalHeight;
    }
  }

  function render(frame: TransitionFrame) {
    if (!gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const w = Math.max(1, Math.round(frame.width * dpr));
    const h = Math.max(1, Math.round(frame.height * dpr));
    if (w !== size.w || h !== size.h) {
      size = { w, h };
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);

    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, from.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, to.texture);
    gl.uniform1i(u("uFrom"), 0);
    gl.uniform1i(u("uTo"), 1);
    gl.uniform2f(u("uFromSize"), from.width, from.height);
    gl.uniform2f(u("uToSize"), to.width, to.height);
    gl.uniform2f(u("uViewport"), frame.width, frame.height);
    gl.uniform1f(u("uProgress"), frame.progress);
    gl.uniform1f(u("uSeed"), frame.seed);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function dispose() {
    if (!gl) return;
    gl.deleteProgram(program);
    gl.deleteBuffer(quad);
    gl.deleteTexture(from.texture);
    gl.deleteTexture(to.texture);
  }

  return { setPhotos, render, dispose };
}
