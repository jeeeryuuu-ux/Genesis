/**
 * @license Apache-2.0
 * GENESIS CIVILIZATION EXPANSION & SPACEFARING TYPES (PHASE 8)
 *
 * Formal contracts for spacefaring eligibility, destination analysis,
 * expansion networks, orbital infrastructure, planetary colonies,
 * interplanetary resource flows, terraforming foundations, and systemic collapse.
 *
 * HIERARCHY RULE:
 * Universe -> Galaxy -> Star System -> Star -> Planet -> Environment -> Biosphere -> Life -> Species -> Civilization
 *   -> Planetary Infrastructure -> Orbital Infrastructure -> Interplanetary Civilization.
 */

import type { EntityId, Year } from '../../core/types.js';

/**
 * Developmental spacefaring epochs for expanding civilizations.
 */
export type ExpansionEra =
  | 'PLANETARY'
  | 'ORBITAL'
  | 'LUNAR_SYSTEM'
  | 'INTERPLANETARY'
  | 'SYSTEM_WIDE';

/**
 * Spacefaring capability breakdown across engineering and scientific vectors.
 */
export interface SpacefaringProfile {
  readonly orbitalCapability: number; // [0.0, 1.0] Earth-to-orbit payload capacity
  readonly propulsionCapability: number; // [0.0, 1.0] specific impulse & transit speed
  readonly navigationCapability: number; // [0.0, 1.0] astrodynamics & orbital mechanics
  readonly automationCapability: number; // [0.0, 1.0] robotics & uncrewed construction
  readonly lifeSupportCapability: number; // [0.0, 1.0] closed-loop biological survival
  readonly energyCapability: number; // [0.0, 1.0] offworld energy generation & storage
  readonly deepSpaceCapability: number; // [0.0, 1.0] outer-system transit resilience
  readonly expansionPotential: number; // [0.0, 1.0] composite spacefaring index
  readonly isSpacefaring: boolean; // meets threshold for non-trivial space presence
  readonly launchDifficulty: number; // [0.0, 1.0] gravity well & atmospheric penalty
}

/**
 * Functional classification of celestial bodies for civilizational expansion.
 */
export type DestinationClassification =
  | 'HOMEWORLD'
  | 'ORBITAL_HABITAT'
  | 'MOON'
  | 'TERRESTRIAL_WORLD'
  | 'RESOURCE_BODY'
  | 'ICE_WORLD'
  | 'DWARF_WORLD'
  | 'GAS_GIANT_RESOURCE_ZONE'
  | 'UNVIABLE';

/**
 * Analytical planetary engineering & terraforming foundation.
 */
export interface TerraformingProfile {
  readonly atmosphericModification: number; // [0.0, 1.0] capability to alter pressure & composition
  readonly thermalModification: number; // [0.0, 1.0] capability to warm/cool planetary surface
  readonly hydrologicalModification: number; // [0.0, 1.0] capability to introduce/release liquid water
  readonly biosphereCompatibility: number; // [0.0, 1.0] biological tolerance of target world
  readonly energyRequirement: number; // normalized energy scale required
  readonly estimatedDifficulty: number; // [0.0, 1.0] geological & climatic barrier
  readonly feasibility: number; // [0.0, 1.0] composite feasibility score
}

/**
 * Evaluated destination parameters and colonization viability for a celestial body.
 */
export interface DestinationAnalysis {
  readonly bodyId: EntityId;
  readonly name: string;
  readonly parentPlanetId?: EntityId;
  readonly classification: DestinationClassification;
  readonly distanceAU: number; // Delta AU from homeworld
  readonly surfaceGravityG: number;
  readonly surfaceTempKelvin: number;
  readonly atmospherePressureAtm: number;
  readonly waterAvailability: number; // [0.0, 1.0]
  readonly mineralAvailability: number; // [0.0, 1.0]
  readonly energyAvailability: number; // [0.0, 1.0]
  readonly hazardLevel: number; // [0.0, 1.0] radiation, thermal, orbital hazards
  readonly travelEnergyRequirement: number; // delta-v / transit cost metric
  readonly viability: number; // [0.0, 1.0] overall colonization attractiveness
  readonly terraforming: TerraformingProfile;
  readonly isColonized: boolean;
}

/**
 * Deterministic interplanetary transit route connecting two infrastructure nodes.
 */
export interface ExpansionRoute {
  readonly originId: EntityId;
  readonly destinationId: EntityId;
  readonly travelDifficulty: number; // [0.0, 1.0]
  readonly energyRequirement: number; // normalized energy units
  readonly infrastructureRequirement: number; // [0.0, 1.0] tech threshold
  readonly viability: number; // [0.0, 1.0]
  readonly status: 'PROPOSED' | 'ESTABLISHED' | 'ACTIVE' | 'DISRUPTED';
}

/**
 * Categories of orbital artificial infrastructure.
 */
export type OrbitalInfrastructureType =
  | 'COMMUNICATION_CONSTELLATION'
  | 'ORBITAL_HABITAT'
  | 'RESEARCH_STATION'
  | 'MANUFACTURING_FOUNDRY'
  | 'SOLAR_COLLECTOR_ARRAY'
  | 'ORBITAL_SHIPYARD';

