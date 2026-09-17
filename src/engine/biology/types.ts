/**
 * @license Apache-2.0
 * GENESIS BIOLOGICAL SIMULATION TYPES
 *
 * Formal contracts for the deterministic biological genesis, habitability,
 * evolution, species divergence, and ecosystem modeling layer (Phase 6).
 *
 * ARCHITECTURAL RULE:
 * Astronomical Simulation -> Planetary Environment -> Biological Simulation -> Life / Species.
 * Biology consumes astronomical and environmental states, never mutates them.
 */

import type { EntityId, Seed, Year } from '../../core/types.js';

/**
 * Categorical habitability classification.
 */
export type HabitabilityRating = 'NONE' | 'MARGINAL' | 'POSSIBLE' | 'FAVORABLE';

/**
 * Comprehensive planetary habitability assessment breakdown.
 */
export interface HabitabilityAssessment {
  readonly overall: HabitabilityRating;
  readonly score: number; // [0.0, 1.0] continuous aggregate suitability
  readonly temperatureSuitability: number; // [0.0, 1.0]
  readonly waterAvailability: number; // [0.0, 1.0]
  readonly atmosphericSuitability: number; // [0.0, 1.0]
  readonly energyAvailability: number; // [0.0, 1.0]
  readonly environmentalStability: number; // [0.0, 1.0]
  readonly factors: {
    readonly isTemperate: boolean;
    readonly hasLiquidWater: boolean;
    readonly hasAtmosphere: boolean;
    readonly isStarStable: boolean;
    readonly summaryText: string;
  };
}

/**
 * Environmental or geochemical pathway through which life first emerges.
 */
export type LifeOriginType =
  | 'AQUATIC'
  | 'HYDROTHERMAL'
  | 'SUBSURFACE'
  | 'ATMOSPHERIC'
  | 'CHEMOSYNTHETIC'
  | 'PHOTOSYNTHETIC'
  | 'EXTREMOPHILE';

/**
 * Metabolic biochemical energy-harvesting strategies.
 */
export type MetabolismType =
  | 'CHEMOSYNTHESIS'
  | 'PHOTOSYNTHESIS'
  | 'ANAEROBIC'
  | 'AEROBIC'
  | 'MIXOTROPHIC'
  | 'EXTREMOPHILE';

/**
 * Tiered biological organizational complexity.
 */
export type BiologicalComplexity =
  | 'MOLECULAR'
  | 'PROTOCELL'
  | 'UNICELLULAR'
  | 'COLONIAL'
  | 'MULTICELLULAR'
  | 'COMPLEX';

/**
 * Ecological trophic role within the planetary food web.
 */
export type TrophicRole =
  | 'PRODUCER'
  | 'CONSUMER'
  | 'DECOMPOSER'
  | 'PREDATOR'
  | 'PREY'
  | 'PARASITE'
  | 'SCAVENGER';

/**
 * Population demographic & survival status.
 */
export type SpeciesStatus =
  | 'THRIVING'
  | 'STABLE'
  | 'DECLINING'
  | 'ENDANGERED'
  | 'EXTINCT';

/**
 * Physical anatomical traits.
 */
export interface PhysicalTraits {
  readonly sizeMeters: number;
  readonly densityKgM3: number;
  readonly structuralComplexity: number; // [0.0, 1.0]
  readonly mobilityType: 'SESSILE' | 'DRIFTING' | 'SWIMMING' | 'CRAWLING' | 'WALKING' | 'GLIDING';
  readonly temperatureToleranceKelvin: {
    readonly min: number;
    readonly max: number;
    readonly optimal: number;
  };
  readonly pressureToleranceAtm: {
    readonly min: number;
    readonly max: number;
    readonly optimal: number;
  };
  readonly radiationTolerance: number; // [0.0, 1.0]
}

/**
 * Metabolic traits.
 */
export interface MetabolicTraits {
  readonly metabolism: MetabolismType;
  readonly energyEfficiency: number; // [0.0, 1.0]
  readonly oxygenDependence: number; // [0.0, 1.0]
  readonly photosyntheticEfficiency: number; // [0.0, 1.0]
  readonly metabolicRate: number; // [0.0, 1.0]
}

/**
 * Ecological traits.
 */
export interface EcologicalTraits {
  readonly trophicRole: TrophicRole;
  readonly dietStrategy: 'AUTOTROPH' | 'HERBIVORE' | 'CARNIVORE' | 'OMNIVORE' | 'DETRITIVORE' | 'FILTER_FEEDER';
  readonly habitatPreference:
    | 'SURFACE_OCEAN'
    | 'DEEP_TRENCH'
    | 'COASTAL'
    | 'TERRESTRIAL_LOWLAND'
    | 'SUBTERRANEAN'
    | 'ATMOSPHERE';
  readonly waterDependency: number; // [0.0, 1.0]
  readonly lifespanYears: number;
  readonly generationTimeYears: number;
  readonly reproductionMode:
    | 'ASEXUAL_FISSION'
    | 'SPORE_BUDDING'
    | 'SEXUAL_DIMORPHIC'
    | 'PARTHENOGENIC';
  readonly populationGrowthRate: number; // Relative reproductive potential [0.01, 0.5]
}

/**
 * Sensory traits.
 */
export interface SensoryTraits {
  readonly vision: number; // [0.0, 1.0]
  readonly chemicalSensing: number; // [0.0, 1.0]
  readonly pressureSensing: number; // [0.0, 1.0]
  readonly thermalSensing: number; // [0.0, 1.0]
}

