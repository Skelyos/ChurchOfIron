import { GameId, Inventory, UpgradePath } from '../models/planner.model';

export const CHARACTER_LEVEL_PATH = 'character-level';

export interface ExperienceGroup {
  id: string;
  game: GameId;
  items: { id: string; exp: number }[];
}

export interface ExperienceCharacter {
  id: string;
  name: string;
  required: number;
}

export const EXPERIENCE_GROUPS: ExperienceGroup[] = [
  { id: 'zzz:character-exp', game: 'zzz', items: [
    { id: 'zzz:300003', exp: 3000 }, { id: 'zzz:300002', exp: 600 }, { id: 'zzz:300001', exp: 100 },
  ] },
  { id: 'wuwa:character-exp', game: 'wuwa', items: [
    { id: 'wuwa:43010004', exp: 20000 }, { id: 'wuwa:43010003', exp: 8000 },
    { id: 'wuwa:43010002', exp: 3000 }, { id: 'wuwa:43010001', exp: 1000 },
  ] },
  { id: 'endfield:combat-exp', game: 'endfield', items: [
    { id: 'endfield:item_expcard_stage1_high', exp: 10000 },
    { id: 'endfield:item_expcard_stage1_mid', exp: 1000 },
    { id: 'endfield:item_expcard_stage1_low', exp: 200 },
  ] },
  { id: 'endfield:carrier-exp', game: 'endfield', items: [
    { id: 'endfield:item_expcard_stage2_high', exp: 10000 },
    { id: 'endfield:item_expcard_stage2_low', exp: 1000 },
  ] },
];

// RoleLevelConsume group 10002, levels 2–90.
const WUWA_LEVEL_EXP = [
  400, 400, 500, 600, 700, 900, 1000, 1200, 1300, 1500, 1700, 2000, 2200, 2400, 2700,
  3000, 3300, 3600, 3900, 4300, 4600, 5000, 5400, 5800, 6300, 6700, 7200, 7700, 8200, 8700,
  9300, 9800, 10400, 11000, 11700, 12300, 13000, 13700, 14400, 15100, 15900, 16700, 17500,
  18300, 19200, 20000, 20900, 21900, 22800, 23800, 24800, 25800, 26900, 28000, 29100, 30300,
  31400, 32600, 33900, 35100, 36400, 37700, 39100, 40500, 41900, 43300, 44800, 46300, 47900,
  49500, 51100, 52800, 54500, 56200, 58000, 59800, 61600, 63500, 65400, 67400, 69400, 71400,
  73500, 75600, 77800, 80000, 82300, 84600, 86900,
];

export function experienceId(game: GameId): string {
  return `${game}:character-exp`;
}

export function experienceGroup(id: string): ExperienceGroup | undefined {
  return EXPERIENCE_GROUPS.find((group) => group.id === id);
}

export function planExperience(
  group: ExperienceGroup, characters: ExperienceCharacter[], inventory: Inventory,
): { materialId: string; required: number; owned: number; missing: number;
  characters: ExperienceCharacter[] }[] {
  const rows = group.items.map((item) => ({
    materialId: item.id, required: 0, owned: Math.max(0, Math.floor(inventory[item.id] ?? 0)),
    missing: 0, characters: [] as ExperienceCharacter[],
  }));
  const available = rows.map((row) => row.owned);
  for (const character of characters) {
    let remaining = character.required;
    const counts = group.items.map(() => 0);
    for (let i = 0; i < group.items.length && remaining > 0; i++) {
      const count = Math.min(available[i], Math.ceil(remaining / group.items[i].exp));
      available[i] -= count;
      counts[i] += count;
      remaining = Math.max(0, remaining - count * group.items[i].exp);
    }
    for (let i = 0; i < group.items.length && remaining > 0; i++) {
      const count = i === group.items.length - 1
        ? Math.ceil(remaining / group.items[i].exp) : Math.floor(remaining / group.items[i].exp);
      counts[i] += count;
      rows[i].missing += count;
      remaining = Math.max(0, remaining - count * group.items[i].exp);
    }
    counts.forEach((count, i) => {
      rows[i].required += count;
      if (count) rows[i].characters.push({ id: character.id, name: character.name, required: count });
    });
  }
  return rows;
}

export function characterLevelPath(game: 'zzz' | 'wuwa', costs: number[]): UpgradePath {
  return {
    id: CHARACTER_LEVEL_PATH,
    label: 'Character level',
    steps: costs.map((exp, index) => ({
      label: `Level ${index + 2}`,
      cost: { [experienceId(game)]: exp, ...(game === 'wuwa' ? { 'wuwa:2': exp * 35 / 100 } : {}) },
    })),
  };
}

export function wuwaLevelPath(): UpgradePath {
  return characterLevelPath('wuwa', WUWA_LEVEL_EXP);
}
