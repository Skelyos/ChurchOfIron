import { Material, MaterialCost, PlannerEntity, UpgradePath } from '../models/planner.model';
import { characterLevelPath } from './character-experience';
import { CatalogEntry, array, numericId, object, text } from './catalog-common';
import { materialFamily, materialTier } from './material-metadata';

function zzzCost(value: unknown): MaterialCost {
  const cost: MaterialCost = {};
  for (const [id, amount] of Object.entries(object(value))) {
    numericId(id);
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) throw new Error('Invalid material amount');
    cost[`zzz:${id}`] = amount;
  }
  return cost;
}

const ZZZ_PROMOTION_SEAL_FAMILIES = [
  'attack', 'stun', 'anomaly', 'support', 'defense', 'rupture', 'armorer',
];

function zzzMaterialFamily(name: string, id: string): string {
  const seal = /^zzz:1002[123]([1-7])$/.exec(id);
  return seal ? `${ZZZ_PROMOTION_SEAL_FAMILIES[Number(seal[1]) - 1]} certification seal` : materialFamily(name, id);
}

export function parseZzzIndex(value: unknown): CatalogEntry[] {
  return Object.entries(object(value)).map(([id, raw]) => {
    const item = object(raw);
    return { id: `zzz:${numericId(id)}`, game: 'zzz', name: text(item['en']), attributes: [], beta: true };
  });
}

export function parseZzzMaterials(value: unknown): Map<string, Material> {
  const materials = new Map<string, Material>();
  for (const [id, raw] of Object.entries(object(value))) {
    const item = object(raw);
    const name = item['name'];
    if (typeof name !== 'string' || !name.trim()) continue;
    const materialId = `zzz:${numericId(id)}`;
    const path = item['icon'];
    const match = typeof path === 'string' && path.startsWith('Assets/') ? path.match(/\/([^/]+)\.png$/i) : null;
    const iconName = match?.[1] ?? (typeof path === 'string' && /^[A-Za-z0-9_]+$/.test(path) ? path : undefined);
    const iconUrl = iconName ? `https://static.nanoka.cc/assets/zzz/${encodeURIComponent(iconName)}.webp` : undefined;
    const tier = materialTier(item['rank']);
    materials.set(materialId, {
      id: materialId, game: 'zzz', name, iconUrl, family: zzzMaterialFamily(name, materialId),
      ...(/^(?:ExBigBoss|ExSmallBoss)\d+$/.test(iconName ?? '') ? { iconSprite: true as const } : {}),
      ...(tier === undefined ? {} : { tier }),
    });
  }
  return materials;
}

export function parseZzzDetail(entry: CatalogEntry, value: unknown): PlannerEntity {
  const data = object(value);
  if (`zzz:${numericId(data['id'])}` !== entry.id) throw new Error('Character ID mismatch');
  const exp = array(data['level_exp']);
  if (exp.length !== 60 || exp[59] !== 0) {
    throw new Error('Invalid character EXP data');
  }
  const costs = exp.slice(0, 59).map((amount) => {
    if (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount <= 0) throw new Error('Invalid character EXP data');
    return amount;
  });
  const paths: UpgradePath[] = [characterLevelPath('zzz', costs)];
  const levels = object(data['level']);
  const promotion = Object.entries(levels).sort(([a], [b]) => Number(a) - Number(b))
    .map(([level, row]) => ({ level: Number(level), cost: zzzCost(object(row)['materials']) }))
    .filter((step) => Object.keys(step.cost).length);
  if (promotion.length) paths.push({
    id: 'promotion', label: 'Promotion',
    steps: promotion.map((step) => ({ label: `Promotion ${step.level}`, cost: step.cost })),
  });
  for (const [key, raw] of Object.entries(object(data['skill']))) {
    const skill = object(raw);
    const levels = Object.entries(object(skill['material']))
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([level, cost]) => ({ level: Number(level), cost: zzzCost(cost) }))
      .filter((step) => Object.keys(step.cost).length);
    if (levels.some((step, index) => step.level !== index + 1)) throw new Error(`Missing ZZZ skill level ${key}`);
    if (levels.length) paths.push({
      id: `skill:${key}`, label: key, levelBased: true,
      steps: levels.map(({ level, cost }) => ({ label: `Level ${level} to ${level + 1}`, cost })),
    });
  }
  const core = object(object(data['passive'])['materials']);
  const coreSteps = Object.entries(core).sort(([a], [b]) => Number(a) - Number(b))
    .map(([level, cost]) => ({ label: `Core ${level}`, cost: zzzCost(cost) }))
    .filter((step) => Object.keys(step.cost).length);
  if (coreSteps.length) paths.push({ id: 'core', label: 'Core skill', steps: coreSteps });
  if (!paths.length) throw new Error('Character has no supported progression data');
  const attributes = [
    ...Object.values(object(data['element_type'])).filter((v): v is string => typeof v === 'string'),
    ...Object.values(object(data['weapon_type'])).filter((v): v is string => typeof v === 'string'),
  ];
  return { ...entry, kind: 'character', paths, attributes, coverage: 'Character level, promotion, skills and core.' };
}
