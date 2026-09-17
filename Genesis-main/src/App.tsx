/**
 * @license Apache-2.0
 * GENESIS — Interactive Cosmic Exploration Instrument
 *
 * Multi-scale deterministic universe simulation and 3D WebGL cosmic exploration instrument.
 * Navigation: UNIVERSE -> GALAXY -> STAR SYSTEM -> STAR -> PLANET -> MOON
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Compass, Sparkles, Terminal } from 'lucide-react';
import type {
  Galaxy,
  Moon,
  NavigationPath,
  Planet,
  Seed,
  Star,
  StarSystem,
  Year,
} from './core/types.js';
import {
  generateGalaxy,
  generateMoon,
  generatePlanet,
  generateStarSystem,
  generateUniverse,
} from './engine/hierarchy/index.js';
import { SimulationEngine } from './engine/simulation/engine.js';
import type { AstronomicalEvent, SimulationCheckpoint } from './engine/simulation/types.js';
import { CheckpointModal } from './components/CheckpointModal.js';
import { CosmicControls } from './components/CosmicControls.js';
import { CosmicTimeline } from './components/CosmicTimeline.js';
import { DiagnosticsModal } from './components/DiagnosticsModal.js';
import { EventDrawer } from './components/EventDrawer.js';
import { InfoPanel } from './components/InfoPanel.js';
import { NavigationBreadcrumb } from './components/NavigationBreadcrumb.js';
import { TemporalHUD } from './components/TemporalHUD.js';
import { CosmicViewport } from './rendering/cosmic-viewport.js';
import type { RendererStats } from './rendering/types.js';

export default function App() {
  // Root Universe Seed
  const [rootSeed, setRootSeed] = useState<Seed>(123456789);

  // Active Navigation Hierarchy Path
  const [path, setPath] = useState<NavigationPath>({
    tier: 'UNIVERSE',
    universeSeed: 123456789,
  });

  // Selected Entities
  const [selectedGalaxy, setSelectedGalaxy] = useState<Galaxy | undefined>(undefined);
  const [selectedSystem, setSelectedSystem] = useState<StarSystem | undefined>(undefined);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | undefined>(undefined);
  const [selectedMoon, setSelectedMoon] = useState<Moon | undefined>(undefined);
  const [selectedStar, setSelectedStar] = useState<Star | undefined>(undefined);

  // Real-time Renderer Stats
  const [stats, setStats] = useState<RendererStats>({
    fps: 60,
    visibleStars: 64,
    visiblePlanets: 0,
    visibleMoons: 0,
    objectCount: 64,
    drawCalls: 1,
    currentScale: 'UNIVERSE',
  });

  // Diagnostics modal visibility
  const [diagnosticsOpen, setDiagnosticsOpen] = useState<boolean>(false);

  // Materialize current Universe deterministically
  const universe = useMemo(() => {
    return generateUniverse(rootSeed);
  }, [rootSeed]);

  // Simulation Engine instance
  const simulationEngine = useMemo(() => {
    return new SimulationEngine(rootSeed, universe.ageYears, universe.ageYears);
  }, [rootSeed, universe.ageYears]);

  // Simulation Temporal State
  const [currentYear, setCurrentYear] = useState<Year>(universe.ageYears);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1_000);
  const [events, setEvents] = useState<readonly AstronomicalEvent[]>(() =>
    simulationEngine.events.getRecentEvents(50)
  );
  const [checkpoints, setCheckpoints] = useState<readonly SimulationCheckpoint[]>(() =>
    simulationEngine.checkpoints.list()
  );
  const [timeJumpTrigger, setTimeJumpTrigger] = useState<number>(0);

  // UI Drawer / Modal Toggles
  const [showTimeline, setShowTimeline] = useState<boolean>(true);
  const [isEventDrawerOpen, setIsEventDrawerOpen] = useState<boolean>(false);
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState<boolean>(false);

  // Handle Root Seed Change
  const handleSeedChange = useCallback((newSeed: Seed) => {
    const cleanSeed = newSeed >>> 0;
    setRootSeed(cleanSeed);
    setPath({
      tier: 'UNIVERSE',
      universeSeed: cleanSeed,
    });
    setSelectedGalaxy(undefined);
    setSelectedSystem(undefined);
    setSelectedPlanet(undefined);
    setSelectedMoon(undefined);
    setSelectedStar(undefined);

    const newUniverse = generateUniverse(cleanSeed);
    setCurrentYear(newUniverse.ageYears);
    setIsPaused(true);
  }, []);

  // Handle Random Seed Generation
  const handleRandomizeSeed = useCallback(() => {
    const cryptoBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(cryptoBuffer);
    handleSeedChange(cryptoBuffer[0]);
  }, [handleSeedChange]);

  // Temporal simulation controls
  const handleTogglePlay = useCallback(() => {
    if (simulationEngine.clock.isPaused) {
      simulationEngine.clock.play();
      setIsPaused(false);
    } else {
      simulationEngine.clock.pause();
      setIsPaused(true);
    }
  }, [simulationEngine]);

  const handleSetSpeed = useCallback(
    (newSpeed: number) => {
      simulationEngine.clock.setSpeed(newSpeed);
      setSpeed(newSpeed);
    },
    [simulationEngine]
  );

  const handleAdvance = useCallback(
    (deltaYears: number) => {
      simulationEngine.advance(deltaYears);
      setCurrentYear(simulationEngine.clock.currentYear);
      setEvents(simulationEngine.events.getRecentEvents(50));
      setTimeJumpTrigger(Date.now());
    },
    [simulationEngine]
  );

  const handleSetYear = useCallback(
    (targetYear: Year) => {
      simulationEngine.jumpToYear(targetYear);
      setCurrentYear(simulationEngine.clock.currentYear);
      setEvents(simulationEngine.events.getRecentEvents(50));
      setTimeJumpTrigger(Date.now());
    },
    [simulationEngine]
  );

  const handleCreateCheckpoint = useCallback(
    (label?: string) => {
      simulationEngine.saveCheckpoint(label);
      setCheckpoints(simulationEngine.checkpoints.list());
    },
    [simulationEngine]
  );

  const handleRestoreCheckpoint = useCallback(
    (id: string) => {
      const restored = simulationEngine.restoreCheckpoint(id);
      if (restored) {
        setCurrentYear(simulationEngine.clock.currentYear);
        setIsPaused(simulationEngine.clock.isPaused);
        setEvents(simulationEngine.events.getRecentEvents(50));
        setTimeJumpTrigger(Date.now());
      }
    },
    [simulationEngine]
  );

  const handleDeleteCheckpoint = useCallback(
    (id: string) => {
      simulationEngine.checkpoints.delete(id);
      setCheckpoints(simulationEngine.checkpoints.list());
    },
    [simulationEngine]
  );

  const handleClearEvents = useCallback(() => {
    simulationEngine.events.clear();
    setEvents([]);
  }, [simulationEngine]);

  const handleSimulationTick = useCallback(
    (year: Year) => {
      setCurrentYear(year);
      if (simulationEngine.events.count !== events.length) {
        setEvents(simulationEngine.events.getRecentEvents(50));
      }
    },
    [simulationEngine, events.length]
  );

  // Navigation handlers
  const handleNavigate = useCallback(
    (newPath: NavigationPath) => {
      setPath(newPath);

      // Lazily resolve entities matching the new hierarchy path
      if (newPath.galaxyIndex !== undefined) {
        const galaxy = generateGalaxy(universe.seed, newPath.galaxyIndex);
        setSelectedGalaxy(galaxy);

        if (newPath.systemIndex !== undefined) {
          const system = generateStarSystem(galaxy.seed, newPath.systemIndex, galaxy.id);
          setSelectedSystem(system);

          if (newPath.planetIndex !== undefined) {
            const planet = generatePlanet(
              system.seed,
              newPath.planetIndex,
              system.id,
              system.name,
              system.stars[0]?.luminositySolar ?? 1.0,
              system.stars[0]?.massSolar ?? 1.0
            );
            setSelectedPlanet(planet);

            if (newPath.moonIndex !== undefined && planet.moonCount > 0) {
              const moon = generateMoon(
                planet.seed,
                newPath.moonIndex,
                planet.id,
                planet.name,
                planet.massEarth
              );
              setSelectedMoon(moon);
            } else {
              setSelectedMoon(undefined);
            }
          } else {
            setSelectedPlanet(undefined);
            setSelectedMoon(undefined);
          }
        } else {
          setSelectedSystem(undefined);
          setSelectedPlanet(undefined);
          setSelectedMoon(undefined);
          setSelectedStar(undefined);
        }
      } else {
        setSelectedGalaxy(undefined);
        setSelectedSystem(undefined);
        setSelectedPlanet(undefined);
        setSelectedMoon(undefined);
        setSelectedStar(undefined);
      }
    },
    [universe]
  );

  // Transition into galaxy interior
  const handleEnterGalaxy = useCallback(
    (galaxy: Galaxy) => {
      setSelectedGalaxy(galaxy);
      // Derive galaxy index from galaxy ID or default to 0
      const indexMatch = galaxy.id.match(/\/g(\d+)$/);
      const galaxyIndex = indexMatch ? parseInt(indexMatch[1], 10) : 0;

      handleNavigate({
        tier: 'GALAXY',
        universeSeed: rootSeed,
        galaxyIndex,
      });
    },
    [handleNavigate, rootSeed]
  );

  // Transition into star system
  const handleEnterSystem = useCallback(
    (system: StarSystem) => {
      setSelectedSystem(system);
      const indexMatch = system.id.match(/\/s(\d+)$/);
      const systemIndex = indexMatch ? parseInt(indexMatch[1], 10) : 0;

      handleNavigate({
        tier: 'STAR_SYSTEM',
        universeSeed: rootSeed,
        galaxyIndex: path.galaxyIndex ?? 0,
        systemIndex,
      });
    },
    [handleNavigate, rootSeed, path.galaxyIndex]
  );

  // Focus planet
  const handleFocusPlanet = useCallback(
    (planet: Planet) => {
      setSelectedPlanet(planet);
      const indexMatch = planet.id.match(/\/p(\d+)$/);
      const planetIndex = indexMatch ? parseInt(indexMatch[1], 10) : 0;

      handleNavigate({
        tier: 'PLANET',
        universeSeed: rootSeed,
        galaxyIndex: path.galaxyIndex ?? 0,
        systemIndex: path.systemIndex ?? 0,
        planetIndex,
      });
    },
    [handleNavigate, rootSeed, path.galaxyIndex, path.systemIndex]
  );

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. Full-Screen WebGL Canvas Viewport */}
      <CosmicViewport
        universe={universe}
        path={path}
        simulationEngine={simulationEngine}
        onNavigate={handleNavigate}
        onSelectGalaxy={setSelectedGalaxy}
        onSelectSystem={setSelectedSystem}
        onSelectPlanet={setSelectedPlanet}
        onSelectMoon={setSelectedMoon}
        onSelectStar={setSelectedStar}
        onStatsUpdate={setStats}
        onSimulationTick={handleSimulationTick}
        timeJumpTrigger={timeJumpTrigger}
      />

      {/* 2. Top Header Instrumentation Bar */}
      <header
        id="genesis-app-header"
        className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-20"
      >
        {/* Left: Brand & Universe Seed Indicator */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-lg shadow-xl">
            <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <span className="text-xs font-bold font-mono tracking-widest text-white">GENESIS</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 rounded">
              v0.5.1
            </span>
          </div>

          {/* Seed Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/70 backdrop-blur-md border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
            <span className="text-slate-500">Seed:</span>
            <span className="text-cyan-300 font-semibold">{rootSeed}</span>
          </div>
        </div>

        {/* Center: Dynamic Navigation Breadcrumb */}
        <div className="pointer-events-auto">
          <NavigationBreadcrumb
            path={path}
            galaxy={selectedGalaxy}
            starSystem={selectedSystem}
            planet={selectedPlanet}
            star={selectedStar}
            moon={selectedMoon}
            onNavigate={handleNavigate}
          />
        </div>

        {/* Right: Scale Tier Indicator */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="px-3 py-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-lg text-xs font-mono font-medium text-slate-300 shadow-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>{path.tier}</span>
          </div>
        </div>
      </header>

      {/* 3. Temporal Simulation HUD */}
      <TemporalHUD
        currentYear={currentYear}
        isPaused={isPaused}
        speed={speed}
        currentTier={path.tier}
        eventCount={events.length}
        checkpointCount={checkpoints.length}
        showTimeline={showTimeline}
        onTogglePlay={handleTogglePlay}
        onSetSpeed={handleSetSpeed}
        onAdvance={handleAdvance}
        onSetYear={handleSetYear}
        onToggleTimeline={() => setShowTimeline((prev) => !prev)}
        onOpenEvents={() => setIsEventDrawerOpen(true)}
        onOpenCheckpoints={() => setIsCheckpointModalOpen(true)}
      />

      {/* 4. Celestial Information HUD Panel */}
      <InfoPanel
        currentTier={path.tier}
        selectedGalaxy={selectedGalaxy}
        selectedSystem={selectedSystem}
        selectedStar={selectedStar}
        selectedPlanet={selectedPlanet}
        selectedMoon={selectedMoon}
        systemTemporalState={simulationEngine.getActiveSystemState() ?? undefined}
        simulationYear={currentYear}
        onEnterGalaxy={handleEnterGalaxy}
        onEnterSystem={handleEnterSystem}
        onFocusPlanet={handleFocusPlanet}
      />

      {/* 5. Cosmic Timeline Scrubber */}
      {showTimeline && (
        <div className="absolute bottom-16 left-4 right-4 max-w-4xl mx-auto z-20 pointer-events-auto">
          <CosmicTimeline
            currentYear={currentYear}
            universeAgeYears={universe.ageYears}
            events={events}
            onJumpToYear={handleSetYear}
          />
        </div>
      )}

      {/* 6. Bottom Controls and Navigation Prompts */}
      <CosmicControls
        path={path}
        onNavigate={handleNavigate}
        onRandomizeSeed={handleRandomizeSeed}
        onToggleDiagnostics={() => setDiagnosticsOpen(true)}
      />

      {/* 7. Astronomical Events Drawer */}
      <EventDrawer
        isOpen={isEventDrawerOpen}
        onClose={() => setIsEventDrawerOpen(false)}
        events={events}
        currentYear={currentYear}
        onJumpToEvent={handleSetYear}
        onClearEvents={handleClearEvents}
      />

      {/* 8. Temporal Checkpoints Modal */}
      <CheckpointModal
        isOpen={isCheckpointModalOpen}
        onClose={() => setIsCheckpointModalOpen(false)}
        checkpoints={checkpoints}
        currentYear={currentYear}
        onCreateCheckpoint={handleCreateCheckpoint}
        onRestoreCheckpoint={handleRestoreCheckpoint}
        onDeleteCheckpoint={handleDeleteCheckpoint}
      />

      {/* 9. Developer Verification & Telemetry Modal */}
      <DiagnosticsModal
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
        rootSeed={rootSeed}
        path={path}
        stats={stats}
        selectedGalaxy={selectedGalaxy}
        selectedSystem={selectedSystem}
        selectedPlanet={selectedPlanet}
        selectedMoon={selectedMoon}
        onChangeSeed={handleSeedChange}
        onJumpCoordinates={handleNavigate}
      />
    </main>
  );
}
