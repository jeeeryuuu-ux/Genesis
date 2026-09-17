/**
 * @license Apache-2.0
 * GENESIS PLANET GENERATOR
 *
 * Procedurally generates planets with physically correlated orbital dynamics,
 * atmospheric compositions, temperature profiles, and biosphere eligibility.
 */

import { derivePlanetSeed } from '../../core/hierarchy.js';
import { createPRNG } from '../../core/prng.js';
import type {
  AtmosphereComposition,
  EntityId,
  Moon,
  Planet,
  PlanetType,
  Seed,
} from '../../core/types.js';
import { generateMoon } from './moon.js';
import { generatePlanetName } from './naming.js';

/**
 * Validates a generated Planet entity against physical and simulation constraints.
 */
export function validatePlanet(planet: Planet): void {
  if (!planet.id || !planet.name) {
    throw new Error('[validatePlanet] Planet must have valid ID and name');
  }
  if (!Number.isFinite(planet.semiMajorAxisAU) || planet.semiMajorAxisAU <= 0) {
    throw new Error(`[validatePlanet] Semi-major axis must be positive: ${planet.semiMajorAxisAU}`);
  }
  if (!Number.isFinite(planet.orbitalPeriodDays) || planet.orbitalPeriodDays <= 0) {
    throw new Error(`[validatePlanet] Orbital period must be positive: ${planet.orbitalPeriodDays}`);
  }
  if (!Number.isFinite(planet.eccentricity) || planet.eccentricity < 0 || planet.eccentricity >= 1) {
    throw new Error(`[validatePlanet] Eccentricity out of [0, 1): ${planet.eccentricity}`);
  }
  if (!Number.isFinite(planet.radiusKm) || planet.radiusKm <= 0) {
    throw new Error(`[validatePlanet] Radius must be positive: ${planet.radiusKm}`);
  }
  if (!Number.isFinite(planet.massEarth) || planet.massEarth <= 0) {
    throw new Error(`[validatePlanet] Mass must be positive: ${planet.massEarth}`);
  }
  if (!Number.isFinite(planet.surfaceGravityG) || planet.surfaceGravityG <= 0) {
    throw new Error(`[validatePlanet] Surface gravity must be positive: ${planet.surfaceGravityG}`);
  }
  if (!Number.isFinite(planet.averageTempKelvin) || planet.averageTempKelvin <= 0) {
    throw new Error(`[validatePlanet] Temperature must be positive: ${planet.averageTempKelvin}`);
  }
  if (
    !Number.isFinite(planet.hydrosphereCoverage) ||
    planet.hydrosphereCoverage < 0 ||
    planet.hydrosphereCoverage > 1
  ) {
    throw new Error(`[validatePlanet] Hydrosphere must be in [0, 1]: ${planet.hydrosphereCoverage}`);
  }

  // Validate atmosphere
  const atm = planet.atmosphere;
  const fractions = [
    atm.nitrogen,
    atm.oxygen,
    atm.carbonDioxide,
    atm.argon,
    atm.methane,
    atm.waterVapor,
    atm.hydrogenHelium,
  ];
  for (const f of fractions) {
    if (!Number.isFinite(f) || f < 0) {
      throw new Error(`[validatePlanet] Invalid atmospheric fraction: ${f}`);
    }
  }
  if (!Number.isFinite(atm.surfacePressureAtm) || atm.surfacePressureAtm < 0) {
    throw new Error(`[validatePlanet] Invalid surface pressure: ${atm.surfacePressureAtm}`);
  }
}

/**
 * Calculates planetary equilibrium surface temperature in Kelvin.
 * Considers distance from star, stellar luminosity, approximate albedo,
 * and atmospheric greenhouse retention.
 */
