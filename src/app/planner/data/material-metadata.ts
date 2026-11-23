const TIER_PREFIX = /^(?:elementary|intermediate|advanced|trainee|official|senior|basic|buster|specialized|low(?:[- ]frequency)?|medium(?:[- ]frequency)?|high(?:[- ]frequency)?|lf|mf|hf|ff)\s+/i;

export function materialFamily(name: string, id: string): string {
  const family = name.trim().replace(TIER_PREFIX, '').trim();
  return (family || id).toLocaleLowerCase();
}

export function materialTier(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}
