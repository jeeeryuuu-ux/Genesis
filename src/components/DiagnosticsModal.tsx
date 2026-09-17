/**
 * @license Apache-2.0
 * GENESIS DEVELOPER DIAGNOSTICS & VERIFICATION INSTRUMENT
 *
 * Developer-only instrumentation panel displaying:
 * - Root Seed & dynamic coordinate jumping
 * - Real-time rendering stats (FPS, visible stars, draw calls, GPU objects)
 * - Navigation hierarchy state
 * - Full 26/26 automated test suite (Core PRNG, Astronomical Hierarchy, Phase 4 Exploration)
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Play,
  RefreshCw,
  Sliders,
  Terminal,
  X,
  XCircle,
} from 'lucide-react';
import { runDeterministicVerificationSuite, type Seed } from '../core/index.js';
import { runAstronomicalTests } from '../engine/hierarchy/tests.js';
import { runPhase4VerificationSuite } from '../engine/visualization/phase4-tests.js';
import { runTemporalVerificationSuite } from '../engine/simulation/temporal-tests.js';
import { runPhase51IntegrationSuite } from '../engine/simulation/integration-tests.js';
import { runBiologicalVerificationSuite } from '../engine/biology/biology-tests.js';
import { runCivilizationVerificationSuite } from '../engine/civilization/civilization-tests.js';
import { runExpansionVerificationSuite } from '../engine/expansion/expansion-tests.js';
import type { Galaxy, Moon, NavigationPath, Planet, StarSystem } from '../core/types.js';
import type { RendererStats } from '../rendering/types.js';

export interface DiagnosticsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly rootSeed: Seed;
  readonly path: NavigationPath;
  readonly stats: RendererStats;
  readonly selectedGalaxy?: Galaxy;
  readonly selectedSystem?: StarSystem;
  readonly selectedPlanet?: Planet;
  readonly selectedMoon?: Moon;
  readonly onChangeSeed: (seed: Seed) => void;
  readonly onJumpCoordinates: (path: NavigationPath) => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  rootSeed,
  path,
  stats,
  selectedGalaxy,
  selectedSystem,
  selectedPlanet,
  selectedMoon,
  onChangeSeed,
  onJumpCoordinates,
}) => {
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'TESTS' | 'COORDINATES'>('TELEMETRY');
  const [seedInput, setSeedInput] = useState(String(rootSeed));
  const [galaxyInput, setGalaxyInput] = useState(String(path.galaxyIndex ?? 0));
  const [systemInput, setSystemInput] = useState(String(path.systemIndex ?? 0));
  const [planetInput, setPlanetInput] = useState(String(path.planetIndex ?? 0));

  // Test suite execution
  const [testResults, setTestResults] = useState<{
    ran: boolean;
    allPassed: boolean;
    corePassed: number;
    coreTotal: number;
    astroPassed: number;
    astroTotal: number;
    phase4Passed: number;
    phase4Total: number;
    temporalPassed: number;
    temporalTotal: number;
    integrationPassed: number;
    integrationTotal: number;
    biologyPassed: number;
    biologyTotal: number;
    civilizationPassed: number;
    civilizationTotal: number;
    expansionPassed: number;
    expansionTotal: number;
    totalPassed: number;
    totalCount: number;
    details: Array<{ id: string; name: string; passed: boolean; details: string }>;
  }>(() => {
    // Run initial test report
    const core = runDeterministicVerificationSuite();
    const astro = runAstronomicalTests();
    const p4 = runPhase4VerificationSuite();
    const temporal = runTemporalVerificationSuite();
    const integration = runPhase51IntegrationSuite();
    const biology = runBiologicalVerificationSuite();
    const civ = runCivilizationVerificationSuite();
    const expansion = runExpansionVerificationSuite();

    const allItems = [
      ...core.results.map((r) => ({ id: r.id, name: r.name, passed: r.passed, details: r.details || r.message })),
      ...astro.map((r) => ({ id: r.id, name: r.name, passed: r.passed, details: r.details })),
      ...p4.map((r) => ({ id: r.id, name: r.name, passed: r.passed, details: r.details })),
      ...temporal.map((r) => ({ id: r.id, name: r.name, passed: r.passed, details: r.details })),
      ...integration.map((r) => ({ id: r.id, name: r.name, passed: r.passed, details: r.details })),
      ...biology.map((r) => ({ id: r.id, name: r.name, passed: r.passed, details: r.details })),
      ...civ.map((r) => ({ id: r.id, name: r.name, passed: r.passed, details: r.details })),
      ...expansion.map((r) => ({ id: r.id, name: r.name, passed: r.passed, details: r.details })),
    ];

    const totalPassed = allItems.filter((i) => i.passed).length;

    return {
      ran: true,
      allPassed: totalPassed === allItems.length,
      corePassed: core.passedTests,
      coreTotal: core.totalTests,
      astroPassed: astro.filter((a) => a.passed).length,
      astroTotal: astro.length,
      phase4Passed: p4.filter((p) => p.passed).length,
      phase4Total: p4.length,
      temporalPassed: temporal.filter((t) => t.passed).length,
      temporalTotal: temporal.length,
      integrationPassed: integration.filter((i) => i.passed).length,
      integrationTotal: integration.length,
      biologyPassed: biology.filter((b) => b.passed).length,
      biologyTotal: biology.length,
      civilizationPassed: civ.filter((c) => c.passed).length,
      civilizationTotal: civ.length,
      expansionPassed: expansion.filter((e) => e.passed).length,
      expansionTotal: expansion.length,
      totalPassed,
      totalCount: allItems.length,
      details: allItems,
    };
  });

  const handleRerunTests = () => {
    const core = runDeterministicVerificationSuite();
    const astro = runAstronomicalTests();
    const p4 = runPhase4VerificationSuite();
    const temporal = runTemporalVerificationSuite();
    const integration = runPhase51IntegrationSuite();
    const biology = runBiologicalVerificationSuite();
    const civ = runCivilizationVerificationSuite();
    const expansion = runExpansionVerificationSuite();

    const allItems = [
      ...core.results.map((r) => ({ id: r.id, name: r.name, passed: r.passed, details: r.details || r.message })),
      ...astro.map((r) => ({ id: r.id, name: r.name, passed: r.passed, details: r.details })),
      ...p4.map((r) => ({ id: r.id, name: r.name, passed: r.passed, details: r.details })),
      ...temporal.map((r) => ({ id: r.id, name: r.name, passed: r.passed, details: r.details })),
      ...integration.map((r) => ({ id: r.id, name: r.name, passed: r.passed, details: r.details })),
      ...biology.map((r) => ({ id: r.id, name: r.name, passed: r.passed, details: r.details })),
      ...civ.map((r) => ({ id: r.id, name: r.name, passed: r.passed, details: r.details })),
      ...expansion.map((r) => ({ id: r.id, name: r.name, passed: r.passed, details: r.details })),
    ];

    const totalPassed = allItems.filter((i) => i.passed).length;

    setTestResults({
      ran: true,
      allPassed: totalPassed === allItems.length,
      corePassed: core.passedTests,
      coreTotal: core.totalTests,
      astroPassed: astro.filter((a) => a.passed).length,
      astroTotal: astro.length,
      phase4Passed: p4.filter((p) => p.passed).length,
      phase4Total: p4.length,
      temporalPassed: temporal.filter((t) => t.passed).length,
      temporalTotal: temporal.length,
      integrationPassed: integration.filter((i) => i.passed).length,
      integrationTotal: integration.length,
      biologyPassed: biology.filter((b) => b.passed).length,
      biologyTotal: biology.length,
      civilizationPassed: civ.filter((c) => c.passed).length,
      civilizationTotal: civ.length,
      expansionPassed: expansion.filter((e) => e.passed).length,
      expansionTotal: expansion.length,
      totalPassed,
      totalCount: allItems.length,
      details: allItems,
    });
  };

  const handleApplyCoordinates = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSeed = parseInt(seedInput.trim(), 10);
    const parsedGalaxy = parseInt(galaxyInput.trim(), 10);
    const parsedSystem = parseInt(systemInput.trim(), 10);
    const parsedPlanet = parseInt(planetInput.trim(), 10);

    if (Number.isFinite(parsedSeed) && parsedSeed !== rootSeed) {
      onChangeSeed(parsedSeed >>> 0);
    }

    onJumpCoordinates({
      tier: 'STAR_SYSTEM',
      universeSeed: Number.isFinite(parsedSeed) ? parsedSeed >>> 0 : rootSeed,
      galaxyIndex: Number.isFinite(parsedGalaxy) ? parsedGalaxy : 0,
      systemIndex: Number.isFinite(parsedSystem) ? parsedSystem : 0,
      planetIndex: Number.isFinite(parsedPlanet) ? parsedPlanet : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      id="genesis-diagnostics-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diagnostics-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-mono"
    >
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h2 id="diagnostics-modal-title" className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
              GENESIS Instrumentation & Verification
            </h2>
          </div>
          <button
            id="close-diagnostics-btn"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-5 bg-slate-950/40 text-xs">
          <button
            id="tab-telemetry"
            onClick={() => setActiveTab('TELEMETRY')}
            className={`py-2.5 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'TELEMETRY'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Telemetry & State
          </button>
          <button
            id="tab-tests"
            onClick={() => setActiveTab('TESTS')}
            className={`py-2.5 px-4 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'TESTS'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Verification Tests</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] ${
                testResults.allPassed
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                  : 'bg-rose-950 text-rose-300 border border-rose-700/50'
              }`}
            >
              {testResults.totalPassed}/{testResults.totalCount}
            </span>
          </button>
          <button
            id="tab-coordinates"
            onClick={() => setActiveTab('COORDINATES')}
            className={`py-2.5 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'COORDINATES'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Coordinate Jump
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: TELEMETRY */}
          {activeTab === 'TELEMETRY' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Root Universe Seed</span>
                  <span className="text-cyan-300 font-bold text-sm">{rootSeed}</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Current Scale Tier</span>
                  <span className="text-amber-300 font-bold text-sm">{path.tier}</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Rendering FPS</span>
                  <span className="text-emerald-400 font-bold text-sm">{stats.fps} FPS</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Visible Stars</span>
                  <span className="text-slate-200 font-bold text-sm">
                    {stats.visibleStars.toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Visible Planets / Moons</span>
                  <span className="text-slate-200 font-bold text-sm">
                    {stats.visiblePlanets} / {stats.visibleMoons}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Scene Objects / Calls</span>
                  <span className="text-slate-200 font-bold text-sm">
                    {stats.objectCount} / {stats.drawCalls}
                  </span>
                </div>
              </div>

              {/* Navigation State Hierarchy */}
              <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-2">
                <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">
                  Active Hierarchical State
                </span>
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Selected Galaxy:</span>
                    <span className="text-indigo-300">
                      {selectedGalaxy ? `${selectedGalaxy.name} (${selectedGalaxy.id})` : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Selected Star System:</span>
                    <span className="text-amber-300">
                      {selectedSystem ? `${selectedSystem.name} (${selectedSystem.id})` : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Selected Planet:</span>
                    <span className="text-emerald-300">
                      {selectedPlanet ? `${selectedPlanet.name} (${selectedPlanet.id})` : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Selected Moon:</span>
                    <span className="text-sky-300">
                      {selectedMoon ? `${selectedMoon.name} (${selectedMoon.id})` : 'None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TESTS */}
          {activeTab === 'TESTS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-slate-300 font-medium">
                    Test Pass Rate: {testResults.totalPassed} / {testResults.totalCount}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Core: {testResults.corePassed}/{testResults.coreTotal} | Astro:{' '}
                    {testResults.astroPassed}/{testResults.astroTotal} | P4:{' '}
                    {testResults.phase4Passed}/{testResults.phase4Total} | P5:{' '}
                    {testResults.temporalPassed}/{testResults.temporalTotal} | P5.1:{' '}
                    {testResults.integrationPassed}/{testResults.integrationTotal} | Bio:{' '}
                    {testResults.biologyPassed}/{testResults.biologyTotal} | Civ:{' '}
                    {testResults.civilizationPassed}/{testResults.civilizationTotal} | Exp:{' '}
                    {testResults.expansionPassed}/{testResults.expansionTotal}
                  </span>
                </div>
                <button
                  id="btn-rerun-tests"
                  onClick={handleRerunTests}
                  className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Rerun All</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {testResults.details.map((t) => (
                  <div
                    key={t.id}
                    className="p-2 bg-slate-950/70 border border-slate-800/80 rounded flex items-start gap-2.5"
                  >
                    {t.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-300">{t.id}</span>
                        <span className="text-slate-400 truncate">{t.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 break-words">{t.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: COORDINATE JUMP */}
          {activeTab === 'COORDINATES' && (
            <form onSubmit={handleApplyCoordinates} className="space-y-3.5">
              <p className="text-slate-400 text-xs">
                Jump to any celestial coordinate in the procedural cosmos. All parameters are pure and
                reproducible from the root seed.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="input-root-seed" className="block text-slate-400 mb-1 text-[11px]">Root Seed</label>
                  <input
                    id="input-root-seed"
                    type="number"
                    value={seedInput}
                    onChange={(e) => setSeedInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-200 text-xs focus:border-cyan-400 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="input-galaxy-idx" className="block text-slate-400 mb-1 text-[11px]">Galaxy Index</label>
                  <input
                    id="input-galaxy-idx"
                    type="number"
                    min="0"
                    max="63"
                    value={galaxyInput}
                    onChange={(e) => setGalaxyInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-200 text-xs focus:border-cyan-400 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="input-system-idx" className="block text-slate-400 mb-1 text-[11px]">
                    Star System Index
                  </label>
                  <input
                    id="input-system-idx"
                    type="number"
                    min="0"
                    max="100000"
                    value={systemInput}
                    onChange={(e) => setSystemInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-200 text-xs focus:border-cyan-400 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="input-planet-idx" className="block text-slate-400 mb-1 text-[11px]">
                    Planet Index (Optional)
                  </label>
                  <input
                    id="input-planet-idx"
                    type="number"
                    min="0"
                    max="20"
                    value={planetInput}
                    onChange={(e) => setPlanetInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-200 text-xs focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>
              <button
                id="btn-apply-coordinates"
                type="submit"
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Jump to Target Celestial Node</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
