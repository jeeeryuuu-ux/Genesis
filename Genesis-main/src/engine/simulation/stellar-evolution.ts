/**
 * @license Apache-2.0
 * GENESIS STELLAR EVOLUTION MODEL
 *
 * Deterministic, physically-inspired astrophysical evolution engine.
 * Computes age, evolutionary stage, luminosity, radius, temperature,
 * and current habitable zones analytically from baseline star properties
 * and simulation epoch.
 */

import { createPRNG } from '../../core/prng.js';
import type {
  HabitableZoneAU,
  SpectralClass,
  Star,
  Year,
} from '../../core/types.js';
import type { StellarEvolutionStage, StellarTemporalState } from './types.js';

/**
 * Calculates the deterministic formation year for a star based on the universe age
 * and the star's unique seed.
 */
export function calculateStarFormationYear(star: Star, universeAgeYears: Year): Year {
  const prng = createPRNG(star.seed ^ 0x5a5a5a5a);
  // Stars form across cosmic history between 500 million years after the Big Bang
  // and up to 85% of the current cosmic epoch.
  const minFormation = Math.min(5e8, universeAgeYears * 0.05);
  const maxFormation = universeAgeYears * 0.85;
  return Math.round(prng.nextFloat(minFormation, maxFormation));
}

/**
 * Estimates main sequence stellar lifetime based on mass-luminosity stellar physics:
 * T_ms ≈ 10^10 * (M / M_sun)^(-2.5) years.
 *
 * Scaled and bounded to avoid astronomical overflow/underflow.
 */
export function calculateMainSequenceLifetimeYears(massSolar: number): number {
  if (massSolar <= 0) return 1e10;

  // Mass exponent: ~2.5 for intermediate stars, shallower for very low/high masses
  let exponent = 2.5;
  if (massSolar > 10) exponent = 2.2;
  else if (massSolar < 0.43) exponent = 2.8;

  const lifetime = 1e10 * Math.pow(massSolar, -exponent);

  // Clamp within physical bounds:
  // Massive O-stars live min ~3 million years.
  // M-dwarf stars live max ~500 billion years.
  return Math.max(3e6, Math.min(5e11, lifetime));
}

/**
 * Derives the evolutionary stage based on stellar mass and elapsed stellar age.
 */
export function deriveStellarEvolutionStage(
  massSolar: number,
  ageYears: number,
  lifetimeYears: number
): StellarEvolutionStage {
  // If star hasn't exhausted core hydrogen on the main sequence
  if (ageYears < lifetimeYears) {
    return 'MAIN_SEQUENCE';
  }

  const excessAge = ageYears - lifetimeYears;

  // Low mass red dwarfs (< 0.5 M_sun) do not experience dramatic red giant phase
  // They slowly contract into white dwarfs over trillions of years
  if (massSolar < 0.5) {
    if (excessAge < lifetimeYears * 0.3) {
      return 'MAIN_SEQUENCE';
    }
    return 'WHITE_DWARF';
  }

  // Intermediate mass stars (0.5 to 8.0 M_sun) like our Sun
  if (massSolar <= 8.0) {
    const subgiantDuration = lifetimeYears * 0.1;
    const redGiantDuration = lifetimeYears * 0.15;

    if (excessAge < subgiantDuration) {
      return 'SUBGIANT';
    }
    if (excessAge < subgiantDuration + redGiantDuration) {
      return 'RED_GIANT';
    }
    return 'WHITE_DWARF';
  }

  // Massive stars (8.0 to 25.0 M_sun)
  if (massSolar <= 25.0) {
    const supergiantDuration = lifetimeYears * 0.06;
    if (excessAge < supergiantDuration) {
      return 'RED_GIANT'; // Supergiant phase
    }
    return 'NEUTRON_STAR';
  }

  // Extremely massive stars (> 25.0 M_sun)
  const supergiantDuration = lifetimeYears * 0.04;
  if (excessAge < supergiantDuration) {
    return 'RED_GIANT'; // Supergiant phase
  }
  return 'BLACK_HOLE';
}

/**
 * Computes the spectral class based on surface temperature and remnant state.
 */
export function deriveSpectralClassFromTemp(
  temperatureKelvin: number,
  stage: StellarEvolutionStage
): SpectralClass {
  if (stage === 'NEUTRON_STAR') return 'NEUTRON';
  if (stage === 'BLACK_HOLE') return 'BLACK_HOLE';

  if (temperatureKelvin >= 30000) return 'O';
  if (temperatureKelvin >= 10000) return 'B';
  if (temperatureKelvin >= 7500) return 'A';
  if (temperatureKelvin >= 6000) return 'F';
  if (temperatureKelvin >= 5200) return 'G';
  if (temperatureKelvin >= 3700) return 'K';
  return 'M';
}

