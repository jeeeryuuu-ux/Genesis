/**
 * @license Apache-2.0
 * GENESIS ASTRONOMICAL NAMING ENGINE
 *
 * Deterministic procedural catalog designations.
 * Names are derived purely from entity seeds and are NOT authoritative for state.
 */

import { createPRNG } from '../../core/prng.js';
import type { Seed } from '../../core/types.js';

const GALAXY_PREFIXES = ['NGC', 'MESSIER', 'G', 'UGC', 'IC', 'ESO', 'APM', 'LEDa'] as const;
const STAR_PREFIXES = ['KEPLER', 'GLIESE', 'HD', 'HIP', 'TYC', 'WASP', 'TRAPPIST', 'ROSS', 'WOLF'] as const;

/**
 * Derives a deterministic hexadecimal alphanumeric identifier from a 32-bit seed.
 */
function seedHexCode(seed: Seed, length: number = 4): string {
  const hex = (seed >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return hex.slice(-length);
}

/**
 * Generates a deterministic catalog name for a Universe.
 */
export function generateUniverseName(seed: Seed): string {
  const prng = createPRNG(seed);
  const code = seedHexCode(seed, 4);
  const serial = prng.nextInt(100, 999);
  return `COSMOS-${code}-${serial}`;
}

/**
 * Generates a deterministic catalog name for a Galaxy.
 */
export function generateGalaxyName(galaxySeed: Seed, galaxyIndex: number): string {
  const prng = createPRNG(galaxySeed);
  const prefix = prng.pick(GALAXY_PREFIXES);
  const code = seedHexCode(galaxySeed, 4);
  return `${prefix}-${code}-${galaxyIndex}`;
}

/**
 * Generates a deterministic catalog name for a Star System.
 */
export function generateSystemName(systemSeed: Seed, systemIndex: number): string {
  const prng = createPRNG(systemSeed);
  const prefix = prng.pick(STAR_PREFIXES);
  const num = (systemSeed % 9000) + 1000;
  return `${prefix}-${num}`;
}

/**
 * Generates a deterministic designation for a Star in a system.
 */
export function generateStarName(systemName: string, starIndex: number): string {
  const suffixes = ['A', 'B', 'C', 'D'];
  const suffix = suffixes[starIndex] ?? String.fromCharCode(65 + starIndex);
  return `${systemName} ${suffix}`;
}

/**
 * Generates an exoplanet designation following standard IAU conventions (b, c, d...).
 */
export function generatePlanetName(systemName: string, planetIndex: number): string {
  // Exoplanet notation starts at 'b' for first planet (index 0)
  const letter = String.fromCharCode(98 + planetIndex); // 98 = 'b'
  return `${systemName} ${letter}`;
}

/**
 * Generates a moon designation using Roman numerals (I, II, III...).
 */
export function generateMoonName(planetName: string, moonIndex: number): string {
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
  const numeral = romanNumerals[moonIndex] ?? `${moonIndex + 1}`;
  return `${planetName}-${numeral}`;
}
