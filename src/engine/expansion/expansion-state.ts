/**
 * @license Apache-2.0
 * GENESIS INTERPLANETARY CIVILIZATION STATE AGGREGATOR (PHASE 8)
 *
 * Deterministically constructs and synchronizes the aggregate interplanetary state,
 * offworld demographics, interplanetary resource network, homeworld pressure relief,
 * and chronological expansion milestones.
 */

import type { EntityId, Planet, Year } from '../../core/types.js';
import type { Civilization } from '../civilization/types.js';
import { materializeColonies } from './colonies.js';
import { evaluateSystemDestinations } from './destinations.js';
import { materializeOrbitalInfrastructure } from './infrastructure.js';
import { buildExpansionRoutes } from './network.js';
import { determineExpansionEra, evaluateSpacefaringProfile } from './spacefaring.js';
import type {
  DestinationAnalysis,
  ExpansionMilestone,
  InterplanetaryCivilizationState,
  InterplanetaryExpansionSummary,
  InterplanetaryResourceNetwork,
} from './types.js';

/**
 * Computes the interplanetary resource flows and homeworld pressure relief ratio.
 */
function computeResourceNetwork(
  colonies: readonly import('./types.js').ColonyState[],
  infrastructure: readonly import('./types.js').OrbitalInfrastructure[],
  homeworldPopulation: number
): InterplanetaryResourceNetwork {
  let mineralImport = 0;
  let energySurplus = 0;
  let manufacturedGoods = 0;

  for (const col of colonies) {
    if (col.status !== 'EXTINCT' && col.status !== 'ABANDONED') {
      mineralImport += col.resourceOutput.minerals;
      energySurplus += col.resourceOutput.energy;
      manufacturedGoods += col.resourceOutput.manufacturedGoods;
    }
  }

  for (const infra of infrastructure) {
    if (infra.operationalState === 'OPERATIONAL') {
      energySurplus += infra.energyOutput;
      if (infra.type === 'MANUFACTURING_FOUNDRY') {
        manufacturedGoods += 150;
      }
    }
  }

  const activeColonies = colonies.filter((c) => c.status === 'GROWING' || c.status === 'MATURE');
  const networkEfficiency = Math.min(1.0, 0.4 + activeColonies.length * 0.15);

  // Pressure relief on homeworld ecology and resources
  const offworldPop = colonies.reduce((sum, c) => sum + c.population, 0);
  const popRelief = Math.min(0.3, offworldPop / Math.max(1, homeworldPopulation));
  const resourceRelief = Math.min(0.4, (mineralImport + manufacturedGoods) / 3000);
  const pressureReliefRatio = Math.min(0.75, popRelief + resourceRelief);

  return {
    mineralImport,
    energySurplus,
    manufacturedGoods,
    foodLogistics: Math.round(activeColonies.length * 80),
    networkEfficiency,
    pressureReliefRatio,
  };
}

/**
 * Derives chronological historical milestones for spacefaring and expansion.
 */
function compileExpansionMilestones(
  civilization: Civilization,
  destinations: readonly DestinationAnalysis[],
  colonies: readonly import('./types.js').ColonyState[],
  infrastructure: readonly import('./types.js').OrbitalInfrastructure[],
  currentYear: Year
): readonly ExpansionMilestone[] {
  const milestones: ExpansionMilestone[] = [];

  // 1. Orbital dawn
  if (civilization.technology.spaceflight >= 0.28) {
    const orbitalYear = civilization.emergenceEpochYear + 400;
    if (currentYear >= orbitalYear) {
      milestones.push({
        id: `${civilization.id}/m_orbital_dawn`,
        year: orbitalYear,
        civilizationId: civilization.id,
        title: 'Dawn of the Space Age',
        description: 'First artificial satellites achieved stable orbit around the homeworld.',
        category: 'ORBITAL',
        affectedBodyId: civilization.planetId,
      });
    }
  }

  // 2. First orbital habitat
  const firstHabitat = infrastructure.find((i) => i.type === 'ORBITAL_HABITAT');
  if (firstHabitat && currentYear >= firstHabitat.constructionEpoch) {
    milestones.push({
      id: `${civilization.id}/m_first_habitat`,
      year: firstHabitat.constructionEpoch,
      civilizationId: civilization.id,
      title: 'First Orbital Habitat',
      description: `Permanent offworld habitation established with the commissioning of ${firstHabitat.name}.`,
      category: 'ORBITAL',
      affectedBodyId: civilization.planetId,
    });
  }

  // 3. Colony founding milestones
  for (const col of colonies) {
    if (currentYear >= col.foundingEpoch) {
      const isMoon = col.destinationType === 'MOON';
      milestones.push({
        id: `${civilization.id}/m_colony_${col.destinationId}`,
        year: col.foundingEpoch,
        civilizationId: civilization.id,
        title: isMoon ? 'Lunar Foothold' : `Colonization of ${col.destinationName}`,
        description: `Established the first permanent offworld outpost on ${col.destinationName} (${col.primaryFocus.toLowerCase()} focus).`,
        category: 'SETTLEMENT',
        affectedBodyId: col.destinationId,
      });
    }
  }

  // 4. Crisis milestone
  if (civilization.status === 'COLLAPSING' || civilization.status === 'EXTINCT') {
    milestones.push({
      id: `${civilization.id}/m_systemic_crisis`,
      year: currentYear,
      civilizationId: civilization.id,
      title: 'Interplanetary Disruption',
      description: 'Systemic instability on the homeworld severed interplanetary transport networks.',
      category: 'CRISIS',
      affectedBodyId: civilization.planetId,
    });
  }

  return milestones.sort((a, b) => a.year - b.year);
}

