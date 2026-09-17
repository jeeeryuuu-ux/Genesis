/**
 * @license Apache-2.0
 * GENESIS CIVILIZATION GENERATOR
 *
 * Deterministically synthesizes full Civilization entities, naming identities,
 * societal infrastructure profiles, and chronological milestone logs.
 */

import { deriveCivilizationSeed, deriveSocietySeed } from '../../core/hierarchy.js';
import { createPRNG } from '../../core/prng.js';
import type { Planet, Seed, Year } from '../../core/types.js';
import type { HabitabilityAssessment, Species } from '../biology/types.js';
import { evaluateIntelligence } from './intelligence.js';
import { evaluatePopulation } from './population.js';
import { evaluatePlanetaryResources } from './resources.js';
import { evaluateCivilizationStability } from './stability.js';
import { evaluateTechnology } from './technology.js';
import type {
  Civilization,
  CivilizationMilestone,
  CivilizationRecord,
  SettlementTier,
  SocietalProfile,
} from './types.js';

const CULTURE_SUFFIXES = [
  'Concord',
  'Ascendancy',
  'Commonwealth',
  'Dominion',
  'League',
  'Ecumene',
  'Compact',
  'Confederation',
  'Sovereignty',
  'Syndicate',
  'Collective',
  'Assembly',
];

/**
 * Deterministically constructs a civilization name based on species and civilization seed.
 */
export function generateCivilizationName(speciesName: string, civSeed: Seed): string {
  const prng = createPRNG(civSeed);
  const suffix = CULTURE_SUFFIXES[Math.floor(prng.next() * CULTURE_SUFFIXES.length)];
  return `${speciesName} ${suffix}`;
}

/**
 * Generates the societal profile for a civilization at a given technology era.
 */
export function generateSocietalProfile(
  civSeed: Seed,
  era: string,
  techLevel: number,
  stabilityIndex: number
): SocietalProfile {
  const seed = deriveSocietySeed(civSeed);
  const prng = createPRNG(seed);

  let settlementType: SettlementTier = 'TRIBAL_CAMPS';
  switch (era) {
    case 'STONE_AGE':
      settlementType = 'TRIBAL_CAMPS';
      break;
    case 'AGRICULTURAL':
      settlementType = 'PERMANENT_VILLAGES';
      break;
    case 'BRONZE_IRON':
      settlementType = 'CITY_STATES';
      break;
    case 'ORGANIZED_PRE_INDUSTRIAL':
      settlementType = 'NATION_NETWORKS';
      break;
    case 'INDUSTRIAL':
    case 'ATOMIC_INFORMATION':
      settlementType = 'GLOBAL_METROPOLIS';
      break;
    case 'INTERPLANETARY':
    case 'POST_SCARCITY':
      settlementType = 'PLANETARY_CIVILIZATION';
      break;
  }

  const socialComplexity = Math.max(0.05, Math.min(1.0, techLevel * 0.8 + (prng.next() * 0.15)));
  const collectiveCoordination = Math.max(
    0.1,
    Math.min(1.0, stabilityIndex * 0.6 + socialComplexity * 0.3 + (prng.next() * 0.1))
  );
  const governanceCohesion = Math.max(0.1, Math.min(1.0, stabilityIndex * 0.7 + (prng.next() * 0.2)));
  const culturalDiversity = Math.max(0.1, Math.min(1.0, 0.4 + prng.next() * 0.5));

  return {
    socialComplexity: Math.round(socialComplexity * 1000) / 1000,
    settlementType,
    collectiveCoordination: Math.round(collectiveCoordination * 1000) / 1000,
    governanceCohesion: Math.round(governanceCohesion * 1000) / 1000,
    culturalDiversity: Math.round(culturalDiversity * 1000) / 1000,
  };
}

/**
 * Procedurally generates the chronological milestones achieved by a civilization.
 */
