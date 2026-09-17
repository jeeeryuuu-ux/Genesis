/**
 * @license Apache-2.0
 * GENESIS PLANETARY ENVIRONMENTAL EVOLUTION
 *
 * Computes deterministic planetary environmental responses to evolving stellar luminosity:
 * - Incident flux
 * - Effective equilibrium temperature
 * - Hydrosphere and ice coverage fractions
 * - Dynamic habitable zone inclusion
 * - Biosphere eligibility criteria (environmental flag only, no biological organisms)
 */

import type { HabitableZoneAU, Planet, Year } from '../../core/types.js';
import {
  calculatePlanetOrbitalPhase,
  calculatePlanetPositionAU,
} from './orbital-dynamics.js';
import type { PlanetaryTemporalState, StellarTemporalState } from './types.js';

/**
 * Computes the planetary environmental state in response to current stellar luminosity.
 */
export function evolvePlanet(
  basePlanet: Planet,
  currentYear: Year,
  primaryStarState: StellarTemporalState,
  habitableZoneAU: HabitableZoneAU
): PlanetaryTemporalState {
  // 1. Orbital dynamics
  const orbitalPhaseRad = calculatePlanetOrbitalPhase(basePlanet, currentYear);
  const positionAU = calculatePlanetPositionAU(
    basePlanet.semiMajorAxisAU,
    basePlanet.eccentricity,
    orbitalPhaseRad
  );

  // 2. Incident stellar radiation flux relative to Earth (1.0 Solar Flux Unit)
  const a = Math.max(0.05, basePlanet.semiMajorAxisAU);
  const incidentFluxSolar = primaryStarState.luminositySolar / (a * a);

  // 3. Temperature response
  // Albedo estimate based on planet type
  let albedo = 0.3; // Earth-like baseline
  if (basePlanet.type === 'ICE_GIANT' || basePlanet.type === 'BARREN') albedo = 0.5;
  else if (basePlanet.type === 'LAVA') albedo = 0.15;
  else if (basePlanet.type === 'OCEAN') albedo = 0.1;
  else if (basePlanet.type === 'DESERT') albedo = 0.4;

  // Base blackbody equilibrium temperature: T_eq ≈ 278.5 * (S * (1 - albedo))^0.25
  const baseTeq = 278.5 * Math.pow(Math.max(0.0001, incidentFluxSolar * (1 - albedo)), 0.25);

  // Greenhouse effect from atmospheric column
  const atm = basePlanet.atmosphere;
  let greenhouseBoost = 0;
  if (atm && atm.surfacePressureAtm > 0) {
    const greenhouseFactor =
      atm.carbonDioxide * 30 +
      atm.methane * 40 +
      atm.waterVapor * 25;
    greenhouseBoost = Math.min(300, Math.log10(1 + atm.surfacePressureAtm) * greenhouseFactor);
  }

  const effectiveTempKelvin = Math.max(20, Math.round(baseTeq + greenhouseBoost));

  // 4. Hydrosphere and ice coverage response
  let hydrosphereCoverage = basePlanet.hydrosphereCoverage;
  let iceCoverage = 0.0;
  let surfacePressureAtm = atm?.surfacePressureAtm ?? 0;

  if (basePlanet.type === 'TERRESTRIAL' || basePlanet.type === 'OCEAN') {
    if (effectiveTempKelvin < 260) {
      // Global glaciation / snowball planet transition
      const freezeFactor = Math.min(1.0, (260 - effectiveTempKelvin) / 50);
      iceCoverage = Math.min(1.0, 0.2 + 0.8 * freezeFactor);
      hydrosphereCoverage = Math.max(0.0, basePlanet.hydrosphereCoverage * (1 - freezeFactor * 0.9));
    } else if (effectiveTempKelvin > 373) {
      // Runaway greenhouse / boiling oceans
      const boilFactor = Math.min(1.0, (effectiveTempKelvin - 373) / 100);
      hydrosphereCoverage = Math.max(0.0, basePlanet.hydrosphereCoverage * (1 - boilFactor));
      iceCoverage = 0.0;
      surfacePressureAtm += boilFactor * 5.0; // Vaporized steam increases atmospheric pressure
    } else {
      // Temperate liquid oceans
      hydrosphereCoverage = basePlanet.hydrosphereCoverage;
      iceCoverage = effectiveTempKelvin < 285 ? 0.15 : 0.05;
    }
  } else if (basePlanet.type === 'ICE_GIANT') {
    iceCoverage = 0.9;
  }

  // 5. Dynamic habitable zone inclusion
  const isInHabitableZone =
    basePlanet.semiMajorAxisAU >= habitableZoneAU.inner &&
    basePlanet.semiMajorAxisAU <= habitableZoneAU.outer;

  // 6. Biosphere eligibility constraint:
  // Strict environmental qualification criteria for potential future organic chemistry:
  // - Host star is stably on the Main Sequence
  // - Planet is temperate: 270 K <= T <= 340 K
  // - Stable atmospheric pressure: 0.2 <= P <= 5.0 atm
  // - Liquid surface water present: hydrosphereCoverage >= 0.05
  // - Not a gas giant, ice giant, lava world, or barren airless body
  const isTemperate = effectiveTempKelvin >= 270 && effectiveTempKelvin <= 340;
  const hasAtmosphere = surfacePressureAtm >= 0.2 && surfacePressureAtm <= 5.0;
  const hasLiquidWater = hydrosphereCoverage >= 0.05 && iceCoverage < 0.85;
  const hasValidType = basePlanet.type === 'TERRESTRIAL' || basePlanet.type === 'OCEAN';
  const isStarStable = primaryStarState.stage === 'MAIN_SEQUENCE';

  const hasBiosphereEligibility =
    isStarStable && hasValidType && isTemperate && hasAtmosphere && hasLiquidWater;

  return {
    entityId: basePlanet.id,
    basePlanet,
    orbitalPhaseRad,
    positionAU,
    incidentFluxSolar: Number(incidentFluxSolar.toFixed(4)),
    effectiveTempKelvin,
    surfacePressureAtm: Number(surfacePressureAtm.toFixed(3)),
    hydrosphereCoverage: Number(hydrosphereCoverage.toFixed(3)),
    iceCoverage: Number(iceCoverage.toFixed(3)),
    isInHabitableZone,
    hasBiosphereEligibility,
  };
}
