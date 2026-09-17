/**
 * @license Apache-2.0
 * GENESIS ASTRONOMICAL EVENT ENGINE
 *
 * Emits and logs meaningful macro-astronomical events deterministically:
 * - Stellar stage changes (e.g. Main Sequence -> Red Giant)
 * - Supernova cataclysms
 * - Habitable zone crossings
 * - Planetary climate shifts (snowball glaciation, runaway greenhouse)
 *
 * CRITICAL REQUIREMENTS:
 * - Deterministic Event IDs: derived purely from root seed, entityId, eventType, and year.
 * - Meaningful events only (NO per-frame or per-orbit log spam).
 */

import { hash32 } from '../../core/hash.js';
import type { Seed, Year } from '../../core/types.js';
import type {
  AstronomicalEvent,
  AstronomicalEventType,
  EventSeverity,
  PlanetaryTemporalState,
  StellarTemporalState,
  SystemTemporalState,
} from './types.js';

/**
 * Computes a deterministic event ID string from entity, type, and epoch.
 */
export function generateDeterministicEventId(
  rootSeed: Seed,
  entityId: string,
  eventType: AstronomicalEventType,
  year: Year
): string {
  let charHash = 0;
  for (let i = 0; i < entityId.length; i++) {
    charHash = (Math.imul(charHash, 31) + entityId.charCodeAt(i)) >>> 0;
  }
  const h1 = hash32(charHash, rootSeed);
  const h2 = hash32(year, h1);
  return `evt_${eventType.toLowerCase()}_${h2.toString(16).padStart(8, '0')}`;
}

/**
 * Detects meaningful astronomical events when a system transitions from
 * previousState to nextState.
 */
