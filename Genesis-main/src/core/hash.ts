/**
 * @license Apache-2.0
 * GENESIS DETERMINISTIC HASHING ENGINE
 *
 * Implements strict, portable 32-bit unsigned integer hashing for reproducible
 * procedural derivation.
 *
 * ARCHITECTURAL RATIONALE:
 * 1. Why Math.random() is strictly forbidden:
 *    JavaScript's native Math.random() is unseeded, engine-dependent (V8 uses XorShift128+,
 *    SpiderMonkey may differ), and cannot be wound forward, backward, or shared across users.
 * 2. Why Math.imul() is mandatory:
 *    Standard JavaScript multiplication `a * b` treats operands as IEEE-754 64-bit floats.
 *    Floats lose integer precision beyond 2^53 - 1. `Math.imul(a, b)` performs true C-level
 *    32-bit hardware integer multiplication with wrap-around, ensuring identical bit results
 *    across all JavaScript runtime engines (V8, WebKit, SpiderMonkey, Node.js).
 * 3. Why `>>> 0` is required:
 *    All bitwise operators in JavaScript (`^`, `|`, `&`, `<<`, `>>`) implicitly cast operands
 *    to signed 32-bit integers [-2147483648, 2147483647]. The zero-fill unsigned right shift
 *    operator `>>> 0` reinterprets the internal binary representation as an unsigned 32-bit
 *    integer in the range [0, 4294967295].
 * 4. Why bit avalanche stages exist:
 *    Successive XOR shifts (`h ^ (h >>> 16)`) and multiplications by high-entropy constants
 *    (MurmurHash3 fmix32 finalizer) ensure that even a single-bit difference in the input
 *    seed or entity index completely scrambles every output bit with ~50% bit flip probability.
 */

import type { Seed } from './types.js';

/**
 * MurmurHash3 32-bit integer finalizer (fmix32).
 * Maps any 32-bit integer into a uniformly distributed unsigned 32-bit hash.
 *
 * @param input Integer to hash
 * @param seed Optional seed modifier (defaults to 0)
 * @returns An unsigned 32-bit integer in [0, 4294967295]
 */
export function hash32(input: number, seed: number = 0): Seed {
  // Step 1: Force inputs into unsigned 32-bit representations and mix with initial seed
  let h = ((input >>> 0) ^ (seed >>> 0)) >>> 0;

  // Step 2: First avalanche multiplication with Murmur3 prime constant
  // 0x85ebca6b = 2246822507 (high-entropy odd prime constant)
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;

  // Step 3: Second avalanche multiplication
  // 0xc2b2ae35 = 3266489909
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;

  // Step 4: Final bit mix to ensure low bits are thoroughly scrambled by high bits
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Deterministically combines a parent seed, an entity index, and a domain salt
 * into an independent child seed.
 *
 * PROPERTIES:
 * - Deterministic: Given identical inputs, always yields the exact same child seed.
 * - Sibling Independent: Deriving child N requires 0 knowledge of child N-1.
 * - Domain Isolated: Sibling systems, planets, or stars at the same index will not
 *   produce identical seeds due to the distinct domain salt.
 *
 * @param parentSeed The upstream parent entity's 32-bit seed
 * @param childIndex The index of the child within the parent (e.g. planet index 0, 1, 2)
 * @param domainSalt The domain constant from DOMAIN table
 * @returns Independent 32-bit unsigned child seed
 */
export function combineSeeds(
  parentSeed: number,
  childIndex: number,
  domainSalt: number
): Seed {
  // Hash the child index using the parent seed as salt
  const step1 = hash32(childIndex, parentSeed);
  // Re-hash with the domain salt to guarantee domain isolation
  const step2 = hash32(domainSalt, step1);
  return step2 >>> 0;
}
