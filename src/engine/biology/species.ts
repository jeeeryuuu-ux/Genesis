/**
 * @license Apache-2.0
 * GENESIS SPECIES GENERATOR
 *
 * Deterministically materializes initial species entities, taxonomic descriptors,
 * and statistical population structures from planetary origin conditions.
 */

import { deriveSpeciesSeed } from '../../core/hierarchy.js';
import { createPRNG } from '../../core/prng.js';
import type { EntityId, Planet, Seed, Year } from '../../core/types.js';
import type { PlanetaryTemporalState, StellarTemporalState } from '../simulation/types.js';
import { evaluateFitness } from './evolution.js';
import { deriveVisualDescriptor, generateInitialTraits } from './traits.js';
import type {
  BiologicalComplexity,
  LifeOriginType,
  Species,
  SpeciesStatus,
  TrophicRole,
} from './types.js';

const GENUS_ROOTS: Record<LifeOriginType, readonly string[]> = {
  AQUATIC: ['Pelago', 'Hydra', 'Thalasso', 'Necton', 'Oceanus'],
  HYDROTHERMAL: ['Thermo', 'Abysso', 'Pyrococcus', 'Sulfolobus', 'Ventibion'],
  SUBSURFACE: ['Crypto', 'Geo', 'Litho', 'Chthonio', 'Stygio'],
  ATMOSPHERIC: ['Aero', 'Nebulo', 'Vapo', 'Zephyro', 'Stratobion'],
  CHEMOSYNTHETIC: ['Methano', 'Ferro', 'Thio', 'Chemotroph', 'Nitro'],
  PHOTOSYNTHETIC: ['Cyano', 'Chloro', 'Helio', 'Phyto', 'Solari'],
  EXTREMOPHILE: ['Xero', 'Baro', 'Radio', 'Piezococcus', 'Tolerans'],
};

const SPECIES_EPITHETS: readonly string[] = [
  'primus',
  'antiquus',
  'vulgaris',
  'elegans',
  'abyssalis',
  'radiatus',
  'thermalis',
  'solaris',
  'viridis',
  'giganteus',
  'gracilis',
  'fragilis',
  'robustus',
  'tenax',
  'australis',
  'borealis',
];

/**
 * Generates a deterministic binomial scientific name for a species.
 */
export function generateSpeciesName(seed: Seed, origin: LifeOriginType): string {
  const prng = createPRNG(seed);
  const genusList = GENUS_ROOTS[origin] ?? GENUS_ROOTS.AQUATIC;
  const genus = genusList[prng.nextInt(0, genusList.length - 1)];
  const epithet = SPECIES_EPITHETS[prng.nextInt(0, SPECIES_EPITHETS.length - 1)];
  return `${genus} ${epithet}`;
}

/**
 * Procedurally generates a foundational species for an emerging biosphere.
 */
export function generateSpecies(
  planet: Planet,
  speciesIndex: number,
  origin: LifeOriginType,
  complexity: BiologicalComplexity,
  trophicRole: TrophicRole,
  originEpochYear: Year,
  temporalState?: PlanetaryTemporalState,
  starState?: StellarTemporalState
): Species {
  const seed = deriveSpeciesSeed(planet.seed, speciesIndex);
  const prng = createPRNG(seed);

  const id: EntityId = `${planet.id}/sp:${speciesIndex}`;
  const name = generateSpeciesName(seed, origin);

  const traits = generateInitialTraits(
    seed,
    planet,
    origin,
    complexity,
    trophicRole,
    temporalState
  );

  const fitness = evaluateFitness(traits, planet, temporalState, starState);

  // Compute statistical population size
  // Earth surface area ~ 5.1e8 km^2. Microbial biomass is massive, complex fauna is moderate.
  const planetAreaFactor = Math.pow(planet.radiusKm / 6371, 2);
  let basePop = 1e12; // Unicellular baseline
  if (complexity === 'COLONIAL') basePop = 5e9;
  else if (complexity === 'MULTICELLULAR') basePop = 5e7;
  else if (complexity === 'COMPLEX') basePop = 5e5;

  const populationEstimate = Math.round(
    basePop * planetAreaFactor * prng.nextFloat(0.5, 2.5) * Math.max(0.1, fitness.overallFitness)
  );

  let status: SpeciesStatus = 'THRIVING';
  if (fitness.overallFitness < 0.12) status = 'EXTINCT';
  else if (fitness.overallFitness < 0.3) status = 'ENDANGERED';
  else if (fitness.overallFitness < 0.5) status = 'DECLINING';
  else if (fitness.overallFitness < 0.75) status = 'STABLE';

  const visual = deriveVisualDescriptor(seed, complexity, traits);

  return {
    id,
    seed,
    planetId: planet.id,
    name,
    originEpochYear,
    origin,
    complexity,
    populationEstimate: Math.max(1_000, populationEstimate),
    status,
    traits,
    visual,
    fitness,
  };
}
