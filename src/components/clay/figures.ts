import * as THREE from "three";

/**
 * Figures the dough can be morphed into.
 *
 * Each is a signed distance function built from a few soft-blended
 * primitives — the way a figure is actually built from balls of clay — plus
 * the painted bits (eyes, a nose) that sit on it. Each is star-shaped from
 * its `centre`: every ray out from there leaves the figure exactly once,
 * which lets the lump's surface be carried onto the figure's by direction
 * alone, keeping neighbours neighbours.
 */

type Sdf = (x: number, y: number, z: number) => number;

export interface Decal {
  /** On or near the figure's surface; projected onto it. */
  at: [number, number, number];
  radius: number;
  color: string;
  /** Darken the clay by this much instead of painting it (0–1). */
  shade?: number;
}

/**
 * Folds too fine for the particle surface to hold as shape, drawn into the
 * surface texture instead: `count` ridges around the vertical axis, spiralling
 * by `twist` per unit of height, faded in above elevation `from` and out
 * again above `to` (elevations as sin of the angle above the horizon).
 */
export interface Ridges {
  count: number;
  amplitude: number;
  twist: number;
  from: number;
  to: number;
}

export interface Figure {
  key: string;
  label: string;
  sdf: Sdf | null;
  centre: [number, number, number];
  decals: Decal[];
  ridges?: Ridges;
  /**
   * Rounds of evening out the particles over the surface (default 2). A thin
   * feature fed by only a few of them can be evened out of existence; set 0.
   */
  relax?: number;
}

// --- Primitives (after Inigo Quilez) -----------------------------------------

const sphere =
  (cx: number, cy: number, cz: number, r: number): Sdf =>
  (x, y, z) =>
    Math.hypot(x - cx, y - cy, z - cz) - r;

const ellipsoid =
  (
    cx: number,
    cy: number,
    cz: number,
    rx: number,
    ry: number,
    rz: number,
  ): Sdf =>
  (x, y, z) => {
    const px = x - cx;
    const py = y - cy;
    const pz = z - cz;
    const k0 = Math.hypot(px / rx, py / ry, pz / rz);
    const k1 = Math.hypot(px / (rx * rx), py / (ry * ry), pz / (rz * rz));
    return (k0 * (k0 - 1)) / (k1 || 1e-9);
  };

/** A capsule whose radius tapers from r1 at a to r2 at b. */
const roundCone =
  (
    a: [number, number, number],
    b: [number, number, number],
    r1: number,
    r2: number,
  ): Sdf =>
  (x, y, z) => {
    const bax = b[0] - a[0];
    const bay = b[1] - a[1];
    const baz = b[2] - a[2];
    const l2 = bax * bax + bay * bay + baz * baz;
    const rr = r1 - r2;
    const a2 = l2 - rr * rr;
    const il2 = 1 / l2;
    const pax = x - a[0];
    const pay = y - a[1];
    const paz = z - a[2];
    const yv = pax * bax + pay * bay + paz * baz;
    const zv = yv - l2;
    const cx = pax * l2 - bax * yv;
    const cy = pay * l2 - bay * yv;
    const cz = paz * l2 - baz * yv;
    const x2 = cx * cx + cy * cy + cz * cz;
    const y2 = yv * yv * l2;
    const z2 = zv * zv * l2;
    const k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(zv) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
    if (Math.sign(yv) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
    return (Math.sqrt(x2 * a2 * il2) + yv * rr) * il2 - r1;
  };

/** A box with every edge rounded by r. */
const roundBox =
  (
    cx: number,
    cy: number,
    cz: number,
    bx: number,
    by: number,
    bz: number,
    r: number,
  ): Sdf =>
  (x, y, z) => {
    const qx = Math.abs(x - cx) - bx + r;
    const qy = Math.abs(y - cy) - by + r;
    const qz = Math.abs(z - cz) - bz + r;
    return (
      Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) +
      Math.min(Math.max(qx, Math.max(qy, qz)), 0) -
      r
    );
  };

/**
 * A solid of revolution about a vertical axis through (cx, cz): radius rb at
 * y0 widening (or narrowing) to rt at y1, flat-capped, edges rounded by r.
 */
