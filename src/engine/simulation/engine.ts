/**
 * @license Apache-2.0
 * GENESIS SIMULATION ENGINE
 *
 * Core coordinator for deterministic temporal evolution, state derivation,
 * lazy materialization, checkpointing, and astronomical event logging.
 *
 * ARCHITECTURAL FLOW:
 * Generator (Immutable Baseline)
 *      ↓
 * Simulation Engine (Clock + Analytical Physics)
 *      ↓
 * Sparse State Cache (Lazy active systems only)
 *      ↓
 * Renderer & HUD
 */

import type {
  EntityId,
  Moon,
  Planet,
  Seed,
  Star,
  StarSystem,
  Year,
} from '../../core/types.js';
import { CheckpointManager } from './checkpoint.js';
import { SimulationClock } from './clock.js';
import { evolvePlanet } from './environment-evolution.js';
import { detectSystemEvents, EventManager } from './events.js';
import { evolveMoon } from './orbital-dynamics.js';
import { TemporalStateCache } from './state-cache.js';
import {
  calculateDynamicHabitableZone,
  evolveStar,
} from './stellar-evolution.js';
import type {
  AstronomicalEvent,
  MoonTemporalState,
  PlanetaryTemporalState,
  SimulationCheckpoint,
  StellarTemporalState,
  SystemTemporalState,
  TemporalTelemetry,
} from './types.js';
import { BiologicalStateCache } from '../biology/state-cache.js';
import { summarizeBiosphere, materializeBiosphere } from '../biology/life.js';
import type { Biosphere, BiosphereSummary } from '../biology/types.js';
import { CivilizationStateCache } from '../civilization/state-cache.js';
import { materializeCivilizations, summarizeCivilizations } from '../civilization/life-cycle.js';
import type {
  Civilization,
  CivilizationRecord,
  PlanetaryCivilizationSummary,
} from '../civilization/types.js';
import { ExpansionStateCache } from '../expansion/state-cache.js';
import {
  materializeInterplanetaryState,
  summarizeInterplanetaryExpansion,
} from '../expansion/expansion-state.js';
import type {
  InterplanetaryCivilizationState,
  InterplanetaryExpansionSummary,
} from '../expansion/types.js';

export class SimulationEngine {
  public readonly clock: SimulationClock;
  public readonly stateCache: TemporalStateCache;
  public readonly biologyCache: BiologicalStateCache;
  public readonly civilizationCache: CivilizationStateCache;
  public readonly expansionCache: ExpansionStateCache;
  public readonly checkpointManager: CheckpointManager;
  public readonly checkpoints: CheckpointManager;
  public readonly events: EventManager;

  private rootSeed: Seed;
  private universeAgeYears: Year;

  // Active lazy observation context
  private activeSystem?: StarSystem;
  private activePlanets: readonly Planet[] = [];

  constructor(
    rootSeed: Seed = 1337,
    universeAgeYears: Year = 13_800_000_000,
    initialYear?: Year
  ) {
    this.rootSeed = rootSeed;
    this.universeAgeYears = universeAgeYears;
    const epoch = initialYear ?? universeAgeYears;
    this.clock = new SimulationClock(epoch);
    this.stateCache = new TemporalStateCache();
    this.biologyCache = new BiologicalStateCache();
    this.civilizationCache = new CivilizationStateCache();
    this.expansionCache = new ExpansionStateCache();
    this.checkpointManager = new CheckpointManager();
    this.checkpoints = this.checkpointManager;
    this.events = new EventManager();
  }

  public getRootSeed(): Seed {
    return this.rootSeed;
  }

  public getUniverseAgeYears(): Year {
    return this.universeAgeYears;
  }

  public getEvents(): readonly AstronomicalEvent[] {
    return this.events.getEvents();
  }

  public getRecentEvents(count: number = 50): readonly AstronomicalEvent[] {
    return this.events.getRecentEvents(count);
  }

  public clearEvents(): void {
    this.events.clear();
  }

