/**
 * @license Apache-2.0
 * GENESIS TEMPORAL STATE CACHE
 *
 * Maintains a sparse in-memory delta cache for actively materialized entities.
 * Ensures strictly lazy simulation: only entities in active cosmic observation
 * or explicitly requested are evaluated.
 */

import type { EntityId } from '../../core/types.js';
import type { SystemTemporalState } from './types.js';

export class TemporalStateCache {
  private cache: Map<EntityId, SystemTemporalState> = new Map();

  public getSystemState(systemId: EntityId): SystemTemporalState | undefined {
    return this.cache.get(systemId);
  }

  public setSystemState(systemId: EntityId, state: SystemTemporalState): void {
    this.cache.set(systemId, state);
  }

  public hasSystemState(systemId: EntityId): boolean {
    return this.cache.has(systemId);
  }

  public removeSystemState(systemId: EntityId): boolean {
    return this.cache.delete(systemId);
  }

  public clear(): void {
    this.cache.clear();
  }

  public getMap(): ReadonlyMap<EntityId, SystemTemporalState> {
    return this.cache;
  }

  public getCounts(): {
    systems: number;
    stars: number;
    planets: number;
    moons: number;
  } {
    let stars = 0;
    let planets = 0;
    let moons = 0;
    for (const state of this.cache.values()) {
      stars += state.stars.size;
      planets += state.planets.size;
      moons += state.moons.size;
    }
    return {
      systems: this.cache.size,
      stars,
      planets,
      moons,
    };
  }
}