const taperedCylinder =
  (
    cx: number,
    cz: number,
    y0: number,
    y1: number,
    rb: number,
    rt: number,
    r: number,
  ): Sdf =>
  (x, y, z) => {
    const radial = Math.hypot(x - cx, z - cz);
    const t = Math.min(Math.max((y - y0) / (y1 - y0), 0), 1);
    const slope = Math.cos(Math.atan2(rt - rb, y1 - y0));
    const side = (radial - (rb + (rt - rb) * t) + r) * slope;
    const cap = Math.max(y0 - y, y - y1) + r;
    return (
      Math.hypot(Math.max(side, 0), Math.max(cap, 0)) +
      Math.min(Math.max(side, cap), 0) -
      r
    );
  };

/** A cylinder along z, from z0 to z1, edges rounded by r. */
const lensCylinder =
  (
    cx: number,
    cy: number,
    z0: number,
    z1: number,
    radius: number,
    r: number,
  ): Sdf =>
  (x, y, z) => {
    const side = Math.hypot(x - cx, y - cy) - radius + r;
    const cap = Math.abs(z - (z0 + z1) / 2) - (z1 - z0) / 2 + r;
    return (
      Math.hypot(Math.max(side, 0), Math.max(cap, 0)) +
      Math.min(Math.max(side, cap), 0) -
      r
    );
  };

/** Five-pointed star in the xy plane, point up. */
function star2d(px: number, py: number, r: number, rf: number) {
  const k1x = 0.809016994375;
  const k1y = -0.587785252292;
  const k2x = -k1x;
  const k2y = k1y;
  let x = Math.abs(px);
  let y = py;
  let d = 2 * Math.max(k1x * x + k1y * y, 0);
  x -= d * k1x;
  y -= d * k1y;
  d = 2 * Math.max(k2x * x + k2y * y, 0);
  x -= d * k2x;
  y -= d * k2y;
  x = Math.abs(x);
  y -= r;
  const bax = rf * -k1y;
  const bay = rf * k1x - 1;
  const h = Math.min(
    Math.max((x * bax + y * bay) / (bax * bax + bay * bay), 0),
    r,
  );
  return Math.hypot(x - bax * h, y - bay * h) * Math.sign(y * bax - x * bay);
}

/** Polynomial smooth minimum: two lumps pressed together, seam smoothed. */
function blend(k: number, ...sdfs: Sdf[]): Sdf {
  return (x, y, z) => {
    let d = sdfs[0](x, y, z);
    for (let i = 1; i < sdfs.length; i++) {
      const b = sdfs[i](x, y, z);
      const h = Math.max(k - Math.abs(d - b), 0) / k;
      d = Math.min(d, b) - h * h * k * 0.25;
    }
    return d;
  };
}

/** Carves `cut` out of `base`, the edge of the cut rounded by k. */
function carve(k: number, base: Sdf, ...cuts: Sdf[]): Sdf {
  return (x, y, z) => {
    let d = base(x, y, z);
    for (const cut of cuts) {
      const b = -cut(x, y, z);
      const h = Math.max(k - Math.abs(d - b), 0) / k;
      d = Math.max(d, b) + h * h * k * 0.25;
    }
    return d;
  };
}

const INK = "#2e2622";

/**
 * A cup: tapered, its liquid just below the rim. One lump of clay can't
 * have a hole through it, so a handle is a solid ear, and the hole is a
 * shaded patch on it.
 */
const cupBody = taperedCylinder(0, 0, -0.62, 0.5, 0.6, 0.78, 0.1);
// The liquid's surface, a little below the rim.
const liquid = taperedCylinder(0, 0, 0.42, 0.9, 0.66, 0.66, 0.02);
const cup = carve(
  0.05,
  blend(0.2, cupBody, ellipsoid(0.9, -0.06, 0, 0.34, 0.42, 0.2)),
  liquid,
);
/** Matcha comes in a bowl-like cup with no handle. */
const handlelessCup = carve(0.05, cupBody, liquid);
const handleHole: Decal = {
  at: [0.98, -0.06, 0.2],
  radius: 0.13,
  color: "#000000",
  shade: 0.45,
};

