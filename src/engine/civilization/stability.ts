/**
 * @license Apache-2.0
 * GENESIS CIVILIZATION STABILITY & CRISIS EVALUATION
 *
 * Computes deterministic societal resilience, existential stress,
 * and state transitions (EMERGING, DEVELOPING, INDUSTRIAL, ADVANCED, COLLAPSING, EXTINCT).
 */

import { deriveCollapseSeed } from '../../core/hierarchy.js';
import { createPRNG } from '../../core/prng.js';
import type { Seed, Year } from '../../core/types.js';
import type { HabitabilityAssessment } from '../biology/types.js';
import type {
  CivilizationStability,
  CivilizationStatus,
  ResourceProfile,
  TechnologyProfile,
} from './types.js';

export interface StabilityAssessmentResult {
  readonly stability: CivilizationStability;
  readonly status: CivilizationStatus;
}

/**
 * Evaluates the systemic stability and existential state of a civilization.
 */
export function evaluateCivilizationStability(
  civilizationSeed: Seed,
  emergenceEpochYear: Year,
  currentYear: Year,
  habitability: HabitabilityAssessment,
  resources: ResourceProfile,
  technology: TechnologyProfile,
  population: number,
  carryingCapacity: number
): StabilityAssessmentResult {
  if (currentYear < emergenceEpochYear) {
    return {
      status: 'PRE_CIVILIZATION',
      stability: {
        stabilityIndex: 1.0,
        environmentalStability: habitability.environmentalStability,
        resourceSecurity: 1.0,
        socialCoordination: 1.0,
        technologicalResilience: 0.1,
        ecologicalStress: 0.0,
        populationPressure: 0.0,
        primaryStressFactor: 'PRE_EMERGENCE',
      },
    };
  }

  const seed = deriveCollapseSeed(civilizationSeed, currentYear);
  const prng = createPRNG(seed);

  // 1. Positive stability pillars
  const environmentalStability = habitability.environmentalStability;
  const resourceSecurity = Math.max(0.0, 1.0 - resources.resourceStress);
  const socialCoordination = Math.max(
    0.1,
    Math.min(1.0, technology.knowledgeLevel * 0.4 + resourceSecurity * 0.4 + 0.2)
  );
  const technologicalResilience = Math.max(
    0.05,
    Math.min(1.0, technology.engineering * 0.6 + technology.energyTechnology * 0.4)
  );

  // 2. Negative stress factors
  const popRatio = population / Math.max(10_000, carryingCapacity);
  const populationPressure = Math.max(0.0, Math.min(1.0, popRatio * 0.8));
  const ecologicalStress = Math.max(
    0.0,
    Math.min(1.0, resources.resourceStress * 0.6 + (technology.era === 'INDUSTRIAL' ? 0.3 : 0.1))
  );

  // 3. Composite stability index:
  // stability = 0.3*Env + 0.25*Resource + 0.25*Social + 0.2*Tech - (0.2*EcoStress + 0.15*PopPressure)
  const baseStability =
    environmentalStability * 0.28 +
    resourceSecurity * 0.26 +
    socialCoordination * 0.24 +
    technologicalResilience * 0.22 -
    (ecologicalStress * 0.2 + populationPressure * 0.15);

  const noise = prng.next() * 0.08 - 0.04;
  const stabilityIndex = Math.max(0.0, Math.min(1.0, baseStability + noise));

  // 4. Primary stress factor identification
  let primaryStressFactor = 'OPTIMAL_EQUILIBRIUM';
  if (ecologicalStress > 0.55) {
    primaryStressFactor = 'ECOLOGICAL_OVERBURDEN';
  } else if (resourceSecurity < 0.35) {
    primaryStressFactor = 'RESOURCE_DEPLETION';
  } else if (populationPressure > 0.75) {
    primaryStressFactor = 'POPULATION_PRESSURE';
  } else if (environmentalStability < 0.4) {
    primaryStressFactor = 'CLIMATIC_VOLATILITY';
  }

  // 5. State transitions
  let status: CivilizationStatus;
  if (population <= 0 || stabilityIndex <= 0.08) {
    status = 'EXTINCT';
  } else if (stabilityIndex < 0.28) {
    status = 'COLLAPSING';
  } else if (technology.level < 0.25) {
    status = 'EMERGING';
  } else if (technology.level < 0.65) {
    status = 'DEVELOPING';
  } else if (technology.level < 0.84) {
    status = 'INDUSTRIAL';
  } else {
    status = 'ADVANCED';
  }

  return {
    status,
    stability: {
      stabilityIndex: Math.round(stabilityIndex * 1000) / 1000,
      environmentalStability: Math.round(environmentalStability * 1000) / 1000,
      resourceSecurity: Math.round(resourceSecurity * 1000) / 1000,
      socialCoordination: Math.round(socialCoordination * 1000) / 1000,
      technologicalResilience: Math.round(technologicalResilience * 1000) / 1000,
      ecologicalStress: Math.round(ecologicalStress * 1000) / 1000,
      populationPressure: Math.round(populationPressure * 1000) / 1000,
      primaryStressFactor,
    },
  };
}
