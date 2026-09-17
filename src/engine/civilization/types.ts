/**
 * @license Apache-2.0
 * GENESIS CIVILIZATION SIMULATION TYPES
 *
 * Formal contracts for deterministic civilization genesis, intelligence emergence,
 * technological progression, planetary resource consumption, stability, and collapse (Phase 7).
 *
 * HIERARCHY RULE:
 * Universe -> Galaxy -> Star System -> Star -> Planet -> Environment -> Biosphere -> Life -> Species -> Civilization.
 * Civilization state consumes biological, planetary, and astronomical states, never mutates them.
 */

import type { EntityId, Seed, Year } from '../../core/types.js';

/**
 * Developmental and existential state of a civilization.
 */
export type CivilizationStatus =
  | 'PRE_CIVILIZATION'
  | 'EMERGING'
  | 'DEVELOPING'
  | 'INDUSTRIAL'
  | 'ADVANCED'
  | 'COLLAPSING'
  | 'EXTINCT';

/**
 * Discrete technological epochs characterizing tool and knowledge mastery.
 */
export type TechnologicalEra =
  | 'STONE_AGE'
  | 'AGRICULTURAL'
  | 'BRONZE_IRON'
  | 'ORGANIZED_PRE_INDUSTRIAL'
  | 'INDUSTRIAL'
  | 'ATOMIC_INFORMATION'
  | 'INTERPLANETARY'
  | 'POST_SCARCITY';

/**
 * Spatial scale of societal settlement and infrastructure distribution.
 */
export type SettlementTier =
  | 'TRIBAL_CAMPS'
  | 'PERMANENT_VILLAGES'
  | 'CITY_STATES'
  | 'NATION_NETWORKS'
  | 'GLOBAL_METROPOLIS'
  | 'PLANETARY_CIVILIZATION';

/**
 * Procedurally derived cognitive and behavioral intelligence profile of a species.
 */
export interface IntelligenceProfile {
  readonly cognitiveComplexity: number; // [0.0, 1.0] neural processing density
  readonly problemSolving: number; // [0.0, 1.0] adaptive reasoning & improvisation
  readonly communication: number; // [0.0, 1.0] symbolic and linguistic bandwidth
  readonly socialLearning: number; // [0.0, 1.0] transgenerational knowledge transmission
  readonly toolUse: number; // [0.0, 1.0] manipulative dexterous material alteration
  readonly abstractReasoning: number; // [0.0, 1.0] conceptual modeling & mathematics
  readonly collectiveCoordination: number; // [0.0, 1.0] large-scale social cooperation
  readonly civilizationPotential: number; // [0.0, 1.0] composite emergence capacity
  readonly isSapient: boolean; // whether species crosses the threshold of sapience
}

/**
 * Multi-dimensional technological capabilities profile.
 */
export interface TechnologyProfile {
  readonly era: TechnologicalEra;
  readonly level: number; // [0.0, 1.0] normalized continuous technological index
  readonly knowledgeLevel: number; // [0.0, 1.0] cumulative recorded science
  readonly energyTechnology: number; // [0.0, 1.0] energy capture & harnessing capability
  readonly computation: number; // [0.0, 1.0] data processing & automated logic
  readonly biotechnology: number; // [0.0, 1.0] genomic & ecological manipulation
  readonly engineering: number; // [0.0, 1.0] structural, mechanical & metallurgical capacity
  readonly automation: number; // [0.0, 1.0] robotics & labor mechanization
  readonly spaceflight: number; // [0.0, 1.0] orbital & interplanetary transit
  readonly planetaryEngineering: number; // [0.0, 1.0] climate & geophysical geo-engineering
}

/**
 * Sociological organization, governance cohesion, and settlement pattern.
 */
export interface SocietalProfile {
  readonly socialComplexity: number; // [0.0, 1.0] division of labor & institutional depth
  readonly settlementType: SettlementTier;
  readonly collectiveCoordination: number; // [0.0, 1.0] cooperation at scale
  readonly governanceCohesion: number; // [0.0, 1.0] institutional stability
  readonly culturalDiversity: number; // [0.0, 1.0] ideological & subcultural variance
}

