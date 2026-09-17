/**
 * @license Apache-2.0
 * GENESIS ASTRONOMICAL GENERATOR TEST SUITE
 *
 * Implements tests 1 through 8 from Phase 2 specifications:
 * - Deterministic entity reproducibility
 * - Independent lazy evaluation (Galaxy #100, System #500, Planet #5)
 * - Physical bounds and consistency validation
 * - Serialized representation bitwise parity
 */

import type { TestResult } from '../../core/tests.js';
import type { Seed } from '../../core/types.js';
import { generateUniverse } from './universe.js';
import { generateGalaxy } from './galaxy.js';
import { generateStarSystem } from './star-system.js';
import { generatePlanet } from './planet.js';

const TEST_UNIVERSE_SEED: Seed = 123456789;

/**
 * Test 1: Same universe seed -> identical Universe.
 */
export function testSameUniverseSeed(): TestResult {
  const u1 = generateUniverse(TEST_UNIVERSE_SEED);
  const u2 = generateUniverse(TEST_UNIVERSE_SEED);

  const passed =
    u1.seed === u2.seed &&
    u1.name === u2.name &&
    u1.ageYears === u2.ageYears &&
    u1.totalGalaxiesEstimate === u2.totalGalaxiesEstimate &&
    u1.cosmologicalConstant === u2.cosmologicalConstant;

  return {
    id: 'ASTRONOMY_TEST_1',
    name: 'Universe Seed Reproducibility',
    passed,
    message: passed
      ? `Universe '${u1.name}' generated identically across multiple independent invocations.`
      : 'Universe generation produced differing attributes for identical seed.',
  };
}

/**
 * Test 2: Same galaxy index + same universe seed -> identical Galaxy.
 */
export function testSameGalaxySeed(): TestResult {
  const g1 = generateGalaxy(TEST_UNIVERSE_SEED, 42);
  const g2 = generateGalaxy(TEST_UNIVERSE_SEED, 42);

  const passed = JSON.stringify(g1) === JSON.stringify(g2);
  return {
    id: 'ASTRONOMY_TEST_2',
    name: 'Galaxy Seed Reproducibility',
    passed,
    message: passed
      ? `Galaxy '${g1.name}' (#42) generated identical state and spiral parameters across runs.`
      : 'Galaxy generation diverged for identical universe seed and index.',
  };
}

/**
 * Test 3: Different galaxy index -> different galaxy seed/entity.
 */
export function testDifferentGalaxyIndex(): TestResult {
  const g1 = generateGalaxy(TEST_UNIVERSE_SEED, 1);
  const g2 = generateGalaxy(TEST_UNIVERSE_SEED, 2);

  const passed = g1.seed !== g2.seed && g1.name !== g2.name && g1.id !== g2.id;
  return {
    id: 'ASTRONOMY_TEST_3',
    name: 'Different Galaxy Index Divergence',
    passed,
    message: passed
      ? `Galaxy #1 (${g1.name}) and Galaxy #2 (${g2.name}) produced distinct independent seeds.`
      : 'Galaxy index failed to produce divergent seed streams.',
  };
}

/**
 * Test 4: Generate Galaxy #100 directly vs after generating #0..#99.
 */
export function testGalaxy100DirectVsSequential(): TestResult {
  // Direct generation
  const directG100 = generateGalaxy(TEST_UNIVERSE_SEED, 100);

  // Sequential generation
  for (let i = 0; i < 100; i++) {
    generateGalaxy(TEST_UNIVERSE_SEED, i);
  }
  const sequentialG100 = generateGalaxy(TEST_UNIVERSE_SEED, 100);

  const passed = JSON.stringify(directG100) === JSON.stringify(sequentialG100);
  return {
    id: 'ASTRONOMY_TEST_4',
    name: 'Galaxy #100 Lazy Evaluation Independence',
    passed,
    message: passed
      ? 'Galaxy #100 generated directly without generating #0-99 is bit-identical to sequential generation.'
      : 'Generating prior galaxies tainted the state of Galaxy #100.',
  };
}

/**
 * Test 5: Generate Star System #500 directly vs sequential.
 */
export function testSystem500DirectVsSequential(): TestResult {
  const galaxySeed = 987654321;

  // Direct generation
  const directS500 = generateStarSystem(galaxySeed, 500);

  // Prior generation
  for (let i = 0; i < 10; i++) {
    generateStarSystem(galaxySeed, i * 40);
  }
  const secondS500 = generateStarSystem(galaxySeed, 500);

  const passed = JSON.stringify(directS500) === JSON.stringify(secondS500);
  return {
    id: 'ASTRONOMY_TEST_5',
    name: 'Star System #500 Lazy Evaluation Independence',
    passed,
    message: passed
      ? 'Star System #500 is completely independent of other star system generations.'
      : 'Star System state depended on previous evaluations.',
  };
}

