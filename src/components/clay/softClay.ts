import * as THREE from "three";

import {
  type ClayEngine,
  createDoubleTap,
  createStage,
  FLOOR_Y,
  lumpGeometry,
  prefersReducedMotion,
  type StageOptions,
} from "@/components/clay/clayStage";
import {
  FIGURES,
  type FigureTargets,
  figureTargets,
} from "@/components/clay/figures";
import {
  addSurfaceDetail,
  createCurvature,
  toCavity,
} from "@/components/clay/clayMaterial";

/**
 * Prototype B — a soft body you can throw.
 *
 * Meshless shape matching (Müller et al. 2005) with plasticity: the lump is
 * ~800 particles, grouped into overlapping clusters that each try to keep
 * their own rest shape, rotating rigidly to match. Overlap is what lets the
 * lump bend locally instead of only as a whole. When a cluster is strained
 * past its yield point, its rest shape creeps toward the strained one — so
 * a hard throw or a press leaves a mark, and a gentle one springs back.
 *
 * Each cluster's goal blends its best rotation with its best linear fit
 * (stretch and shear allowed, volume kept) — the "mush". Pure rotation
 * reads as rubber and too much give reads as pizza dough; clay wants a
 * little.
 *
 * Rotations come from Müller et al. 2016 ("A Robust Method to Extract the
 * Rotational Part of Deformations"), warm-started per cluster each step.
 * A global volume constraint keeps it clay: a dent bulges out elsewhere.
 *
 * Morphing into a figure rewrites the clusters' rest shapes, easing them
 * from the shape the clay is in now to the figure's, while a pull toward
 * the figure's pose keeps it upright and in place. The clay squishes its way
 * there under its own physics, and once there it is just clay again: the
 * figure is its new rest shape, held lightly in pose until it is touched.
 *
 * What you see is a separate, much finer mesh, carried by the particle
 * surface: each of its vertices is pinned to a coarse triangle by
 * barycentric weights plus a height along the interpolated normal, which
 * rebuilds the round surface the flat triangles would otherwise cut across.
 */

const STEP = 1 / 120;
const MAX_STEPS = 4;
const ITERATIONS = 2;
const AIR_DRAG = 0.4;
const FRICTION = 0.45;
const MAX_SPEED = 20;
const VOLUME_STIFFNESS = 0.6;

const GRAB_RADIUS = 0.45;
const GRAB_STIFFNESS = 0.3;
/**
 * How far the held patch may pull out ahead of where it is, in lump radii.
 * Past it, a drag carries the whole lump with the hand rather than drawing
 * the patch out further: clay held firmly moves, it doesn't turn to taffy.
 */
const STRETCH_LIMIT = 0.8;
/**
 * How much of the overshoot the lump makes up per iteration. Under one, the
 * body trails the hand a little on a fast drag instead of being towed
 * rigidly, which is what makes it read as soft.
 */
const CARRY = 0.12;
const PRESS_DELAY = 140;
const PRESS_SPEED = 0.6;
const PRESS_DEPTH = 0.5;
/** A press is a round fingertip pushed in, not a patch moved rigidly. */
const FINGER_RADIUS = 0.32;
/** A smash is a flat palm brought down to this share of the lump's height. */
const SMASH_TO = 0.55;
const SMASH_TIME = 0.18;
const SMASH_HOLD = 0.06;
/**
 * The flattest a smash will leave it, floor to top. Each smash takes a share
 * of the current height, so without a floor repeated smashes thin the clay
 * toward nothing, and the surface folds through itself.
 */
const MIN_THICKNESS = 0.7;

/** Untouched this long, any motion left is damped out… */
const SETTLE_AFTER = 2;
const SETTLE_DAMPING = 3;
/** …and once it's this still for this long, the simulation sleeps. */
const SLEEP_SPEED = 0.02;
const SLEEP_AFTER = 0.5;

/** How long a morph takes to ease the rest shape across. */
const MORPH_TIME = 0.9;
/** Pull toward the figure's pose: peak during a morph, and while presenting. */
const MORPH_PULL = 0.2;
const POSE_HOLD = 0.02;

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** How high it drops in from when the page opens. */
const DROP = 2.2;

/** Cluster seeds sit on a shell this far out; each takes particles within reach. */
const SEED_SHELL = 0.62;
const CLUSTER_RADIUS = 0.7;
/** And on an inner ring, so the middle of the lump is as mushy as its skin. */
const INNER_SEED_SHELL = 0.25;
const INNER_CLUSTER_RADIUS = 0.65;

export interface SoftClayOptions extends StageOptions {
  /** Called whenever someone takes hold of the clay itself. */
  onTouch?: () => void;
}

