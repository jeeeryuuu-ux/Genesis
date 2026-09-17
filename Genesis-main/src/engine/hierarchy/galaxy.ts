/**
 * @license Apache-2.0
 * GENESIS GALAXY GENERATOR
 *
 * Procedurally generates individual galaxies from a universe seed and galaxy index.
 * Fully decoupled and lazily evaluated — zero sibling instantiation.
 */

import { deriveGalaxySeed } from '../../core/hierarchy.js';
import { createPRNG } from '../../core/prng.js';
import type { EntityId, Galaxy, GalaxyType, Seed, SpiralParameters, Vector3D } from '../../core/types.js';
import { generateGalaxyName } from './naming.js';

/**
 * Validates a generated Galaxy entity.
 */
export function validateGalaxy(galaxy: Galaxy): void {
  if (!galaxy.id || !galaxy.id.startsWith('u')) {
    throw new Error(`[validateGalaxy] Invalid canonical ID format: ${galaxy.id}`);
  }
  if (!Number.isFinite(galaxy.seed)) {
    throw new Error('[validateGalaxy] Seed must be a finite integer');
  }
  if (!['SPIRAL', 'ELLIPTICAL', 'LENTICULAR', 'IRREGULAR'].includes(galaxy.type)) {
    throw new Error(`[validateGalaxy] Invalid galaxy type: ${galaxy.type}`);
  }
  if (!Number.isFinite(galaxy.radiusLightYears) || galaxy.radiusLightYears < 5000 || galaxy.radiusLightYears > 300000) {
    throw new Error(`[validateGalaxy] Radius out of range: ${galaxy.radiusLightYears}`);
  }
  if (!Number.isFinite(galaxy.starCountEstimate) || galaxy.starCountEstimate < 1e7) {
    throw new Error(`[validateGalaxy] Invalid star count estimate: ${galaxy.starCountEstimate}`);
  }
  if (!Number.isFinite(galaxy.coreBlackHoleMassSolar) || galaxy.coreBlackHoleMassSolar <= 0) {
    throw new Error(`[validateGalaxy] Invalid black hole mass: ${galaxy.coreBlackHoleMassSolar}`);
  }
  if (!Number.isFinite(galaxy.position.x) || !Number.isFinite(galaxy.position.y) || !Number.isFinite(galaxy.position.z)) {
    throw new Error('[validateGalaxy] Position coordinates must be finite numbers');
  }
  if (galaxy.type === 'SPIRAL') {
    if (!galaxy.spiralParams) {
      throw new Error('[validateGalaxy] Spiral galaxy missing spiralParams');
    }
    if (galaxy.spiralParams.armCount < 2 || galaxy.spiralParams.armCount > 8) {
      throw new Error(`[validateGalaxy] Invalid arm count: ${galaxy.spiralParams.armCount}`);
    }
  }
}

/**
 * Computes deterministic 3D position within a cosmic web filament grid.
 * Galaxies are grouped into spatial filaments and sheets rather than uniform noise.
 */
function calculateCosmicPosition(prng: ReturnType<typeof createPRNG>, galaxyIndex: number): Vector3D {
  // Filament macro-cell spatial index
  const cellRadius = 50_000_000; // 50 million light years macro scale
  const angle = (galaxyIndex * 137.5 * Math.PI) / 180; // Golden angle progression
  const radius = Math.sqrt(galaxyIndex + 1) * 8_000_000 + prng.nextFloat(0, 4_000_000);

  // Filamentary sinusoidal modulation
  const filamentModulation = Math.sin(galaxyIndex * 0.45) * 12_000_000;
  const zScatter = prng.nextFloat(-15_000_000, 15_000_000);

  return {
    x: Math.round(Math.cos(angle) * radius + filamentModulation),
    y: Math.round(Math.sin(angle) * radius + prng.nextFloat(-2_000_000, 2_000_000)),
    z: Math.round(zScatter + Math.cos(galaxyIndex * 0.3) * 6_000_000),
  };
}

/**
 * Procedurally generates a Galaxy directly from universe seed and galaxy index.
 */