  /**
   * Sets the active star system context for lazy evaluation.
   * Only actively observed celestial objects are simulated temporally.
   */
  public setActiveSystem(
    system: StarSystem,
    planets: readonly Planet[]
  ): SystemTemporalState {
    this.activeSystem = system;
    this.activePlanets = planets;
    return this.evaluateActiveSystem();
  }

  public clearActiveSystem(): void {
    this.activeSystem = undefined;
    this.activePlanets = [];
  }

  public getActiveSystem(): StarSystem | undefined {
    return this.activeSystem;
  }

  public getActivePlanets(): readonly Planet[] {
    return this.activePlanets;
  }

  /**
   * Evaluates temporal state for the currently active system at clock.currentYear.
   */
  public evaluateActiveSystem(): SystemTemporalState {
    if (!this.activeSystem) {
      throw new Error('[SimulationEngine] No active system set for evaluation');
    }
    return this.simulateSystem(
      this.activeSystem,
      this.activePlanets,
      this.clock.currentYear
    );
  }

  /**
   * Analytically evaluates a star system at a given cosmic year.
   * Strictly O(1) with respect to year delta.
   * Does NOT mutate baseline generator objects.
   */
  public simulateSystem(
    system: StarSystem,
    planets: readonly Planet[],
    year: Year
  ): SystemTemporalState {
    const previousState = this.stateCache.getSystemState(system.id);

    // 1. Evolve all stars in the system
    const starsMap = new Map<EntityId, StellarTemporalState>();
    let primaryStarTemporal: StellarTemporalState | undefined;

    for (const star of system.stars) {
      const evolved = evolveStar(star, this.universeAgeYears, year);
      starsMap.set(star.id, evolved);
      if (!primaryStarTemporal || star.massSolar > primaryStarTemporal.baseStar.massSolar) {
        primaryStarTemporal = evolved;
      }
    }

    if (!primaryStarTemporal && system.stars.length > 0) {
      primaryStarTemporal = starsMap.get(system.stars[0].id);
    }

    // 2. Derive dynamic circumstellar habitable zone from primary star luminosity
    const dynamicHZ = primaryStarTemporal
      ? calculateDynamicHabitableZone(primaryStarTemporal.luminositySolar)
      : system.habitableZoneAU;

    // 3. Evolve planets and their constituent moons
    const planetsMap = new Map<EntityId, PlanetaryTemporalState>();
    const moonsMap = new Map<EntityId, MoonTemporalState>();

    for (const planet of planets) {
      if (primaryStarTemporal) {
        const evolvedPlanet = evolvePlanet(planet, year, primaryStarTemporal, dynamicHZ);
        planetsMap.set(planet.id, evolvedPlanet);
      }

      // Evolve moons
      if (planet.moons) {
        for (const moon of planet.moons) {
          const evolvedMoon = evolveMoon(moon, year);
          moonsMap.set(moon.id, evolvedMoon);
        }
      }
    }

    const nextState: SystemTemporalState = {
      entityId: system.id,
      year,
      habitableZoneAU: dynamicHZ,
      stars: starsMap,
      planets: planetsMap,
      moons: moonsMap,
    };

    // 4. Detect and log meaningful astronomical events deterministically
    const newEvents = detectSystemEvents(this.rootSeed, previousState, nextState);
    if (newEvents.length > 0) {
      this.events.addEvents(newEvents);
    }

    // 5. Store in sparse cache
    this.stateCache.setSystemState(system.id, nextState);

    return nextState;
  }

  /**
   * Advances the simulation clock by a discrete number of astronomical years
   * and refreshes active temporal states analytically.
   */
  public advance(years: number): Year {
    const newYear = this.clock.advance(years);
    if (this.activeSystem) {
      this.evaluateActiveSystem();
    }
    return newYear;
  }

