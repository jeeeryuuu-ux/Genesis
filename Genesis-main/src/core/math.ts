/**
 * @license Apache-2.0
 * GENESIS DETERMINISTIC MATHEMATICAL UTILITIES
 *
 * Lightweight procedural vector, interpolation, and spatial calculation functions.
 * All operations are pure, side-effect free, and deterministic.
 */

import { hash32 } from './hash.js';
import type { Seed, Vector3D } from './types.js';

/**
 * Constrains a value to the inclusive range [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new Error(`[Math clamp] min (${min}) cannot exceed max (${max})`);
  }
  return Math.min(Math.max(value, min), max);
}

/**
 * Performs linear interpolation between two values.
 * When t = 0, returns a; when t = 1, returns b.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Computes the normalized parametric factor t of value in the range [a, b].
 * Returns 0 if value == a, and 1 if value == b.
 */
export function inverseLerp(a: number, b: number, value: number): number {
  if (Math.abs(b - a) < 1e-12) return 0;
  return clamp((value - a) / (b - a), 0, 1);
}

/**
 * Remaps a value from an input range to an output range.
 */
export function remap(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  const t = inverseLerp(inMin, inMax, value);
  return lerp(outMin, outMax, t);
}

/**
 * Evaluates smooth Hermite interpolation between 0 and 1.
 * Useful for smooth camera transitions and continuous procedural terrain curves.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Converts degrees to radians.
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Converts radians to degrees.
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Computes Euclidean distance between two 2D points.
 */
export function distance2D(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.hypot(dx, dy);
}

/**
 * Computes Euclidean distance between two 3D vectors.
 */
export function distance3D(v1: Vector3D, v2: Vector3D): number {
  const dx = v2.x - v1.x;
  const dy = v2.y - v1.y;
  const dz = v2.z - v1.z;
  return Math.hypot(dx, dy, dz);
}

/**
 * Adds two 3D vectors.
 */
export function addVector3D(a: Vector3D, b: Vector3D): Vector3D {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/**
 * Subtracts vector b from vector a.
 */
export function subtractVector3D(a: Vector3D, b: Vector3D): Vector3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/**
 * Multiplies vector components by a scalar factor.
 */
export function scaleVector3D(v: Vector3D, scalar: number): Vector3D {
  return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar };
}

/**
 * Computes vector length (magnitude).
 */
export function lengthVector3D(v: Vector3D): number {
  return Math.hypot(v.x, v.y, v.z);
}

/**
 * Returns a unit-length normalized vector. If magnitude is 0, returns origin.
 */
export function normalizeVector3D(v: Vector3D): Vector3D {
  const len = lengthVector3D(v);
  if (len < 1e-12) {
    return { x: 0, y: 0, z: 0 };
  }
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/**
 * Computes dot product of two 3D vectors.
 */
export function dotProduct3D(a: Vector3D, b: Vector3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Computes cross product of two 3D vectors.
 */
export function crossProduct3D(a: Vector3D, b: Vector3D): Vector3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * Deterministic Value Noise Interface.
 * Defines the contract for lightweight spatial procedural generators.
 */
export interface DeterministicNoise {
  sample1D(x: number): number;
  sample2D(x: number, y: number): number;
}

/**
 * Lightweight 1D/2D deterministic coherent value noise implementation
 * based on hash-interpolated grid vertices.
 */
export class DeterministicValueNoise implements DeterministicNoise {
  private readonly seed: Seed;

  constructor(seed: Seed) {
    this.seed = seed >>> 0;
  }

  public sample1D(x: number): number {
    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const fx = x - x0;
    const s = smoothstep(0, 1, fx);

    const v0 = (hash32(x0, this.seed) >>> 0) / 4294967296;
    const v1 = (hash32(x1, this.seed) >>> 0) / 4294967296;

    return lerp(v0, v1, s);
  }

  public sample2D(x: number, y: number): number {
    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const y0 = Math.floor(y);
    const y1 = y0 + 1;

    const fx = x - x0;
    const fy = y - y0;
    const sx = smoothstep(0, 1, fx);
    const sy = smoothstep(0, 1, fy);

    // Hash grid corners
    const h00 = (hash32(Math.imul(x0, 374761393) ^ Math.imul(y0, 668265263), this.seed) >>> 0) / 4294967296;
    const h10 = (hash32(Math.imul(x1, 374761393) ^ Math.imul(y0, 668265263), this.seed) >>> 0) / 4294967296;
    const h01 = (hash32(Math.imul(x0, 374761393) ^ Math.imul(y1, 668265263), this.seed) >>> 0) / 4294967296;
    const h11 = (hash32(Math.imul(x1, 374761393) ^ Math.imul(y1, 668265263), this.seed) >>> 0) / 4294967296;

    const ix0 = lerp(h00, h10, sx);
    const ix1 = lerp(h01, h11, sx);

    return lerp(ix0, ix1, sy);
  }
}
