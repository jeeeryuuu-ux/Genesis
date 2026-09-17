/**
 * @license Apache-2.0
 * GENESIS TEMPORAL CHECKPOINT SYSTEM
 *
 * Provides lightweight in-memory snapshotting and deterministic state restoration.
 */

import type { EntityId, Year } from '../../core/types.js';
import type { SimulationCheckpoint, SystemTemporalState } from './types.js';

export class CheckpointManager {
  private checkpoints: Map<string, SimulationCheckpoint> = new Map();
  private checkpointCounter: number = 0;

  /**
   * Captures an in-memory simulation checkpoint.
   */
  public createCheckpoint(
    year: Year,
    systemStates: ReadonlyMap<EntityId, SystemTemporalState>,
    eventCount: number,
    label?: string
  ): SimulationCheckpoint {
    this.checkpointCounter++;
    const id = `chk_${year}_${this.checkpointCounter}`;

    // Deep clone system states map
    const clonedStates = new Map<EntityId, SystemTemporalState>();
    for (const [idKey, state] of systemStates) {
      clonedStates.set(idKey, {
        ...state,
        stars: new Map(state.stars),
        planets: new Map(state.planets),
        moons: new Map(state.moons),
      });
    }

    const checkpoint: SimulationCheckpoint = {
      id,
      label: label ?? `Epoch ${year.toLocaleString()} Checkpoint`,
      year,
      capturedAtTimestamp: this.checkpointCounter, // Deterministic counter, not Date.now()
      systemStates: clonedStates,
      eventCount,
    };

    this.checkpoints.set(id, checkpoint);
    return checkpoint;
  }

  /**
   * Retrieves a checkpoint by ID.
   */
  public getCheckpoint(id: string): SimulationCheckpoint | undefined {
    return this.checkpoints.get(id);
  }

  /**
   * Returns all stored checkpoints in chronological order.
   */
  public getAllCheckpoints(): readonly SimulationCheckpoint[] {
    return Array.from(this.checkpoints.values()).sort((a, b) => a.year - b.year);
  }

  /**
   * Alias for getAllCheckpoints.
   */
  public list(): readonly SimulationCheckpoint[] {
    return this.getAllCheckpoints();
  }

  /**
   * Deletes a checkpoint by ID.
   */
  public delete(id: string): boolean {
    return this.checkpoints.delete(id);
  }

  public deleteCheckpoint(id: string): boolean {
    return this.delete(id);
  }

  /**
   * Clears all checkpoints from memory.
   */
  public clear(): void {
    this.checkpoints.clear();
    this.checkpointCounter = 0;
  }
}
