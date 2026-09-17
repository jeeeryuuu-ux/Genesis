/**
 * @license Apache-2.0
 * GENESIS EVOLUTION & FITNESS ENGINE
 *
 * Deterministically simulates macro-level biological adaptation, fitness evaluation,
 * speciation divergence, and extinction under changing planetary conditions.
 *
 * GUARANTEES:
 * - Analytical & macro-evolutionary: O(1) per epoch step, no individual organism loops.
 * - Deterministic: Same species seed + environment state + epoch = exact same outcome.
 * - Historical preservation: Extinct species are preserved with extinction year.
 */

import { deriveEvolutionSeed, deriveSpeciesSeed, deriveTraitSeed } from '../../core/hierarchy.js';
import { createPRNG } from '../../core/prng.js';
import type { EntityId, Planet, Seed, Year } from '../../core/types.js';
import type { PlanetaryTemporalState, StellarTemporalState } from '../simulation/types.js';
import { deriveVisualDescriptor } from './traits.js';
import type {
  BiologicalComplexity,
  Species,
  SpeciesFitness,
  SpeciesStatus,
  TraitProfile,
} from './types.js';

/**
 * Evaluates the fitness of a species against the current planetary environment.
 */
export function evaluateFitness(
  speciesTraits: TraitProfile,
  planet: Planet,
  temporalState?: PlanetaryTemporalState,
  starState?: StellarTemporalState
): SpeciesFitness {
  const currentTemp = temporalState?.effectiveTempKelvin ?? planet.averageTempKelvin;
  const currentPressure = temporalState?.surfacePressureAtm ?? planet.atmosphere.surfacePressureAtm;
  const hydrosphere = temporalState?.hydrosphereCoverage ?? planet.hydrosphereCoverage;
  const iceCoverage = temporalState?.iceCoverage ?? 0.0;
  const liquidWater = Math.max(0.0, hydrosphere * (1.0 - iceCoverage * 0.85));
  const incidentFlux = temporalState?.incidentFluxSolar ?? 1.0;

  // 1. Temperature Fitness
  const tempTol = speciesTraits.physical.temperatureToleranceKelvin;
  let temperatureFitness = 0.0;
  if (currentTemp >= tempTol.min && currentTemp <= tempTol.max) {
    const deviation = Math.abs(currentTemp - tempTol.optimal);
    const span = currentTemp < tempTol.optimal ? tempTol.optimal - tempTol.min : tempTol.max - tempTol.optimal;
    temperatureFitness = span > 0 ? Math.max(0.1, 1.0 - (deviation / span) * 0.85) : 1.0;
  } else {
    // Outside viable range
    const overflow = currentTemp < tempTol.min ? tempTol.min - currentTemp : currentTemp - tempTol.max;
    temperatureFitness = Math.max(0.0, 0.1 - (overflow / 30) * 0.1);
  }

  // 2. Water Fitness
  const waterDep = speciesTraits.ecological.waterDependency;
  let waterFitness = 1.0;
  if (waterDep > 0.1) {
    if (liquidWater >= waterDep * 0.5) {
      waterFitness = Math.min(1.0, 0.6 + 0.4 * (liquidWater / waterDep));
    } else {
      waterFitness = Math.max(0.0, (liquidWater / (waterDep * 0.5)) * 0.6);
    }
  }

  // 3. Pressure Fitness
  const pressTol = speciesTraits.physical.pressureToleranceAtm;
  let pressureFitness = 0.0;
  if (currentPressure >= pressTol.min && currentPressure <= pressTol.max) {
    const pDev = Math.abs(currentPressure - pressTol.optimal);
    const pSpan =
      currentPressure < pressTol.optimal
        ? pressTol.optimal - pressTol.min
        : pressTol.max - pressTol.optimal;
    pressureFitness = pSpan > 0 ? Math.max(0.1, 1.0 - (pDev / pSpan) * 0.85) : 1.0;
  } else {
    const pOver =
      currentPressure < pressTol.min ? pressTol.min - currentPressure : currentPressure - pressTol.max;
    pressureFitness = Math.max(0.0, 0.1 - (pOver / 3.0) * 0.1);
  }

  // 4. Energy Fitness
  let energyFitness = 0.8;
  const metabolism = speciesTraits.metabolic.metabolism;
  if (metabolism === 'PHOTOSYNTHESIS') {
    if (incidentFlux >= 0.1 && incidentFlux <= 3.0) {
      energyFitness = Math.min(1.0, 0.5 + 0.5 * (incidentFlux > 1 ? 2 - incidentFlux : incidentFlux));
    } else {
      energyFitness = Math.max(0.05, 0.5 / (1.0 + Math.abs(incidentFlux - 1.0)));
    }
  } else if (metabolism === 'AEROBIC') {
    const o2 = planet.atmosphere.oxygen;
    energyFitness = o2 > 0.05 ? Math.min(1.0, 0.4 + o2 * 2.5) : Math.max(0.05, o2 * 5.0);
  } else if (metabolism === 'CHEMOSYNTHESIS') {
    energyFitness = 0.85; // Chemosynthesis is robust against stellar fluctuations
  }

  // 5. Radiation Fitness
  const radTol = speciesTraits.physical.radiationTolerance;
  let radiationFitness = 1.0;
  const stellarHazard = incidentFlux > 2.5 ? (incidentFlux - 2.5) * 0.4 : 0.0;
  if (stellarHazard > radTol) {
    radiationFitness = Math.max(0.05, 1.0 - (stellarHazard - radTol));
  }

  // 6. Overall Composite Fitness
  // Law of the Minimum (Liebig): the lowest factor strongly constrains the overall fitness
  const components = [
    { name: 'Temperature', val: temperatureFitness },
    { name: 'Hydrosphere / Water', val: waterFitness },
    { name: 'Atmospheric Pressure', val: pressureFitness },
    { name: 'Metabolic Energy', val: energyFitness },
    { name: 'Radiation Protection', val: radiationFitness },
  ];

  components.sort((a, b) => a.val - b.val);
  const lowest = components[0];

  // Geometric/harmonic blend giving weight to the limiting factor
  const avg =
    temperatureFitness * 0.28 +
    waterFitness * 0.25 +
    pressureFitness * 0.2 +
    energyFitness * 0.17 +
    radiationFitness * 0.1;

  const overallFitness = Number(Math.max(0.0, Math.min(1.0, avg * 0.6 + lowest.val * 0.4)).toFixed(3));

  return {
    overallFitness,
    temperatureFitness: Number(temperatureFitness.toFixed(3)),
    waterFitness: Number(waterFitness.toFixed(3)),
    pressureFitness: Number(pressureFitness.toFixed(3)),
    energyFitness: Number(energyFitness.toFixed(3)),
    radiationFitness: Number(radiationFitness.toFixed(3)),
    limitingFactor: lowest.val < 0.4 ? `${lowest.name} Deficit` : 'Balanced Environment',
  };
}

