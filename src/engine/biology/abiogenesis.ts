/**
 * @license Apache-2.0
 * GENESIS DETERMINISTIC ABIOGENESIS ENGINE
 *
 * Deterministically simulates the emergence of organic life based on planetary
 * environmental suitability and seeded stochastic thresholds.
 *
 * GUARANTEES:
 * - Deterministic: same seed + planet + epoch yields identical abiogenesis outcome.
 * - Physics/Chemical Heuristics: life emerges when chemical, energy, and water conditions align.
 * - No Math.random() or wall-clock calls.
 */

import { deriveAbiogenesisSeed, deriveLifeSeed } from '../../core/hierarchy.js';
import { createPRNG } from '../../core/prng.js';
import type { Planet, Year } from '../../core/types.js';
import type { PlanetaryTemporalState, StellarTemporalState } from '../simulation/types.js';
import { assessHabitability } from './habitability.js';
import type { HabitabilityAssessment, LifeOriginType } from './types.js';

export interface AbiogenesisOutcome {
  readonly hasLifeEmergence: boolean;
  readonly emergenceYear?: Year;
  readonly origin: LifeOriginType;
  readonly abiogenesisPotential: number; // [0.0, 1.0]
  readonly threshold: number; // [0.0, 1.0]
  readonly habitability: HabitabilityAssessment;
}

/**
 * Procedurally determines the most plausible origin pathway for life on a given planet.
 */
export function determineLifeOrigin(
  planet: Planet,
  habitability: HabitabilityAssessment,
  temporalState?: PlanetaryTemporalState
): LifeOriginType {
  const seed = deriveLifeSeed(planet.seed);
  const prng = createPRNG(seed);

  const roll = prng.nextFloat(0, 1);
  const effectiveTemp = temporalState?.effectiveTempKelvin ?? planet.averageTempKelvin;
  const hydrosphere = temporalState?.hydrosphereCoverage ?? planet.hydrosphereCoverage;
  const atm = planet.atmosphere;

  // Ocean / high-water worlds with deep basins
  if (planet.type === 'OCEAN' || hydrosphere > 0.6) {
    if (roll < 0.45) return 'HYDROTHERMAL';
    if (roll < 0.85) return 'AQUATIC';
    return 'PHOTOSYNTHETIC';
  }

  // Desert / low-water worlds
  if (planet.type === 'DESERT' || hydrosphere < 0.2) {
    if (roll < 0.5) return 'SUBSURFACE';
    if (roll < 0.85) return 'CHEMOSYNTHETIC';
    return 'EXTREMOPHILE';
  }

  // Extreme temperatures
  if (effectiveTemp < 250 || effectiveTemp > 350) {
    if (roll < 0.6) return 'EXTREMOPHILE';
    return 'CHEMOSYNTHETIC';
  }

  // Dense greenhouse atmosphere
  if (atm.surfacePressureAtm > 2.5 && atm.methane + atm.carbonDioxide > 0.3) {
    if (roll < 0.4) return 'CHEMOSYNTHETIC';
    if (roll < 0.75) return 'ATMOSPHERIC';
    return 'HYDROTHERMAL';
  }

  // Balanced terrestrial world (Earth-like distribution)
  if (roll < 0.35) return 'HYDROTHERMAL';
  if (roll < 0.65) return 'AQUATIC';
  if (roll < 0.85) return 'PHOTOSYNTHETIC';
  return 'CHEMOSYNTHETIC';
}

/**
 * Computes deterministic abiogenesis potential and emergence epoch for a planet.
 */
export function evaluateAbiogenesis(
  planet: Planet,
  epochYear: Year,
  temporalState?: PlanetaryTemporalState,
  starState?: StellarTemporalState
): AbiogenesisOutcome {
  const habitability = assessHabitability(planet, temporalState, starState);
  const seed = deriveAbiogenesisSeed(planet.seed);
  const prng = createPRNG(seed);

  // If habitability is strictly NONE, abiogenesis is impossible on this world
  if (habitability.overall === 'NONE' || habitability.score < 0.15) {
    return {
      hasLifeEmergence: false,
      origin: 'EXTREMOPHILE',
      abiogenesisPotential: 0.0,
      threshold: 0.9,
      habitability,
    };
  }

  // Continuous Abiogenesis Potential:
  // Combines chemical suitability (water + atmosphere), temperature stability, and energy
  const chemicalAvailability =
    habitability.waterAvailability * 0.45 + habitability.atmosphericSuitability * 0.55;
  const rawPotential =
    habitability.temperatureSuitability * 0.3 +
    chemicalAvailability * 0.35 +
    habitability.energyAvailability * 0.2 +
    habitability.environmentalStability * 0.15;

  const abiogenesisPotential = Number(
    Math.max(0.0, Math.min(1.0, rawPotential * habitability.score)).toFixed(4)
  );

  // Deterministic stochastic emergence threshold for this planetary system
  // Range ~ [0.15, 0.65], meaning favorable worlds have a high chance of life
  const threshold = Number(prng.nextFloat(0.15, 0.62).toFixed(4));
  const isEligible = abiogenesisPotential >= threshold;

  if (!isEligible) {
    return {
      hasLifeEmergence: false,
      origin: determineLifeOrigin(planet, habitability, temporalState),
      abiogenesisPotential,
      threshold,
      habitability,
    };
  }

  // Calculate deterministic emergence epoch:
  // Planets require gestation time after star formation (e.g. 500 Myr to 2.5 Gyr)
  const gestationYears = Math.round(prng.nextFloat(400_000_000, 2_000_000_000));
  // Star system formation year based on star state or universe age
  const starFormationYear = starState?.formationYear ?? 1_000_000_000;
  const emergenceYear = starFormationYear + gestationYears;

  const origin = determineLifeOrigin(planet, habitability, temporalState);
  const hasLifeEmergence = epochYear >= emergenceYear;

  return {
    hasLifeEmergence,
    emergenceYear,
    origin,
    abiogenesisPotential,
    threshold,
    habitability,
  };
}
