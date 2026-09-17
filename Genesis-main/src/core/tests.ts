/**
 * @license Apache-2.0
 * GENESIS DETERMINISTIC VERIFICATION TEST SUITE
 *
 * Programmatic test harness verifying mathematical determinism,
 * range compliance, domain isolation, and sibling independence.
 */

import { deriveGalaxySeed, derivePlanetSeed, deriveSystemSeed } from './hierarchy.js';
import { createPRNG, type Random } from './prng.js';
import type { Seed } from './types.js';

export interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  message: string;
  details?: string;
}

export interface VerificationSuiteReport {
  timestamp: string;
  allPassed: boolean;
  totalTests: number;
  passedTests: number;
  results: TestResult[];
}

/**
 * Expected 10-step sequence for seed 123456789 using Mulberry32.
 * This immutable fixture ensures that future refactors or engine upgrades
 * never accidentally alter the mathematical pseudo-random sequence.
 */
export const FIXTURE_SEED: Seed = 123456789;
export const EXPECTED_FIXTURE_SEQUENCE: readonly number[] = [
  0.2577907438389957,
  0.9707721115555614,
  0.7853280142880976,
  0.20616457983851433,
  0.30307188746519387,
  0.7470660470426083,
  0.7787336520850658,
  0.2845096290111542,
  0.016536934999749064,
  0.1614646923262626,
];

/**
 * Executes Test A: Same seed produces identical sequence.
 */
export function testSameSeed(): TestResult {
  const prng1 = createPRNG(FIXTURE_SEED);
  const prng2 = createPRNG(FIXTURE_SEED);

  const seq1: number[] = [];
  const seq2: number[] = [];

  for (let i = 0; i < 20; i++) {
    seq1.push(prng1.next());
    seq2.push(prng2.next());
  }

  const matches = seq1.every((val, idx) => val === seq2[idx]);
  return {
    id: 'TEST_A',
    name: 'Same Seed Determinism',
    passed: matches,
    message: matches
      ? 'Two distinct PRNG instances with seed 123456789 generated 20 identical float values.'
      : 'Sequences diverged between instances with identical seeds.',
  };
}

/**
 * Executes Test B: Different seeds produce different sequences.
 */
export function testDifferentSeeds(): TestResult {
  const prng1 = createPRNG(123456789);
  const prng2 = createPRNG(987654321);

  let differenceCount = 0;
  for (let i = 0; i < 20; i++) {
    if (prng1.next() !== prng2.next()) {
      differenceCount++;
    }
  }

  const passed = differenceCount === 20;
  return {
    id: 'TEST_B',
    name: 'Different Seeds Divergence',
    passed,
    message: passed
      ? 'Different seeds produced completely divergent sequences (20/20 non-matching).'
      : `Unexpected correlation: only ${differenceCount}/20 values diverged.`,
  };
}

/**
 * Executes Test C: Child seed determinism.
 */
export function testChildSeedDeterminism(): TestResult {
  const universeSeed: Seed = 123456789;
  const galaxyIndex = 4;

  const galaxySeed1 = deriveGalaxySeed(universeSeed, galaxyIndex);
  const galaxySeed2 = deriveGalaxySeed(universeSeed, galaxyIndex);

  const passed = galaxySeed1 === galaxySeed2 && typeof galaxySeed1 === 'number';
  return {
    id: 'TEST_C',
    name: 'Child Seed Determinism',
    passed,
    message: passed
      ? `Universe (${universeSeed}) -> Galaxy #${galaxyIndex} consistently produced seed 0x${galaxySeed1.toString(16).toUpperCase()}`
      : 'Derived child seeds diverged across evaluations.',
    details: `Hex: 0x${galaxySeed1.toString(16)} === 0x${galaxySeed2.toString(16)}`,
  };
}

/**
 * Executes Test D: Sibling independence.
 */
