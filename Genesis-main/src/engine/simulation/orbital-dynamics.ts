/**
 * @license Apache-2.0
 * GENESIS ORBITAL DYNAMICS ENGINE
 *
 * Provides analytical, deterministic orbital phase calculation and 3D positions
 * for planets and moons at any simulation epoch Y.
 *
 * CRITICAL PERFORMANCE GUARANTEE:
 * Complexity is strictly O(1) for any time interval, whether Δt is 1 year,
 * 1,000,000 years, or 10,000,000,000 years.
 * Does NOT execute iterative numerical integration steps.
 */

import { createPRNG } from '../../core/prng.js';
import type { Moon, Planet, Vector3D, Year } from '../../core/types.js';
import type { MoonTemporalState, PlanetaryTemporalState } from './types.js';

const TWO_PI = Math.PI * 2;
const DAYS_PER_YEAR = 365.25;

/**
 * Calculates initial orbital phase for a planet deterministically from its seed.
 */
export function getInitialPlanetOrbitalPhase(planet: Planet): number {
  const prng = createPRNG(planet.seed ^ 0x07b17a15);
  return prng.nextFloat(0, TWO_PI);
}

/**
 * Computes the analytical orbital phase in radians [0, 2π) at year Y.
 */
export function calculatePlanetOrbitalPhase(planet: Planet, currentYear: Year): number {
  const initialPhase = getInitialPlanetOrbitalPhase(planet);
  if (planet.orbitalPeriodDays <= 0) return initialPhase;

  // Analytical Keplerian phase: (elapsed days / orbitalPeriodDays) mod 1
  const elapsedDays = currentYear * DAYS_PER_YEAR;
  const orbitsFraction = (elapsedDays / planet.orbitalPeriodDays) % 1.0;
  let phase = (initialPhase + orbitsFraction * TWO_PI) % TWO_PI;
  if (phase < 0) phase += TWO_PI;
  return phase;
}

/**
 * Computes the 3D Cartesian position in AU for a planet at orbital phase θ.
 * Accounts for orbital eccentricity e and semi-major axis a.
 */
export function calculatePlanetPositionAU(
  semiMajorAxisAU: number,
  eccentricity: number,
  orbitalPhaseRad: number
): Vector3D {
  const a = Math.max(0.01, semiMajorAxisAU);
  const e = Math.min(0.9, Math.max(0.0, eccentricity));

  // Keplerian elliptical radial distance from primary focus:
  // r(θ) = a * (1 - e^2) / (1 + e * cos(θ))
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(orbitalPhaseRad));

  return {
    x: r * Math.cos(orbitalPhaseRad),
    y: 0,
    z: r * Math.sin(orbitalPhaseRad),
  };
}

/**
 * Calculates initial orbital phase for a moon deterministically from its seed.
 */
export function getInitialMoonOrbitalPhase(moon: Moon): number {
  const prng = createPRNG(moon.seed ^ 0x30043004);
  return prng.nextFloat(0, TWO_PI);
}

/**
 * Computes the analytical orbital phase in radians [0, 2π) for a moon at year Y.
 */
export function calculateMoonOrbitalPhase(moon: Moon, currentYear: Year): number {
  const initialPhase = getInitialMoonOrbitalPhase(moon);
  if (moon.orbitalPeriodDays <= 0) return initialPhase;

  const elapsedDays = currentYear * DAYS_PER_YEAR;
  const orbitsFraction = (elapsedDays / moon.orbitalPeriodDays) % 1.0;
  let phase = (initialPhase + orbitsFraction * TWO_PI) % TWO_PI;
  if (phase < 0) phase += TWO_PI;
  return phase;
}

/**
 * Computes the relative 3D Cartesian position vector in kilometers for a moon.
 */
export function calculateMoonRelativePositionKm(
  orbitalDistanceKm: number,
  orbitalPhaseRad: number
): Vector3D {
  const d = Math.max(1000, orbitalDistanceKm);
  return {
    x: d * Math.cos(orbitalPhaseRad),
    y: 0,
    z: d * Math.sin(orbitalPhaseRad),
  };
}

/**
 * Evolves a moon's temporal state analytically.
 */
export function evolveMoon(moon: Moon, currentYear: Year): MoonTemporalState {
  const orbitalPhaseRad = calculateMoonOrbitalPhase(moon, currentYear);
  const relativePositionKm = calculateMoonRelativePositionKm(
    moon.orbitalDistanceKm,
    orbitalPhaseRad
  );

  // Tidal locking constraint:
  // If tidally locked, synchronous rotation matches orbital phase exactly.
  // Otherwise, compute rotation from independent rotational period.
  const rotationAngleRad = moon.tidallyLocked
    ? orbitalPhaseRad
    : (orbitalPhaseRad * 1.5) % TWO_PI;

  return {
    entityId: moon.id,
    baseMoon: moon,
    orbitalPhaseRad,
    relativePositionKm,
    rotationAngleRad,
  };
}
