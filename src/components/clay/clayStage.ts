import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { createClayMaterial } from "@/components/clay/clayMaterial";

/**
 * What every clay scene shares: the renderer, the light, the floor the
 * shadow lands on, the material, and the lump of clay they start from. Each
 * engine only decides how the lump moves.
 */

export { CLAY_COLORS } from "@/components/clay/colors";

/** How far above the horizon the camera looks down from, in radians. */
const ELEVATION = 0.3;

/** Where the shadow falls. The lump has radius ~1 around the origin. */
export const FLOOR_Y = -1.15;

/** A knob the lab exposes so the feel can be tuned by hand. */
export interface ClayParam {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
}

export interface ClayEngine {
  params: ClayParam[];
  /** Pauses rendering and simulation, e.g. while scrolled out of view. */
  setActive?(active: boolean): void;
  /** Figures the clay can be morphed into, if the engine supports it. */
  presets?: { key: string; label: string }[];
  morph?(key: string): void;
  setParam(key: string, value: number): void;
  reset(): void;
  setColor(hex: string): void;
  dispose(): void;
}

export type Stage = ReturnType<typeof createStage>;

export interface StageOptions {
  /**
   * An element the lump should sit on at rest. The canvas can be far larger
   * — a whole page section the clay can be thrown around — and the camera
   * is framed so the lump appears inside this element, at its size.
   */
  anchor?: HTMLElement | null;
}

/** The lump and its shadow, in world units, across an anchor's width. */
const ANCHOR_SPAN = 2.7;

export function createStage(
  canvas: HTMLCanvasElement,
  color: string,
  { anchor = null }: StageOptions = {},
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envMap = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();
  scene.environment = envMap;
  scene.environmentIntensity = 0.5;

  // A broad, warm fill from above: clay renders are low-contrast, and the
  // shadow side should stay the clay's colour rather than fall to grey.
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe9e0d8, 0.85));

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  // Framed so the floor sits just above the copy, with headroom for the
  // tallest figure the clay can be shaped into. Anchored, it's the middle
  // of the lump and its shadow that lands on the anchor's centre.
  const target = new THREE.Vector3(0, anchor ? -0.35 : -0.3, 0);

  const key = new THREE.DirectionalLight(0xfff6ee, 1.6);
  key.position.set(2.2, 6, 3.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 10;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  const shadowCam = key.shadow.camera;
  shadowCam.left = shadowCam.bottom = -6;
  shadowCam.right = shadowCam.top = 6;
  shadowCam.near = 1;
  shadowCam.far = 16;
  scene.add(key);
  scene.add(key.target);

  // The shadow is tinted with the clay's own colour, as claymorphic
  // shadows are, instead of a neutral grey.
  const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    shadowMaterial,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR_Y;
  floor.receiveShadow = true;
  scene.add(floor);

  const clay = createClayMaterial(color);
  const material = clay.material;

  function setColor(hex: string) {
    material.color.set(hex);
    const hsl = { h: 0, s: 0, l: 0 };
    material.color.getHSL(hsl);
    shadowMaterial.color.setHSL(hsl.h, Math.min(1, hsl.s * 0.9), hsl.l * 0.42);
  }
  setColor(color);

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  /**
   * How far the visible frame reaches from the lump's rest spot, in world
   * units at its depth: for keeping things in frame.
   */
  const bounds = { left: 2, right: 2, up: 4 };
  let width = 1;
  let height = 1;
  /** The anchor's place in the canvas when the camera was last framed. */
  let framedOn = "";

  /**
   * The anchor's centre and width in the canvas's own layout pixels. Both
   * are measured on screen and divided by the canvas's on-screen scale, so a
   * CSS transform on an ancestor (a scene scaling down into a picker) leaves
   * the framing — and the drawing buffer — untouched.
   */
  function anchorInCanvas() {
    if (!anchor) return null;
    const a = anchor.getBoundingClientRect();
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / Math.max(1, canvas.clientWidth) || 1;
    return {
      x: (a.left + a.width / 2 - rect.left) / scale,
      y: (a.top + a.height / 2 - rect.top) / scale,
      width: a.width / scale,
    };
  }
  const describe = (spot: ReturnType<typeof anchorInCanvas>) =>
    spot
      ? [spot.x, spot.y, spot.width, canvas.clientWidth, canvas.clientHeight]
          .map((value) => value.toFixed(1))
          .join("|")
      : "";

  function resize() {
    width = Math.max(1, canvas.clientWidth);
    height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

    let distance: number;
    // Where the rest spot lands on the canvas, in pixels.
    let cx = width / 2;
    let cy = height / 2;
    const spot = anchorInCanvas();
    if (spot) {
      const pixelsPerUnit = Math.max(1, spot.width) / ANCHOR_SPAN;
      distance = height / pixelsPerUnit / 2 / tanHalf;
      cx = spot.x;
      cy = spot.y;
      framedOn = describe(spot);
    } else {
      // Pull back on narrow screens so the lump keeps the same share of width.
      distance = 15 * Math.max(1, 0.85 / camera.aspect);
    }

    // A three-quarter view from a little above, as clay illustrations are
    // drawn: enough to see into a cup.
    camera.position
      .set(0, Math.sin(ELEVATION), Math.cos(ELEVATION))
      .multiplyScalar(distance)
      .add(target);
    camera.lookAt(target);
    // Slide the view so the rest spot lands on the anchor rather than on the
    // canvas's centre; the perspective stays centred on the lump.
    if (anchor) {
      camera.setViewOffset(
        width,
        height,
        width / 2 - cx,
        height / 2 - cy,
        width,
        height,
      );
    } else {
      camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();

    const unitsPerPixel = (2 * tanHalf * distance) / height;
    bounds.left = cx * unitsPerPixel;
    bounds.right = (width - cx) * unitsPerPixel;
    bounds.up = cy * unitsPerPixel;
  }
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  /** Re-frames if the anchor has moved within the canvas (fonts, reflow). */
  function followAnchor() {
    if (anchor && describe(anchorInCanvas()) !== framedOn) resize();
  }

  /** Keeps the shadow-casting light over the clay wherever it is thrown. */
  function follow(x: number, z: number) {
    key.position.set(x + 2.2, 6, z + 3.2);
    key.target.position.set(x, 0, z);
  }

  /** Aims the shared raycaster at a pointer position. */
  function aim(event: { clientX: number; clientY: number }) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    return raycaster;
  }

  /** Where a pointer meets the plane through `point` that faces the camera. */
  const dragPlane = new THREE.Plane();
  const viewDir = new THREE.Vector3();
  function pointOnViewPlane(
    event: { clientX: number; clientY: number },
    point: THREE.Vector3,
    out: THREE.Vector3,
  ) {
    camera.getWorldDirection(viewDir);
    dragPlane.setFromNormalAndCoplanarPoint(viewDir, point);
    return aim(event).ray.intersectPlane(dragPlane, out);
  }

  const timer = new THREE.Timer();
  let loop: ((time: number) => void) | null = null;
  let active = true;

  function start(tick: (dt: number) => void) {
    loop = (time) => {
      timer.update(time);
      // A backgrounded tab comes back with one enormous step; don't take it.
      const dt = Math.min(timer.getDelta(), 1 / 30);
      followAnchor();
      tick(dt);
      renderer.render(scene, camera);
    };
    if (active) renderer.setAnimationLoop(loop);
  }

  /** Stops drawing (and simulating) entirely, or picks up where it left off. */
  function setActive(next: boolean) {
    if (next === active) return;
    active = next;
    renderer.setAnimationLoop(active ? loop : null);
    // Resume without one long step for the time spent paused.
    if (active) timer.reset();
  }

  function dispose() {
    renderer.setAnimationLoop(null);
    observer.disconnect();
    floor.geometry.dispose();
    shadowMaterial.dispose();
    material.dispose();
    envMap.dispose();
    renderer.dispose();
  }

  return {
    renderer,
    scene,
    camera,
    material,
    bounds,
    follow,
    setActive,
    setColor,
    addPrint: clay.addPrint,
    clearPrints: clay.clearPrints,
    setDecals: clay.setDecals,
    setRidges: clay.setRidges,
    aim,
    pointOnViewPlane,
    start,
    dispose,
  };
}