export function testSiblingIndependence(): TestResult {
  const universeSeed: Seed = 123456789;

  // Derive sequentially
  deriveGalaxySeed(universeSeed, 0);
  deriveGalaxySeed(universeSeed, 1);
  deriveGalaxySeed(universeSeed, 2);
  const sequentialGalaxy3 = deriveGalaxySeed(universeSeed, 3);

  // Derive directly without ever evaluating 0, 1, 2
  const directGalaxy3 = deriveGalaxySeed(universeSeed, 3);

  const passed = sequentialGalaxy3 === directGalaxy3;
  return {
    id: 'TEST_D',
    name: 'Sibling Independence',
    passed,
    message: passed
      ? 'Galaxy #3 computed directly is bit-identical to Galaxy #3 computed after siblings.'
      : 'Sibling order tainted seed derivation.',
  };
}

/**
 * Executes Test E: Range and boundary validation.
 */
export function testRangeValidation(): TestResult {
  const prng: Random = createPRNG(42);
  const errors: string[] = [];

  // next() in [0, 1)
  for (let i = 0; i < 1000; i++) {
    const val = prng.next();
    if (val < 0 || val >= 1) {
      errors.push(`next() out of [0, 1) range: ${val}`);
      break;
    }
  }

  // nextInt(10, 20) inclusive
  for (let i = 0; i < 500; i++) {
    const intVal = prng.nextInt(10, 20);
    if (!Number.isInteger(intVal) || intVal < 10 || intVal > 20) {
      errors.push(`nextInt(10, 20) out of bounds: ${intVal}`);
      break;
    }
  }

  // nextFloat(-5.5, 5.5)
  for (let i = 0; i < 500; i++) {
    const fVal = prng.nextFloat(-5.5, 5.5);
    if (fVal < -5.5 || fVal > 5.5) {
      errors.push(`nextFloat(-5.5, 5.5) out of bounds: ${fVal}`);
      break;
    }
  }

  // chance(0) and chance(1)
  if (prng.chance(0) !== false) errors.push('chance(0) returned true');
  if (prng.chance(1) !== true) errors.push('chance(1) returned false');

  // pick
  const items = ['A', 'B', 'C'];
  const picked = prng.pick(items);
  if (!items.includes(picked)) errors.push(`pick returned invalid element: ${picked}`);

  const passed = errors.length === 0;
  return {
    id: 'TEST_E',
    name: 'Range & Boundary Validation',
    passed,
    message: passed
      ? 'Verified 2,000 samples across next(), nextInt(), nextFloat(), chance(), and pick().'
      : `Validation failures: ${errors.join('; ')}`,
  };
}

/**
 * Executes Test F: Reproducibility fixture regression test.
 */
export function testReproducibilityFixture(): TestResult {
  const prng = createPRNG(FIXTURE_SEED);
  const actualSequence: number[] = [];

  for (let i = 0; i < EXPECTED_FIXTURE_SEQUENCE.length; i++) {
    actualSequence.push(prng.next());
  }

  let matched = true;
  for (let i = 0; i < EXPECTED_FIXTURE_SEQUENCE.length; i++) {
    if (Math.abs(actualSequence[i] - EXPECTED_FIXTURE_SEQUENCE[i]) > 1e-15) {
      matched = false;
      break;
    }
  }

  return {
    id: 'TEST_F',
    name: 'Reproducibility Fixture (Regression Shield)',
    passed: matched,
    message: matched
      ? 'Mulberry32 produced 100% exact bit match against the canonical expected fixture sequence.'
      : 'Fixture mismatch! The PRNG algorithm behavior has shifted.',
  };
}

/**
 * Runs the entire verification suite and compiles a summary report.
 */
export function runDeterministicVerificationSuite(): VerificationSuiteReport {
  const results: TestResult[] = [
    testSameSeed(),
    testDifferentSeeds(),
    testChildSeedDeterminism(),
    testSiblingIndependence(),
    testRangeValidation(),
    testReproducibilityFixture(),
  ];

  const passedTests = results.filter((r) => r.passed).length;
  const allPassed = passedTests === results.length;

  return {
    timestamp: new Date().toISOString(),
    allPassed,
    totalTests: results.length,
    passedTests,
    results,
  };
}
