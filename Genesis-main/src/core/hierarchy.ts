/**
 * @license Apache-2.0
 * GENESIS SEED HIERARCHY DERIVATION API
 *
 * Provides pure functional seed derivation along the cosmic hierarchy.
 *
 * INDEPENDENCE GUARANTEE:
 * Any child seed is derived purely from (parentSeed, entityIndex, domainSalt).
 * Generating child #5 requires ZERO computation or instantiation of child #0..#4.
 * This is the cornerstone enabling lazy generation across trillions of celestial bodies.
 */

import { DOMAIN } from './domains.js';
import { combineSeeds } from './hash.js';
import type { Seed } from './types.js';

/**
 * Generic derivation helper for any hierarchical level.
 */
export function deriveChildSeed(parentSeed: Seed, childIndex: number, domainSalt: number): Seed {
  return combineSeeds(parentSeed, childIndex, domainSalt);
}

/**
 * Derives a deterministic galaxy seed directly from a universe seed.
 */
export function deriveGalaxySeed(universeSeed: Seed, galaxyIndex: number): Seed {
  return combineSeeds(universeSeed, galaxyIndex, DOMAIN.GALAXY);
}

/**
 * Derives a deterministic star system seed directly from a galaxy seed.
 */
export function deriveSystemSeed(galaxySeed: Seed, systemIndex: number): Seed {
  return combineSeeds(galaxySeed, systemIndex, DOMAIN.SYSTEM);
}

/**
 * Derives a deterministic star seed within a system.
 */
export function deriveStarSeed(systemSeed: Seed, starIndex: number): Seed {
  return combineSeeds(systemSeed, starIndex, DOMAIN.STAR);
}

/**
 * Derives a deterministic planet seed directly from a star system seed.
 */
export function derivePlanetSeed(systemSeed: Seed, planetIndex: number): Seed {
  return combineSeeds(systemSeed, planetIndex, DOMAIN.PLANET);
}

/**
 * Derives a deterministic moon seed directly from a parent planet seed.
 */
export function deriveMoonSeed(planetSeed: Seed, moonIndex: number): Seed {
  return combineSeeds(planetSeed, moonIndex, DOMAIN.MOON);
}

/**
 * Derives a deterministic species seed from a planetary biosphere.
 */
export function deriveSpeciesSeed(planetSeed: Seed, speciesIndex: number): Seed {
  return combineSeeds(planetSeed, speciesIndex, DOMAIN.SPECIES);
}

/**
 * Derives a deterministic civilization seed directly from a planet/species seed.
 */
export function deriveCivilizationSeed(planetSeed: Seed, civilizationIndex: number): Seed {
  return combineSeeds(planetSeed, civilizationIndex, DOMAIN.CIVILIZATION);
}

/**
 * Derives a deterministic city seed directly from a civilization seed.
 */
export function deriveCitySeed(civilizationSeed: Seed, cityIndex: number): Seed {
  return combineSeeds(civilizationSeed, cityIndex, DOMAIN.CITY);
}

/**
 * Derives a deterministic individual seed directly from a city seed.
 */
export function deriveIndividualSeed(citySeed: Seed, individualIndex: number): Seed {
  return combineSeeds(citySeed, individualIndex, DOMAIN.INDIVIDUAL);
}
