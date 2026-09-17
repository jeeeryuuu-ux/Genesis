/**
 * @license Apache-2.0
 * GENESIS MULTI-SCALE SPATIAL CONVERSION SYSTEM
 *
 * Centralizes spatial scaling and coordinate normalization across cosmic tiers:
 * - Universe (Mpc / Million Light-Years)
 * - Galaxy (kpc / Thousand Light-Years)
 * - Star System (Astronomical Units - AU)
 * - Planet & Moon (Kilometers / Earth Radii)
 *
 * Prevents 32-bit floating-point depth buffer precision degradation and visual jitter.
 */

import type { PlanetType, ScaleTier, Vector3D } from '../core/types.js';

export interface ScaleTierConfig {
  readonly tier: ScaleTier;
  readonly name: string;
  readonly unitName: string;
  readonly cameraNear: number;
  readonly cameraFar: number;
  readonly defaultCameraDistance: number;
  readonly minCameraDistance: number;
  readonly maxCameraDistance: number;
}

export const SCALE_CONFIGS: Record<ScaleTier, ScaleTierConfig> = {
  UNIVERSE: {
    tier: 'UNIVERSE',
    name: 'Cosmic Web Filament',
    unitName: 'Mly (Million Light-Years)',
    cameraNear: 1,
    cameraFar: 10000,
    defaultCameraDistance: 600,
    minCameraDistance: 50,
    maxCameraDistance: 2500,
  },
  GALAXY: {
    tier: 'GALAXY',
    name: 'Galactic Interior',
    unitName: 'kly (Thousand Light-Years)',
    cameraNear: 0.5,
    cameraFar: 4000,
    defaultCameraDistance: 320,
    minCameraDistance: 20,
    maxCameraDistance: 1200,
  },
  STAR_SYSTEM: {
    tier: 'STAR_SYSTEM',
    name: 'Circumstellar Orbital Plane',
    unitName: 'AU (Astronomical Units)',
    cameraNear: 0.1,
    cameraFar: 2000,
    defaultCameraDistance: 120,
    minCameraDistance: 5,
    maxCameraDistance: 600,
  },
  STAR: {
    tier: 'STAR',
    name: 'Stellar Corona',
    unitName: 'Solar Radii',
    cameraNear: 0.05,
    cameraFar: 500,
    defaultCameraDistance: 15,
    minCameraDistance: 1,
    maxCameraDistance: 80,
  },
  PLANET: {
    tier: 'PLANET',
    name: 'Planetary Orbital Sphere',
    unitName: 'km (Kilometers)',
    cameraNear: 0.05,
    cameraFar: 600,
    defaultCameraDistance: 35,
    minCameraDistance: 2,
    maxCameraDistance: 150,
  },
  MOON: {
    tier: 'MOON',
    name: 'Natural Satellite Vicinity',
    unitName: 'km (Kilometers)',
    cameraNear: 0.02,
    cameraFar: 300,
    defaultCameraDistance: 15,
    minCameraDistance: 1,
    maxCameraDistance: 80,
  },
  CIVILIZATION: {
    tier: 'CIVILIZATION',
    name: 'Demographic Scale',
    unitName: 'Surface Sectors',
    cameraNear: 0.01,
    cameraFar: 100,
    defaultCameraDistance: 10,
    minCameraDistance: 1,
    maxCameraDistance: 50,
  },
  CITY: {
    tier: 'CITY',
    name: 'Urban Metropolis',
    unitName: 'Meters',
    cameraNear: 0.01,
    cameraFar: 100,
    defaultCameraDistance: 5,
    minCameraDistance: 0.5,
    maxCameraDistance: 25,
  },
  INDIVIDUAL: {
    tier: 'INDIVIDUAL',
    name: 'Individual Entity',
    unitName: 'Centimeters',
    cameraNear: 0.01,
    cameraFar: 50,
    defaultCameraDistance: 2,
    minCameraDistance: 0.2,
    maxCameraDistance: 10,
  },
};

/**
 * Converts universe macro filament coordinates (in light-years) to Three.js scene coordinates.
 * Scale: 1 unit = 250,000 light-years.
 */
export function universeCoordsToScene(coord: Vector3D): [number, number, number] {
  const scale = 1 / 250_000;
  return [coord.x * scale, coord.y * scale, coord.z * scale];
}

/**
 * Converts galaxy galactic coordinates (in light-years) to Three.js scene coordinates.
 * Scale: 1 unit = 400 light-years.
 * A 100,000 light-year galaxy disk has radius ~125 scene units.
 */
export function galaxyCoordsToScene(coord: Vector3D): [number, number, number] {
  const scale = 1 / 400;
  return [coord.x * scale, coord.y * scale, coord.z * scale];
}

/**
 * Converts astronomical units (AU) to star system view scene units.
 * Scale: 1 AU = 16 scene units.
 * Mercury (0.39 AU) ≈ 6.2 units
 * Earth (1.0 AU) = 16 units
 * Jupiter (5.2 AU) ≈ 83 units
 * Neptune (30 AU) ≈ 480 units
 */
export function auToStarSystemUnits(au: number): number {
  return au * 16;
}

/**
 * Compresses planetary radius (km) logarithmically for visual clarity in 3D views.
 * Preserves noticeable relative size ordering (Gas Giant > Ice Giant > Ocean/Terrestrial > Desert > Barren).
 */
export function planetRadiusToSceneUnits(radiusKm: number, type: PlanetType): number {
  switch (type) {
    case 'GAS_GIANT':
      return 2.4 + Math.log10(Math.max(1, radiusKm / 30000)) * 1.5;
    case 'ICE_GIANT':
      return 1.8 + Math.log10(Math.max(1, radiusKm / 15000)) * 1.2;
    case 'OCEAN':
    case 'TERRESTRIAL':
      return 1.1 + Math.log10(Math.max(1, radiusKm / 5000)) * 0.8;
    case 'DESERT':
    case 'LAVA':
      return 0.95 + Math.log10(Math.max(1, radiusKm / 4000)) * 0.7;
    case 'BARREN':
      return 0.75 + Math.log10(Math.max(1, radiusKm / 2000)) * 0.6;
  }
}

/**
 * Compresses moon radius (km) for scene visualization.
 */
export function moonRadiusToSceneUnits(radiusKm: number): number {
  return Math.max(0.25, 0.25 + Math.log10(Math.max(1, radiusKm / 200)) * 0.35);
}

/**
 * Scales moon orbital distance (km) relative to parent planet radius.
 */
export function moonOrbitToSceneUnits(orbitalDistanceKm: number, planetRadiusUnits: number): number {
  // Compress 80,000 - 2,000,000 km into 4 - 24 units beyond planet surface
  const logDist = Math.log10(Math.max(10_000, orbitalDistanceKm));
  return planetRadiusUnits + 3.0 + (logDist - 4.9) * 8.0;
}
