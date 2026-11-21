import { Injectable } from '@angular/core';
import { GAMES, PlannerEvent, PlannerState } from '../models/planner.model';
import { isStaminaConfig } from './stamina';

export const EMPTY_STATE: PlannerState = { goals: [], inventory: {}, stamina: {}, staminaConfig: {}, events: [] };

export function isPlannerEvent(value: unknown): value is PlannerEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Record<string, unknown>;
  if (typeof event.id !== 'string' || !event.id ||
      !GAMES.some((game) => game.id === event.game) ||
      typeof event.name !== 'string' || !event.name.trim() ||
      typeof event.description !== 'string' || event.source !== 'manual' ||
      typeof event.startsAt !== 'string' || typeof event.endsAt !== 'string') return false;
  const start = Date.parse(event.startsAt);
  const end = Date.parse(event.endsAt);
  return Number.isFinite(start) && Number.isFinite(end) && end > start;
}

/** Swap this implementation for a remote one (e.g. Amplify/DynamoDB) later. */
@Injectable({ providedIn: 'root' })
export class PlannerStorage {
  private readonly key = 'planner-state-v1';

  load(): PlannerState {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? this.parse(raw) : structuredClone(EMPTY_STATE);
    } catch (error) {
      console.error('Unable to load planner data. The saved data has not been overwritten.', error);
      throw error;
    }
  }

  save(state: PlannerState): void {
    localStorage.setItem(this.key, JSON.stringify(state));
  }

  parse(raw: string): PlannerState {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || (data.events !== undefined &&
        (!Array.isArray(data.events) || !data.events.every(isPlannerEvent)))) {
      throw new Error('Invalid planner data');
    }
    if (data.staminaConfig !== undefined && (!data.staminaConfig || typeof data.staminaConfig !== 'object' ||
        Array.isArray(data.staminaConfig) || Object.entries(data.staminaConfig).some(([id, value]) => {
          const game = GAMES.find((item) => item.id === id);
          return !game || !isStaminaConfig(game.id, value);
        }))) throw new Error('Invalid stamina settings');
    return {
      goals: Array.isArray(data.goals) ? data.goals : [],
      inventory: data.inventory && typeof data.inventory === 'object' ? data.inventory : {},
      stamina: data.stamina && typeof data.stamina === 'object' ? data.stamina : {},
      staminaConfig: data.staminaConfig ?? {},
      events: data.events ?? [],
    };
  }
}
