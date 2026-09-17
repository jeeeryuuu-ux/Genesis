/**
 * @license Apache-2.0
 * GENESIS TEMPORAL HUD & INSTRUMENTATION
 *
 * Dedicated temporal controller and cosmic clock display providing:
 * - Real-time epoch visualization (Years and Gyr)
 * - Deterministic Play/Pause & Speed controls (1x to 1,000,000x)
 * - Discrete manual stepping (-1 to +1B years)
 * - Direct Epoch Input with safe numerical validation
 * - Quick triggers for Timeline, Events, and Checkpoints
 */

import React, { useState } from 'react';
import {
  Bookmark,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  FastForward,
  Flame,
  History,
  Layers,
  List,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { ScaleTier, Year } from '../core/types.js';

export interface TemporalHUDProps {
  readonly currentYear: Year;
  readonly isPaused: boolean;
  readonly speed: number;
  readonly currentTier: ScaleTier;
  readonly eventCount: number;
  readonly checkpointCount: number;
  readonly showTimeline: boolean;
  readonly onTogglePlay: () => void;
  readonly onSetSpeed: (speed: number) => void;
  readonly onAdvance: (years: number) => void;
  readonly onSetYear: (targetYear: Year) => void;
  readonly onToggleTimeline: () => void;
  readonly onOpenEvents: () => void;
  readonly onOpenCheckpoints: () => void;
}

const SPEED_OPTIONS = [1, 10, 100, 1_000, 1_000_000];

export const TemporalHUD: React.FC<TemporalHUDProps> = ({
  currentYear,
  isPaused,
  speed,
  currentTier,
  eventCount,
  checkpointCount,
  showTimeline,
  onTogglePlay,
  onSetSpeed,
  onAdvance,
  onSetYear,
  onToggleTimeline,
  onOpenEvents,
  onOpenCheckpoints,
}) => {
  const [epochInput, setEpochInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [isCompact, setIsCompact] = useState(false);

  const handleEpochSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = epochInput.replace(/,/g, '').trim();
    const parsed = Number(cleaned);

    if (isNaN(parsed) || !Number.isFinite(parsed) || parsed < 0) {
      setInputError('Enter a valid non-negative cosmic year');
      return;
    }

    setInputError(null);
    onSetYear(Math.round(parsed));
    setEpochInput('');
  };

  const formattedGyr = (currentYear / 1_000_000_000).toFixed(4);

  return (
    <header
      id="genesis-temporal-hud"
      aria-label="Temporal Simulation HUD"
      className="absolute top-14 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto md:max-w-4xl z-30 pointer-events-none"
    >
      <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-2xl p-2.5 md:px-4 md:py-2.5 shadow-2xl pointer-events-auto text-slate-200 font-mono text-xs">
        {/* Main Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Cosmic Time Display & Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider">
                    COSMIC TIME
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                      isPaused
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-700/80 animate-pulse'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-slate-500' : 'bg-emerald-400'}`} />
                    {isPaused ? 'PAUSED' : 'PLAYING'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm md:text-base font-bold text-white tracking-wide">
                    {currentYear.toLocaleString()} YR
                  </span>
                  <span className="text-xs text-cyan-300 font-medium">({formattedGyr} Gyr)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Play/Pause & Speed Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {/* Play/Pause Button */}
            <button
              id="btn-simulation-play-pause"
              onClick={onTogglePlay}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-sans font-semibold text-xs transition-colors shadow-md ${
                isPaused
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/30'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
              }`}
              title={isPaused ? 'Start simulation playback' : 'Pause simulation playback'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
              <span>{isPaused ? 'Play' : 'Pause'}</span>
            </button>

            {/* Speeds */}
            <div className="hidden sm:flex items-center gap-0.5 border-l border-slate-800 pl-1.5">
              {SPEED_OPTIONS.map((spd) => (
                <button
                  key={spd}
                  onClick={() => onSetSpeed(spd)}
                  className={`px-1.5 py-1 rounded text-[10px] transition-colors ${
                    speed === spd
                      ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={`Speed: ${spd.toLocaleString()}x`}
                >
                  {spd >= 1_000_000 ? `${spd / 1_000_000}M×` : spd >= 1_000 ? `${spd / 1_000}k×` : `${spd}×`}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Drawer Triggers & Collapse */}
          <div className="flex items-center gap-1.5">
            {/* Timeline Toggle */}
            <button
              id="btn-toggle-timeline"
              onClick={onToggleTimeline}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                showTimeline
                  ? 'bg-cyan-950/90 text-cyan-300 border-cyan-700/70'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title="Toggle visual cosmic timeline"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Timeline</span>
            </button>

            {/* Events Log */}
            <button
              id="btn-open-events"
              onClick={onOpenEvents}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition-colors relative"
              title="Open Astronomical Event Log"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Events</span>
              {eventCount > 0 && (
                <span className="px-1 py-0.2 rounded-full text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  {eventCount}
                </span>
              )}
            </button>

            {/* Checkpoints */}
            <button
              id="btn-open-checkpoints"
              onClick={onOpenCheckpoints}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition-colors"
              title="Open Temporal Checkpoint Manager"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Checkpoints</span>
              {checkpointCount > 0 && (
                <span className="text-[10px] text-cyan-400 font-bold">({checkpointCount})</span>
              )}
            </button>

            <button
              id="btn-toggle-compact-hud"
              onClick={() => setIsCompact(!isCompact)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title={isCompact ? 'Expand controls' : 'Collapse controls'}
            >
              {isCompact ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Secondary Row: Stepping Buttons & Direct Epoch Input */}
        {!isCompact && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
            {/* Manual Discrete Step Controls */}
            <div className="flex items-center flex-wrap gap-1 text-[11px]">
              <span className="text-[10px] text-slate-500 font-sans mr-1">STEP:</span>
              <button
                onClick={() => onAdvance(-1_000)}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-colors"
                title="Step backward 1,000 years"
              >
                -1k
              </button>
              <button
                onClick={() => onAdvance(-100)}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-colors"
                title="Step backward 100 years"
              >
                -100
              </button>
              <button
                onClick={() => onAdvance(-10)}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-colors"
                title="Step backward 10 years"
              >
                -10
              </button>
              <button
                onClick={() => onAdvance(-1)}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-colors"
                title="Step backward 1 year"
              >
                -1
              </button>

              <div className="h-3 w-px bg-slate-800 mx-1" />

              <button
                onClick={() => onAdvance(1)}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 transition-colors"
                title="Step forward 1 year"
              >
                +1
              </button>
              <button
                onClick={() => onAdvance(10)}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 transition-colors"
                title="Step forward 10 years"
              >
                +10
              </button>
              <button
                onClick={() => onAdvance(100)}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 transition-colors"
                title="Step forward 100 years"
              >
                +100
              </button>
              <button
                onClick={() => onAdvance(1_000)}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 transition-colors"
                title="Step forward 1,000 years"
              >
                +1k
              </button>
              <button
                onClick={() => onAdvance(1_000_000)}
                className="px-1.5 py-0.5 rounded bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 font-semibold transition-colors"
                title="Analytical jump forward 1 Million years"
              >
                +1M
              </button>
              <button
                onClick={() => onAdvance(100_000_000)}
                className="px-1.5 py-0.5 rounded bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 font-semibold transition-colors"
                title="Analytical jump forward 100 Million years"
              >
                +100M
              </button>
              <button
                onClick={() => onAdvance(1_000_000_000)}
                className="px-1.5 py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700 font-bold transition-colors"
                title="Analytical jump forward 1 Billion years (O(1))"
              >
                +1B yr
              </button>
            </div>

            {/* Direct Epoch Input Form */}
            <form onSubmit={handleEpochSubmit} className="flex items-center gap-1.5">
              <input
                id="input-direct-epoch"
                type="text"
                value={epochInput}
                onChange={(e) => setEpochInput(e.target.value)}
                placeholder="Jump to Year..."
                className="w-28 md:w-36 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="submit"
                id="btn-submit-direct-epoch"
                className="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg text-[11px] font-sans font-medium transition-colors"
              >
                Jump
              </button>
            </form>
          </div>
        )}

        {inputError && (
          <div className="mt-1.5 text-[10px] text-rose-400 font-mono">⚠️ {inputError}</div>
        )}
      </div>
    </header>
  );
};