/**
 * Planetary resources available to and consumed by civilization.
 */
export interface ResourceProfile {
  readonly biologicalProductivity: number; // [0.0, 1.0] organic biomass harvestability
  readonly freshwaterAvailability: number; // [0.0, 1.0] accessible potable hydrologic reserves
  readonly mineralAvailability: number; // [0.0, 1.0] metallic & crystalline ore accessibility
  readonly energyAvailability: number; // [0.0, 1.0] solar, thermal, fossil, wind energy reserves
  readonly fertileLand: number; // [0.0, 1.0] arable surface fraction
  readonly accessibleRawMaterials: number; // [0.0, 1.0] composite industrial base
  readonly resourceStress: number; // [0.0, 1.0] depletion pressure vs civilization demand
}

/**
 * Composite societal stability index and stress decomposition.
 */
export interface CivilizationStability {
  readonly stabilityIndex: number; // [0.0, 1.0] overall survival resilience
  readonly environmentalStability: number; // [0.0, 1.0] planetary climatic tolerance
  readonly resourceSecurity: number; // [0.0, 1.0] food, water & raw material sufficiency
  readonly socialCoordination: number; // [0.0, 1.0] governance & internal unity
  readonly technologicalResilience: number; // [0.0, 1.0] infrastructure robustness
  readonly ecologicalStress: number; // [0.0, 1.0] degradation imposed on biosphere
  readonly populationPressure: number; // [0.0, 1.0] crowding vs planetary carrying capacity
  readonly primaryStressFactor: string; // descriptive dominant stress source
}

/**
 * Significant deterministic historical milestone achieved by a civilization.
 */
export interface CivilizationMilestone {
  readonly id: string;
  readonly year: Year;
  readonly title: string;
  readonly description: string;
  readonly category: 'BIOLOGICAL' | 'COGNITIVE' | 'SOCIETAL' | 'TECHNOLOGICAL' | 'ECOLOGICAL' | 'CRISIS';
}

/**
 * Historical record of an active or extinct planetary civilization.
 */
export interface CivilizationRecord {
  readonly civilizationId: string;
  readonly name: string;
  readonly emergenceEpoch: Year;
  readonly extinctionEpoch?: Year;
  readonly primaryOriginSpecies: string;
  readonly peakPopulation: number;
  readonly peakTechnology: number;
  readonly peakEra: TechnologicalEra;
  readonly extinctionCause?: string;
}

/**
 * Authoritative, stateful representation of a planetary civilization.
 */
export interface Civilization {
  readonly id: EntityId;
  readonly seed: Seed;
  readonly name: string;
  readonly planetId: EntityId;
  readonly speciesId: EntityId;
  readonly speciesName: string;
  readonly emergenceEpochYear: Year;
  readonly extinctionEpochYear?: Year;
  readonly status: CivilizationStatus;
  readonly intelligence: IntelligenceProfile;
  readonly society: SocietalProfile;
  readonly technology: TechnologyProfile;
  readonly resources: ResourceProfile;
  readonly stability: CivilizationStability;
  readonly population: number;
  readonly peakPopulation: number;
  readonly milestones: readonly CivilizationMilestone[];
}

/**
 * Lightweight, O(1) queryable summary of all planetary civilizations for HUD telemetry.
 */
export interface PlanetaryCivilizationSummary {
  readonly planetId: EntityId;
  readonly currentYear: Year;
  readonly hasCivilization: boolean;
  readonly activeCivilizationCount: number;
  readonly extinctCivilizationCount: number;
  readonly totalPopulation: number;
  readonly highestEra: TechnologicalEra;
  readonly highestTechLevel: number;
  readonly primaryCivilizationName?: string;
  readonly civilizations: readonly {
    readonly id: EntityId;
    readonly name: string;
    readonly speciesName: string;
    readonly status: CivilizationStatus;
    readonly era: TechnologicalEra;
    readonly population: number;
    readonly techLevel: number;
    readonly stability: number;
  }[];
}
