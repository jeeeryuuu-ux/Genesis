/**
 * @license Apache-2.0
 * GENESIS CIVILIZATION LIFECYCLE CONTROLLER
 *
 * Orchestrates multi-civilization materialization, eligibility filtering across
 * biosphere species, temporal progression, and historical summarization.
 */

import { deriveCivilizationSeed } from '../../core/hierarchy.js';
import { createPRNG } from '../../core/prng.js';
import type { Planet, Year } from '../../core/types.js';
import type { HabitabilityAssessment, Species } from '../biology/types.js';
import { generateCivilization } from './civilization.js';
import { evaluateCivilizationEligibility } from './eligibility.js';
import { evaluateIntelligence } from './intelligence.js';
import type {
  Civilization,
  PlanetaryCivilizationSummary,
  TechnologicalEra,
} from './types.js';

const ERA_RANK: Record<TechnologicalEra, number> = {
  STONE_AGE: 0,
  AGRICULTURAL: 1,
  BRONZE_IRON: 2,
  ORGANIZED_PRE_INDUSTRIAL: 3,
  INDUSTRIAL: 4,
  ATOMIC_INFORMATION: 5,
  INTERPLANETARY: 6,
  POST_SCARCITY: 7,
};

/**
 * Materializes all civilizations for a given planet and epoch.
 */
export function materializeCivilizations(
  planet: Planet,
  currentYear: Year,
  habitability: HabitabilityAssessment,
  speciesList: readonly Species[]
): readonly Civilization[] {
  const civilizations: Civilization[] = [];
  let civIndexCounter = 0;

  for (const species of speciesList) {
    const intelligence = evaluateIntelligence(species, planet, habitability);
    if (!intelligence.isSapient) continue;

    const eligibility = evaluateCivilizationEligibility(
      species,
      intelligence,
      planet,
      habitability
    );

    if (!eligibility.isEligible) continue;

    // Check if emergence has occurred by current simulation year
    if (currentYear >= eligibility.emergenceEpochYear) {
      // Primary civilization for this sapient species
      const primaryCiv = generateCivilization(
        planet,
        species,
        civIndexCounter++,
        eligibility.emergenceEpochYear,
        currentYear,
        habitability
      );
      civilizations.push(primaryCiv);

      // Multiple civilization emergence check:
      // If planet has large land area (hydrosphere < 0.8) and long developmental history,
      // a secondary regional civilization can emerge deterministically
      const civSeed = deriveCivilizationSeed(planet.seed, civIndexCounter);
      const prng = createPRNG(civSeed);
      const deltaYears = currentYear - eligibility.emergenceEpochYear;

      if (deltaYears > 15_000 && planet.hydrosphereCoverage < 0.75 && prng.next() < 0.5) {
        const secondaryEmergenceYear = eligibility.emergenceEpochYear + 8_000 + Math.floor(prng.next() * 10_000);
        if (currentYear >= secondaryEmergenceYear) {
          const secondaryCiv = generateCivilization(
            planet,
            species,
            civIndexCounter++,
            secondaryEmergenceYear,
            currentYear,
            habitability
          );
          civilizations.push(secondaryCiv);
        }
      }
    }
  }

  return civilizations;
}

/**
 * Summarizes the civilizational status of a planet into a lightweight telemetry object.
 */
export function summarizeCivilizations(
  planet: Planet,
  currentYear: Year,
  civilizations: readonly Civilization[]
): PlanetaryCivilizationSummary {
  if (civilizations.length === 0) {
    return {
      planetId: planet.id,
      currentYear,
      hasCivilization: false,
      activeCivilizationCount: 0,
      extinctCivilizationCount: 0,
      totalPopulation: 0,
      highestEra: 'STONE_AGE',
      highestTechLevel: 0.0,
      primaryCivilizationName: undefined,
      civilizations: [],
    };
  }

  let totalPopulation = 0;
  let activeCount = 0;
  let extinctCount = 0;
  let highestTechLevel = 0.0;
  let highestEra: TechnologicalEra = 'STONE_AGE';

  const civSummaries = civilizations.map((c) => {
    if (c.status === 'EXTINCT') {
      extinctCount++;
    } else {
      activeCount++;
      totalPopulation += c.population;
    }

    if (c.technology.level > highestTechLevel) {
      highestTechLevel = c.technology.level;
    }

    if (ERA_RANK[c.technology.era] > ERA_RANK[highestEra]) {
      highestEra = c.technology.era;
    }

    return {
      id: c.id,
      name: c.name,
      speciesName: c.speciesName,
      status: c.status,
      era: c.technology.era,
      population: c.population,
      techLevel: c.technology.level,
      stability: c.stability.stabilityIndex,
    };
  });

  return {
    planetId: planet.id,
    currentYear,
    hasCivilization: true,
    activeCivilizationCount: activeCount,
    extinctCivilizationCount: extinctCount,
    totalPopulation,
    highestEra,
    highestTechLevel: Math.round(highestTechLevel * 1000) / 1000,
    primaryCivilizationName: civilizations[0]?.name,
    civilizations: civSummaries,
  };
}
