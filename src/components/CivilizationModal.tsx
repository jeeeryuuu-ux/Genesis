/**
 * @license Apache-2.0
 * GENESIS CIVILIZATION & TECHNOLOGICAL EVOLUTION INSPECTOR (PHASE 7)
 *
 * Immersive scientific instrumentation displaying:
 * - Authoritative civilization telemetry (population, era, status, stability)
 * - Multi-polity selector across planetary civilizations
 * - Societal organization profile & demographic carrying capacity
 * - Technological domain progression & era roadmap
 * - Planetary resource stocks, consumption stress & ecological stability
 * - Chronological milestone history & historical civilization archives
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Cpu,
  Crown,
  Database,
  Dna,
  Flame,
  Globe,
  HardDrive,
  History,
  Layers,
  Milestone,
  Radio,
  Rocket,
  Shield,
  Sparkles,
  Users,
  Wheat,
  X,
  Zap,
} from 'lucide-react';
import type { Planet, Year } from '../core/types.js';
import type {
  Civilization,
  CivilizationRecord,
  TechnologicalEra,
} from '../engine/civilization/types.js';

export interface CivilizationModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly planet: Planet;
  readonly civilizations: readonly Civilization[];
  readonly historicalRecords: readonly CivilizationRecord[];
  readonly currentYear: Year;
}

const ERA_ORDER: readonly TechnologicalEra[] = [
  'STONE_AGE',
  'AGRICULTURAL',
  'BRONZE_IRON',
  'ORGANIZED_PRE_INDUSTRIAL',
  'INDUSTRIAL',
  'ATOMIC_INFORMATION',
  'INTERPLANETARY',
  'POST_SCARCITY',
];

const ERA_LABELS: Record<TechnologicalEra, string> = {
  STONE_AGE: 'Stone Age',
  AGRICULTURAL: 'Agrarian Era',
  BRONZE_IRON: 'Bronze & Iron Age',
  ORGANIZED_PRE_INDUSTRIAL: 'Pre-Industrial',
  INDUSTRIAL: 'Industrial Era',
  ATOMIC_INFORMATION: 'Information Age',
  INTERPLANETARY: 'Interplanetary',
  POST_SCARCITY: 'Post-Scarcity',
};

export const CivilizationModal: React.FC<CivilizationModalProps> = ({
  isOpen,
  onClose,
  planet,
  civilizations,
  historicalRecords,
  currentYear,
}) => {
  const [selectedCivId, setSelectedCivId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'TECHNOLOGY' | 'RESOURCES' | 'CHRONOLOGY' | 'ARCHIVE'
  >('OVERVIEW');

  if (!isOpen) return null;

  const activeCiv =
    civilizations.find((c) => c.id === selectedCivId) ??
    civilizations[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ADVANCED':
        return 'text-cyan-400 bg-cyan-950/80 border-cyan-700/60';
      case 'INDUSTRIAL':
        return 'text-amber-400 bg-amber-950/80 border-amber-700/60';
      case 'DEVELOPING':
        return 'text-emerald-400 bg-emerald-950/80 border-emerald-700/60';
      case 'EMERGING':
        return 'text-lime-400 bg-lime-950/80 border-lime-700/60';
      case 'COLLAPSING':
        return 'text-rose-400 bg-rose-950/80 border-rose-700/60 animate-pulse';
      case 'EXTINCT':
        return 'text-slate-400 bg-slate-900 border-slate-700';
      default:
        return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div
      id="modal-civilization"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md font-sans text-slate-200"
    >
      <div className="relative w-full max-w-5xl h-[88vh] max-h-[840px] bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-950/80 border border-amber-700/60 rounded-lg text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  {activeCiv ? activeCiv.name : 'Civilization Registry'}
                </h2>
                {activeCiv && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(
                      activeCiv.status
                    )}`}
                  >
                    {activeCiv.status}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Planet: {planet.name}</span>
                <span>•</span>
                <span>Epoch: {currentYear.toLocaleString()} YR</span>
                {activeCiv && (
                  <>
                    <span>•</span>
                    <span className="text-amber-300/90">
                      Species: {activeCiv.speciesName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Multi-civilization switcher if > 1 polity */}
            {civilizations.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                <span className="text-[10px] text-slate-500 font-medium px-1">Polities:</span>
                {civilizations.map((civ, idx) => (
                  <button
                    key={civ.id}
                    id={`btn-select-civ-${civ.id}`}
                    onClick={() => setSelectedCivId(civ.id)}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                      (activeCiv?.id ?? '') === civ.id
                        ? 'bg-amber-600 text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>
            )}

            <button
              id="btn-close-civilization-modal"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-5 bg-slate-950/50 border-b border-slate-800 gap-1 shrink-0 overflow-x-auto">
          <button
            id="tab-civ-overview"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'OVERVIEW'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Overview & Society</span>
          </button>
          <button
            id="tab-civ-technology"
            onClick={() => setActiveTab('TECHNOLOGY')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'TECHNOLOGY'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Technology Domains</span>
          </button>
          <button
            id="tab-civ-resources"
            onClick={() => setActiveTab('RESOURCES')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'RESOURCES'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Resources & Stability</span>
          </button>
          <button
            id="tab-civ-chronology"
            onClick={() => setActiveTab('CHRONOLOGY')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'CHRONOLOGY'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Milestone className="w-3.5 h-3.5" />
            <span>Milestones ({activeCiv?.milestones.length ?? 0})</span>
          </button>
          <button
            id="tab-civ-archive"
            onClick={() => setActiveTab('ARCHIVE')}
            className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'ARCHIVE'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historical Records ({historicalRecords.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!activeCiv && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Globe className="w-12 h-12 mb-3 stroke-1 text-slate-600" />
              <p className="text-sm font-medium">No active civilization recorded at this epoch.</p>
              <p className="text-xs text-slate-600 mt-1">
                Advance temporal simulation or inspect historical archives.
              </p>
            </div>
          )}

          {activeCiv && activeTab === 'OVERVIEW' && (
            <div className="space-y-5">
              {/* Primary Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium block">
                    Current Population
                  </span>
                  <span className="text-xl font-bold text-white font-mono">
                    {activeCiv.population.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Peak: {activeCiv.peakPopulation.toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium block">
                    Technological Era
                  </span>
                  <span className="text-base font-bold text-amber-300">
                    {ERA_LABELS[activeCiv.technology.era]}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Level {(activeCiv.technology.level * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium block">
                    Systemic Stability
                  </span>
                  <span
                    className={`text-xl font-bold font-mono ${
                      activeCiv.stability.stabilityIndex > 0.6
                        ? 'text-emerald-400'
                        : activeCiv.stability.stabilityIndex > 0.3
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {(activeCiv.stability.stabilityIndex * 100).toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Stress: {activeCiv.stability.primaryStressFactor}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium block">
                    Emergence Epoch
                  </span>
                  <span className="text-base font-bold text-slate-200 font-mono">
                    {activeCiv.emergenceEpochYear.toLocaleString()} YR
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Age: {Math.max(0, currentYear - activeCiv.emergenceEpochYear).toLocaleString()} yrs
                  </span>
                </div>
              </div>

              {/* Societal Organization Profile */}
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase text-slate-400 font-bold tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" /> Societal Organization & Settlement
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                    {activeCiv.society.settlementType.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800/60 space-y-1">
                    <span className="text-slate-400 block text-[11px]">Social Complexity</span>
                    <span className="text-white font-mono font-medium">
                      {(activeCiv.society.socialComplexity * 100).toFixed(0)}%
                    </span>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full"
                        style={{ width: `${activeCiv.society.socialComplexity * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800/60 space-y-1">
                    <span className="text-slate-400 block text-[11px]">Collective Coordination</span>
                    <span className="text-white font-mono font-medium">
                      {(activeCiv.society.collectiveCoordination * 100).toFixed(0)}%
                    </span>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full"
                        style={{ width: `${activeCiv.society.collectiveCoordination * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800/60 space-y-1">
                    <span className="text-slate-400 block text-[11px]">Governance Cohesion</span>
                    <span className="text-white font-mono font-medium">
                      {(activeCiv.society.governanceCohesion * 100).toFixed(0)}%
                    </span>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full"
                        style={{ width: `${activeCiv.society.governanceCohesion * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800/60 space-y-1">
                    <span className="text-slate-400 block text-[11px]">Cultural Diversity</span>
                    <span className="text-white font-mono font-medium">
                      {(activeCiv.society.culturalDiversity * 100).toFixed(0)}%
                    </span>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full"
                        style={{ width: `${activeCiv.society.culturalDiversity * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Biological Foundation & Cognitive Profile */}
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
                <h3 className="text-xs uppercase text-slate-400 font-bold tracking-wider flex items-center gap-1.5">
                  <Dna className="w-3.5 h-3.5 text-emerald-400" /> Origin Species Cognition & Dexterity
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800/60">
                    <span className="text-slate-400 block text-[11px]">Cognitive Complexity</span>
                    <span className="text-emerald-300 font-mono font-medium">
                      {(activeCiv.intelligence.cognitiveComplexity * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800/60">
                    <span className="text-slate-400 block text-[11px]">Tool Manipulation</span>
                    <span className="text-emerald-300 font-mono font-medium">
                      {(activeCiv.intelligence.toolUse * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800/60">
                    <span className="text-slate-400 block text-[11px]">Abstract Reasoning</span>
                    <span className="text-emerald-300 font-mono font-medium">
                      {(activeCiv.intelligence.abstractReasoning * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800/60">
                    <span className="text-slate-400 block text-[11px]">Civ Potential Score</span>
                    <span className="text-amber-300 font-mono font-medium">
                      {(activeCiv.intelligence.civilizationPotential * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeCiv && activeTab === 'TECHNOLOGY' && (
            <div className="space-y-5">
              {/* Technological Era Roadmap */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider block">
                  Evolutionary Era Timeline
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {ERA_ORDER.map((era) => {
                    const isCurrent = activeCiv.technology.era === era;
                    const isUnlocked =
                      ERA_ORDER.indexOf(era) <= ERA_ORDER.indexOf(activeCiv.technology.era);
                    return (
                      <div
                        key={era}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          isCurrent
                            ? 'bg-amber-950/80 border-amber-500 text-amber-200 ring-1 ring-amber-500/50'
                            : isUnlocked
                            ? 'bg-slate-900/90 border-slate-700 text-slate-300'
                            : 'bg-slate-950/40 border-slate-800/40 text-slate-600'
                        }`}
                      >
                        <span className="text-[10px] block font-semibold truncate">
                          {ERA_LABELS[era]}
                        </span>
                        <span className="text-[9px] block text-slate-400 mt-0.5">
                          {isCurrent ? 'ACTIVE' : isUnlocked ? 'ACHIEVED' : 'LOCKED'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Technology Sub-Domains */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  {
                    name: 'Theoretical & Scientific Knowledge',
                    val: activeCiv.technology.knowledgeLevel,
                    desc: 'Mathematical formalism, empirical methodology & taxonomy',
                    icon: BookOpen,
                  },
                  {
                    name: 'Energy Generation & Grids',
                    val: activeCiv.technology.energyTechnology,
                    desc: 'Combustion, fission, fusion & planetary grid transmission',
                    icon: Zap,
                  },
                  {
                    name: 'Microcomputation & Automation',
                    val: activeCiv.technology.computation,
                    desc: 'Semiconductors, logic gates, neural processing & algorithmic logic',
                    icon: Cpu,
                  },
                  {
                    name: 'Biotechnology & Genetics',
                    val: activeCiv.technology.biotechnology,
                    desc: 'Agricultural genomics, metabolic intervention & medicine',
                    icon: Dna,
                  },
                  {
                    name: 'Structural & Mechanical Engineering',
                    val: activeCiv.technology.engineering,
                    desc: 'Metallurgy, structural architecture & heavy mechanics',
                    icon: Layers,
                  },
                  {
                    name: 'Autonomous Industrial Systems',
                    val: activeCiv.technology.automation,
                    desc: 'Robotics, assembly pipelines & closed-loop manufacturing',
                    icon: HardDrive,
                  },
                  {
                    name: 'Orbital Transit & Spaceflight',
                    val: activeCiv.technology.spaceflight,
                    desc: 'Chemical/nuclear rocketry, orbital insertion & satellites',
                    icon: Rocket,
                  },
                  {
                    name: 'Planetary Ecological Engineering',
                    val: activeCiv.technology.planetaryEngineering,
                    desc: 'Atmospheric scrubbing, magnetosphere shielding & terraforming',
                    icon: Globe,
                  },
                ].map((dom) => {
                  const Icon = dom.icon;
                  return (
                    <div
                      key={dom.name}
                      className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-amber-400" /> {dom.name}
                        </span>
                        <span className="font-mono text-amber-300 font-semibold">
                          {(dom.val * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{dom.desc}</p>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all"
                          style={{ width: `${dom.val * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeCiv && activeTab === 'RESOURCES' && (
            <div className="space-y-5">
              {/* Planetary Resource Stocks */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <span className="text-xs uppercase text-slate-400 font-bold tracking-wider block">
                  Planetary Resource Reserves
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-900/60 border border-slate-800/60 rounded-lg space-y-1">
                    <span className="text-slate-400 block text-[11px]">Biological Productivity</span>
                    <span className="text-white font-mono font-medium">
                      {(activeCiv.resources.biologicalProductivity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 border border-slate-800/60 rounded-lg space-y-1">
                    <span className="text-slate-400 block text-[11px]">Freshwater Availability</span>
                    <span className="text-white font-mono font-medium">
                      {(activeCiv.resources.freshwaterAvailability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 border border-slate-800/60 rounded-lg space-y-1">
                    <span className="text-slate-400 block text-[11px]">Mineral Availability</span>
                    <span className="text-white font-mono font-medium">
                      {(activeCiv.resources.mineralAvailability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 border border-slate-800/60 rounded-lg space-y-1">
                    <span className="text-slate-400 block text-[11px]">Incident Energy Flux</span>
                    <span className="text-white font-mono font-medium">
                      {(activeCiv.resources.energyAvailability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 border border-slate-800/60 rounded-lg space-y-1">
                    <span className="text-slate-400 block text-[11px]">Arable Land Fraction</span>
                    <span className="text-white font-mono font-medium">
                      {(activeCiv.resources.fertileLand * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 border border-slate-800/60 rounded-lg space-y-1">
                    <span className="text-slate-400 block text-[11px]">Raw Material Access</span>
                    <span className="text-white font-mono font-medium">
                      {(activeCiv.resources.accessibleRawMaterials * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Stress Factors & Stability Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <span className="text-xs uppercase text-slate-400 font-bold tracking-wider block">
                    Systemic Pressures
                  </span>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Resource Depletion Stress</span>
                        <span className="font-mono text-rose-300">
                          {(activeCiv.resources.resourceStress * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full"
                          style={{ width: `${activeCiv.resources.resourceStress * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Ecological Overburden</span>
                        <span className="font-mono text-amber-300">
                          {(activeCiv.stability.ecologicalStress * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${activeCiv.stability.ecologicalStress * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Population Pressure</span>
                        <span className="font-mono text-indigo-300">
                          {(activeCiv.stability.populationPressure * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${activeCiv.stability.populationPressure * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <span className="text-xs uppercase text-slate-400 font-bold tracking-wider block">
                    Resilience Pillars
                  </span>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Environmental Stability</span>
                        <span className="font-mono text-emerald-300">
                          {(activeCiv.stability.environmentalStability * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${activeCiv.stability.environmentalStability * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Social Coordination</span>
                        <span className="font-mono text-emerald-300">
                          {(activeCiv.stability.socialCoordination * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${activeCiv.stability.socialCoordination * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Technological Resilience</span>
                        <span className="font-mono text-emerald-300">
                          {(activeCiv.stability.technologicalResilience * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${activeCiv.stability.technologicalResilience * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeCiv && activeTab === 'CHRONOLOGY' && (
            <div className="space-y-3">
              <span className="text-xs uppercase text-slate-400 font-bold tracking-wider block">
                Historical Milestone Log
              </span>
              <div className="space-y-2.5">
                {activeCiv.milestones.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium text-xs flex items-center gap-1.5">
                        <Milestone className="w-3.5 h-3.5 text-amber-400" /> {m.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-amber-300">
                        {m.year.toLocaleString()} YR
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{m.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ARCHIVE' && (
            <div className="space-y-3">
              <span className="text-xs uppercase text-slate-400 font-bold tracking-wider block">
                Historical Civilizations on {planet.name}
              </span>
              {historicalRecords.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No extinct or archived civilizations on record.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {historicalRecords.map((rec) => (
                    <div
                      key={rec.civilizationId}
                      className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold">{rec.name}</span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {rec.emergenceEpoch.toLocaleString()} YR –{' '}
                          {rec.extinctionEpoch ? `${rec.extinctionEpoch.toLocaleString()} YR` : 'Present'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">Origin Species:</span>
                          <span>{rec.primaryOriginSpecies}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Peak Population:</span>
                          <span className="font-mono">{rec.peakPopulation.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Peak Era:</span>
                          <span>{ERA_LABELS[rec.peakEra]}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Terminal Factor:</span>
                          <span className="text-rose-400">{rec.extinctionCause ?? 'Active'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
