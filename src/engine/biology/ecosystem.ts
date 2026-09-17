/**
 * @license Apache-2.0
 * GENESIS ECOSYSTEM & FOOD WEB ENGINE
 *
 * Deterministically constructs sparse food webs, trophic networks,
 * biomass balances, and ecological stability indices for planetary biospheres.
 */

import { deriveEcosystemSeed } from '../../core/hierarchy.js';
import { createPRNG } from '../../core/prng.js';
import type { Planet } from '../../core/types.js';
import type { Ecosystem, EcosystemLink, LifeOriginType, Species } from './types.js';

/**
 * Procedurally establishes sparse trophic and predatory relationships between species.
 */
export function buildEcosystem(
  planet: Planet,
  speciesList: readonly Species[],
  dominantOrigin: LifeOriginType
): Ecosystem {
  const seed = deriveEcosystemSeed(planet.seed);
  const prng = createPRNG(seed);

  // 1. Determine primary planetary energy source
  let primaryEnergySource: Ecosystem['primaryEnergySource'] = 'STELLAR_RADIATION';
  if (dominantOrigin === 'HYDROTHERMAL') {
    primaryEnergySource = 'HYDROTHERMAL_VENT';
  } else if (dominantOrigin === 'SUBSURFACE') {
    primaryEnergySource = 'RADIOACTIVE_DECAY';
  } else if (dominantOrigin === 'CHEMOSYNTHETIC') {
    primaryEnergySource = 'ATMOSPHERIC_REDOX';
  }

  // Group active species by trophic role
  const active = speciesList.filter((s) => s.status !== 'EXTINCT');
  const producers = active.filter((s) => s.traits.ecological.trophicRole === 'PRODUCER');
  const consumers = active.filter(
    (s) => s.traits.ecological.trophicRole === 'CONSUMER' || s.traits.ecological.trophicRole === 'PREY'
  );
  const predators = active.filter((s) => s.traits.ecological.trophicRole === 'PREDATOR');
  const decomposers = active.filter(
    (s) =>
      s.traits.ecological.trophicRole === 'DECOMPOSER' ||
      s.traits.ecological.trophicRole === 'SCAVENGER'
  );

  const links: EcosystemLink[] = [];

  // Build sparse food web links:
  // 1. Consumers feed on Producers (Grazing)
  for (const consumer of consumers) {
    if (producers.length > 0) {
      // Connect to 1 or 2 producer species deterministically
      const producer = producers[prng.nextInt(0, producers.length - 1)];
      links.push({
        sourceSpeciesId: consumer.id,
        targetSpeciesId: producer.id,
        relationshipType: 'GRAZING',
        strength: Number(prng.nextFloat(0.4, 0.95).toFixed(2)),
      });
    }
  }

  // 2. Predators feed on Consumers / Prey (Predation)
  for (const predator of predators) {
    if (consumers.length > 0) {
      const prey = consumers[prng.nextInt(0, consumers.length - 1)];
      links.push({
        sourceSpeciesId: predator.id,
        targetSpeciesId: prey.id,
        relationshipType: 'PREDATION',
        strength: Number(prng.nextFloat(0.5, 0.98).toFixed(2)),
      });
    } else if (producers.length > 0) {
      // Fallback: direct omnivore/filter feeding
      const target = producers[prng.nextInt(0, producers.length - 1)];
      links.push({
        sourceSpeciesId: predator.id,
        targetSpeciesId: target.id,
        relationshipType: 'GRAZING',
        strength: Number(prng.nextFloat(0.3, 0.7).toFixed(2)),
      });
    }
  }

  // 3. Decomposers process organic waste from all tiers (Decomposition)
  for (const decomposer of decomposers) {
    const targets = [...producers, ...consumers, ...predators];
    if (targets.length > 0) {
      const target = targets[prng.nextInt(0, targets.length - 1)];
      links.push({
        sourceSpeciesId: decomposer.id,
        targetSpeciesId: target.id,
        relationshipType: 'DECOMPOSITION',
        strength: Number(prng.nextFloat(0.6, 0.9).toFixed(2)),
      });
    }
  }

  // Calculate planetary biomass estimate (tons)
  // Total biomass follows trophic pyramid: producers carry 85-95%
  let totalBiomass = 0;
  for (const s of active) {
    const avgBodyMassKg = s.traits.physical.sizeMeters * s.traits.physical.sizeMeters * 10;
    const speciesBiomassTons = (s.populationEstimate * Math.max(1e-9, avgBodyMassKg)) / 1000;
    totalBiomass += speciesBiomassTons;
  }

  // Trophic Stability Index: Ratio of producers to consumers/predators
  // An ecosystem with healthy producer base is stable (index ~ 0.7-1.0)
  const consumerCount = consumers.length + predators.length;
  let stability = 0.5;
  if (producers.length === 0) {
    stability = 0.05;
  } else if (consumerCount === 0) {
    stability = 0.85; // Pioneer microbial mats are stable
  } else {
    const ratio = producers.length / consumerCount;
    stability = Math.min(1.0, Math.max(0.1, 0.4 + Math.min(1.5, ratio) * 0.4));
  }

  return {
    planetId: planet.id,
    primaryEnergySource,
    producersCount: producers.length,
    consumersCount: consumers.length,
    predatorsCount: predators.length,
    decomposersCount: decomposers.length,
    biomassTonsEstimate: Math.round(totalBiomass),
    trophicStabilityIndex: Number(stability.toFixed(2)),
    links,
  };
}
