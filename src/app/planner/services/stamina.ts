import { GameId, StaminaConfig, StaminaSettings } from '../models/planner.model';

export interface StaminaRules {
  max: number;
  minutesPerPoint: number;
}

export const STAMINA_RULES: Record<GameId, StaminaRules> = {
  zzz: { max: 240, minutesPerPoint: 6 },
  wuwa: { max: 240, minutesPerPoint: 6 },
  endfield: { max: 125, minutesPerPoint: 7.2 },
};

export function endfieldMax(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > 60) throw new Error('Invalid Authority Level');
  if (level <= 35) return 125 + (level - 1) * 5;
  if (level <= 50) return 295 + (level - 35) * 3;
  return 340 + (level - 50) * 2;
}

export function isStaminaConfig(game: GameId, value: unknown): value is StaminaConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const config = value as Record<string, unknown>;
  const level = config['level'];
  const max = config['max'];
  return (level === null || (typeof level === 'number' && Number.isSafeInteger(level) && level >= 1)) &&
    (game !== 'endfield' || (typeof level === 'number' && level <= 60)) &&
    (max === null || (typeof max === 'number' && Number.isSafeInteger(max) && max > 0));
}

export function staminaRules(game: GameId, config?: StaminaConfig): StaminaRules {
  const max = config?.max ?? (game === 'endfield' ? endfieldMax(config?.level ?? 1) : STAMINA_RULES[game].max);
  return { ...STAMINA_RULES[game], max };
}

export function currentStamina(rules: StaminaRules, settings: StaminaSettings | undefined, now: Date): number {
  if (!settings) return 0;
  const elapsedMs = Math.max(0, now.getTime() - new Date(settings.updatedAt).getTime());
  const regen = Math.floor(elapsedMs / (rules.minutesPerPoint * 60000));
  return Math.min(rules.max, settings.current + regen);
}

/** Minutes until `needed` stamina is available (0 if already there); null if it exceeds the cap. */
export function minutesUntil(
  rules: StaminaRules, settings: StaminaSettings | undefined, needed: number, now: Date,
): number | null {
  if (needed > rules.max) return null;
  const current = currentStamina(rules, settings, now);
  if (needed <= current) return 0;
  const intervalMs = rules.minutesPerPoint * 60000;
  const elapsedMs = settings ? Math.max(0, now.getTime() - new Date(settings.updatedAt).getTime()) : 0;
  return Math.max(0, (needed - current) * intervalMs - elapsedMs % intervalMs) / 60000;
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return 'now';
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = Math.round(minutes % 60);
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`].filter(Boolean).join(' ');
}

export function formatStaminaDuration(minutes: number): string {
  const seconds = Math.round(minutes * 60);
  if (seconds <= 0) return 'now';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, s && `${s}s`].filter(Boolean).join(' ');
}
