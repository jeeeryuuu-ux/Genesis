/**
 * @license Apache-2.0
 * GENESIS DETERMINISTIC PRNG (Mulberry32)
 *
 * Implements a robust, high-performance 32-bit pseudo-random number generator.
 *
 * ALGORITHM: Mulberry32
 * - State size: 32 bits (1 single unsigned 32-bit integer).
 * - Period: 2^32 (~4.29 billion distinct states).
 * - Passing battery: Full passes on standard statistical randomness suites (Dieharder, PractRand).
 * - Determinism: Operates strictly using Math.imul and >>> 0 integer bitwise operations.
 *   Guarantees bit-identical output across V8, JavaScriptCore, and SpiderMonkey.
 *
 * ARCHITECTURAL SAFETY:
 * Never change the PRNG state transition equation. Doing so will alter the generation
 * sequence for every seed and invalidate previously generated worlds.
 */

import type { Seed } from './types.js';

export interface Random {
  /**
   * Returns a deterministic pseudo-random floating-point number in the half-open interval [0, 1).
   */
  next(): number;

  /**
   * Returns a deterministic integer in the inclusive range [min, max].
   * @param min Minimum integer bound (inclusive)
   * @param max Maximum integer bound (inclusive)
   */
  nextInt(min: number, max: number): number;

  /**
   * Returns a deterministic float in the half-open interval [min, max).
   * @param min Minimum bound (inclusive)
   * @param max Maximum bound (exclusive)
   */
  nextFloat(min: number, max: number): number;

  /**
   * Evaluates a Bernoulli trial with the specified probability in [0, 1].
   * Returns true with probability p, false with probability (1 - p).
   */
  chance(probability: number): boolean;

  /**
   * Deterministically selects an element from a non-empty array.
   */
  pick<T>(array: readonly T[]): T;

  /**
   * Returns current internal 32-bit state.
   */
  getState(): Seed;
}

class Mulberry32Random implements Random {
  private state: number;

  constructor(initialSeed: Seed) {
    // Coerce to unsigned 32-bit integer
    this.state = initialSeed >>> 0;
  }

  public next(): number {
    // Mulberry32 state step
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let z = this.state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    const result = ((z ^ (z >>> 14)) >>> 0);
    // Divide by 2^32 to yield float in [0, 1)
    return result / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new Error(`[PRNG nextInt] Bounds must be finite numbers: min=${min}, max=${max}`);
    }
    const floorMin = Math.floor(min);
    const floorMax = Math.floor(max);
    if (floorMin > floorMax) {
      throw new Error(`[PRNG nextInt] min (${floorMin}) cannot be greater than max (${floorMax})`);
    }
    if (floorMin === floorMax) {
      return floorMin;
    }
    const range = floorMax - floorMin + 1;
    return floorMin + Math.floor(this.next() * range);
  }

  public nextFloat(min: number, max: number): number {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new Error(`[PRNG nextFloat] Bounds must be finite numbers: min=${min}, max=${max}`);
    }
    if (min > max) {
      throw new Error(`[PRNG nextFloat] min (${min}) cannot be greater than max (${max})`);
    }
    if (min === max) {
      return min;
    }
    return min + this.next() * (max - min);
  }

  public chance(probability: number): boolean {
    if (!Number.isFinite(probability)) {
      throw new Error(`[PRNG chance] Probability must be a finite number: ${probability}`);
    }
    if (probability <= 0) return false;
    if (probability >= 1) return true;
    return this.next() < probability;
  }

  public pick<T>(array: readonly T[]): T {
    if (!array || array.length === 0) {
      throw new Error('[PRNG pick] Cannot pick from an empty or undefined array');
    }
    const index = this.nextInt(0, array.length - 1);
    return array[index];
  }

  public getState(): Seed {
    return this.state >>> 0;
  }
}

/**
 * Factory function to instantiate an isolated, deterministic PRNG stream.
 *
 * @param seed 32-bit integer seed
 * @returns An instance implementing the Random interface
 */
export function createPRNG(seed: Seed): Random {
  return new Mulberry32Random(seed);
}
