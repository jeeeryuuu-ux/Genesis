/**
 * @license Apache-2.0
 * GENESIS RENDERING & VISUALIZATION TYPES
 */

import type {
  EntityId,
  Galaxy,
  Moon,
  NavigationPath,
  Planet,
  ScaleTier,
  Seed,
  SpectralClass,
  StarSystem,
  Universe,
} from '../core/types.js';

/**
 * Visual metadata for an individual sampled star in a galaxy point cloud.
 */
export interface SampledStarVisual {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly size: number;
  readonly spectralClass: SpectralClass;
}

/**
 * Bounded visual stellar population sample derived deterministically from galaxy seed.
 */
export interface GalaxyVisualSample {
  readonly galaxySeed: Seed;
  readonly galaxyIndex: number;
  readonly totalSampleCount: number;
  readonly positions: Float32Array; // x, y, z triplets
  readonly colors: Float32Array;    // r, g, b triplets
  readonly sizes: Float32Array;     // point sizes
  readonly selectableSystems: readonly SelectableSystemNode[];
}

/**
 * A selectable star system node in the galaxy interior.
 */
export interface SelectableSystemNode {
  readonly systemIndex: number;
  readonly systemSeed: Seed;
  readonly position: [number, number, number];
  readonly name: string;
  readonly spectralClass: SpectralClass;
}

/**
 * Current visual selection state in the cosmic viewport.
 */
export interface CosmicSelection {
  readonly universe?: Universe;
  readonly galaxy?: Galaxy;
  readonly starSystem?: StarSystem;
  readonly planet?: Planet;
  readonly moon?: Moon;
  readonly path: NavigationPath;
}

/**
 * Real-time runtime renderer performance and object statistics.
 */
export interface RendererStats {
  readonly fps: number;
  readonly visibleStars: number;
  readonly visiblePlanets: number;
  readonly visibleMoons: number;
  readonly objectCount: number;
  readonly drawCalls: number;
  readonly currentScale: ScaleTier;
}