function calculatePlanetTemperature(
  semiMajorAxisAU: number,
  luminositySolar: number,
  planetType: PlanetType,
  prng: ReturnType<typeof createPRNG>
): number {
  // Approximate blackbody equilibrium temp: T_eq = 278 * (L / d²)^0.25
  const effectiveLum = Math.max(1e-5, luminositySolar);
  const rawEquilibrium = 278 * Math.pow(effectiveLum / Math.pow(semiMajorAxisAU, 2), 0.25);

  let greenhouseFactor = 1.0;
  switch (planetType) {
    case 'LAVA':
      greenhouseFactor = prng.nextFloat(1.4, 2.2);
      break;
    case 'OCEAN':
      greenhouseFactor = prng.nextFloat(1.15, 1.35); // Water vapor feedback
      break;
    case 'TERRESTRIAL':
      greenhouseFactor = prng.nextFloat(1.05, 1.25); // Moderate atmosphere
      break;
    case 'DESERT':
      greenhouseFactor = prng.nextFloat(1.0, 1.15);
      break;
    case 'GAS_GIANT':
    case 'ICE_GIANT':
      greenhouseFactor = 1.0; // Core heat balanced with cloud reflectivity
      break;
    case 'BARREN':
      greenhouseFactor = 1.0; // Negligible atmosphere
      break;
  }

  const finalTemp = Math.round(rawEquilibrium * greenhouseFactor);
  return Math.max(15, finalTemp);
}

/**
 * Procedurally generates atmosphere composition tailored to planet type and temperature.
 */
function generateAtmosphere(
  planetType: PlanetType,
  temperatureK: number,
  massEarth: number,
  prng: ReturnType<typeof createPRNG>
): AtmosphereComposition {
  if (planetType === 'BARREN' || massEarth < 0.15) {
    return {
      nitrogen: 0,
      oxygen: 0,
      carbonDioxide: 0,
      argon: 0,
      methane: 0,
      waterVapor: 0,
      hydrogenHelium: 0,
      surfacePressureAtm: 0.0001,
    };
  }

  if (planetType === 'GAS_GIANT' || planetType === 'ICE_GIANT') {
    return {
      nitrogen: 0.01,
      oxygen: 0.0,
      carbonDioxide: 0.0,
      argon: 0.0,
      methane: planetType === 'ICE_GIANT' ? 0.05 : 0.01,
      waterVapor: 0.01,
      hydrogenHelium: planetType === 'ICE_GIANT' ? 0.93 : 0.98,
      surfacePressureAtm: planetType === 'GAS_GIANT' ? 1000 : 250,
    };
  }

  if (planetType === 'LAVA') {
    return {
      nitrogen: 0.05,
      oxygen: 0.0,
      carbonDioxide: 0.85,
      argon: 0.05,
      methane: 0.0,
      waterVapor: 0.05,
      hydrogenHelium: 0.0,
      surfacePressureAtm: Number(prng.nextFloat(10, 90).toFixed(1)),
    };
  }

  // Terrestrial / Ocean / Desert atmospheres
  let oxygen = 0;
  let nitrogen = 0.78;
  let carbonDioxide = 0.01;
  let argon = 0.01;
  let waterVapor = 0.01;
  let methane = 0.001;

  if (planetType === 'OCEAN') {
    nitrogen = prng.nextFloat(0.65, 0.80);
    oxygen = temperatureK >= 250 && temperatureK <= 330 ? prng.nextFloat(0.15, 0.25) : 0.01;
    waterVapor = prng.nextFloat(0.04, 0.12);
    carbonDioxide = prng.nextFloat(0.01, 0.05);
  } else if (planetType === 'TERRESTRIAL') {
    nitrogen = prng.nextFloat(0.70, 0.85);
    oxygen = temperatureK >= 240 && temperatureK <= 340 ? prng.nextFloat(0.12, 0.24) : 0.01;
    carbonDioxide = prng.nextFloat(0.01, 0.06);
    waterVapor = prng.nextFloat(0.01, 0.04);
  } else if (planetType === 'DESERT') {
    nitrogen = prng.nextFloat(0.80, 0.92);
    oxygen = prng.nextFloat(0.02, 0.12);
    carbonDioxide = prng.nextFloat(0.04, 0.10);
    waterVapor = 0.001;
  }

  // Normalize fractions to sum to 1.0
  const total = nitrogen + oxygen + carbonDioxide + argon + methane + waterVapor;
  const surfacePressureAtm = Number(prng.nextFloat(0.4, 2.8).toFixed(2));

  return {
    nitrogen: Number((nitrogen / total).toFixed(3)),
    oxygen: Number((oxygen / total).toFixed(3)),
    carbonDioxide: Number((carbonDioxide / total).toFixed(3)),
    argon: Number((argon / total).toFixed(3)),
    methane: Number((methane / total).toFixed(4)),
    waterVapor: Number((waterVapor / total).toFixed(3)),
    hydrogenHelium: 0.0,
    surfacePressureAtm,
  };
}

