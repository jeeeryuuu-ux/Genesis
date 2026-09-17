/**
 * @license Apache-2.0
 * GENESIS TRAIT SYSTEM
 *
 * Deterministic generation and mutation of physical, metabolic, ecological,
 * sensory, and defensive traits for biological species.
 */

import { deriveTraitSeed } from '../../core/hierarchy.js';
import { createPRNG } from '../../core/prng.js';
import type { Planet, Seed } from '../../core/types.js';
import type { PlanetaryTemporalState } from '../simulation/types.js';
import type {
  BiologicalComplexity,
  DefenseTraits,
  EcologicalTraits,
  LifeOriginType,
  MetabolicTraits,
  MetabolismType,
  PhysicalTraits,
  SensoryTraits,
  TraitProfile,
  TrophicRole,
  VisualDescriptor,
} from './types.js';

/**
 * Procedurally selects compatible metabolic strategy based on environment and origin.
 */
export function selectMetabolism(
  planet: Planet,
  origin: LifeOriginType,
  complexity: BiologicalComplexity,
  seed: Seed,
  temporalState?: PlanetaryTemporalState
): MetabolismType {
  const prng = createPRNG(seed);
  const roll = prng.nextFloat(0, 1);
  const atm = planet.atmosphere;
  const hasOxygen = atm.oxygen > 0.08;

  if (complexity === 'COMPLEX' && hasOxygen) {
    return roll < 0.85 ? 'AEROBIC' : 'MIXOTROPHIC';
  }

  if (origin === 'PHOTOSYNTHETIC') {
    return roll < 0.85 ? 'PHOTOSYNTHESIS' : 'MIXOTROPHIC';
  }

  if (origin === 'HYDROTHERMAL' || origin === 'CHEMOSYNTHETIC') {
    return roll < 0.75 ? 'CHEMOSYNTHESIS' : 'ANAEROBIC';
  }

  if (origin === 'EXTREMOPHILE') {
    return 'EXTREMOPHILE';
  }

  if (origin === 'AQUATIC') {
    if (hasOxygen && roll < 0.5) return 'AEROBIC';
    if (roll < 0.8) return 'PHOTOSYNTHESIS';
    return 'ANAEROBIC';
  }

  if (hasOxygen && roll < 0.6) return 'AEROBIC';
  return 'ANAEROBIC';
}

/**
 * Generates an initial deterministic trait profile for a species.
 */