/**
 * Defensive traits.
 */
export interface DefenseTraits {
  readonly armor: number; // [0.0, 1.0]
  readonly toxins: number; // [0.0, 1.0]
  readonly camouflage: number; // [0.0, 1.0]
  readonly regeneration: number; // [0.0, 1.0]
}

/**
 * Full composite trait profile for a species.
 */
export interface TraitProfile {
  readonly physical: PhysicalTraits;
  readonly metabolic: MetabolicTraits;
  readonly ecological: EcologicalTraits;
  readonly sensory: SensoryTraits;
  readonly defense: DefenseTraits;
}

/**
 * Abstract procedural visual descriptors for rendered species inspection.
 */
export interface VisualDescriptor {
  readonly bodyScale: number;
  readonly symmetry: 'RADIAL' | 'BILATERAL' | 'ASYMMETRICAL' | 'SPHERICAL';
  readonly appendageCount: number;
  readonly surfaceTexture: 'SMOOTH' | 'CHITINOUS' | 'MEMBRANOUS' | 'SCALED' | 'GELATINOUS' | 'SILICATE';
  readonly bioluminescence: boolean;
  readonly primaryHue: number; // [0, 360]
  readonly secondaryHue: number; // [0, 360]
  readonly sensoryComplexity: number; // [0.0, 1.0]
}

/**
 * Deterministic environmental fitness assessment for a species.
 */
export interface SpeciesFitness {
  readonly overallFitness: number; // [0.0, 1.0]
  readonly temperatureFitness: number; // [0.0, 1.0]
  readonly waterFitness: number; // [0.0, 1.0]
  readonly pressureFitness: number; // [0.0, 1.0]
  readonly energyFitness: number; // [0.0, 1.0]
  readonly radiationFitness: number; // [0.0, 1.0]
  readonly limitingFactor: string;
}

/**
 * Primary statistical population entity representing a distinct biological species.
 */
export interface Species {
  readonly id: EntityId;
  readonly seed: Seed;
  readonly planetId: EntityId;
  readonly name: string;
  readonly originEpochYear: Year;
  readonly extinctionEpochYear?: Year;
  readonly parentSpeciesId?: EntityId;
  readonly origin: LifeOriginType;
  readonly complexity: BiologicalComplexity;
  readonly populationEstimate: number;
  readonly status: SpeciesStatus;
  readonly traits: TraitProfile;
  readonly visual: VisualDescriptor;
  readonly fitness: SpeciesFitness;
}

/**
 * Sparse directed relationship between species in the planetary ecosystem.
 */
export interface EcosystemLink {
  readonly sourceSpeciesId: EntityId;
  readonly targetSpeciesId: EntityId;
  readonly relationshipType:
    | 'PREDATION'
    | 'GRAZING'
    | 'PARASITISM'
    | 'SYMBIOSIS'
    | 'DECOMPOSITION'
    | 'COMPETITION';
  readonly strength: number; // [0.0, 1.0]
}

/**
 * Planetary food-web and ecosystem structure.
 */
export interface Ecosystem {
  readonly planetId: EntityId;
  readonly primaryEnergySource:
    | 'STELLAR_RADIATION'
    | 'HYDROTHERMAL_VENT'
    | 'RADIOACTIVE_DECAY'
    | 'ATMOSPHERIC_REDOX';
  readonly producersCount: number;
  readonly consumersCount: number;
  readonly predatorsCount: number;
  readonly decomposersCount: number;
  readonly biomassTonsEstimate: number;
  readonly trophicStabilityIndex: number; // [0.0, 1.0]
  readonly links: readonly EcosystemLink[];
}

/**
 * Lightweight biosphere overview for lazy evaluation and high-level HUD display.
 */
export interface BiosphereSummary {
  readonly planetId: EntityId;
  readonly habitability: HabitabilityAssessment;
  readonly hasLife: boolean;
  readonly abiogenesisYear?: Year;
  readonly dominantOrigin?: LifeOriginType;
  readonly highestComplexity: BiologicalComplexity;
  readonly activeSpeciesCount: number;
  readonly extinctSpeciesCount: number;
  readonly biomassTonsEstimate: number;
}

/**
 * Full materialized planetary biosphere at a given epoch.
 */
export interface Biosphere {
  readonly planetId: EntityId;
  readonly seed: Seed;
  readonly epochYear: Year;
  readonly summary: BiosphereSummary;
  readonly activeSpecies: readonly Species[];
  readonly extinctSpecies: readonly Species[];
  readonly ecosystem: Ecosystem;
}

/**
 * Biological event classifications.
 */
export type BiologicalEventType =
  | 'LIFE_ORIGIN'
  | 'COMPLEXITY_TRANSITION'
  | 'SPECIES_EMERGENCE'
  | 'SPECIES_DIVERGENCE'
  | 'MASS_EXTINCTION'
  | 'ADAPTIVE_RADIATION'
  | 'ECOSYSTEM_COLLAPSE';

/**
 * Authoritative biological event descriptor.
 */
export interface BiologicalEvent {
  readonly eventId: string;
  readonly planetId: EntityId;
  readonly planetName: string;
  readonly year: Year;
  readonly eventType: BiologicalEventType;
  readonly severity: 'INFO' | 'NOTABLE' | 'CATACLYSMIC';
  readonly description: string;
  readonly speciesId?: EntityId;
  readonly speciesName?: string;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}