export function generateMilestones(
  civSeed: Seed,
  emergenceEpochYear: Year,
  currentYear: Year,
  era: string,
  status: string
): readonly CivilizationMilestone[] {
  const prng = createPRNG(civSeed);
  const milestones: CivilizationMilestone[] = [];

  const addMilestone = (
    id: string,
    offsetYears: number,
    title: string,
    description: string,
    category: CivilizationMilestone['category']
  ) => {
    const year = emergenceEpochYear + offsetYears;
    if (year <= currentYear) {
      milestones.push({ id, year, title, description, category });
    }
  };

  // 1. Emergence
  addMilestone(
    'dawn_of_sapience',
    0,
    'Dawn of Conceptual Sapience',
    'Species achieves symbolic cognition, complex acoustic syntax, and purposive tool alteration.',
    'COGNITIVE'
  );

  // 2. Early tool & fire control
  addMilestone(
    'pyrotechnic_mastery',
    2_500 + Math.floor(prng.next() * 1_000),
    'Controlled Thermal Pyrotechnics',
    'First deliberate mastery of combustion and hearth-based thermal shielding against ecological elements.',
    'TECHNOLOGICAL'
  );

  // 3. Agricultural revolution
  if (era !== 'STONE_AGE') {
    addMilestone(
      'agrarian_sedentism',
      12_000 + Math.floor(prng.next() * 3_000),
      'Agricultural Sedentism',
      'Domestication of indigenous flora, regional irrigation grids, and permanent civic settlement.',
      'SOCIETAL'
    );
  }

  // 4. Metallurgy and codification
  if (
    era === 'BRONZE_IRON' ||
    era === 'ORGANIZED_PRE_INDUSTRIAL' ||
    era === 'INDUSTRIAL' ||
    era === 'ATOMIC_INFORMATION' ||
    era === 'INTERPLANETARY' ||
    era === 'POST_SCARCITY'
  ) {
    addMilestone(
      'metallurgical_codification',
      28_000 + Math.floor(prng.next() * 4_000),
      'Metallurgy & Epigraphic Codification',
      'Thermal smelting of mineral ores paired with transgenerational legal and mathematical inscriptions.',
      'TECHNOLOGICAL'
    );
  }

  // 5. Industrialization
  if (
    era === 'INDUSTRIAL' ||
    era === 'ATOMIC_INFORMATION' ||
    era === 'INTERPLANETARY' ||
    era === 'POST_SCARCITY'
  ) {
    addMilestone(
      'mechanized_industrialization',
      62_000 + Math.floor(prng.next() * 5_000),
      'Fossil & Mechanized Industrialization',
      'Thermodynamic engines replace somatic labor, sparking exponential resource extraction and urbanization.',
      'TECHNOLOGICAL'
    );
  }

  // 6. Computing & spaceflight
  if (era === 'ATOMIC_INFORMATION' || era === 'INTERPLANETARY' || era === 'POST_SCARCITY') {
    addMilestone(
      'computation_orbital_reach',
      78_000 + Math.floor(prng.next() * 4_000),
      'Microcomputation & Orbital Insertion',
      'Silicon/optical automated logic gates paired with chemical/nuclear orbital rocketry into low planetary orbit.',
      'TECHNOLOGICAL'
    );
  }

  // 7. Interplanetary / Megastructures
  if (era === 'INTERPLANETARY' || era === 'POST_SCARCITY') {
    addMilestone(
      'interplanetary_expansion',
      96_000 + Math.floor(prng.next() * 8_000),
      'Interplanetary Resource Extraction',
      'Autonomous orbital colonies and magnetic mass-drivers harvesting natural satellites and asteroidal belts.',
      'TECHNOLOGICAL'
    );
  }

  // 8. Post-Scarcity
  if (era === 'POST_SCARCITY') {
    addMilestone(
      'scarcity_transcendence',
      125_000 + Math.floor(prng.next() * 10_000),
      'Post-Scarcity Planetary Equilibrium',
      'Closed-loop planetary matter synthesis and artificial magnetosphere management.',
      'SOCIETAL'
    );
  }

  // 9. Crisis or Extinction milestone
  if (status === 'COLLAPSING') {
    addMilestone(
      'civilizational_crisis',
      Math.max(0, currentYear - emergenceEpochYear - 500),
      'Systemic Ecospheric Crisis',
      'Widespread failure of resource distribution networks, ecological collapse, and civil strife.',
      'CRISIS'
    );
  } else if (status === 'EXTINCT') {
    addMilestone(
      'civilizational_extinction',
      Math.max(0, currentYear - emergenceEpochYear),
      'Societal Dissolution & Extinction',
      'Complete demographic cessation and collapse of civil infrastructure into geological strata.',
      'CRISIS'
    );
  }

  return milestones;
}

