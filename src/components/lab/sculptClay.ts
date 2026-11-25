import * as THREE from "three";

import {
  type ClayEngine,
  createDoubleTap,
  createStage,
  lumpGeometry,
  prefersReducedMotion,
} from "@/components/clay/clayStage";
import { addSurfaceDetail } from "@/components/clay/clayMaterial";
import { grab, squash, twist } from "@/components/lab/kelvinlets";

/**
 * Prototype A — sculpting brushes.
 *
 * The clay has two shapes. `sculpted` is where the brushes have left it, and
 * it never moves on its own: what you do to it stays done. The surface you
 * see springs toward that shape rather than being set to it, which is the
 * only thing that makes it feel soft — a pull that stops overshoots a
 * little and settles, a smash wobbles.
 */

/** Brush radii, in lump radii. */
const PULL_RADIUS = 0.48;
const PRESS_RADIUS = 0.26;
const TWIST_RADIUS = 0.45;
const SMASH_RADIUS = 1.1;

/** Longest single brush step; long drags are integrated in pieces. */
const MAX_STEP = 0.035;
/** Stationary this long (ms) and a held pointer becomes a thumb press. */
const PRESS_DELAY = 140;
const PRESS_SPEED = 0.55;
const PRESS_DEPTH = 0.5;
/** Total squash of a smash, and how long it takes to land. */
const SMASH_STRAIN = 0.75;
const SMASH_TIME = 0.16;

type Gesture =
  | { kind: "none" }
  | {
      kind: "pull" | "twist";
      /** Brush centre, local space. Travels with the clay it holds. */
      centre: THREE.Vector3;
      /** Last pointer point on the drag plane, world space. */
      last: THREE.Vector3;
      normal: THREE.Vector3;
      downX: number;
      downY: number;
      downAt: number;
      lastX: number;
      pressed: number;
      moved: boolean;
      /** Where the fingerprint goes, should this turn into a press. */
      print: THREE.Vector3;
    }
  | { kind: "turn"; lastX: number; lastY: number };

