/**
 * @license Apache-2.0
 * GENESIS BIOSPHERE & LIFE MATERIALIZATION ENGINE
 *
 * Coordinates planetary life emergence, macro-evolutionary progression,
 * speciation diversification, ecosystem assembly, and lazy summary generation.
 *
 * ARCHITECTURAL GUARANTEES:
 * - Lazy Generation: Summaries are evaluated in O(1) without building large graphs.
 * - Deterministic: Same planet + seed + epochYear produces identical biosphere.
 * - Temporal Responsiveness: Reacts to changing planetary temperatures and stellar stages.
 */

import { deriveBiologySeed } from '../../core/hierarchy.js';
import { createPRNG } from '../../core/prng.js';
import type { Planet, Year } from '../../core/types.js';
import type { PlanetaryTemporalState, StellarTemporalState } from '../simulation/types.js';
import { evaluateAbiogenesis } from './abiogenesis.js';
import { buildEcosystem } from './ecosystem.js';
import { adaptTraits, determineSpeciesStatus, divergeSpecies, evaluateFitness } from './evolution.js';
import { assessHabitability } from './habitability.js';
import { generateSpecies } from './species.js';
import type {
  BiologicalComplexity,
  Biosphere,
  BiosphereSummary,
  LifeOriginType,
  Species,
} from './types.js';

/**
 * Derives the highest biological complexity achievable given evolutionary time and environmental limits.
 */
function deriveComplexityFromEpoch(
  elapsedYears: number,
  habitabilityScore: number,
  oxygenFraction: number
): BiologicalComplexity {
  if (elapsedYears < 400_000_000) return 'UNICELLULAR';
  if (elapsedYears < 1_200_000_000) return 'COLONIAL';
  if (elapsedYears < 2_400_000_000) return 'MULTICELLULAR';

  // For COMPLEX animal/plant life, sufficient oxygen and stable habitability are required
  if (habitabilityScore >= 0.55 && oxygenFraction > 0.05) {
    return 'COMPLEX';
  }
  return 'MULTICELLULAR';
}

/**
 * Computes a lightweight Biosphere summary for HUD and high-level celestial panels.
 * strictly O(1) performance — never materializes entire species lineages or ecosystems.
 */
export function summarizeBiosphere(
  planet: Planet,
  epochYear: Year,
  temporalState?: PlanetaryTemporalState,
  starState?: StellarTemporalState
): BiosphereSummary {
  const habitability = assessHabitability(planet, temporalState, starState);
  const abiogenesis = evaluateAbiogenesis(planet, epochYear, temporalState, starState);

  if (!abiogenesis.hasLifeEmergence || !abiogenesis.emergenceYear) {
    return {
      planetId: planet.id,
      habitability,
      hasLife: false,
      highestComplexity: 'MOLECULAR',
      activeSpeciesCount: 0,
      extinctSpeciesCount: 0,
      biomassTonsEstimate: 0,
    };
  }

  const elapsedYears = Math.max(0, epochYear - abiogenesis.emergenceYear);
  const complexity = deriveComplexityFromEpoch(
    elapsedYears,
    habitability.score,
    planet.atmosphere.oxygen
  );

  // Estimate species count logarithmically scaling with time and habitability
  const prng = createPRNG(deriveBiologySeed(planet.seed));
  const baseCount = Math.floor(
    (1 + Math.log10(1 + elapsedYears / 100_000_000)) * (habitability.score * 120 + 20)
  );
  const speciesCount = Math.max(1, Math.round(baseCount * prng.nextFloat(0.8, 1.3)));

  // Estimate biomass tons
  const planetAreaFactor = Math.pow(planet.radiusKm / 6371, 2);
  const biomassTons = Math.round(
    1e7 * planetAreaFactor * habitability.score * (complexity === 'COMPLEX' ? 50 : 5)
  );

  return {
    planetId: planet.id,
    habitability,
    hasLife: true,
    abiogenesisYear: abiogenesis.emergenceYear,
    dominantOrigin: abiogenesis.origin,
    highestComplexity: complexity,
    activeSpeciesCount: speciesCount,
    extinctSpeciesCount: Math.round(speciesCount * 0.3),
    biomassTonsEstimate: biomassTons,
  };
}

/**
 * Materializes the full authoritative planetary biosphere, representative foundational
 * species, evolutionary divergence, and ecosystem structure.
 */