/**
 * Generates an authoritative Civilization entity for a planet, species, and emergence epoch.
 */
export function generateCivilization(
  planet: Planet,
  species: Species,
  civilizationIndex: number,
  emergenceEpochYear: Year,
  currentYear: Year,
  habitability: HabitabilityAssessment
): Civilization {
  const seed = deriveCivilizationSeed(planet.seed, civilizationIndex);
  const name = generateCivilizationName(species.name, seed);
  const id = `${planet.id}/civ${civilizationIndex}`;

  const intelligence = evaluateIntelligence(species, planet, habitability);
  const initialResources = evaluatePlanetaryResources(planet, habitability);

  // Evaluate baseline technology
  const initialTech = evaluateTechnology(
    seed,
    emergenceEpochYear,
    currentYear,
    intelligence,
    initialResources
  );

  // Initial population
  const popResult = evaluatePopulation(
    seed,
    emergenceEpochYear,
    currentYear,
    species,
    planet,
    initialResources,
    initialTech,
    1.0
  );

  // Evaluate dynamic resources under consumption stress
  const dynamicResources = evaluatePlanetaryResources(
    planet,
    habitability,
    initialTech,
    popResult.currentPopulation
  );

  // Evaluate systemic stability
  const { stability, status } = evaluateCivilizationStability(
    seed,
    emergenceEpochYear,
    currentYear,
    habitability,
    dynamicResources,
    initialTech,
    popResult.currentPopulation,
    popResult.carryingCapacity
  );

  // Refined technology with stability modifier
  const technology = evaluateTechnology(
    seed,
    emergenceEpochYear,
    currentYear,
    intelligence,
    dynamicResources,
    stability.stabilityIndex
  );

  // Final population under calculated stability
  const population =
    status === 'EXTINCT'
      ? 0
      : evaluatePopulation(
          seed,
          emergenceEpochYear,
          currentYear,
          species,
          planet,
          dynamicResources,
          technology,
          stability.stabilityIndex
        ).currentPopulation;

  const peakPopulation = popResult.peakPopulation;
  const society = generateSocietalProfile(seed, technology.era, technology.level, stability.stabilityIndex);
  const milestones = generateMilestones(seed, emergenceEpochYear, currentYear, technology.era, status);

  return {
    id,
    seed,
    name,
    planetId: planet.id,
    speciesId: species.id,
    speciesName: species.name,
    emergenceEpochYear,
    extinctionEpochYear: status === 'EXTINCT' ? currentYear : undefined,
    status,
    intelligence,
    society,
    technology,
    resources: dynamicResources,
    stability,
    population,
    peakPopulation,
    milestones,
  };
}

/**
 * Creates a historical record of a civilization for preservation.
 */
export function createCivilizationRecord(civ: Civilization): CivilizationRecord {
  return {
    civilizationId: civ.id,
    name: civ.name,
    emergenceEpoch: civ.emergenceEpochYear,
    extinctionEpoch: civ.extinctionEpochYear,
    primaryOriginSpecies: civ.speciesName,
    peakPopulation: civ.peakPopulation,
    peakTechnology: civ.technology.level,
    peakEra: civ.technology.era,
    extinctionCause: civ.stability.primaryStressFactor,
  };
}
