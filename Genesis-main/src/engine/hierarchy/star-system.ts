/**
 * @license Apache-2.0
 * GENESIS STAR & STAR SYSTEM GENERATOR
 *
 * Procedurally generates stellar systems and constituent stars.
 * Each star in a multiple-star system is derived from its own independent seed.
 */

import { deriveStarSeed, deriveSystemSeed } from '../../core/hierarchy.js';
import { createPRNG } from '../../core/prng.js';
import type {
  EntityId,
  HabitableZoneAU,
  Seed,
  SpectralClass,
  Star,
  StarSystem,
  Vector3D,
} from '../../core/types.js';
import { generateStarName, generateSystemName } from './naming.js';

/**
 * Validates a generated Star entity.
 */
export function validateStar(star: Star): void {
  if (!star.id || !star.name) {
    throw new Error('[validateStar] Star must have valid ID and name');
  }
  if (!Number.isFinite(star.massSolar) || star.massSolar <= 0) {
    throw new Error(`[validateStar] Mass must be positive: ${star.massSolar}`);
  }
  if (!Number.isFinite(star.radiusSolar) || star.radiusSolar <= 0) {
    throw new Error(`[validateStar] Radius must be positive: ${star.radiusSolar}`);
  }
  if (!Number.isFinite(star.luminositySolar) || star.luminositySolar < 0) {
    throw new Error(`[validateStar] Luminosity cannot be negative: ${star.luminositySolar}`);
  }
  if (!Number.isFinite(star.surfaceTempKelvin) || star.surfaceTempKelvin < 0) {
    throw new Error(`[validateStar] Surface temperature cannot be negative: ${star.surfaceTempKelvin}`);
  }
}

/**
 * Validates a generated StarSystem entity.
 */
export function validateStarSystem(system: StarSystem): void {
  if (!system.id || !system.name) {
    throw new Error('[validateStarSystem] System must have valid ID and name');
  }
  if (!system.stars || system.stars.length === 0) {
    throw new Error('[validateStarSystem] System must contain at least 1 star');
  }
  if (!Number.isInteger(system.planetCount) || system.planetCount < 0) {
    throw new Error(`[validateStarSystem] Planet count must be a non-negative integer: ${system.planetCount}`);
  }
  if (
    !Number.isFinite(system.habitableZoneAU.inner) ||
    !Number.isFinite(system.habitableZoneAU.outer) ||
    system.habitableZoneAU.inner < 0 ||
    system.habitableZoneAU.inner > system.habitableZoneAU.outer
  ) {
    throw new Error(`[validateStarSystem] Invalid habitable zone: ${JSON.stringify(system.habitableZoneAU)}`);
  }
  system.stars.forEach(validateStar);
}

/**
 * Generates an individual Star deterministically from its derived star seed.
 * Enforces internal physical correlation: spectral class -> mass -> radius -> luminosity -> temperature.
 */
export function generateStar(
  systemSeed: Seed,
  starIndex: number,
  systemId: EntityId,
  systemName: string
): Star {
  const starSeed = deriveStarSeed(systemSeed, starIndex);
  const prng = createPRNG(starSeed);

  const id: EntityId = `${systemId}/star${starIndex}`;
  const name = generateStarName(systemName, starIndex);

  // Spectral class probability distribution (astronomically weighted)
  // M dwarfs are the vast majority of stars in the cosmos
  const roll = prng.next();
  let spectralClass: SpectralClass;

  if (roll < 0.70) {
    spectralClass = 'M'; // 70% Red dwarf
  } else if (roll < 0.83) {
    spectralClass = 'K'; // 13% Orange dwarf
  } else if (roll < 0.91) {
    spectralClass = 'G'; // 8% Yellow dwarf (Sun-like)
  } else if (roll < 0.96) {
    spectralClass = 'F'; // 5% Yellow-white
  } else if (roll < 0.985) {
    spectralClass = 'A'; // 2.5% White
  } else if (roll < 0.995) {
    spectralClass = 'B'; // 1.0% Blue-white
  } else if (roll < 0.997) {
    spectralClass = 'O'; // 0.2% Blue supergiant
  } else if (roll < 0.9985) {
    spectralClass = 'NEUTRON'; // 0.15% Compact remnant
  } else {
    spectralClass = 'BLACK_HOLE'; // 0.15% Stellar-mass black hole
  }

  // Consistent astrophysical derivations
  let massSolar: number;
  let radiusSolar: number;
  let surfaceTempKelvin: number;
  let luminositySolar: number;

  switch (spectralClass) {
    case 'O':
      massSolar = prng.nextFloat(16.0, 45.0);
      surfaceTempKelvin = Math.round(prng.nextFloat(30_000, 48_000));
      radiusSolar = prng.nextFloat(6.5, 14.0);
      luminositySolar = Math.pow(massSolar, 3.5);
      break;
    case 'B':
      massSolar = prng.nextFloat(2.1, 16.0);
      surfaceTempKelvin = Math.round(prng.nextFloat(10_000, 30_000));
      radiusSolar = prng.nextFloat(1.8, 6.5);
      luminositySolar = Math.pow(massSolar, 3.5);
      break;
    case 'A':
      massSolar = prng.nextFloat(1.4, 2.1);
      surfaceTempKelvin = Math.round(prng.nextFloat(7_500, 10_000));
      radiusSolar = prng.nextFloat(1.4, 1.8);
      luminositySolar = Math.pow(massSolar, 3.8);
      break;
    case 'F':
      massSolar = prng.nextFloat(1.04, 1.4);
      surfaceTempKelvin = Math.round(prng.nextFloat(6_000, 7_500));
      radiusSolar = prng.nextFloat(1.15, 1.4);
      luminositySolar = Math.pow(massSolar, 4.0);
      break;
    case 'G':
      massSolar = prng.nextFloat(0.8, 1.04);
      surfaceTempKelvin = Math.round(prng.nextFloat(5_200, 6_000));
      radiusSolar = prng.nextFloat(0.9, 1.15);
      luminositySolar = Math.pow(massSolar, 4.0);
      break;
    case 'K':
      massSolar = prng.nextFloat(0.45, 0.8);
      surfaceTempKelvin = Math.round(prng.nextFloat(3_700, 5_200));
      radiusSolar = prng.nextFloat(0.7, 0.9);
      luminositySolar = 0.4 * Math.pow(massSolar, 4.0);
      break;
    case 'M':
      massSolar = prng.nextFloat(0.08, 0.45);
      surfaceTempKelvin = Math.round(prng.nextFloat(2_400, 3_700));
      radiusSolar = prng.nextFloat(0.12, 0.7);
      luminositySolar = 0.05 * Math.pow(massSolar, 3.0);
      break;
    case 'NEUTRON':
      massSolar = prng.nextFloat(1.35, 2.1);
      surfaceTempKelvin = Math.round(prng.nextFloat(200_000, 800_000));
      radiusSolar = 0.000015; // ~10-15 km radius
      luminositySolar = 0.0005;
      break;
    case 'BLACK_HOLE':
      massSolar = prng.nextFloat(3.0, 25.0);
      surfaceTempKelvin = 0; // Event horizon
      radiusSolar = (massSolar * 2.95) / 695700; // Schwarzschild radius in solar radii
      luminositySolar = 0;
      break;
  }

  // Rounded values for stability and clean precision
  const star: Star = {
    id,
    seed: starSeed,
    name,
    spectralClass,
    massSolar: Number(massSolar.toFixed(3)),
    radiusSolar: Number(Math.max(1e-6, radiusSolar).toFixed(6)),
    luminositySolar: Number(luminositySolar.toFixed(6)),
    surfaceTempKelvin,
  };

  validateStar(star);
  return star;
}

