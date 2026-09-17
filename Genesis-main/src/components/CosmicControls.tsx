/**
 * @license Apache-2.0
 * GENESIS INTERACTION CONTROLS & NAVIGATION HINTS
 */

import React from 'react';
import {
  ArrowLeft,
  Compass,
  Maximize2,
  Minimize2,
  MousePointer,
  RotateCcw,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { NavigationPath, ScaleTier } from '../core/types.js';

export interface CosmicControlsProps {
  readonly path: NavigationPath;
  readonly onNavigate: (path: NavigationPath) => void;
  readonly onRandomizeSeed: () => void;
  readonly onToggleDiagnostics: () => void;
}

export const CosmicControls: React.FC<CosmicControlsProps> = ({
  path,
  onNavigate,
  onRandomizeSeed,
  onToggleDiagnostics,
}) => {
  const canGoBack = path.tier !== 'UNIVERSE';

  const handleGoBack = () => {
    switch (path.tier) {
      case 'MOON':
        onNavigate({
          tier: 'PLANET',
          universeSeed: path.universeSeed,
          galaxyIndex: path.galaxyIndex,
          systemIndex: path.systemIndex,
          planetIndex: path.planetIndex,
        });
        break;
      case 'PLANET':
      case 'STAR':
        onNavigate({
          tier: 'STAR_SYSTEM',
          universeSeed: path.universeSeed,
          galaxyIndex: path.galaxyIndex,
          systemIndex: path.systemIndex,
        });
        break;
      case 'STAR_SYSTEM':
        onNavigate({
          tier: 'GALAXY',
          universeSeed: path.universeSeed,
          galaxyIndex: path.galaxyIndex,
        });
        break;
      case 'GALAXY':
        onNavigate({
          tier: 'UNIVERSE',
          universeSeed: path.universeSeed,
        });
        break;
    }
  };

  return (
    <div
      id="genesis-cosmic-controls-container"
      className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20"
    >
      {/* Left: Quick Tier Step-Back Button & Navigation Hints */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        {canGoBack && (
          <button
            id="btn-nav-step-back"
            onClick={handleGoBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 backdrop-blur-md border border-slate-800 text-slate-200 text-xs font-mono rounded-lg transition-colors shadow-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ascend Level</span>
          </button>
        )}

        {/* Interaction hints */}
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-950/60 backdrop-blur-md border border-slate-900 rounded-lg text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="text-slate-300 font-medium">Drag</span> Orbit
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <span className="text-slate-300 font-medium">Scroll</span> Zoom
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <span className="text-slate-300 font-medium">Click</span> Select
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <span className="text-slate-300 font-medium">Double-click</span> Enter
          </span>
        </div>
      </div>

      {/* Right: Universe Seed randomizer & Developer verification toggle */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          id="btn-randomize-universe-seed"
          onClick={onRandomizeSeed}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white text-xs font-mono rounded-lg transition-colors shadow-lg"
          title="Regenerate universe from a new seed"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">New Seed</span>
        </button>

        <button
          id="btn-open-diagnostics"
          onClick={onToggleDiagnostics}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 hover:bg-slate-900 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-mono rounded-lg transition-colors shadow-lg"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Instrumentation</span>
        </button>
      </div>
    </div>
  );
};