  /**
   * Sets the cosmic clock directly to a target epoch.
   */
  public setYear(year: Year): Year {
    const newYear = this.clock.setYear(year);
    if (this.activeSystem) {
      this.evaluateActiveSystem();
    }
    return newYear;
  }

  /**
   * Alias for setYear.
   */
  public jumpToYear(year: Year): Year {
    return this.setYear(year);
  }

  /**
   * Creates an in-memory snapshot checkpoint.
   */
  public createCheckpoint(label?: string): SimulationCheckpoint {
    return this.checkpointManager.createCheckpoint(
      this.clock.currentYear,
      this.stateCache.getMap(),
      this.events.count,
      label
    );
  }

  /**
   * Alias for createCheckpoint.
   */
  public saveCheckpoint(label?: string): SimulationCheckpoint {
    return this.createCheckpoint(label);
  }

  /**
   * Restores an in-memory snapshot checkpoint deterministically.
   */
  public restoreCheckpoint(checkpointId: string): boolean {
    const cp = this.checkpointManager.getCheckpoint(checkpointId);
    if (!cp) return false;

    // Restore clock
    this.clock.setYear(cp.year);

    // Restore cache
    this.stateCache.clear();
    this.biologyCache.clear();
    this.civilizationCache.clear();
    for (const [id, state] of cp.systemStates) {
      this.stateCache.setSystemState(id, state);
    }

    // If active system is present, re-evaluate to maintain synchronization
    if (this.activeSystem) {
      this.evaluateActiveSystem();
    }

    return true;
  }

  public getActiveSystemState(): SystemTemporalState | undefined {
    if (!this.activeSystem) return undefined;
    return this.stateCache.getSystemState(this.activeSystem.id);
  }

  public getTemporalStar(starId: EntityId): StellarTemporalState | undefined {
    const sys = this.getActiveSystemState();
    return sys?.stars.get(starId);
  }

  public getTemporalPlanet(planetId: EntityId): PlanetaryTemporalState | undefined {
    const sys = this.getActiveSystemState();
    return sys?.planets.get(planetId);
  }

  public getTemporalMoon(moonId: EntityId): MoonTemporalState | undefined {
    const sys = this.getActiveSystemState();
    return sys?.moons.get(moonId);
  }

  /**
   * Lazily queries or evaluates a lightweight Biosphere summary for a planet.
   */
  public getBiosphereSummary(planet: Planet): BiosphereSummary {
    const year = this.clock.currentYear;
    const cached = this.biologyCache.getSummary(planet.id, year);
    if (cached) return cached;

    const pState = this.getTemporalPlanet(planet.id);
    const starState = this.activeSystem?.stars[0]
      ? this.getTemporalStar(this.activeSystem.stars[0].id)
      : undefined;

    const summary = summarizeBiosphere(planet, year, pState, starState);
    this.biologyCache.setSummary(planet.id, year, summary);
    return summary;
  }

  /**
   * Lazily materializes the full authoritative planetary biosphere and species ecosystem.
   */
  public getBiosphere(planet: Planet): Biosphere {
    const year = this.clock.currentYear;
    const cached = this.biologyCache.getBiosphere(planet.id, year);
    if (cached) return cached;

    const pState = this.getTemporalPlanet(planet.id);
    const starState = this.activeSystem?.stars[0]
      ? this.getTemporalStar(this.activeSystem.stars[0].id)
      : undefined;

    const biosphere = materializeBiosphere(planet, year, pState, starState);
    this.biologyCache.setBiosphere(planet.id, year, biosphere);
    return biosphere;
  }

  /**
   * Lazily computes or retrieves a lightweight planetary civilization summary.
   */
  public getCivilizationSummary(planet: Planet): PlanetaryCivilizationSummary {
    const year = this.clock.currentYear;
    const cached = this.civilizationCache.getSummary(planet.id, year);
    if (cached) return cached;

    const civs = this.getCivilizations(planet);
    const summary = summarizeCivilizations(planet, year, civs);
    this.civilizationCache.setSummary(planet.id, year, summary);
    return summary;
  }

