/**
 * @license Apache-2.0
 * GENESIS COSMIC TIMELINE & SCRUBBER
 *
 * Visual interactive timeline spanning deep cosmic time:
 * - From Big Bang (0 YR) through Present Epoch (~13.8 Gyr) to Deep Future (100 Gyr)
 * - Major landmark milestones
 * - Real-time deterministic event pins
 * - Interactive scrubber for O(1) analytical temporal jumps
 */

import React, { useRef, useState } from 'react';
import { Calendar, ChevronRight, Clock, FastForward, Flag, Sparkles } from 'lucide-react';
import type { Year } from '../core/types.js';
import type { AstronomicalEvent } from '../engine/simulation/types.js';

export interface CosmicTimelineProps {
  readonly currentYear: Year;
  readonly universeAgeYears: Year;
  readonly events: readonly AstronomicalEvent[];
  readonly onJumpToYear: (year: Year) => void;
}

// Landmark epochs for cosmic perspective
interface Landmark {
  readonly year: Year;
  readonly label: string;
  readonly category: string;
}

const COSMIC_LANDMARKS: Landmark[] = [
  { year: 0, label: 'Big Bang', category: 'Cosmological Genesis' },
  { year: 200_000_000, label: 'First Stars (Pop III)', category: 'Reionization' },
  { year: 4_500_000_000, label: 'Stellar Disk Assembly', category: 'Galactic Maturity' },
  { year: 13_800_000_000, label: 'Present Epoch', category: 'Modern Universe' },
  { year: 25_000_000_000, label: 'Star Formation Peak End', category: 'Stelliferous Decline' },
  { year: 50_000_000_000, label: 'Degenerate Star Era', category: 'White Dwarf Phase' },
  { year: 100_000_000_000, label: 'Deep Cosmic Horizon', category: 'Stellar Remnants' },
];

const MAX_TIMELINE_YEAR: Year = 100_000_000_000; // 100 Gyr

/**
 * Maps a cosmic year [0, MAX_TIMELINE_YEAR] to a percentage [0, 100]% on the scrubber.
 * Uses a gentle square-root curve so early cosmic epochs (0-15 Gyr) have ample resolution.
 */
function yearToPercent(year: Year): number {
  const clamped = Math.max(0, Math.min(MAX_TIMELINE_YEAR, year));
  const normalized = Math.sqrt(clamped / MAX_TIMELINE_YEAR);
  return normalized * 100;
}

function percentToYear(percent: number): Year {
  const p = Math.max(0, Math.min(100, percent)) / 100;
  return Math.round(p * p * MAX_TIMELINE_YEAR);
}

