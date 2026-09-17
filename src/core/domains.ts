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
  BIOLOGY: 0x47e19d3f >>> 0,
  ABIOGENESIS: 0x9e3779b9 >>> 0,
  LIFE: 0x7a5b3c21 >>> 0,
  TRAIT: 0x62a8d1f5 >>> 0,
  EVOLUTION: 0x18d2f6c3 >>> 0,
  ECOSYSTEM: 0x8f4c2e17 >>> 0,
  CIVILIZATION: 0x5a2d61e9 >>> 0,
  CITY: 0x1f83d9ab >>> 0,
  INDIVIDUAL: 0x4f1bbcdc >>> 0,

  // Cultural & temporal domains
  CULTURE: 0x2c1b3f71 >>> 0,
  TECHNOLOGY: 0x6d9f8e43 >>> 0,
  EVENT: 0x35a9d187 >>> 0,

  // Civilization & sociological hierarchy
  INTELLIGENCE: 0x51f38e29 >>> 0,
  SOCIETY: 0x93a4b7c1 >>> 0,
  POPULATION: 0x76c3e215 >>> 0,
  RESOURCE: 0xa8f192b3 >>> 0,
  SETTLEMENT: 0x3d7b4e91 >>> 0,
  INDUSTRY: 0x6e2c8a57 >>> 0,
  COLLAPSE: 0x4b9a1e83 >>> 0,

  // Phase 8: Interplanetary expansion & spacefaring domains
  EXPANSION: 0xb4e17f25 >>> 0,
  SPACEFLIGHT: 0x92d5c417 >>> 0,
  ORBITAL: 0x5e3a89c1 >>> 0,
  COLONY: 0x7c219ba3 >>> 0,
  TRANSPORT: 0x18f4a769 >>> 0,
  INFRASTRUCTURE: 0x43b8e5d7 >>> 0,
  TERRAFORMING: 0x2e91cf8b >>> 0,
  INTERPLANETARY: 0x8d34a1e5 >>> 0,
} as const;

export type DomainType = keyof typeof DOMAIN;
