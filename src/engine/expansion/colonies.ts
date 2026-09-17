/**
 * @license Apache-2.0
 * GENESIS COLONY MODEL & DEMOGRAPHICS (PHASE 8)
 *
 * Deterministically simulates the founding, growth, autonomy, specialization,
 * and survival/collapse dynamics of extraterrestrial colonies.
 */

import { DOMAIN } from '../../core/domains.js';
import { hash32WithSalt } from '../../core/hash.js';
import { createPRNG } from '../../core/prng.js';
import type { EntityId, Year } from '../../core/types.js';
import type { Civilization } from '../civilization/types.js';
import type {
  ColonyFocus,
  ColonyState,
  ColonyStatus,
  DestinationAnalysis,
  ExpansionEra,
  SpacefaringProfile,
} from './types.js';

/**
 * Evaluates whether a destination is eligible for colonization given current spacefaring capabilities.
 */
export function isDestinationColonizable(
  dest: DestinationAnalysis,
  era: ExpansionEra,
  profile: SpacefaringProfile
): boolean {
  if (!profile.isSpacefaring || dest.classification === 'HOMEWORLD' || dest.classification === 'UNVIABLE') {
    return false;
  }

  // Moons of the homeworld are accessible in LUNAR_SYSTEM era and above
  if (dest.classification === 'MOON' && dest.distanceAU < 0.05) {
    return (
      (era === 'LUNAR_SYSTEM' || era === 'INTERPLANETARY' || era === 'SYSTEM_WIDE') &&
      profile.orbitalCapability >= 0.4 &&
      profile.lifeSupportCapability >= 0.25
    );
  }

  // Terrestrial worlds and asteroid/resource bodies require INTERPLANETARY era
  if (
    dest.classification === 'TERRESTRIAL_WORLD' ||
    dest.classification === 'RESOURCE_BODY' ||
    dest.classification === 'DWARF_WORLD' ||
    dest.classification === 'MOON' ||
    dest.classification === 'ICE_WORLD'
  ) {
    return (
      (era === 'INTERPLANETARY' || era === 'SYSTEM_WIDE') &&
      profile.deepSpaceCapability >= 0.5 &&
      profile.propulsionCapability >= 0.45 &&
      profile.lifeSupportCapability >= 0.4
    );
  }

  // Gas giant orbital zones require advanced SYSTEM_WIDE capabilities
  if (dest.classification === 'GAS_GIANT_RESOURCE_ZONE') {
    return (
      era === 'SYSTEM_WIDE' &&
      profile.deepSpaceCapability >= 0.75 &&
      profile.automationCapability >= 0.6
    );
  }

  return false;
}

/**
 * Calculates carrying capacity for an extraterrestrial colony.
 */
function calculateColonyCarryingCapacity(
  dest: DestinationAnalysis,
  profile: SpacefaringProfile
): number {
  if (dest.classification === 'TERRESTRIAL_WORLD') {
    // Terrestrial worlds with atmosphere and hydrosphere can support massive populations
    const habitabilityMultiplier = Math.max(0.1, dest.viability);
    return Math.round(50_000_000 * habitabilityMultiplier * (1.0 + profile.lifeSupportCapability * 4.0));
  }

  if (dest.classification === 'MOON' || dest.classification === 'ICE_WORLD') {
    // Moons support dome/subsurface habitats
    return Math.round(1_500_000 * (1.0 + profile.automationCapability * 2.0));
  }

  if (dest.classification === 'RESOURCE_BODY' || dest.classification === 'DWARF_WORLD') {
    // Mining & industrial hubs
    return Math.round(500_000 * (1.0 + profile.automationCapability * 1.5));
  }

  if (dest.classification === 'GAS_GIANT_RESOURCE_ZONE') {
    // Floating cloud station / harvesting platforms
    return Math.round(80_000 * (1.0 + profile.automationCapability));
  }

  return 10_000;
}

/**
 * Selects deterministic colony primary specialization based on destination attributes.
 */
function determineColonyFocus(dest: DestinationAnalysis): ColonyFocus {
  if (dest.classification === 'RESOURCE_BODY' || dest.mineralAvailability > 0.8) {
    return 'MINING';
  }
  if (dest.classification === 'GAS_GIANT_RESOURCE_ZONE') {
    return 'OUTPOST';
  }
  if (dest.classification === 'TERRESTRIAL_WORLD' && dest.viability > 0.6) {
    return 'HABITATION';
  }
  if (dest.waterAvailability > 0.6 && dest.surfaceTempKelvin > 220) {
    return 'AGRICULTURAL_DOME';
  }
  if (dest.mineralAvailability > 0.6) {
    return 'MANUFACTURING';
  }
  return 'SCIENCE';
}

/**
 * Materializes all active, mature, or historical colonies across the star system.
 */
