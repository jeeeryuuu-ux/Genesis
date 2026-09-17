/**
 * @license Apache-2.0
 * GENESIS MOON GENERATOR
 *
 * Procedurally generates natural satellites from a planet seed and moon index.
 * Evaluated lazily when inspecting a planet.
 */

import { deriveMoonSeed } from '../../core/hierarchy.js';
import { createPRNG } from '../../core/prng.js';
import type { EntityId, Moon, Seed } from '../../core/types.js';
import { generateMoonName } from './naming.js';

/**
 * Validates a generated Moon entity.
 */
export function validateMoon(moon: Moon): void {
  if (!moon.id || !moon.name) {
    throw new Error('[validateMoon] Moon must have valid ID and name');
  }
  if (!Number.isFinite(moon.radiusKm) || moon.radiusKm <= 0) {
    throw new Error(`[validateMoon] Moon radius must be positive: ${moon.radiusKm}`);
  }
  if (!Number.isFinite(moon.orbitalDistanceKm) || moon.orbitalDistanceKm <= 0) {
    throw new Error(`[validateMoon] Orbital distance must be positive: ${moon.orbitalDistanceKm}`);
  }
  if (!Number.isFinite(moon.orbitalPeriodDays) || moon.orbitalPeriodDays <= 0) {
    throw new Error(`[validateMoon] Orbital period must be positive: ${moon.orbitalPeriodDays}`);
  }
}

/**
 * Procedurally generates a Moon directly from a parent planet seed and moon index.
 *
 * @param planetSeed 32-bit unsigned seed of the parent planet
 * @param moonIndex The 0-based index of the moon slot
 * @param planetId Optional canonical parent planet entity ID
 * @param planetName Optional name of the parent planet for designation
 * @param planetMassEarth Optional parent mass in Earth masses (defaults to 1.0)
 */
export function generateMoon(
  planetSeed: Seed,
  moonIndex: number,
  planetId: EntityId = `p${planetSeed}`,
  planetName: string = `Planet-${planetSeed.toString(16).slice(-4)}`,
  planetMassEarth: number = 1.0
): Moon {
  if (moonIndex < 0 || !Number.isInteger(moonIndex)) {
    throw new Error(`[generateMoon] moonIndex must be a non-negative integer: ${moonIndex}`);
  }

  const moonSeed = deriveMoonSeed(planetSeed, moonIndex);
  const prng = createPRNG(moonSeed);

  const id: EntityId = `${planetId}/m${moonIndex}`;
  const name = generateMoonName(planetName, moonIndex);

  // Progressive orbital distance: each successive moon orbits further out
  // Base distance ~80,000 km, stepping with geometric ratio and deterministic perturbation
  const baseDistanceKm = 80_000 + prng.nextFloat(10_000, 40_000);
  const distanceMultiplier = Math.pow(1.6, moonIndex);
  const orbitalDistanceKm = Math.round(baseDistanceKm * distanceMultiplier * prng.nextFloat(0.9, 1.15));

  // Moon radius: small asteroids (50 km) up to major satellites (Ganymede/Titan ~2,600 km)
  // Outer irregular moons are typically smaller than inner major moons
  const isMajorMoon = moonIndex < 4;
  const radiusKm = isMajorMoon
    ? Math.round(prng.nextFloat(400, 2_600))
    : Math.round(prng.nextFloat(25, 450));

  // Kepler's Third Law for circular orbit around planet:
  // T² = (4π² / GM) * r³
  // For Earth mass (5.972e24 kg) and r = 384,400 km, T ≈ 27.3 days
  const G = 6.6743e-11;
  const M = Math.max(0.01, planetMassEarth) * 5.972e24; // kg
  const rMeters = orbitalDistanceKm * 1000;
  const periodSeconds = 2 * Math.PI * Math.sqrt(Math.pow(rMeters, 3) / (G * M));
  const orbitalPeriodDays = Number((periodSeconds / 86400).toFixed(2));

  // Tidal locking: moons orbiting within 600,000 km of planet are generally tidally locked
  const tidallyLocked = orbitalDistanceKm < 600_000 || prng.chance(0.85);

  const moon: Moon = {
    id,
    seed: moonSeed,
    name,
    radiusKm,
    orbitalDistanceKm,
    orbitalPeriodDays,
    tidallyLocked,
  };

  validateMoon(moon);
  return moon;
}