export function createSculptClay(
  canvas: HTMLCanvasElement,
  color: string,
): ClayEngine {
  const stage = createStage(canvas, color);
  const reduceMotion = prefersReducedMotion();

  const params = {
    /** The surface's spring toward the sculpted shape. */
    springHz: 4,
    damping: 0.32,
    /** Scales every brush radius. */
    brush: 1,
  };

  const geometry = lumpGeometry(44);
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  position.setUsage(THREE.DynamicDrawUsage);
  const surface = position.array as Float32Array;
  const original = surface.slice();
  const sculpted = surface.slice();
  const velocity = new Float32Array(surface.length);
  const detail = addSurfaceDetail(geometry);

  const mesh = new THREE.Mesh(geometry, stage.material);
  mesh.castShadow = true;
  stage.scene.add(mesh);

  let gesture: Gesture = { kind: "none" };
  let smashLeft = 0;
  let resetLeft = 0;
  let awake = true;
  let lastInput = -Infinity;
  let yaw = -0.4;
  let pitch = 0.18;
  let yawVelocity = 0;
  let pitchVelocity = 0;
  let hover: { clientX: number; clientY: number } | null = null;

  const isDoubleTap = createDoubleTap();
  const scratch = new THREE.Vector3();
  const delta = new THREE.Vector3();
  const inverse = new THREE.Quaternion();

  /** A world-space direction, in the lump's own frame. */
  const toLocalDirection = (v: THREE.Vector3) =>
    v.applyQuaternion(inverse.copy(mesh.quaternion).invert());

  function hit(event: PointerEvent) {
    return stage.aim(event).intersectObject(mesh, false)[0] ?? null;
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    canvas.setPointerCapture(event.pointerId);
    lastInput = event.timeStamp;
    const intersection = hit(event);

    if (isDoubleTap(event) && intersection) {
      smashLeft = SMASH_STRAIN;
      gesture = { kind: "none" };
      return;
    }
    if (!intersection) {
      gesture = { kind: "turn", lastX: event.clientX, lastY: event.clientY };
      canvas.style.cursor = "grabbing";
      return;
    }
    const normal = intersection.face
      ? intersection.face.normal.clone()
      : mesh.worldToLocal(intersection.point.clone()).normalize();
    gesture = {
      kind: event.shiftKey ? "twist" : "pull",
      centre: mesh.worldToLocal(intersection.point.clone()),
      last: intersection.point.clone(),
      normal,
      downX: event.clientX,
      downY: event.clientY,
      downAt: event.timeStamp,
      lastX: event.clientX,
      pressed: 0,
      moved: false,
      print: detail.restPointOf(intersection, new THREE.Vector3()),
    };
    canvas.style.cursor = "grabbing";
    awake = true;
  }

  function onPointerMove(event: PointerEvent) {
    hover = event;
    if (gesture.kind === "none") return;
    lastInput = event.timeStamp;

    if (gesture.kind === "turn") {
      const dx = event.clientX - gesture.lastX;
      const dy = event.clientY - gesture.lastY;
      gesture.lastX = event.clientX;
      gesture.lastY = event.clientY;
      yawVelocity = dx * 0.5;
      pitchVelocity = dy * 0.5;
      yaw += dx * 0.008;
      pitch = THREE.MathUtils.clamp(pitch + dy * 0.008, -0.9, 0.9);
      return;
    }

    if (
      Math.hypot(event.clientX - gesture.downX, event.clientY - gesture.downY) >
      5
    ) {
      gesture.moved = true;
    }

    if (gesture.kind === "twist") {
      const angle = (event.clientX - gesture.lastX) * 0.012;
      gesture.lastX = event.clientX;
      // About the line of sight, so the twist turns the way the pointer does.
      stage.camera.getWorldDirection(scratch).negate();
      toLocalDirection(scratch);
      const c = gesture.centre;
      twist(
        sculpted,
        c.x,
        c.y,
        c.z,
        scratch.x,
        scratch.y,
        scratch.z,
        angle,
        TWIST_RADIUS * params.brush,
      );
      awake = true;
      return;
    }

    if (!stage.pointOnViewPlane(event, gesture.last, scratch)) return;
    delta.subVectors(scratch, gesture.last);
    gesture.last.copy(scratch);
    toLocalDirection(delta);
    pull(gesture.centre, delta, PULL_RADIUS * params.brush);
  }

  /** Moves the clay at `centre` by `d`, in steps short enough to stay smooth. */
  function pull(centre: THREE.Vector3, d: THREE.Vector3, radius: number) {
    const steps = Math.ceil(d.length() / MAX_STEP);
    if (steps === 0) return;
    const sx = d.x / steps;
    const sy = d.y / steps;
    const sz = d.z / steps;
    for (let i = 0; i < steps; i++) {
      grab(sculpted, centre.x, centre.y, centre.z, sx, sy, sz, radius);
      centre.x += sx;
      centre.y += sy;
      centre.z += sz;
    }
    awake = true;
  }

  function onPointerUp(event: PointerEvent) {
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    gesture = { kind: "none" };
    canvas.style.cursor = "";
    lastInput = event.timeStamp;
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  const pressStep = new THREE.Vector3();

  stage.start((dt) => {
    const now = performance.now();

    // Turning: follow the hand, then coast, then drift on its own.
    if (gesture.kind !== "turn") {
      const decay = Math.exp(-dt * 4);
      yawVelocity *= decay;
      pitchVelocity *= decay;
      yaw += yawVelocity * 0.008 * dt * 60;
      pitch = THREE.MathUtils.clamp(
        pitch + pitchVelocity * 0.008 * dt * 60,
        -0.9,
        0.9,
      );
      const idle = (now - lastInput) / 1000;
      if (!reduceMotion && idle > 2.5) {
        yaw += dt * 0.12 * Math.min(1, (idle - 2.5) / 2);
      }
    }
    mesh.rotation.set(pitch, yaw, 0, "YXZ");

    // A pointer that holds still on the clay starts pressing into it.
    // (performance.now() and event.timeStamp share a clock.)
    if (
      gesture.kind === "pull" &&
      !gesture.moved &&
      performance.now() - gesture.downAt > PRESS_DELAY &&
      gesture.pressed < PRESS_DEPTH
    ) {
      if (gesture.pressed === 0) stage.addPrint(gesture.print);
      const step = Math.min(PRESS_SPEED * dt, PRESS_DEPTH - gesture.pressed);
      gesture.pressed += step;
      pressStep.copy(gesture.normal).multiplyScalar(-step);
      pull(gesture.centre, pressStep, PRESS_RADIUS * params.brush);
    }

    if (smashLeft > 0) {
      const strain = Math.min(smashLeft, (SMASH_STRAIN / SMASH_TIME) * dt);
      smashLeft -= strain;
      // A palm coming down from above: squash along world up, centred a
      // little above the middle so the top takes the brunt.
      scratch.set(0, 1, 0);
      toLocalDirection(scratch);
      squash(
        sculpted,
        scratch.x * 0.25,
        scratch.y * 0.25,
        scratch.z * 0.25,
        scratch.x,
        scratch.y,
        scratch.z,
        strain,
        SMASH_RADIUS,
      );
      awake = true;
    }

    if (resetLeft > 0) {
      resetLeft -= dt;
      const t = 1 - Math.exp(-dt * 9);
      for (let i = 0; i < sculpted.length; i++) {
        sculpted[i] += (original[i] - sculpted[i]) * t;
      }
      awake = true;
    }

    if (awake) settle(dt);

    if (hover && gesture.kind === "none") {
      canvas.style.cursor = hit(hover as PointerEvent) ? "grab" : "";
      hover = null;
    }
  });

  /** Springs the visible surface toward the sculpted shape. */
  function settle(dt: number) {
    if (reduceMotion) {
      surface.set(sculpted);
      velocity.fill(0);
    } else {
      const omega = 2 * Math.PI * params.springHz;
      const k = omega * omega;
      const c = 2 * params.damping * omega;
      const h = dt / 2;
      for (let step = 0; step < 2; step++) {
        for (let i = 0; i < surface.length; i++) {
          const v =
            velocity[i] +
            (k * (sculpted[i] - surface[i]) - c * velocity[i]) * h;
          velocity[i] = v;
          surface[i] += v * h;
        }
      }
    }
    let energy = 0;
    for (let i = 0; i < surface.length; i++) {
      energy = Math.max(
        energy,
        Math.abs(sculpted[i] - surface[i]),
        Math.abs(velocity[i]) * 0.02,
      );
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    detail.update();
    awake =
      energy > 1e-5 ||
      gesture.kind !== "none" ||
      smashLeft > 0 ||
      resetLeft > 0;
  }

  return {
    params: [
      {
        key: "springHz",
        label: "Spring",
        min: 1,
        max: 10,
        step: 0.1,
        value: params.springHz,
      },
      {
        key: "damping",
        label: "Damping",
        min: 0.05,
        max: 1,
        step: 0.01,
        value: params.damping,
      },
      {
        key: "brush",
        label: "Brush size",
        min: 0.5,
        max: 2,
        step: 0.05,
        value: params.brush,
      },
    ],
    setParam(key, value) {
      if (key in params) params[key as keyof typeof params] = value;
    },
    reset() {
      stage.clearPrints();
      resetLeft = 1.2;
      smashLeft = 0;
      awake = true;
    },
    setColor(hex) {
      stage.setColor(hex);
    },
    dispose() {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      geometry.dispose();
      stage.dispose();
    },
  };
}