export function generateInitialTraits(
  speciesSeed: Seed,
  planet: Planet,
  origin: LifeOriginType,
  complexity: BiologicalComplexity,
  trophicRole: TrophicRole,
  temporalState?: PlanetaryTemporalState
): TraitProfile {
  const prng = createPRNG(speciesSeed);
  const planetTemp = temporalState?.effectiveTempKelvin ?? planet.averageTempKelvin;
  const planetPressure = temporalState?.surfacePressureAtm ?? planet.atmosphere.surfacePressureAtm;

  // 1. Physical Traits
  let sizeMeters = 1e-6; // Default microscopic (1 um)
  if (complexity === 'COLONIAL') sizeMeters = prng.nextFloat(0.0001, 0.005);
  else if (complexity === 'MULTICELLULAR') sizeMeters = prng.nextFloat(0.01, 0.5);
  else if (complexity === 'COMPLEX') sizeMeters = prng.nextFloat(0.1, 4.0);

  const densityKgM3 = Math.round(prng.nextFloat(900, 1200));
  const structuralComplexity =
    complexity === 'COMPLEX'
      ? prng.nextFloat(0.75, 1.0)
      : complexity === 'MULTICELLULAR'
      ? prng.nextFloat(0.45, 0.75)
      : complexity === 'COLONIAL'
      ? prng.nextFloat(0.25, 0.5)
      : prng.nextFloat(0.05, 0.3);

  let mobilityType: PhysicalTraits['mobilityType'] = 'DRIFTING';
  if (complexity === 'COMPLEX') {
    const mRoll = prng.nextFloat(0, 1);
    mobilityType = mRoll < 0.4 ? 'WALKING' : mRoll < 0.7 ? 'SWIMMING' : mRoll < 0.9 ? 'CRAWLING' : 'GLIDING';
  } else if (complexity === 'MULTICELLULAR') {
    const mRoll = prng.nextFloat(0, 1);
    mobilityType = mRoll < 0.4 ? 'SWIMMING' : mRoll < 0.7 ? 'SESSILE' : 'CRAWLING';
  } else if (complexity === 'COLONIAL') {
    mobilityType = prng.nextFloat(0, 1) < 0.6 ? 'SESSILE' : 'DRIFTING';
  }

  const tempSpan = complexity === 'COMPLEX' ? 25 : 45;
  const tempOptimal = planetTemp + prng.nextFloat(-5, 5);
  const tempTolerance = {
    min: Math.round(tempOptimal - tempSpan),
    max: Math.round(tempOptimal + tempSpan),
    optimal: Math.round(tempOptimal),
  };

  const pressureSpan = Math.max(0.2, planetPressure * 0.4);
  const pressureTolerance = {
    min: Number(Math.max(0.01, planetPressure - pressureSpan).toFixed(2)),
    max: Number((planetPressure + pressureSpan * 1.5).toFixed(2)),
    optimal: Number(planetPressure.toFixed(2)),
  };

  const radiationTolerance = Number(
    (origin === 'EXTREMOPHILE' ? prng.nextFloat(0.6, 0.95) : prng.nextFloat(0.1, 0.6)).toFixed(3)
  );

  const physical: PhysicalTraits = {
    sizeMeters: Number(sizeMeters.toPrecision(3)),
    densityKgM3,
    structuralComplexity: Number(structuralComplexity.toFixed(3)),
    mobilityType,
    temperatureToleranceKelvin: tempTolerance,
    pressureToleranceAtm: pressureTolerance,
    radiationTolerance,
  };

  // 2. Metabolic Traits
  const metabolism = selectMetabolism(planet, origin, complexity, speciesSeed, temporalState);
  const metabolic: MetabolicTraits = {
    metabolism,
    energyEfficiency: Number(prng.nextFloat(0.3, 0.85).toFixed(3)),
    oxygenDependence: Number(
      (metabolism === 'AEROBIC' ? prng.nextFloat(0.5, 0.95) : prng.nextFloat(0.0, 0.1)).toFixed(3)
    ),
    photosyntheticEfficiency: Number(
      (metabolism === 'PHOTOSYNTHESIS' ? prng.nextFloat(0.4, 0.9) : 0).toFixed(3)
    ),
    metabolicRate: Number(
      (complexity === 'COMPLEX' ? prng.nextFloat(0.5, 0.9) : prng.nextFloat(0.1, 0.4)).toFixed(3)
    ),
  };

  // 3. Ecological Traits
  let dietStrategy: EcologicalTraits['dietStrategy'] = 'AUTOTROPH';
  if (trophicRole === 'PRODUCER') {
    dietStrategy = 'AUTOTROPH';
  } else if (trophicRole === 'PREDATOR') {
    dietStrategy = 'CARNIVORE';
  } else if (trophicRole === 'CONSUMER') {
    dietStrategy = prng.nextFloat(0, 1) < 0.6 ? 'HERBIVORE' : 'FILTER_FEEDER';
  } else if (trophicRole === 'DECOMPOSER' || trophicRole === 'SCAVENGER') {
    dietStrategy = 'DETRITIVORE';
  }

  let habitatPreference: EcologicalTraits['habitatPreference'] = 'SURFACE_OCEAN';
  if (planet.hydrosphereCoverage > 0.5) {
    habitatPreference = origin === 'HYDROTHERMAL' ? 'DEEP_TRENCH' : 'SURFACE_OCEAN';
  } else if (planet.hydrosphereCoverage < 0.2) {
    habitatPreference = 'SUBTERRANEAN';
  } else {
    habitatPreference = complexity === 'COMPLEX' ? 'TERRESTRIAL_LOWLAND' : 'COASTAL';
  }

  const lifespanYears =
    complexity === 'COMPLEX'
      ? prng.nextFloat(2, 80)
      : complexity === 'MULTICELLULAR'
      ? prng.nextFloat(0.1, 10)
      : prng.nextFloat(0.001, 0.2);

  const generationTimeYears = Math.max(0.0001, lifespanYears * prng.nextFloat(0.1, 0.35));

  let reproductionMode: EcologicalTraits['reproductionMode'] = 'ASEXUAL_FISSION';
  if (complexity === 'COMPLEX') {
    reproductionMode = prng.nextFloat(0, 1) < 0.85 ? 'SEXUAL_DIMORPHIC' : 'PARTHENOGENIC';
  } else if (complexity === 'MULTICELLULAR') {
    const rRoll = prng.nextFloat(0, 1);
    reproductionMode = rRoll < 0.4 ? 'SPORE_BUDDING' : rRoll < 0.8 ? 'SEXUAL_DIMORPHIC' : 'PARTHENOGENIC';
  } else {
    reproductionMode = prng.nextFloat(0, 1) < 0.7 ? 'ASEXUAL_FISSION' : 'SPORE_BUDDING';
  }

  const ecological: EcologicalTraits = {
    trophicRole,
    dietStrategy,
    habitatPreference,
    waterDependency: Number(
      (planet.hydrosphereCoverage > 0.4 ? prng.nextFloat(0.5, 0.95) : prng.nextFloat(0.1, 0.5)).toFixed(3)
    ),
    lifespanYears: Number(lifespanYears.toFixed(2)),
    generationTimeYears: Number(generationTimeYears.toFixed(3)),
    reproductionMode,
    populationGrowthRate: Number(prng.nextFloat(0.05, 0.4).toFixed(3)),
  };

  // 4. Sensory Traits
  const sensoryComplexity =
    complexity === 'COMPLEX' ? 0.7 : complexity === 'MULTICELLULAR' ? 0.35 : 0.1;
  const sensory: SensoryTraits = {
    vision: Number(
      (complexity === 'COMPLEX' ? prng.nextFloat(0.4, 0.95) : prng.nextFloat(0.0, 0.2)).toFixed(3)
    ),
    chemicalSensing: Number(prng.nextFloat(0.3, 0.95).toFixed(3)),
    pressureSensing: Number(prng.nextFloat(0.2, 0.8).toFixed(3)),
    thermalSensing: Number(prng.nextFloat(0.2, 0.85).toFixed(3)),
  };

  // 5. Defense Traits
  const defense: DefenseTraits = {
    armor: Number(prng.nextFloat(0.05, complexity === 'COMPLEX' ? 0.8 : 0.3).toFixed(3)),
    toxins: Number(prng.nextFloat(0.0, 0.6).toFixed(3)),
    camouflage: Number(prng.nextFloat(0.05, 0.7).toFixed(3)),
    regeneration: Number(prng.nextFloat(0.1, 0.85).toFixed(3)),
  };

  return {
    physical,
    metabolic,
    ecological,
    sensory,
    defense,
  };
}