export const FIGURES: Figure[] = [
  { key: "ball", label: "Ball", sdf: null, centre: [0, 0, 0], decals: [] },
  {
    key: "heart",
    label: "Heart",
    sdf: (x, y, z) => {
      // Puffed, not flat: thick in the middle, thinner towards the edges.
      const lobes = blend(
        0.25,
        roundCone([-0.42, 0.28, 0], [0, -0.78, 0], 0.55, 0.14),
        roundCone([0.42, 0.28, 0], [0, -0.78, 0], 0.55, 0.14),
      );
      return lobes(x, y, z * 1.55) / 1.3;
    },
    centre: [0, 0, 0],
    decals: [],
  },
  {
    key: "star",
    label: "Star",
    sdf: (x, y, z) => {
      const flat = star2d(x, y, 1.05, 0.48) - 0.12;
      const thickness = 0.36 - 0.14 * Math.hypot(x, y);
      const wx = flat;
      const wz = Math.abs(z) - thickness;
      return (
        Math.min(Math.max(wx, wz), 0) +
        Math.hypot(Math.max(wx, 0), Math.max(wz, 0)) -
        0.12
      );
    },
    centre: [0, 0, 0],
    decals: [
      { at: [-0.17, 0.1, 0.5], radius: 0.07, color: INK },
      { at: [0.17, 0.1, 0.5], radius: 0.07, color: INK },
      { at: [-0.32, -0.08, 0.45], radius: 0.08, color: "#f2879a" },
      { at: [0.32, -0.08, 0.45], radius: 0.08, color: "#f2879a" },
    ],
  },
  {
    key: "bear",
    label: "Bear",
    sdf: blend(
      0.16,
      ellipsoid(0, 0, 0, 0.92, 0.84, 0.86),
      sphere(-0.64, 0.66, -0.08, 0.32),
      sphere(0.64, 0.66, -0.08, 0.32),
      ellipsoid(0, -0.2, 0.7, 0.4, 0.3, 0.28),
    ),
    centre: [0, 0, 0],
    decals: [
      { at: [-0.34, 0.2, 0.9], radius: 0.085, color: INK },
      { at: [0.34, 0.2, 0.9], radius: 0.085, color: INK },
      { at: [0, -0.04, 1.0], radius: 0.11, color: INK },
    ],
  },
  {
    key: "snowman",
    label: "Snowman",
    sdf: blend(
      0.18,
      sphere(0, -0.42, 0, 0.82),
      sphere(0, 0.72, 0, 0.56),
      // The carrot: chunky enough that the dough can reach into it.
      roundCone([0, 0.68, 0.4], [0, 0.66, 0.86], 0.17, 0.09),
    ),
    centre: [0, 0.1, 0],
    relax: 0,
    decals: [
      { at: [-0.2, 0.88, 0.6], radius: 0.065, color: INK },
      { at: [0.2, 0.88, 0.6], radius: 0.065, color: INK },
      { at: [0, 0.66, 0.95], radius: 0.36, color: "#ef8a3a" },
      { at: [0, -0.05, 0.8], radius: 0.07, color: INK },
      { at: [0, -0.35, 0.85], radius: 0.07, color: INK },
    ],
  },
  {
    key: "camera",
    label: "Camera",
    sdf: blend(
      0.07,
      roundBox(0, 0, 0, 1.0, 0.62, 0.42, 0.22),
      lensCylinder(0, -0.04, 0.2, 0.82, 0.44, 0.08),
      // Shutter button, and the viewfinder's hump.
      taperedCylinder(0.56, 0, 0.5, 0.76, 0.15, 0.13, 0.05),
      roundBox(-0.46, 0.66, -0.04, 0.26, 0.14, 0.22, 0.08),
    ),
    centre: [0, 0, 0],
    decals: [
      // Later decals paint over earlier ones: ring, then glass, then glint.
      { at: [0, -0.04, 0.82], radius: 0.36, color: "#5d554f" },
      { at: [0, -0.04, 0.82], radius: 0.27, color: "#26303a" },
      { at: [0.09, 0.06, 0.82], radius: 0.07, color: "#dfe7f0" },
      { at: [0.56, 0.76, 0], radius: 0.12, color: "#e4553f" },
      { at: [-0.68, 0.36, 0.42], radius: 0.1, color: "#fff2cf" },
    ],
  },
  {
    key: "dumpling",
    label: "Dumpling",
    sdf: (() => {
      // A soft dome on a flat base, gathered up into a twisted knot.
      const dome = carve(
        0.12,
        ellipsoid(0, -0.12, 0, 1.02, 0.78, 1.02),
        roundBox(0, -1.5, 0, 2, 1, 2, 0),
      );
      const knot = blend(
        0.12,
        dome,
        roundCone([0, 0.42, 0], [0.07, 1.02, 0], 0.3, 0.09),
      );
      // Scalloped pleats in the silhouette, spiralling up to the knot.
      return (x: number, y: number, z: number) => {
        const angle = Math.atan2(z, x);
        // Pleats gather only on the upper half, spiralling into the knot.
        const rise = Math.min(Math.max((y + 0.05) / 0.6, 0), 1);
        return (
          knot(x, y, z) -
          0.06 * Math.cos(10 * angle + 4 * y) * rise * (1 - rise * 0.5)
        );
      };
    })(),
    centre: [0, -0.15, 0],
    decals: [],
    ridges: { count: 20, amplitude: 0.03, twist: 4, from: 0.1, to: 0.9 },
  },
  {
    key: "matcha",
    label: "Matcha",
    sdf: handlelessCup,
    centre: [0, -0.1, 0],
    decals: [
      { at: [0, 0.42, 0], radius: 0.6, color: "#8db35c" },
      // A swirl of paler foam.
      { at: [-0.12, 0.42, 0.08], radius: 0.3, color: "#b4cf86" },
      { at: [0.16, 0.42, -0.1], radius: 0.16, color: "#c4da9b" },
    ],
  },
  {
    key: "coffee",
    label: "Coffee",
    sdf: cup,
    centre: [0, -0.1, 0],
    decals: [
      { at: [0, 0.42, 0], radius: 0.6, color: "#6e4630" },
      // A latte heart: two lobes, tapering to a point toward the viewer.
      { at: [-0.15, 0.42, -0.1], radius: 0.17, color: "#f0e2cc" },
      { at: [0.15, 0.42, -0.1], radius: 0.17, color: "#f0e2cc" },
      { at: [0, 0.42, 0.06], radius: 0.14, color: "#f0e2cc" },
      { at: [0, 0.42, 0.2], radius: 0.07, color: "#f0e2cc" },
      { at: [0, 0.42, 0.28], radius: 0.035, color: "#f0e2cc" },
      handleHole,
    ],
  },
];

