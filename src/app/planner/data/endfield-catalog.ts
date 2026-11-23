import { CatalogEntry, object } from './api-catalog';
import { Material, MaterialCost, PlannerEntity, UpgradePath } from '../models/planner.model';
import { CHARACTER_LEVEL_PATH } from './character-experience';
import { materialFamily, materialTier } from './material-metadata';

const SKILL_TYPE_LABELS: Record<number, string> = {
  0: 'Basic Attack',
  1: 'Battle Skill',
  2: 'Ultimate',
  3: 'Combo Skill',
};

// Preserve integer localization keys before JSON.parse can round them.
export function parseEndfieldJson(raw: string): unknown {
  return JSON.parse(raw.replace(/"(?:\\.|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g, (token) => {
    if (token.startsWith('"') || /[.eE]/.test(token)) return token;
    const value = BigInt(token);
    return value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)
      ? JSON.stringify(token) : token;
  }));
}

function identifier(value: unknown, pattern: RegExp): string {
  if (typeof value !== 'string' || !pattern.test(value)) throw new Error('Invalid Endfield identifier');
  return value;
}

function localizedName(value: unknown, dictionary: Record<string, unknown>): string {
  const id = object(value)['id'];
  if ((typeof id !== 'string' && (typeof id !== 'number' || !Number.isSafeInteger(id))) ||
      !/^-?\d+$/.test(String(id))) throw new Error('Invalid Endfield localization ID');
  const name = dictionary[String(id)];
  if (typeof name !== 'string' || !name.trim()) throw new Error(`Missing English localization ${id}`);
  return name;
}

export function parseEndfieldIndex(value: unknown, translations: unknown): CatalogEntry[] {
  const dictionary = object(translations);
  return Object.entries(object(value)).map(([key, raw]) => {
    const id = identifier(key, /^chr_\d{4}_[a-z0-9]+$/);
    const character = object(raw);
    if (character['charId'] !== id) throw new Error('Endfield character ID mismatch');
    return {
      id: `endfield:${id}`, game: 'endfield', name: localizedName(character['name'], dictionary),
      attributes: [], beta: false,
    };
  });
}

export function parseEndfieldMaterials(value: unknown, translations: unknown): Map<string, Material> {
  const dictionary = object(translations);
  const materials = new Map<string, Material>();
  for (const [key, raw] of Object.entries(object(value))) {
    const item = object(raw);
    // Preset records reuse another item's ID and are not material records.
    if (item['id'] !== key) continue;
    const nameRef = object(item['name'])['id'];
    if (typeof nameRef !== 'string' && (typeof nameRef !== 'number' || !Number.isSafeInteger(nameRef))) {
      throw new Error('Invalid Endfield localization ID');
    }
    const name = dictionary[String(nameRef)];
    if (typeof name !== 'string' || !name.trim()) continue;
    const id = identifier(key, /^[a-zA-Z0-9_]+$/);
    const materialId = `endfield:${id}`;
    const tier = materialTier(item['rarity']);
    const iconId = item['iconId'];
    const iconUrl = typeof iconId === 'string' && /^[a-zA-Z0-9_]+$/.test(iconId)
      ? `https://endfield-assets.fffdan.com/vfs/Bundle/file/assets/beyond/dynamicassets/gameplay/ui/sprites/itemiconbig/${encodeURIComponent(iconId)}.png`
      : undefined;
    materials.set(materialId, {
      id: materialId, game: 'endfield', name, iconUrl, family: materialFamily(name, materialId),
      ...(tier === undefined ? {} : { tier }),
    });
  }
  return materials;
}

export function parseEndfieldLevelPath(value: unknown): UpgradePath {
  const levels = object(value);
  const steps = Array.from({ length: 89 }, (_, index) => {
    const level = index + 1;
    const row = object(levels[String(level)]);
    const exp = row['exp'];
    const gold = row['gold'];
    if (typeof exp !== 'number' || !Number.isSafeInteger(exp) || exp <= 0 ||
        typeof gold !== 'number' || !Number.isSafeInteger(gold) || gold < 0) {
      throw new Error(`Invalid Endfield level data for level ${level}`);
    }
    return {
      label: `Level ${level + 1}`,
      cost: {
        [level < 60 ? 'endfield:combat-exp' : 'endfield:carrier-exp']: exp,
        ...(gold ? { 'endfield:item_gold': gold } : {}),
      },
    };
  });
  return { id: CHARACTER_LEVEL_PATH, label: 'Character level', levelBased: true, steps };
}

