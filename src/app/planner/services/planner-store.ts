import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { GAMES, GameId, Goal, PathRange, PlannerEntity, PlannerEvent, PlannerState, StaminaConfig, StaminaSettings } from '../models/planner.model';
import { isGoalCompatible, requirements, totalCost } from './calc';
import { isPlannerEvent, PlannerStorage } from './planner-storage';
import { CatalogService } from './catalog-service';
import { currentStamina, isStaminaConfig, staminaRules } from './stamina';

@Injectable({ providedIn: 'root' })
export class PlannerStore {
  private readonly storage = inject(PlannerStorage);
  private readonly catalog = inject(CatalogService);
  private readonly state = signal<PlannerState>(this.storage.load());

  readonly goals = computed(() => this.state().goals);
  readonly inventory = computed(() => this.state().inventory);
  readonly stamina = computed(() => this.state().stamina);
  readonly staminaConfig = computed(() => this.state().staminaConfig);
  readonly events = computed(() => this.state().events);

  constructor() {
    effect(() => this.storage.save(this.state()));
  }

  addGoal(entity: PlannerEntity, ranges?: Record<string, PathRange>): void {
    ranges = ranges ?? Object.fromEntries(entity.paths.map((path) =>
      [path.id, { current: 0, target: path.steps.length }]));
    const goal: Goal = { id: crypto.randomUUID(), entityId: entity.id, game: entity.game, ranges };
    this.state.update((s) => ({ ...s, goals: [...s.goals, goal] }));
  }

  setGoalRanges(id: string, ranges: Record<string, PathRange>): void {
    this.state.update((s) => ({
      ...s,
      goals: s.goals.map((goal) => goal.id === id ? { ...goal, ranges } : goal),
    }));
  }

  removeGoal(id: string): void {
    this.state.update((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
  }

  saveEvent(event: PlannerEvent): void {
    if (!isPlannerEvent(event)) throw new Error('Invalid event');
    this.state.update((s) => ({
      ...s,
      events: s.events.some((existing) => existing.id === event.id)
        ? s.events.map((existing) => existing.id === event.id ? event : existing)
        : [...s.events, event],
    }));
  }

  removeEvent(id: string): void {
    this.state.update((s) => ({ ...s, events: s.events.filter((event) => event.id !== id) }));
  }

  setRange(goalId: string, pathId: string, range: PathRange): void {
    this.state.update((s) => ({
      ...s,
      goals: s.goals.map((g) => (g.id === goalId ? { ...g, ranges: { ...g.ranges, [pathId]: range } } : g)),
    }));
  }

  setInventory(materialId: string, amount: number): void {
    this.state.update((s) => ({ ...s, inventory: { ...s.inventory, [materialId]: Math.max(0, amount || 0) } }));
  }

  setStamina(game: GameId, current: number): void {
    const value: StaminaSettings = { current: Math.max(0, current || 0), updatedAt: new Date().toISOString() };
    this.state.update((s) => ({ ...s, stamina: { ...s.stamina, [game]: value } }));
  }

  setStaminaConfig(config: Partial<Record<GameId, StaminaConfig>>): void {
    for (const [id, value] of Object.entries(config)) {
      const game = GAMES.find((item) => item.id === id);
      if (!game || !isStaminaConfig(game.id, value)) throw new Error('Invalid stamina settings');
    }
    const now = new Date();
    this.state.update((state) => {
      const stamina = { ...state.stamina };
      for (const game of GAMES) {
        const snapshot = stamina[game.id];
        if (!snapshot) continue;
        const oldRules = staminaRules(game.id, state.staminaConfig[game.id]);
        const newRules = staminaRules(game.id, config[game.id]);
        if (oldRules.max === newRules.max) continue;
        const current = currentStamina(oldRules, snapshot, now);
        if (current >= oldRules.max || current >= newRules.max) {
          stamina[game.id] = { current: Math.min(current, newRules.max), updatedAt: now.toISOString() };
        }
      }
      return { ...state, stamina, staminaConfig: structuredClone(config) };
    });
  }

  /** Material requirements across all goals (optionally filtered to one game). */
  requirementsFor(game: GameId | 'all') {
    const entities = this.catalog.entities();
    const goals = this.goals().filter((goal) => {
      const entity = entities.get(goal.entityId);
      return (game === 'all' || goal.game === game) && entity && isGoalCompatible(goal, entity);
    });
    return requirements(totalCost(goals, entities), this.inventory());
  }

  exportJson(): string {
    return JSON.stringify(this.state(), null, 2);
  }

  importJson(raw: string): void {
    this.state.set(this.storage.parse(raw));
  }
}
