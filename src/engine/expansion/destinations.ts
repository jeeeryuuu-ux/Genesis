/**
 * @license Apache-2.0
 * GENESIS DESTINATION ANALYSIS & TERRAFORMING FOUNDATION (PHASE 8)
 *
 * Deterministically evaluates celestial bodies across a star system for colonization viability,
 * resource extraction potential, environmental hazards, and terraforming feasibility.
 */

import type { Moon, Planet, StarSystem } from '../../core/types.js';
import type {
  DestinationAnalysis,
  DestinationClassification,
  SpacefaringProfile,
  TerraformingProfile,
} from './types.js';

/**
 * Evaluates terraforming potential for a solid celestial body.
 */
export function evaluateTerraformingPotential(
  planet: Planet | { type: string; massEarth: number; surfaceGravityG: number; averageTempKelvin: number; atmosphere: { surfacePressureAtm: number } }
): TerraformingProfile {
  // Gas and Ice giants cannot be terraformed into surface biospheres
  if (planet.type === 'GAS_GIANT' || planet.type === 'ICE_GIANT' || planet.type === 'LAVA') {
    return {
      atmosphericModification: 0,
      thermalModification: 0,
      hydrologicalModification: 0,
      biosphereCompatibility: 0,
      energyRequirement: 1e6,
      estimatedDifficulty: 1.0,
      feasibility: 0.0,
    };
  }

  // Thermal deviation from temperate biological equilibrium (288 K)
  const tempDelta = Math.abs(planet.averageTempKelvin - 288);
  const thermalMod = Math.max(0, 1.0 - tempDelta / 200);

  // Atmospheric pressure gap vs 1.0 atm
  const pressDelta = Math.abs(planet.atmosphere.surfacePressureAtm - 1.0);
  const atmoMod = Math.max(0, 1.0 - pressDelta / 15);

  // Gravity tolerance: Earth-like gravity [0.4g, 1.4g] is required to retain an atmosphere long-term
  const gravTolerance =
    planet.surfaceGravityG >= 0.35 && planet.surfaceGravityG <= 1.5
      ? 1.0 - Math.abs(planet.surfaceGravityG - 1.0) * 0.5
      : Math.max(0, 1.0 - Math.abs(planet.surfaceGravityG - 1.0));

  // Hydrological availability
  const hydroCoverage = 'hydrosphereCoverage' in planet ? planet.hydrosphereCoverage : 0;
  const hydroMod = Math.min(1.0, hydroCoverage + (planet.averageTempKelvin < 273 ? 0.4 : 0.1));

  // Biosphere compatibility
  const bioCompat = Math.max(0, Math.min(1.0, thermalMod * 0.35 + atmoMod * 0.35 + gravTolerance * 0.3));

  // Normalized planetary engineering energy scale
  const energyRequirement = Math.round(
    (tempDelta * 10 + pressDelta * 50 + (1.0 - gravTolerance) * 200) * (planet.massEarth || 0.1)
  );

  const difficulty = Math.max(
    0.05,
    Math.min(1.0, (1.0 - bioCompat) * 0.7 + (planet.massEarth > 2.0 ? 0.3 : 0.1))
  );

  const feasibility = Math.max(
    0,
    Math.min(1.0, gravTolerance > 0.3 ? (1.0 - difficulty) * bioCompat : 0.0)
  );

  return {
    atmosphericModification: atmoMod,
    thermalModification: thermalMod,
    hydrologicalModification: hydroMod,
    biosphereCompatibility: bioCompat,
    energyRequirement,
    estimatedDifficulty: difficulty,
    feasibility,
  };
}

/**
 * Analyzes a planet within the star system as a potential expansion destination.
 */