function parseEndfieldSkillPaths(character: Record<string, unknown>, dictionary: Record<string, unknown>): UpgradePath[] {
  const groups = object(character['skillGroupMap']);
  const rawLevels = character['skillLevelUp'];
  if (!Array.isArray(rawLevels) || !rawLevels.length) throw new Error('Missing Endfield skill level data');

  const paths = new Map<string, { label: string; steps: Map<number, UpgradePath['steps'][number]> }>();
  for (const raw of rawLevels) {
    const levelData = object(raw);
    const groupId = identifier(levelData['skillGroupId'], /^[a-zA-Z0-9_]+$/);
    const group = object(groups[groupId]);
    if (group['skillGroupId'] !== groupId) throw new Error(`Unknown Endfield skill group ${groupId}`);
    const skillType = group['skillGroupType'];
    if (typeof skillType !== 'number' || !Number.isSafeInteger(skillType) || !SKILL_TYPE_LABELS[skillType]) {
      throw new Error(`Invalid Endfield skill type ${groupId}`);
    }
    const level = levelData['level'];
    const gold = levelData['goldCost'];
    if (typeof level !== 'number' || !Number.isSafeInteger(level) || level < 2 ||
        typeof gold !== 'number' || !Number.isSafeInteger(gold) || gold < 0 ||
        !Array.isArray(levelData['itemBundle'])) {
      throw new Error('Invalid Endfield skill level data');
    }

    let path = paths.get(groupId);
    if (!path) {
      path = {
        label: `(${SKILL_TYPE_LABELS[skillType]}) ${localizedName(group['name'], dictionary)}`,
        steps: new Map(),
      };
      paths.set(groupId, path);
    }
    if (path.steps.has(level)) throw new Error(`Duplicate Endfield skill level ${groupId} ${level}`);

    const cost: MaterialCost = {};
    for (const rawItem of levelData['itemBundle']) {
      const item = object(rawItem);
      const id = `endfield:${identifier(item['id'], /^[a-zA-Z0-9_]+$/)}`;
      const amount = item['count'];
      if (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount <= 0) {
        throw new Error('Invalid Endfield skill material amount');
      }
      cost[id] = (cost[id] ?? 0) + amount;
    }
    if (gold) cost['endfield:item_gold'] = (cost['endfield:item_gold'] ?? 0) + gold;
    if (!Object.keys(cost).length) throw new Error(`Empty Endfield skill level ${groupId} ${level}`);
    path.steps.set(level, { label: `Level ${level}`, cost });
  }

  return [...paths].map(([groupId, path]) => {
    const levels = [...path.steps].sort(([a], [b]) => a - b);
    if (levels.some(([level], index) => level !== index + 2)) {
      throw new Error(`Missing Endfield skill level ${groupId}`);
    }
    return {
      id: `ability:${groupId}`,
      label: path.label,
      levelBased: true,
      steps: levels.map(([, step]) => step),
    };
  });
}

export function parseEndfieldDetail(
  entry: CatalogEntry,
  value: unknown,
  levelPath: UpgradePath,
  translations: unknown,
): PlannerEntity {
  const character = object(value);
  if (`endfield:${identifier(character['charId'], /^chr_\d{4}_[a-z0-9]+$/)}` !== entry.id) {
    throw new Error('Endfield character ID mismatch');
  }
  const skillPaths = parseEndfieldSkillPaths(character, object(translations));
  const nodes = object(character['charBreakCostMap']);
  const steps = ['charBreak20', 'charBreak40', 'charBreak60', 'charBreak70'].map((nodeId, index) => {
    const node = object(nodes[nodeId]);
    if (node['nodeId'] !== nodeId || node['charId'] !== character['charId'] ||
        node['nodeType'] !== 1 || node['breakStage'] !== index + 1 || !Array.isArray(node['requiredItem'])) {
      throw new Error(`Invalid Endfield promotion ${nodeId}`);
    }
    const cost: MaterialCost = {};
    for (const raw of node['requiredItem']) {
      const item = object(raw);
      const id = `endfield:${identifier(item['id'], /^[a-zA-Z0-9_]+$/)}`;
      const amount = item['count'];
      if (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount <= 0) {
        throw new Error('Invalid Endfield material amount');
      }
      cost[id] = (cost[id] ?? 0) + amount;
    }
    if (!Object.keys(cost).length) throw new Error(`Empty Endfield promotion ${nodeId}`);
    return { label: `Promotion ${index + 1}`, cost };
  });
  return {
    ...entry, kind: 'character', paths: [levelPath, { id: 'promotion', label: 'Promotion', steps }, ...skillPaths],
    coverage: 'Character level, promotion and ability skills; other ability matrix nodes and weapons are not included. Release status is unverified.',
  };
}