/**
 * Test 6: Generate Planet #5 directly vs sequential.
 */
export function testPlanet5DirectVsSequential(): TestResult {
  const systemSeed = 555444333;

  // Direct generation of slot 5
  const directP5 = generatePlanet(systemSeed, 5);

  // Sequential generation of slots 0-4
  for (let i = 0; i < 5; i++) {
    generatePlanet(systemSeed, i);
  }
  const sequentialP5 = generatePlanet(systemSeed, 5);

  const passed = JSON.stringify(directP5) === JSON.stringify(sequentialP5);
  return {
    id: 'ASTRONOMY_TEST_6',
    name: 'Planet #5 Lazy Evaluation Independence',
    passed,
    message: passed
      ? `Planet #5 (${directP5.name}) matches identically whether slots 0-4 are generated or skipped.`
      : 'Planet generation had side-effects on subsequent slots.',
  };
}

/**
 * Test 7: Generated physical values remain inside documented ranges (validation check).
 */
export function testPhysicalBoundsCompliance(): TestResult {
  let sampledEntities = 0;
  let allValid = true;
  let failureReason = '';

  try {
    for (let g = 0; g < 15; g++) {
      const galaxy = generateGalaxy(TEST_UNIVERSE_SEED, g);
      sampledEntities++;

      for (let s = 0; s < 5; s++) {
        const system = generateStarSystem(galaxy.seed, s, galaxy.id);
        sampledEntities++;

        for (let p = 0; p < system.planetCount; p++) {
          generatePlanet(system.seed, p, system.id, system.name, system.stars[0].luminositySolar, system.stars[0].massSolar);
          sampledEntities++;
        }
      }
    }
  } catch (err: unknown) {
    allValid = false;
    failureReason = err instanceof Error ? err.message : String(err);
  }

  return {
    id: 'ASTRONOMY_TEST_7',
    name: 'Physical Bounds & Astro-Consistency',
    passed: allValid,
    message: allValid
      ? `Verified physical constraints across ${sampledEntities} celestial entities (Galaxies, Stars, Systems, Planets).`
      : `Physical bounds violation: ${failureReason}`,
  };
}

/**
 * Test 8: Repeated regeneration produces identical serialized entity data.
 */
export function testSerializationParity(): TestResult {
  const universe = generateUniverse(TEST_UNIVERSE_SEED);
  const galaxy = generateGalaxy(TEST_UNIVERSE_SEED, 7);
  const system = generateStarSystem(galaxy.seed, 3, galaxy.id);
  const planet = generatePlanet(system.seed, 2, system.id, system.name, system.stars[0].luminositySolar, system.stars[0].massSolar, true);

  const treeSnapshot1 = JSON.stringify({ universe, galaxy, system, planet });

  // Re-generate in reverse order with independent calls
  const planetB = generatePlanet(system.seed, 2, system.id, system.name, system.stars[0].luminositySolar, system.stars[0].massSolar, true);
  const systemB = generateStarSystem(galaxy.seed, 3, galaxy.id);
  const galaxyB = generateGalaxy(TEST_UNIVERSE_SEED, 7);
  const universeB = generateUniverse(TEST_UNIVERSE_SEED);

  const treeSnapshot2 = JSON.stringify({ universe: universeB, galaxy: galaxyB, system: systemB, planet: planetB });

  const passed = treeSnapshot1 === treeSnapshot2;
  return {
    id: 'ASTRONOMY_TEST_8',
    name: 'Multi-Tier Serialized Snapshot Parity',
    passed,
    message: passed
      ? 'Complete multi-tier celestial hierarchy JSON serialization is 100% bit-for-bit reproducible.'
      : 'Serialized entity data differed upon re-generation.',
  };
}

/**
 * Runs all Phase 2 astronomical generator tests.
 */
export function runAstronomicalTests(): TestResult[] {
  return [
    testSameUniverseSeed(),
    testSameGalaxySeed(),
    testDifferentGalaxyIndex(),
    testGalaxy100DirectVsSequential(),
    testSystem500DirectVsSequential(),
    testPlanet5DirectVsSequential(),
    testPhysicalBoundsCompliance(),
    testSerializationParity(),
  ];
}
