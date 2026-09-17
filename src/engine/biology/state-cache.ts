/**
 * @license Apache-2.0
 * GENESIS BIOLOGICAL STATE CACHE
 *
 * Sparse in-memory cache for materialized biospheres and lightweight summaries.
 * Keeps memory footprint lean by holding only actively observed celestial bodies.
 */

import type { EntityId, Year } from '../../core/types.js';
import type { Biosphere, BiosphereSummary } from './types.js';

export class BiologicalStateCache {
  private readonly summaryCache = new Map<string, BiosphereSummary>();
  private readonly biosphereCache = new Map<string, Biosphere>();

  private makeKey(planetId: EntityId, year: Year): string {
    return `${planetId}@${year}`;
  }

  public getSummary(planetId: EntityId, year: Year): BiosphereSummary | undefined {
    return this.summaryCache.get(this.makeKey(planetId, year));
  }

  public setSummary(planetId: EntityId, year: Year, summary: BiosphereSummary): void {
    this.summaryCache.set(this.makeKey(planetId, year), summary);
  }

  public getBiosphere(planetId: EntityId, year: Year): Biosphere | undefined {
    return this.biosphereCache.get(this.makeKey(planetId, year));
  }

  public setBiosphere(planetId: EntityId, year: Year, biosphere: Biosphere): void {
    this.biosphereCache.set(this.makeKey(planetId, year), biosphere);
    // Also cache the summary
    this.summaryCache.set(this.makeKey(planetId, year), biosphere.summary);
  }

  public clear(): void {
    this.summaryCache.clear();
    this.biosphereCache.clear();
  }

  public getCounts(): { summaries: number; biospheres: number } {
    return {
      summaries: this.summaryCache.size,
      biospheres: this.biosphereCache.size,
    };
  }
}