/**
 * Computes demographic status based on fitness and historical status.
 */
export function determineSpeciesStatus(
  fitness: SpeciesFitness,
  currentStatus: SpeciesStatus
): SpeciesStatus {
  if (currentStatus === 'EXTINCT') return 'EXTINCT';

  if (fitness.overallFitness < 0.12) {
    return 'EXTINCT';
  } else if (fitness.overallFitness < 0.3) {
    return 'ENDANGERED';
  } else if (fitness.overallFitness < 0.5) {
    return 'DECLINING';
  } else if (fitness.overallFitness < 0.75) {
    return 'STABLE';
  } else {
    return 'THRIVING';
  }
}

/**
 * Evolves a species' trait profile adaptively towards the current planetary environment.
 */
export function adaptTraits(
  species: Species,
  planet: Planet,
  epochYear: Year,
  temporalState?: PlanetaryTemporalState
): TraitProfile {
  const seed = deriveEvolutionSeed(species.seed, epochYear);
  const prng = createPRNG(seed);
  const traits = species.traits;

  const currentTemp = temporalState?.effectiveTempKelvin ?? planet.averageTempKelvin;
  const currentPressure = temporalState?.surfacePressureAtm ?? planet.atmosphere.surfacePressureAtm;

  // Temperature tolerance adaptation: shifts optimal towards current temperature
  const tempShift = (currentTemp - traits.physical.temperatureToleranceKelvin.optimal) * 0.25;
  const newTempOptimal = Math.round(traits.physical.temperatureToleranceKelvin.optimal + tempShift);
  const tempSpan = Math.round(
    (traits.physical.temperatureToleranceKelvin.max - traits.physical.temperatureToleranceKelvin.min) / 2
  );

  const newTempTol = {
    min: newTempOptimal - tempSpan,
    max: newTempOptimal + tempSpan,
    optimal: newTempOptimal,
  };

  // Pressure tolerance adaptation
  const pressShift = (currentPressure - traits.physical.pressureToleranceAtm.optimal) * 0.2;
  const newPressOptimal = Number(
    Math.max(0.02, traits.physical.pressureToleranceAtm.optimal + pressShift).toFixed(2)
  );
  const pressSpan = Number(
    Math.max(
      0.1,
      (traits.physical.pressureToleranceAtm.max - traits.physical.pressureToleranceAtm.min) / 2
    ).toFixed(2)
  );

  const newPressTol = {
    min: Number(Math.max(0.01, newPressOptimal - pressSpan).toFixed(2)),
    max: Number((newPressOptimal + pressSpan).toFixed(2)),
    optimal: newPressOptimal,
  };

  // Trait mutations
  const mutRate = prng.nextFloat(-0.05, 0.05);
  const newEnergyEff = Math.max(0.1, Math.min(0.98, traits.metabolic.energyEfficiency + mutRate));

  return {
    ...traits,
    physical: {
      ...traits.physical,
      temperatureToleranceKelvin: newTempTol,
      pressureToleranceAtm: newPressTol,
    },
    metabolic: {
      ...traits.metabolic,
      energyEfficiency: Number(newEnergyEff.toFixed(3)),
    },
  };
}