export function materializeBiosphere(
  planet: Planet,
  epochYear: Year,
  temporalState?: PlanetaryTemporalState,
  starState?: StellarTemporalState
): Biosphere {
  const summary = summarizeBiosphere(planet, epochYear, temporalState, starState);
  const seed = deriveBiologySeed(planet.seed);

  if (!summary.hasLife || !summary.abiogenesisYear || !summary.dominantOrigin) {
    const emptyEcosystem = buildEcosystem(planet, [], 'AQUATIC');
    return {
      planetId: planet.id,
      seed,
      epochYear,
      summary,
      activeSpecies: [],
      extinctSpecies: [],
      ecosystem: emptyEcosystem,
    };
  }

  const emergenceYear = summary.abiogenesisYear;
  const origin = summary.dominantOrigin;
  const elapsedYears = epochYear - emergenceYear;
  const highestComplexity = summary.highestComplexity;

  // 1. Generate pioneer species lineages (Producer, Decomposer/Consumer)
  const pioneerProducer = generateSpecies(
    planet,
    0,
    origin,
    elapsedYears > 600_000_000 ? 'COLONIAL' : 'UNICELLULAR',
    'PRODUCER',
    emergenceYear,
    temporalState,
    starState
  );

  const pioneerDecomposer = generateSpecies(
    planet,
    1,
    origin,
    'UNICELLULAR',
    'DECOMPOSER',
    emergenceYear + 50_000_000,
    temporalState,
    starState
  );

  const allSpecies: Species[] = [pioneerProducer, pioneerDecomposer];

  // 2. Generate diverged species if evolutionary time has elapsed
  if (elapsedYears > 300_000_000) {
    // Primary consumer / herbivore divergence
    const herbivore = divergeSpecies(
      pioneerProducer,
      2,
      planet,
      emergenceYear + 300_000_000,
      temporalState
    );
    allSpecies.push({
      ...herbivore,
      traits: {
        ...herbivore.traits,
        ecological: {
          ...herbivore.traits.ecological,
          trophicRole: 'CONSUMER',
          dietStrategy: 'HERBIVORE',
        },
      },
    });
  }

  if (elapsedYears > 800_000_000) {
    // Secondary consumer / predator divergence
    const predator = divergeSpecies(
      allSpecies[allSpecies.length - 1],
      3,
      planet,
      emergenceYear + 800_000_000,
      temporalState
    );
    allSpecies.push({
      ...predator,
      complexity: highestComplexity === 'COMPLEX' ? 'MULTICELLULAR' : predator.complexity,
      traits: {
        ...predator.traits,
        ecological: {
          ...predator.traits.ecological,
          trophicRole: 'PREDATOR',
          dietStrategy: 'CARNIVORE',
        },
      },
    });
  }

  if (elapsedYears > 1_500_000_000 && highestComplexity === 'COMPLEX') {
    // Apex complex species
    const apex = divergeSpecies(
      allSpecies[allSpecies.length - 1],
      4,
      planet,
      emergenceYear + 1_500_000_000,
      temporalState
    );
    allSpecies.push({
      ...apex,
      complexity: 'COMPLEX',
      traits: {
        ...apex.traits,
        ecological: {
          ...apex.traits.ecological,
          trophicRole: 'PREDATOR',
          dietStrategy: 'CARNIVORE',
        },
      },
    });
  }

  // 3. Evolve and evaluate fitness of all species under current temporal state
  const activeSpecies: Species[] = [];
  const extinctSpecies: Species[] = [];

  for (const sp of allSpecies) {
    // Adapt traits over time to current environment
    const currentTraits = adaptTraits(sp, planet, epochYear, temporalState);
    const fitness = evaluateFitness(currentTraits, planet, temporalState, starState);
    const status = determineSpeciesStatus(fitness, sp.status);

    if (status === 'EXTINCT') {
      extinctSpecies.push({
        ...sp,
        status: 'EXTINCT',
        fitness,
        extinctionEpochYear: epochYear,
      });
    } else {
      activeSpecies.push({
        ...sp,
        traits: currentTraits,
        fitness,
        status,
      });
    }
  }

  // 4. Construct ecosystem network
  const ecosystem = buildEcosystem(planet, activeSpecies, origin);

  return {
    planetId: planet.id,
    seed,
    epochYear,
    summary: {
      ...summary,
      activeSpeciesCount: Math.max(activeSpecies.length, summary.activeSpeciesCount),
      extinctSpeciesCount: extinctSpecies.length,
    },
    activeSpecies,
    extinctSpecies,
    ecosystem,
  };
}
