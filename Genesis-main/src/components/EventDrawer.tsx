/**
 * @license Apache-2.0
 * GENESIS ASTRONOMICAL EVENT DRAWER
 *
 * Exposes deterministic astronomical events detected across simulation evolution:
 * - Stellar stage transitions (Main Sequence, Red Giant, White Dwarf, etc.)
 * - Supernova explosions
 * - Planetary climate shifts (glaciation, runaway greenhouse)
 * - Habitable zone boundary crossings
 * - Direct epoch navigation from event timestamps
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  Compass,
  ExternalLink,
  Flame,
  Globe,
  Orbit,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import type { Year } from '../core/types.js';
import type {
  AstronomicalEvent,
  AstronomicalEventType,
  EventSeverity,
} from '../engine/simulation/types.js';

export interface EventDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly events: readonly AstronomicalEvent[];
  readonly currentYear: Year;
  readonly onJumpToEvent: (year: Year) => void;
  readonly onClearEvents: () => void;
}

export const EventDrawer: React.FC<EventDrawerProps> = ({
  isOpen,
  onClose,
  events,
  currentYear,
  onJumpToEvent,
  onClearEvents,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | EventSeverity>('ALL');

  if (!isOpen) return null;

  const filteredEvents = events.filter((e) => {
    if (severityFilter === 'ALL') return true;
    return e.severity === severityFilter;
  });

  const getEventIcon = (type: AstronomicalEventType) => {
    switch (type) {
      case 'SUPERNOVA':
        return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case 'STELLAR_STAGE_CHANGE':
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'PLANETARY_CLIMATE_SHIFT':
        return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
      case 'HABITABLE_ZONE_CROSSING':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-400" />;
      case 'ORBITAL_MILESTONE':
        return <Orbit className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const getSeverityBadge = (sev: EventSeverity) => {
    switch (sev) {
      case 'CATACLYSMIC':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-950/80 text-rose-400 border border-rose-800/80">
            CATACLYSMIC
          </span>
        );
      case 'NOTABLE':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950/80 text-amber-400 border border-amber-800/80">
            NOTABLE
          </span>
        );
      case 'INFO':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800">
            INFO
          </span>
        );
    }
  };

  return (
    <aside
      id="genesis-event-drawer"
      aria-label="Astronomical Event Log"
      className="fixed inset-y-0 right-0 w-96 max-w-full bg-slate-950/95 backdrop-blur-xl border-l border-slate-800/90 shadow-2xl z-40 flex flex-col font-sans"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white tracking-wide font-sans">
              Astronomical Events
            </h2>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-bold">
              {events.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Deterministic celestial history log
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
          title="Close Event Drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="px-4 py-2.5 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5">
          {(['ALL', 'CATACLYSMIC', 'NOTABLE', 'INFO'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2 py-0.8 rounded text-[10px] transition-colors ${
                severityFilter === sev
                  ? 'bg-cyan-600 text-white font-medium'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {events.length > 0 && (
          <button
            onClick={onClearEvents}
            className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors"
            title="Clear event log history"
          >
            Clear
          </button>
        )}
      </div>

      {/* Event List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 font-mono text-xs">
        {filteredEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Orbit className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs text-slate-400 font-sans font-medium">No events logged yet</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[220px]">
              Advance the cosmic clock or jump across epochs to simulate stellar transitions and
              climatic shifts.
            </p>
          </div>
        ) : (
          [...filteredEvents].reverse().map((evt) => {
            const isCurrentYear = evt.year === currentYear;
            return (
              <div
                key={evt.eventId}
                className={`p-3 rounded-xl border transition-all ${
                  isCurrentYear
                    ? 'bg-cyan-950/30 border-cyan-500/50 shadow-lg'
                    : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {getEventIcon(evt.eventType)}
                    <span className="font-sans font-medium text-slate-200 text-xs truncate max-w-[170px]">
                      {evt.entityName}
                    </span>
                  </div>
                  {getSeverityBadge(evt.severity)}
                </div>

                <p className="text-[11px] text-slate-300 font-sans leading-relaxed mb-2.5">
                  {evt.description}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-800/60">
                  <span className="font-mono">Year {evt.year.toLocaleString()}</span>
                  <button
                    onClick={() => onJumpToEvent(evt.year)}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors font-medium px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800"
                  >
                    <span>Jump to Epoch</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/50 text-[10px] font-mono text-slate-500 flex items-center justify-between">
        <span>Current Epoch:</span>
        <span className="text-slate-300 font-bold">{currentYear.toLocaleString()} YR</span>
      </div>
    </aside>
  );
};
