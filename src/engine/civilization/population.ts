/**
 * @license Apache-2.0
 * GENESIS POPULATION DYNAMICS ENGINE
 *
 * Models constrained demographic growth, ecological carrying capacities,
 * technological capacity scaling, and crisis contraction deterministically.
 */

import { derivePopulationSeed } from '../../core/hierarchy.js';
import { createPRNG } from '../../core/prng.js';
import type { Planet, Seed, Year } from '../../core/types.js';
import type { Species } from '../biology/types.js';
import type { ResourceProfile, TechnologyProfile } from './types.js';

export interface PopulationResult {
  readonly currentPopulation: number;
  readonly peakPopulation: number;
  readonly carryingCapacity: number;
}

/**
 * Calculates current population, peak historical population, and planetary carrying capacity.
 */
export function evaluatePopulation(
  civilizationSeed: Seed,
  emergenceEpochYear: Year,
  currentYear: Year,
  species: Species,
  planet: Planet,
  resources: ResourceProfile,
  technology: TechnologyProfile,
  stabilityIndex: number
): PopulationResult {
  if (currentYear < emergenceEpochYear) {
    return {
      currentPopulation: 0,
      peakPopulation: 0,
      carryingCapacity: 0,
    };
  }

  const seed = derivePopulationSeed(civilizationSeed, currentYear);
  const prng = createPRNG(seed);

  const deltaYears = currentYear - emergenceEpochYear;

  // 1. Biological baseline carrying capacity
  // Size scaling: smaller species have higher density, megafauna have lower
  const bodySize = Math.max(0.1, Math.min(10.0, species.traits.physical.sizeMeters));
  const sizeDensityFactor = 1.0 / Math.pow(bodySize, 1.2);

  // Surface land area in millions of km²
  const surfaceAreaMillionKm2 = (4 * Math.PI * Math.pow(planet.radiusKm, 2)) / 1_000_000;
  const landArea = surfaceAreaMillionKm2 * (1.0 - planet.hydrosphereCoverage);
  const productiveLand = Math.max(0.1, landArea * resources.fertileLand);

  // Base hunter-gatherer carrying capacity: ~10-50 individuals per 100 km²
  const baseCarryingCapacity = productiveLand * 200_000 * sizeDensityFactor * resources.freshwaterAvailability;

  // 2. Technological capacity multiplier
  let techMultiplier = 1.0;
  switch (technology.era) {
    case 'STONE_AGE':
      techMultiplier = 1.0 + technology.level * 2.0;
      break;
    case 'AGRICULTURAL':
      techMultiplier = 15.0 + (technology.level - 0.12) * 50.0;
      break;
    case 'BRONZE_IRON':
      techMultiplier = 40.0 + (technology.level - 0.25) * 120.0;
      break;
    case 'ORGANIZED_PRE_INDUSTRIAL':
      techMultiplier = 100.0 + (technology.level - 0.4) * 300.0;
      break;
    case 'INDUSTRIAL':
      techMultiplier = 400.0 + (technology.level - 0.55) * 1500.0;
      break;
    case 'ATOMIC_INFORMATION':
      techMultiplier = 1500.0 + (technology.level - 0.7) * 4000.0;
      break;
    case 'INTERPLANETARY':
      techMultiplier = 4000.0 + (technology.level - 0.84) * 8000.0;
      break;
    case 'POST_SCARCITY':
      techMultiplier = 8000.0;
      break;
  }

  const carryingCapacity = Math.max(10_000, Math.floor(baseCarryingCapacity * techMultiplier));

  // 3. Logistic growth over emergence time
  // Reaches 50% carrying capacity after ~15,000 effective years of development
  const growthRate = species.traits.ecological.populationGrowthRate;
  const timeProgress = (deltaYears * (0.8 + growthRate)) / 25_000;
  const logisticFraction = 1.0 / (1.0 + Math.exp(-timeProgress * 2.0 + 2.0));

  // 4. Stability and stress impacts
  let stressPenalty = 1.0;
  if (stabilityIndex < 0.35) {
    // Severe crisis / famine / war
    stressPenalty = Math.max(0.01, stabilityIndex / 0.35);
  }

  const noise = 0.95 + prng.next() * 0.1;
  const currentPopulation = Math.max(
    0,
    Math.floor(carryingCapacity * logisticFraction * stressPenalty * noise)
  );

  // Peak population is estimated as the maximum carrying capacity achieved without crisis
  const peakPopulation = Math.max(
    currentPopulation,
    Math.floor(carryingCapacity * Math.min(1.0, logisticFraction * 1.05))
  );

  return {
    currentPopulation,
    peakPopulation,
    carryingCapacity,
  };
}
