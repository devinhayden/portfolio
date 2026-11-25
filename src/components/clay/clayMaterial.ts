import * as THREE from "three";

/**
 * The clay look, shared by both prototypes.
 *
 * Three things make it read as dough rather than a balloon:
 *
 * - It is matte. No sheen, a broad dull highlight, and a soft fill so the
 *   shadow side stays warm instead of falling off to black.
 * - It has a surface. A fine grain and soft unevenness are bump-mapped
 *   from each vertex's *rest* position, so the texture belongs to the dough
 *   and stretches with it instead of swimming over it.
 * - Creases darken and ridges catch light. That cavity shading, which is
 *   what makes a clay render look like clay, is computed per vertex from the
 *   mesh's curvature every frame it moves.
 *
 * Presses also leave fingerprints: ridged whorls stamped in rest space. A
 * figure's features — eyes, a nose — are decals placed in *figure* space:
 * every vertex also carries where it sits on the current figure, so a decal
 * is an exact circle on the figure however unevenly the lump was stretched
 * to make it, and still belongs to the dough, so a smash smears it.
 */

const MAX_PRINTS = 12;
const MAX_DECALS = 8;

export function createClayMaterial(color: string) {
  const prints = Array.from({ length: MAX_PRINTS }, () => new THREE.Vector4());
  const uniforms = {
    uPrints: { value: prints },
    uPrintCount: { value: 0 },
    uDecals: {
      value: Array.from({ length: MAX_DECALS }, () => new THREE.Vector4()),
    },
    /** rgb, and in w how much to darken by instead of painting. */
    uDecalColors: {
      value: Array.from({ length: MAX_DECALS }, () => new THREE.Vector4()),
    },
    uDecalCount: { value: 0 },
    /** count, amplitude, twist, fade-in elevation; zero amplitude = none. */
    uRidges: { value: new THREE.Vector4() },
    uRidgesTo: { value: 1 },
  };
  let nextPrint = 0;

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.86,
    metalness: 0,
    envMapIntensity: 0.45,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPrints = uniforms.uPrints;
    shader.uniforms.uPrintCount = uniforms.uPrintCount;
    shader.uniforms.uDecals = uniforms.uDecals;
    shader.uniforms.uDecalColors = uniforms.uDecalColors;
    shader.uniforms.uDecalCount = uniforms.uDecalCount;
    shader.uniforms.uRidges = uniforms.uRidges;
    shader.uniforms.uRidgesTo = uniforms.uRidgesTo;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute vec3 aRest;
attribute vec3 aFigure;
attribute float aCavity;
varying vec3 vRest;
varying vec3 vFigure;
varying float vCavity;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vRest = aRest;
vFigure = aFigure;
vCavity = aCavity;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAGMENT_PARS}`)
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
// Clay is never one flat colour: a faint, broad mottling.
diffuseColor.rgb *= 1.0 + (clayNoise(vRest * 3.0 + 7.0) - 0.5) * 0.08;
for (int i = 0; i < ${MAX_DECALS}; i++) {
  if (i >= uDecalCount) break;
  float d = length(vFigure - uDecals[i].xyz);
  float r = uDecals[i].w;
  vec4 decal = uDecalColors[i];
  float inside = 1.0 - smoothstep(r - fwidth(d), r + fwidth(d), d);
  if (decal.w > 0.0) {
    // A shade: a soft-edged darkening, like a hollow in shadow.
    float soft = 1.0 - smoothstep(r * 0.4, r, d);
    diffuseColor.rgb *= 1.0 - decal.w * soft;
  } else {
    diffuseColor.rgb = mix(diffuseColor.rgb, decal.rgb, inside);
  }
}`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
normal = clayBump(-vViewPosition, normal, clayHeight(vRest, vFigure), faceDirection);`,
      )
      .replace(
        "#include <aomap_fragment>",
        `#include <aomap_fragment>
{
  float cavity = clamp(vCavity, -1.0, 1.0);
  float occlusion = 1.0 - max(cavity, 0.0) * 0.6;
  float lift = 1.0 + max(-cavity, 0.0) * 0.18;
  reflectedLight.indirectDiffuse *= occlusion * lift;
  reflectedLight.directDiffuse *= mix(1.0, occlusion, 0.55) * lift;
  reflectedLight.indirectSpecular *= occlusion;
  // A little light carried through the dough: softens the terminator.
  reflectedLight.indirectDiffuse += diffuseColor.rgb * 0.07 * occlusion;
}`,
      );
  };

  return {
    material,
    /** Leaves a fingerprint centred on a rest-space point. */
    addPrint(rest: THREE.Vector3) {
      prints[nextPrint].set(rest.x, rest.y, rest.z, Math.random() * 100);
      nextPrint = (nextPrint + 1) % MAX_PRINTS;
      uniforms.uPrintCount.value = Math.min(
        uniforms.uPrintCount.value + 1,
        MAX_PRINTS,
      );
    },
    clearPrints() {
      uniforms.uPrintCount.value = 0;
      nextPrint = 0;
    },
    /** Decals in figure space; see `addSurfaceDetail().figure`. */
    setDecals(
      decals: {
        at: THREE.Vector3;
        radius: number;
        color: THREE.Color;
        shade: number;
      }[],
    ) {
      const list = decals.slice(0, MAX_DECALS);
      list.forEach((decal, i) => {
        uniforms.uDecals.value[i].set(
          decal.at.x,
          decal.at.y,
          decal.at.z,
          decal.radius,
        );
        const { r, g, b } = decal.color;
        uniforms.uDecalColors.value[i].set(r, g, b, decal.shade);
      });
      uniforms.uDecalCount.value = list.length;
    },
    /** Folds drawn into the surface around the vertical axis, or none. */
    setRidges(
      ridges: {
        count: number;
        amplitude: number;
        twist: number;
        from: number;
        to: number;
      } | null,
    ) {
      if (!ridges) {
        uniforms.uRidges.value.set(0, 0, 0, 0);
        return;
      }
      uniforms.uRidges.value.set(
        ridges.count,
        ridges.amplitude,
        ridges.twist,
        ridges.from,
      );
      uniforms.uRidgesTo.value = ridges.to;
    },
  };
}

const FRAGMENT_PARS = /* glsl */ `
varying vec3 vRest;
varying vec3 vFigure;
varying float vCavity;
uniform vec4 uPrints[${MAX_PRINTS}];
uniform int uPrintCount;
uniform vec4 uDecals[${MAX_DECALS}];
uniform vec4 uDecalColors[${MAX_DECALS}];
uniform int uDecalCount;
uniform vec4 uRidges;
uniform float uRidgesTo;

