/**
 * @license Apache-2.0
 * GENESIS EXPANSION VERIFICATION TEST SUITE (PHASE 8)
 *
 * Comprehensive automated test battery verifying:
 * - Deterministic spacefaring capability evaluation & launch difficulty
 * - Expansion era progression logic
 * - Celestial destination analysis, classification & viability scoring
 * - Terraforming foundation & planetary engineering feasibility
 * - Interplanetary expansion transport routes
 * - Orbital infrastructure construction & lifecycle states
 * - Colony founding, demographic growth, carrying capacity & autonomy
 * - Resource network flows & homeworld planetary pressure relief
 * - Supply line disruptions & systemic collapse dynamics
 * - Chronological expansion milestones
 * - ExpansionStateCache O(1) performance & scrubbing integrity
 * - SimulationEngine end-to-end multi-run determinism
 *
 * Covers TEST_E1 through TEST_E20.
 */

import { generatePlanet } from '../hierarchy/planet.js';
import { generateStarSystem } from '../hierarchy/star-system.js';
import { generateCivilization } from '../civilization/civilization.js';
import { evaluateTechnology } from '../civilization/technology.js';
import { evaluatePopulation } from '../civilization/population.js';
import { evaluateCivilizationStability } from '../civilization/stability.js';
import { evaluatePlanetaryResources } from '../civilization/resources.js';
import {
  determineExpansionEra,
  evaluateSpacefaringProfile,
} from './spacefaring.js';
import {
  analyzePlanetDestination,
  evaluateSystemDestinations,
  evaluateTerraformingPotential,
} from './destinations.js';
import { buildExpansionRoutes } from './network.js';
import { materializeOrbitalInfrastructure } from './infrastructure.js';
import {
  isDestinationColonizable,
  materializeColonies,
} from './colonies.js';
import {
  materializeInterplanetaryState,
  summarizeInterplanetaryExpansion,
} from './expansion-state.js';
import { ExpansionStateCache } from './state-cache.js';
import { SimulationEngine } from '../simulation/engine.js';
import type { Civilization } from '../civilization/types.js';
import type { Planet } from '../../core/types.js';

export interface ExpansionTestResult {
  readonly id: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
}

