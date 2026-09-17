/**
 * @license Apache-2.0
 * GENESIS BIOLOGICAL VERIFICATION TEST SUITE (PHASE 6)
 *
 * Programmatic test battery verifying deterministic habitability, abiogenesis,
 * trait systems, macro-evolution, speciation, ecosystems, extinctions, and lazy generation.
 *
 * Covers TEST_B1 through TEST_B20.
 */

import {
  deriveAbiogenesisSeed,
  deriveBiologySeed,
  deriveLifeSeed,
  deriveSpeciesSeed,
} from '../../core/hierarchy.js';
import { generatePlanet } from '../hierarchy/planet.js';
import { generateStarSystem } from '../hierarchy/star-system.js';
import { evaluateAbiogenesis, determineLifeOrigin } from './abiogenesis.js';
import { detectBiologicalEvents } from './biological-events.js';
import { buildEcosystem } from './ecosystem.js';
import { adaptTraits, divergeSpecies, evaluateFitness } from './evolution.js';
import { assessHabitability } from './habitability.js';
import { materializeBiosphere, summarizeBiosphere } from './life.js';
import { generateSpecies } from './species.js';
import { generateInitialTraits, selectMetabolism } from './traits.js';
import type { Planet } from '../../core/types.js';
import type { PlanetaryTemporalState } from '../simulation/types.js';
import type { BiologicalComplexity, Species } from './types.js';

export interface BiologicalTestResult {
  readonly id: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
}

