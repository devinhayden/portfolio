/**
 * WebGL2 port of Figma's "Lens distortion" effect (lateral chromatic mode),
 * applied to the window of color that follows the draggable hero card.
 *
 * Pass 1 composites the effect's input — the color photo (blurred, dimmed)
 * inside a white rounded border — into a framebuffer, matching what the
 * shader sees in Figma. Pass 2 runs the lens math from Figma's WGSL source.
 */

export type LensParams = {
  distortionStrength: number;
  aberrationStrength: number;
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
};

const BORDER_WIDTH = 6;
const OUTER_RADIUS = 12;
const BLUR_RADIUS = 2;
const DIM = 0.5;
const SAMPLE_SPREAD = 1.4;

const VERTEX = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  // Top-left origin, matching Figma's pixel-space conventions.
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const COMPOSITE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uImage;
uniform vec2 uImageSize;
uniform vec2 uViewport;
uniform vec2 uWinPos;
uniform vec2 uWinSize;
uniform float uDpr;

const float BORDER = ${BORDER_WIDTH.toFixed(1)};
const float RADIUS = ${OUTER_RADIUS.toFixed(1)};
const float BLUR = ${BLUR_RADIUS.toFixed(1)};
const float DIM = ${DIM.toFixed(3)};

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
vec2 coverUv(vec2 page) {
  float scale = max(uViewport.x / uImageSize.x, uViewport.y / uImageSize.y);
  vec2 drawn = uImageSize * scale;
  return (page - (uViewport - drawn) * 0.5) / drawn;
}

void main() {
  vec2 local = vUv * uWinSize;
  vec2 p = local - uWinSize * 0.5;
  float outer = sdRoundBox(p, uWinSize * 0.5, RADIUS);
  float inner = sdRoundBox(p, uWinSize * 0.5 - BORDER, RADIUS - BORDER);
  float outerAlpha = clamp(0.5 - outer * uDpr, 0.0, 1.0);
  float innerMix = clamp(0.5 - inner * uDpr, 0.0, 1.0);

  vec2 page = uWinPos + local;
  vec3 photo = texture(uImage, coverUv(page)).rgb;
  for (int i = 0; i < 12; i++) {
    photo += texture(uImage, coverUv(page + DISK[i] * BLUR)).rgb;
  }
  photo = photo / 13.0 * DIM;

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
  const k = kernelData(params.quality, params.aberrationStrength);
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

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const program = gl.createProgram()!;
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ] as const) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) ?? "Shader compile failed");
    }
    gl.attachShader(program, shader);
  }
  gl.bindAttribLocation(program, 0, "aPos");
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "Program link failed");
  }
  return program;
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

  const composite = compile(gl, VERTEX, COMPOSITE);
  const lens = compile(gl, VERTEX, lensShader(params));

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const photo = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, photo);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

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
      gl.bindTexture(gl.TEXTURE_2D, inputTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    gl.viewport(0, 0, w, h);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.useProgram(composite);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, photo);
    gl.uniform1i(u(composite, "uImage"), 0);
    gl.uniform2f(u(composite, "uImageSize"), image.naturalWidth, image.naturalHeight);
    gl.uniform2f(u(composite, "uViewport"), frame.viewportWidth, frame.viewportHeight);
    gl.uniform2f(u(composite, "uWinPos"), frame.x, frame.y);
    gl.uniform2f(u(composite, "uWinSize"), frame.width, frame.height);
    gl.uniform1f(u(composite, "uDpr"), dpr);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(lens);
    gl.bindTexture(gl.TEXTURE_2D, inputTex);
    gl.uniform1i(u(lens, "uInput"), 0);
    gl.uniform2f(u(lens, "uDims"), w, h);
    gl.uniform2f(u(lens, "uCenter"), w * 0.5, h * 0.5);
    gl.uniform1f(u(lens, "uRadius"), Math.hypot(w, h) * 0.5);
    gl.uniform1f(u(lens, "uDistortion"), params.distortionStrength);
    gl.uniform1f(u(lens, "uAberration"), params.aberrationStrength);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function dispose() {
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  }

  return { render, dispose };
}