export function createSoftClay(
  canvas: HTMLCanvasElement,
  color: string,
  { onTouch, ...stageOptions }: SoftClayOptions = {},
): ClayEngine {
  const stage = createStage(canvas, color, stageOptions);
  const reduceMotion = prefersReducedMotion();

  const params = {
    // Clay, not dough: firm enough to hold its shape and resist being drawn
    // out, but quick to yield and keep a dent once it's pushed hard enough.
    stiffness: 0.56,
    /** How much each cluster may stretch and shear instead of only turning. */
    mush: 0.3,
    yieldAt: 0.03,
    creep: 0.3,
    /** Relaxes creases the particle surface is too coarse to draw cleanly. */
    smoothing: 0.08,
    gravity: 18,
  };

  // --- Particles: a coarse surface, an inner shell, and a core. -----------

  const shell = lumpGeometry(9);
  const shellIndex = shell.getIndex()!.array as ArrayLike<number>;
  const shellRest = shell.getAttribute("position").array as Float32Array;
  const shellRestNormals = shell.getAttribute("normal").array as Float32Array;
  const surfaceCount = shellRest.length / 3;

  const inner = lumpGeometry(2, 0.55);
  const innerRest = inner.getAttribute("position").array as Float32Array;

  const count = surfaceCount + innerRest.length / 3 + 1;
  const rest = new Float32Array(count * 3);
  rest.set(shellRest, 0);
  rest.set(innerRest, shellRest.length);
  // The last particle is the core, at the origin.

  const x = new Float32Array(count * 3);
  const p = new Float32Array(count * 3);
  const v = new Float32Array(count * 3);
  const correction = new Float32Array(count * 3);
  const shares = new Uint8Array(count);

  const triangleCount = shellIndex.length / 3;
  /** Each surface particle's neighbours along the shell, as a flat list. */
  const neighbourStart = new Int32Array(surfaceCount + 1);
  const neighbours = (() => {
    const sets = Array.from({ length: surfaceCount }, () => new Set<number>());
    for (let t = 0; t < triangleCount; t++) {
      const a = shellIndex[t * 3];
      const b = shellIndex[t * 3 + 1];
      const c = shellIndex[t * 3 + 2];
      sets[a].add(b).add(c);
      sets[b].add(a).add(c);
      sets[c].add(a).add(b);
    }
    const flat: number[] = [];
    sets.forEach((set, i) => {
      neighbourStart[i] = flat.length;
      flat.push(...set);
    });
    neighbourStart[surfaceCount] = flat.length;
    return Int32Array.from(flat);
  })();
  const smoothed = new Float32Array(surfaceCount * 3);
  const restVolume = volumeOf(rest);
  const volumeGrad = new Float32Array(surfaceCount * 3);
  const surfaceNormals = new Float32Array(surfaceCount * 3);

  // --- Clusters --------------------------------------------------------------

  // Seeds as [x, y, z, reach]: an outer shell, an inner ring, the core.
  const seeds: number[] = [];
  for (const [detail, shellRadius, reach] of [
    [2, SEED_SHELL, CLUSTER_RADIUS],
    [0, INNER_SEED_SHELL, INNER_CLUSTER_RADIUS],
  ]) {
    const seedGeometry = lumpGeometry(detail, shellRadius, false);
    const at = seedGeometry.getAttribute("position").array as Float32Array;
    for (let i = 0; i < at.length; i += 3)
      seeds.push(at[i], at[i + 1], at[i + 2], reach);
    seedGeometry.dispose();
  }
  seeds.push(0, 0, 0, 0.6);
  const seedCount = seeds.length / 4;
  const clusterStart = new Int32Array(seedCount + 1);
  const memberList: number[] = [];
  for (let c = 0; c < seedCount; c++) {
    clusterStart[c] = memberList.length;
    const [sx, sy, sz, reach] = seeds.slice(c * 4, c * 4 + 4);
    for (let i = 0; i < count; i++) {
      const d = Math.hypot(
        rest[i * 3] - sx,
        rest[i * 3 + 1] - sy,
        rest[i * 3 + 2] - sz,
      );
      if (d < reach) memberList.push(i);
    }
  }
  clusterStart[seedCount] = memberList.length;
  const members = Int32Array.from(memberList);
  /** Each membership's rest offset from its cluster's centre. Plastic. */
  const restOffsets = new Float32Array(members.length * 3);
  const rotations = new Float64Array(seedCount * 4);

  // --- The visible mesh, embedded in the particle surface. ------------------

  const skin = lumpGeometry(30);
  const skinPosition = skin.getAttribute("position") as THREE.BufferAttribute;
  skinPosition.setUsage(THREE.DynamicDrawUsage);
  const skinCount = skinPosition.count;
  const skinDetail = addSurfaceDetail(skin);
  // Creases are measured on the particle surface, where the clay actually
  // bends, and carried up to the skin.
  const shellCurvature = createCurvature(shellIndex, surfaceCount);
  const shellCavity = new Float32Array(surfaceCount);
  const shellCavityRest = new Float32Array(surfaceCount);
  const unitNormals = new Float32Array(surfaceCount * 3);
  shellCurvature.compute(shellRest, shellRestNormals, shellCavityRest);
  const skinTriangle = new Int32Array(skinCount);
  const skinWeights = new Float32Array(skinCount * 2);
  const skinHeight = new Float32Array(skinCount);
  embedSkin(skinPosition.array as Float32Array);

  const mesh = new THREE.Mesh(skin, stage.material);
  mesh.castShadow = true;
  stage.scene.add(mesh);

  // --- State -----------------------------------------------------------------

  type Grab = {
    indices: Int32Array;
    weights: Float32Array;
    offsets: Float32Array;
    anchor: THREE.Vector3;
    target: THREE.Vector3;
    normal: THREE.Vector3;
    downX: number;
    downY: number;
    downAt: number;
    pressed: number;
    moved: boolean;
    /** Where the fingerprint goes, should this turn into a press. */
    print: THREE.Vector3;
  };
  let grabbed: Grab | null = null;
  let hover: PointerEvent | null = null;
  let accumulator = 0;
  /** Seconds since anyone last did anything to the clay. */
  let idle = 0;
  /** Seconds the clay has been all but motionless. */
  let still = 0;
  /**
   * Asleep, nothing is simulated at all. Clay at rest stays exactly where it
   * is — no slow roll, no creep — and costs nothing until it's touched.
   */
  let asleep = false;
  let fastest = 0;
  function wake() {
    asleep = false;
    idle = 0;
    still = 0;
  }
  /** The palm: where it is, where it's going, and how long it has left. */
  let palm: { y: number; to: number; speed: number; hold: number } | null =
    null;
  /** A morph under way: rest offsets eased from → to, toward world targets. */
  let morph: {
    from: Float32Array;
    to: Float32Array;
    targets: Float32Array;
    t: number;
  } | null = null;
  /**
   * Once a figure has formed, it is held in pose — lightly, and without
   * creeping — so it presents itself instead of slumping or toppling. The
   * first touch lets go for good.
   */
  let pose: Float32Array | null = null;
  const figureCache = new Map<string, FigureTargets>();
  const isDoubleTap = createDoubleTap();
  const scratch = new THREE.Vector3();

  function init() {
    x.set(rest);
    const lift = reduceMotion ? 0 : DROP;
    for (let i = 0; i < count; i++) x[i * 3 + 1] += lift;
    v.fill(0);
    for (let c = 0; c < seedCount; c++) {
      const from = clusterStart[c];
      const to = clusterStart[c + 1];
      let cx = 0;
      let cy = 0;
      let cz = 0;
      for (let m = from; m < to; m++) {
        const i = members[m] * 3;
        cx += rest[i];
        cy += rest[i + 1];
        cz += rest[i + 2];
      }
      const n = to - from;
      cx /= n;
      cy /= n;
      cz /= n;
      for (let m = from; m < to; m++) {
        const i = members[m] * 3;
        restOffsets[m * 3] = rest[i] - cx;
        restOffsets[m * 3 + 1] = rest[i + 1] - cy;
        restOffsets[m * 3 + 2] = rest[i + 2] - cz;
      }
      rotations.set([0, 0, 0, 1], c * 4);
    }
    accumulator = 0;
  }
  init();

  // --- Simulation ------------------------------------------------------------

  const A = new Float64Array(9);
  const Aqq = new Float64Array(9);
  const T = new Float64Array(9);
  const R = new Float64Array(9);

  function step(dt: number) {
    const gravity = params.gravity;
    const drag = 1 - AIR_DRAG * dt;
    for (let i = 0; i < count; i++) {
      const k = i * 3;
      v[k + 1] -= gravity * dt;
      v[k] *= drag;
      v[k + 1] *= drag;
      v[k + 2] *= drag;
      p[k] = x[k] + v[k] * dt;
      p[k + 1] = x[k + 1] + v[k + 1] * dt;
      p[k + 2] = x[k + 2] + v[k + 2] * dt;
    }

    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      withoutDrift(() => matchShapes(iteration === ITERATIONS - 1));
      withoutDrift(conserveVolume);
      holdGrab();
      holdPose();
      collide();
    }
    withoutDrift(smoothSurface);

    // Left alone, clay comes to rest: nothing resists rolling on the floor,
    // so without this a resting lump never quite stops.
    const settle =
      idle > SETTLE_AFTER && !grabbed && !palm && !morph
        ? Math.exp(-SETTLE_DAMPING * dt)
        : 1;
    fastest = 0;
    for (let k = 0; k < count * 3; k += 3) {
      let vx = ((p[k] - x[k]) / dt) * settle;
      let vy = ((p[k + 1] - x[k + 1]) / dt) * settle;
      let vz = ((p[k + 2] - x[k + 2]) / dt) * settle;
      const speed = Math.hypot(vx, vy, vz);
      if (speed > fastest) fastest = speed;
      if (speed > MAX_SPEED) {
        const s = MAX_SPEED / speed;
        vx *= s;
        vy *= s;
        vz *= s;
      }
      v[k] = vx;
      v[k + 1] = vy;
      v[k + 2] = vz;
      x[k] = p[k];
      x[k + 1] = p[k + 1];
      x[k + 2] = p[k + 2];
    }
  }

  /**
   * Runs an internal constraint, then takes back any net shift it made.
   *
   * Forces inside the clay can reshape it but never move it as a whole —
   * only gravity, the floor and a hand can. Shape matching breaks that
   * without help: each cluster's pull sums to zero, but every particle then
   * averages the pulls of however many clusters it sits in, and that count
   * varies across the lump. Once the clay settles into a lopsided rest
   * shape, the leftover is a small constant push, and it slides away on its
   * own. Re-centring after each constraint restores the balance exactly.
   */
  function withoutDrift(apply: () => void) {
    let bx = 0;
    let by = 0;
    let bz = 0;
    for (let k = 0; k < count * 3; k += 3) {
      bx += p[k];
      by += p[k + 1];
      bz += p[k + 2];
    }
    apply();
    let ax = 0;
    let ay = 0;
    let az = 0;
    for (let k = 0; k < count * 3; k += 3) {
      ax += p[k];
      ay += p[k + 1];
      az += p[k + 2];
    }
    const dx = (ax - bx) / count;
    const dy = (ay - by) / count;
    const dz = (az - bz) / count;
    for (let k = 0; k < count * 3; k += 3) {
      p[k] -= dx;
      p[k + 1] -= dy;
      p[k + 2] -= dz;
    }
  }

  function matchShapes(plastic: boolean) {
    correction.fill(0);
    shares.fill(0);
    const { stiffness, mush } = params;
    // Under the palm the clay gives readily and keeps all of it, so none of
    // the squash is stored elastically to come back as a hop when it lifts.
    const yieldAt = palm ? 0 : params.yieldAt;
    let creep = palm ? Math.max(params.creep, 0.5) : params.creep;
    // While a figure forms, or is being presented, its shape is set from
    // outside; plastic flow would only fight that.
    if (morph || pose) creep = 0;

    for (let c = 0; c < seedCount; c++) {
      const from = clusterStart[c];
      const to = clusterStart[c + 1];
      const n = to - from;

      let cx = 0;
      let cy = 0;
      let cz = 0;
      for (let m = from; m < to; m++) {
        const i = members[m] * 3;
        cx += p[i];
        cy += p[i + 1];
        cz += p[i + 2];
      }
      cx /= n;
      cy /= n;
      cz /= n;

      // A = Σ (p − c) qᵀ and Aqq = Σ q qᵀ, row-major.
      A.fill(0);
      Aqq.fill(0);
      for (let m = from; m < to; m++) {
        const i = members[m] * 3;
        const px = p[i] - cx;
        const py = p[i + 1] - cy;
        const pz = p[i + 2] - cz;
        const qx = restOffsets[m * 3];
        const qy = restOffsets[m * 3 + 1];
        const qz = restOffsets[m * 3 + 2];
        A[0] += px * qx;
        A[1] += px * qy;
        A[2] += px * qz;
        A[3] += py * qx;
        A[4] += py * qy;
        A[5] += py * qz;
        A[6] += pz * qx;
        A[7] += pz * qy;
        A[8] += pz * qz;
        Aqq[0] += qx * qx;
        Aqq[1] += qx * qy;
        Aqq[2] += qx * qz;
        Aqq[4] += qy * qy;
        Aqq[5] += qy * qz;
        Aqq[8] += qz * qz;
      }
      Aqq[3] = Aqq[1];
      Aqq[6] = Aqq[2];
      Aqq[7] = Aqq[5];
      // A cluster squashed through itself has no rotation that would
      // restore it, and trying springs a flap out of the surface. Clay that
      // badly folded has simply taken a new shape: make it the rest shape.
      const det =
        A[0] * (A[4] * A[8] - A[5] * A[7]) -
        A[1] * (A[3] * A[8] - A[5] * A[6]) +
        A[2] * (A[3] * A[7] - A[4] * A[6]);
      if (det <= 0) {
        for (let m = from; m < to; m++) {
          const i = members[m] * 3;
          restOffsets[m * 3] = p[i] - cx;
          restOffsets[m * 3 + 1] = p[i + 1] - cy;
          restOffsets[m * 3 + 2] = p[i + 2] - cz;
        }
        rotations.set([0, 0, 0, 1], c * 4);
        continue;
      }
      extractRotation(A, rotations, c * 4, R);
      blendLinear(A, Aqq, R, mush, T);

      let yielded = false;
      for (let m = from; m < to; m++) {
        const i = members[m] * 3;
        const qx = restOffsets[m * 3];
        const qy = restOffsets[m * 3 + 1];
        const qz = restOffsets[m * 3 + 2];
        const gx = T[0] * qx + T[1] * qy + T[2] * qz + cx;
        const gy = T[3] * qx + T[4] * qy + T[5] * qz + cy;
        const gz = T[6] * qx + T[7] * qy + T[8] * qz + cz;
        correction[i] += gx - p[i];
        correction[i + 1] += gy - p[i + 1];
        correction[i + 2] += gz - p[i + 2];
        shares[members[m]]++;

        if (plastic) {
          // How far this particle sits from its rest place, in the
          // cluster's own frame: Rᵀ(p − c) − q.
          const lx = p[i] - cx;
          const ly = p[i + 1] - cy;
          const lz = p[i + 2] - cz;
          const dx = R[0] * lx + R[3] * ly + R[6] * lz - qx;
          const dy = R[1] * lx + R[4] * ly + R[7] * lz - qy;
          const dz = R[2] * lx + R[5] * ly + R[8] * lz - qz;
          const d = Math.hypot(dx, dy, dz);
          if (d > yieldAt) {
            const flow = (creep * (d - yieldAt)) / d;
            restOffsets[m * 3] += dx * flow;
            restOffsets[m * 3 + 1] += dy * flow;
            restOffsets[m * 3 + 2] += dz * flow;
            yielded = true;
          }
        }
      }

      // Rest offsets are measured from the centre, so keep them centred.
      if (yielded) {
        let mx = 0;
        let my = 0;
        let mz = 0;
        for (let m = from; m < to; m++) {
          mx += restOffsets[m * 3];
          my += restOffsets[m * 3 + 1];
          mz += restOffsets[m * 3 + 2];
        }
        mx /= n;
        my /= n;
        mz /= n;
        for (let m = from; m < to; m++) {
          restOffsets[m * 3] -= mx;
          restOffsets[m * 3 + 1] -= my;
          restOffsets[m * 3 + 2] -= mz;
        }
      }
    }

    for (let i = 0; i < count; i++) {
      const s = shares[i];
      if (s === 0) continue;
      const k = i * 3;
      const w = stiffness / s;
      p[k] += correction[k] * w;
      p[k + 1] += correction[k + 1] * w;
      p[k + 2] += correction[k + 2] * w;
    }
  }

  function volumeOf(q: Float32Array) {
    let volume = 0;
    for (let t = 0; t < triangleCount; t++) {
      const a = shellIndex[t * 3] * 3;
      const b = shellIndex[t * 3 + 1] * 3;
      const c = shellIndex[t * 3 + 2] * 3;
      volume +=
        q[a] * (q[b + 1] * q[c + 2] - q[b + 2] * q[c + 1]) +
        q[a + 1] * (q[b + 2] * q[c] - q[b] * q[c + 2]) +
        q[a + 2] * (q[b] * q[c + 1] - q[b + 1] * q[c]);
    }
    return volume / 6;
  }

  /** One projection of the "keep your volume" constraint on the surface. */
  function conserveVolume() {
    volumeGrad.fill(0);
    for (let t = 0; t < triangleCount; t++) {
      const ia = shellIndex[t * 3];
      const ib = shellIndex[t * 3 + 1];
      const ic = shellIndex[t * 3 + 2];
      const a = ia * 3;
      const b = ib * 3;
      const c = ic * 3;
      // ∂V/∂a = (b × c)/6, and cyclically.
      volumeGrad[a] += p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1];
      volumeGrad[a + 1] += p[b + 2] * p[c] - p[b] * p[c + 2];
      volumeGrad[a + 2] += p[b] * p[c + 1] - p[b + 1] * p[c];
      volumeGrad[b] += p[c + 1] * p[a + 2] - p[c + 2] * p[a + 1];
      volumeGrad[b + 1] += p[c + 2] * p[a] - p[c] * p[a + 2];
      volumeGrad[b + 2] += p[c] * p[a + 1] - p[c + 1] * p[a];
      volumeGrad[c] += p[a + 1] * p[b + 2] - p[a + 2] * p[b + 1];
      volumeGrad[c + 1] += p[a + 2] * p[b] - p[a] * p[b + 2];
      volumeGrad[c + 2] += p[a] * p[b + 1] - p[a + 1] * p[b];
    }
    let gradSq = 0;
    for (let k = 0; k < surfaceCount * 3; k++) {
      volumeGrad[k] /= 6;
      gradSq += volumeGrad[k] * volumeGrad[k];
    }
    if (gradSq < 1e-12) return;
    const lambda = (VOLUME_STIFFNESS * (restVolume - volumeOf(p))) / gradSq;
    for (let k = 0; k < surfaceCount * 3; k++) {
      p[k] += lambda * volumeGrad[k];
    }
  }

  function holdPose() {
    const targets = morph?.targets ?? pose;
    if (!targets) return;
    const k = morph ? MORPH_PULL * easeInOut(morph.t) : POSE_HOLD;
    for (let i = 0; i < count * 3; i++) p[i] += (targets[i] - p[i]) * k;
  }

  /** Starts the clay on its way to becoming a figure, wherever it is now. */
  function morphTo(key: string) {
    wake();
    const figure = FIGURES.find((f) => f.key === key);
    if (!figure) return;
    let shape = figureCache.get(key);
    if (!shape) {
      shape = figureTargets(figure, {
        rest,
        surfaceCount,
        shellIndex,
        neighbourStart,
        neighbours,
        restVolume,
      });
      figureCache.set(key, shape);
    }

    // Formed where the clay already is, standing on the floor.
    let cx = 0;
    let cz = 0;
    for (let k = 0; k < count * 3; k += 3) {
      cx += x[k];
      cz += x[k + 2];
    }
    cx /= count;
    cz /= count;
    const targets = new Float32Array(count * 3);
    for (let k = 0; k < count * 3; k += 3) {
      targets[k] = shape.positions[k] + cx;
      targets[k + 1] = shape.positions[k + 1] + FLOOR_Y;
      targets[k + 2] = shape.positions[k + 2] + cz;
    }

    // Rest offsets from the shape it's in now (so nothing jumps) to the
    // figure's, both measured upright, so the clusters' rotations restart
    // from identity.
    const from = new Float32Array(restOffsets.length);
    const to = new Float32Array(restOffsets.length);
    for (let c = 0; c < seedCount; c++) {
      const start = clusterStart[c];
      const end = clusterStart[c + 1];
      const n = end - start;
      let ax = 0;
      let ay = 0;
      let az = 0;
      let bx = 0;
      let by = 0;
      let bz = 0;
      for (let m = start; m < end; m++) {
        const i = members[m] * 3;
        ax += x[i];
        ay += x[i + 1];
        az += x[i + 2];
        bx += targets[i];
        by += targets[i + 1];
        bz += targets[i + 2];
      }
      for (let m = start; m < end; m++) {
        const i = members[m] * 3;
        from[m * 3] = x[i] - ax / n;
        from[m * 3 + 1] = x[i + 1] - ay / n;
        from[m * 3 + 2] = x[i + 2] - az / n;
        to[m * 3] = targets[i] - bx / n;
        to[m * 3 + 1] = targets[i + 1] - by / n;
        to[m * 3 + 2] = targets[i + 2] - bz / n;
      }
      rotations.set([0, 0, 0, 1], c * 4);
    }
    restOffsets.set(from);

    morph = { from, to, targets, t: reduceMotion ? 1 : 0 };
    pose = null;
    palm = null;
    stage.clearPrints();
    // Each skin vertex's place on the figure, carried by the same
    // embedding that carries the skin on the particles.
    const onFigure = skinDetail.figure;
    for (let s = 0; s < skinCount; s++) {
      const t = skinTriangle[s] * 3;
      const w1 = skinWeights[s * 2];
      const w2 = skinWeights[s * 2 + 1];
      const w0 = 1 - w1 - w2;
      const i0 = shellIndex[t] * 3;
      const i1 = shellIndex[t + 1] * 3;
      const i2 = shellIndex[t + 2] * 3;
      for (let a = 0; a < 3; a++) {
        onFigure[s * 3 + a] =
          shape.positions[i0 + a] * w0 +
          shape.positions[i1 + a] * w1 +
          shape.positions[i2 + a] * w2;
      }
    }
    skinDetail.commitFigure();
    stage.setDecals(shape.decals);
    stage.setRidges(shape.ridges);
  }

  function holdGrab() {
    if (!grabbed) return;
    if (!grabbed.moved) {
      press(grabbed);
      return;
    }
    const { indices, weights, offsets, target } = grabbed;

    // How far the hand is ahead of the patch it holds, on average.
    let dx = 0;
    let dy = 0;
    let dz = 0;
    let total = 0;
    for (let g = 0; g < indices.length; g++) {
      const k = indices[g] * 3;
      const w = weights[g];
      dx += (target.x + offsets[g * 3] - p[k]) * w;
      dy += (target.y + offsets[g * 3 + 1] - p[k + 1]) * w;
      dz += (target.z + offsets[g * 3 + 2] - p[k + 2]) * w;
      total += w;
    }
    const ahead = Math.hypot(dx, dy, dz) / (total || 1);
    if (ahead > STRETCH_LIMIT) {
      // Anything past the limit moves the whole lump instead.
      const carry = (CARRY * (ahead - STRETCH_LIMIT)) / ahead / (total || 1);
      const cx = dx * carry;
      const cy = dy * carry;
      const cz = dz * carry;
      for (let k = 0; k < count * 3; k += 3) {
        p[k] += cx;
        p[k + 1] += cy;
        p[k + 2] += cz;
      }
    }

    for (let g = 0; g < indices.length; g++) {
      const k = indices[g] * 3;
      const w = weights[g] * GRAB_STIFFNESS;
      p[k] += (target.x + offsets[g * 3] - p[k]) * w;
      p[k + 1] += (target.y + offsets[g * 3 + 1] - p[k + 1]) * w;
      p[k + 2] += (target.z + offsets[g * 3 + 2] - p[k + 2]) * w;
    }
  }

  /**
   * Pushes every particle out of a fingertip sphere that starts tangent to
   * the surface and sinks in along the normal. The push is answered by an
   * equal and opposite one spread over the whole lump, as if the other hand
   * were holding it — otherwise a free body just slides away from the
   * finger and never dents.
   */
  function press(hold: Grab) {
    if (hold.pressed <= 0) return;
    const sink = FINGER_RADIUS - hold.pressed;
    const fx = hold.anchor.x + hold.normal.x * sink;
    const fy = hold.anchor.y + hold.normal.y * sink;
    const fz = hold.anchor.z + hold.normal.z * sink;
    let tx = 0;
    let ty = 0;
    let tz = 0;
    for (let k = 0; k < count * 3; k += 3) {
      const dx = p[k] - fx;
      const dy = p[k + 1] - fy;
      const dz = p[k + 2] - fz;
      const d = Math.hypot(dx, dy, dz);
      if (d >= FINGER_RADIUS || d < 1e-6) continue;
      const push = (FINGER_RADIUS - d) / d;
      p[k] += dx * push;
      p[k + 1] += dy * push;
      p[k + 2] += dz * push;
      tx += dx * push;
      ty += dy * push;
      tz += dz * push;
    }
    tx /= count;
    ty /= count;
    tz /= count;
    for (let k = 0; k < count * 3; k += 3) {
      p[k] -= tx;
      p[k + 1] -= ty;
      p[k + 2] -= tz;
    }
  }

  /** One Laplacian pass: each surface particle eases toward its neighbours. */
  function smoothSurface() {
    const amount = params.smoothing;
    if (amount <= 0) return;
    for (let i = 0; i < surfaceCount; i++) {
      const from = neighbourStart[i];
      const to = neighbourStart[i + 1];
      let ax = 0;
      let ay = 0;
      let az = 0;
      for (let n = from; n < to; n++) {
        const k = neighbours[n] * 3;
        ax += p[k];
        ay += p[k + 1];
        az += p[k + 2];
      }
      const inv = 1 / (to - from);
      const k = i * 3;
      smoothed[k] = p[k] + (ax * inv - p[k]) * amount;
      smoothed[k + 1] = p[k + 1] + (ay * inv - p[k + 1]) * amount;
      smoothed[k + 2] = p[k + 2] + (az * inv - p[k + 2]) * amount;
    }
    p.set(smoothed);
  }

  function collide() {
    // Particles are clamped one by one, so keep the walls a lump's width in
    // from the edge of the frame, and the depth shallow enough that a throw
    // can't bring it up against the lens.
    const { left, right, up } = stage.bounds;
    const minX = Math.min(-1.4, -(left - 1));
    const maxX = Math.max(1.4, right - 1);
    const ceiling = Math.max(FLOOR_Y + 3, up - 0.8);
    for (let k = 0; k < count * 3; k += 3) {
      if (p[k + 1] < FLOOR_Y) {
        p[k + 1] = FLOOR_Y;
        // Friction: give back some of this step's slide.
        p[k] -= (p[k] - x[k]) * FRICTION;
        p[k + 2] -= (p[k + 2] - x[k + 2]) * FRICTION;
      }
      if (p[k] < minX) p[k] = minX;
      else if (p[k] > maxX) p[k] = maxX;
      if (p[k + 2] < -1.5) p[k + 2] = -1.5;
      else if (p[k + 2] > 1) p[k + 2] = 1;
      if (p[k + 1] > ceiling) p[k + 1] = ceiling;
      if (palm && p[k + 1] > palm.y) {
        p[k + 1] = palm.y;
        p[k] -= (p[k] - x[k]) * FRICTION;
        p[k + 2] -= (p[k + 2] - x[k + 2]) * FRICTION;
      }
    }
  }

  // --- Skinning --------------------------------------------------------------

  /** Pins each fine vertex to the coarse triangle its direction passes through. */
  function embedSkin(fine: Float32Array) {
    const vertexTriangles: number[][] = Array.from(
      { length: surfaceCount },
      () => [],
    );
    for (let t = 0; t < triangleCount; t++) {
      for (let j = 0; j < 3; j++)
        vertexTriangles[shellIndex[t * 3 + j]].push(t);
    }
    const dirs = new Float32Array(surfaceCount * 3);
    for (let i = 0; i < surfaceCount; i++) {
      const l = Math.hypot(
        shellRest[i * 3],
        shellRest[i * 3 + 1],
        shellRest[i * 3 + 2],
      );
      dirs[i * 3] = shellRest[i * 3] / l;
      dirs[i * 3 + 1] = shellRest[i * 3 + 1] / l;
      dirs[i * 3 + 2] = shellRest[i * 3 + 2] / l;
    }
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const bary = new THREE.Vector3();
    const flat = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const plane = new THREE.Plane();
    const ray = new THREE.Ray();
    const point = new THREE.Vector3();

    for (let s = 0; s < skinCount; s++) {
      dir.fromArray(fine, s * 3).normalize();
      let nearest = 0;
      let best = -Infinity;
      for (let i = 0; i < surfaceCount; i++) {
        const d =
          dir.x * dirs[i * 3] +
          dir.y * dirs[i * 3 + 1] +
          dir.z * dirs[i * 3 + 2];
        if (d > best) {
          best = d;
          nearest = i;
        }
      }
      // Of the triangles round the nearest corner, the one the ray from the
      // centre passes through — or, at a seam, the one it misses by least.
      let chosen = vertexTriangles[nearest][0];
      let leastOutside = Infinity;
      ray.set(new THREE.Vector3(), dir);
      for (const t of vertexTriangles[nearest]) {
        a.fromArray(shellRest, shellIndex[t * 3] * 3);
        b.fromArray(shellRest, shellIndex[t * 3 + 1] * 3);
        c.fromArray(shellRest, shellIndex[t * 3 + 2] * 3);
        plane.setFromCoplanarPoints(a, b, c);
        if (!ray.intersectPlane(plane, point)) continue;
        THREE.Triangle.getBarycoord(point, a, b, c, bary);
        const outside =
          Math.max(0, -bary.x) + Math.max(0, -bary.y) + Math.max(0, -bary.z);
        if (outside < leastOutside) {
          leastOutside = outside;
          chosen = t;
          skinWeights[s * 2] = bary.y;
          skinWeights[s * 2 + 1] = bary.z;
        }
      }
      skinTriangle[s] = chosen;
      const w1 = skinWeights[s * 2];
      const w2 = skinWeights[s * 2 + 1];
      const w0 = 1 - w1 - w2;
      const i0 = shellIndex[chosen * 3] * 3;
      const i1 = shellIndex[chosen * 3 + 1] * 3;
      const i2 = shellIndex[chosen * 3 + 2] * 3;
      flat.set(
        shellRest[i0] * w0 + shellRest[i1] * w1 + shellRest[i2] * w2,
        shellRest[i0 + 1] * w0 +
          shellRest[i1 + 1] * w1 +
          shellRest[i2 + 1] * w2,
        shellRest[i0 + 2] * w0 +
          shellRest[i1 + 2] * w1 +
          shellRest[i2 + 2] * w2,
      );
      normal
        .set(
          shellRestNormals[i0] * w0 +
            shellRestNormals[i1] * w1 +
            shellRestNormals[i2] * w2,
          shellRestNormals[i0 + 1] * w0 +
            shellRestNormals[i1 + 1] * w1 +
            shellRestNormals[i2 + 1] * w2,
          shellRestNormals[i0 + 2] * w0 +
            shellRestNormals[i1 + 2] * w1 +
            shellRestNormals[i2 + 2] * w2,
        )
        .normalize();
      skinHeight[s] = point
        .fromArray(fine, s * 3)
        .sub(flat)
        .dot(normal);
    }
  }

  function updateSkin() {
    // Area-weighted normals of the coarse surface, as it is now.
    surfaceNormals.fill(0);
    for (let t = 0; t < triangleCount; t++) {
      const a = shellIndex[t * 3] * 3;
      const b = shellIndex[t * 3 + 1] * 3;
      const c = shellIndex[t * 3 + 2] * 3;
      const e1x = x[b] - x[a];
      const e1y = x[b + 1] - x[a + 1];
      const e1z = x[b + 2] - x[a + 2];
      const e2x = x[c] - x[a];
      const e2y = x[c + 1] - x[a + 1];
      const e2z = x[c + 2] - x[a + 2];
      const nx = e1y * e2z - e1z * e2y;
      const ny = e1z * e2x - e1x * e2z;
      const nz = e1x * e2y - e1y * e2x;
      for (const k of [a, b, c]) {
        surfaceNormals[k] += nx;
        surfaceNormals[k + 1] += ny;
        surfaceNormals[k + 2] += nz;
      }
    }

    const out = skinPosition.array as Float32Array;
    for (let s = 0; s < skinCount; s++) {
      const t = skinTriangle[s];
      const w1 = skinWeights[s * 2];
      const w2 = skinWeights[s * 2 + 1];
      const w0 = 1 - w1 - w2;
      const i0 = shellIndex[t * 3] * 3;
      const i1 = shellIndex[t * 3 + 1] * 3;
      const i2 = shellIndex[t * 3 + 2] * 3;
      const n0 =
        1 /
        (Math.hypot(
          surfaceNormals[i0],
          surfaceNormals[i0 + 1],
          surfaceNormals[i0 + 2],
        ) || 1);
      const n1 =
        1 /
        (Math.hypot(
          surfaceNormals[i1],
          surfaceNormals[i1 + 1],
          surfaceNormals[i1 + 2],
        ) || 1);
      const n2 =
        1 /
        (Math.hypot(
          surfaceNormals[i2],
          surfaceNormals[i2 + 1],
          surfaceNormals[i2 + 2],
        ) || 1);
      let nx =
        surfaceNormals[i0] * n0 * w0 +
        surfaceNormals[i1] * n1 * w1 +
        surfaceNormals[i2] * n2 * w2;
      let ny =
        surfaceNormals[i0 + 1] * n0 * w0 +
        surfaceNormals[i1 + 1] * n1 * w1 +
        surfaceNormals[i2 + 1] * n2 * w2;
      let nz =
        surfaceNormals[i0 + 2] * n0 * w0 +
        surfaceNormals[i1 + 2] * n1 * w1 +
        surfaceNormals[i2 + 2] * n2 * w2;
      const h = skinHeight[s] / (Math.hypot(nx, ny, nz) || 1);
      nx *= h;
      ny *= h;
      nz *= h;
      out[s * 3] = x[i0] * w0 + x[i1] * w1 + x[i2] * w2 + nx;
      out[s * 3 + 1] = x[i0 + 1] * w0 + x[i1 + 1] * w1 + x[i2 + 1] * w2 + ny;
      out[s * 3 + 2] = x[i0 + 2] * w0 + x[i1 + 2] * w1 + x[i2 + 2] * w2 + nz;
    }
    skinPosition.needsUpdate = true;
    skin.computeVertexNormals();
    skin.computeBoundingSphere();

    for (let k = 0; k < surfaceCount * 3; k += 3) {
      const l =
        Math.hypot(
          surfaceNormals[k],
          surfaceNormals[k + 1],
          surfaceNormals[k + 2],
        ) || 1;
      unitNormals[k] = surfaceNormals[k] / l;
      unitNormals[k + 1] = surfaceNormals[k + 1] / l;
      unitNormals[k + 2] = surfaceNormals[k + 2] / l;
    }
    shellCurvature.compute(x, unitNormals, shellCavity);
    toCavity(shellCavity, shellCavityRest);
    shellCurvature.smooth(shellCavity);
    const cavity = skinDetail.cavity;
    for (let s = 0; s < skinCount; s++) {
      const t = skinTriangle[s] * 3;
      const w1 = skinWeights[s * 2];
      const w2 = skinWeights[s * 2 + 1];
      cavity[s] =
        shellCavity[shellIndex[t]] * (1 - w1 - w2) +
        shellCavity[shellIndex[t + 1]] * w1 +
        shellCavity[shellIndex[t + 2]] * w2;
    }
    skinDetail.commit();
  }

  // --- Input -----------------------------------------------------------------

  function hit(event: { clientX: number; clientY: number }) {
    return stage.aim(event).intersectObject(mesh, false)[0] ?? null;
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    const intersection = hit(event);
    if (!intersection) return;
    onTouch?.();
    canvas.setPointerCapture(event.pointerId);

    wake();
    // Touching a presented figure makes it clay again.
    pose = null;

    if (isDoubleTap(event)) {
      grabbed = null;
      smash();
      return;
    }

    const anchor = intersection.point.clone();
    const indices: number[] = [];
    const weights: number[] = [];
    const offsets: number[] = [];
    for (let i = 0; i < surfaceCount; i++) {
      const k = i * 3;
      const d = Math.hypot(
        x[k] - anchor.x,
        x[k + 1] - anchor.y,
        x[k + 2] - anchor.z,
      );
      if (d >= GRAB_RADIUS) continue;
      indices.push(i);
      // Smooth to zero at the edge, so the held patch has no rim.
      weights.push((1 - (d / GRAB_RADIUS) ** 2) ** 3);
      offsets.push(x[k] - anchor.x, x[k + 1] - anchor.y, x[k + 2] - anchor.z);
    }
    grabbed = {
      indices: Int32Array.from(indices),
      weights: Float32Array.from(weights),
      offsets: Float32Array.from(offsets),
      anchor,
      target: anchor.clone(),
      normal: intersection.face?.normal.clone() ?? new THREE.Vector3(0, 0, 1),
      downX: event.clientX,
      downY: event.clientY,
      downAt: event.timeStamp,
      pressed: 0,
      moved: false,
      print: skinDetail.restPointOf(intersection, new THREE.Vector3()),
    };
    canvas.style.cursor = "grabbing";
  }

  /** Brings a flat palm down onto the lump from just above its top. */
  function smash() {
    let top = -Infinity;
    for (let k = 1; k < count * 3; k += 3) top = Math.max(top, x[k]);
    const to = FLOOR_Y + Math.max((top - FLOOR_Y) * SMASH_TO, MIN_THICKNESS);
    // Already as flat as it goes.
    if (top - to < 0.05) return;
    wake();
    palm = { y: top, to, speed: (top - to) / SMASH_TIME, hold: SMASH_HOLD };
  }

  function onPointerMove(event: PointerEvent) {
    hover = event;
    if (!grabbed) return;
    if (
      Math.hypot(event.clientX - grabbed.downX, event.clientY - grabbed.downY) >
      5
    ) {
      grabbed.moved = true;
    }
    if (stage.pointOnViewPlane(event, grabbed.anchor, scratch)) {
      grabbed.target
        .copy(scratch)
        .addScaledVector(grabbed.normal, -grabbed.pressed);
    }
  }

  function onPointerUp(event: PointerEvent) {
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    grabbed = null;
    canvas.style.cursor = "";
  }

  /**
   * On touch screens the canvas sits over a page that has to scroll. A touch
   * that lands on the clay is the clay's; anywhere else, it's the page's.
   * Cancelling the touch's default is what stops the browser from panning,
   * and it has to be decided here, at the start, before it commits.
   */
  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    if (touch && hit(touch)) event.preventDefault();
  }

  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  stage.start((dt) => {
    // A pointer that holds still on the clay starts pressing into it.
    // (performance.now() and event.timeStamp share a clock.)
    if (
      grabbed &&
      !grabbed.moved &&
      performance.now() - grabbed.downAt > PRESS_DELAY &&
      grabbed.pressed < PRESS_DEPTH
    ) {
      if (grabbed.pressed === 0) stage.addPrint(grabbed.print);
      const depth = Math.min(PRESS_SPEED * dt, PRESS_DEPTH - grabbed.pressed);
      grabbed.pressed += depth;
      grabbed.target.addScaledVector(grabbed.normal, -depth);
    }

    if (morph) {
      morph.t = Math.min(1, morph.t + dt / MORPH_TIME);
      const e = easeInOut(morph.t);
      const { from, to } = morph;
      for (let i = 0; i < restOffsets.length; i++) {
        restOffsets[i] = from[i] + (to[i] - from[i]) * e;
      }
      if (morph.t >= 1) {
        pose = morph.targets;
        morph = null;
      }
    }

    if (palm) {
      if (palm.y > palm.to) {
        palm.y = Math.max(palm.to, palm.y - palm.speed * dt);
      } else {
        // Held down, then lifted, with the clay kept still throughout:
        // clay doesn't bounce, and whatever the squash stored elastically
        // would otherwise come back as a hop.
        v.fill(0);
        if ((palm.hold -= dt) <= 0) palm = null;
      }
    }

    if (grabbed || palm || morph) idle = 0;
    else idle += dt;

    if (!asleep) {
      accumulator += dt;
      let steps = 0;
      while (accumulator >= STEP && steps < MAX_STEPS) {
        step(STEP);
        accumulator -= STEP;
        steps++;
      }
      if (steps === MAX_STEPS) accumulator = 0;
      updateSkin();

      still = fastest < SLEEP_SPEED && idle > SETTLE_AFTER ? still + dt : 0;
      if (still > SLEEP_AFTER) {
        asleep = true;
        v.fill(0);
        accumulator = 0;
      }
    }

    let cx = 0;
    let cz = 0;
    for (let k = 0; k < surfaceCount * 3; k += 3) {
      cx += x[k];
      cz += x[k + 2];
    }
    stage.follow(cx / surfaceCount, cz / surfaceCount);

    if (hover && !grabbed) {
      canvas.style.cursor = hit(hover) ? "grab" : "";
      hover = null;
    }
  });

  return {
    setActive: stage.setActive,
    presets: FIGURES.map(({ key, label }) => ({ key, label })),
    morph: morphTo,
    params: [
      {
        key: "stiffness",
        label: "Stiffness",
        min: 0.2,
        max: 1,
        step: 0.01,
        value: params.stiffness,
      },
      {
        key: "mush",
        label: "Mush",
        min: 0,
        max: 0.9,
        step: 0.01,
        value: params.mush,
      },
      {
        key: "yieldAt",
        label: "Yield",
        min: 0,
        max: 0.2,
        step: 0.005,
        value: params.yieldAt,
      },
      {
        key: "creep",
        label: "Creep",
        min: 0,
        max: 0.5,
        step: 0.01,
        value: params.creep,
      },
      {
        key: "smoothing",
        label: "Smoothing",
        min: 0,
        max: 0.3,
        step: 0.01,
        value: params.smoothing,
      },
      {
        key: "gravity",
        label: "Gravity",
        min: 0,
        max: 40,
        step: 1,
        value: params.gravity,
      },
    ],
    setParam(key, value) {
      if (key in params) params[key as keyof typeof params] = value;
      wake();
    },
    reset() {
      wake();
      grabbed = null;
      palm = null;
      morph = null;
      pose = null;
      stage.clearPrints();
      stage.setDecals([]);
      stage.setRidges(null);
      init();
    },
    setColor(hex) {
      stage.setColor(hex);
    },
    dispose() {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      shell.dispose();
      inner.dispose();
      skin.dispose();
      stage.dispose();
    },
  };
}

