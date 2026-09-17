/**
 * @license Apache-2.0
 * GENESIS SPACEFARING ELIGIBILITY & CAPABILITY EVALUATOR (PHASE 8)
 *
 * Deterministically evaluates whether a planetary civilization possesses the technological,
 * demographic, and energetic capacity to achieve orbit and expand into its star system.
 */

import type { Planet } from '../../core/types.js';
import type { Civilization } from '../civilization/types.js';
import type { ExpansionEra, SpacefaringProfile } from './types.js';

/**
 * Deterministically computes the comprehensive spacefaring profile of a civilization
 * given its planetary gravity well, atmospheric drag, and technological maturity.
 */
export function evaluateSpacefaringProfile(
  civilization: Civilization,
  homeworld: Planet
): SpacefaringProfile {
  const tech = civilization.technology;

  // 1. Planetary Launch Resistance
  // Heavy gravity and dense atmospheres impose steep delta-v and aerodynamic penalties
  const gravityFactor = Math.max(0.2, homeworld.surfaceGravityG);
  const pressureFactor = Math.max(0.01, homeworld.atmosphere.surfacePressureAtm);
  const launchDifficulty = Math.min(
    1.0,
    Math.max(0.1, (gravityFactor * 0.65 + pressureFactor * 0.35) / 1.4)
  );

  // 2. Sub-Capability Indices derived from Phase 7 Technology Profile
  // Orbital lift capacity
  const rawOrbital =
    tech.spaceflight * 0.5 +
    tech.engineering * 0.3 +
    tech.energyTechnology * 0.2;
  const orbitalCapability = Math.max(0, Math.min(1.0, rawOrbital / Math.max(0.4, launchDifficulty)));

  // Propulsion & delta-v potential
  const propulsionCapability = Math.max(
    0,
    Math.min(1.0, tech.spaceflight * 0.45 + tech.energyTechnology * 0.35 + tech.engineering * 0.2)
  );

  // Astrodynamics, computing & orbital telemetry
  const navigationCapability = Math.max(
    0,
    Math.min(1.0, tech.computation * 0.6 + tech.spaceflight * 0.4)
  );

  // Automation, robotics, and uncrewed construction
  const automationCapability = Math.max(
    0,
    Math.min(1.0, tech.automation * 0.6 + tech.computation * 0.4)
  );

  // Closed-loop bio-regenerative life support & habitat engineering
  const lifeSupportCapability = Math.max(
    0,
    Math.min(1.0, tech.biotechnology * 0.5 + tech.engineering * 0.3 + tech.energyTechnology * 0.2)
  );

  // Offworld power generation (solar capture, fusion, fission)
  const energyCapability = Math.max(
    0,
    Math.min(1.0, tech.energyTechnology * 0.7 + tech.automation * 0.3)
  );

  // Deep space endurance across interplanetary distances
  const deepSpaceCapability = Math.max(
    0,
    Math.min(
      1.0,
      propulsionCapability * 0.35 +
        lifeSupportCapability * 0.25 +
        energyCapability * 0.25 +
        automationCapability * 0.15
    )
  );

  // Composite expansion potential
  const expansionPotential = Math.max(
    0,
    Math.min(
      1.0,
      (orbitalCapability * 1.2 +
        propulsionCapability +
        navigationCapability +
        automationCapability +
        lifeSupportCapability +
        energyCapability +
        deepSpaceCapability) /
        7.2
    )
  );

  // Civilization must be non-extinct, with substantial societal scale and technology
  const isPreSpaceEra =
    tech.era === 'STONE_AGE' ||
    tech.era === 'AGRICULTURAL' ||
    tech.era === 'BRONZE_IRON' ||
    tech.era === 'ORGANIZED_PRE_INDUSTRIAL';

  const isSpacefaring =
    !isPreSpaceEra &&
    civilization.status !== 'EXTINCT' &&
    civilization.population > 50_000 &&
    orbitalCapability >= 0.28 &&
    tech.spaceflight >= 0.25;

  return {
    orbitalCapability,
    propulsionCapability,
    navigationCapability,
    automationCapability,
    lifeSupportCapability,
    energyCapability,
    deepSpaceCapability,
    expansionPotential,
    isSpacefaring,
    launchDifficulty,
  };
}

/**
 * Derives the expansion era based on spacefaring capabilities, not mere elapsed time.
 */
export function determineExpansionEra(profile: SpacefaringProfile): ExpansionEra {
  if (!profile.isSpacefaring || profile.orbitalCapability < 0.28) {
    return 'PLANETARY';
  }

  if (profile.deepSpaceCapability >= 0.85 && profile.energyCapability >= 0.8) {
    return 'SYSTEM_WIDE';
  }

  if (profile.deepSpaceCapability >= 0.55 && profile.propulsionCapability >= 0.5) {
    return 'INTERPLANETARY';
  }

  if (profile.deepSpaceCapability >= 0.32 || profile.propulsionCapability >= 0.35) {
    return 'LUNAR_SYSTEM';
  }

  return 'ORBITAL';
}
