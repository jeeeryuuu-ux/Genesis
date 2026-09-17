/**
 * @license Apache-2.0
 * GENESIS EXPANSION STATE CACHE (PHASE 8)
 *
 * High-performance O(1) in-memory memoization cache for materialized interplanetary
 * civilization states and lightweight summaries across temporal scrubbing iterations.
 */

import type { EntityId, Year } from '../../core/types.js';
import type {
  InterplanetaryCivilizationState,
  InterplanetaryExpansionSummary,
} from './types.js';

export class ExpansionStateCache {
  private readonly states = new Map<string, InterplanetaryCivilizationState>();
  private readonly summaries = new Map<string, InterplanetaryExpansionSummary>();

  private makeKey(planetId: EntityId, year: Year): string {
    return `${planetId}@${year}`;
  }

  public getExpansionState(
    planetId: EntityId,
    year: Year
  ): InterplanetaryCivilizationState | undefined {
    return this.states.get(this.makeKey(planetId, year));
  }

  public setExpansionState(
    planetId: EntityId,
    year: Year,
    state: InterplanetaryCivilizationState
  ): void {
    this.states.set(this.makeKey(planetId, year), state);
  }

  public getExpansionSummary(
    planetId: EntityId,
    year: Year
  ): InterplanetaryExpansionSummary | undefined {
    return this.summaries.get(this.makeKey(planetId, year));
  }

  public setExpansionSummary(
    planetId: EntityId,
    year: Year,
    summary: InterplanetaryExpansionSummary
  ): void {
    this.summaries.set(this.makeKey(planetId, year), summary);
  }

  public clear(): void {
    this.states.clear();
    this.summaries.clear();
  }
}
