/**
 * Regularized Kelvinlets (de Goes & James, "Regularized Kelvinlets:
 * Sculpting Brushes based on Fundamental Solutions of Elasticity", 2017).
 *
 * Each brush is the closed-form displacement an elastic solid makes around a
 * smeared-out load, so a pull drags the neighbourhood along and a dent
 * bulges the clay around it — without any mesh connectivity, solver or
 * time step. Everything here is bi-scale (the difference of two radii),
 * which decays as 1/r³ instead of 1/r: the brush stays local, the way a
 * fingertip does, instead of nudging the whole lump.
 */

/** Shear modulus is folded into the brush strength, so only ν matters. */
const NU = 0.48;
const A = 1 / (4 * Math.PI);
const B = A / (4 * (1 - NU));
/** Outer radius as a multiple of the inner one. */
const SCALE_RATIO = 1.8;

/** Displacement at the brush centre per unit load, for the bi-scale pair. */
const centreGain = (eps: number) =>
  (1.5 * A - B) * (1 / eps - 1 / (eps * SCALE_RATIO));

const out = new Float64Array(3);

/** Bi-scale Kelvinlet at offset r for load f; result in `out`. */
function grabKernel(
  rx: number,
  ry: number,
  rz: number,
  fx: number,
  fy: number,
  fz: number,
  eps: number,
) {
  const r2 = rx * rx + ry * ry + rz * rz;
  const rf = rx * fx + ry * fy + rz * fz;
  let s = 0;
  let t = 0;
  for (let k = 0; k < 2; k++) {
    const e = k === 0 ? eps : eps * SCALE_RATIO;
    const sign = k === 0 ? 1 : -1;
    const re = Math.sqrt(r2 + e * e);
    const re3 = re * re * re;
    s += sign * ((A - B) / re + (A * e * e) / (2 * re3));
    t += sign * (B / re3);
  }
  out[0] = s * fx + t * rf * rx;
  out[1] = s * fy + t * rf * ry;
  out[2] = s * fz + t * rf * rz;
}

/**
 * Pulls the clay so the point at `c` moves by `d` exactly, and its
 * surroundings follow elastically.
 */
export function grab(
  p: Float32Array,
  cx: number,
  cy: number,
  cz: number,
  dx: number,
  dy: number,
  dz: number,
  eps: number,
) {
  const g = 1 / centreGain(eps);
  const fx = dx * g;
  const fy = dy * g;
  const fz = dz * g;
  const reach2 = (eps * 9) ** 2;
  for (let i = 0; i < p.length; i += 3) {
    const rx = p[i] - cx;
    const ry = p[i + 1] - cy;
    const rz = p[i + 2] - cz;
    if (rx * rx + ry * ry + rz * rz > reach2) continue;
    grabKernel(rx, ry, rz, fx, fy, fz, eps);
    p[i] += out[0];
    p[i + 1] += out[1];
    p[i + 2] += out[2];
  }
}

/**
 * The affine brushes (twist, squash) are force dipoles: the derivative of
 * the grab kernel along each axis, weighted by a column of the load matrix.
 * Taken numerically so there is one kernel to trust rather than three.
 */
function affineKernel(
  rx: number,
  ry: number,
  rz: number,
  F: ArrayLike<number>,
  eps: number,
  acc: Float64Array,
) {
  const h = eps * 0.02;
  acc[0] = acc[1] = acc[2] = 0;
  for (let j = 0; j < 3; j++) {
    // Column j of the row-major 3×3.
    const fx = F[j];
    const fy = F[3 + j];
    const fz = F[6 + j];
    const ox = j === 0 ? h : 0;
    const oy = j === 1 ? h : 0;
    const oz = j === 2 ? h : 0;
    grabKernel(rx + ox, ry + oy, rz + oz, fx, fy, fz, eps);
    const px = out[0];
    const py = out[1];
    const pz = out[2];
    grabKernel(rx - ox, ry - oy, rz - oz, fx, fy, fz, eps);
    acc[0] -= (px - out[0]) / (2 * h);
    acc[1] -= (py - out[1]) / (2 * h);
    acc[2] -= (pz - out[2]) / (2 * h);
  }
}

const acc = new Float64Array(3);
const gainCache = new Map<string, number>();

/**
 * How strongly the dipole field strains the clay right at the centre, for a
 * unit load of the given kind. Isotropy means this is a single number per
 * kind and radius, so it is measured once and reused.
 */
function affineGain(kind: "twist" | "squash", eps: number) {
  const key = `${kind}:${eps}`;
  const cached = gainCache.get(key);
  if (cached !== undefined) return cached;
  const d = eps * 1e-3;
  let gain: number;
  if (kind === "twist") {
    // Unit rotation about z: (0,0,1) × (d,0,0) = (0,d,0).
    affineKernel(d, 0, 0, [0, -1, 0, 1, 0, 0, 0, 0, 0], eps, acc);
    gain = acc[1] / d;
  } else {
    // Unit squash along y: diag(½, −1, ½).
    affineKernel(0, d, 0, [0.5, 0, 0, 0, -1, 0, 0, 0, 0.5], eps, acc);
    gain = acc[1] / -d;
  }
  gainCache.set(key, gain);
  return gain;
}

function applyAffine(
  p: Float32Array,
  cx: number,
  cy: number,
  cz: number,
  F: number[],
  eps: number,
) {
  const reach2 = (eps * 7) ** 2;
  for (let i = 0; i < p.length; i += 3) {
    const rx = p[i] - cx;
    const ry = p[i + 1] - cy;
    const rz = p[i + 2] - cz;
    if (rx * rx + ry * ry + rz * rz > reach2) continue;
    affineKernel(rx, ry, rz, F, eps, acc);
    p[i] += acc[0];
    p[i + 1] += acc[1];
    p[i + 2] += acc[2];
  }
}

/** Twists the clay by `angle` radians about unit axis n through c. */
export function twist(
  p: Float32Array,
  cx: number,
  cy: number,
  cz: number,
  nx: number,
  ny: number,
  nz: number,
  angle: number,
  eps: number,
) {
  const k = angle / affineGain("twist", eps);
  // Row-major skew(n): F·v = n × v.
  applyAffine(
    p,
    cx,
    cy,
    cz,
    [0, -nz * k, ny * k, nz * k, 0, -nx * k, -ny * k, nx * k, 0],
    eps,
  );
}

/**
 * Squashes the clay along unit axis u by `strain` (0.1 = 10% shorter),
 * spreading it out sideways by half that, so volume is kept.
 */
export function squash(
  p: Float32Array,
  cx: number,
  cy: number,
  cz: number,
  ux: number,
  uy: number,
  uz: number,
  strain: number,
  eps: number,
) {
  const k = strain / affineGain("squash", eps);
  // ½I − 3/2·uuᵀ: −1 along u, +½ across it, traceless.
  const F = [
    0.5 - 1.5 * ux * ux,
    -1.5 * ux * uy,
    -1.5 * ux * uz,
    -1.5 * uy * ux,
    0.5 - 1.5 * uy * uy,
    -1.5 * uy * uz,
    -1.5 * uz * ux,
    -1.5 * uz * uy,
    0.5 - 1.5 * uz * uz,
  ].map((v) => v * k);
  applyAffine(p, cx, cy, cz, F, eps);
}