/**
 * Analytically derives current stellar properties given an elapsed age.
 * Does NOT mutate the baseline Star entity.
 */
export function evolveStar(
  baseStar: Star,
  universeAgeYears: Year,
  currentYear: Year
): StellarTemporalState {
  const formationYear = calculateStarFormationYear(baseStar, universeAgeYears);
  const ageYears = Math.max(0, currentYear - formationYear);
  const msLifetime = calculateMainSequenceLifetimeYears(baseStar.massSolar);
  const stage = deriveStellarEvolutionStage(baseStar.massSolar, ageYears, msLifetime);

  let luminositySolar = baseStar.luminositySolar;
  let radiusSolar = baseStar.radiusSolar;
  let surfaceTempKelvin = baseStar.surfaceTempKelvin;

  switch (stage) {
    case 'MAIN_SEQUENCE': {
      // Main sequence luminosity slowly increases by ~30% over its MS lifetime
      const progress = Math.min(1.0, ageYears / msLifetime);
      luminositySolar = baseStar.luminositySolar * (1.0 + 0.3 * progress);
      radiusSolar = baseStar.radiusSolar * (1.0 + 0.1 * progress);
      // Stefan-Boltzmann: L ∝ R^2 * T^4 => T ∝ (L / R^2)^(1/4)
      const tFactor = Math.pow(luminositySolar / (radiusSolar * radiusSolar), 0.25);
      surfaceTempKelvin = Math.round(baseStar.surfaceTempKelvin * tFactor);
      break;
    }

    case 'SUBGIANT': {
      // Expanding and cooling slightly
      luminositySolar = baseStar.luminositySolar * 2.0;
      radiusSolar = baseStar.radiusSolar * 2.5;
      surfaceTempKelvin = Math.round(baseStar.surfaceTempKelvin * 0.85);
      break;
    }

    case 'RED_GIANT': {
      // Massive envelope expansion, luminosity surge, surface cooling
      const expansionFactor = baseStar.massSolar > 8.0 ? 300.0 : 80.0;
      const lumFactor = baseStar.massSolar > 8.0 ? 5000.0 : 400.0;
      luminositySolar = baseStar.luminositySolar * lumFactor;
      radiusSolar = baseStar.radiusSolar * expansionFactor;
      surfaceTempKelvin = 3200; // Classic cool red giant envelope
      break;
    }

    case 'WHITE_DWARF': {
      // Degenerate electron core remnant
      radiusSolar = 0.012; // Earth-sized
      const coolingAge = Math.max(1, ageYears - msLifetime);
      // Cooling curve
      luminositySolar = 0.003 * Math.pow(coolingAge / 1e8, -0.4);
      luminositySolar = Math.max(1e-5, Math.min(0.05, luminositySolar));
      surfaceTempKelvin = Math.max(3800, Math.round(25000 * Math.pow(coolingAge / 1e7, -0.2)));
      break;
    }

    case 'NEUTRON_STAR': {
      // Degenerate neutron core (~10 km radius)
      radiusSolar = 0.000015;
      luminositySolar = 0.0001;
      surfaceTempKelvin = 600000; // X-ray hot surface
      break;
    }

    case 'BLACK_HOLE': {
      // Gravitational singularity, no optical emissions
      radiusSolar = 0.000005 * baseStar.massSolar;
      luminositySolar = 0.0;
      surfaceTempKelvin = 0;
      break;
    }
  }

  const spectralClass = deriveSpectralClassFromTemp(surfaceTempKelvin, stage);

  return {
    entityId: baseStar.id,
    baseStar,
    formationYear,
    ageYears,
    mainSequenceLifetimeYears: msLifetime,
    stage,
    spectralClass,
    luminositySolar: Math.max(0, luminositySolar),
    radiusSolar: Math.max(1e-6, radiusSolar),
    surfaceTempKelvin: Math.max(0, surfaceTempKelvin),
  };
}

/**
 * Computes the dynamic circumstellar habitable zone from current stellar luminosity.
 * Inner boundary: Runaway greenhouse limit ~ 1.1 Solar flux
 * Outer boundary: Maximum greenhouse limit ~ 0.53 Solar flux
 */
export function calculateDynamicHabitableZone(luminositySolar: number): HabitableZoneAU {
  if (luminositySolar <= 0) {
    return { inner: 0, outer: 0 };
  }
  const inner = Math.sqrt(luminositySolar / 1.1);
  const outer = Math.sqrt(luminositySolar / 0.53);
  return {
    inner: Number(inner.toFixed(4)),
    outer: Number(outer.toFixed(4)),
  };
}