/**
 * Derives procedural visual descriptors from traits and species seed.
 */
export function deriveVisualDescriptor(
  speciesSeed: Seed,
  complexity: BiologicalComplexity,
  traits: TraitProfile
): VisualDescriptor {
  const prng = createPRNG(speciesSeed);

  let symmetry: VisualDescriptor['symmetry'] = 'SPHERICAL';
  if (complexity === 'COMPLEX') {
    symmetry = prng.nextFloat(0, 1) < 0.85 ? 'BILATERAL' : 'RADIAL';
  } else if (complexity === 'MULTICELLULAR') {
    const sRoll = prng.nextFloat(0, 1);
    symmetry = sRoll < 0.4 ? 'RADIAL' : sRoll < 0.75 ? 'BILATERAL' : 'ASYMMETRICAL';
  } else if (complexity === 'COLONIAL') {
    symmetry = prng.nextFloat(0, 1) < 0.5 ? 'ASYMMETRICAL' : 'SPHERICAL';
  }

  let appendageCount = 0;
  if (complexity === 'COMPLEX') {
    appendageCount = Math.floor(prng.nextFloat(2, 9)) * 2; // e.g. 4, 6, 8, 10
  } else if (complexity === 'MULTICELLULAR') {
    appendageCount = Math.floor(prng.nextFloat(0, 8));
  }

  let surfaceTexture: VisualDescriptor['surfaceTexture'] = 'MEMBRANOUS';
  if (complexity === 'COMPLEX') {
    const tRoll = prng.nextFloat(0, 1);
    surfaceTexture =
      tRoll < 0.35 ? 'CHITINOUS' : tRoll < 0.65 ? 'SCALED' : tRoll < 0.85 ? 'SMOOTH' : 'SILICATE';
  } else if (complexity === 'MULTICELLULAR') {
    const tRoll = prng.nextFloat(0, 1);
    surfaceTexture = tRoll < 0.5 ? 'GELATINOUS' : tRoll < 0.8 ? 'MEMBRANOUS' : 'CHITINOUS';
  }

  const primaryHue = Math.floor(prng.nextFloat(0, 360));
  const secondaryHue = (primaryHue + Math.floor(prng.nextFloat(30, 180))) % 360;
  const bioluminescence =
    traits.ecological.habitatPreference === 'DEEP_TRENCH' || prng.nextFloat(0, 1) < 0.25;

  return {
    bodyScale: Number(traits.physical.sizeMeters.toPrecision(3)),
    symmetry,
    appendageCount,
    surfaceTexture,
    bioluminescence,
    primaryHue,
    secondaryHue,
    sensoryComplexity: traits.sensory.vision * 0.4 + traits.sensory.chemicalSensing * 0.6,
  };
}