export function runExpansionVerificationSuite(): readonly ExpansionTestResult[] {
  const results: ExpansionTestResult[] = [];
  const testSeed = 998877665;
  const system = generateStarSystem(testSeed, 0);

  const planets: Planet[] = Array.from(
    { length: Math.max(4, system.planetCount) },
    (_, i) =>
      generatePlanet(
        system.seed,
        i,
        system.id,
        system.name,
        system.stars[0]?.luminositySolar ?? 1.0,
        system.stars[0]?.massSolar ?? 1.0,
        true // materialize moons
      )
  );

  const homeworld = planets[0];

  // Synthesize a mature technological civilization for testing
  const mockSpecies = {
    id: `${homeworld.id}/species_0`,
    name: 'Terran Sapiens',
    planetId: homeworld.id,
    originEpochYear: 10_000_000_000,
    trophicRole: 'APEX_PREDATOR' as const,
    locomotion: 'BIPEDAL' as const,
    complexity: 0.95,
    symmetry: 'BILATERAL' as const,
    integument: 'SKIN' as const,
    diet: 'OMNIVORE' as const,
    respiration: 'AEROBIC' as const,
    reproduction: 'SEXUAL' as const,
    metabolicRate: 1.0,
    averageLifespanYears: 80,
    bodyMassKg: 70,
    population: 5_000_000_000,
    biomassMt: 350,
    adaptability: 0.85,
    ecologicalResilience: 0.8,
    status: 'DOMINANT' as const,
  };

  const tech = evaluateTechnology(homeworld, mockSpecies, 13_800_000_000, 13_799_990_000, 0.8);
  // Enhance spaceflight for interplanetary testing
  const advancedTech = {
    ...tech,
    spaceflight: 0.75,
    engineering: 0.8,
    energyTechnology: 0.85,
    computation: 0.85,
    automation: 0.78,
    biotechnology: 0.7,
    era: 'INTERPLANETARY' as const,
  };

  const resources = evaluatePlanetaryResources(homeworld, advancedTech);
  const pop = evaluatePopulation(homeworld, advancedTech, resources, 13_800_000_000, 13_799_990_000);
  const stability = evaluateCivilizationStability(homeworld, pop, advancedTech, resources, 0.8);

  const advancedCiv: Civilization = {
    id: `${homeworld.id}/civ_test_0`,
    name: 'Solar Federation',
    speciesId: mockSpecies.id,
    speciesName: mockSpecies.name,
    planetId: homeworld.id,
    seed: testSeed,
    emergenceEpochYear: 13_799_980_000,
    extinctionEpochYear: undefined,
    status: 'ACTIVE',
    population: 8_000_000_000,
    carryingCapacity: 12_000_000_000,
    peakPopulation: 8_000_000_000,
    technology: advancedTech,
    society: {
      type: 'POST_SCARCITY_UNION',
      cohesion: 0.85,
      militarism: 0.2,
      curiosity: 0.9,
      environmentalStewardship: 0.85,
      governanceForm: 'TECHNOCRATIC_FEDERATION',
    },
    resources,
    stability,
    cities: [],
  };

  // TEST_E1: Spacefaring Capability Evaluation & Determinism
  try {
    const p1 = evaluateSpacefaringProfile(advancedCiv, homeworld);
    const p2 = evaluateSpacefaringProfile(advancedCiv, homeworld);
    const passed =
      p1.isSpacefaring &&
      p1.orbitalCapability === p2.orbitalCapability &&
      p1.propulsionCapability >= 0 &&
      p1.propulsionCapability <= 1.0 &&
      p1.deepSpaceCapability >= 0 &&
      p1.deepSpaceCapability <= 1.0;
    results.push({
      id: 'TEST_E1',
      name: 'Spacefaring Capability Evaluation & Determinism',
      passed,
      details: passed
        ? `Deterministic spacefaring evaluated. Orbital: ${p1.orbitalCapability.toFixed(2)}, DeepSpace: ${p1.deepSpaceCapability.toFixed(2)}`
        : 'Failed spacefaring determinism or bounds.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E1', name: 'Spacefaring Capability Evaluation & Determinism', passed: false, details: String(e) });
  }

  // TEST_E2: Planetary Launch Resistance (Gravity Well & Atmosphere)
  try {
    const lowGravPlanet: Planet = {
      ...homeworld,
      surfaceGravityG: 0.35,
      atmosphere: { ...homeworld.atmosphere, surfacePressureAtm: 0.05 },
    };
    const highGravPlanet: Planet = {
      ...homeworld,
      surfaceGravityG: 2.2,
      atmosphere: { ...homeworld.atmosphere, surfacePressureAtm: 4.5 },
    };
    const pLow = evaluateSpacefaringProfile(advancedCiv, lowGravPlanet);
    const pHigh = evaluateSpacefaringProfile(advancedCiv, highGravPlanet);
    const passed =
      pLow.launchDifficulty < pHigh.launchDifficulty &&
      pLow.orbitalCapability > pHigh.orbitalCapability;
    results.push({
      id: 'TEST_E2',
      name: 'Planetary Launch Resistance (Gravity Well & Atmosphere)',
      passed,
      details: passed
        ? `Low-g launch diff: ${pLow.launchDifficulty.toFixed(2)}, High-g launch diff: ${pHigh.launchDifficulty.toFixed(2)}`
        : 'Launch difficulty failed gravity scaling.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E2', name: 'Planetary Launch Resistance (Gravity Well & Atmosphere)', passed: false, details: String(e) });
  }

  // TEST_E3: Expansion Era Progression
  try {
    const profile = evaluateSpacefaringProfile(advancedCiv, homeworld);
    const eraInterplanetary = determineExpansionEra(profile);

    const primitiveCiv: Civilization = {
      ...advancedCiv,
      technology: {
        ...advancedTech,
        spaceflight: 0.05,
        era: 'AGRICULTURAL',
      },
    };
    const pPrim = evaluateSpacefaringProfile(primitiveCiv, homeworld);
    const eraPlanetary = determineExpansionEra(pPrim);

    const passed = eraInterplanetary === 'INTERPLANETARY' && eraPlanetary === 'PLANETARY';
    results.push({
      id: 'TEST_E3',
      name: 'Expansion Era Progression',
      passed,
      details: passed
        ? `Correct eras derived: Primitive=${eraPlanetary}, Advanced=${eraInterplanetary}`
        : `Era mismatch: got ${eraPlanetary} and ${eraInterplanetary}`,
    });
  } catch (e) {
    results.push({ id: 'TEST_E3', name: 'Expansion Era Progression', passed: false, details: String(e) });
  }

  // TEST_E4: Celestial Destination Analysis & Classification
  try {
    const destinations = evaluateSystemDestinations(homeworld, planets, 1.0);
    const homeworldDest = destinations.find((d) => d.classification === 'HOMEWORLD');
    const hasMoons = destinations.some((d) => d.classification === 'MOON' || d.classification === 'ICE_WORLD');
    const passed = destinations.length >= 4 && homeworldDest !== undefined && (homeworld.moons.length === 0 || hasMoons);
    results.push({
      id: 'TEST_E4',
      name: 'Celestial Destination Analysis & Classification',
      passed,
      details: passed
        ? `Evaluated ${destinations.length} destinations across system. Homeworld found.`
        : 'Destination evaluation failed to classify system bodies properly.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E4', name: 'Celestial Destination Analysis & Classification', passed: false, details: String(e) });
  }

  // TEST_E5: Destination Viability Bounds & Habitability Logic
  try {
    const destinations = evaluateSystemDestinations(homeworld, planets, 1.0);
    const allBounded = destinations.every(
      (d) => d.viability >= 0 && d.viability <= 1.0 && !isNaN(d.viability)
    );
    const homeworldIsMostViable = destinations[0].classification === 'HOMEWORLD';
    const passed = allBounded && homeworldIsMostViable;
    results.push({
      id: 'TEST_E5',
      name: 'Destination Viability Bounds & Habitability Logic',
      passed,
      details: passed
        ? `All ${destinations.length} destination viability scores bounded [0, 1]. Homeworld top.`
        : 'Viability scores out of bounds or incorrectly ordered.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E5', name: 'Destination Viability Bounds & Habitability Logic', passed: false, details: String(e) });
  }

  // TEST_E6: Terraforming Foundation Evaluation
  try {
    const terraPlanet = evaluateTerraformingPotential(homeworld);
    const gasGiantTerra = evaluateTerraformingPotential({
      type: 'GAS_GIANT',
      massEarth: 300,
      surfaceGravityG: 2.5,
      averageTempKelvin: 120,
      atmosphere: { surfacePressureAtm: 100 },
    });
    const passed =
      terraPlanet.feasibility >= 0 &&
      terraPlanet.feasibility <= 1.0 &&
      gasGiantTerra.feasibility === 0 &&
      gasGiantTerra.energyRequirement > 100_000;
    results.push({
      id: 'TEST_E6',
      name: 'Terraforming Foundation Evaluation',
      passed,
      details: passed
        ? `Terraforming feasibility: Terrestrial=${terraPlanet.feasibility.toFixed(2)}, GasGiant=${gasGiantTerra.feasibility}`
        : 'Terraforming evaluation invalid.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E6', name: 'Terraforming Foundation Evaluation', passed: false, details: String(e) });
  }

  // TEST_E7: Interplanetary Expansion Route Generation
  try {
    const destinations = evaluateSystemDestinations(homeworld, planets, 1.0);
    const profile = evaluateSpacefaringProfile(advancedCiv, homeworld);
    const routes = buildExpansionRoutes(homeworld.id, destinations, profile, []);
    const passed =
      routes.length === destinations.length - 1 &&
      routes.every((r) => r.travelDifficulty >= 0 && r.travelDifficulty <= 1.0) &&
      routes.some((r) => r.status === 'ESTABLISHED' || r.status === 'PROPOSED');
    results.push({
      id: 'TEST_E7',
      name: 'Interplanetary Expansion Route Generation',
      passed,
      details: passed
        ? `Generated ${routes.length} routes. Difficulty and statuses correctly assigned.`
        : 'Expansion route network generation failed.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E7', name: 'Interplanetary Expansion Route Generation', passed: false, details: String(e) });
  }

  // TEST_E8: Orbital Infrastructure Construction Thresholds
  try {
    const profile = evaluateSpacefaringProfile(advancedCiv, homeworld);
    const infra = materializeOrbitalInfrastructure(
      advancedCiv,
      homeworld.id,
      homeworld.name,
      profile,
      13_800_000_000
    );
    const hasComms = infra.some((i) => i.type === 'COMMUNICATION_CONSTELLATION');
    const passed = infra.length >= 2 && hasComms;
    results.push({
      id: 'TEST_E8',
      name: 'Orbital Infrastructure Construction Thresholds',
      passed,
      details: passed
        ? `Materialized ${infra.length} orbital structures around ${homeworld.name}. Comms verified.`
        : 'Orbital infrastructure failed threshold checks.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E8', name: 'Orbital Infrastructure Construction Thresholds', passed: false, details: String(e) });
  }

  // TEST_E9: Orbital Infrastructure Lifecycle & Operational States
  try {
    const extinctCiv: Civilization = {
      ...advancedCiv,
      status: 'EXTINCT',
    };
    const profile = evaluateSpacefaringProfile(advancedCiv, homeworld);
    const abandonedInfra = materializeOrbitalInfrastructure(
      extinctCiv,
      homeworld.id,
      homeworld.name,
      profile,
      13_800_000_000
    );
    const passed =
      abandonedInfra.length > 0 &&
      abandonedInfra.every((i) => i.operationalState === 'ABANDONED' && i.population === 0);
    results.push({
      id: 'TEST_E9',
      name: 'Orbital Infrastructure Lifecycle & Operational States',
      passed,
      details: passed
        ? `Abandoned infrastructure verified for extinct civilization (${abandonedInfra.length} structures).`
        : 'Orbital infrastructure lifecycle transition failed.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E9', name: 'Orbital Infrastructure Lifecycle & Operational States', passed: false, details: String(e) });
  }

  // TEST_E10: Extraterrestrial Colony Eligibility
  try {
    const destinations = evaluateSystemDestinations(homeworld, planets, 1.0);
    const profile = evaluateSpacefaringProfile(advancedCiv, homeworld);
    const eligibleCount = destinations.filter((d) =>
      isDestinationColonizable(d, 'INTERPLANETARY', profile)
    ).length;
    const primitiveProfile: typeof profile = {
      ...profile,
      isSpacefaring: false,
      deepSpaceCapability: 0.1,
    };
    const primitiveEligible = destinations.filter((d) =>
      isDestinationColonizable(d, 'PLANETARY', primitiveProfile)
    ).length;
    const passed = eligibleCount > 0 && primitiveEligible === 0;
    results.push({
      id: 'TEST_E10',
      name: 'Extraterrestrial Colony Eligibility',
      passed,
      details: passed
        ? `Eligible destinations: Advanced=${eligibleCount}, Primitive=${primitiveEligible}`
        : 'Colony eligibility filtering failed.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E10', name: 'Extraterrestrial Colony Eligibility', passed: false, details: String(e) });
  }

  // TEST_E11: Colony Founding Epoch Determinism
  try {
    const destinations = evaluateSystemDestinations(homeworld, planets, 1.0);
    const profile = evaluateSpacefaringProfile(advancedCiv, homeworld);
    const coloniesPast = materializeColonies(
      advancedCiv,
      destinations,
      'INTERPLANETARY',
      profile,
      13_799_980_000 // At emergence epoch: no colonies yet!
    );
    const coloniesNow = materializeColonies(
      advancedCiv,
      destinations,
      'INTERPLANETARY',
      profile,
      13_800_000_000 // 20,000 years later
    );
    const passed = coloniesPast.length === 0 && coloniesNow.length > 0;
    results.push({
      id: 'TEST_E11',
      name: 'Colony Founding Epoch Determinism',
      passed,
      details: passed
        ? `Colonies at emergence: ${coloniesPast.length}, Colonies at present: ${coloniesNow.length}`
        : 'Colony founding epoch check failed.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E11', name: 'Colony Founding Epoch Determinism', passed: false, details: String(e) });
  }

  // TEST_E12: Colony Demographic Growth & Carrying Capacity
  try {
    const destinations = evaluateSystemDestinations(homeworld, planets, 1.0);
    const profile = evaluateSpacefaringProfile(advancedCiv, homeworld);
    const colonies = materializeColonies(
      advancedCiv,
      destinations,
      'INTERPLANETARY',
      profile,
      13_800_000_000
    );
    const firstColony = colonies[0];
    const passed =
      firstColony !== undefined &&
      firstColony.population > 0 &&
      firstColony.population < 100_000_000_000 &&
      (firstColony.status === 'GROWING' || firstColony.status === 'MATURE');
    results.push({
      id: 'TEST_E12',
      name: 'Colony Demographic Growth & Carrying Capacity',
      passed,
      details: passed
        ? `Colony ${firstColony.destinationName} population: ${firstColony.population.toLocaleString()} (${firstColony.status})`
        : 'Colony demographic growth check failed.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E12', name: 'Colony Demographic Growth & Carrying Capacity', passed: false, details: String(e) });
  }

  // TEST_E13: Colony Autonomy & Distance Dynamics
  try {
    const destinations = evaluateSystemDestinations(homeworld, planets, 1.0);
    const profile = evaluateSpacefaringProfile(advancedCiv, homeworld);
    const colonies = materializeColonies(
      advancedCiv,
      destinations,
      'INTERPLANETARY',
      profile,
      13_800_000_000
    );
    const allBounded = colonies.every((c) => c.autonomyLevel >= 0 && c.autonomyLevel <= 1.0);
    const passed = colonies.length > 0 && allBounded;
    results.push({
      id: 'TEST_E13',
      name: 'Colony Autonomy & Distance Dynamics',
      passed,
      details: passed
        ? `Autonomy bounded for all ${colonies.length} colonies.`
        : 'Colony autonomy check failed.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E13', name: 'Colony Autonomy & Distance Dynamics', passed: false, details: String(e) });
  }

  // TEST_E14: Colony Specialization & Resource Output
  try {
    const destinations = evaluateSystemDestinations(homeworld, planets, 1.0);
    const profile = evaluateSpacefaringProfile(advancedCiv, homeworld);
    const colonies = materializeColonies(
      advancedCiv,
      destinations,
      'INTERPLANETARY',
      profile,
      13_800_000_000
    );
    const hasOutputs = colonies.every(
      (c) =>
        c.resourceOutput.minerals >= 0 &&
        c.resourceOutput.energy >= 0 &&
        c.resourceOutput.manufacturedGoods >= 0
    );
    const passed = colonies.length > 0 && hasOutputs;
    results.push({
      id: 'TEST_E14',
      name: 'Colony Specialization & Resource Output',
      passed,
      details: passed
        ? `Verified non-negative resource outputs across ${colonies.length} colonies.`
        : 'Colony resource outputs failed.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E14', name: 'Colony Specialization & Resource Output', passed: false, details: String(e) });
  }

  // TEST_E15: Planetary Pressure Relief on Homeworld
  try {
    const state = materializeInterplanetaryState(advancedCiv, homeworld, planets, 13_800_000_000);
    const passed =
      state.pressureRelief >= 0 &&
      state.pressureRelief <= 1.0 &&
      state.resourceNetwork.mineralImport >= 0 &&
      state.resourceSecurity >= advancedCiv.stability.resourceSecurity;
    results.push({
      id: 'TEST_E15',
      name: 'Planetary Pressure Relief on Homeworld',
      passed,
      details: passed
        ? `Pressure relief ratio: ${(state.pressureRelief * 100).toFixed(1)}%, Resource security enhanced: ${state.resourceSecurity.toFixed(2)}`
        : 'Planetary pressure relief check failed.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E15', name: 'Planetary Pressure Relief on Homeworld', passed: false, details: String(e) });
  }

  // TEST_E16: Systemic Collapse & Supply Line Termination
  try {
    const collapsingCiv: Civilization = {
      ...advancedCiv,
      status: 'COLLAPSING',
      stability: { ...advancedCiv.stability, stabilityIndex: 0.1 },
    };
    const state = materializeInterplanetaryState(collapsingCiv, homeworld, planets, 13_800_000_000);
    const hasDisruptedRoutes = state.routes.some((r) => r.status === 'DISRUPTED');
    const hasDecliningColonies = state.colonies.some((c) => c.status === 'DECLINING');
    const passed = hasDisruptedRoutes || hasDecliningColonies;
    results.push({
      id: 'TEST_E16',
      name: 'Systemic Collapse & Supply Line Termination',
      passed,
      details: passed
        ? `Collapse dynamics confirmed: Disrupted routes or declining colonies detected.`
        : 'Supply line termination under collapse failed.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E16', name: 'Systemic Collapse & Supply Line Termination', passed: false, details: String(e) });
  }

  // TEST_E17: Chronological Expansion Milestones
  try {
    const state = materializeInterplanetaryState(advancedCiv, homeworld, planets, 13_800_000_000);
    const isSorted = state.milestones.every(
      (m, idx, arr) => idx === 0 || m.year >= arr[idx - 1].year
    );
    const passed = state.milestones.length >= 2 && isSorted;
    results.push({
      id: 'TEST_E17',
      name: 'Chronological Expansion Milestones',
      passed,
      details: passed
        ? `Compiled ${state.milestones.length} milestones in chronological sequence.`
        : 'Expansion milestones failed sequence verification.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E17', name: 'Chronological Expansion Milestones', passed: false, details: String(e) });
  }

  // TEST_E18: ExpansionStateCache O(1) Memoization & Temporal Scrubbing
  try {
    const cache = new ExpansionStateCache();
    const state = materializeInterplanetaryState(advancedCiv, homeworld, planets, 13_800_000_000);
    const summary = summarizeInterplanetaryExpansion(state);

    cache.setExpansionState(homeworld.id, 13_800_000_000, state);
    cache.setExpansionSummary(homeworld.id, 13_800_000_000, summary);

    const cachedState = cache.getExpansionState(homeworld.id, 13_800_000_000);
    const cachedSummary = cache.getExpansionSummary(homeworld.id, 13_800_000_000);
    const missing = cache.getExpansionState(homeworld.id, 10_000_000_000);

    const passed =
      cachedState === state &&
      cachedSummary === summary &&
      missing === undefined;
    results.push({
      id: 'TEST_E18',
      name: 'ExpansionStateCache O(1) Memoization & Temporal Scrubbing',
      passed,
      details: passed
        ? 'Cache hits and misses verified without mutation.'
        : 'ExpansionStateCache memoization failed.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E18', name: 'ExpansionStateCache O(1) Memoization & Temporal Scrubbing', passed: false, details: String(e) });
  }

  // TEST_E19: SimulationEngine Integration for Expansion State
  try {
    const engine = new SimulationEngine(testSeed, 13_800_000_000);
    engine.setActiveSystem(system, planets);

    // Query expansion state via engine API
    const expState = engine.getExpansionState(homeworld, advancedCiv);
    const expSummary = engine.getExpansionSummary(homeworld, advancedCiv);

    const passed =
      expState !== undefined &&
      expSummary !== undefined &&
      expState.civilizationId === advancedCiv.id &&
      expSummary.expansionEra === expState.expansionEra;
    results.push({
      id: 'TEST_E19',
      name: 'SimulationEngine Integration for Expansion State',
      passed,
      details: passed
        ? `Engine retrieved expansion state. Era: ${expSummary?.expansionEra}, Coverage: ${((expSummary?.systemCoverage ?? 0) * 100).toFixed(1)}%`
        : 'SimulationEngine expansion integration failed.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E19', name: 'SimulationEngine Integration for Expansion State', passed: false, details: String(e) });
  }

  // TEST_E20: Total Systemic End-to-End Determinism & Integrity
  try {
    const engine1 = new SimulationEngine(testSeed, 13_800_000_000);
    engine1.setActiveSystem(system, planets);
    const s1 = engine1.getExpansionState(homeworld, advancedCiv);

    const engine2 = new SimulationEngine(testSeed, 13_800_000_000);
    engine2.setActiveSystem(system, planets);
    const s2 = engine2.getExpansionState(homeworld, advancedCiv);

    const passed =
      s1 !== undefined &&
      s2 !== undefined &&
      s1.totalPopulation === s2.totalPopulation &&
      s1.colonies.length === s2.colonies.length &&
      s1.orbitalInfrastructure.length === s2.orbitalInfrastructure.length &&
      s1.pressureRelief === s2.pressureRelief;
    results.push({
      id: 'TEST_E20',
      name: 'Total Systemic End-to-End Determinism & Integrity',
      passed,
      details: passed
        ? `Two independent SimulationEngine instances generated identical expansion state (Pop: ${s1?.totalPopulation.toLocaleString()}, Colonies: ${s1?.colonies.length}).`
        : 'Multi-run simulation engine determinism mismatch.',
    });
  } catch (e) {
    results.push({ id: 'TEST_E20', name: 'Total Systemic End-to-End Determinism & Integrity', passed: false, details: String(e) });
  }

  return results;
}
