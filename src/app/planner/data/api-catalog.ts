import { Material, MaterialCost, PlannerEntity, UpgradePath } from '../models/planner.model';
import { characterLevelPath, wuwaLevelPath } from './character-experience';

type JsonObject = Record<string, unknown>;

export interface CatalogEntry {
  id: string;
  name: string;
  game: 'zzz' | 'wuwa' | 'endfield';
  attributes: string[];
  beta: boolean;
}

export function object(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid API object');
  return value as JsonObject;
}

function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('Invalid API array');
  return value;
}

function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Missing API name');
  return value;
}

function numericId(value: unknown): string {
  const id = String(value);
  if (!/^\d+$/.test(id)) throw new Error('Invalid API identifier');
  return id;
}

function zzzCost(value: unknown): MaterialCost {
  const cost: MaterialCost = {};
  for (const [id, amount] of Object.entries(object(value))) {
    numericId(id);
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) throw new Error('Invalid material amount');
    cost[`zzz:${id}`] = amount;
  }
  return cost;
}

function wuwaCost(value: unknown): MaterialCost {
  const cost: MaterialCost = {};
  for (const row of array(value)) {
    const item = object(row);
    const id = numericId(item['Key']);
    const amount = item['Value'];
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) throw new Error('Invalid material amount');
    cost[`wuwa:${id}`] = (cost[`wuwa:${id}`] ?? 0) + amount;
  }
  return cost;
}

export function parseZzzIndex(value: unknown): CatalogEntry[] {
  return Object.entries(object(value)).map(([id, raw]) => {
    const item = object(raw);
    return { id: `zzz:${numericId(id)}`, game: 'zzz', name: text(item['en']), attributes: [], beta: true };
  });
}

export function parseWuwaIndex(value: unknown): CatalogEntry[] {
  return array(object(value)['roleList']).map((raw) => {
    const item = object(raw);
    return {
      id: `wuwa:${numericId(item['Id'])}`, game: 'wuwa', name: text(item['Name']), beta: false,
      attributes: [text(object(item['Element'])['Name']), text(object(item['WeaponType'])['Name']), `${item['QualityId']} star`],
    };
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
    const iconUrl = match ? `https://static.nanoka.cc/assets/zzz/${encodeURIComponent(match[1])}.webp` : undefined;
    materials.set(materialId, { id: materialId, game: 'zzz', name, iconUrl });
  }
  return materials;
}

export function parseWuwaMaterials(value: unknown): Map<string, Material> {
  return new Map(array(object(value)['itemList']).map((raw) => {
    const item = object(raw);
    const id = `wuwa:${numericId(item['Id'])}`;
    const icon = item['Icon'];
    const iconUrl = typeof icon === 'string' &&
      /^https:\/\/api-v2\.encore\.moe\/resource\/[A-Za-z0-9_./%-]+\.webp$/.test(icon) ? icon : undefined;
    return [id, { id, game: 'wuwa', name: text(item['Name']), iconUrl }];
  }));
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
    const steps = Object.entries(object(skill['material']))
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([level, cost]) => ({ label: `Level ${level} to ${Number(level) + 1}`, cost: zzzCost(cost) }))
      .filter((step) => Object.keys(step.cost).length);
    if (steps.length) paths.push({ id: `skill:${key}`, label: key, steps });
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

export function parseWuwaDetail(entry: CatalogEntry, value: unknown): PlannerEntity {
  const data = object(value);
  if (`wuwa:${numericId(data['Id'])}` !== entry.id) throw new Error('Character ID mismatch');
  if (data['MaxLevel'] !== 90 || ![10001, 10002, 10003].includes(Number(data['LevelConsumeId']))) {
    throw new Error('Unsupported character level data');
  }
  const paths: UpgradePath[] = [wuwaLevelPath()];
  const promotion = array(data['Breaches']).map(object)
    .sort((a, b) => Number(a['BreachLevel']) - Number(b['BreachLevel']))
    .map((row) => ({ label: `Ascension ${row['BreachLevel']}`, cost: wuwaCost(row['BreachConsume']) }))
    .filter((step) => Object.keys(step.cost).length);
  if (promotion.length) paths.push({ id: 'promotion', label: 'Ascension', steps: promotion });
  for (const raw of array(data['Skills'])) {
    const skill = object(raw);
    const steps = array(skill['Consumes']).map(object)
      .sort((a, b) => Number(a['SkillId']) - Number(b['SkillId']))
      .map((row) => ({ label: `Level ${row['SkillId']}`, cost: wuwaCost(row['Consume']) }))
      .filter((step) => Object.keys(step.cost).length);
    if (steps.length) paths.push({ id: `skill:${numericId(skill['SkillId'])}`, label: text(skill['SkillType']) + ': ' + text(skill['SkillName']), steps });
  }
  for (const raw of array(data['SkillTree'])) {
    const node = object(raw);
    const cost = wuwaCost(node['Consume']);
    if (Object.keys(cost).length) paths.push({
      id: `node:${numericId(node['Id'])}`, label: `Stat node: ${text(node['PropertyNodeTitle'])}`,
      steps: [{ label: 'Unlock', cost }],
    });
  }
  if (!paths.length) throw new Error('Character has no supported progression data');
  return { ...entry, kind: 'character', paths, coverage: 'Character level, ascension, skills and stat nodes.' };
}
