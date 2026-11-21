import { parseWuwaDetail, parseWuwaIndex, parseWuwaMaterials, parseZzzDetail, parseZzzIndex, parseZzzMaterials } from './api-catalog';
import { goalCost } from '../services/calc';

describe('community catalog adapters', () => {
  it('maps ZZZ promotion, skills and core costs and marks the beta dataset', () => {
    const [entry] = parseZzzIndex({ '1011': { en: 'Anby' } });
    const materials = parseZzzMaterials({
      '10': { name: 'Denny', icon: 'Assets/NapResources/ItemIcon/UnPacker/IconCoin.png' },
      '123': { name: 'Chip' }, '999': { name: '' },
    });
    const entity = parseZzzDetail(entry, {
      id: 1011, element_type: { '203': 'Electric' }, weapon_type: { '2': 'Stun' },
      level_exp: [50, 150, ...Array(57).fill(100), 0],
      level: { '1': { materials: { '10': 24000 } }, '2': { materials: {} } },
      skill: { basic: { material: { '1': { '10': 2000, '123': 2 }, '2': {} } } },
      passive: { materials: { '1': { '10': 5000 } } },
    });
    expect(entry.beta).toBeTrue();
    expect(entity.attributes).toEqual(['Electric', 'Stun']);
    expect(materials.get('zzz:10')?.iconUrl).toBe('https://static.nanoka.cc/assets/zzz/IconCoin.webp');
    expect(materials.get('zzz:123')?.name).toBe('Chip');
    expect(materials.get('zzz:123')?.iconUrl).toBeUndefined();
    expect(materials.has('zzz:999')).toBeFalse();
    const goal = { id: 'g', entityId: entry.id, game: 'zzz' as const, ranges: {
      promotion: { current: 0, target: 1 }, 'skill:basic': { current: 0, target: 1 },
      core: { current: 0, target: 1 },
    } };
    expect(goalCost(goal, entity)).toEqual({ 'zzz:10': 31000, 'zzz:123': 2 });
    expect(goalCost({ ...goal, ranges: { 'character-level': { current: 0, target: 2 } } }, entity))
      .toEqual({ 'zzz:character-exp': 200 });
  });

  it('sorts WuWa skill costs by level and includes stat nodes', () => {
    const [entry] = parseWuwaIndex({ roleList: [{
      Id: 1402, Name: 'Yangyang', Element: { Name: 'Aero' }, WeaponType: { Name: 'Sword' }, QualityId: 4,
    }] });
    const icon = 'https://api-v2.encore.moe/resource/Data/Game/Aki/UI/Icon.webp';
    const materials = parseWuwaMaterials({ itemList: [
      { Id: 2, Name: 'Shell Credit', Icon: icon },
      { Id: 3, Name: 'Missing icon' },
      { Id: 4, Name: 'Untrusted icon', Icon: 'https://example.com/image.webp' },
    ] });
    const entity = parseWuwaDetail(entry, {
      Id: 1402, MaxLevel: 90, LevelConsumeId: 10002,
      Breaches: [{ BreachLevel: 0, BreachConsume: [] }, { BreachLevel: 1, BreachConsume: [{ Key: 2, Value: 5000 }] }],
      Skills: [{ SkillId: 101, SkillType: 'Skill', SkillName: 'Wind', Consumes: [
        { SkillId: 3, Consume: [{ Key: 2, Value: 2000 }] },
        { SkillId: 1, Consume: [] },
        { SkillId: 2, Consume: [{ Key: 2, Value: 1500 }] },
      ] }],
      SkillTree: [{ Id: 5, PropertyNodeTitle: 'ATK+', Consume: [{ Key: 2, Value: 10000 }] }],
    });
    expect(materials.get('wuwa:2')?.name).toBe('Shell Credit');
    expect(materials.get('wuwa:2')?.iconUrl).toBe(icon);
    expect(materials.get('wuwa:3')?.iconUrl).toBeUndefined();
    expect(materials.get('wuwa:4')?.iconUrl).toBeUndefined();
    expect(entity.paths.find((path) => path.id === 'skill:101')?.steps.map((step) => step.cost['wuwa:2'])).toEqual([1500, 2000]);
    expect(goalCost({ id: 'g', entityId: entry.id, game: 'wuwa', ranges: {
      promotion: { current: 0, target: 1 }, 'skill:101': { current: 1, target: 2 }, 'node:5': { current: 0, target: 1 },
    } }, entity)).toEqual({ 'wuwa:2': 17000 });
    const levelGoal = { id: 'g', entityId: entry.id, game: 'wuwa' as const, ranges: {
      'character-level': { current: 0, target: 89 },
    } };
    expect(goalCost(levelGoal, entity)).toEqual({ 'wuwa:character-exp': 2438000, 'wuwa:2': 853300 });
    levelGoal.ranges['character-level'] = { current: 19, target: 39 };
    expect(goalCost(levelGoal, entity)).toEqual({ 'wuwa:character-exp': 175500, 'wuwa:2': 61425 });
    expect(() => parseWuwaDetail(entry, { Id: 1 })).toThrow();
  });
});
