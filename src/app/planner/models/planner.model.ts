export type GameId = 'zzz' | 'wuwa' | 'endfield';

export const GAMES: { id: GameId; name: string; staminaName: string }[] = [
  { id: 'zzz', name: 'Zenless Zone Zero', staminaName: 'Battery Charge' },
  { id: 'wuwa', name: 'Wuthering Waves', staminaName: 'Waveplate' },
  { id: 'endfield', name: 'Arknights: Endfield', staminaName: 'Sanity' },
];

export type MaterialCost = Record<string, number>;

export interface Material {
  id: string;
  name: string;
  game: GameId;
  iconUrl?: string;
}

/** One upgrade step, e.g. "Ascension 1 -> 2" or "Skill Lv 3 -> 4". */
export interface UpgradeStep {
  label: string;
  cost: MaterialCost;
}

/** An ordered track (level/ascension, a skill, ...). Position N means N steps completed. */
export interface UpgradePath {
  id: string;
  label: string;
  steps: UpgradeStep[];
}

export interface PlannerEntity {
  id: string;
  game: GameId;
  name: string;
  kind: 'character' | 'weapon';
  paths: UpgradePath[];
  attributes?: string[];
  beta?: boolean;
  coverage?: string;
}

export interface PathRange {
  current: number;
  target: number;
}

export interface Goal {
  id: string;
  entityId: string;
  game: GameId;
  ranges: Record<string, PathRange>;
}

export type Inventory = Record<string, number>;

export interface StaminaSettings {
  current: number;
  /** ISO timestamp at which `current` was recorded. */
  updatedAt: string;
}

export interface StaminaConfig {
  level: number | null;
  max: number | null;
}

export interface PlannerEvent {
  id: string;
  game: GameId;
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  source: 'manual';
}

export interface PlannerState {
  goals: Goal[];
  inventory: Inventory;
  stamina: Partial<Record<GameId, StaminaSettings>>;
  staminaConfig: Partial<Record<GameId, StaminaConfig>>;
  events: PlannerEvent[];
}

export interface MaterialRequirement {
  materialId: string;
  required: number;
  owned: number;
  missing: number;
}
