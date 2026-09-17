/**
 * @license Apache-2.0
 * GENESIS DETERMINISTIC TECHNOLOGY PROGRESSION ENGINE
 *
 * Models technological maturation across compact, analytically rigorous domains
 * driven by cognition, planetary energy availability, and civilizational longevity.
 */

import { deriveTechnologySeed } from '../../core/hierarchy.js';
import { createPRNG } from '../../core/prng.js';
import type { Seed, Year } from '../../core/types.js';
import type { IntelligenceProfile, ResourceProfile, TechnologicalEra, TechnologyProfile } from './types.js';

/**
 * Calculates the technological profile of a civilization at a given simulation epoch.
 */
export function evaluateTechnology(
  civilizationSeed: Seed,
  emergenceEpochYear: Year,
  currentYear: Year,
  intelligence: IntelligenceProfile,
  resources: ResourceProfile,
  stabilityModifier: number = 1.0
): TechnologyProfile {
  if (currentYear < emergenceEpochYear) {
    return {
      era: 'STONE_AGE',
      level: 0.0,
      knowledgeLevel: 0.0,
      energyTechnology: 0.0,
      computation: 0.0,
      biotechnology: 0.0,
      engineering: 0.0,
      automation: 0.0,
      spaceflight: 0.0,
      planetaryEngineering: 0.0,
    };
  }

  const seed = deriveTechnologySeed(civilizationSeed, currentYear);
  const prng = createPRNG(seed);

  const deltaYears = Math.max(0, currentYear - emergenceEpochYear);

  // Innovation pace influenced by cognition, energy availability, and stability
  const cognitivePace =
    intelligence.abstractReasoning * 0.45 +
    intelligence.problemSolving * 0.35 +
    intelligence.toolUse * 0.2;

  const resourcePace =
    resources.energyAvailability * 0.5 +
    resources.mineralAvailability * 0.3 +
    resources.accessibleRawMaterials * 0.2;

  const paceMultiplier =
    (0.6 + cognitivePace * 0.8) *
    (0.6 + resourcePace * 0.6) *
    Math.max(0.2, stabilityModifier);

  // Effective technological progression time (with diminishing returns for ultra-deep time)
  const effectiveYears = deltaYears * paceMultiplier;

  // Normalized continuous technology level [0.0, 1.0] using an S-curve
  // Standard progression reaches industrial era around 60k-80k years
  const progressRatio = effectiveYears / 100_000;
  const level = Math.max(
    0.01,
    Math.min(1.0, 1.0 - Math.exp(-progressRatio * 1.5))
  );

  // Era determination
  let era: TechnologicalEra = 'STONE_AGE';
  if (level < 0.12) {
    era = 'STONE_AGE';
  } else if (level < 0.25) {
    era = 'AGRICULTURAL';
  } else if (level < 0.40) {
    era = 'BRONZE_IRON';
  } else if (level < 0.55) {
    era = 'ORGANIZED_PRE_INDUSTRIAL';
  } else if (level < 0.70) {
    era = 'INDUSTRIAL';
  } else if (level < 0.84) {
    era = 'ATOMIC_INFORMATION';
  } else if (level < 0.95) {
    era = 'INTERPLANETARY';
  } else {
    era = 'POST_SCARCITY';
  }

  // Domain-specific derivations
  const noise = () => (prng.next() * 0.1 - 0.05);

  const knowledgeLevel = Math.max(0.01, Math.min(1.0, level * 1.05 + noise()));
  const engineering = Math.max(0.01, Math.min(1.0, level * 1.0 + noise()));
  const energyTechnology = Math.max(
    0.01,
    Math.min(1.0, Math.pow(level, 1.1) * resources.energyAvailability * 1.2 + noise())
  );

  // Computation starts slow, then accelerates post-industrial (level > 0.65)
  const computation = Math.max(
    0.0,
    Math.min(1.0, Math.max(0.0, (level - 0.55) / 0.45) * intelligence.abstractReasoning + noise())
  );

  // Automation tracks computation and engineering
  const automation = Math.max(
    0.0,
    Math.min(1.0, computation * 0.7 + engineering * 0.3)
  );

  // Biotechnology tracks knowledge level and biological productivity
  const biotechnology = Math.max(
    0.0,
    Math.min(1.0, Math.max(0.0, (level - 0.45) / 0.55) * resources.biologicalProductivity + noise())
  );

  // Spaceflight requires high engineering, energy, and computation
  const spaceflight = Math.max(
    0.0,
    Math.min(
      1.0,
      Math.max(0.0, (level - 0.68) / 0.32) * (engineering * 0.5 + computation * 0.5)
    )
  );

  // Planetary engineering is pinnacle planetary management
  const planetaryEngineering = Math.max(
    0.0,
    Math.min(1.0, Math.max(0.0, (level - 0.82) / 0.18) * spaceflight)
  );

  return {
    era,
    level: Math.round(level * 1000) / 1000,
    knowledgeLevel: Math.round(knowledgeLevel * 1000) / 1000,
    energyTechnology: Math.round(energyTechnology * 1000) / 1000,
    computation: Math.round(computation * 1000) / 1000,
    biotechnology: Math.round(biotechnology * 1000) / 1000,
    engineering: Math.round(engineering * 1000) / 1000,
    automation: Math.round(automation * 1000) / 1000,
    spaceflight: Math.round(spaceflight * 1000) / 1000,
    planetaryEngineering: Math.round(planetaryEngineering * 1000) / 1000,
  };
}