/**
 * Determines whether a planet meets fundamental requirements for organic biospheres.
 */
function evaluateBiosphereEligibility(
  planetType: PlanetType,
  temperatureK: number,
  hydrosphereCoverage: number,
  atmosphere: AtmosphereComposition
): boolean {
  // Biosphere requires temperate conditions: 240 K to 340 K (-33°C to +67°C)
  if (temperatureK < 240 || temperatureK > 340) return false;

  // Requires liquid solvent coverage
  if (hydrosphereCoverage < 0.05) return false;

  // Requires non-crushing and non-vacuum atmospheric pressure
  if (atmosphere.surfacePressureAtm < 0.15 || atmosphere.surfacePressureAtm > 8.0) return false;

  // Only solid-surface terrestrial, ocean, or desert worlds support organic surfaces
  if (planetType !== 'TERRESTRIAL' && planetType !== 'OCEAN' && planetType !== 'DESERT') return false;

  return true;
}

/**
 * Procedurally generates an individual Planet from a system seed and orbital slot index.
 *
 * @param systemSeed 32-bit seed of parent star system
 * @param planetIndex 0-based index of the planet's orbit
 * @param systemId Optional parent system entity ID
 * @param systemName Optional parent system name
 * @param primaryStarLuminositySolar Optional stellar luminosity (defaults to 1.0 Sol)
 * @param primaryStarMassSolar Optional stellar mass (defaults to 1.0 Sol)
 * @param materializeMoons Whether to recursively instantiate moon objects (defaults to false for lazy performance)
 */