/**
 * Persistent artificial structure in orbit of a celestial body.
 */
export interface OrbitalInfrastructure {
  readonly id: string;
  readonly civilizationId: EntityId;
  readonly parentBodyId: EntityId;
  readonly name: string;
  readonly type: OrbitalInfrastructureType;
  readonly constructionEpoch: Year;
  readonly populationCapacity: number;
  readonly population: number;
  readonly resourceRequirement: number;
  readonly energyOutput: number;
  readonly operationalState: 'OPERATIONAL' | 'DEGRADED' | 'ABANDONED';
}

/**
 * Developmental status of an extraterrestrial colony.
 */
export type ColonyStatus =
  | 'PLANNED'
  | 'ESTABLISHED'
  | 'GROWING'
  | 'MATURE'
  | 'DECLINING'
  | 'ABANDONED'
  | 'EXTINCT';

/**
 * Primary socioeconomic specialization of a colony.
 */
export type ColonyFocus =
  | 'HABITATION'
  | 'MINING'
  | 'SCIENCE'
  | 'AGRICULTURAL_DOME'
  | 'MANUFACTURING'
  | 'OUTPOST';

/**
 * Deterministic extraterrestrial colony entity.
 */
export interface ColonyState {
  readonly colonyId: string;
  readonly civilizationId: EntityId;
  readonly destinationId: EntityId;
  readonly destinationName: string;
  readonly destinationType: DestinationClassification;
  readonly foundingEpoch: Year;
  readonly population: number;
  readonly infrastructureLevel: number; // [0.0, 1.0]
  readonly autonomyLevel: number; // [0.0, 1.0]
  readonly resourceDependence: number; // [0.0, 1.0] reliance on homeworld supply lines
  readonly habitability: number; // [0.0, 1.0] local environmental survivability
  readonly stability: number; // [0.0, 1.0] systemic resilience
  readonly status: ColonyStatus;
  readonly primaryFocus: ColonyFocus;
  readonly resourceOutput: {
    readonly minerals: number;
    readonly energy: number;
    readonly manufacturedGoods: number;
  };
}

/**
 * Major historical milestones in interplanetary expansion.
 */
export interface ExpansionMilestone {
  readonly id: string;
  readonly year: Year;
  readonly civilizationId: EntityId;
  readonly title: string;
  readonly description: string;
  readonly category: 'ORBITAL' | 'SETTLEMENT' | 'INTERPLANETARY' | 'MEGASTRUCTURE' | 'CRISIS';
  readonly affectedBodyId?: EntityId;
}

/**
 * Interplanetary resource flow and homeworld ecological relief metrics.
 */
export interface InterplanetaryResourceNetwork {
  readonly mineralImport: number; // offworld raw minerals delivered to homeworld
  readonly energySurplus: number; // offworld orbital solar & fusion energy
  readonly manufacturedGoods: number; // offworld foundry goods
  readonly foodLogistics: number; // life-support / agro-dome production
  readonly networkEfficiency: number; // [0.0, 1.0] operational supply chain integrity
  readonly pressureReliefRatio: number; // [0.0, 1.0] homeworld resource & ecological relief
}

/**
 * Authoritative aggregate state of an interplanetary civilization.
 */
export interface InterplanetaryCivilizationState {
  readonly civilizationId: EntityId;
  readonly homeworldId: EntityId;
  readonly systemId: EntityId;
  readonly expansionEra: ExpansionEra;
  readonly isSpacefaring: boolean;
  readonly spacefaringProfile: SpacefaringProfile;
  readonly controlledBodies: readonly EntityId[];
  readonly orbitalInfrastructure: readonly OrbitalInfrastructure[];
  readonly colonies: readonly ColonyState[];
  readonly routes: readonly ExpansionRoute[];
  readonly destinations: readonly DestinationAnalysis[];
  readonly totalPopulation: number;
  readonly homeworldPopulation: number;
  readonly offworldPopulation: number;
  readonly industrialCapacity: number;
  readonly energyCapacity: number;
  readonly resourceSecurity: number;
  readonly expansionCapability: number;
  readonly networkConnectivity: number;
  readonly systemStability: number;
  readonly pressureRelief: number;
  readonly resourceNetwork: InterplanetaryResourceNetwork;
  readonly milestones: readonly ExpansionMilestone[];
  readonly status: string;
}

/**
 * Lightweight, O(1) queryable summary of interplanetary expansion for telemetry HUD.
 */
export interface InterplanetaryExpansionSummary {
  readonly civilizationId: EntityId;
  readonly homeworldId: EntityId;
  readonly isSpacefaring: boolean;
  readonly expansionEra: ExpansionEra;
  readonly orbitalInfrastructureCount: number;
  readonly colonyCount: number;
  readonly offworldPopulation: number;
  readonly systemCoverage: number; // [0.0, 1.0] fraction of viable system bodies with presence
  readonly energyCapacity: number;
  readonly resourceSecurity: number;
  readonly pressureRelief: number;
  readonly colonies: readonly {
    readonly id: string;
    readonly destinationName: string;
    readonly status: ColonyStatus;
    readonly population: number;
    readonly habitability: number;
  }[];
}
