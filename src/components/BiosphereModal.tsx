/**
 * @license Apache-2.0
 * GENESIS BIOSPHERE & SPECIES INSPECTOR
 *
 * Immersive scientific instrumentation displaying:
 * - Planetary habitability breakdown with visual meters
 * - Biosphere statistics & abiogenesis pathway
 * - Species taxonomy catalog with detailed trait inspector
 * - Procedural visual descriptors & anatomical metrics
 * - Sparse food web & trophic link visualization
 * - Historical fossil records & extinct lineages
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Dna,
  Eye,
  Flame,
  Globe,
  Layers,
  Leaf,
  Network,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Thermometer,
  Trees,
  Waves,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import type { Planet, Year } from '../core/types.js';
import type { Biosphere, Species } from '../engine/biology/types.js';

export interface BiosphereModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly planet: Planet;
  readonly biosphere: Biosphere;
  readonly currentYear: Year;
}

export const BiosphereModal: React.FC<BiosphereModalProps> = ({
  isOpen,
  onClose,
  planet,
  biosphere,
  currentYear,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SPECIES' | 'FOOD_WEB' | 'FOSSILS'>('OVERVIEW');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null);
  const [speciesFilter, setSpeciesFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const { summary, activeSpecies, extinctSpecies, ecosystem } = biosphere;
  const hab = summary.habitability;

  // Selected species for detailed inspector
  const allSpecies = [...activeSpecies, ...extinctSpecies];
  const activeSelectedSpecies =
    allSpecies.find((s) => s.id === selectedSpeciesId) ?? activeSpecies[0] ?? extinctSpecies[0];

  // Filtered species list
  const filteredSpecies = allSpecies.filter((sp) => {
    if (speciesFilter !== 'ALL' && sp.status !== speciesFilter) return false;
    if (
      searchQuery.trim() &&
      !sp.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !sp.traits.ecological.trophicRole.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div
      id="modal-biosphere"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md font-sans text-slate-200"
    >
      <div className="relative w-full max-w-5xl h-[88vh] max-h-[820px] bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950/80 border border-emerald-700/60 rounded-lg text-emerald-400">
              <Dna className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Biosphere & Biological Analysis
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                  {planet.name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    hab.overall === 'FAVORABLE'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : hab.overall === 'POSSIBLE'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                      : hab.overall === 'MARGINAL'
                      ? 'bg-amber-950 text-amber-300 border border-amber-700'
                      : 'bg-rose-950 text-rose-300 border border-rose-700'
                  }`}
                >
                  {hab.overall} HABITABILITY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulated biological layer at Epoch {(currentYear / 1_000_000_000).toFixed(3)} Gyr
              </p>
            </div>
          </div>

          <button
            id="btn-close-biosphere"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Close Biosphere Analysis"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-5 bg-slate-950/50 border-b border-slate-800 shrink-0 gap-2">
          <button
            id="tab-bio-overview"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-medium transition-colors ${
              activeTab === 'OVERVIEW'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Habitability & Biosphere</span>
          </button>

          <button
            id="tab-bio-species"
            onClick={() => setActiveTab('SPECIES')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-medium transition-colors ${
              activeTab === 'SPECIES'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span>Species Taxonomy ({activeSpecies.length})</span>
          </button>

          <button
            id="tab-bio-foodweb"
            onClick={() => setActiveTab('FOOD_WEB')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-medium transition-colors ${
              activeTab === 'FOOD_WEB'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Ecosystem & Food Web ({ecosystem.links.length} Links)</span>
          </button>

          <button
            id="tab-bio-fossils"
            onClick={() => setActiveTab('FOSSILS')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-medium transition-colors ${
              activeTab === 'FOSSILS'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Fossil Record ({extinctSpecies.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ================= TAB 1: OVERVIEW & HABITABILITY ================= */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-5">
              {/* Top Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Life Status</span>
                  <span
                    className={`text-base font-bold flex items-center gap-1.5 mt-0.5 ${
                      summary.hasLife ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {summary.hasLife ? (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-400" /> Active Biosphere
                      </>
                    ) : (
                      'Sterile / Prebiotic'
                    )}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {summary.abiogenesisYear
                      ? `Abiogenesis: ${(summary.abiogenesisYear / 1_000_000_000).toFixed(2)} Gyr`
                      : 'No organic emergence'}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Highest Complexity</span>
                  <span className="text-base font-bold text-cyan-300 mt-0.5 block">
                    {summary.highestComplexity}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Origin: {summary.dominantOrigin ?? 'N/A'}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Total Active Species</span>
                  <span className="text-base font-bold text-amber-300 mt-0.5 block">
                    {summary.activeSpeciesCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Extinct Lineages: {summary.extinctSpeciesCount.toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Biomass Estimate</span>
                  <span className="text-base font-bold text-indigo-300 mt-0.5 block">
                    {summary.biomassTonsEstimate.toLocaleString()} tons
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Energy: {ecosystem.primaryEnergySource.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Habitability Breakdown Section */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4.5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-emerald-400" />
                      Planetary Habitability Index (Score: {(hab.score * 100).toFixed(1)}%)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{hab.factors.summaryText}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-400">
                      {(hab.score * 100).toFixed(0)}
                    </span>
                    <span className="text-xs text-slate-500"> / 100</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-800">
                  {/* Meter 1: Temperature */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Temperature Suitability
                      </span>
                      <span className="text-slate-400 font-mono">
                        {(hab.temperatureSuitability * 100).toFixed(0)}% (Planet: {planet.averageTempKelvin} K)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 rounded-full transition-all"
                        style={{ width: `${hab.temperatureSuitability * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Meter 2: Water */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <Waves className="w-3.5 h-3.5 text-sky-400" /> Liquid Hydrosphere Availability
                      </span>
                      <span className="text-slate-400 font-mono">
                        {(hab.waterAvailability * 100).toFixed(0)}% (Coverage: {(planet.hydrosphereCoverage * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all"
                        style={{ width: `${hab.waterAvailability * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Meter 3: Atmosphere */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 text-cyan-400" /> Atmospheric Pressure & Chemistry
                      </span>
                      <span className="text-slate-400 font-mono">
                        {(hab.atmosphericSuitability * 100).toFixed(0)}% ({planet.atmosphere.surfacePressureAtm.toFixed(2)} atm)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all"
                        style={{ width: `${hab.atmosphericSuitability * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Meter 4: Energy */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Incident Solar Flux & Energy
                      </span>
                      <span className="text-slate-400 font-mono">
                        {(hab.energyAvailability * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all"
                        style={{ width: `${hab.energyAvailability * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Meter 5: Stability */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-indigo-400" /> Environmental & Stellar Stability
                      </span>
                      <span className="text-slate-400 font-mono">
                        {(hab.environmentalStability * 100).toFixed(0)}% (Eccentricity: {planet.eccentricity.toFixed(3)})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all"
                        style={{ width: `${hab.environmentalStability * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: SPECIES TAXONOMY ================= */}
          {activeTab === 'SPECIES' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full">
              {/* Species Catalog Sidebar (5 cols) */}
              <div className="md:col-span-5 flex flex-col space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search species or trophic role..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <select
                    value={speciesFilter}
                    onChange={(e) => setSpeciesFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ALL">All Status</option>
                    <option value="THRIVING">Thriving</option>
                    <option value="STABLE">Stable</option>
                    <option value="DECLINING">Declining</option>
                    <option value="ENDANGERED">Endangered</option>
                    <option value="EXTINCT">Extinct</option>
                  </select>
                </div>

                <div className="space-y-1.5 overflow-y-auto max-h-[500px] pr-1">
                  {filteredSpecies.map((sp) => {
                    const isSelected = sp.id === activeSelectedSpecies?.id;
                    return (
                      <button
                        key={sp.id}
                        onClick={() => setSelectedSpeciesId(sp.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-slate-800/90 border-emerald-500 shadow-md'
                            : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white italic">{sp.name}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              sp.status === 'THRIVING'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                : sp.status === 'STABLE'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                                : sp.status === 'DECLINING'
                                ? 'bg-amber-950 text-amber-300 border border-amber-700'
                                : sp.status === 'ENDANGERED'
                                ? 'bg-orange-950 text-orange-300 border border-orange-700'
                                : 'bg-rose-950 text-rose-300 border border-rose-700'
                            }`}
                          >
                            {sp.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span>{sp.complexity}</span>
                          <span>•</span>
                          <span>{sp.traits.ecological.trophicRole}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-mono">
                            {(sp.fitness.overallFitness * 100).toFixed(0)}% Fit
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {filteredSpecies.length === 0 && (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      No biological species found matching query.
                    </div>
                  )}
                </div>
              </div>

              {/* Species Inspector Detail View (7 cols) */}
              <div className="md:col-span-7 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4 overflow-y-auto max-h-[560px]">
                {activeSelectedSpecies ? (
                  <>
                    {/* Header */}
                    <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white italic">
                            {activeSelectedSpecies.name}
                          </h3>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {activeSelectedSpecies.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Emerged at {(activeSelectedSpecies.originEpochYear / 1_000_000_000).toFixed(3)} Gyr via{' '}
                          {activeSelectedSpecies.origin} pathway
                          {activeSelectedSpecies.extinctionEpochYear && (
                            <span className="text-rose-400 ml-1">
                              (Extinct at {(activeSelectedSpecies.extinctionEpochYear / 1_000_000_000).toFixed(3)} Gyr)
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Overall Fitness</span>
                        <span className="text-lg font-bold text-emerald-400">
                          {(activeSelectedSpecies.fitness.overallFitness * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Fitness Breakdown */}
                    <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-300">Environmental Fitness Factors</span>
                        <span className="text-[11px] text-amber-400">
                          Limiting: {activeSelectedSpecies.fitness.limitingFactor}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
                        <div>
                          <span className="text-slate-500 block">Temperature</span>
                          <span className="text-slate-200 font-mono font-medium">
                            {(activeSelectedSpecies.fitness.temperatureFitness * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Water Dep.</span>
                          <span className="text-slate-200 font-mono font-medium">
                            {(activeSelectedSpecies.fitness.waterFitness * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Pressure</span>
                          <span className="text-slate-200 font-mono font-medium">
                            {(activeSelectedSpecies.fitness.pressureFitness * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Energy</span>
                          <span className="text-slate-200 font-mono font-medium">
                            {(activeSelectedSpecies.fitness.energyFitness * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Radiation</span>
                          <span className="text-slate-200 font-mono font-medium">
                            {(activeSelectedSpecies.fitness.radiationFitness * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Vitals Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-2.5 bg-slate-900/40 rounded border border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">Population</span>
                        <span className="text-white font-medium">
                          {activeSelectedSpecies.populationEstimate.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-900/40 rounded border border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">Metabolism</span>
                        <span className="text-emerald-300 font-medium">
                          {activeSelectedSpecies.traits.metabolic.metabolism}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-900/40 rounded border border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">Trophic Role</span>
                        <span className="text-cyan-300 font-medium">
                          {activeSelectedSpecies.traits.ecological.trophicRole} ({activeSelectedSpecies.traits.ecological.dietStrategy})
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-900/40 rounded border border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">Habitat Preference</span>
                        <span className="text-slate-200 font-medium">
                          {activeSelectedSpecies.traits.ecological.habitatPreference.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-900/40 rounded border border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">Lifespan</span>
                        <span className="text-slate-200 font-medium">
                          {activeSelectedSpecies.traits.ecological.lifespanYears} years
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-900/40 rounded border border-slate-800/60">
                        <span className="text-slate-500 block text-[10px]">Reproduction</span>
                        <span className="text-slate-200 font-medium">
                          {activeSelectedSpecies.traits.ecological.reproductionMode.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Physical & Physiological Traits */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-300 block">
                        Physiological Tolerances & Anatomy
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/40 p-2.5 rounded border border-slate-800/60">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Thermal Tolerance Range</span>
                          <span className="text-slate-200">
                            {activeSelectedSpecies.traits.physical.temperatureToleranceKelvin.min}K –{' '}
                            {activeSelectedSpecies.traits.physical.temperatureToleranceKelvin.max}K (Optimal:{' '}
                            {activeSelectedSpecies.traits.physical.temperatureToleranceKelvin.optimal}K)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Pressure Range</span>
                          <span className="text-slate-200">
                            {activeSelectedSpecies.traits.physical.pressureToleranceAtm.min} –{' '}
                            {activeSelectedSpecies.traits.physical.pressureToleranceAtm.max} atm
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Body Scale / Mass</span>
                          <span className="text-slate-200">
                            {activeSelectedSpecies.traits.physical.sizeMeters >= 0.01
                              ? `${activeSelectedSpecies.traits.physical.sizeMeters.toFixed(2)} m`
                              : `${(activeSelectedSpecies.traits.physical.sizeMeters * 1e6).toFixed(1)} µm`}{' '}
                            ({activeSelectedSpecies.traits.physical.densityKgM3} kg/m³)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Mobility</span>
                          <span className="text-slate-200">
                            {activeSelectedSpecies.traits.physical.mobilityType}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Procedural Visual Descriptors */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-300 block">
                        Procedural Visual Morphology
                      </span>
                      <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Symmetry:</span>
                            <span className="text-white font-medium">{activeSelectedSpecies.visual.symmetry}</span>
                            <span className="text-slate-400 ml-2">Appendages:</span>
                            <span className="text-white font-medium">{activeSelectedSpecies.visual.appendageCount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Integument / Texture:</span>
                            <span className="text-white font-medium">{activeSelectedSpecies.visual.surfaceTexture}</span>
                            {activeSelectedSpecies.visual.bioluminescence && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-700">
                                Bioluminescent
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">Pigmentation</span>
                            <span className="text-[11px] text-slate-400">
                              Hues: {activeSelectedSpecies.visual.primaryHue}° / {activeSelectedSpecies.visual.secondaryHue}°
                            </span>
                          </div>
                          <div
                            className="w-5 h-5 rounded-full border border-slate-700 shadow"
                            style={{ backgroundColor: `hsl(${activeSelectedSpecies.visual.primaryHue}, 70%, 50%)` }}
                          />
                          <div
                            className="w-5 h-5 rounded-full border border-slate-700 shadow"
                            style={{ backgroundColor: `hsl(${activeSelectedSpecies.visual.secondaryHue}, 65%, 45%)` }}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-slate-500 text-xs">
                    Select a species from the list to inspect detailed biological traits.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 3: FOOD WEB ================= */}
          {activeTab === 'FOOD_WEB' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Network className="w-4 h-4 text-emerald-400" />
                    Trophic Stability & Food Web Dynamics
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Primary Energy Input: {ecosystem.primaryEnergySource.replace('_', ' ')}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Stability Index</span>
                    <span className="text-base font-bold text-emerald-400">
                      {(ecosystem.trophicStabilityIndex * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Directed Links</span>
                    <span className="text-base font-bold text-white">{ecosystem.links.length}</span>
                  </div>
                </div>
              </div>

              {/* Trophic Tiers Distribution */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Primary Producers</span>
                  <span className="text-base font-bold text-emerald-400">{ecosystem.producersCount}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Autotrophic base</span>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Primary Consumers</span>
                  <span className="text-base font-bold text-cyan-400">{ecosystem.consumersCount}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Herbivores & grazers</span>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Secondary Predators</span>
                  <span className="text-base font-bold text-rose-400">{ecosystem.predatorsCount}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Carnivores</span>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-medium">Decomposers</span>
                  <span className="text-base font-bold text-amber-400">{ecosystem.decomposersCount}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Detritivores & recyclers</span>
                </div>
              </div>

              {/* Ecological Links Catalog */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Active Trophic & Predation Interactions
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto">
                  {ecosystem.links.map((link, idx) => {
                    const src = allSpecies.find((s) => s.id === link.sourceSpeciesId);
                    const tgt = allSpecies.find((s) => s.id === link.targetSpeciesId);

                    return (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-semibold text-white truncate italic">
                            {src?.name ?? link.sourceSpeciesId}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-slate-300 truncate italic">
                            {tgt?.name ?? link.targetSpeciesId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              link.relationshipType === 'PREDATION'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : link.relationshipType === 'GRAZING'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {link.relationshipType}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {(link.strength * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {ecosystem.links.length === 0 && (
                    <div className="col-span-2 p-8 text-center text-slate-500 text-xs">
                      No active trophic links in this primitive or sterile biosphere.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: FOSSILS ================= */}
          {activeTab === 'FOSSILS' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  Historical Fossil Record & Extinct Biological Lineages
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Extinct species remain permanently cataloged in the authoritative planetary geological record.
                </p>
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto">
                {extinctSpecies.map((sp) => (
                  <div
                    key={sp.id}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white italic">{sp.name}</span>
                        <span className="px-1.5 py-0.2 bg-rose-950/80 text-rose-300 border border-rose-800 rounded text-[9px] font-bold">
                          EXTINCT
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{sp.id}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Existed: {(sp.originEpochYear / 1_000_000_000).toFixed(3)} Gyr –{' '}
                        {sp.extinctionEpochYear
                          ? `${(sp.extinctionEpochYear / 1_000_000_000).toFixed(3)} Gyr`
                          : 'Unknown'}{' '}
                        • Complexity: {sp.complexity} • Niche: {sp.traits.ecological.trophicRole}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Extinction Cause</span>
                      <span className="text-xs font-semibold text-rose-300">
                        {sp.fitness.limitingFactor}
                      </span>
                    </div>
                  </div>
                ))}
                {extinctSpecies.length === 0 && (
                  <div className="p-12 text-center text-slate-500 text-xs">
                    No historical extinction events recorded on this world.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
