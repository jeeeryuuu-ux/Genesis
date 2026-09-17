/**
 * @license Apache-2.0
 * GENESIS INTELLIGENCE EMERGENCE ENGINE
 *
 * Evaluates cognitive architecture, problem-solving, communication bandwidth,
 * tool manipulation, and collective coordination deterministically derived
 * from Phase 6 biological species traits and environmental conditions.
 */

import { deriveIntelligenceSeed } from '../../core/hierarchy.js';
import { createPRNG } from '../../core/prng.js';
import type { Planet } from '../../core/types.js';
import type { HabitabilityAssessment, Species } from '../biology/types.js';
import type { IntelligenceProfile } from './types.js';

/**
 * Computes an analytical, explainable intelligence profile for a given species.
 */
export function evaluateIntelligence(
  species: Species,
  planet: Planet,
  habitability: HabitabilityAssessment
): IntelligenceProfile {
  // Non-multicellular/non-complex organisms lack somatic neural capacity for sapience
  if (
    species.complexity === 'MOLECULAR' ||
    species.complexity === 'PROTOCELL' ||
    species.complexity === 'UNICELLULAR' ||
    species.complexity === 'COLONIAL'
  ) {
    return {
      cognitiveComplexity: 0.0,
      problemSolving: 0.0,
      communication: 0.0,
      socialLearning: 0.0,
      toolUse: 0.0,
      abstractReasoning: 0.0,
      collectiveCoordination: 0.0,
      civilizationPotential: 0.0,
      isSapient: false,
    };
  }

  const seed = deriveIntelligenceSeed(species.seed);
  const prng = createPRNG(seed);

  const physical = species.traits.physical;
  const ecological = species.traits.ecological;
  const sensory = species.traits.sensory;

  // 1. Cognitive Complexity: derived from structural complexity and sensory richness
  const sensoryRichness =
    sensory.vision * 0.4 +
    sensory.chemicalSensing * 0.2 +
    sensory.pressureSensing * 0.2 +
    sensory.thermalSensing * 0.2;

  const complexityBoost = species.complexity === 'COMPLEX' ? 1.0 : 0.45;
  const baseCognition =
    physical.structuralComplexity * 0.5 +
    sensoryRichness * 0.35 +
    species.visual.sensoryComplexity * 0.15;
  const cognitiveVariance = (prng.next() * 0.2 - 0.1);
  const cognitiveComplexity = Math.max(0.01, Math.min(1.0, (baseCognition * complexityBoost) + cognitiveVariance));

  // 2. Problem Solving: pressure from trophic niche and sensory acuity
  let trophicProblemPressure = 0.2;
  if (ecological.dietStrategy === 'CARNIVORE' || ecological.dietStrategy === 'OMNIVORE') {
    trophicProblemPressure = 0.55;
  } else if (ecological.dietStrategy === 'HERBIVORE' || ecological.dietStrategy === 'DETRITIVORE') {
    trophicProblemPressure = 0.35;
  } else if (ecological.dietStrategy === 'FILTER_FEEDER' || ecological.dietStrategy === 'AUTOTROPH') {
    trophicProblemPressure = 0.05;
  }

  const problemSolving = Math.max(
    0.01,
    Math.min(
      1.0,
      cognitiveComplexity * 0.6 + trophicProblemPressure * 0.3 + (prng.next() * 0.15)
    )
  );

  // 3. Communication: acoustic/visual bandwidth and social density
  let sensoryCommBandwidth = sensory.vision * 0.5 + sensory.chemicalSensing * 0.3;
  if (species.visual.bioluminescence) {
    sensoryCommBandwidth += 0.2;
  }
  const commVariance = (prng.next() * 0.15 - 0.05);
  const communication = Math.max(
    0.01,
    Math.min(1.0, cognitiveComplexity * 0.5 + sensoryCommBandwidth * 0.4 + commVariance)
  );

  // 4. Social Learning: lifespan to generation time ratio allowing cultural transmission
  const generationRatio = Math.min(
    1.0,
    species.traits.ecological.lifespanYears / Math.max(1.0, species.traits.ecological.generationTimeYears * 2)
  );
  const socialModeFactor =
    ecological.reproductionMode === 'SEXUAL_DIMORPHIC' ? 0.4 : 0.2;
  const socialLearning = Math.max(
    0.01,
    Math.min(
      1.0,
      communication * 0.4 + generationRatio * 0.3 + socialModeFactor + (prng.next() * 0.15 - 0.05)
    )
  );

  // 5. Tool Use: dexterous manipulation and somatic appendage freedom
  let mobilityToolBonus = 0.1;
  if (physical.mobilityType === 'WALKING') {
    // Walking bipeds / quadrupeds free up limbs/mandibles for grasping
    mobilityToolBonus = 0.45;
  } else if (physical.mobilityType === 'GLIDING' || physical.mobilityType === 'CRAWLING') {
    mobilityToolBonus = 0.3;
  } else if (physical.mobilityType === 'SWIMMING') {
    // Aquatic tools are constrained by hydrodynamic drag and lack of fire
    mobilityToolBonus = 0.18;
  } else {
    // Sessile, drifting
    mobilityToolBonus = 0.01;
  }

  const appendageFactor = Math.min(1.0, species.visual.appendageCount / 6);
  const toolUse = Math.max(
    0.0,
    Math.min(
      1.0,
      cognitiveComplexity * 0.4 +
        mobilityToolBonus * 0.35 +
        appendageFactor * 0.15 +
        (prng.next() * 0.15 - 0.05)
    )
  );

  // 6. Abstract Reasoning: advanced synthesis of cognition and problem-solving
  const abstractReasoning = Math.max(
    0.0,
    Math.min(
      1.0,
      Math.pow(cognitiveComplexity, 1.4) * 0.65 +
        problemSolving * 0.25 +
        (prng.next() * 0.15 - 0.05)
    )
  );

  // 7. Collective Coordination: trans-individual cooperation
  const collectiveCoordination = Math.max(
    0.0,
    Math.min(
      1.0,
      communication * 0.45 + socialLearning * 0.45 + (prng.next() * 0.15 - 0.05)
    )
  );

  // 8. Civilization Potential:
  // civilizationPotential = biologicalPotential × environmentalPotential × ecologicalPotential × temporalOpportunity
  const biologicalPotential =
    cognitiveComplexity * 0.25 +
    problemSolving * 0.2 +
    communication * 0.15 +
    socialLearning * 0.15 +
    toolUse * 0.25;

  const environmentalPotential = habitability.score * 0.6 + habitability.environmentalStability * 0.4;

  const ecologicalPotential =
    species.fitness.overallFitness * 0.5 +
    (species.status === 'THRIVING' ? 0.5 : species.status === 'STABLE' ? 0.35 : 0.1);

  // Terrestrial habitat preference facilitates metallurgy and combustion
  const habitatModifier =
    ecological.habitatPreference === 'TERRESTRIAL_LOWLAND' ||
    ecological.habitatPreference === 'COASTAL'
      ? 1.0
      : ecological.habitatPreference === 'SURFACE_OCEAN'
        ? 0.75
        : 0.5;

  const civilizationPotential = Math.max(
    0.0,
    Math.min(
      1.0,
      biologicalPotential * environmentalPotential * ecologicalPotential * habitatModifier * 1.3
    )
  );

  // Sapience threshold requires multi-dimensional cognitive, manipulative, and social capability
  const isSapient =
    civilizationPotential >= 0.35 &&
    cognitiveComplexity >= 0.38 &&
    toolUse >= 0.30 &&
    communication >= 0.30 &&
    problemSolving >= 0.32;

  return {
    cognitiveComplexity: Math.round(cognitiveComplexity * 1000) / 1000,
    problemSolving: Math.round(problemSolving * 1000) / 1000,
    communication: Math.round(communication * 1000) / 1000,
    socialLearning: Math.round(socialLearning * 1000) / 1000,
    toolUse: Math.round(toolUse * 1000) / 1000,
    abstractReasoning: Math.round(abstractReasoning * 1000) / 1000,
    collectiveCoordination: Math.round(collectiveCoordination * 1000) / 1000,
    civilizationPotential: Math.round(civilizationPotential * 1000) / 1000,
    isSapient,
  };
}