/** Hand-rolled, not machined: a slightly settled ball with a few soft lumps. */
function shapeLump(x: number, y: number, z: number, out: number[]) {
  const len = Math.hypot(x, y, z) || 1;
  const nx = x / len;
  const ny = y / len;
  const nz = z / len;
  const lumps =
    0.035 *
      Math.sin(3.1 * nx + 1.3) *
      Math.sin(2.7 * ny + 0.4) *
      Math.sin(3.3 * nz + 2.1) +
    0.018 * Math.sin(5.3 * nx + 0.2) * Math.sin(4.9 * nz + 1.7);
  const r = len * (1 + lumps);
  out[0] = nx * r * 1.04;
  out[1] = ny * r * 0.92;
  out[2] = nz * r * 1.04;
}

/**
 * An indexed sphere at `radius` and subdivision `detail`, shaped into the
 * starting lump. Indexed matters: deforming a vertex has to move every
 * triangle that uses it, or the surface tears along the seams.
 */
export function lumpGeometry(detail: number, radius = 1, shaped = true) {
  const raw = new THREE.IcosahedronGeometry(radius, detail);
  raw.deleteAttribute("normal");
  raw.deleteAttribute("uv");
  const geometry = mergeVertices(raw, 1e-5);
  raw.dispose();
  if (shaped) {
    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    const p = position.array as Float32Array;
    const out = [0, 0, 0];
    for (let i = 0; i < p.length; i += 3) {
      shapeLump(p[i], p[i + 1], p[i + 2], out);
      p[i] = out[0];
      p[i + 1] = out[1];
      p[i + 2] = out[2];
    }
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Recognizes a second tap within the window on any pointer type. */
export function createDoubleTap(windowMs = 320, slopPx = 24) {
  let lastTime = -Infinity;
  let lastX = 0;
  let lastY = 0;
  return (event: PointerEvent) => {
    const isDouble =
      event.timeStamp - lastTime < windowMs &&
      Math.hypot(event.clientX - lastX, event.clientY - lastY) < slopPx;
    lastTime = isDouble ? -Infinity : event.timeStamp;
    lastX = event.clientX;
    lastY = event.clientY;
    return isDouble;
  };
}

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