/**
 * Computes the circumstellar habitable zone in Astronomical Units (AU)
 * using standard stellar flux boundaries based on Kopparapu et al.
 */
export function calculateHabitableZoneAU(luminositySolar: number): HabitableZoneAU {
  if (luminositySolar <= 1e-6) {
    return { inner: 0.01, outer: 0.03 };
  }
  const inner = Math.max(0.02, Math.sqrt(luminositySolar / 1.1));
  const outer = Math.max(inner + 0.05, Math.sqrt(luminositySolar / 0.53));
  return {
    inner: Number(inner.toFixed(3)),
    outer: Number(outer.toFixed(3)),
  };
}

/**
 * Procedurally generates a StarSystem directly from galaxy seed and system index.
 */
export function generateStarSystem(
  galaxySeed: Seed,
  systemIndex: number,
  galaxyId?: EntityId
): StarSystem {
  if (systemIndex < 0 || !Number.isInteger(systemIndex)) {
    throw new Error(`[generateStarSystem] systemIndex must be a non-negative integer: ${systemIndex}`);
  }

  const systemSeed = deriveSystemSeed(galaxySeed, systemIndex);
  const prng = createPRNG(systemSeed);

  const resolvedGalaxyId = galaxyId ?? `g${galaxySeed}`;
  const id: EntityId = `${resolvedGalaxyId}/s${systemIndex}`;
  const name = generateSystemName(systemSeed, systemIndex);

  // Star Multiplicity:
  // - Single star: 65%
  // - Binary: 30%
  // - Trinary: 5%
  const multRoll = prng.next();
  let starCount = 1;
  if (multRoll >= 0.65 && multRoll < 0.95) {
    starCount = 2;
  } else if (multRoll >= 0.95) {
    starCount = 3;
  }

  // Generate each star independently using its own derived star seed
  const stars: Star[] = [];
  for (let i = 0; i < starCount; i++) {
    stars.push(generateStar(systemSeed, i, id, name));
  }

  // Habitable zone determined by total combined luminosity of system stars
  const combinedLuminosity = stars.reduce((acc, s) => acc + s.luminositySolar, 0);
  const habitableZoneAU = calculateHabitableZoneAU(combinedLuminosity);

  // Position within galaxy: cylindrical distribution (radius, theta, z)
  const angle = prng.nextFloat(0, Math.PI * 2);
  const diskDist = Math.sqrt(prng.next()) * 45_000; // Light years from galactic core
  const zScatter = prng.nextFloat(-1_000, 1_000);

  const positionInGalaxy: Vector3D = {
    x: Math.round(Math.cos(angle) * diskDist),
    y: Math.round(Math.sin(angle) * diskDist),
    z: Math.round(zScatter),
  };

  // Planet count: 0 to 14 planets (probabilistically weighted)
  // Non-luminous systems (Black hole, neutron star) have fewer planets
  const isDeadCore = stars[0].spectralClass === 'BLACK_HOLE' || stars[0].spectralClass === 'NEUTRON';
  const maxPlanets = isDeadCore ? 3 : 14;
  const planetCount = prng.nextInt(0, maxPlanets);

  const system: StarSystem = {
    id,
    seed: systemSeed,
    galaxyId: resolvedGalaxyId,
    name,
    positionInGalaxy,
    stars,
    planetCount,
    habitableZoneAU,
  };

  validateStarSystem(system);
  return system;
}