/**
 * Authoritative factory materializing the complete Interplanetary Civilization State.
 */
export function materializeInterplanetaryState(
  civilization: Civilization,
  homeworld: Planet,
  allPlanets: readonly Planet[],
  currentYear: Year,
  primaryStarLuminosity: number = 1.0
): InterplanetaryCivilizationState {
  const profile = evaluateSpacefaringProfile(civilization, homeworld);
  const era = determineExpansionEra(profile);

  // 1. Destination viability evaluation across the star system
  const rawDestinations = evaluateSystemDestinations(homeworld, allPlanets, primaryStarLuminosity);

  // 2. Orbital Infrastructure
  const orbitalInfrastructure = materializeOrbitalInfrastructure(
    civilization,
    homeworld.id,
    homeworld.name,
    profile,
    currentYear
  );

  // 3. Extraterrestrial Colonies
  const colonies = materializeColonies(civilization, rawDestinations, era, profile, currentYear);

  // Annotate destinations with colonization status
  const colonizedDestinationIds = new Set(colonies.map((c) => c.destinationId));
  colonizedDestinationIds.add(homeworld.id);

  const destinations: readonly DestinationAnalysis[] = rawDestinations.map((d) => ({
    ...d,
    isColonized: colonizedDestinationIds.has(d.bodyId),
  }));

  // 4. Interplanetary Expansion Routes
  const isSystemStable = civilization.stability.stabilityIndex >= 0.25;
  const routes = buildExpansionRoutes(homeworld.id, destinations, profile, colonies, isSystemStable);

  // 5. Demographics and Resource Network
  const homeworldPopulation = civilization.population;
  const offworldPopulation =
    colonies.reduce((sum, c) => sum + c.population, 0) +
    orbitalInfrastructure.reduce((sum, i) => sum + i.population, 0);
  const totalPopulation = homeworldPopulation + offworldPopulation;

  const resourceNetwork = computeResourceNetwork(colonies, orbitalInfrastructure, homeworldPopulation);

  // Controlled bodies
  const controlledBodies = Array.from(colonizedDestinationIds);

  // System stability and network connectivity
  const networkConnectivity = Math.min(
    1.0,
    routes.filter((r) => r.status === 'ACTIVE').length / Math.max(1, destinations.length - 1)
  );

  const systemStability = Math.max(
    0.0,
    Math.min(
      1.0,
      civilization.stability.stabilityIndex * 0.6 +
        resourceNetwork.networkEfficiency * 0.25 +
        (1.0 - profile.launchDifficulty) * 0.15
    )
  );

  const industrialCapacity = Math.round(
    (civilization.resources.accessibleRawMaterials * 1000 + resourceNetwork.manufacturedGoods) *
      (1.0 + profile.automationCapability)
  );

  const energyCapacity = Math.round(
    civilization.resources.energyAvailability * 1500 + resourceNetwork.energySurplus
  );

  const resourceSecurity = Math.min(
    1.0,
    civilization.stability.resourceSecurity + resourceNetwork.pressureReliefRatio * 0.35
  );

  // Milestones
  const milestones = compileExpansionMilestones(
    civilization,
    destinations,
    colonies,
    orbitalInfrastructure,
    currentYear
  );

  return {
    civilizationId: civilization.id,
    homeworldId: homeworld.id,
    systemId: homeworld.systemId,
    expansionEra: era,
    isSpacefaring: profile.isSpacefaring,
    spacefaringProfile: profile,
    controlledBodies,
    orbitalInfrastructure,
    colonies,
    routes,
    destinations,
    totalPopulation,
    homeworldPopulation,
    offworldPopulation,
    industrialCapacity,
    energyCapacity,
    resourceSecurity,
    expansionCapability: profile.expansionPotential,
    networkConnectivity,
    systemStability,
    pressureRelief: resourceNetwork.pressureReliefRatio,
    resourceNetwork,
    milestones,
    status: civilization.status,
  };
}

/**
 * Creates a lightweight summary of interplanetary expansion suitable for instant HUD polling.
 */
export function summarizeInterplanetaryExpansion(
  state: InterplanetaryCivilizationState
): InterplanetaryExpansionSummary {
  const viableNonHome = state.destinations.filter(
    (d) => d.classification !== 'HOMEWORLD' && d.viability > 0.2
  );
  const systemCoverage =
    viableNonHome.length > 0
      ? state.colonies.length / viableNonHome.length
      : 0;

  return {
    civilizationId: state.civilizationId,
    homeworldId: state.homeworldId,
    isSpacefaring: state.isSpacefaring,
    expansionEra: state.expansionEra,
    orbitalInfrastructureCount: state.orbitalInfrastructure.length,
    colonyCount: state.colonies.length,
    offworldPopulation: state.offworldPopulation,
    systemCoverage: Math.min(1.0, systemCoverage),
    energyCapacity: state.energyCapacity,
    resourceSecurity: state.resourceSecurity,
    pressureRelief: state.pressureRelief,
    colonies: state.colonies.map((c) => ({
      id: c.colonyId,
      destinationName: c.destinationName,
      status: c.status,
      population: c.population,
      habitability: c.habitability,
    })),
  };
}
