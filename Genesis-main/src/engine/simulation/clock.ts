/**
 * @license Apache-2.0
 * GENESIS SIMULATION CLOCK
 *
 * Provides a deterministic temporal driver for universe evolution.
 *
 * CRITICAL ARCHITECTURAL GUARANTEES:
 * - NO dependency on Date.now(), new Date(), performance.now(), or Math.random().
 * - Time steps are exact mathematical offsets on discrete astronomical years.
 * - Idempotent and deterministic: same initial year + same operations => identical output.
 */

import type { Year } from '../../core/types.js';
import type { ClockState } from './types.js';

export class SimulationClock {
  private _currentYear: Year;
  private _baseYear: Year;
  private _isPaused: boolean;
  private _speed: number;

  constructor(initialYear: Year = 13_800_000_000, initialSpeed: number = 1) {
    this._baseYear = initialYear;
    this._currentYear = initialYear;
    this._isPaused = true;
    this._speed = initialSpeed;
  }

  public get currentYear(): Year {
    return this._currentYear;
  }

  public get baseYear(): Year {
    return this._baseYear;
  }

  public get isPaused(): boolean {
    return this._isPaused;
  }

  public get speed(): number {
    return this._speed;
  }

  public getState(): ClockState {
    return {
      currentYear: this._currentYear,
      isPaused: this._isPaused,
      speed: this._speed,
    };
  }

  /**
   * Deterministically advances the clock by a discrete number of astronomical years.
   * Supports positive and negative time steps.
   */
  public advance(years: number): Year {
    if (!Number.isFinite(years)) {
      throw new Error(`[SimulationClock.advance] Invalid years parameter: ${years}`);
    }
    this._currentYear = Math.max(0, this._currentYear + Math.round(years));
    return this._currentYear;
  }

  /**
   * Sets the clock to an absolute cosmic year.
   */
  public setYear(year: Year): Year {
    if (!Number.isFinite(year) || year < 0) {
      throw new Error(`[SimulationClock.setYear] Invalid year: ${year}`);
    }
    this._currentYear = Math.round(year);
    return this._currentYear;
  }

  public play(): void {
    this._isPaused = false;
  }

  public pause(): void {
    this._isPaused = true;
  }

  public togglePause(): boolean {
    this._isPaused = !this._isPaused;
    return this._isPaused;
  }

  public setSpeed(speed: number): void {
    if (!Number.isFinite(speed) || speed <= 0) {
      throw new Error(`[SimulationClock.setSpeed] Invalid speed: ${speed}`);
    }
    this._speed = speed;
  }

  public reset(initialYear?: Year): void {
    const target = initialYear ?? this._baseYear;
    this._currentYear = target;
    this._isPaused = true;
  }
}
