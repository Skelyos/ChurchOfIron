import { parseWuwaDetail, parseWuwaIndex, parseWuwaMaterials } from './wuwa-catalog';
import { parseZzzDetail, parseZzzIndex, parseZzzMaterials } from './zzz-catalog';
import { goalCost, pathPosition } from '../services/calc';

describe('community catalog adapters', () => {
  it('maps bare ZZZ boss icon names and rejects unsafe identifiers', () => {
    const materials = parseZzzMaterials({
      '110001': { name: 'Ferocious Grip', icon: 'ExBigBoss001' },
      '110501': { name: 'Higher Dimensional Data: Murderous Obituary', icon: 'ExSmallBoss001' },
      '1': { name: 'Invalid path', icon: '../ExBigBoss001' },
      '2': { name: 'Invalid URL', icon: 'https://example.com/image.webp' },
      '3': { name: 'Missing icon' },
    });

    expect(materials.get('zzz:110001')?.iconUrl).toBe('https://static.nanoka.cc/assets/zzz/ExBigBoss001.webp');
    expect(materials.get('zzz:110501')?.iconUrl).toBe('https://static.nanoka.cc/assets/zzz/ExSmallBoss001.webp');
    expect(materials.get('zzz:110001')?.iconSprite).toBeTrue();
    expect(materials.get('zzz:110501')?.iconSprite).toBeTrue();
    expect(materials.get('zzz:1')?.iconSprite).toBeUndefined();
    for (const id of ['1', '2', '3']) expect(materials.get(`zzz:${id}`)?.iconUrl).toBeUndefined();
  });

  it('groups each ZZZ promotion seal with its corresponding specialty, including uniquely named high tiers', () => {
    const specialties = ['Attack', 'Stun', 'Anomaly', 'Support', 'Defense', 'Rupture', 'Armorer'];
    const highNames = ["Pioneer's", 'Buster', 'Controller', 'Ruler', 'Defender', 'Arbiter', 'Bladebearer'];
    const records: Record<string, { name: string; rank: number }> = {};
    specialties.forEach((specialty, index) => {
      records[String(100211 + index)] = { name: `Basic ${specialty} Certification Seal`, rank: 1 };
      records[String(100221 + index)] = { name: `Advanced ${specialty} Certification Seal`, rank: 2 };
      records[String(100231 + index)] = { name: `${highNames[index]} Certification Seal`, rank: 3 };
    });
    records['471'] = { name: 'Seal of Contract', rank: 4 };
    const materials = parseZzzMaterials(records);
    specialties.forEach((specialty, index) => {
      const family = `${specialty.toLowerCase()} certification seal`;
      expect([100211, 100221, 100231].map((id) => materials.get(`zzz:${id + index}`)?.family))
        .toEqual([family, family, family]);
    });
    expect(materials.get('zzz:471')?.family).toBe('seal of contract');
  });

  it('maps ZZZ promotion, skills and core costs and marks the beta dataset', () => {
    const [entry] = parseZzzIndex({ '1011': { en: 'Anby' } });
    const materials = parseZzzMaterials({
      '10': { name: 'Denny', rank: 2, icon: 'Assets/NapResources/ItemIcon/UnPacker/IconCoin.png' },
      '123': { name: 'Chip' }, '999': { name: '' },
      '20': { name: 'Basic Core', rank: 2 },
      '21': { name: 'Advanced Core', rank: 3 },
      '22': { name: 'Specialized Core', rank: 4 },
    });
    const detail = {
      id: 1011, element_type: { '203': 'Electric' }, weapon_type: { '2': 'Stun' },
      level_exp: [50, 150, ...Array(57).fill(100), 0],
      level: { '1': { materials: { '10': 24000 } }, '2': { materials: {} } },
      skill: { basic: { material: { '1': { '10': 2000, '123': 2 }, '2': {} } } },
      passive: { materials: { '1': { '10': 5000 } } },
    };
    const entity = parseZzzDetail(entry, detail);
    expect(entry.beta).toBeTrue();
    expect(entity.attributes).toEqual(['Electric', 'Stun']);
    expect(materials.get('zzz:10')?.iconUrl).toBe('https://static.nanoka.cc/assets/zzz/IconCoin.webp');
    expect(materials.get('zzz:10')?.iconSprite).toBeUndefined();
    expect(materials.get('zzz:123')?.name).toBe('Chip');
    expect(materials.get('zzz:123')?.iconUrl).toBeUndefined();
    expect(materials.has('zzz:999')).toBeFalse();
    expect(['zzz:22', 'zzz:21', 'zzz:20'].map((id) => materials.get(id)?.family)).toEqual(['core', 'core', 'core']);
    expect(['zzz:22', 'zzz:21', 'zzz:20'].map((id) => materials.get(id)?.tier)).toEqual([4, 3, 2]);
    const skill = entity.paths.find((path) => path.id === 'skill:basic')!;
    expect(skill.levelBased).toBeTrue();
    expect([pathPosition(skill, 0), pathPosition(skill, 1)]).toEqual(['Level 1', 'Level 2']);
    expect(entity.paths.find((path) => path.id === 'promotion')?.levelBased).toBeUndefined();
    const goal = { id: 'g', entityId: entry.id, game: 'zzz' as const, ranges: {
      promotion: { current: 0, target: 1 }, 'skill:basic': { current: 0, target: 1 },
      core: { current: 0, target: 1 },
    } };
    expect(goalCost(goal, entity)).toEqual({ 'zzz:10': 31000, 'zzz:123': 2 });
    expect(goalCost({ ...goal, ranges: { 'character-level': { current: 0, target: 2 } } }, entity))
      .toEqual({ 'zzz:character-exp': 200 });
    expect(() => parseZzzDetail(entry, { ...detail, skill: {
      basic: { material: { '1': { '10': 1 }, '3': { '10': 1 } } },
    } })).toThrowError(/Missing ZZZ skill level/);
  });

  it('sorts WuWa skill costs by source ID and includes stat nodes', () => {
    const [entry] = parseWuwaIndex({ roleList: [{
      Id: 1402, Name: 'Yangyang', Element: { Name: 'Aero' }, WeaponType: { Name: 'Sword' }, QualityId: 4,
    }] });
    const icon = 'https://api-v2.encore.moe/resource/Data/Game/Aki/UI/Icon.webp';
    const materials = parseWuwaMaterials({ itemList: [
      { Id: 2, Name: 'Shell Credit', QualityId: 3, Icon: icon },
      { Id: 3, Name: 'Missing icon' },
      { Id: 4, Name: 'Untrusted icon', Icon: 'https://example.com/image.webp' },
      { Id: 41100011, Name: 'LF Whisperin Core', QualityId: 2 },
      { Id: 41100012, Name: 'MF Whisperin Core', QualityId: 3 },
      { Id: 41100013, Name: 'HF Whisperin Core', QualityId: 4 },
    ] });
    const detail = {
      Id: 1402, MaxLevel: 90, LevelConsumeId: 10002,
      Breaches: [{ BreachLevel: 0, BreachConsume: [] }, { BreachLevel: 1, BreachConsume: [{ Key: 2, Value: 5000 }] }],
      Skills: [{ SkillId: 101, SkillType: 'Skill', SkillName: 'Wind', Consumes: [
        { SkillId: 100320408, Consume: [{ Key: 2, Value: 2000 }] },
        { SkillId: 100320401, Consume: [] },
        { SkillId: 100320404, Consume: [{ Key: 2, Value: 1500 }] },
      ] }],
      SkillTree: [{ Id: 5, PropertyNodeTitle: 'ATK+', Consume: [{ Key: 2, Value: 10000 }] }],
    };
    const entity = parseWuwaDetail(entry, detail);
    expect(materials.get('wuwa:2')?.name).toBe('Shell Credit');
    expect(materials.get('wuwa:2')?.iconUrl).toBe(icon);
    expect(materials.get('wuwa:3')?.iconUrl).toBeUndefined();
    expect(materials.get('wuwa:4')?.iconUrl).toBeUndefined();
    expect(['wuwa:41100013', 'wuwa:41100012', 'wuwa:41100011'].map((id) => materials.get(id)?.family))
      .toEqual(['whisperin core', 'whisperin core', 'whisperin core']);
    expect(['wuwa:41100013', 'wuwa:41100012', 'wuwa:41100011'].map((id) => materials.get(id)?.tier))
      .toEqual([4, 3, 2]);
    expect(entity.paths.find((path) => path.id === 'skill:101')?.steps.map((step) => step.cost['wuwa:2'])).toEqual([1500, 2000]);
    const skill = entity.paths.find((path) => path.id === 'skill:101')!;
    expect(skill.levelBased).toBeTrue();
    expect(skill.steps.map((step) => step.label)).toEqual(['Level 2', 'Level 3']);
    expect([pathPosition(skill, 0), pathPosition(skill, 2)]).toEqual(['Level 1', 'Level 3']);
    expect(entity.paths.find((path) => path.id === 'node:5')?.levelBased).toBeUndefined();
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
