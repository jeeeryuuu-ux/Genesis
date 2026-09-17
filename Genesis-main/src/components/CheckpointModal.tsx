/**
 * @license Apache-2.0
 * GENESIS TEMPORAL CHECKPOINT MANAGER
 *
 * Provides deterministic simulation state capture and restoration:
 * - Snapshots current cosmic year, sparse cache states, and event counts
 * - Allows deterministic instant rollback/restoration to any saved checkpoint
 */

import React, { useState } from 'react';
import { Bookmark, Check, History, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import type { Year } from '../core/types.js';
import type { SimulationCheckpoint } from '../engine/simulation/types.js';

export interface CheckpointModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly checkpoints: readonly SimulationCheckpoint[];
  readonly currentYear: Year;
  readonly onCreateCheckpoint: (label?: string) => void;
  readonly onRestoreCheckpoint: (id: string) => void;
  readonly onDeleteCheckpoint: (id: string) => void;
}

export const CheckpointModal: React.FC<CheckpointModalProps> = ({
  isOpen,
  onClose,
  checkpoints,
  currentYear,
  onCreateCheckpoint,
  onRestoreCheckpoint,
  onDeleteCheckpoint,
}) => {
  const [labelInput, setLabelInput] = useState('');
  const [restoredId, setRestoredId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateCheckpoint(labelInput.trim() || undefined);
    setLabelInput('');
  };

  const handleRestore = (id: string) => {
    onRestoreCheckpoint(id);
    setRestoredId(id);
    setTimeout(() => setRestoredId(null), 1500);
  };

  return (
    <div
      id="genesis-checkpoint-modal-backdrop"
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans"
    >
      <div
        id="genesis-checkpoint-dialog"
        className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fadeIn"
      >
        {/* Header */}
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Temporal Checkpoints</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/80">
              {checkpoints.length} Stored
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Capture Form */}
        <form onSubmit={handleCreate} className="p-4 bg-slate-900/40 border-b border-slate-800/80">
          <label className="block text-xs font-mono text-slate-300 mb-1.5 font-medium">
            Capture New Snapshot (Current Year: {currentYear.toLocaleString()} YR)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Label (e.g. Red Giant Expansion, Habitable Earth)"
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-medium rounded-lg transition-colors shrink-0 shadow-lg shadow-cyan-900/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Snapshot</span>
            </button>
          </div>
        </form>

        {/* Checkpoint list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {checkpoints.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-slate-400 font-medium">No checkpoints recorded</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Capture snapshots at critical evolutionary milestones to restore identical states.
              </p>
            </div>
          ) : (
            [...checkpoints].reverse().map((cp) => {
              const isCurrent = cp.year === currentYear;
              const wasRestored = restoredId === cp.id;
              return (
                <div
                  key={cp.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-cyan-950/20 border-cyan-500/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <h4 className="text-xs font-semibold text-white font-sans">{cp.label}</h4>
                      <span className="text-[10px] font-mono text-slate-400">ID: {cp.id}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                      Year {cp.year.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-500">
                    <span>
                      {cp.systemStates.size} system(s) cached • {cp.eventCount} events
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestore(cp.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                          wasRestored
                            ? 'bg-emerald-600 text-white font-medium'
                            : 'bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-800/70'
                        }`}
                        title="Restore exact simulation year & state"
                      >
                        {wasRestored ? <Check className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                        <span>{wasRestored ? 'Restored!' : 'Restore'}</span>
                      </button>
                      <button
                        onClick={() => onDeleteCheckpoint(cp.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors rounded"
                        title="Delete checkpoint"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
