/**
 * @license Apache-2.0
 * GENESIS CIVILIZATION ELIGIBILITY EVALUATION
 *
 * Deterministically determines whether an organic species and planetary environment
 * satisfy the rigorous physical, biological, and evolutionary criteria necessary
 * for technological civilization to emerge.
 */

import { deriveCivilizationSeed } from '../../core/hierarchy.js';
import { createPRNG } from '../../core/prng.js';
import type { Planet, Year } from '../../core/types.js';
import type { HabitabilityAssessment, Species } from '../biology/types.js';
import type { IntelligenceProfile } from './types.js';

export interface EligibilityResult {
  readonly isEligible: boolean;
  readonly emergenceEpochYear: Year;
  readonly reason: string;
}

/**
 * Evaluates whether a species can produce a civilization, and calculates its deterministic emergence epoch.
 */
export function evaluateCivilizationEligibility(
  species: Species,
  intelligence: IntelligenceProfile,
  planet: Planet,
  habitability: HabitabilityAssessment
): EligibilityResult {
  // 1. Biological criteria
  if (species.complexity !== 'COMPLEX' && species.complexity !== 'MULTICELLULAR') {
    return {
      isEligible: false,
      emergenceEpochYear: 0,
      reason: 'Species lacks somatic and neural complexity for sapience.',
    };
  }

  if (!intelligence.isSapient || intelligence.civilizationPotential < 0.35) {
    return {
      isEligible: false,
      emergenceEpochYear: 0,
      reason: 'Species cognition below the sapience threshold.',
    };
  }

  // 2. Planetary Environmental criteria
  if (habitability.overall === 'NONE' || habitability.score < 0.3) {
    return {
      isEligible: false,
      emergenceEpochYear: 0,
      reason: 'Planetary environment is too hostile to sustain technological emergence.',
    };
  }

  if (planet.atmosphere.surfacePressureAtm < 0.05) {
    return {
      isEligible: false,
      emergenceEpochYear: 0,
      reason: 'Atmospheric pressure insufficient for gas exchange or acoustic coordination.',
    };
  }

  if (planet.eccentricity > 0.6) {
    return {
      isEligible: false,
      emergenceEpochYear: 0,
      reason: 'Extreme orbital eccentricity creates destabilizing seasonal swings.',
    };
  }

  // 3. Deterministic Emergence Epoch Calculation
  // Emergence requires evolutionary gestation time after species origin.
  // Higher cognitive complexity and tool use accelerate emergence; harsh environmental stability delays it.
  const civSeed = deriveCivilizationSeed(species.seed, 0);
  const prng = createPRNG(civSeed);

  // Gestation interval: 2M - 40M years after species origin
  const baseGestationYears = 5_000_000;
  const cognitiveAcceleration = 1.0 - intelligence.cognitiveComplexity * 0.5;
  const stabilityFactor = 0.5 + (1.0 - habitability.environmentalStability) * 0.8;
  const randomFactor = 0.8 + prng.next() * 0.5;

  const gestationYears = Math.floor(
    baseGestationYears * cognitiveAcceleration * stabilityFactor * randomFactor
  );

  const emergenceEpochYear = Math.max(
    species.originEpochYear + 100_000,
    species.extinctionEpochYear
      ? Math.min(species.extinctionEpochYear, species.originEpochYear + gestationYears)
      : species.originEpochYear + gestationYears
  );

  return {
    isEligible: true,
    emergenceEpochYear,
    reason: 'Species possesses sapience, dexterous manipulation, and supportive planetary ecology.',
  };
}
