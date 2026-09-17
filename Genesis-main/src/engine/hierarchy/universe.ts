/**
 * @license Apache-2.0
 * GENESIS UNIVERSE GENERATOR
 *
 * Generates the root Universe procedural envelope.
 *
 * CRITICAL ARCHITECTURAL GUARANTEE:
 * Does NOT instantiate descendant galaxies or stars.
 * Represents only the macro-scale cosmological envelope.
 */

import { createPRNG } from '../../core/prng.js';
import type { Seed, Universe } from '../../core/types.js';
import { generateUniverseName } from './naming.js';

/**
 * Validates a generated Universe entity against physical and simulation constraints.
 */
export function validateUniverse(universe: Universe): void {
  if (!Number.isFinite(universe.seed)) {
    throw new Error('[validateUniverse] Seed must be a finite number');
  }
  if (!universe.name || universe.name.trim().length === 0) {
    throw new Error('[validateUniverse] Name must be non-empty');
  }
  if (!Number.isFinite(universe.ageYears) || universe.ageYears < 5e9 || universe.ageYears > 30e9) {
    throw new Error(`[validateUniverse] Age out of bounds: ${universe.ageYears}`);
  }
  if (!Number.isFinite(universe.totalGalaxiesEstimate) || universe.totalGalaxiesEstimate < 1e9) {
    throw new Error(`[validateUniverse] Galaxy estimate invalid: ${universe.totalGalaxiesEstimate}`);
  }
  if (!Number.isFinite(universe.cosmologicalConstant) || universe.cosmologicalConstant < 0 || universe.cosmologicalConstant > 1) {
    throw new Error(`[validateUniverse] Cosmological constant out of [0, 1]: ${universe.cosmologicalConstant}`);
  }
}

/**
 * Procedurally generates the root Universe envelope.
 *
 * SIMULATION PARAMETERS:
 * - ageYears: 10 to 20 billion years (derived from seed).
 * - totalGalaxiesEstimate: Order of magnitude 10^11 to 2 * 10^12 galaxies.
 * - cosmologicalConstant: Normalized simulation parameter representing vacuum energy pressure.
 *
 * @param seed Root 32-bit unsigned integer universe seed
 */
export function generateUniverse(seed: Seed): Universe {
  const prng = createPRNG(seed);

  const name = generateUniverseName(seed);

  // Cosmic age: 10.0 to 20.0 billion years
  const ageBillionYears = prng.nextFloat(10.0, 20.0);
  const ageYears = Math.round(ageBillionYears * 1e9);

  // Total galaxies estimate: log-uniform distribution between 100 billion (1e11) and 2 trillion (2e12)
  const logMin = Math.log10(1e11);
  const logMax = Math.log10(2e12);
  const totalGalaxiesEstimate = Math.round(Math.pow(10, prng.nextFloat(logMin, logMax)));

  // Cosmological constant: normalized procedural simulation parameter around 0.65 to 0.75
  const cosmologicalConstant = prng.nextFloat(0.65, 0.75);

  const universe: Universe = {
    seed: seed >>> 0,
    name,
    ageYears,
    totalGalaxiesEstimate,
    cosmologicalConstant,
  };

  validateUniverse(universe);
  return universe;
}