export const CosmicTimeline: React.FC<CosmicTimelineProps> = ({
  currentYear,
  universeAgeYears,
  events,
  onJumpToYear,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoverYear, setHoverYear] = useState<Year | null>(null);
  const [hoverEvent, setHoverEvent] = useState<AstronomicalEvent | null>(null);

  const currentPercent = yearToPercent(currentYear);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = (clickX / rect.width) * 100;
    const targetYear = percentToYear(percent);
    onJumpToYear(targetYear);
  };

  const handleTrackMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = (clickX / rect.width) * 100;
    setHoverYear(percentToYear(percent));
  };

  return (
    <div
      id="genesis-cosmic-timeline"
      className="w-full bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-2xl font-mono text-xs text-slate-300 select-none"
    >
      {/* Top row: Current position & epoch scrub status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Cosmic Timeline
          </span>
          <span className="text-[11px] text-cyan-300 font-bold">
            {(currentYear / 1_000_000_000).toFixed(3)} Gyr
          </span>
        </div>

        {hoverYear !== null && (
          <div className="text-[10px] text-amber-400 flex items-center gap-1">
            <span>Scrub to:</span>
            <span className="font-semibold">{(hoverYear / 1_000_000_000).toFixed(3)} Gyr</span>
            <span className="text-slate-500">({hoverYear.toLocaleString()} YR)</span>
          </div>
        )}
      </div>

      {/* Main Interactive Track */}
      <div
        ref={trackRef}
        id="timeline-track-container"
        onClick={handleTrackClick}
        onMouseMove={handleTrackMouseMove}
        onMouseLeave={() => {
          setHoverYear(null);
          setHoverEvent(null);
        }}
        className="relative h-6 bg-slate-900/90 rounded-lg cursor-pointer border border-slate-800 overflow-visible group hover:border-slate-700 transition-colors"
      >
        {/* Progress Fill */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-950/60 to-cyan-500/30 rounded-l-lg pointer-events-none"
          style={{ width: `${currentPercent}%` }}
        />

        {/* Milestone Tick Marks */}
        {COSMIC_LANDMARKS.map((m) => {
          const p = yearToPercent(m.year);
          return (
            <div
              key={m.label}
              className="absolute top-0 bottom-0 w-px bg-slate-700/60 pointer-events-none flex flex-col justify-end pb-1"
              style={{ left: `${p}%` }}
              title={`${m.label} - ${m.year.toLocaleString()} YR`}
            >
              <div className="w-1.5 h-1.5 -ml-[3px] rounded-full bg-slate-600 group-hover:bg-slate-500 transition-colors" />
            </div>
          );
        })}

        {/* Real-time Astronomical Event Pins */}
        {events.slice(-15).map((evt) => {
          const p = yearToPercent(evt.year);
          const isCataclysmic = evt.severity === 'CATACLYSMIC';
          return (
            <button
              key={evt.eventId}
              onClick={(e) => {
                e.stopPropagation();
                onJumpToYear(evt.year);
              }}
              onMouseEnter={() => setHoverEvent(evt)}
              className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 -ml-1.25 rounded-full z-10 transition-transform hover:scale-150 shadow-md ${
                isCataclysmic
                  ? 'bg-rose-500 border border-rose-200 animate-pulse'
                  : 'bg-amber-400 border border-amber-100'
              }`}
              title={`${evt.eventType}: ${evt.description} (Year ${evt.year.toLocaleString()})`}
            />
          );
        })}

        {/* Current Year Playhead Cursor */}
        <div
          id="timeline-playhead-cursor"
          className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] pointer-events-none -ml-0.5 z-20"
          style={{ left: `${currentPercent}%` }}
        >
          <div className="w-3 h-3 -ml-1 -top-1 absolute rounded-full bg-cyan-300 border border-white shadow-lg" />
        </div>
      </div>

      {/* Hovered Event Tooltip */}
      {hoverEvent && (
        <div className="mt-2 px-2.5 py-1.5 bg-slate-900/95 border border-amber-500/50 rounded-md text-[11px] text-slate-200 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="font-semibold text-amber-300 truncate">{hoverEvent.entityName}:</span>
            <span className="text-slate-300 truncate">{hoverEvent.description}</span>
          </div>
          <span className="text-slate-400 text-[10px] shrink-0 ml-2">
            Year {hoverEvent.year.toLocaleString()}
          </span>
        </div>
      )}

      {/* Bottom Landmark Badges */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-900 text-[10px] text-slate-500">
        <button
          onClick={() => onJumpToYear(0)}
          className="hover:text-cyan-400 transition-colors"
          title="Jump to Big Bang (Year 0)"
        >
          0 YR (Origin)
        </button>
        <button
          onClick={() => onJumpToYear(universeAgeYears)}
          className="hover:text-cyan-400 transition-colors font-medium text-slate-400"
          title="Jump to Present Epoch (13.8 Gyr)"
        >
          {(universeAgeYears / 1_000_000_000).toFixed(1)} Gyr (Present)
        </button>
        <button
          onClick={() => onJumpToYear(50_000_000_000)}
          className="hover:text-cyan-400 transition-colors"
          title="Jump to White Dwarf Era (50 Gyr)"
        >
          50 Gyr (Remnants)
        </button>
        <button
          onClick={() => onJumpToYear(MAX_TIMELINE_YEAR)}
          className="hover:text-cyan-400 transition-colors"
          title="Jump to Deep Horizon (100 Gyr)"
        >
          100 Gyr (Deep Future)
        </button>
      </div>
    </div>
  );
};
