/**
 * @license Apache-2.0
 * GENESIS DYNAMIC NAVIGATION BREADCRUMB
 */

import React from 'react';
import { ChevronRight, Sparkles, Disc, Globe, Orbit, Sun, Moon as MoonIcon } from 'lucide-react';
import type { Galaxy, Moon, NavigationPath, Planet, ScaleTier, Star, StarSystem } from '../core/types.js';

export interface NavigationBreadcrumbProps {
  readonly path: NavigationPath;
  readonly galaxy?: Galaxy;
  readonly starSystem?: StarSystem;
  readonly planet?: Planet;
  readonly star?: Star;
  readonly moon?: Moon;
  readonly onNavigate: (path: NavigationPath) => void;
}

export const NavigationBreadcrumb: React.FC<NavigationBreadcrumbProps> = ({
  path,
  galaxy,
  starSystem,
  planet,
  star,
  moon,
  onNavigate,
}) => {
  const navigateToUniverse = () => {
    onNavigate({
      tier: 'UNIVERSE',
      universeSeed: path.universeSeed,
    });
  };

  const navigateToGalaxy = () => {
    if (path.galaxyIndex === undefined) return;
    onNavigate({
      tier: 'GALAXY',
      universeSeed: path.universeSeed,
      galaxyIndex: path.galaxyIndex,
    });
  };

  const navigateToStarSystem = () => {
    if (path.galaxyIndex === undefined || path.systemIndex === undefined) return;
    onNavigate({
      tier: 'STAR_SYSTEM',
      universeSeed: path.universeSeed,
      galaxyIndex: path.galaxyIndex,
      systemIndex: path.systemIndex,
    });
  };

  const navigateToPlanet = () => {
    if (
      path.galaxyIndex === undefined ||
      path.systemIndex === undefined ||
      path.planetIndex === undefined
    )
      return;
    onNavigate({
      tier: 'PLANET',
      universeSeed: path.universeSeed,
      galaxyIndex: path.galaxyIndex,
      systemIndex: path.systemIndex,
      planetIndex: path.planetIndex,
    });
  };

  return (
    <nav
      id="genesis-breadcrumb-nav"
      aria-label="Cosmic Hierarchy Breadcrumb"
      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-950/75 backdrop-blur-md border border-slate-800/80 rounded-full text-xs font-mono text-slate-300 shadow-xl"
    >
      {/* Tier 1: Universe */}
      <button
        id="breadcrumb-universe"
        onClick={navigateToUniverse}
        className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
          path.tier === 'UNIVERSE'
            ? 'text-cyan-400 font-semibold bg-cyan-950/40'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span>Universe</span>
      </button>

      {/* Tier 2: Galaxy */}
      {path.galaxyIndex !== undefined && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <button
            id="breadcrumb-galaxy"
            onClick={navigateToGalaxy}
            className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
              path.tier === 'GALAXY'
                ? 'text-indigo-400 font-semibold bg-indigo-950/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Disc className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate max-w-[120px]">
              {galaxy ? galaxy.name : `G-${path.galaxyIndex}`}
            </span>
          </button>
        </>
      )}

      {/* Tier 3: Star System */}
      {path.systemIndex !== undefined && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <button
            id="breadcrumb-system"
            onClick={navigateToStarSystem}
            className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
              path.tier === 'STAR_SYSTEM'
                ? 'text-amber-400 font-semibold bg-amber-950/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Orbit className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate max-w-[120px]">
              {starSystem ? starSystem.name : `SYS-${path.systemIndex}`}
            </span>
          </button>
        </>
      )}

      {/* Tier 4: Star */}
      {path.tier === 'STAR' && star && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded text-yellow-300 font-semibold bg-yellow-950/40">
            <Sun className="w-3.5 h-3.5 text-yellow-400" />
            <span className="truncate max-w-[120px]">{star.name}</span>
          </div>
        </>
      )}

      {/* Tier 4: Planet */}
      {path.planetIndex !== undefined && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <button
            id="breadcrumb-planet"
            onClick={navigateToPlanet}
            className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
              path.tier === 'PLANET'
                ? 'text-emerald-400 font-semibold bg-emerald-950/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate max-w-[120px]">
              {planet ? planet.name : `Planet #${path.planetIndex}`}
            </span>
          </button>
        </>
      )}

      {/* Tier 5: Moon */}
      {path.tier === 'MOON' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded text-sky-300 font-semibold bg-sky-950/40">
            <MoonIcon className="w-3.5 h-3.5 text-sky-400" />
            <span className="truncate max-w-[120px]">
              {moon ? moon.name : `Moon #${path.moonIndex ?? 0}`}
            </span>
          </div>
        </>
      )}
    </nav>
  );
};