/**
 * Müller et al. 2016: rotates the cluster's quaternion toward the rotation
 * part of A, starting from last step's answer. Converges in a few
 * iterations and, unlike a polar decomposition, never flips through an
 * inverted cluster.
 */
function extractRotation(
  A: Float64Array,
  quats: Float64Array,
  offset: number,
  R: Float64Array,
) {
  let qx = quats[offset];
  let qy = quats[offset + 1];
  let qz = quats[offset + 2];
  let qw = quats[offset + 3];
  for (let iteration = 0; iteration < 6; iteration++) {
    toMatrix(qx, qy, qz, qw, R);
    // ω = Σ r_i × a_i / |Σ r_i · a_i|, over columns.
    let ox = 0;
    let oy = 0;
    let oz = 0;
    let dot = 0;
    for (let col = 0; col < 3; col++) {
      const rx = R[col];
      const ry = R[3 + col];
      const rz = R[6 + col];
      const ax = A[col];
      const ay = A[3 + col];
      const az = A[6 + col];
      ox += ry * az - rz * ay;
      oy += rz * ax - rx * az;
      oz += rx * ay - ry * ax;
      dot += rx * ax + ry * ay + rz * az;
    }
    const inv = 1 / (Math.abs(dot) + 1e-9);
    ox *= inv;
    oy *= inv;
    oz *= inv;
    const angle = Math.hypot(ox, oy, oz);
    if (angle < 1e-9) break;
    const s = Math.sin(angle / 2) / angle;
    const dx = ox * s;
    const dy = oy * s;
    const dz = oz * s;
    const dw = Math.cos(angle / 2);
    // q ← dq · q
    const nx = dw * qx + dx * qw + dy * qz - dz * qy;
    const ny = dw * qy - dx * qz + dy * qw + dz * qx;
    const nz = dw * qz + dx * qy - dy * qx + dz * qw;
    const nw = dw * qw - dx * qx - dy * qy - dz * qz;
    const l = Math.hypot(nx, ny, nz, nw);
    qx = nx / l;
    qy = ny / l;
    qz = nz / l;
    qw = nw / l;
  }
  quats[offset] = qx;
  quats[offset + 1] = qy;
  quats[offset + 2] = qz;
  quats[offset + 3] = qw;
  toMatrix(qx, qy, qz, qw, R);
}

