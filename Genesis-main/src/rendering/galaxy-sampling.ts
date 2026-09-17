/**
 * @license Apache-2.0
 * GENESIS DETERMINISTIC GALAXY STELLAR SAMPLING
 *
 * Derives a bounded, high-fidelity visual sample of stellar positions,
 * spectral classes, colors, and selectable star system anchor points directly
 * from a galaxy's seed and morphology.
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * - 100% deterministic (zero Math.random()).
 * - O(1) bounded visual population (e.g. 8,000 - 12,000 sampled stars).
 * - Never instantiates individual meshes for stars.
 * - Selectable systems resolve directly to authoritative StarSystemGenerator indices.
 */

import { deriveSystemSeed } from '../core/hierarchy.js';
import { createPRNG } from '../core/prng.js';
import type { Galaxy, GalaxyType, Seed, SpectralClass } from '../core/types.js';
import { SPECTRAL_COLORS } from './colors.js';
import type { GalaxyVisualSample, SelectableSystemNode } from './types.js';

const SPECTRAL_CLASSES_WEIGHTED: SpectralClass[] = [
  'M', 'M', 'M', 'M', 'M', 'M', 'M', // 70% M dwarfs
  'K', 'K',                           // 13% K
  'G',                                // 8% G
  'F',                                // 5% F
  'A',                                // 2.5% A
  'B',                                // 1% B
];

/**
 * Deterministic standard normal distribution generator (Box-Muller transform)
 * derived purely from the supplied PRNG stream.
 */
function deterministicGaussian(
  prng: ReturnType<typeof createPRNG>,
  mean: number,
  stdDev: number
): number {
  const u1 = Math.max(1e-7, prng.next());
  const u2 = prng.next();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}

/**
 * Samples a single star's 3D position deterministically according to galaxy morphology.
 */
function sampleStarPosition(
  prng: ReturnType<typeof createPRNG>,
  type: GalaxyType,
  radiusUnits: number,
  spiralParams?: Galaxy['spiralParams']
): [number, number, number] {
  switch (type) {
    case 'SPIRAL': {
      const armCount = spiralParams?.armCount ?? 2;
      const tightness = spiralParams?.armTightness ?? 0.3;
      const bulgeRatio = spiralParams?.bulgeRatio ?? 0.2;

      // 25% stars in the dense central bulge, 75% in the disk/arms
      const isBulge = prng.next() < 0.25;
      if (isBulge) {
        // Spherical / ellipsoidal core concentration
        const rBulge = radiusUnits * bulgeRatio * Math.pow(prng.next(), 0.6);
        const theta = prng.nextFloat(0, Math.PI * 2);
        const phi = Math.acos(prng.nextFloat(-1, 1));
        return [
          rBulge * Math.sin(phi) * Math.cos(theta),
          rBulge * Math.cos(phi) * 0.7, // Slightly oblate
          rBulge * Math.sin(phi) * Math.sin(theta),
        ];
      }

      // Spiral arms: logarithmic spiral r = a * e^(b * theta)
      const armIndex = prng.nextInt(0, armCount - 1);
      const armBaseAngle = (armIndex * 2 * Math.PI) / armCount;

      // Distance from center along arm: concentrated toward middle, thinning toward edge
      const radialFraction = Math.pow(prng.next(), 0.8) * 0.9 + 0.1;
      const dist = radialFraction * radiusUnits;

      // Logarithmic spiral angle + winding
      const windingAngle = (dist / radiusUnits) * (1 / tightness) * 2.5;
      const angle = armBaseAngle + windingAngle;

      // Arm width dispersion (arms are wider further out)
      const armWidth = 4.0 + (dist / radiusUnits) * 12.0;
      const radialJitter = deterministicGaussian(prng, 0, armWidth);
      const angularJitter = deterministicGaussian(prng, 0, 0.15);

      // Disk vertical thickness (thinner near center, flaring at edge)
      const diskThickness = 3.5 + (dist / radiusUnits) * 4.0;
      const z = deterministicGaussian(prng, 0, diskThickness);

      const finalAngle = angle + angularJitter;
      const finalDist = Math.max(radiusUnits * bulgeRatio * 0.8, dist + radialJitter);

      return [
        Math.cos(finalAngle) * finalDist,
        z,
        Math.sin(finalAngle) * finalDist,
      ];
    }

    case 'ELLIPTICAL': {
      // Triaxial ellipsoid with dense r^-1 or de Vaucouleurs profile
      const radialPower = 1.6;
      const dist = radiusUnits * Math.pow(prng.next(), radialPower);
      const theta = prng.nextFloat(0, Math.PI * 2);
      const phi = Math.acos(prng.nextFloat(-1, 1));

      // Ellipticity axes ratios
      const a = 1.0;
      const b = 0.75;
      const c = 0.6;

      return [
        dist * a * Math.sin(phi) * Math.cos(theta),
        dist * c * Math.cos(phi),
        dist * b * Math.sin(phi) * Math.sin(theta),
      ];
    }

    case 'LENTICULAR': {
      // Flattened disk with prominent central spheroid
      const isBulge = prng.next() < 0.35;
      if (isBulge) {
        const dist = radiusUnits * 0.28 * Math.pow(prng.next(), 0.7);
        const theta = prng.nextFloat(0, Math.PI * 2);
        const phi = Math.acos(prng.nextFloat(-1, 1));
        return [
          dist * Math.sin(phi) * Math.cos(theta),
          dist * Math.cos(phi) * 0.65,
          dist * Math.sin(phi) * Math.sin(theta),
        ];
      }

      // Smooth axisymmetric disk
      const dist = radiusUnits * Math.pow(prng.next(), 0.7);
      const angle = prng.nextFloat(0, Math.PI * 2);
      const z = deterministicGaussian(prng, 0, 2.5 + (dist / radiusUnits) * 3.0);

      return [
        Math.cos(angle) * dist,
        z,
        Math.sin(angle) * dist,
      ];
    }

    case 'IRREGULAR': {
      // Asymmetric multi-center starburst clumps
      const clumpCount = 4;
      const clumpChoice = prng.nextInt(0, clumpCount - 1);
      const clumpAngle = (clumpChoice * 2 * Math.PI) / clumpCount + prng.nextFloat(-0.4, 0.4);
      const clumpCenterDist = radiusUnits * 0.45 * prng.nextFloat(0.3, 0.9);

      const clumpCenterX = Math.cos(clumpAngle) * clumpCenterDist;
      const clumpCenterZ = Math.sin(clumpAngle) * clumpCenterDist;
      const clumpSpread = radiusUnits * 0.25;

      const x = clumpCenterX + deterministicGaussian(prng, 0, clumpSpread);
      const y = deterministicGaussian(prng, 0, clumpSpread * 0.6);
      const z = clumpCenterZ + deterministicGaussian(prng, 0, clumpSpread);

      return [x, y, z];
    }
  }
}

