/**
 * @license Apache-2.0
 * GENESIS TEMPORAL SIMULATION TYPES
 *
 * Formal contracts for the deterministic astronomical simulation engine.
 * Decoupled from the immutable baseline generators.
 */

import type {
  EntityId,
  HabitableZoneAU,
  Moon,
  Planet,
  PlanetType,
  SpectralClass,
  Star,
  StarSystem,
  Vector3D,
  Year,
} from '../../core/types.js';

/**
 * Supported stages in the physically-inspired stellar evolution model.
 */
export type StellarEvolutionStage =
  | 'MAIN_SEQUENCE'
  | 'SUBGIANT'
  | 'RED_GIANT'
  | 'WHITE_DWARF'
  | 'NEUTRON_STAR'
  | 'BLACK_HOLE';

/**
 * Temporal state delta for a star at an epoch.
 */
export interface StellarTemporalState {
  readonly entityId: EntityId;
  readonly baseStar: Star;
  readonly formationYear: Year;
  readonly ageYears: number;
  readonly mainSequenceLifetimeYears: number;
  readonly stage: StellarEvolutionStage;
  readonly spectralClass: SpectralClass;
  readonly luminositySolar: number;
  readonly radiusSolar: number;
  readonly surfaceTempKelvin: number;
}

/**
 * Temporal state delta for a planet at an epoch.
 */
export interface PlanetaryTemporalState {
  readonly entityId: EntityId;
  readonly basePlanet: Planet;
  readonly orbitalPhaseRad: number; // Current orbital angle in [0, 2π)
  readonly positionAU: Vector3D; // Current orbital Cartesian position
  readonly incidentFluxSolar: number; // Relative to Earth = 1.0
  readonly effectiveTempKelvin: number;
  readonly surfacePressureAtm: number;
  readonly hydrosphereCoverage: number; // [0.0, 1.0]
  readonly iceCoverage: number; // [0.0, 1.0]
  readonly isInHabitableZone: boolean;
  readonly hasBiosphereEligibility: boolean;
}

/**
 * Temporal state delta for a natural moon at an epoch.
 */
export interface MoonTemporalState {
  readonly entityId: EntityId;
  readonly baseMoon: Moon;
  readonly orbitalPhaseRad: number; // [0, 2π)
  readonly relativePositionKm: Vector3D; // Vector from parent planet center
  readonly rotationAngleRad: number; // Tidally-locked rotation angle
}

/**
 * Aggregated temporal state for an entire materialized star system.
 */
export interface SystemTemporalState {
  readonly entityId: EntityId;
  readonly year: Year;
  readonly habitableZoneAU: HabitableZoneAU;
  readonly stars: ReadonlyMap<EntityId, StellarTemporalState>;
  readonly planets: ReadonlyMap<EntityId, PlanetaryTemporalState>;
  readonly moons: ReadonlyMap<EntityId, MoonTemporalState>;
}

/**
 * Categorical classifications of astronomical events.
 */
export type AstronomicalEventType =
  | 'STELLAR_STAGE_CHANGE'
  | 'SUPERNOVA'
  | 'PLANETARY_CLIMATE_SHIFT'
  | 'HABITABLE_ZONE_CROSSING'
  | 'ORBITAL_MILESTONE';

export type EventSeverity = 'INFO' | 'NOTABLE' | 'CATACLYSMIC';

/**
 * Deterministic astronomical event.
 */
export interface AstronomicalEvent {
  readonly eventId: string;
  readonly entityId: EntityId;
  readonly entityName: string;
  readonly year: Year;
  readonly eventType: AstronomicalEventType;
  readonly severity: EventSeverity;
  readonly description: string;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

/**
 * In-memory simulation checkpoint for fast deterministic restoration.
 */
export interface SimulationCheckpoint {
  readonly id: string;
  readonly label: string;
  readonly year: Year;
  readonly capturedAtTimestamp: number;
  readonly systemStates: ReadonlyMap<EntityId, SystemTemporalState>;
  readonly eventCount: number;
}

/**
 * Temporal clock configuration and state.
 */
export interface ClockState {
  readonly currentYear: Year;
  readonly isPaused: boolean;
  readonly speed: number; // Years per frame/tick when playing
}

/**
 * Telemetry metrics for developer diagnostics.
 */
export interface TemporalTelemetry {
  readonly currentYear: Year;
  readonly isPaused: boolean;
  readonly speed: number;
  readonly cachedSystemsCount: number;
  readonly cachedPlanetsCount: number;
  readonly eventCount: number;
  readonly checkpointCount: number;
  readonly activeStellarStage?: StellarEvolutionStage;
  readonly activeStarAgeYears?: number;
  readonly activeLuminositySolar?: number;
  readonly activeSurfaceTempKelvin?: number;
  readonly activeHabitableZoneAU?: HabitableZoneAU;
  readonly activePlanetTempKelvin?: number;
  readonly activeBiosphereEligibility?: boolean;
}