  /**
   * Lazily materializes the full authoritative civilization entities for a planet.
   */
  public getCivilizations(planet: Planet): readonly Civilization[] {
    const year = this.clock.currentYear;
    const cached = this.civilizationCache.getCivilizations(planet.id, year);
    if (cached) return cached;

    const biosphere = this.getBiosphere(planet);
    const civs = materializeCivilizations(
      planet,
      year,
      biosphere.summary.habitability,
      biosphere.activeSpecies
    );
    this.civilizationCache.setCivilizations(planet.id, year, civs);
    return civs;
  }

  /**
   * Returns historical civilization records for a planet.
   */
  public getCivilizationHistory(planetId: EntityId): readonly CivilizationRecord[] {
    return this.civilizationCache.getHistoricalRecords(planetId);
  }

  /**
   * Lazily materializes the comprehensive authoritative interplanetary expansion state.
   */
  public getExpansionState(
    planet: Planet,
    civilization?: Civilization
  ): InterplanetaryCivilizationState | undefined {
    const year = this.clock.currentYear;
    const cached = this.expansionCache.getExpansionState(planet.id, year);
    if (cached) return cached;

    const civ = civilization ?? this.getCivilizations(planet)[0];
    if (!civ) return undefined;

    const primaryStarLum = this.activeSystem?.stars[0]?.luminositySolar ?? 1.0;
    const allPlanets = this.activePlanets.length > 0 ? this.activePlanets : [planet];

    const state = materializeInterplanetaryState(civ, planet, allPlanets, year, primaryStarLum);
    this.expansionCache.setExpansionState(planet.id, year, state);
    return state;
  }

  /**
   * Lazily computes or retrieves a lightweight interplanetary expansion summary for HUD polling.
   */
  public getExpansionSummary(
    planet: Planet,
    civilization?: Civilization
  ): InterplanetaryExpansionSummary | undefined {
    const year = this.clock.currentYear;
    const cached = this.expansionCache.getExpansionSummary(planet.id, year);
    if (cached) return cached;

    const state = this.getExpansionState(planet, civilization);
    if (!state) return undefined;

    const summary = summarizeInterplanetaryExpansion(state);
    this.expansionCache.setExpansionSummary(planet.id, year, summary);
    return summary;
  }

  /**
   * Compiles developer telemetry metrics.
   */
  public getTelemetry(
    selectedStarId?: EntityId,
    selectedPlanetId?: EntityId
  ): TemporalTelemetry {
    const counts = this.stateCache.getCounts();
    const starTemporal = selectedStarId ? this.getTemporalStar(selectedStarId) : undefined;
    const planetTemporal = selectedPlanetId
      ? this.getTemporalPlanet(selectedPlanetId)
      : undefined;
    const activeSys = this.getActiveSystemState();

    return {
      currentYear: this.clock.currentYear,
      isPaused: this.clock.isPaused,
      speed: this.clock.speed,
      cachedSystemsCount: counts.systems,
      cachedPlanetsCount: counts.planets,
      eventCount: this.events.count,
      checkpointCount: this.checkpointManager.getAllCheckpoints().length,
      activeStellarStage: starTemporal?.stage,
      activeStarAgeYears: starTemporal?.ageYears,
      activeLuminositySolar: starTemporal?.luminositySolar,
      activeSurfaceTempKelvin: starTemporal?.surfaceTempKelvin,
      activeHabitableZoneAU: activeSys?.habitableZoneAU,
      activePlanetTempKelvin: planetTemporal?.effectiveTempKelvin,
      activeBiosphereEligibility: planetTemporal?.hasBiosphereEligibility,
    };
  }

  public clear(): void {
    this.stateCache.clear();
    this.biologyCache.clear();
    this.civilizationCache.clear();
    this.expansionCache.clear();
    this.checkpointManager.clear();
    this.events.clear();
    this.activeSystem = undefined;
    this.activePlanets = [];
  }
}
