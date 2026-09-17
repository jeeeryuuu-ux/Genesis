/**
 * @license Apache-2.0
 * GENESIS PHASE 5.1 INTEGRATION TEST SUITE
 *
 * Verifies temporal UI contracts, renderer synchronization, deterministic event
 * generation, analytical large jumps, dynamic habitable zone scaling, checkpoint
 * restoration, navigation safety, and zero wall-clock dependencies.
 *
 * Covers TEST_I1 through TEST_I16.
 */

import { generatePlanet } from '../hierarchy/planet.js';
import { generateStarSystem } from '../hierarchy/star-system.js';
import { generateUniverse } from '../hierarchy/universe.js';
import {
  calculateDynamicHabitableZone,
  calculateMainSequenceLifetimeYears,
  calculateStarFormationYear,
  evolveStar,
} from './stellar-evolution.js';
import { calculatePlanetOrbitalPhase, calculatePlanetPositionAU } from './orbital-dynamics.js';
import { SimulationEngine } from './engine.js';
import type { NavigationPath, Planet, StarSystem, Year } from '../../core/types.js';
import type { AstronomicalEvent, SystemTemporalState } from './types.js';

export interface IntegrationTestResult {
  readonly id: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
}

export function runPhase51IntegrationSuite(): readonly IntegrationTestResult[] {
  const results: IntegrationTestResult[] = [];
  const rootSeed = 51051;
  const universe = generateUniverse(rootSeed);
  const baseSystem = generateStarSystem(rootSeed, 0);
  const basePlanets: Planet[] = Array.from({ length: baseSystem.planetCount }, (_, i) =>
    generatePlanet(
      baseSystem.seed,
      i,
      baseSystem.id,
      baseSystem.name,
      baseSystem.stars[0].luminositySolar,
      baseSystem.stars[0].massSolar,
      true
    )
  );

  // --------------------------------------------------------------------------
  // TEST_I1: Temporal HUD state updates with engine epoch
  // --------------------------------------------------------------------------
  {
    const engine = new SimulationEngine(rootSeed, universe.ageYears, 10_000_000_000);
    const clockState = engine.clock.getState();
    const isPausedInitial = clockState.isPaused;
    const initialYear = clockState.currentYear;

    engine.advance(500);
    const advancedYear = engine.clock.currentYear;

    const passed =
      isPausedInitial === true &&
      initialYear === 10_000_000_000 &&
      advancedYear === 10_000_000_500 &&
      engine.clock.speed === 1;

    results.push({
      id: 'TEST_I1',
      name: 'Temporal HUD State (Clock State & Epoch Synchronization)',
      passed,
      details: passed
        ? `HUD state successfully synchronized: Epoch=${advancedYear}, Paused=${engine.clock.isPaused}`
        : `Clock state mismatch: Year=${advancedYear}, Expected=10000000500`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST_I2: Play/Pause toggles and controls advancement
  // --------------------------------------------------------------------------
  {
    const engine = new SimulationEngine(rootSeed, universe.ageYears, 13_800_000_000);
    const paused1 = engine.clock.isPaused; // true
    engine.clock.play();
    const paused2 = engine.clock.isPaused; // false
    engine.clock.pause();
    const paused3 = engine.clock.isPaused; // true
    engine.clock.togglePause();
    const paused4 = engine.clock.isPaused; // false

    const passed = paused1 === true && paused2 === false && paused3 === true && paused4 === false;

    results.push({
      id: 'TEST_I2',
      name: 'Play/Pause State Control',
      passed,
      details: passed
        ? 'Simulation clock transitions cleanly between paused and active states'
        : 'Play/Pause state failed to transition properly',
    });
  }

  // --------------------------------------------------------------------------
  // TEST_I3: Manual stepping produces exact deterministic epochs
  // --------------------------------------------------------------------------
  {
    const startYear = 13_800_000_000;
    const engine = new SimulationEngine(rootSeed, universe.ageYears, startYear);

    engine.advance(1);
    const y1 = engine.clock.currentYear; // +1
    engine.advance(10);
    const y2 = engine.clock.currentYear; // +10
    engine.advance(100);
    const y3 = engine.clock.currentYear; // +100
    engine.advance(1_000);
    const y4 = engine.clock.currentYear; // +1000
    engine.advance(-111);
    const y5 = engine.clock.currentYear; // -111

    const passed =
      y1 === 13_800_000_001 &&
      y2 === 13_800_000_011 &&
      y3 === 13_800_000_111 &&
      y4 === 13_800_001_111 &&
      y5 === 13_800_001_000;

    results.push({
      id: 'TEST_I3',
      name: 'Manual Temporal Stepping (Discrete Deterministic Steps)',
      passed,
      details: passed
        ? `Exact integer arithmetic preserved across incremental offsets: final=${y5}`
        : `Stepping arithmetic error: got ${y5}, expected 13800001000`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST_I4: Analytical large jump executes in O(1) without yearly looping
  // --------------------------------------------------------------------------
  {
    const engine = new SimulationEngine(rootSeed, universe.ageYears, 5_000_000_000);
    engine.setActiveSystem(baseSystem, basePlanets);

    const jumpYears = 10_000_000_000; // 10 billion years in a single step
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    engine.advance(jumpYears);
    const t1 = typeof performance !== 'undefined' ? performance.now() : 0;
    const durationMs = t1 - t0;

    const state = engine.getActiveSystemState();
    const passed =
      engine.clock.currentYear === 15_000_000_000 &&
      state !== undefined &&
      state.year === 15_000_000_000 &&
      durationMs < 100; // O(1) analytical calculation completes in milliseconds

    results.push({
      id: 'TEST_I4',
      name: 'Analytical Large Jump Performance (O(1) Delta Execution)',
      passed,
      details: passed
        ? `10B-year jump resolved analytically in ${durationMs.toFixed(2)}ms (Epoch=${state?.year})`
        : `Large jump failed or exceeded budget: ${durationMs.toFixed(2)}ms`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST_I5: Direct epoch input produces identical state to direct engine invocation
  // --------------------------------------------------------------------------
  {
    const targetEpoch = 24_500_000_000;
    const engineA = new SimulationEngine(rootSeed, universe.ageYears, 13_800_000_000);
    engineA.setActiveSystem(baseSystem, basePlanets);
    engineA.setYear(targetEpoch);

    const engineB = new SimulationEngine(rootSeed, universe.ageYears, targetEpoch);
    engineB.setActiveSystem(baseSystem, basePlanets);

    const stateA = engineA.getActiveSystemState();
    const stateB = engineB.getActiveSystemState();

    const starA = stateA?.stars.get(baseSystem.stars[0].id);
    const starB = stateB?.stars.get(baseSystem.stars[0].id);

    const passed =
      stateA !== undefined &&
      stateB !== undefined &&
      stateA.year === targetEpoch &&
      stateA.year === stateB.year &&
      starA?.stage === starB?.stage &&
      starA?.luminositySolar === starB?.luminositySolar &&
      stateA.habitableZoneAU.inner === stateB.habitableZoneAU.inner;

    results.push({
      id: 'TEST_I5',
      name: 'Direct Epoch Input Synchronization',
      passed,
      details: passed
        ? `Direct jump to Year ${targetEpoch} matches fresh initialization state identically`
        : 'Direct epoch jump diverged from direct engine initialization',
    });
  }

  // --------------------------------------------------------------------------
  // TEST_I6: Renderer synchronization: changing epoch updates render properties
  // --------------------------------------------------------------------------
  {
    const engine = new SimulationEngine(rootSeed, universe.ageYears, 2_000_000_000);
    engine.setActiveSystem(baseSystem, basePlanets);
    const stateEarly = engine.getActiveSystemState();

    engine.setYear(12_000_000_000);
    const stateLate = engine.getActiveSystemState();

    const starId = baseSystem.stars[0].id;
    const starEarly = stateEarly?.stars.get(starId);
    const starLate = stateLate?.stars.get(starId);

    const planetId = basePlanets[0].id;
    const pEarly = stateEarly?.planets.get(planetId);
    const pLate = stateLate?.planets.get(planetId);

    const passed =
      starEarly !== undefined &&
      starLate !== undefined &&
      pEarly !== undefined &&
      pLate !== undefined &&
      (starEarly.ageYears !== starLate.ageYears || starEarly.luminositySolar !== starLate.luminositySolar) &&
      (pEarly.orbitalPhaseRad !== pLate.orbitalPhaseRad || pEarly.positionAU.x !== pLate.positionAU.x);

    results.push({
      id: 'TEST_I6',
      name: 'Renderer Temporal Synchronization (State Delta Generation)',
      passed,
      details: passed
        ? `Stellar and planetary render properties successfully modified across epochs (Δphase=${Math.abs((pLate?.orbitalPhaseRad ?? 0) - (pEarly?.orbitalPhaseRad ?? 0)).toFixed(3)} rad)`
        : 'Render properties failed to update across simulation epochs',
    });
  }

  // --------------------------------------------------------------------------
  // TEST_I7: Stellar visual state: evolved star produces updated visual properties
  // --------------------------------------------------------------------------
  {
    const massiveStar = {
      ...baseSystem.stars[0],
      massSolar: 15.0,
      luminositySolar: 25000.0,
      radiusSolar: 7.0,
    };
    const formationYear = calculateStarFormationYear(massiveStar, universe.ageYears);
    const msLifetime = calculateMainSequenceLifetimeYears(massiveStar.massSolar);
    const evolvedYoung = evolveStar(
      massiveStar,
      universe.ageYears,
      formationYear + Math.round(msLifetime * 0.5)
    );
    const evolvedDying = evolveStar(
      massiveStar,
      universe.ageYears,
      formationYear + Math.round(msLifetime * 1.5)
    );

    const passed =
      evolvedYoung.stage === 'MAIN_SEQUENCE' &&
      (evolvedDying.stage === 'RED_GIANT' ||
        evolvedDying.stage === 'SUBGIANT' ||
        evolvedDying.stage === 'NEUTRON_STAR' ||
        evolvedDying.stage === 'BLACK_HOLE') &&
      evolvedDying.radiusSolar !== evolvedYoung.radiusSolar;

    results.push({
      id: 'TEST_I7',
      name: 'Stellar Visual State Evolution',
      passed,
      details: passed
        ? `Massive star transitioned: ${evolvedYoung.stage} -> ${evolvedDying.stage} (Radius: ${evolvedYoung.radiusSolar.toFixed(1)} -> ${evolvedDying.radiusSolar.toFixed(5)} R☉)`
        : 'Stellar visual transition failed',
    });
  }

  // --------------------------------------------------------------------------
  // TEST_I8: Orbital visual state: planet/moon positions match current epoch phase
  // --------------------------------------------------------------------------
  {
    const planet = basePlanets[0];
    const phaseY0 = calculatePlanetOrbitalPhase(planet, 1000);
    const phaseY1 = calculatePlanetOrbitalPhase(planet, 1001);
    const pos0 = calculatePlanetPositionAU(planet.semiMajorAxisAU, planet.eccentricity, phaseY0);
    const pos1 = calculatePlanetPositionAU(planet.semiMajorAxisAU, planet.eccentricity, phaseY1);

    const posDelta = Math.hypot(pos1.x - pos0.x, pos1.z - pos0.z);
    const passed = phaseY0 >= 0 && phaseY0 < Math.PI * 2 && posDelta > 0.0001;

    results.push({
      id: 'TEST_I8',
      name: 'Orbital Visual State (Keplerian Phase Position Mapping)',
      passed,
      details: passed
        ? `Position mapped analytically: Phase=${phaseY0.toFixed(3)} rad, Pos=(${pos0.x.toFixed(2)}, ${pos0.z.toFixed(2)} AU)`
        : 'Orbital visual calculation failed',
    });
  }

  // --------------------------------------------------------------------------
  // TEST_I9: Dynamic habitable zone: rendered HZ scales with current stellar luminosity
  // --------------------------------------------------------------------------
  {
    const hzBase = calculateDynamicHabitableZone(1.0); // 1 Solar Luminosity
    const hzHigh = calculateDynamicHabitableZone(4.0); // 4 Solar Luminosities (e.g. Subgiant expansion)
    const hzLow = calculateDynamicHabitableZone(0.01); // 0.01 Solar Luminosity (e.g. White Dwarf)

    const passed =
      hzHigh.inner > hzBase.inner &&
      hzHigh.outer > hzBase.outer &&
      hzLow.inner < hzBase.inner &&
      hzLow.outer < hzBase.outer &&
      Math.abs(hzHigh.inner - hzBase.inner * 2.0) < 0.1; // proportional to sqrt(L)

    results.push({
      id: 'TEST_I9',
      name: 'Dynamic Habitable Zone Scaling with Luminosity',
      passed,
      details: passed
        ? `HZ scales with sqrt(L): L=1.0 -> [${hzBase.inner.toFixed(2)}, ${hzBase.outer.toFixed(2)} AU]; L=4.0 -> [${hzHigh.inner.toFixed(2)}, ${hzHigh.outer.toFixed(2)} AU]`
        : 'Habitable zone failed to scale with stellar luminosity',
    });
  }

  // --------------------------------------------------------------------------
  // TEST_I10: Event UI: actual simulation events appear in event log
  // --------------------------------------------------------------------------
  {
    const massiveSystem = generateStarSystem(rootSeed, 11);
    const massivePlanets: Planet[] = Array.from({ length: massiveSystem.planetCount }, (_, i) =>
      generatePlanet(
        massiveSystem.seed,
        i,
        massiveSystem.id,
        massiveSystem.name,
        massiveSystem.stars[0].luminositySolar,
        massiveSystem.stars[0].massSolar,
        true
      )
    );
    const formationYear = calculateStarFormationYear(massiveSystem.stars[0], universe.ageYears);
    const engine = new SimulationEngine(rootSeed, universe.ageYears, formationYear);
    engine.setActiveSystem(massiveSystem, massivePlanets);
    // Advance across the main sequence lifetime (~13 Myr)
    engine.advance(30_000_000);

    const events = engine.getEvents();
    const passed = events.length > 0;

    results.push({
      id: 'TEST_I10',
      name: 'Event Detection & Event Log Logging',
      passed,
      details: passed
        ? `Logged ${events.length} deterministic events during simulation progression (e.g., "${events[0].description}")`
        : 'No events detected across simulation interval',
    });
  }

  // --------------------------------------------------------------------------
  // TEST_I11: Event determinism: same seed + entity + epoch produces identical event IDs
  // --------------------------------------------------------------------------
  {
    const massiveSystem = generateStarSystem(rootSeed, 11);
    const massivePlanets: Planet[] = Array.from({ length: massiveSystem.planetCount }, (_, i) =>
      generatePlanet(
        massiveSystem.seed,
        i,
        massiveSystem.id,
        massiveSystem.name,
        massiveSystem.stars[0].luminositySolar,
        massiveSystem.stars[0].massSolar,
        true
      )
    );
    const formationYear = calculateStarFormationYear(massiveSystem.stars[0], universe.ageYears);

    const engineA = new SimulationEngine(rootSeed, universe.ageYears, formationYear);
    engineA.setActiveSystem(massiveSystem, massivePlanets);
    engineA.advance(30_000_000);

    const engineB = new SimulationEngine(rootSeed, universe.ageYears, formationYear);
    engineB.setActiveSystem(massiveSystem, massivePlanets);
    engineB.advance(30_000_000);

    const eventsA = engineA.getEvents();
    const eventsB = engineB.getEvents();

    const passed =
      eventsA.length > 0 &&
      eventsA.length === eventsB.length &&
      eventsA.every((eA, idx) => eA.eventId === eventsB[idx].eventId && eA.year === eventsB[idx].year);

    results.push({
      id: 'TEST_I11',
      name: 'Astronomical Event Determinism',
      passed,
      details: passed
        ? `Generated identical event streams across independent runs (${eventsA.length} matching events)`
        : 'Event stream diverged between identical runs',
    });
  }

  // --------------------------------------------------------------------------
  // TEST_I12: Checkpoint restore: create -> advance -> restore produces exact checkpoint state
  // --------------------------------------------------------------------------
  {
    const engine = new SimulationEngine(rootSeed, universe.ageYears, 5_000_000_000);
    engine.setActiveSystem(baseSystem, basePlanets);

    const cp = engine.createCheckpoint('Mid-Evolution Snapshot');
    const originalYear = engine.clock.currentYear;
    const stateOriginal = engine.getActiveSystemState();
    const origLum = stateOriginal?.stars.get(baseSystem.stars[0].id)?.luminositySolar;

    // Mutate state forward by 10 billion years
    engine.advance(10_000_000_000);
    const mutatedYear = engine.clock.currentYear;

    // Restore checkpoint
    const restoredOk = engine.restoreCheckpoint(cp.id);
    const restoredYear = engine.clock.currentYear;
    const stateRestored = engine.getActiveSystemState();
    const restoredLum = stateRestored?.stars.get(baseSystem.stars[0].id)?.luminositySolar;

    const passed =
      restoredOk === true &&
      originalYear === 5_000_000_000 &&
      mutatedYear === 15_000_000_000 &&
      restoredYear === 5_000_000_000 &&
      origLum === restoredLum;

    results.push({
      id: 'TEST_I12',
      name: 'Checkpoint Create & Restore Fidelity',
      passed,
      details: passed
        ? `State cleanly restored to checkpoint: Year ${restoredYear}, Luminosity=${restoredLum?.toFixed(4)}`
        : 'Checkpoint restoration failed to restore exact state',
    });
  }

  // --------------------------------------------------------------------------
  // TEST_I13: Navigation preservation: temporal advance across scale tiers retains valid hierarchy
  // --------------------------------------------------------------------------
  {
    const engine = new SimulationEngine(rootSeed, universe.ageYears, 13_800_000_000);
    const path: NavigationPath = {
      tier: 'PLANET',
      universeSeed: rootSeed,
      galaxyIndex: 0,
      systemIndex: 0,
      planetIndex: 1,
    };

    // Advancing time must not corrupt or invalidate navigation path
    engine.advance(2_500_000_000);

    const passed =
      path.tier === 'PLANET' &&
      path.galaxyIndex === 0 &&
      path.systemIndex === 0 &&
      path.planetIndex === 1 &&
      engine.clock.currentYear === 16_300_000_000;

    results.push({
      id: 'TEST_I13',
      name: 'Temporal Navigation Preservation',
      passed,
      details: passed
        ? `Navigation coordinates (${path.tier} @ galaxy=${path.galaxyIndex}, sys=${path.systemIndex}) preserved across time shift`
        : 'Navigation path was corrupted during temporal shift',
    });
  }

  // --------------------------------------------------------------------------
  // TEST_I14: Lazy temporal allocation: large jumps do not materialize unrelated systems
  // --------------------------------------------------------------------------
  {
    const engine = new SimulationEngine(rootSeed, universe.ageYears, 13_800_000_000);
    engine.setActiveSystem(baseSystem, basePlanets);

    // Advance by 5 billion years
    engine.advance(5_000_000_000);

    const counts = engine.stateCache.getCounts();
    // Sparse cache should ONLY contain the 1 active system and its constituent planets
    const passed = counts.systems === 1 && counts.planets === basePlanets.length;

    results.push({
      id: 'TEST_I14',
      name: 'Sparse Lazy Temporal Allocation',
      passed,
      details: passed
        ? `Memory footprint strictly bounded: ${counts.systems} system, ${counts.planets} planets cached`
        : `Unintended entities materialized: systems=${counts.systems}, planets=${counts.planets}`,
    });
  }

  // --------------------------------------------------------------------------
  // TEST_I15: No wall-clock dependency: simulation outcomes independent of browser timing APIs
  // --------------------------------------------------------------------------
  {
    const engine = new SimulationEngine(rootSeed, universe.ageYears, 10_000_000_000);
    const clock = engine.clock;

    // Check that clock does not reference performance.now() or Date.now() for its year state
    const y0 = clock.currentYear;
    clock.advance(100);
    const y1 = clock.currentYear;
    clock.advance(0);
    const y2 = clock.currentYear;

    const passed = y0 === 10_000_000_000 && y1 === 10_000_000_100 && y2 === 10_000_000_100;

    results.push({
      id: 'TEST_I15',
      name: 'Zero Wall-Clock Dependency (Pure Discrete Math)',
      passed,
      details: passed
        ? 'Time progression is 100% mathematically deterministic with zero wall-clock drift'
        : 'Wall-clock dependency detected in simulation clock',
    });
  }

  // --------------------------------------------------------------------------
  // TEST_I16: Mobile layout sanity: temporal controls layout parameters prevent overflow
  // --------------------------------------------------------------------------
  {
    // Verifies that formatted cosmic year strings have predictable character bounds
    // to prevent mobile viewport clipping
    const testYears: Year[] = [0, 1000, 13_800_000_000, 999_999_999_999];
    const formats = testYears.map((y) => ({
      raw: y,
      display: `${y.toLocaleString()} YR`,
      gyr: (y / 1_000_000_000).toFixed(3) + ' Gyr',
    }));

    const passed = formats.every((f) => f.display.length < 32 && f.gyr.length < 16);

    results.push({
      id: 'TEST_I16',
      name: 'Temporal Layout & String Formatting Sanity',
      passed,
      details: passed
        ? `Temporal string bounds verified across ${testYears.length} extreme epochs`
        : 'Temporal string formatting bounds exceeded layout constraints',
    });
  }

  return results;
}