/**
 * Derives a deterministic visual stellar population sample for a galaxy.
 *
 * @param galaxy Authoritative galaxy entity from generateGalaxy
 * @param sampleCount Total number of visual stars to sample (default: 9,000)
 * @param selectableCount Number of selectable star system anchor nodes (default: 48)
 */
export function sampleGalaxyStars(
  galaxy: Galaxy,
  sampleCount: number = 9000,
  selectableCount: number = 48
): GalaxyVisualSample {
  const prng = createPRNG(galaxy.seed);

  // Normalized galaxy radius in visual scene units (~100 to 140 units)
  const radiusUnits = Math.min(150, Math.max(70, galaxy.radiusLightYears / 500));

  const positions = new Float32Array(sampleCount * 3);
  const colors = new Float32Array(sampleCount * 3);
  const sizes = new Float32Array(sampleCount);

  // Sample stars
  for (let i = 0; i < sampleCount; i++) {
    const [x, y, z] = sampleStarPosition(prng, galaxy.type, radiusUnits, galaxy.spiralParams);

    positions[i * 3 + 0] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Pick spectral class based on cosmological distribution
    const spectralClass = prng.pick(SPECTRAL_CLASSES_WEIGHTED);
    const color = SPECTRAL_COLORS[spectralClass];

    // Subtle luminosity jitter
    const brightnessMod = prng.nextFloat(0.85, 1.15);
    colors[i * 3 + 0] = Math.min(1.0, color.r * brightnessMod);
    colors[i * 3 + 1] = Math.min(1.0, color.g * brightnessMod);
    colors[i * 3 + 2] = Math.min(1.0, color.b * brightnessMod);

    // Particle size based on spectral luminosity
    let baseSize = 1.0;
    if (spectralClass === 'O') baseSize = 2.8;
    else if (spectralClass === 'B') baseSize = 2.2;
    else if (spectralClass === 'A') baseSize = 1.7;
    else if (spectralClass === 'F') baseSize = 1.4;
    else if (spectralClass === 'G') baseSize = 1.2;
    else if (spectralClass === 'K') baseSize = 1.0;
    else baseSize = 0.8; // M dwarf

    sizes[i] = baseSize;
  }

  // Generate selectable star system anchor nodes
  // Indices 0, 1, 2, ... selectableCount - 1 correspond exactly to StarSystemGenerator indices!
  const selectableSystems: SelectableSystemNode[] = [];
  for (let s = 0; s < selectableCount; s++) {
    const systemSeed = deriveSystemSeed(galaxy.seed, s);
    const sysPrng = createPRNG(systemSeed);

    const [x, y, z] = sampleStarPosition(sysPrng, galaxy.type, radiusUnits * 0.9, galaxy.spiralParams);
    const spectralClass = sysPrng.pick(SPECTRAL_CLASSES_WEIGHTED);

    selectableSystems.push({
      systemIndex: s,
      systemSeed,
      position: [x, y, z],
      name: `System #${s}`,
      spectralClass,
    });
  }

  return {
    galaxySeed: galaxy.seed,
    galaxyIndex: Number(galaxy.id.split('/g')[1] ?? '0'),
    totalSampleCount: sampleCount,
    positions,
    colors,
    sizes,
    selectableSystems,
  };
}
