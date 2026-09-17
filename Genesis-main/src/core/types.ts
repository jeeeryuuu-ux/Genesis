/**
 * @license Apache-2.0
 * GENESIS CORE TYPES
 * Foundational primitives for deterministic universe simulation.
 */

/**
 * A 32-bit unsigned integer seed representing an initial entropy state.
 * Valid range: [0, 4294967295] (0x0 to 0xFFFFFFFF).
 */
export type Seed = number;

/**
 * Canonical hierarchical identifier for any entity in the universe.
 * Format follows the navigation path: "u:<seed>/g:<idx>/s:<idx>/p:<idx>..."
 */
export type EntityId = string;

/**
 * Discrete simulation epoch time in standard planetary years.
 */
export type Year = number;

/**
 * Immutable 3-dimensional Cartesian vector.
 */
export interface Vector3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * Scale tiers supported by the GENESIS cosmic observer model.
 */
export type ScaleTier =
  | 'UNIVERSE'
  | 'GALAXY'
  | 'STAR_SYSTEM'
  | 'STAR'
  | 'PLANET'
  | 'MOON'
  | 'CIVILIZATION'
  | 'CITY'
  | 'INDIVIDUAL';

/**
 * Complete hierarchical breadcrumb for targeted celestial and demographic focus.
 */
export interface NavigationPath {
  readonly tier: ScaleTier;
  readonly universeSeed: Seed;
  readonly galaxyIndex?: number;
  readonly systemIndex?: number;
  readonly starIndex?: number;
  readonly planetIndex?: number;
  readonly moonIndex?: number;
  readonly civilizationIndex?: number;
  readonly cityIndex?: number;
  readonly individualIndex?: number;
}

// ============================================================================
// ASTRONOMICAL ENTITY TYPES
// ============================================================================

/**
 * Procedural Universe root metadata envelope.
 */
export interface Universe {
  readonly seed: Seed;
  readonly name: string;
  readonly ageYears: number; // e.g. 13.8 billion years
  readonly totalGalaxiesEstimate: number; // Order-of-magnitude estimate (e.g. 2e11)
  readonly cosmologicalConstant: number; // Procedural simulation parameter [0, 1]
}

export type GalaxyType = 'SPIRAL' | 'ELLIPTICAL' | 'LENTICULAR' | 'IRREGULAR';

export interface SpiralParameters {
  readonly armCount: number;
  readonly armTightness: number; // Pitch angle / winding factor [0.1, 0.5]
  readonly thicknessLightYears: number;
  readonly bulgeRatio: number; // Ratio of bulge radius to disk radius [0.05, 0.4]
  readonly densityFalloff: number; // Exponential decay coefficient
  readonly rotationalOrientationRad: number; // [0, 2π)
  readonly verticalScatter: number; // Z-axis star scatter factor
}

export interface Galaxy {
  readonly id: EntityId;
  readonly seed: Seed;
  readonly name: string;
  readonly type: GalaxyType;
  readonly position: Vector3D; // Macro coordinates in cosmic filament grid
  readonly radiusLightYears: number;
  readonly starCountEstimate: number; // Order-of-magnitude estimate (e.g. 250 billion)
  readonly coreBlackHoleMassSolar: number; // Supermassive black hole mass in solar masses
  readonly spiralParams?: SpiralParameters;
}

export type SpectralClass =
  | 'O'
  | 'B'
  | 'A'
  | 'F'
  | 'G'
  | 'K'
  | 'M'
  | 'NEUTRON'
  | 'BLACK_HOLE';

export interface Star {
  readonly id: EntityId;
  readonly seed: Seed;
  readonly name: string;
  readonly spectralClass: SpectralClass;
  readonly massSolar: number; // Relative to Sol (1.0 = 1 Solar Mass)
  readonly radiusSolar: number; // Relative to Sol (1.0 = 1 Solar Radius)
  readonly luminositySolar: number; // Relative to Sol (1.0 = 1 Solar Luminosity)
  readonly surfaceTempKelvin: number;
}

export interface HabitableZoneAU {
  readonly inner: number; // AU
  readonly outer: number; // AU
}

export interface StarSystem {
  readonly id: EntityId;
  readonly seed: Seed;
  readonly galaxyId: EntityId;
  readonly name: string;
  readonly positionInGalaxy: Vector3D; // Cylindrical/Cartesian galactic coordinates
  readonly stars: readonly Star[];
  readonly planetCount: number;
  readonly habitableZoneAU: HabitableZoneAU;
}

export type PlanetType =
  | 'TERRESTRIAL'
  | 'OCEAN'
  | 'DESERT'
  | 'GAS_GIANT'
  | 'ICE_GIANT'
  | 'LAVA'
  | 'BARREN';

/**
 * Atmospheric fractions (summing to ~1.0) and surface pressure.
 */
export interface AtmosphereComposition {
  readonly nitrogen: number;
  readonly oxygen: number;
  readonly carbonDioxide: number;
  readonly argon: number;
  readonly methane: number;
  readonly waterVapor: number;
  readonly hydrogenHelium: number;
  readonly surfacePressureAtm: number; // In Earth atmospheres (1.0 = 1 atm)
}

export interface Moon {
  readonly id: EntityId;
  readonly seed: Seed;
  readonly name: string;
  readonly radiusKm: number;
  readonly orbitalDistanceKm: number;
  readonly orbitalPeriodDays: number;
  readonly tidallyLocked: boolean;
}

export interface Planet {
  readonly id: EntityId;
  readonly seed: Seed;
  readonly systemId: EntityId;
  readonly name: string;
  readonly type: PlanetType;
  readonly semiMajorAxisAU: number; // Distance from primary star
  readonly orbitalPeriodDays: number; // Keplerian period
  readonly eccentricity: number; // [0.0, 0.4]
  readonly radiusKm: number; // Earth ≈ 6,371 km
  readonly massEarth: number; // Earth = 1.0
  readonly surfaceGravityG: number; // Earth = 1.0 g
  readonly averageTempKelvin: number;
  readonly atmosphere: AtmosphereComposition;
  readonly hydrosphereCoverage: number; // [0.0, 1.0]
  readonly hasBiosphere: boolean; // Eligibility for organic life
  readonly moonCount: number;
  readonly moons: readonly Moon[];
}

