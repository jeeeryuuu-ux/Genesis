/**
 * @license Apache-2.0
 * GENESIS ORBITAL INFRASTRUCTURE MODEL (PHASE 8)
 *
 * Deterministically constructs and updates persistent artificial orbital infrastructure
 * around the homeworld and colonized celestial bodies.
 */

import { DOMAIN } from '../../core/domains.js';
import { hash32WithSalt } from '../../core/hash.js';
import { createPRNG } from '../../core/prng.js';
import type { EntityId, Year } from '../../core/types.js';
import type { Civilization } from '../civilization/types.js';
import type {
  OrbitalInfrastructure,
  OrbitalInfrastructureType,
  SpacefaringProfile,
} from './types.js';

interface InfrastructureTemplate {
  readonly type: OrbitalInfrastructureType;
  readonly nameSuffix: string;
  readonly orbitalThreshold: number;
  readonly energyThreshold: number;
  readonly automationThreshold: number;
  readonly basePopCapacity: number;
  readonly resourceCost: number;
  readonly energyOutput: number;
}

const INFRASTRUCTURE_TEMPLATES: readonly InfrastructureTemplate[] = [
  {
    type: 'COMMUNICATION_CONSTELLATION',
    nameSuffix: 'Global Comms Grid',
    orbitalThreshold: 0.3,
    energyThreshold: 0.2,
    automationThreshold: 0.2,
    basePopCapacity: 0,
    resourceCost: 20,
    energyOutput: 5,
  },
  {
    type: 'RESEARCH_STATION',
    nameSuffix: 'Orbital Laboratory Complex',
    orbitalThreshold: 0.42,
    energyThreshold: 0.35,
    automationThreshold: 0.3,
    basePopCapacity: 120,
    resourceCost: 60,
    energyOutput: 15,
  },
  {
    type: 'ORBITAL_HABITAT',
    nameSuffix: 'Orbital O’Neill Colony',
    orbitalThreshold: 0.58,
    energyThreshold: 0.5,
    automationThreshold: 0.45,
    basePopCapacity: 25_000,
    resourceCost: 250,
    energyOutput: 80,
  },
  {
    type: 'SOLAR_COLLECTOR_ARRAY',
    nameSuffix: 'Circumsolar Energy Collector',
    orbitalThreshold: 0.65,
    energyThreshold: 0.6,
    automationThreshold: 0.55,
    basePopCapacity: 50,
    resourceCost: 180,
    energyOutput: 500,
  },
  {
    type: 'MANUFACTURING_FOUNDRY',
    nameSuffix: 'Zero-G Metallurgical Foundry',
    orbitalThreshold: 0.72,
    energyThreshold: 0.65,
    automationThreshold: 0.7,
    basePopCapacity: 2_000,
    resourceCost: 350,
    energyOutput: 120,
  },
  {
    type: 'ORBITAL_SHIPYARD',
    nameSuffix: 'Interplanetary Drydock',
    orbitalThreshold: 0.8,
    energyThreshold: 0.75,
    automationThreshold: 0.75,
    basePopCapacity: 5_000,
    resourceCost: 500,
    energyOutput: 250,
  },
];

/**
 * Deterministically constructs active orbital infrastructure around a celestial body.
 */
export function materializeOrbitalInfrastructure(
  civilization: Civilization,
  parentBodyId: EntityId,
  parentBodyName: string,
  profile: SpacefaringProfile,
  currentYear: Year
): readonly OrbitalInfrastructure[] {
  if (!profile.isSpacefaring || profile.orbitalCapability < 0.28) {
    return [];
  }

  const infraSeed = hash32WithSalt(civilization.seed, parentBodyId, DOMAIN.ORBITAL);
  const prng = createPRNG(infraSeed);

  const structures: OrbitalInfrastructure[] = [];

  // Determine construction start epoch based on emergence and spaceflight
  const spaceflightAgeYears = Math.round(
    civilization.emergenceEpochYear + (1.0 - profile.orbitalCapability) * 15_000
  );

  for (let i = 0; i < INFRASTRUCTURE_TEMPLATES.length; i++) {
    const tmpl = INFRASTRUCTURE_TEMPLATES[i];

    // Check technological and capability gates
    if (
      profile.orbitalCapability >= tmpl.orbitalThreshold &&
      profile.energyCapability >= tmpl.energyThreshold &&
      profile.automationCapability >= tmpl.automationThreshold
    ) {
      // Offset construction epoch deterministically
      const constructionEpoch = spaceflightAgeYears + i * 800 + prng.nextInt(50, 400);

      if (currentYear >= constructionEpoch) {
        // Operational state derived from civilization status and stability
        let operationalState: 'OPERATIONAL' | 'DEGRADED' | 'ABANDONED' = 'OPERATIONAL';
        if (civilization.status === 'EXTINCT') {
          operationalState = 'ABANDONED';
        } else if (civilization.status === 'COLLAPSING' || civilization.stability.stabilityIndex < 0.3) {
          operationalState = 'DEGRADED';
        }

        // Scale population capacity by technology and automation
        const popCapacity = Math.round(
          tmpl.basePopCapacity * (1.0 + profile.automationCapability * 2.0)
        );

        const currentPop =
          operationalState === 'ABANDONED'
            ? 0
            : operationalState === 'DEGRADED'
            ? Math.round(popCapacity * 0.2)
            : Math.round(popCapacity * (0.6 + prng.nextFloat(0, 0.35)));

        const structureId = `${parentBodyId}/infra_${tmpl.type.toLowerCase()}_${i}`;

        structures.push({
          id: structureId,
          civilizationId: civilization.id,
          parentBodyId,
          name: `${parentBodyName} ${tmpl.nameSuffix}`,
          type: tmpl.type,
          constructionEpoch,
          populationCapacity: popCapacity,
          population: currentPop,
          resourceRequirement: tmpl.resourceCost,
          energyOutput: tmpl.energyOutput,
          operationalState,
        });
      }
    }
  }

  return structures;
}