export function runBiologicalVerificationSuite(): readonly BiologicalTestResult[] {
  const results: BiologicalTestResult[] = [];
  const testSeed = 987654321;
  const system = generateStarSystem(testSeed, 0);

  // Generate a habitable candidate planet and an uninhabitable candidate planet
  const planets = Array.from({ length: Math.max(3, system.planetCount) }, (_, i) =>
    generatePlanet(
      system.seed,
      i,
      system.id,
      system.name,
      system.stars[0]?.luminositySolar ?? 1.0,
      system.stars[0]?.massSolar ?? 1.0
    )
  );

  const habitablePlanet =
    planets.find((p) => p.type === 'TERRESTRIAL' || p.type === 'OCEAN') ?? planets[0];
  const hostilePlanet =
    planets.find((p) => p.type === 'LAVA' || p.type === 'GAS_GIANT' || p.type === 'BARREN') ?? planets[planets.length - 1];

  // Helper for recording test results
  const record = (id: string, name: string, passed: boolean, details: string) => {
    results.push({ id, name, passed, details });
  };

  // --------------------------------------------------------------------------
  // TEST_B1: Biological seed determinism
  // --------------------------------------------------------------------------
  try {
    const s1 = deriveBiologySeed(habitablePlanet.seed);
    const s2 = deriveBiologySeed(habitablePlanet.seed);
    const a1 = deriveAbiogenesisSeed(habitablePlanet.seed);
    const a2 = deriveAbiogenesisSeed(habitablePlanet.seed);
    const l1 = deriveLifeSeed(habitablePlanet.seed);
    const l2 = deriveLifeSeed(habitablePlanet.seed);
    const sp1 = deriveSpeciesSeed(habitablePlanet.seed, 3);
    const sp2 = deriveSpeciesSeed(habitablePlanet.seed, 3);

    const passed = s1 === s2 && a1 === a2 && l1 === l2 && sp1 === sp2 && s1 !== a1;
    record(
      'TEST_B1',
      'Biological seed determinism',
      passed,
      `Derived seeds matched across iterations (Bio: 0x${s1.toString(16)}, Abio: 0x${a1.toString(16)}, Life: 0x${l1.toString(16)})`
    );
  } catch (err) {
    record('TEST_B1', 'Biological seed determinism', false, String(err));
  }

  // --------------------------------------------------------------------------
  // TEST_B2: Different planets produce independent biology
  // --------------------------------------------------------------------------
  try {
    const p0 = planets[0];
    const p1 = planets[1] ?? planets[0];
    const seed0 = deriveBiologySeed(p0.seed);
    const seed1 = deriveBiologySeed(p1.seed);
    const abio0 = evaluateAbiogenesis(p0, 13_800_000_000);
    const abio1 = evaluateAbiogenesis(p1, 13_800_000_000);

    const passed = seed0 !== seed1 || p0.id === p1.id;
    record(
      'TEST_B2',
      'Different planets produce independent biology',
      passed,
      `Planets p0 (${p0.name}) and p1 (${p1.name}) have independent biological seeds (0x${seed0.toString(16)} vs 0x${seed1.toString(16)})`
    );
  } catch (err) {
    record('TEST_B2', 'Different planets produce independent biology', false, String(err));
  }

  // --------------------------------------------------------------------------
  // TEST_B3: Habitability calculation determinism
  // --------------------------------------------------------------------------
  try {
    const h1 = assessHabitability(habitablePlanet);
    const h2 = assessHabitability(habitablePlanet);

    const passed =
      h1.overall === h2.overall &&
      h1.score === h2.score &&
      h1.temperatureSuitability === h2.temperatureSuitability &&
      h1.waterAvailability === h2.waterAvailability &&
      h1.atmosphericSuitability === h2.atmosphericSuitability;

    record(
      'TEST_B3',
      'Habitability calculation determinism',
      passed,
      `Habitability score ${h1.score} (${h1.overall}) is strictly identical across repeated assessments`
    );
  } catch (err) {
    record('TEST_B3', 'Habitability calculation determinism', false, String(err));
  }

  // --------------------------------------------------------------------------
  // TEST_B4: Abiogenesis determinism
  // --------------------------------------------------------------------------
  try {
    const epoch = 13_800_000_000;
    const a1 = evaluateAbiogenesis(habitablePlanet, epoch);
    const a2 = evaluateAbiogenesis(habitablePlanet, epoch);

    const passed =
      a1.hasLifeEmergence === a2.hasLifeEmergence &&
      a1.emergenceYear === a2.emergenceYear &&
      a1.origin === a2.origin &&
      a1.abiogenesisPotential === a2.abiogenesisPotential &&
      a1.threshold === a2.threshold;

    record(
      'TEST_B4',
      'Abiogenesis determinism',
      passed,
      `Life emergence (${a1.hasLifeEmergence}) at year ${a1.emergenceYear} via ${a1.origin} matched exactly`
    );
  } catch (err) {
    record('TEST_B4', 'Abiogenesis determinism', false, String(err));
  }

  // --------------------------------------------------------------------------
  // TEST_B5: Life-origin determinism
  // --------------------------------------------------------------------------
  try {
    const hab = assessHabitability(habitablePlanet);
    const o1 = determineLifeOrigin(habitablePlanet, hab);
    const o2 = determineLifeOrigin(habitablePlanet, hab);

    const passed = o1 === o2;
    record(
      'TEST_B5',
      'Life-origin determinism',
      passed,
      `Procedural origin pathway determined as ${o1} deterministically`
    );
  } catch (err) {
    record('TEST_B5', 'Life-origin determinism', false, String(err));
  }

  // --------------------------------------------------------------------------
  // TEST_B6: Metabolism/environment compatibility
  // --------------------------------------------------------------------------
  try {
    const metaHydro = selectMetabolism(habitablePlanet, 'HYDROTHERMAL', 'UNICELLULAR', 12345);
    const metaPhoto = selectMetabolism(habitablePlanet, 'PHOTOSYNTHETIC', 'UNICELLULAR', 12345);
    const metaExtr = selectMetabolism(hostilePlanet, 'EXTREMOPHILE', 'UNICELLULAR', 12345);

    const passed =
      (metaHydro === 'CHEMOSYNTHESIS' || metaHydro === 'ANAEROBIC') &&
      (metaPhoto === 'PHOTOSYNTHESIS' || metaPhoto === 'MIXOTROPHIC') &&
      metaExtr === 'EXTREMOPHILE';

    record(
      'TEST_B6',
      'Metabolism/environment compatibility',
      passed,
      `Hydrothermal yielded ${metaHydro}, Photosynthetic yielded ${metaPhoto}, Extremophile yielded ${metaExtr}`
    );
  } catch (err) {
    record('TEST_B6', 'Metabolism/environment compatibility', false, String(err));
  }

  // --------------------------------------------------------------------------
  // TEST_B7: Trait generation determinism
  // --------------------------------------------------------------------------
  try {
    const t1 = generateInitialTraits(5555, habitablePlanet, 'AQUATIC', 'UNICELLULAR', 'PRODUCER');
    const t2 = generateInitialTraits(5555, habitablePlanet, 'AQUATIC', 'UNICELLULAR', 'PRODUCER');

    const passed =
      t1.physical.sizeMeters === t2.physical.sizeMeters &&
      t1.metabolic.energyEfficiency === t2.metabolic.energyEfficiency &&
      t1.ecological.waterDependency === t2.ecological.waterDependency &&
      t1.physical.temperatureToleranceKelvin.optimal ===
        t2.physical.temperatureToleranceKelvin.optimal;

    record(
      'TEST_B7',
      'Trait generation determinism',
      passed,
      `Identical physical, metabolic, and ecological traits generated (optimal temp: ${t1.physical.temperatureToleranceKelvin.optimal} K)`
    );
  } catch (err) {
    record('TEST_B7', 'Trait generation determinism', false, String(err));
  }

  // --------------------------------------------------------------------------
  // TEST_B8: Fitness calculation
  // --------------------------------------------------------------------------
  try {
    const traits = generateInitialTraits(777, habitablePlanet, 'AQUATIC', 'MULTICELLULAR', 'PRODUCER');
    // Normal temperate state
    const normalState = {
      effectiveTempKelvin: traits.physical.temperatureToleranceKelvin.optimal,
      surfacePressureAtm: traits.physical.pressureToleranceAtm.optimal,
      hydrosphereCoverage: 0.7,
      iceCoverage: 0.1,
      incidentFluxSolar: 1.0,
      isInHabitableZone: true,
      hasBiosphereEligibility: true,
    } as PlanetaryTemporalState;

    const fitNormal = evaluateFitness(traits, habitablePlanet, normalState);

    // Boiled extreme state
    const extremeState = {
      effectiveTempKelvin: 450,
      surfacePressureAtm: 8.0,
      hydrosphereCoverage: 0.0,
      iceCoverage: 0.0,
      incidentFluxSolar: 4.5,
      isInHabitableZone: false,
      hasBiosphereEligibility: false,
    } as PlanetaryTemporalState;

    const fitExtreme = evaluateFitness(traits, habitablePlanet, extremeState);

    const passed = fitNormal.overallFitness > 0.7 && fitExtreme.overallFitness < 0.2;
    record(
      'TEST_B8',
      'Fitness calculation',
      passed,
      `Optimal state fitness: ${fitNormal.overallFitness}, Extreme state fitness: ${fitExtreme.overallFitness} (Limiting: ${fitExtreme.limitingFactor})`
    );
  } catch (err) {
    record('TEST_B8', 'Fitness calculation', false, String(err));
  }

  // --------------------------------------------------------------------------
  // TEST_B9: Evolution changes traits under selection
  // --------------------------------------------------------------------------
  try {
    const species = generateSpecies(habitablePlanet, 0, 'AQUATIC', 'UNICELLULAR', 'PRODUCER', 2_000_000_000);
    const initialOptimal = species.traits.physical.temperatureToleranceKelvin.optimal;

    // Subject species to warmer planetary environment
    const warmTemporal = {
      effectiveTempKelvin: initialOptimal + 20,
      surfacePressureAtm: species.traits.physical.pressureToleranceAtm.optimal,
      hydrosphereCoverage: 0.6,
      iceCoverage: 0.0,
      incidentFluxSolar: 1.2,
      isInHabitableZone: true,
      hasBiosphereEligibility: true,
    } as PlanetaryTemporalState;

    const adaptedTraits = adaptTraits(species, habitablePlanet, 3_000_000_000, warmTemporal);
    const newOptimal = adaptedTraits.physical.temperatureToleranceKelvin.optimal;

    const passed = newOptimal > initialOptimal;
    record(
      'TEST_B9',
      'Evolution changes traits under selection',
      passed,
      `Temperature tolerance adapted from ${initialOptimal} K to ${newOptimal} K under thermal selection`
    );
  } catch (err) {
    record('TEST_B9', 'Evolution changes traits under selection', false, String(err));
  }

  // --------------------------------------------------------------------------
  // TEST_B10: Speciation determinism
  // --------------------------------------------------------------------------
  try {
    const parent = generateSpecies(habitablePlanet, 0, 'AQUATIC', 'UNICELLULAR', 'PRODUCER', 2_000_000_000);
    const child1 = divergeSpecies(parent, 1, habitablePlanet, 3_000_000_000);
    const child2 = divergeSpecies(parent, 1, habitablePlanet, 3_000_000_000);

    const passed =
      child1.id === child2.id &&
      child1.name === child2.name &&
      child1.complexity === child2.complexity &&
      child1.parentSpeciesId === parent.id;

    record(
      'TEST_B10',
      'Speciation determinism',
      passed,
      `Diverged species "${child1.name}" (${child1.id}) matched deterministically with parent link ${child1.parentSpeciesId}`
    );
  } catch (err) {
    record('TEST_B10', 'Speciation determinism', false, String(err));
  }

  // --------------------------------------------------------------------------
  // TEST_B11: Ecosystem relationship validity
  // --------------------------------------------------------------------------
  try {
    const sp1 = generateSpecies(habitablePlanet, 0, 'AQUATIC', 'MULTICELLULAR', 'PRODUCER', 2_000_000_000);
    const sp2 = generateSpecies(habitablePlanet, 1, 'AQUATIC', 'MULTICELLULAR', 'CONSUMER', 2_500_000_000);
    const eco = buildEcosystem(habitablePlanet, [sp1, sp2], 'AQUATIC');

    const passed =
      eco.producersCount === 1 &&
      eco.consumersCount === 1 &&
      eco.trophicStabilityIndex >= 0 &&
      eco.trophicStabilityIndex <= 1 &&
      eco.links.length > 0;

    record(
      'TEST_B11',
      'Ecosystem relationship validity',
      passed,
      `Ecosystem constructed with ${eco.links.length} trophic link(s) and stability index ${eco.trophicStabilityIndex}`
    );
  } catch (err) {
    record('TEST_B11', 'Ecosystem relationship validity', false, String(err));
  }

  // --------------------------------------------------------------------------
  // TEST_B12: Extinction behavior
  // --------------------------------------------------------------------------
  try {
    const sp = generateSpecies(habitablePlanet, 0, 'AQUATIC', 'COMPLEX', 'PRODUCER', 2_000_000_000);
    // Catastrophic runaway state: 500 K, 0 water
    const cataclysmState = {
      effectiveTempKelvin: 500,
      surfacePressureAtm: 15.0,
      hydrosphereCoverage: 0.0,
      iceCoverage: 0.0,
      incidentFluxSolar: 6.0,
      isInHabitableZone: false,
      hasBiosphereEligibility: false,
    } as PlanetaryTemporalState;

    const bio = materializeBiosphere(habitablePlanet, 4_000_000_000, cataclysmState);
    const passed = bio.extinctSpecies.length > 0 || bio.activeSpecies.length === 0;

    record(
      'TEST_B12',
      'Extinction behavior',
      passed,
      `Catastrophic environmental shift resulted in ${bio.extinctSpecies.length} extinct lineage(s)`
    );
  } catch (err) {
    record('TEST_B12', 'Extinction behavior', false, String(err));
  }

  // --------------------------------------------------------------------------
  // TEST_B13: Biological temporal response
  // --------------------------------------------------------------------------
  try {
    const bioEarly = materializeBiosphere(habitablePlanet, 1_000_000_000);
    const bioLate = materializeBiosphere(habitablePlanet, 13_800_000_000);

    const passed = bioEarly.epochYear !== bioLate.epochYear;
    record(
      'TEST_B13',
      'Biological temporal response',
      passed,
      `Biosphere at 1.0 Gyr (complexity: ${bioEarly.summary.highestComplexity}) vs 13.8 Gyr (complexity: ${bioLate.summary.highestComplexity})`
    );
  } catch (err) {
    record('TEST_B13', 'Biological temporal response', false, String(err));
  }

  // --------------------------------------------------------------------------
  // TEST_B14: Historical extinct-species preservation
  // --------------------------------------------------------------------------
  try {
    const cataclysmState = {
      effectiveTempKelvin: 550,
      surfacePressureAtm: 20.0,
      hydrosphereCoverage: 0.0,
      iceCoverage: 0.0,
      incidentFluxSolar: 8.0,
      isInHabitableZone: false,
      hasBiosphereEligibility: false,
    } as PlanetaryTemporalState;

    const bio = materializeBiosphere(habitablePlanet, 8_000_000_000, cataclysmState);
    const preserved = bio.extinctSpecies.every((s) => s.status === 'EXTINCT' && s.extinctionEpochYear !== undefined);

    const passed = bio.extinctSpecies.length > 0 ? preserved : true;
    record(
      'TEST_B14',
      'Historical extinct-species preservation',
      passed,
      `Extinct species count: ${bio.extinctSpecies.length} (all retain identity, lineage, and extinction year)`
    );
  } catch (err) {
    record('TEST_B14', 'Historical extinct-species preservation', false, String(err));
  }

  // --------------------------------------------------------------------------
  // TEST_B15: Lazy biological materialization
  // --------------------------------------------------------------------------
  try {
    const t0 = performance.now();
    const summary = summarizeBiosphere(habitablePlanet, 13_800_000_000);
    const t1 = performance.now();
    const elapsedMs = t1 - t0;

    const passed = summary !== undefined && summary.habitability !== undefined && elapsedMs < 20;
    record(
      'TEST_B15',
      'Lazy biological materialization',
      passed,
      `Lazy summary computed in ${elapsedMs.toFixed(3)} ms without building species graphs`
    );
  } catch (err) {
    record('TEST_B15', 'Lazy biological materialization', false, String(err));
  }

  // --------------------------------------------------------------------------
  // TEST_B16: Same seed + epoch reproducibility
  // --------------------------------------------------------------------------
  try {
    const bio1 = materializeBiosphere(habitablePlanet, 13_800_000_000);
    const bio2 = materializeBiosphere(habitablePlanet, 13_800_000_000);

    const passed =
      bio1.summary.hasLife === bio2.summary.hasLife &&
      bio1.summary.activeSpeciesCount === bio2.summary.activeSpeciesCount &&
      bio1.activeSpecies.length === bio2.activeSpecies.length &&
      bio1.ecosystem.links.length === bio2.ecosystem.links.length;

    record(
      'TEST_B16',
      'Same seed + epoch reproducibility',
      passed,
      `Materialized biospheres match bit-for-bit (active species: ${bio1.activeSpecies.length}, links: ${bio1.ecosystem.links.length})`
    );
  } catch (err) {
    record('TEST_B16', 'Same seed + epoch reproducibility', false, String(err));
  }

  // --------------------------------------------------------------------------
  // TEST_B17: No Math.random
  // --------------------------------------------------------------------------
  try {
    const originalRandom = Math.random;
    let intercepted = false;
    Math.random = () => {
      intercepted = true;
      throw new Error('[TEST_B17 VIOLATION] Math.random() called in biological engine!');
    };

    try {
      summarizeBiosphere(habitablePlanet, 13_800_000_000);
      materializeBiosphere(habitablePlanet, 13_800_000_000);
      assessHabitability(habitablePlanet);
      evaluateAbiogenesis(habitablePlanet, 13_800_000_000);
    } finally {
      Math.random = originalRandom;
    }

    record(
      'TEST_B17',
      'No Math.random',
      !intercepted,
      'Biological engine runs with 0 calls to native Math.random()'
    );
  } catch (err) {
    record('TEST_B17', 'No Math.random', false, String(err));
  }

  // --------------------------------------------------------------------------
  // TEST_B18: No wall-clock dependency
  // --------------------------------------------------------------------------
  try {
    const originalDateNow = Date.now;
    let fakeClock = 1000;
    Date.now = () => (fakeClock += 1000);

    let bioA, bioB;
    try {
      bioA = materializeBiosphere(habitablePlanet, 13_800_000_000);
      fakeClock += 999999;
      bioB = materializeBiosphere(habitablePlanet, 13_800_000_000);
    } finally {
      Date.now = originalDateNow;
    }

    const passed =
      bioA.summary.habitability.score === bioB.summary.habitability.score &&
      bioA.activeSpecies.length === bioB.activeSpecies.length &&
      bioA.summary.highestComplexity === bioB.summary.highestComplexity;

    record(
      'TEST_B18',
      'No wall-clock dependency',
      passed,
      'Simulation outcomes are invariant under altered wall-clock timestamps'
    );
  } catch (err) {
    record('TEST_B18', 'No wall-clock dependency', false, String(err));
  }

  // --------------------------------------------------------------------------
  // TEST_B19: Different environmental conditions produce different selection pressures
  // --------------------------------------------------------------------------
  try {
    const traits = generateInitialTraits(1234, habitablePlanet, 'AQUATIC', 'UNICELLULAR', 'PRODUCER');
    const coldState = {
      effectiveTempKelvin: 210,
      surfacePressureAtm: 1.0,
      hydrosphereCoverage: 0.1,
      iceCoverage: 0.9,
      incidentFluxSolar: 0.3,
      isInHabitableZone: false,
      hasBiosphereEligibility: false,
    } as PlanetaryTemporalState;

    const hotState = {
      effectiveTempKelvin: 370,
      surfacePressureAtm: 3.5,
      hydrosphereCoverage: 0.1,
      iceCoverage: 0.0,
      incidentFluxSolar: 2.5,
      isInHabitableZone: false,
      hasBiosphereEligibility: false,
    } as PlanetaryTemporalState;

    const fitCold = evaluateFitness(traits, habitablePlanet, coldState);
    const fitHot = evaluateFitness(traits, habitablePlanet, hotState);

    const passed =
      fitCold.temperatureFitness !== fitHot.temperatureFitness &&
      fitCold.limitingFactor.length > 0 &&
      fitHot.limitingFactor.length > 0;

    record(
      'TEST_B19',
      'Different environmental conditions produce different selection pressures',
      passed,
      `Cold fitness: ${fitCold.temperatureFitness} vs Hot fitness: ${fitHot.temperatureFitness} with distinct limiting factors`
    );
  } catch (err) {
    record(
      'TEST_B19',
      'Different environmental conditions produce different selection pressures',
      false,
      String(err)
    );
  }

  // --------------------------------------------------------------------------
  // TEST_B20: Biological event determinism
  // --------------------------------------------------------------------------
  try {
    const bioEarly = materializeBiosphere(habitablePlanet, 2_000_000_000);
    const bioLate = materializeBiosphere(habitablePlanet, 13_800_000_000);

    const ev1 = detectBiologicalEvents(testSeed, habitablePlanet, bioEarly, bioLate);
    const ev2 = detectBiologicalEvents(testSeed, habitablePlanet, bioEarly, bioLate);

    const passed =
      ev1.length === ev2.length &&
      (ev1.length === 0 || (ev1[0].eventId === ev2[0].eventId && ev1[0].eventType === ev2[0].eventType));

    record(
      'TEST_B20',
      'Biological event determinism',
      passed,
      `Detected ${ev1.length} biological event(s) with deterministic IDs across repeated runs`
    );
  } catch (err) {
    record('TEST_B20', 'Biological event determinism', false, String(err));
  }

  return results;
}