float clayHash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float clayNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(clayHash(i), clayHash(i + vec3(1, 0, 0)), f.x),
        mix(clayHash(i + vec3(0, 1, 0)), clayHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(clayHash(i + vec3(0, 0, 1)), clayHash(i + vec3(1, 0, 1)), f.x),
        mix(clayHash(i + vec3(0, 1, 1)), clayHash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}

/** Surface height, in world units, at a rest-space point. */
float clayHeight(vec3 p, vec3 figure) {
  float h = 0.0;
  // Soft unevenness: hand-rolled, not machined.
  h += (clayNoise(p * 6.0) - 0.5) * 0.012;
  // Smudges: noise stretched along one axis, as if dragged by a thumb.
  h += (clayNoise(p * vec3(26.0, 9.0, 26.0) + 3.1) - 0.5) * 0.004;
  // Grain.
  h += (clayNoise(p * 70.0) - 0.5) * 0.0022;
  h += (clayNoise(p * 160.0) - 0.5) * 0.0009;

  for (int i = 0; i < ${MAX_PRINTS}; i++) {
    if (i >= uPrintCount) break;
    vec4 print = uPrints[i];
    float r = length(p - print.xyz);
    // Warped rings read as a whorl rather than a target.
    float warp = (clayNoise(p * 9.0 + print.w) - 0.5) * 0.08;
    // Exaggerated, claymation-style: a real ridge would be sub-pixel here.
    float phase = (r + warp) * 115.0;
    // Fade ridges out before they get finer than a pixel.
    float detail = clamp(1.5 - fwidth(phase), 0.0, 1.0);
    float within = 1.0 - smoothstep(0.1, 0.24, r);
    h += sin(phase) * 0.0055 * within * detail;
  }

  // Folds: creased, not wavy — a ridge's crest is sharper than its trough.
  if (uRidges.y > 0.0) {
    vec3 n = normalize(p);
    float elevation = n.y;
    float angle = atan(n.z, n.x);
    float phase = uRidges.x * angle + uRidges.z * elevation;
    float fold = 1.0 - pow(abs(sin(phase * 0.5)), 0.6) * 2.0;
    float fade =
      smoothstep(uRidges.w, uRidges.w + 0.3, elevation) *
      (1.0 - smoothstep(uRidgesTo - 0.08, uRidgesTo, elevation));
    h += fold * uRidges.y * fade;
  }

  // Decals are beads pressed on, so they stand a little proud.
  for (int i = 0; i < ${MAX_DECALS}; i++) {
    if (i >= uDecalCount) break;
    float r = uDecals[i].w;
    float q = clamp(1.0 - pow(length(figure - uDecals[i].xyz) / r, 2.0), 0.0, 1.0);
    // Beads stand proud; shades sink in.
    h += sqrt(q) * r * (uDecalColors[i].w > 0.0 ? -0.5 : 0.3);
  }
  return h;
}

/** Bump mapping without UVs (Mikkelsen 2010), as three's own bump map does. */
vec3 clayBump(vec3 surfPos, vec3 surfNorm, float h, float faceDir) {
  vec3 sigmaX = dFdx(surfPos);
  vec3 sigmaY = dFdy(surfPos);
  vec3 r1 = cross(sigmaY, surfNorm);
  vec3 r2 = cross(surfNorm, sigmaX);
  float det = dot(sigmaX, r1) * faceDir;
  vec2 dh = vec2(dFdx(h), dFdy(h));
  vec3 grad = sign(det) * (dh.x * r1 + dh.y * r2);
  return normalize(abs(det) * surfNorm - grad);
}
`;

/**
 * Mean curvature per vertex of an indexed surface, from the umbrella
 * operator: how far each vertex's ring sits above (a dent) or below (a bump)
 * it along its normal, over the ring's squared size. Also smooths a
 * per-vertex field over the same rings.
 */
export function createCurvature(index: ArrayLike<number>, count: number) {
  const sets = Array.from({ length: count }, () => new Set<number>());
  for (let t = 0; t < index.length; t += 3) {
    const a = index[t];
    const b = index[t + 1];
    const c = index[t + 2];
    sets[a].add(b).add(c);
    sets[b].add(a).add(c);
    sets[c].add(a).add(b);
  }
  const start = new Int32Array(count + 1);
  const flat: number[] = [];
  sets.forEach((set, i) => {
    start[i] = flat.length;
    flat.push(...set);
  });
  start[count] = flat.length;
  const neighbours = Int32Array.from(flat);
  const scratch = new Float32Array(count);

  return {
    /** `normals` must be unit length. */
    compute(
      p: ArrayLike<number>,
      normals: ArrayLike<number>,
      out: Float32Array,
    ) {
      for (let i = 0; i < count; i++) {
        const from = start[i];
        const to = start[i + 1];
        const k = i * 3;
        let ax = 0;
        let ay = 0;
        let az = 0;
        let spread = 0;
        for (let j = from; j < to; j++) {
          const m = neighbours[j] * 3;
          const dx = p[m] - p[k];
          const dy = p[m + 1] - p[k + 1];
          const dz = p[m + 2] - p[k + 2];
          ax += dx;
          ay += dy;
          az += dz;
          spread += dx * dx + dy * dy + dz * dz;
        }
        const ring = to - from;
        const along =
          (ax * normals[k] + ay * normals[k + 1] + az * normals[k + 2]) / ring;
        out[i] = (4 * along) / (spread / ring || 1);
      }
    },
    /** One pass of averaging each value with its ring. */
    smooth(values: Float32Array) {
      for (let i = 0; i < count; i++) {
        let sum = values[i];
        for (let j = start[i]; j < start[i + 1]; j++)
          sum += values[neighbours[j]];
        scratch[i] = sum / (start[i + 1] - start[i] + 1);
      }
      values.set(scratch);
    },
  };
}

/** Curvature relative to rest, as the material's −1…1 cavity term. */
export function toCavity(curvature: Float32Array, rest: Float32Array) {
  for (let i = 0; i < curvature.length; i++) {
    curvature[i] = Math.max(-1, Math.min(1, (curvature[i] - rest[i]) * 0.14));
  }
}

/**
 * Adds what the clay material reads from a mesh — its rest positions and a
 * per-vertex cavity term. Call it on the geometry in its rest shape.
 *
 * `update()` derives the cavity from this mesh's own curvature. A mesh that
 * is carried by a coarser one should instead write `cavity` itself from the
 * coarse surface and call `commit()`: a fine mesh interpolated over coarse
 * triangles has curvature seams at their edges that would show as a grid.
 */
export function addSurfaceDetail(geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const count = position.count;
  const restAttribute = new THREE.BufferAttribute(
    Float32Array.from(position.array),
    3,
  );
  geometry.setAttribute("aRest", restAttribute);
  const figureAttribute = new THREE.BufferAttribute(
    new Float32Array(count * 3),
    3,
  );
  geometry.setAttribute("aFigure", figureAttribute);
  const cavityAttribute = new THREE.BufferAttribute(new Float32Array(count), 1);
  cavityAttribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("aCavity", cavityAttribute);
  const cavity = cavityAttribute.array as Float32Array;

  let curvature: ReturnType<typeof createCurvature> | null = null;
  let rest: Float32Array | null = null;
  const normals = () => geometry.getAttribute("normal").array as Float32Array;

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const bary = new THREE.Vector3();

  return {
    cavity,
    /** Where each vertex sits on the current figure, for its decals. */
    figure: figureAttribute.array as Float32Array,
    commit() {
      cavityAttribute.needsUpdate = true;
    },
    commitFigure() {
      figureAttribute.needsUpdate = true;
    },
    /** After positions and normals have been updated. */
    update() {
      if (!curvature || !rest) {
        curvature = createCurvature(geometry.getIndex()!.array, count);
        rest = new Float32Array(count);
        curvature.compute(restAttribute.array, normals(), rest);
      }
      curvature.compute(position.array, normals(), cavity);
      toCavity(cavity, rest);
      cavityAttribute.needsUpdate = true;
    },
    /** The rest-space point under a raycast hit on this geometry. */
    restPointOf(hit: THREE.Intersection, out: THREE.Vector3) {
      const face = hit.face!;
      a.fromBufferAttribute(position, face.a);
      b.fromBufferAttribute(position, face.b);
      c.fromBufferAttribute(position, face.c);
      const local = hit.object.worldToLocal(hit.point.clone());
      if (!THREE.Triangle.getBarycoord(local, a, b, c, bary)) {
        return out.fromBufferAttribute(restAttribute, face.a);
      }
      a.fromBufferAttribute(restAttribute, face.a);
      b.fromBufferAttribute(restAttribute, face.b);
      c.fromBufferAttribute(restAttribute, face.c);
      return out
        .copy(a)
        .multiplyScalar(bary.x)
        .addScaledVector(b, bary.y)
        .addScaledVector(c, bary.z);
    },
  };
}