// --- Mapping the lump onto a figure ------------------------------------------

export interface FigureDecal {
  at: THREE.Vector3;
  radius: number;
  color: THREE.Color;
  shade: number;
}

export interface FigureTargets {
  /** Per particle, in figure space: base on y = 0, centred on the figure. */
  positions: Float32Array;
  /** Decals in the same figure space as `positions`. */
  decals: FigureDecal[];
  ridges: Ridges | null;
}

interface Lump {
  /** Rest positions of every particle; the surface ones come first. */
  rest: Float32Array;
  surfaceCount: number;
  shellIndex: ArrayLike<number>;
  /** Surface adjacency, flat, with per-particle start offsets. */
  neighbourStart: Int32Array;
  neighbours: Int32Array;
  restVolume: number;
}

/** How far out from `centre`, along unit `d`, the figure's surface lies. */
function reach(sdf: Sdf, c: number[], dx: number, dy: number, dz: number) {
  // Walk in from outside so the outermost surface is the one found.
  const step = 0.01;
  let t = 3;
  while (t > 0 && sdf(c[0] + dx * t, c[1] + dy * t, c[2] + dz * t) > 0)
    t -= step;
  let lo = Math.max(t, 0);
  let hi = t + step;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    if (sdf(c[0] + dx * mid, c[1] + dy * mid, c[2] + dz * mid) > 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/** Newton steps onto the zero level set. */
function project(sdf: Sdf, p: Float32Array | number[], k: number) {
  const e = 1e-3;
  for (let i = 0; i < 3; i++) {
    const x = p[k];
    const y = p[k + 1];
    const z = p[k + 2];
    const d = sdf(x, y, z);
    const gx = (sdf(x + e, y, z) - sdf(x - e, y, z)) / (2 * e);
    const gy = (sdf(x, y + e, z) - sdf(x, y - e, z)) / (2 * e);
    const gz = (sdf(x, y, z + e) - sdf(x, y, z - e)) / (2 * e);
    const g2 = gx * gx + gy * gy + gz * gz || 1;
    p[k] = x - (d * gx) / g2;
    p[k + 1] = y - (d * gy) / g2;
    p[k + 2] = z - (d * gz) / g2;
  }
}

function shellVolume(p: Float32Array, index: ArrayLike<number>) {
  let volume = 0;
  for (let t = 0; t < index.length; t += 3) {
    const a = index[t] * 3;
    const b = index[t + 1] * 3;
    const c = index[t + 2] * 3;
    volume +=
      p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) +
      p[a + 1] * (p[b + 2] * p[c] - p[b] * p[c + 2]) +
      p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c]);
  }
  return volume / 6;
}

