/**
 * @license Apache-2.0
 * GENESIS EXPANSION NETWORK & ROUTE EVALUATOR (PHASE 8)
 *
 * Deterministically constructs interplanetary transport graphs and determines
 * transit feasibility, infrastructure thresholds, and supply route statuses.
 */

import type { EntityId } from '../../core/types.js';
import type {
  ColonyState,
  DestinationAnalysis,
  ExpansionRoute,
  SpacefaringProfile,
} from './types.js';

/**
 * Builds deterministic interplanetary routes from the homeworld to candidate destinations.
 */
export function buildExpansionRoutes(
  homeworldId: EntityId,
  destinations: readonly DestinationAnalysis[],
  profile: SpacefaringProfile,
  colonies: readonly ColonyState[],
  isSystemStable: boolean = true
): readonly ExpansionRoute[] {
  const routes: ExpansionRoute[] = [];
  const colonizedDestinationIds = new Set(colonies.map((c) => c.destinationId));

  for (const dest of destinations) {
    if (dest.classification === 'HOMEWORLD') continue;

    // Travel difficulty derives from distance and destination gravity well
    const travelDifficulty = Math.max(
      0.05,
      Math.min(1.0, dest.travelEnergyRequirement / 150)
    );

    // Energy requirement scales with delta-v and payload transfer cost
    const energyRequirement = Math.max(10, Math.round(dest.travelEnergyRequirement * 2.5));

    // Infrastructure threshold required to open the route
    const infrastructureRequirement = Math.max(
      0.2,
      Math.min(0.95, dest.classification === 'MOON' ? 0.3 : 0.45 + travelDifficulty * 0.4)
    );

    // Route viability
    const viability = Math.max(
      0.01,
      Math.min(
        1.0,
        dest.viability * 0.6 +
          (profile.propulsionCapability >= infrastructureRequirement ? 0.4 : 0.1)
      )
    );

    // Route status determination
    let status: 'PROPOSED' | 'ESTABLISHED' | 'ACTIVE' | 'DISRUPTED' = 'PROPOSED';

    if (!profile.isSpacefaring) {
      status = 'PROPOSED';
    } else if (!isSystemStable && colonizedDestinationIds.has(dest.bodyId)) {
      status = 'DISRUPTED';
    } else if (colonizedDestinationIds.has(dest.bodyId)) {
      status = 'ACTIVE';
    } else if (profile.propulsionCapability >= infrastructureRequirement) {
      status = 'ESTABLISHED';
    } else {
      status = 'PROPOSED';
    }

    routes.push({
      originId: homeworldId,
      destinationId: dest.bodyId,
      travelDifficulty,
      energyRequirement,
      infrastructureRequirement,
      viability,
      status,
    });
  }

  return routes;
}