/**
 * Creates a diverged descendant species through speciation.
 */
export function divergeSpecies(
  parent: Species,
  speciationIndex: number,
  planet: Planet,
  epochYear: Year,
  temporalState?: PlanetaryTemporalState
): Species {
  const childSeed = deriveSpeciesSeed(parent.seed, speciationIndex + 100);
  const prng = createPRNG(childSeed);

  // New species entity ID
  const childId = `${parent.planetId}/b:${parent.origin.toLowerCase().slice(0, 3)}_${speciationIndex}`;

  // Slightly mutated traits for specialization
  const baseTraits = adaptTraits(parent, planet, epochYear, temporalState);
  const complexityProgression: Record<BiologicalComplexity, BiologicalComplexity> = {
    MOLECULAR: 'PROTOCELL',
    PROTOCELL: 'UNICELLULAR',
    UNICELLULAR: 'COLONIAL',
    COLONIAL: 'MULTICELLULAR',
    MULTICELLULAR: 'COMPLEX',
    COMPLEX: 'COMPLEX',
  };

  // Chance to advance complexity if parent has thrived for over 1 billion years
  const ageYears = epochYear - parent.originEpochYear;
  const shouldAdvanceComplexity = ageYears > 800_000_000 && prng.nextFloat(0, 1) < 0.45;
  const childComplexity = shouldAdvanceComplexity
    ? complexityProgression[parent.complexity]
    : parent.complexity;

  // New diverged name
  const greekPrefixes = ['Proto', 'Neo', 'Crypto', 'Archeo', 'Syn', 'Paleo', 'Eu'];
  const latinRoots = ['phyta', 'bion', 'zoa', 'forme', 'stoma', 'dermis', 'morph'];
  const prefix = greekPrefixes[prng.nextInt(0, greekPrefixes.length - 1)];
  const root = latinRoots[prng.nextInt(0, latinRoots.length - 1)];
  const childName = `${prefix}${parent.name} ${root}`;

  const childFitness = evaluateFitness(baseTraits, planet, temporalState);
  const childStatus = determineSpeciesStatus(childFitness, 'THRIVING');
  const childVisual = deriveVisualDescriptor(childSeed, childComplexity, baseTraits);

  const populationEstimate = Math.round(
    parent.populationEstimate * prng.nextFloat(0.1, 0.4)
  );

  return {
    id: childId,
    seed: childSeed,
    planetId: parent.planetId,
    name: childName,
    originEpochYear: epochYear,
    parentSpeciesId: parent.id,
    origin: parent.origin,
    complexity: childComplexity,
    populationEstimate: Math.max(10_000, populationEstimate),
    status: childStatus,
    traits: baseTraits,
    visual: childVisual,
    fitness: childFitness,
  };
}