export function analyzePlanetDestination(
  candidatePlanet: Planet,
  homeworld: Planet,
  primaryStarLuminosity: number = 1.0
): DestinationAnalysis {
  const isHomeworld = candidatePlanet.id === homeworld.id;

  // 1. Classification
  let classification: DestinationClassification;
  if (isHomeworld) {
    classification = 'HOMEWORLD';
  } else if (candidatePlanet.type === 'GAS_GIANT' || candidatePlanet.type === 'ICE_GIANT') {
    classification = 'GAS_GIANT_RESOURCE_ZONE';
  } else if (candidatePlanet.type === 'TERRESTRIAL' || candidatePlanet.type === 'OCEAN') {
    classification = 'TERRESTRIAL_WORLD';
  } else if (candidatePlanet.type === 'DESERT') {
    classification = 'TERRESTRIAL_WORLD';
  } else if (candidatePlanet.type === 'LAVA') {
    classification = 'UNVIABLE';
  } else {
    // BARREN
    classification = candidatePlanet.radiusKm < 3000 ? 'DWARF_WORLD' : 'RESOURCE_BODY';
  }

  // 2. Orbital Distance & Energy Requirements
  const distanceAU = isHomeworld
    ? 0
    : Math.abs(candidatePlanet.semiMajorAxisAU - homeworld.semiMajorAxisAU);

  // Delta-V metric includes interplanetary transfer distance and destination gravity capture
  const travelEnergyRequirement = isHomeworld
    ? 0
    : Math.round(distanceAU * 12 + candidatePlanet.surfaceGravityG * 8);

  // 3. Environmental Parameters & Resources
  const surfaceGravityG = candidatePlanet.surfaceGravityG;
  const surfaceTempKelvin = candidatePlanet.averageTempKelvin;
  const atmospherePressureAtm = candidatePlanet.atmosphere.surfacePressureAtm;

  // Water availability
  const waterAvailability = isHomeworld
    ? candidatePlanet.hydrosphereCoverage
    : candidatePlanet.type === 'OCEAN'
    ? 1.0
    : candidatePlanet.type === 'TERRESTRIAL'
    ? candidatePlanet.hydrosphereCoverage
    : candidatePlanet.averageTempKelvin < 240
    ? 0.45 // Subsurface ice / glaciers
    : 0.05;

  // Minerals: Barren and terrestrial bodies are rich in accessible ores
  const mineralAvailability =
    candidatePlanet.type === 'GAS_GIANT' || candidatePlanet.type === 'ICE_GIANT'
      ? 0.2 // Atmosphere harvesting only
      : candidatePlanet.type === 'BARREN' || candidatePlanet.type === 'DESERT'
      ? 0.85
      : 0.7;

  // Solar energy flux decreases with inverse-square law
  const safeSemiMajor = Math.max(0.1, candidatePlanet.semiMajorAxisAU);
  const solarFlux = primaryStarLuminosity / (safeSemiMajor * safeSemiMajor);
  const energyAvailability = Math.min(1.0, solarFlux * 0.7 + (candidatePlanet.type === 'LAVA' ? 0.3 : 0));

  // Environmental Hazard Level
  let hazardLevel = 0.1;
  if (candidatePlanet.type === 'LAVA') {
    hazardLevel = 0.95;
  } else if (candidatePlanet.type === 'GAS_GIANT') {
    hazardLevel = 0.85; // Extreme radiation belts & atmospheric shears
  } else {
    const tempHazard = Math.min(1.0, Math.abs(surfaceTempKelvin - 288) / 300);
    const pressureHazard = atmospherePressureAtm > 10 ? 0.7 : atmospherePressureAtm < 0.01 ? 0.3 : 0.1;
    const radiationHazard = atmospherePressureAtm < 0.1 ? 0.4 : 0.05;
    hazardLevel = Math.min(1.0, Math.max(0.05, tempHazard * 0.4 + pressureHazard * 0.3 + radiationHazard * 0.3));
  }

  // 4. Viability Score
  let viability = 0;
  if (isHomeworld) {
    viability = 1.0;
  } else if (classification === 'UNVIABLE') {
    viability = 0.02;
  } else if (classification === 'GAS_GIANT_RESOURCE_ZONE') {
    viability = 0.25; // Good for orbital helium-3/hydrogen, poor for surface
  } else {
    // Distance penalty (farther = harder to sustain)
    const distanceScore = Math.max(0.1, 1.0 - Math.min(1.0, distanceAU / 20));
    // Gravity penalty (extreme low or extreme high)
    const gravityScore =
      surfaceGravityG >= 0.2 && surfaceGravityG <= 1.4
        ? 1.0 - Math.abs(surfaceGravityG - 1.0) * 0.4
        : Math.max(0.1, 1.0 - Math.abs(surfaceGravityG - 1.0) * 0.7);
    // Habitability factor
    const habitatFactor = (1.0 - hazardLevel) * 0.5 + waterAvailability * 0.25 + mineralAvailability * 0.25;

    viability = Math.max(
      0.05,
      Math.min(0.98, distanceScore * 0.35 + gravityScore * 0.25 + habitatFactor * 0.4)
    );
  }

  const terraforming = evaluateTerraformingPotential(candidatePlanet);

  return {
    bodyId: candidatePlanet.id,
    name: candidatePlanet.name,
    classification,
    distanceAU,
    surfaceGravityG,
    surfaceTempKelvin,
    atmospherePressureAtm,
    waterAvailability,
    mineralAvailability,
    energyAvailability,
    hazardLevel,
    travelEnergyRequirement,
    viability,
    terraforming,
    isColonized: false,
  };
}

