/**
 * @license Apache-2.0
 * GENESIS FLOATING CELESTIAL INFO PANEL
 *
 * Minimal HUD instrumentation displaying authoritative astronomical parameters
 * for currently selected galaxies, star systems, stars, planets, and moons.
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Crown,
  Disc,
  Dna,
  ExternalLink,
  Flame,
  Globe,
  Info,
  Maximize2,
  Moon as MoonIcon,
  Orbit,
  Sparkles,
  Sun,
  Thermometer,
  X,
} from 'lucide-react';
import type {
  Galaxy,
  Moon,
  NavigationPath,
  Planet,
  ScaleTier,
  Star,
  StarSystem,
  Year,
} from '../core/types.js';
import type { SystemTemporalState } from '../engine/simulation/types.js';
import type { BiosphereSummary } from '../engine/biology/types.js';
import type { PlanetaryCivilizationSummary } from '../engine/civilization/types.js';

export interface InfoPanelProps {
  readonly currentTier: ScaleTier;
  readonly selectedGalaxy?: Galaxy;
  readonly selectedSystem?: StarSystem;
  readonly selectedStar?: Star;
  readonly selectedPlanet?: Planet;
  readonly selectedMoon?: Moon;
  readonly systemTemporalState?: SystemTemporalState;
  readonly biosphereSummary?: BiosphereSummary;
  readonly civilizationSummary?: PlanetaryCivilizationSummary;
  readonly currentYear?: Year;
  readonly onEnterGalaxy?: (galaxy: Galaxy) => void;
  readonly onEnterSystem?: (system: StarSystem) => void;
  readonly onFocusPlanet?: (planet: Planet) => void;
  readonly onFocusMoon?: (moon: Moon) => void;
  readonly onInspectBiosphere?: (planet: Planet) => void;
  readonly onInspectCivilization?: (planet: Planet) => void;
  readonly onClose?: () => void;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  currentTier,
  selectedGalaxy,
  selectedSystem,
  selectedStar,
  selectedPlanet,
  selectedMoon,
  systemTemporalState,
  biosphereSummary,
  civilizationSummary,
  currentYear,
  onEnterGalaxy,
  onEnterSystem,
  onFocusPlanet,
  onFocusMoon,
  onInspectBiosphere,
  onInspectCivilization,
  onClose,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // Determine active primary entity based on hierarchy focus
  const activeType: 'MOON' | 'PLANET' | 'STAR' | 'SYSTEM' | 'GALAXY' | null =
    selectedMoon
      ? 'MOON'
      : selectedPlanet
      ? 'PLANET'
      : selectedStar
      ? 'STAR'
      : selectedSystem
      ? 'SYSTEM'
      : selectedGalaxy
      ? 'GALAXY'
      : null;

  if (!activeType) return null;

  return (
    <aside
      id="genesis-celestial-hud"
      aria-label="Celestial Entity Information"
      className="absolute right-4 top-16 w-84 max-w-[calc(100vw-2rem)] bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-xl text-slate-200 shadow-2xl overflow-hidden font-sans z-20 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/70 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          {activeType === 'GALAXY' && <Disc className="w-4 h-4 text-indigo-400" />}
          {activeType === 'SYSTEM' && <Orbit className="w-4 h-4 text-amber-400" />}
          {activeType === 'STAR' && <Sun className="w-4 h-4 text-yellow-400" />}
          {activeType === 'PLANET' && <Globe className="w-4 h-4 text-emerald-400" />}
          {activeType === 'MOON' && <MoonIcon className="w-4 h-4 text-sky-400" />}
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            {activeType} DATA
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            id="toggle-collapse-hud"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 text-slate-400 hover:text-slate-100 rounded transition-colors"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          {onClose && (
            <button
              id="close-hud"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-rose-300 rounded transition-colors"
              title="Close panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="p-3.5 space-y-3 max-h-[75vh] overflow-y-auto font-mono text-xs">
          {/* ================= GALAXY ================= */}
          {activeType === 'GALAXY' && selectedGalaxy && (
            <div className="space-y-2.5">
              <div>
                <h3 className="text-sm font-semibold text-white font-sans">{selectedGalaxy.name}</h3>
                <span className="text-[10px] text-slate-400 font-mono">{selectedGalaxy.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                <div>
                  <span className="text-slate-500 block">Morphology</span>
                  <span className="text-indigo-300 font-medium">{selectedGalaxy.type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Disk Radius</span>
                  <span className="text-slate-200">{selectedGalaxy.radiusLightYears.toLocaleString()} ly</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Estimated Stars</span>
                  <span className="text-slate-200 font-medium">
                    {(selectedGalaxy.starCountEstimate / 1e9).toFixed(1)}B
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Core Black Hole</span>
                  <span className="text-slate-200">
                    {(selectedGalaxy.coreBlackHoleMassSolar / 1e6).toFixed(1)}M M☉
                  </span>
                </div>
              </div>

              {currentTier === 'UNIVERSE' && onEnterGalaxy && (
                <button
                  id="btn-enter-galaxy"
                  onClick={() => onEnterGalaxy(selectedGalaxy)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-medium rounded-lg transition-colors shadow-lg"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Enter Galactic Interior</span>
                </button>
              )}
            </div>
          )}

          {/* ================= STAR SYSTEM ================= */}
          {activeType === 'SYSTEM' && selectedSystem && (
            <div className="space-y-2.5">
              <div>
                <h3 className="text-sm font-semibold text-white font-sans">{selectedSystem.name}</h3>
                <span className="text-[10px] text-slate-400 font-mono">{selectedSystem.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                <div>
                  <span className="text-slate-500 block">Multiplicity</span>
                  <span className="text-amber-300 font-medium">
                    {selectedSystem.stars.length === 1
                      ? 'Single Star'
                      : selectedSystem.stars.length === 2
                      ? 'Binary System'
                      : 'Trinary System'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Planet Count</span>
                  <span className="text-slate-200">{selectedSystem.planetCount} planets</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">Habitable Zone (AU)</span>
                  <span className="text-emerald-400 font-medium">
                    {selectedSystem.habitableZoneAU.inner.toFixed(2)} AU –{' '}
                    {selectedSystem.habitableZoneAU.outer.toFixed(2)} AU
                  </span>
                </div>
              </div>

              {/* Stellar components */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-slate-500 font-medium tracking-wider">
                  System Stars
                </span>
                <div className="space-y-1">
                  {selectedSystem.stars.map((star, idx) => (
                    <div
                      key={star.id}
                      className="flex items-center justify-between px-2 py-1 bg-slate-900/40 rounded border border-slate-800/50 text-[11px]"
                    >
                      <span className="text-slate-200">
                        {idx === 0 ? 'Primary' : idx === 1 ? 'Secondary' : 'Tertiary'}: {star.name}
                      </span>
                      <span className="text-yellow-400 font-mono font-medium">
                        Class {star.spectralClass}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {currentTier === 'GALAXY' && onEnterSystem && (
                <button
                  id="btn-enter-system"
                  onClick={() => onEnterSystem(selectedSystem)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white font-sans text-xs font-medium rounded-lg transition-colors shadow-lg"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Enter Star System</span>
                </button>
              )}
            </div>
          )}

          {/* ================= STAR ================= */}
          {activeType === 'STAR' && selectedStar && (
            <div className="space-y-2.5">
              <div>
                <h3 className="text-sm font-semibold text-white font-sans">{selectedStar.name}</h3>
                <span className="text-[10px] text-slate-400 font-mono">{selectedStar.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                <div>
                  <span className="text-slate-500 block">Spectral Class</span>
                  <span className="text-yellow-300 font-semibold">{selectedStar.spectralClass}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Surface Temp</span>
                  <span className="text-slate-200">{selectedStar.surfaceTempKelvin.toLocaleString()} K</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Mass</span>
                  <span className="text-slate-200">{selectedStar.massSolar.toFixed(2)} M☉</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Radius</span>
                  <span className="text-slate-200">{selectedStar.radiusSolar.toFixed(2)} R☉</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">Luminosity</span>
                  <span className="text-slate-200">{selectedStar.luminositySolar.toFixed(2)} L☉</span>
                </div>
              </div>

              {/* Dynamic Temporal Stellar State */}
              {systemTemporalState?.stars.get(selectedStar.id) && (
                <div className="p-2.5 bg-amber-950/25 border border-amber-800/50 rounded-lg space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-amber-400 font-bold flex items-center gap-1 font-sans">
                      <Clock className="w-3 h-3" /> Temporal Epoch ({currentYear?.toLocaleString()} YR)
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-900/80 text-amber-200">
                      {systemTemporalState.stars.get(selectedStar.id)!.stage.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-amber-900/40">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Stellar Age</span>
                      <span className="text-white font-medium">
                        {(systemTemporalState.stars.get(selectedStar.id)!.ageYears / 1_000_000_000).toFixed(3)} Gyr
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Evolved Class</span>
                      <span className="text-yellow-300 font-medium">
                        {systemTemporalState.stars.get(selectedStar.id)!.spectralClass}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Evolved Lum</span>
                      <span className="text-white font-medium">
                        {systemTemporalState.stars.get(selectedStar.id)!.luminositySolar.toFixed(3)} L☉
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Evolved Radius</span>
                      <span className="text-white font-medium">
                        {systemTemporalState.stars.get(selectedStar.id)!.radiusSolar.toFixed(3)} R☉
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= PLANET ================= */}
          {activeType === 'PLANET' && selectedPlanet && (
            <div className="space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white font-sans">{selectedPlanet.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">{selectedPlanet.id}</span>
                </div>
                {selectedPlanet.hasBiosphere && (
                  <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 rounded text-[10px] font-sans font-medium flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Biosphere Eligible
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                <div>
                  <span className="text-slate-500 block">Classification</span>
                  <span className="text-emerald-300 font-medium">{selectedPlanet.type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Orbital Distance</span>
                  <span className="text-slate-200">{selectedPlanet.semiMajorAxisAU.toFixed(2)} AU</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Orbital Period</span>
                  <span className="text-slate-200">{selectedPlanet.orbitalPeriodDays.toFixed(1)} days</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Eccentricity</span>
                  <span className="text-slate-200">{selectedPlanet.eccentricity.toFixed(3)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Radius</span>
                  <span className="text-slate-200">{selectedPlanet.radiusKm.toLocaleString()} km</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Mass</span>
                  <span className="text-slate-200">{selectedPlanet.massEarth.toFixed(2)} M⊕</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Avg Surface Temp</span>
                  <span className="text-slate-200">{selectedPlanet.averageTempKelvin.toFixed(0)} K</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Surface Gravity</span>
                  <span className="text-slate-200">{selectedPlanet.surfaceGravityG.toFixed(2)} g</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Hydrosphere</span>
                  <span className="text-sky-300">
                    {(selectedPlanet.hydrosphereCoverage * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Natural Moons</span>
                  <span className="text-slate-200">{selectedPlanet.moonCount}</span>
                </div>
              </div>

              {/* Dynamic Temporal Planetary State */}
              {systemTemporalState?.planets.get(selectedPlanet.id) && (
                <div className="p-2.5 bg-cyan-950/25 border border-cyan-800/50 rounded-lg space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-cyan-400 font-bold flex items-center gap-1 font-sans">
                      <Clock className="w-3 h-3" /> Temporal State ({currentYear?.toLocaleString()} YR)
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        systemTemporalState.planets.get(selectedPlanet.id)!.isInHabitableZone
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/70'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {systemTemporalState.planets.get(selectedPlanet.id)!.isInHabitableZone
                        ? 'IN HABITABLE ZONE'
                        : 'OUTSIDE HZ'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-cyan-900/40">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Orbital Phase</span>
                      <span className="text-white font-medium">
                        {(
                          (systemTemporalState.planets.get(selectedPlanet.id)!.orbitalPhaseRad * 180) /
                          Math.PI
                        ).toFixed(0)}
                        °
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Effective Temp</span>
                      <span className="text-cyan-200 font-medium">
                        {systemTemporalState.planets.get(selectedPlanet.id)!.effectiveTempKelvin.toFixed(0)} K
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Solar Flux</span>
                      <span className="text-white font-medium">
                        {systemTemporalState.planets.get(selectedPlanet.id)!.incidentFluxSolar.toFixed(3)} S☉
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Ice Coverage</span>
                      <span className="text-slate-300 font-medium">
                        {(systemTemporalState.planets.get(selectedPlanet.id)!.iceCoverage * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Atmospheric Breakdown */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-slate-500 font-medium tracking-wider">
                  Atmosphere ({selectedPlanet.atmosphere.surfacePressureAtm.toFixed(2)} atm)
                </span>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 bg-slate-900/40 p-2 rounded border border-slate-800/40">
                  <div>N₂: {(selectedPlanet.atmosphere.nitrogen * 100).toFixed(1)}%</div>
                  <div>O₂: {(selectedPlanet.atmosphere.oxygen * 100).toFixed(1)}%</div>
                  <div>CO₂: {(selectedPlanet.atmosphere.carbonDioxide * 100).toFixed(1)}%</div>
                  <div>CH₄: {(selectedPlanet.atmosphere.methane * 100).toFixed(2)}%</div>
                </div>
              </div>

              {/* Authoritative Biological & Habitability Layer */}
              {biosphereSummary && (
                <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-emerald-400 font-bold flex items-center gap-1 font-sans">
                      <Dna className="w-3 h-3 text-emerald-400" /> Biological State
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        biosphereSummary.habitability.overall === 'FAVORABLE'
                          ? 'bg-emerald-900/90 text-emerald-200'
                          : biosphereSummary.habitability.overall === 'POSSIBLE'
                          ? 'bg-cyan-900/90 text-cyan-200'
                          : biosphereSummary.habitability.overall === 'MARGINAL'
                          ? 'bg-amber-900/90 text-amber-200'
                          : 'bg-rose-950 text-rose-300'
                      }`}
                    >
                      {biosphereSummary.habitability.overall} ({(biosphereSummary.habitability.score * 100).toFixed(0)}%)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-emerald-900/40 text-[10px] font-mono">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-sans">Biosphere Status</span>
                      <span className={biosphereSummary.hasLife ? 'text-emerald-300 font-bold' : 'text-slate-400'}>
                        {biosphereSummary.hasLife ? 'ACTIVE LIFE' : 'STERILE'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-sans">Complexity</span>
                      <span className="text-white font-medium">{biosphereSummary.highestComplexity}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-sans">Active Species</span>
                      <span className="text-amber-300 font-medium">
                        {biosphereSummary.activeSpeciesCount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-sans">Est. Biomass</span>
                      <span className="text-indigo-300 font-medium">
                        {biosphereSummary.biomassTonsEstimate.toLocaleString()} t
                      </span>
                    </div>
                  </div>

                  {onInspectBiosphere && (
                    <button
                      id="btn-inspect-biosphere"
                      onClick={() => onInspectBiosphere(selectedPlanet)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded text-xs font-medium transition-colors"
                    >
                      <Dna className="w-3.5 h-3.5" />
                      <span>Inspect Biosphere & Species</span>
                    </button>
                  )}
                </div>
              )}

              {/* Authoritative Civilization & Technological Evolution Layer */}
              {civilizationSummary && civilizationSummary.hasCivilization && (
                <div className="p-2.5 bg-amber-950/30 border border-amber-800/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-amber-400 font-bold flex items-center gap-1 font-sans">
                      <Crown className="w-3 h-3 text-amber-400" /> Civilization State
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-900/90 text-amber-200 border border-amber-700/60">
                      {civilizationSummary.highestEra.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-amber-900/40 text-[10px] font-mono">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-sans">Polities</span>
                      <span className="text-amber-300 font-bold">
                        {civilizationSummary.activeCivilizationCount} Active
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-sans">Tech Level</span>
                      <span className="text-white font-medium">
                        {(civilizationSummary.highestTechLevel * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[9px] font-sans">Total Population</span>
                      <span className="text-white font-semibold">
                        {civilizationSummary.totalPopulation.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {onInspectCivilization && (
                    <button
                      id="btn-inspect-civilization"
                      onClick={() => onInspectCivilization(selectedPlanet)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 rounded text-xs font-medium transition-colors"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Inspect Civilization & Tech</span>
                    </button>
                  )}
                </div>
              )}

              {onFocusPlanet && (
                <button
                  id="btn-focus-planet"
                  onClick={() => onFocusPlanet(selectedPlanet)}
                  className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-sans text-xs font-medium rounded-lg transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Inspect Planet</span>
                </button>
              )}
            </div>
          )}

          {/* ================= MOON ================= */}
          {activeType === 'MOON' && selectedMoon && (
            <div className="space-y-2.5">
              <div>
                <h3 className="text-sm font-semibold text-white font-sans">{selectedMoon.name}</h3>
                <span className="text-[10px] text-slate-400 font-mono">{selectedMoon.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                <div>
                  <span className="text-slate-500 block">Radius</span>
                  <span className="text-slate-200">{selectedMoon.radiusKm.toLocaleString()} km</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Orbital Distance</span>
                  <span className="text-slate-200">
                    {selectedMoon.orbitalDistanceKm.toLocaleString()} km
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Orbital Period</span>
                  <span className="text-slate-200">{selectedMoon.orbitalPeriodDays.toFixed(2)} days</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tidally Locked</span>
                  <span className="text-sky-300 font-medium">
                    {selectedMoon.tidallyLocked ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {/* Dynamic Temporal Moon State */}
              {systemTemporalState?.moons.get(selectedMoon.id) && (
                <div className="p-2.5 bg-sky-950/25 border border-sky-800/50 rounded-lg space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-sky-400 font-bold flex items-center gap-1 font-sans">
                      <Clock className="w-3 h-3" /> Temporal Epoch ({currentYear?.toLocaleString()} YR)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-sky-900/40">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Orbital Phase</span>
                      <span className="text-white font-medium">
                        {(
                          (systemTemporalState.moons.get(selectedMoon.id)!.orbitalPhaseRad * 180) /
                          Math.PI
                        ).toFixed(0)}
                        °
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Rotation Angle</span>
                      <span className="text-sky-300 font-medium">
                        {(
                          (systemTemporalState.moons.get(selectedMoon.id)!.rotationAngleRad * 180) /
                          Math.PI
                        ).toFixed(0)}
                        °
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