export function generateGalaxy(universeSeed: Seed, galaxyIndex: number): Galaxy {
  if (galaxyIndex < 0 || !Number.isInteger(galaxyIndex)) {
    throw new Error(`[generateGalaxy] galaxyIndex must be a non-negative integer: ${galaxyIndex}`);
  }

  const galaxySeed = deriveGalaxySeed(universeSeed, galaxyIndex);
  const prng = createPRNG(galaxySeed);

  const id: EntityId = `u${universeSeed}/g${galaxyIndex}`;
  const name = generateGalaxyName(galaxySeed, galaxyIndex);

  // Morphological distribution model:
  // - Spiral: 50%
  // - Elliptical: 30%
  // - Lenticular: 12%
  // - Irregular: 8%
  const morphRoll = prng.next();
  let type: GalaxyType;
  if (morphRoll < 0.50) {
    type = 'SPIRAL';
  } else if (morphRoll < 0.80) {
    type = 'ELLIPTICAL';
  } else if (morphRoll < 0.92) {
    type = 'LENTICULAR';
  } else {
    type = 'IRREGULAR';
  }

  // Radius & Star Count scaled by morphology
  let radiusLightYears: number;
  let starCountEstimate: number;

  switch (type) {
    case 'SPIRAL':
      // Moderate to large disks: 40k to 120k light years
      radiusLightYears = Math.round(prng.nextFloat(40_000, 120_000));
      starCountEstimate = Math.round(prng.nextFloat(1e11, 4e11)); // 100B - 400B stars
      break;
    case 'ELLIPTICAL':
      // From small spheroids to giant ellipticals: 20k to 180k light years
      radiusLightYears = Math.round(prng.nextFloat(20_000, 180_000));
      starCountEstimate = Math.round(prng.nextFloat(5e10, 1.5e12)); // up to 1.5 trillion stars
      break;
    case 'LENTICULAR':
      // Transitional disk galaxies without strong arms: 30k to 90k light years
      radiusLightYears = Math.round(prng.nextFloat(30_000, 90_000));
      starCountEstimate = Math.round(prng.nextFloat(8e10, 2.5e11));
      break;
    case 'IRREGULAR':
      // Dwarf/distorted galaxies: 10k to 35k light years
      radiusLightYears = Math.round(prng.nextFloat(10_000, 35_000));
      starCountEstimate = Math.round(prng.nextFloat(1e9, 3e10)); // 1B - 30B stars
      break;
  }

  // Supermassive Black Hole Mass (Solar masses), correlated with galaxy star count and size
  const bhmLogMin = Math.log10(1e5);
  const bhmLogMax = Math.log10(1e10);
  const sizeFactor = radiusLightYears / 100_000;
  const coreBlackHoleMassSolar = Math.round(
    Math.pow(10, prng.nextFloat(bhmLogMin, bhmLogMax) * 0.7 + Math.log10(sizeFactor * 1e8) * 0.3)
  );

  // Position within the filament web
  const position = calculateCosmicPosition(prng, galaxyIndex);

  // Spiral density wave parameters
  let spiralParams: SpiralParameters | undefined;
  if (type === 'SPIRAL') {
    spiralParams = {
      armCount: prng.pick([2, 2, 2, 4, 4, 3, 5]), // 2-arm and 4-arm spirals most common
      armTightness: prng.nextFloat(0.18, 0.42),
      thicknessLightYears: Math.round(radiusLightYears * prng.nextFloat(0.015, 0.035)),
      bulgeRatio: prng.nextFloat(0.12, 0.30),
      densityFalloff: prng.nextFloat(0.8, 1.8),
      rotationalOrientationRad: prng.nextFloat(0, Math.PI * 2),
      verticalScatter: prng.nextFloat(0.15, 0.35),
    };
  }

  const galaxy: Galaxy = {
    id,
    seed: galaxySeed,
    name,
    type,
    position,
    radiusLightYears,
    starCountEstimate,
    coreBlackHoleMassSolar,
    spiralParams,
  };

  validateGalaxy(galaxy);
  return galaxy;
}
