import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { SPHERE_CONFIG } from "./artifact.constants";

export function createArtifactGeometry(): THREE.BufferGeometry {
  const raw = new THREE.IcosahedronGeometry(
    SPHERE_CONFIG.radius,
    SPHERE_CONFIG.detail,
  );

  // Merge duplicate vertices so shared edges stay connected during displacement
  const geo = mergeVertices(raw);
  geo.computeVertexNormals();

  return geo;
}

// ---------------------------------------------------------------------------
// 3D Simplex noise — Stefan Gustavson's classic, zero dependencies.
// Returns values in roughly [-1, 1].
// ---------------------------------------------------------------------------

const F3 = 1 / 3;
const G3 = 1 / 6;

const GRAD3: [number, number, number][] = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];

const PERM = new Uint8Array(512);
const PERM_MOD12 = new Uint8Array(512);

(function initPermutation() {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor((i + 1) * seededRandom(i));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) {
    PERM[i] = p[i & 255];
    PERM_MOD12[i] = PERM[i] % 12;
  }
})();

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function dot3(g: [number, number, number], x: number, y: number, z: number) {
  return g[0] * x + g[1] * y + g[2] * z;
}

export function simplex3(xin: number, yin: number, zin: number): number {
  const s = (xin + yin + zin) * F3;
  const i = Math.floor(xin + s);
  const j = Math.floor(yin + s);
  const k = Math.floor(zin + s);
  const t = (i + j + k) * G3;

  const x0 = xin - (i - t);
  const y0 = yin - (j - t);
  const z0 = zin - (k - t);

  let i1: number, j1: number, k1: number;
  let i2: number, j2: number, k2: number;

  if (x0 >= y0) {
    if (y0 >= z0) {
      i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
    } else if (x0 >= z0) {
      i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1;
    } else {
      i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1;
    }
  } else {
    if (y0 < z0) {
      i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1;
    } else if (x0 < z0) {
      i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1;
    } else {
      i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
    }
  }

  const x1 = x0 - i1 + G3;
  const y1 = y0 - j1 + G3;
  const z1 = z0 - k1 + G3;
  const x2 = x0 - i2 + 2 * G3;
  const y2 = y0 - j2 + 2 * G3;
  const z2 = z0 - k2 + 2 * G3;
  const x3 = x0 - 1 + 3 * G3;
  const y3 = y0 - 1 + 3 * G3;
  const z3 = z0 - 1 + 3 * G3;

  const ii = i & 255;
  const jj = j & 255;
  const kk = k & 255;

  let n0 = 0;
  let r0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
  if (r0 > 0) {
    r0 *= r0;
    n0 = r0 * r0 * dot3(GRAD3[PERM_MOD12[ii + PERM[jj + PERM[kk]]]], x0, y0, z0);
  }

  let n1 = 0;
  let r1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
  if (r1 > 0) {
    r1 *= r1;
    n1 = r1 * r1 * dot3(GRAD3[PERM_MOD12[ii + i1 + PERM[jj + j1 + PERM[kk + k1]]]], x1, y1, z1);
  }

  let n2 = 0;
  let r2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
  if (r2 > 0) {
    r2 *= r2;
    n2 = r2 * r2 * dot3(GRAD3[PERM_MOD12[ii + i2 + PERM[jj + j2 + PERM[kk + k2]]]], x2, y2, z2);
  }

  let n3 = 0;
  let r3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
  if (r3 > 0) {
    r3 *= r3;
    n3 = r3 * r3 * dot3(GRAD3[PERM_MOD12[ii + 1 + PERM[jj + 1 + PERM[kk + 1]]]], x3, y3, z3);
  }

  return 32 * (n0 + n1 + n2 + n3);
}
