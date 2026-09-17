/**
 * @license Apache-2.0
 * GENESIS PLANETARY RESOURCE CONSUMPTION & EXTRACTION MODEL
 *
 * Deterministically computes planetary resource stocks and industrial stress
 * directly derived from astronomical, geological, and biological states.
 */

import { deriveResourceSeed } from '../../core/hierarchy.js';
import { createPRNG } from '../../core/prng.js';
import type { Planet } from '../../core/types.js';
import type { HabitabilityAssessment } from '../biology/types.js';
import type { ResourceProfile, TechnologyProfile } from './types.js';

/**
 * Evaluates the planetary resource baseline and current civilization depletion stress.
 */
export function evaluatePlanetaryResources(
  planet: Planet,
  habitability: HabitabilityAssessment,
  technology?: TechnologyProfile,
  population: number = 0
): ResourceProfile {
  const seed = deriveResourceSeed(planet.seed);
  const prng = createPRNG(seed);

  // 1. Biological Productivity: photosynthesizing/chemosynthesizing organic turnover
  const bioBase =
    habitability.waterAvailability * 0.45 +
    habitability.temperatureSuitability * 0.35 +
    habitability.energyAvailability * 0.2;
  const biologicalProductivity = Math.max(0.01, Math.min(1.0, bioBase + (prng.next() * 0.1 - 0.05)));

  // 2. Freshwater Availability: surface and groundwater reserves
  const hydrologicFactor = planet.hydrosphereCoverage;
  const tempOptimal = 1.0 - Math.min(1.0, Math.abs(planet.averageTempKelvin - 288) / 60);
  const freshwaterAvailability = Math.max(
    0.0,
    Math.min(1.0, hydrologicFactor * 0.7 + tempOptimal * 0.3 + (prng.next() * 0.1 - 0.05))
  );

  // 3. Mineral Availability: heavy elements, silicates, metallic ores in lithosphere
  // Planets with terrestrial mass and density >= 4000 kg/m3 have rich iron/nickel/silicate cores
  const massFactor = Math.min(1.0, planet.massEarth / 2.5);
  const estimatedDensityRatio = planet.massEarth / Math.max(0.1, Math.pow(planet.radiusKm / 6371, 3));
  const densityFactor = Math.min(1.0, Math.max(0.0, (estimatedDensityRatio - 0.5) / 1.5));
  const mineralAvailability = Math.max(
    0.05,
    Math.min(1.0, densityFactor * 0.6 + massFactor * 0.4 + (prng.next() * 0.1 - 0.05))
  );

  // 4. Energy Availability: solar irradiance + atmospheric wind / geothermal flux
  const solarEnergy = Math.max(0.01, Math.min(1.0, 1.0 / Math.max(0.01, Math.pow(planet.semiMajorAxisAU, 2))));
  const atmosphericPressureWind = Math.min(1.0, planet.atmosphere.surfacePressureAtm / 2.0);
  const energyAvailability = Math.max(
    0.05,
    Math.min(1.0, solarEnergy * 0.65 + atmosphericPressureWind * 0.25 + (prng.next() * 0.1))
  );

  // 5. Fertile Land: non-oceanic, non-glacial surface area in temperate zones
  const landFraction = Math.max(0.0, 1.0 - planet.hydrosphereCoverage);
  const fertileLand = Math.max(
    0.0,
    Math.min(1.0, landFraction * tempOptimal * biologicalProductivity * 1.3)
  );

  // 6. Accessible Raw Materials: minerals scaled by surface gravity accessibility
  // (Extreme gravity makes mining difficult; low gravity causes atmospheric loss)
  const gravityAccessibility =
    planet.surfaceGravityG > 2.5
      ? 0.5
      : planet.surfaceGravityG < 0.2
        ? 0.4
        : 1.0;
  const accessibleRawMaterials = Math.max(
    0.05,
    Math.min(1.0, mineralAvailability * gravityAccessibility * (0.85 + prng.next() * 0.2))
  );

  // 7. Resource Stress: demand imposed by population and industrial tech level
  let resourceStress = 0.0;
  if (population > 0 && technology) {
    const techIndustrialImpact = technology.level * technology.energyTechnology;
    // Normalized consumption scale (10B population at level 0.7 = high stress)
    const popPressure = Math.min(1.0, population / 20_000_000_000);
    const demand = popPressure * 0.5 + techIndustrialImpact * 0.5;
    const supply = (fertileLand * 0.3 + freshwaterAvailability * 0.3 + energyAvailability * 0.4);
    resourceStress = Math.max(0.0, Math.min(1.0, Math.max(0.0, demand - supply * 0.7)));
  }

  return {
    biologicalProductivity: Math.round(biologicalProductivity * 1000) / 1000,
    freshwaterAvailability: Math.round(freshwaterAvailability * 1000) / 1000,
    mineralAvailability: Math.round(mineralAvailability * 1000) / 1000,
    energyAvailability: Math.round(energyAvailability * 1000) / 1000,
    fertileLand: Math.round(fertileLand * 1000) / 1000,
    accessibleRawMaterials: Math.round(accessibleRawMaterials * 1000) / 1000,
    resourceStress: Math.round(resourceStress * 1000) / 1000,
  };
}