const blendInverse = new Float64Array(9);
const blendLinearFit = new Float64Array(9);

/**
 * T = mush·Â + (1 − mush)·R, where Â is the cluster's best linear fit
 * A·Aqq⁻¹ scaled to unit determinant, so it may stretch and shear but
 * never gain or lose volume.
 */
function blendLinear(
  A: Float64Array,
  Aqq: Float64Array,
  R: Float64Array,
  mush: number,
  T: Float64Array,
) {
  T.set(R);
  if (mush <= 0) return;
  // A flattened rest shape makes Aqq nearly singular; regularise it.
  const ridge = 1e-3 * (Aqq[0] + Aqq[4] + Aqq[8]);
  const a = Aqq[0] + ridge;
  const b = Aqq[1];
  const c = Aqq[2];
  const d = Aqq[4] + ridge;
  const e = Aqq[5];
  const f = Aqq[8] + ridge;
  // Inverse of the symmetric [[a b c] [b d e] [c e f]].
  const i0 = d * f - e * e;
  const i1 = c * e - b * f;
  const i2 = b * e - c * d;
  const det = a * i0 + b * i1 + c * i2;
  if (det <= 1e-12) return;
  const i4 = a * f - c * c;
  const i5 = b * c - a * e;
  const i8 = a * d - b * b;
  const inv = blendInverse;
  inv[0] = i0 / det;
  inv[1] = inv[3] = i1 / det;
  inv[2] = inv[6] = i2 / det;
  inv[4] = i4 / det;
  inv[5] = inv[7] = i5 / det;
  inv[8] = i8 / det;
  const L = blendLinearFit;
  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < 3; col++) {
      L[r * 3 + col] =
        A[r * 3] * inv[col] +
        A[r * 3 + 1] * inv[3 + col] +
        A[r * 3 + 2] * inv[6 + col];
    }
  }
  const detL =
    L[0] * (L[4] * L[8] - L[5] * L[7]) -
    L[1] * (L[3] * L[8] - L[5] * L[6]) +
    L[2] * (L[3] * L[7] - L[4] * L[6]);
  if (detL <= 1e-9) return;
  const scale = 1 / Math.cbrt(detL);
  for (let k = 0; k < 9; k++) T[k] = mush * L[k] * scale + (1 - mush) * R[k];
}

function toMatrix(x: number, y: number, z: number, w: number, R: Float64Array) {
  R[0] = 1 - 2 * (y * y + z * z);
  R[1] = 2 * (x * y - z * w);
  R[2] = 2 * (x * z + y * w);
  R[3] = 2 * (x * y + z * w);
  R[4] = 1 - 2 * (x * x + z * z);
  R[5] = 2 * (y * z - x * w);
  R[6] = 2 * (x * z - y * w);
  R[7] = 2 * (y * z + x * w);
  R[8] = 1 - 2 * (x * x + y * y);
}