export function materializeColonies(
  civilization: Civilization,
  destinations: readonly DestinationAnalysis[],
  era: ExpansionEra,
  profile: SpacefaringProfile,
  currentYear: Year
): readonly ColonyState[] {
  if (!profile.isSpacefaring || era === 'PLANETARY') {
    return [];
  }

  const colonies: ColonyState[] = [];

  for (let i = 0; i < destinations.length; i++) {
    const dest = destinations[i];
    if (!isDestinationColonizable(dest, era, profile)) continue;

    const colonySeed = hash32WithSalt(civilization.seed, dest.bodyId, DOMAIN.COLONY);
    const prng = createPRNG(colonySeed);

    // Founding epoch calculation
    const baseSpaceflightDelay = Math.round(
      (1.0 - profile.expansionPotential) * 8_000 + 400
    );
    const distanceDelay = Math.round(dest.distanceAU * 300 + dest.travelEnergyRequirement * 8);
    const foundingEpoch = civilization.emergenceEpochYear + baseSpaceflightDelay + distanceDelay;

    if (currentYear < foundingEpoch) {
      continue; // Not yet founded at this simulation epoch
    }

    const yearsSinceFounding = currentYear - foundingEpoch;
    const carryingCapacity = calculateColonyCarryingCapacity(dest, profile);

    // Infrastructure level builds up with age and automation
    const infraGrowthRate = 0.001 * (1.0 + profile.automationCapability);
    const infrastructureLevel = Math.min(
      1.0,
      0.15 + yearsSinceFounding * infraGrowthRate + profile.automationCapability * 0.25
    );

    // Demographic Growth Curve (Logistic saturation)
    const initialPop = prng.nextInt(80, 500);
    const growthRate = 0.015 * Math.max(0.2, dest.viability) * (1.0 + profile.lifeSupportCapability);
    const rawPop = carryingCapacity / (1 + (carryingCapacity / initialPop) * Math.exp(-growthRate * Math.min(yearsSinceFounding, 2000)));
    let population = Math.round(Math.max(initialPop, Math.min(carryingCapacity, rawPop)));

    // Autonomy develops over centuries and distance
    const autonomyLevel = Math.min(
      1.0,
      (yearsSinceFounding / 4_000) * 0.6 + Math.min(1.0, dest.distanceAU / 15) * 0.4
    );

    // Resource dependence decreases as local infrastructure and autonomy mature
    let resourceDependence = Math.max(
      0.05,
      1.0 - (infrastructureLevel * 0.45 + autonomyLevel * 0.35 + dest.viability * 0.2)
    );

    // Stability & Survival / Collapse Dynamics
    let stability = Math.max(
      0.1,
      Math.min(
        1.0,
        civilization.stability.stabilityIndex * 0.4 +
          dest.viability * 0.35 +
          infrastructureLevel * 0.25
      )
    );

    let status: ColonyStatus = 'ESTABLISHED';

    if (yearsSinceFounding < 80) {
      status = 'ESTABLISHED';
    } else if (population >= carryingCapacity * 0.65) {
      status = 'MATURE';
    } else {
      status = 'GROWING';
    }

    // Interplanetary Collapse Rules
    if (civilization.status === 'EXTINCT') {
      if (resourceDependence > 0.55 || dest.viability < 0.25) {
        // High-dependence colony starves and collapses when supply lines terminate
        status = 'EXTINCT';
        population = 0;
        stability = 0.0;
      } else {
        // High-autonomy, viable world survives homeworld apocalypse
        status = 'DECLINING';
        population = Math.round(population * 0.35);
        stability = 0.25;
      }
    } else if (civilization.status === 'COLLAPSING' || civilization.stability.stabilityIndex < 0.25) {
      status = 'DECLINING';
      stability = Math.max(0.1, stability * 0.5);
      population = Math.round(population * 0.75);
    }

    const focus = determineColonyFocus(dest);

    // Resource Output based on focus and population
    const popRatio = population / 100_000;
    const resourceOutput = {
      minerals: focus === 'MINING' ? Math.round(150 * popRatio * dest.mineralAvailability) : Math.round(30 * popRatio),
      energy: Math.round(100 * popRatio * dest.energyAvailability),
      manufacturedGoods: focus === 'MANUFACTURING' ? Math.round(120 * popRatio * infrastructureLevel) : Math.round(25 * popRatio),
    };

    colonies.push({
      colonyId: `${civilization.id}/colony_${dest.bodyId}`,
      civilizationId: civilization.id,
      destinationId: dest.bodyId,
      destinationName: dest.name,
      destinationType: dest.classification,
      foundingEpoch,
      population,
      infrastructureLevel,
      autonomyLevel,
      resourceDependence,
      habitability: dest.viability,
      stability,
      status,
      primaryFocus: focus,
      resourceOutput,
    });
  }

  return colonies;
}