export function detectSystemEvents(
  rootSeed: Seed,
  previousState: SystemTemporalState | undefined,
  nextState: SystemTemporalState
): readonly AstronomicalEvent[] {
  if (!previousState) {
    return [];
  }

  const events: AstronomicalEvent[] = [];

  // 1. Detect stellar evolution stage transitions
  for (const [starId, nextStar] of nextState.stars) {
    const prevStar = previousState.stars.get(starId);
    if (prevStar && prevStar.stage !== nextStar.stage) {
      const isSupernova =
        (prevStar.stage === 'MAIN_SEQUENCE' || prevStar.stage === 'RED_GIANT') &&
        (nextStar.stage === 'NEUTRON_STAR' || nextStar.stage === 'BLACK_HOLE');

      if (isSupernova) {
        events.push({
          eventId: generateDeterministicEventId(rootSeed, starId, 'SUPERNOVA', nextState.year),
          entityId: starId,
          entityName: nextStar.baseStar.name,
          year: nextState.year,
          eventType: 'SUPERNOVA',
          severity: 'CATACLYSMIC',
          description: `Supernova explosion! Star ${nextStar.baseStar.name} (${nextStar.baseStar.massSolar.toFixed(1)} M☉) collapsed into a ${nextStar.stage === 'NEUTRON_STAR' ? 'Neutron Star' : 'Black Hole'}.`,
          metadata: {
            stage: nextStar.stage,
            massSolar: nextStar.baseStar.massSolar,
          },
        });
      } else {
        const severity: EventSeverity =
          nextStar.stage === 'RED_GIANT' || nextStar.stage === 'WHITE_DWARF'
            ? 'NOTABLE'
            : 'INFO';

        events.push({
          eventId: generateDeterministicEventId(
            rootSeed,
            starId,
            'STELLAR_STAGE_CHANGE',
            nextState.year
          ),
          entityId: starId,
          entityName: nextStar.baseStar.name,
          year: nextState.year,
          eventType: 'STELLAR_STAGE_CHANGE',
          severity,
          description: `Star ${nextStar.baseStar.name} evolved from ${prevStar.stage} to ${nextStar.stage}.`,
          metadata: {
            previousStage: prevStar.stage,
            currentStage: nextStar.stage,
            luminositySolar: nextStar.luminositySolar,
          },
        });
      }
    }
  }

  // 2. Detect planetary climate shifts & habitable zone crossings
  for (const [planetId, nextPlanet] of nextState.planets) {
    const prevPlanet = previousState.planets.get(planetId);
    if (!prevPlanet) continue;

    // Habitable zone crossing
    if (prevPlanet.isInHabitableZone !== nextPlanet.isInHabitableZone) {
      events.push({
        eventId: generateDeterministicEventId(
          rootSeed,
          planetId,
          'HABITABLE_ZONE_CROSSING',
          nextState.year
        ),
        entityId: planetId,
        entityName: nextPlanet.basePlanet.name,
        year: nextState.year,
        eventType: 'HABITABLE_ZONE_CROSSING',
        severity: 'NOTABLE',
        description: nextPlanet.isInHabitableZone
          ? `Planet ${nextPlanet.basePlanet.name} entered the dynamic circumstellar habitable zone.`
          : `Planet ${nextPlanet.basePlanet.name} exited the dynamic circumstellar habitable zone.`,
        metadata: {
          isInHabitableZone: nextPlanet.isInHabitableZone,
          distanceAU: nextPlanet.basePlanet.semiMajorAxisAU,
        },
      });
    }

    // Climate shift: Snowball transition or Runaway greenhouse
    const wasGlaciated = prevPlanet.iceCoverage >= 0.75;
    const isGlaciated = nextPlanet.iceCoverage >= 0.75;
    if (!wasGlaciated && isGlaciated) {
      events.push({
        eventId: generateDeterministicEventId(
          rootSeed,
          planetId,
          'PLANETARY_CLIMATE_SHIFT',
          nextState.year
        ),
        entityId: planetId,
        entityName: nextPlanet.basePlanet.name,
        year: nextState.year,
        eventType: 'PLANETARY_CLIMATE_SHIFT',
        severity: 'NOTABLE',
        description: `Global glaciation event on ${nextPlanet.basePlanet.name}: temperature dropped to ${nextPlanet.effectiveTempKelvin} K.`,
        metadata: {
          effectiveTempKelvin: nextPlanet.effectiveTempKelvin,
          iceCoverage: nextPlanet.iceCoverage,
        },
      });
    }

    const wasRunaway = prevPlanet.effectiveTempKelvin >= 373;
    const isRunaway = nextPlanet.effectiveTempKelvin >= 373;
    if (!wasRunaway && isRunaway) {
      events.push({
        eventId: generateDeterministicEventId(
          rootSeed,
          planetId,
          'PLANETARY_CLIMATE_SHIFT',
          nextState.year
        ),
        entityId: planetId,
        entityName: nextPlanet.basePlanet.name,
        year: nextState.year,
        eventType: 'PLANETARY_CLIMATE_SHIFT',
        severity: 'CATACLYSMIC',
        description: `Runaway greenhouse event on ${nextPlanet.basePlanet.name}: oceans vaporized at ${nextPlanet.effectiveTempKelvin} K.`,
        metadata: {
          effectiveTempKelvin: nextPlanet.effectiveTempKelvin,
        },
      });
    }
  }

  return events;
}

/**
 * EventManager encapsulates astronomical event storage, recent event querying, and clearance.
 */
export class EventManager {
  private eventList: AstronomicalEvent[] = [];

  public addEvent(event: AstronomicalEvent): void {
    this.eventList.push(event);
  }

  public addEvents(events: readonly AstronomicalEvent[]): void {
    this.eventList.push(...events);
  }

  public getEvents(): readonly AstronomicalEvent[] {
    return this.eventList;
  }

  public getRecentEvents(count: number = 50): readonly AstronomicalEvent[] {
    if (this.eventList.length <= count) {
      return [...this.eventList].reverse();
    }
    return this.eventList.slice(-count).reverse();
  }

  public clear(): void {
    this.eventList = [];
  }

  public get count(): number {
    return this.eventList.length;
  }
}
