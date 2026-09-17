/**
 * @license Apache-2.0
 * GENESIS DOMAIN SALTS
 * Fixed, stable 32-bit constants used to separate seed derivation streams.
 *
 * CRITICAL ARCHITECTURAL GUARANTEE:
 * These constants must NEVER be modified, reordered, or generated dynamically.
 * Each salt serves as an independent namespace domain in the 32-bit space,
 * preventing accidental correlation or seed collisions across entity tiers.
 * Changing any salt will invalidate downstream procedural generation across
 * all existing universe seeds.
 */

export const DOMAIN = {
  // Astronomical hierarchy
  GALAXY: 0x85ebca6b >>> 0,
  SYSTEM: 0xc2b2ae35 >>> 0,
  STAR: 0x7feb352d >>> 0,
  PLANET: 0x846ca68b >>> 0,
  MOON: 0x9b1b199d >>> 0,

  // Biological & demographic hierarchy
  SPECIES: 0x3b1c94b7 >>> 0,
  CIVILIZATION: 0x5a2d61e9 >>> 0,
  CITY: 0x1f83d9ab >>> 0,
  INDIVIDUAL: 0x4f1bbcdc >>> 0,

  // Cultural & temporal domains
  CULTURE: 0x2c1b3f71 >>> 0,
  TECHNOLOGY: 0x6d9f8e43 >>> 0,
  EVENT: 0x35a9d187 >>> 0,
} as const;

export type DomainType = keyof typeof DOMAIN;
