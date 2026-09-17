/**
 * @license Apache-2.0
 * GENESIS BIOLOGICAL EVENT ENGINE
 *
 * Deterministically detects and logs macro-biological milestones:
 * - Life origin (abiogenesis)
 * - Complexity transitions (unicellular -> multicellular -> complex)
 * - Species emergence and speciation divergence
 * - Mass extinctions and ecosystem collapses
 */

import { DOMAIN } from '../../core/domains.js';
import { combineSeeds } from '../../core/hash.js';
import type { EntityId, Planet, Seed, Year } from '../../core/types.js';
import type { BiologicalEvent, BiologicalEventType, Biosphere, Species } from './types.js';

/**
 * Creates a deterministic biological event.
 */
function createBiologicalEvent(
  rootSeed: Seed,
  planetId: EntityId,
  planetName: string,
  year: Year,
  eventType: BiologicalEventType,
  severity: BiologicalEvent['severity'],
  description: string,
  species?: Species,
  metadata?: Record<string, string | number | boolean>
): BiologicalEvent {
  const eventHash = combineSeeds(rootSeed, year >>> 0, DOMAIN.EVENT ^ DOMAIN.BIOLOGY);
  const eventId = `bio_${planetId.replace(/[^a-zA-Z0-9]/g, '_')}_${eventType}_${year}_${eventHash.toString(16)}`;

  return {
    eventId,
    planetId,
    planetName,
    year,
    eventType,
    severity,
    description,
    speciesId: species?.id,
    speciesName: species?.name,
    metadata,
  };
}

/**
 * Detects biological milestone events between two biosphere states across cosmic time.
 */
export function detectBiologicalEvents(
  rootSeed: Seed,
  planet: Planet,
  prevBiosphere: Biosphere | undefined,
  nextBiosphere: Biosphere
): readonly BiologicalEvent[] {
  const events: BiologicalEvent[] = [];

  // 1. Life Origin (Abiogenesis)
  if (!prevBiosphere?.summary.hasLife && nextBiosphere.summary.hasLife) {
    events.push(
      createBiologicalEvent(
        rootSeed,
        planet.id,
        planet.name,
        nextBiosphere.summary.abiogenesisYear ?? nextBiosphere.epochYear,
        'LIFE_ORIGIN',
        'NOTABLE',
        `Abiogenesis detected on ${planet.name}: organic metabolic structures emerge via ${nextBiosphere.summary.dominantOrigin} pathway.`,
        undefined,
        {
          origin: nextBiosphere.summary.dominantOrigin ?? 'UNKNOWN',
          habitabilityScore: nextBiosphere.summary.habitability.score,
        }
      )
    );
  }

  // 2. Complexity Transitions
  if (
    prevBiosphere?.summary.hasLife &&
    nextBiosphere.summary.hasLife &&
    prevBiosphere.summary.highestComplexity !== nextBiosphere.summary.highestComplexity
  ) {
    events.push(
      createBiologicalEvent(
        rootSeed,
        planet.id,
        planet.name,
        nextBiosphere.epochYear,
        'COMPLEXITY_TRANSITION',
        'NOTABLE',
        `Biosphere complexity transition on ${planet.name}: life advances to ${nextBiosphere.summary.highestComplexity} organization.`,
        undefined,
        {
          from: prevBiosphere.summary.highestComplexity,
          to: nextBiosphere.summary.highestComplexity,
        }
      )
    );
  }

  // 3. Extinction & Mass Extinction Detection
  if (prevBiosphere?.summary.hasLife && nextBiosphere.summary.hasLife) {
    const newlyExtinct = nextBiosphere.extinctSpecies.filter(
      (ext) => !prevBiosphere.extinctSpecies.some((p) => p.id === ext.id)
    );

    if (newlyExtinct.length >= 2 || (prevBiosphere.activeSpecies.length > 0 && nextBiosphere.activeSpecies.length === 0)) {
      events.push(
        createBiologicalEvent(
          rootSeed,
          planet.id,
          planet.name,
          nextBiosphere.epochYear,
          'MASS_EXTINCTION',
          'CATACLYSMIC',
          `Mass extinction event on ${planet.name}: severe environmental shift resulted in collapse of ${newlyExtinct.length} biological lineages.`,
          undefined,
          {
            extinctCount: newlyExtinct.length,
            remainingActive: nextBiosphere.activeSpecies.length,
          }
        )
      );
    }
  }

  // 4. Species Divergence
  if (prevBiosphere && nextBiosphere.activeSpecies.length > prevBiosphere.activeSpecies.length) {
    const newSpecies = nextBiosphere.activeSpecies.filter(
      (sp) => !prevBiosphere.activeSpecies.some((p) => p.id === sp.id)
    );

    for (const sp of newSpecies) {
      events.push(
        createBiologicalEvent(
          rootSeed,
          planet.id,
          planet.name,
          nextBiosphere.epochYear,
          'SPECIES_DIVERGENCE',
          'INFO',
          `Speciation divergence: ${sp.name} occupies ${sp.traits.ecological.habitatPreference} niche as ${sp.traits.ecological.trophicRole}.`,
          sp,
          {
            complexity: sp.complexity,
            trophicRole: sp.traits.ecological.trophicRole,
          }
        )
      );
    }
  }

  return events;
}