/**
 * Analyzes a natural satellite (moon) as a potential expansion destination.
 */
export function analyzeMoonDestination(
  moon: Moon,
  parentPlanet: Planet,
  homeworld: Planet,
  primaryStarLuminosity: number = 1.0
): DestinationAnalysis {
  const isHomeworldMoon = parentPlanet.id === homeworld.id;

  // Approximate distance in AU
  const distanceAU = isHomeworldMoon
    ? moon.orbitalDistanceKm / 149_597_870
    : Math.abs(parentPlanet.semiMajorAxisAU - homeworld.semiMajorAxisAU);

  // Surface gravity approx from radius (density ~ 3 g/cm^3)
  const surfaceGravityG = Math.max(0.01, (moon.radiusKm / 6371) * 0.4);

  // Equilibrium temperature derived from distance to primary star
  const safeSemiMajor = Math.max(0.1, parentPlanet.semiMajorAxisAU);
  const surfaceTempKelvin = Math.round(278 * Math.pow(primaryStarLuminosity, 0.25) / Math.sqrt(safeSemiMajor));

  // Moon classification
  const isIceMoon = surfaceTempKelvin < 180 && moon.radiusKm > 800;
  const classification: DestinationClassification = isIceMoon ? 'ICE_WORLD' : 'MOON';

  // Moon resources
  const waterAvailability = isIceMoon ? 0.8 : 0.05;
  const mineralAvailability = 0.75;
  const solarFlux = primaryStarLuminosity / (safeSemiMajor * safeSemiMajor);
  const energyAvailability = Math.min(1.0, solarFlux * 0.6);

  // Hazards: vacuum, thermal swings, low gravity
  const hazardLevel = isHomeworldMoon ? 0.35 : 0.55;

  // Travel energy: moons of the homeworld are much easier to reach than other planets
  const travelEnergyRequirement = isHomeworldMoon
    ? 4
    : Math.round(distanceAU * 12 + parentPlanet.surfaceGravityG * 4);

  // Viability
  const distanceScore = isHomeworldMoon ? 0.95 : Math.max(0.1, 1.0 - Math.min(1.0, distanceAU / 20));
  const viability = Math.max(
    0.1,
    Math.min(0.85, distanceScore * 0.5 + (1.0 - hazardLevel) * 0.3 + mineralAvailability * 0.2)
  );

  const terraforming = evaluateTerraformingPotential({
    type: 'BARREN',
    massEarth: Math.pow(moon.radiusKm / 6371, 3) * 0.5,
    surfaceGravityG,
    averageTempKelvin: surfaceTempKelvin,
    atmosphere: { surfacePressureAtm: 0.00001 },
  });

  return {
    bodyId: moon.id,
    name: moon.name,
    parentPlanetId: parentPlanet.id,
    classification,
    distanceAU,
    surfaceGravityG,
    surfaceTempKelvin,
    atmospherePressureAtm: 0.00001,
    waterAvailability,
    mineralAvailability,
    energyAvailability,
    hazardLevel,
    travelEnergyRequirement,
    viability,
    terraforming,
    isColonized: false,
  };
}

/**
 * Scans all celestial bodies in the star system and produces sorted destination evaluations.
 */
export function evaluateSystemDestinations(
  homeworld: Planet,
  allPlanets: readonly Planet[],
  primaryStarLuminosity: number = 1.0
): readonly DestinationAnalysis[] {
  const results: DestinationAnalysis[] = [];

  // Homeworld is primary baseline
  results.push(analyzePlanetDestination(homeworld, homeworld, primaryStarLuminosity));

  // 1. Homeworld moons
  for (const moon of homeworld.moons) {
    results.push(analyzeMoonDestination(moon, homeworld, homeworld, primaryStarLuminosity));
  }

  // 2. Other planets and their moons
  for (const planet of allPlanets) {
    if (planet.id === homeworld.id) continue;

    results.push(analyzePlanetDestination(planet, homeworld, primaryStarLuminosity));

    // Analyze first 2 major moons per other planet to avoid runaway iteration
    const moonsToAnalyze = planet.moons.slice(0, 2);
    for (const moon of moonsToAnalyze) {
      results.push(analyzeMoonDestination(moon, planet, homeworld, primaryStarLuminosity));
    }
  }

  // Sort by viability descending, with homeworld first
  return results.sort((a, b) => {
    if (a.classification === 'HOMEWORLD') return -1;
    if (b.classification === 'HOMEWORLD') return 1;
    return b.viability - a.viability;
  });
}
