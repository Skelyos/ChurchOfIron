import { Material, MaterialCost, PlannerEntity, UpgradePath } from '../models/planner.model';
import { wuwaLevelPath } from './character-experience';
import { CatalogEntry, array, numericId, object, text } from './catalog-common';
import { materialFamily, materialTier } from './material-metadata';

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

export function parseWuwaIndex(value: unknown): CatalogEntry[] {
  return array(object(value)['roleList']).map((raw) => {
    const item = object(raw);
    return {
      id: `wuwa:${numericId(item['Id'])}`, game: 'wuwa', name: text(item['Name']), beta: false,
      attributes: [text(object(item['Element'])['Name']), text(object(item['WeaponType'])['Name']), `${item['QualityId']} star`],
    };
  });
}

export function parseWuwaMaterials(value: unknown): Map<string, Material> {
  return new Map(array(object(value)['itemList']).map((raw) => {
    const item = object(raw);
    const id = `wuwa:${numericId(item['Id'])}`;
    const icon = item['Icon'];
    const iconUrl = typeof icon === 'string' &&
      /^https:\/\/api-v2\.encore\.moe\/resource\/[A-Za-z0-9_./%-]+\.webp$/.test(icon) ? icon : undefined;
    const name = text(item['Name']);
    const tier = materialTier(item['QualityId']);
    return [id, {
      id, game: 'wuwa', name, iconUrl, family: materialFamily(name, id),
      ...(tier === undefined ? {} : { tier }),
    }];
  }));
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
    const costs = array(skill['Consumes']).map(object)
      .sort((a, b) => Number(a['SkillId']) - Number(b['SkillId']))
      .map((row) => wuwaCost(row['Consume']))
      .filter((cost) => Object.keys(cost).length);
    if (costs.length) paths.push({
      id: `skill:${numericId(skill['SkillId'])}`, label: text(skill['SkillType']) + ': ' + text(skill['SkillName']),
      levelBased: true, steps: costs.map((cost, index) => ({ label: `Level ${index + 2}`, cost })),
    });
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
