/**
 * @license Apache-2.0
 * GENESIS PLANETARY HABITABILITY MODEL
 *
 * Deterministically evaluates planetary habitability based on physical,
 * atmospheric, and stellar conditions derived from the astronomical simulation.
 */

import type { Planet } from '../../core/types.js';
import type { PlanetaryTemporalState, StellarTemporalState } from '../simulation/types.js';
import type { HabitabilityAssessment, HabitabilityRating } from './types.js';

/**
 * Calculates a continuous planetary habitability assessment.
 * Strictly consumes astronomical/environmental state without mutating it.
 */
export function assessHabitability(
  planet: Planet,
  temporalState?: PlanetaryTemporalState,
  starState?: StellarTemporalState
): HabitabilityAssessment {
  // Extract dynamic values if available, fallback to static baseline
  const effectiveTemp = temporalState?.effectiveTempKelvin ?? planet.averageTempKelvin;
  const surfacePressure = temporalState?.surfacePressureAtm ?? planet.atmosphere.surfacePressureAtm;
  const hydrosphere = temporalState?.hydrosphereCoverage ?? planet.hydrosphereCoverage;
  const iceCoverage = temporalState?.iceCoverage ?? 0.0;
  const inHZ = temporalState?.isInHabitableZone ?? true;
  const isStarStable = starState ? starState.stage === 'MAIN_SEQUENCE' : true;

  // 1. Planet Class Factor
  let planetClassModifier = 0.0;
  switch (planet.type) {
    case 'TERRESTRIAL':
      planetClassModifier = 1.0;
      break;
    case 'OCEAN':
      planetClassModifier = 0.95;
      break;
    case 'DESERT':
      planetClassModifier = 0.45;
      break;
    case 'BARREN':
      planetClassModifier = 0.05;
      break;
    case 'ICE_GIANT':
      planetClassModifier = 0.02;
      break;
    case 'LAVA':
    case 'GAS_GIANT':
    default:
      planetClassModifier = 0.0;
      break;
  }

  // 2. Temperature Suitability [0.0, 1.0]
  // Peak at 288 K (Earth-like), viable between 250 K and 350 K.
  let temperatureSuitability = 0.0;
  if (effectiveTemp >= 200 && effectiveTemp <= 400) {
    const tempDiff = Math.abs(effectiveTemp - 288);
    if (tempDiff <= 30) {
      temperatureSuitability = 1.0 - (tempDiff / 30) * 0.3; // 0.7 to 1.0
    } else if (tempDiff <= 80) {
      temperatureSuitability = 0.7 - ((tempDiff - 30) / 50) * 0.55; // 0.15 to 0.7
    } else {
      temperatureSuitability = Math.max(0.01, 0.15 - ((tempDiff - 80) / 32) * 0.14);
    }
  }

  // 3. Water Availability [0.0, 1.0]
  // Liquid water depends on hydrosphere and non-frozen fraction
  const liquidFraction = Math.max(0.0, hydrosphere * (1.0 - iceCoverage * 0.85));
  let waterAvailability = 0.0;
  if (liquidFraction > 0.01) {
    if (liquidFraction >= 0.15 && liquidFraction <= 0.85) {
      waterAvailability = 0.85 + 0.15 * Math.sin(((liquidFraction - 0.15) / 0.7) * Math.PI);
    } else if (liquidFraction < 0.15) {
      waterAvailability = (liquidFraction / 0.15) * 0.85;
    } else {
      waterAvailability = 0.85 - ((liquidFraction - 0.85) / 0.15) * 0.1; // Vast global ocean slightly limits terrestrial mineral runoff
    }
  }

  // 4. Atmospheric Suitability [0.0, 1.0]
  let atmosphericSuitability = 0.0;
  if (surfacePressure > 0.05) {
    let pressureScore = 0.0;
    if (surfacePressure >= 0.5 && surfacePressure <= 2.5) {
      pressureScore = 1.0;
    } else if (surfacePressure < 0.5) {
      pressureScore = Math.max(0.05, surfacePressure / 0.5);
    } else if (surfacePressure <= 10.0) {
      pressureScore = Math.max(0.1, 1.0 - ((surfacePressure - 2.5) / 7.5) * 0.7);
    } else {
      pressureScore = Math.max(0.01, 0.3 - Math.min(0.29, (surfacePressure - 10.0) * 0.01));
    }

    // Beneficial volatile presence: N2, CO2, H2O, O2, CH4
    const atm = planet.atmosphere;
    let compositionScore = 0.3; // baseline for having any atmosphere
    if (atm.nitrogen > 0.1) compositionScore += 0.25;
    if (atm.carbonDioxide > 0.001 || atm.methane > 0.001) compositionScore += 0.2;
    if (atm.waterVapor > 0.001) compositionScore += 0.15;
    if (atm.oxygen > 0.05) compositionScore += 0.1;

    atmosphericSuitability = pressureScore * Math.min(1.0, compositionScore);
  }

  // 5. Energy Availability [0.0, 1.0]
  // Based on incident solar flux and stellar spectrum
  const incidentFlux = temporalState?.incidentFluxSolar ?? 1.0;
  let energyAvailability = 0.0;
  if (incidentFlux >= 0.2 && incidentFlux <= 3.0) {
    const fluxDiff = Math.abs(incidentFlux - 1.0);
    energyAvailability = Math.max(0.2, 1.0 - fluxDiff * 0.45);
  } else if (incidentFlux > 0.01) {
    energyAvailability = Math.max(0.05, 0.3 / (1.0 + Math.abs(incidentFlux - 1.0)));
  }

  // 6. Environmental Stability [0.0, 1.0]
  // Stable circular orbit, stable host star, within HZ
  let stability = 0.9;
  if (!isStarStable) stability *= 0.3;
  if (!inHZ) stability *= 0.4;
  stability *= Math.max(0.2, 1.0 - planet.eccentricity * 1.5);
  if (planet.surfaceGravityG < 0.2 || planet.surfaceGravityG > 3.0) stability *= 0.6;
  const environmentalStability = Math.min(1.0, Math.max(0.0, stability));

  // Composite Habitability Score
  const rawScore =
    planetClassModifier *
    (temperatureSuitability * 0.3 +
      waterAvailability * 0.25 +
      atmosphericSuitability * 0.2 +
      energyAvailability * 0.15 +
      environmentalStability * 0.1);

  const score = Number(Math.max(0.0, Math.min(1.0, rawScore)).toFixed(4));

  // Determine Categorical Rating
  let overall: HabitabilityRating = 'NONE';
  if (score >= 0.65) {
    overall = 'FAVORABLE';
  } else if (score >= 0.4) {
    overall = 'POSSIBLE';
  } else if (score >= 0.18) {
    overall = 'MARGINAL';
  } else {
    overall = 'NONE';
  }

  const isTemperate = effectiveTemp >= 265 && effectiveTemp <= 345;
  const hasLiquidWater = liquidFraction >= 0.05;
  const hasAtmosphere = surfacePressure >= 0.15 && surfacePressure <= 6.0;

  let summaryText = 'Environment is hostile to organic synthesis.';
  if (overall === 'FAVORABLE') {
    summaryText = 'Temperate climate, rich hydrosphere, and stable atmosphere ideal for complex life.';
  } else if (overall === 'POSSIBLE') {
    summaryText = 'Viable conditions capable of sustaining active prebiotic or microbial ecosystems.';
  } else if (overall === 'MARGINAL') {
    summaryText = 'Extreme conditions requiring specialized extremophile biological strategies.';
  }

  return {
    overall,
    score,
    temperatureSuitability: Number(temperatureSuitability.toFixed(3)),
    waterAvailability: Number(waterAvailability.toFixed(3)),
    atmosphericSuitability: Number(atmosphericSuitability.toFixed(3)),
    energyAvailability: Number(energyAvailability.toFixed(3)),
    environmentalStability: Number(environmentalStability.toFixed(3)),
    factors: {
      isTemperate,
      hasLiquidWater,
      hasAtmosphere,
      isStarStable,
      summaryText,
    },
  };
}