export function figureTargets(figure: Figure, lump: Lump): FigureTargets {
  const { rest, surfaceCount, shellIndex, neighbourStart, neighbours } = lump;
  const count = rest.length / 3;
  const out = new Float32Array(count * 3);
  const c = figure.centre;
  const sdf = figure.sdf;

  if (!sdf) {
    out.set(rest);
  } else {
    // Surface: out along each particle's own direction to the figure's skin.
    for (let i = 0; i < surfaceCount; i++) {
      const k = i * 3;
      const l = Math.hypot(rest[k], rest[k + 1], rest[k + 2]) || 1;
      const dx = rest[k] / l;
      const dy = rest[k + 1] / l;
      const dz = rest[k + 2] / l;
      const r = reach(sdf, c, dx, dy, dz);
      out[k] = c[0] + dx * r;
      out[k + 1] = c[1] + dy * r;
      out[k + 2] = c[2] + dz * r;
    }

    // Projection by direction bunches particles where the figure bulges
    // towards the centre and thins them out on ears and points. A few
    // rounds of sliding each one towards its neighbours' middle, then back
    // onto the surface, evens that out without untangling anything. The
    // slide is along the surface only: its inward part would shave a thin
    // feature (a nose, a point) right off.
    const moved = new Float32Array(surfaceCount * 3);
    const e = 1e-3;
    for (let round = 0; round < (figure.relax ?? 2); round++) {
      for (let i = 0; i < surfaceCount; i++) {
        let ax = 0;
        let ay = 0;
        let az = 0;
        const from = neighbourStart[i];
        const to = neighbourStart[i + 1];
        for (let n = from; n < to; n++) {
          const m = neighbours[n] * 3;
          ax += out[m];
          ay += out[m + 1];
          az += out[m + 2];
        }
        const k = i * 3;
        const inv = 1 / (to - from);
        let mx = ax * inv - out[k];
        let my = ay * inv - out[k + 1];
        let mz = az * inv - out[k + 2];
        const px = out[k];
        const py = out[k + 1];
        const pz = out[k + 2];
        let nx = sdf(px + e, py, pz) - sdf(px - e, py, pz);
        let ny = sdf(px, py + e, pz) - sdf(px, py - e, pz);
        let nz = sdf(px, py, pz + e) - sdf(px, py, pz - e);
        const nl = Math.hypot(nx, ny, nz) || 1;
        nx /= nl;
        ny /= nl;
        nz /= nl;
        const along = mx * nx + my * ny + mz * nz;
        mx -= along * nx;
        my -= along * ny;
        mz -= along * nz;
        moved[k] = px + mx * 0.35;
        moved[k + 1] = py + my * 0.35;
        moved[k + 2] = pz + mz * 0.35;
      }
      for (let k = 0; k < surfaceCount * 3; k += 3) project(sdf, moved, k);
      out.set(moved);
    }

    // Inside: the same direction, the same fraction of the way out.
    for (let i = surfaceCount; i < count; i++) {
      const k = i * 3;
      const l = Math.hypot(rest[k], rest[k + 1], rest[k + 2]);
      if (l < 1e-6) {
        out[k] = c[0];
        out[k + 1] = c[1];
        out[k + 2] = c[2];
        continue;
      }
      const r = reach(sdf, c, rest[k] / l, rest[k + 1] / l, rest[k + 2] / l);
      out[k] = c[0] + (rest[k] / l) * r * l;
      out[k + 1] = c[1] + (rest[k + 1] / l) * r * l;
      out[k + 2] = c[2] + (rest[k + 2] / l) * r * l;
    }
  }

  // Decals sit on the figure's surface, wherever they were written.
  const decalPoints = figure.decals.map((decal) => {
    const at = [...decal.at];
    if (sdf) project(sdf, at, 0);
    return at;
  });

  // Same volume as the lump — it's the same clay.
  const scale = Math.cbrt(lump.restVolume / shellVolume(out, shellIndex));
  let minY = Infinity;
  for (let k = 0; k < count * 3; k += 3) {
    out[k] = (out[k] - c[0]) * scale;
    out[k + 1] = (out[k + 1] - c[1]) * scale;
    out[k + 2] = (out[k + 2] - c[2]) * scale;
    minY = Math.min(minY, out[k + 1]);
  }
  for (let k = 1; k < count * 3; k += 3) out[k] -= minY;

  return {
    positions: out,
    ridges: figure.ridges ?? null,
    decals: figure.decals.map((decal, i) => ({
      at: new THREE.Vector3(
        (decalPoints[i][0] - c[0]) * scale,
        (decalPoints[i][1] - c[1]) * scale - minY,
        (decalPoints[i][2] - c[2]) * scale,
      ),
      radius: decal.radius * scale,
      color: new THREE.Color(decal.color),
      shade: decal.shade ?? 0,
    })),
  };
}
