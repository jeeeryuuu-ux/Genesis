/**
 * @license Apache-2.0
 * GENESIS CIVILIZATION STATE CACHE
 *
 * Provides high-performance, O(1) in-memory memoization for materialized
 * civilization entities, planetary summaries, and historical archives.
 */

import type { EntityId, Year } from '../../core/types.js';
import type { Civilization, CivilizationRecord, PlanetaryCivilizationSummary } from './types.js';

export class CivilizationStateCache {
  private readonly summaries = new Map<string, PlanetaryCivilizationSummary>();
  private readonly civilizations = new Map<string, readonly Civilization[]>();
  private readonly historicalRecords = new Map<string, Map<string, CivilizationRecord>>();

  private makeKey(planetId: EntityId, year: Year): string {
    return `${planetId}@${year}`;
  }

  public getSummary(planetId: EntityId, year: Year): PlanetaryCivilizationSummary | undefined {
    return this.summaries.get(this.makeKey(planetId, year));
  }

  public setSummary(planetId: EntityId, year: Year, summary: PlanetaryCivilizationSummary): void {
    this.summaries.set(this.makeKey(planetId, year), summary);
  }

  public getCivilizations(planetId: EntityId, year: Year): readonly Civilization[] | undefined {
    return this.civilizations.get(this.makeKey(planetId, year));
  }

  public setCivilizations(
    planetId: EntityId,
    year: Year,
    civs: readonly Civilization[]
  ): void {
    this.civilizations.set(this.makeKey(planetId, year), civs);
    // Automatically record civilizations into historical archive
    for (const civ of civs) {
      this.recordCivilization(civ.planetId, {
        civilizationId: civ.id,
        name: civ.name,
        emergenceEpoch: civ.emergenceEpochYear,
        extinctionEpoch: civ.extinctionEpochYear,
        primaryOriginSpecies: civ.speciesName,
        peakPopulation: civ.peakPopulation,
        peakTechnology: civ.technology.level,
        peakEra: civ.technology.era,
        extinctionCause: civ.stability.primaryStressFactor,
      });
    }
  }

  public recordCivilization(planetId: EntityId, record: CivilizationRecord): void {
    let planetRecords = this.historicalRecords.get(planetId);
    if (!planetRecords) {
      planetRecords = new Map<string, CivilizationRecord>();
      this.historicalRecords.set(planetId, planetRecords);
    }
    planetRecords.set(record.civilizationId, record);
  }

  public getHistoricalRecords(planetId: EntityId): readonly CivilizationRecord[] {
    const planetRecords = this.historicalRecords.get(planetId);
    return planetRecords ? Array.from(planetRecords.values()) : [];
  }

  public clear(): void {
    this.summaries.clear();
    this.civilizations.clear();
    this.historicalRecords.clear();
  }
}