export function generatePlanet(
  systemSeed: Seed,
  planetIndex: number,
  systemId: EntityId = `s${systemSeed}`,
  systemName: string = `System-${systemSeed.toString(16).slice(-4)}`,
  primaryStarLuminositySolar: number = 1.0,
  primaryStarMassSolar: number = 1.0,
  materializeMoons: boolean = false
): Planet {
  if (planetIndex < 0 || !Number.isInteger(planetIndex)) {
    throw new Error(`[generatePlanet] planetIndex must be a non-negative integer: ${planetIndex}`);
  }

  const planetSeed = derivePlanetSeed(systemSeed, planetIndex);
  const prng = createPRNG(planetSeed);

  const id: EntityId = `${systemId}/p${planetIndex}`;
  const name = generatePlanetName(systemName, planetIndex);

  // Progressive orbital distance (Modified Titius-Bode logarithmic progression)
  // Ensures orderly outward progression: slot 0 is innermost, slot N is outermost
  const baseDistanceAU = 0.25 + prng.nextFloat(0.05, 0.15);
  const orbitalSpacingRatio = 1.45 + prng.nextFloat(0.05, 0.25);
  const semiMajorAxisAU = Number((baseDistanceAU * Math.pow(orbitalSpacingRatio, planetIndex)).toFixed(3));

  // Orbital Eccentricity (concentrated between 0.005 and 0.22)
  const eccentricity = Number((prng.next() * prng.next() * 0.22 + 0.005).toFixed(3));

  // Kepler's Third Law: P² = a³ / M_star (P in Earth years)
  // P_days = sqrt(a³ / M_star) * 365.25
  const massStar = Math.max(0.05, primaryStarMassSolar);
  const periodYears = Math.sqrt(Math.pow(semiMajorAxisAU, 3) / massStar);
  const orbitalPeriodDays = Number((periodYears * 365.25).toFixed(1));

  // Classification by orbital zone and stellar flux
  let type: PlanetType;
  if (semiMajorAxisAU < 0.45 && primaryStarLuminositySolar > 0.6) {
    // Scorching inner zone
    type = prng.chance(0.65) ? 'LAVA' : 'BARREN';
  } else if (semiMajorAxisAU > 4.5) {
    // Frigid outer zone
    type = prng.chance(0.55) ? 'GAS_GIANT' : (prng.chance(0.65) ? 'ICE_GIANT' : 'BARREN');
  } else {
    // Intermediate temperate / sub-temperate zone
    const roll = prng.next();
    if (roll < 0.35) {
      type = 'TERRESTRIAL';
    } else if (roll < 0.60) {
      type = 'OCEAN';
    } else if (roll < 0.80) {
      type = 'DESERT';
    } else {
      type = prng.chance(0.5) ? 'GAS_GIANT' : 'BARREN';
    }
  }

  // Physical properties (Mass and Radius derived from planet type)
  let massEarth: number;
  let radiusKm: number;
  let hydrosphereCoverage: number;

  switch (type) {
    case 'GAS_GIANT':
      massEarth = Math.round(prng.nextFloat(60, 2500));
      radiusKm = Math.round(prng.nextFloat(48_000, 85_000));
      hydrosphereCoverage = 0;
      break;
    case 'ICE_GIANT':
      massEarth = Number(prng.nextFloat(10, 45).toFixed(1));
      radiusKm = Math.round(prng.nextFloat(22_000, 36_000));
      hydrosphereCoverage = 0;
      break;
    case 'OCEAN':
      massEarth = Number(prng.nextFloat(0.8, 3.5).toFixed(2));
      radiusKm = Math.round(Math.pow(massEarth, 0.27) * 6371 * prng.nextFloat(0.98, 1.08));
      hydrosphereCoverage = Number(prng.nextFloat(0.72, 0.99).toFixed(2));
      break;
    case 'TERRESTRIAL':
      massEarth = Number(prng.nextFloat(0.4, 2.5).toFixed(2));
      radiusKm = Math.round(Math.pow(massEarth, 0.27) * 6371 * prng.nextFloat(0.95, 1.05));
      hydrosphereCoverage = Number(prng.nextFloat(0.25, 0.70).toFixed(2));
      break;
    case 'DESERT':
      massEarth = Number(prng.nextFloat(0.3, 1.8).toFixed(2));
      radiusKm = Math.round(Math.pow(massEarth, 0.27) * 6371 * prng.nextFloat(0.92, 1.02));
      hydrosphereCoverage = Number(prng.nextFloat(0.01, 0.12).toFixed(2));
      break;
    case 'LAVA':
      massEarth = Number(prng.nextFloat(0.3, 3.0).toFixed(2));
      radiusKm = Math.round(Math.pow(massEarth, 0.27) * 6371 * prng.nextFloat(0.95, 1.05));
      hydrosphereCoverage = 0; // Molten rock, zero liquid water
      break;
    case 'BARREN':
      massEarth = Number(prng.nextFloat(0.05, 1.5).toFixed(2));
      radiusKm = Math.round(Math.pow(massEarth, 0.27) * 6371 * prng.nextFloat(0.85, 1.05));
      hydrosphereCoverage = prng.chance(0.2) ? Number(prng.nextFloat(0.01, 0.08).toFixed(2)) : 0;
      break;
  }

  // Surface gravity (Earth g = M / R²)
  const radiusEarthUnits = radiusKm / 6371;
  const surfaceGravityG = Number((massEarth / Math.pow(radiusEarthUnits, 2)).toFixed(2));

  // Temperature and Atmosphere
  const averageTempKelvin = calculatePlanetTemperature(
    semiMajorAxisAU,
    primaryStarLuminositySolar,
    type,
    prng
  );

  const atmosphere = generateAtmosphere(type, averageTempKelvin, massEarth, prng);

  // Biosphere Eligibility
  const hasBiosphere = evaluateBiosphereEligibility(
    type,
    averageTempKelvin,
    hydrosphereCoverage,
    atmosphere
  );

  // Moon count based on planet type (gas giants have many, small rocky planets have few)
  let moonCount = 0;
  if (type === 'GAS_GIANT') {
    moonCount = prng.nextInt(3, 12);
  } else if (type === 'ICE_GIANT') {
    moonCount = prng.nextInt(1, 8);
  } else if (massEarth > 0.4 && type !== 'LAVA') {
    moonCount = prng.pick([0, 0, 1, 1, 2]);
  }

  // Lazily materialize moons only if requested
  const moons: Moon[] = [];
  if (materializeMoons && moonCount > 0) {
    for (let m = 0; m < moonCount; m++) {
      moons.push(generateMoon(planetSeed, m, id, name, massEarth));
    }
  }

  const planet: Planet = {
    id,
    seed: planetSeed,
    systemId,
    name,
    type,
    semiMajorAxisAU,
    orbitalPeriodDays,
    eccentricity,
    radiusKm,
    massEarth,
    surfaceGravityG,
    averageTempKelvin,
    atmosphere,
    hydrosphereCoverage,
    hasBiosphere,
    moonCount,
    moons,
  };

  validatePlanet(planet);
  return planet;
}
