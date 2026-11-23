import { parseEndfieldDetail, parseEndfieldIndex, parseEndfieldJson, parseEndfieldLevelPath, parseEndfieldMaterials } from './endfield-catalog';
import { goalCost, pathPosition } from '../services/calc';

describe('Endfield catalog adapter', () => {
  it('preserves localization identifiers exactly without changing text or ordinary numbers', () => {
    const data = parseEndfieldJson('{"id":-7414352149342137725,"other":7201533996830628902,"n":1600,"text":"id: 7201533996830628902","decimal":1.5}');
    expect(data).toEqual({ id: '-7414352149342137725', other: '7201533996830628902', n: 1600,
      text: 'id: 7201533996830628902', decimal: 1.5 });
  });

  it('localizes records and calculates the selected promotion range', () => {
    const [entry] = parseEndfieldIndex({ chr_0004_pelica: {
      charId: 'chr_0004_pelica', name: { id: '7201533996830628902' },
    } }, { '7201533996830628902': 'Perlica' });
    const materials = parseEndfieldMaterials({
      item_disk: { id: 'item_disk', name: { id: '-7414352149342137725' }, iconId: 'item_disk_icon' },
      item_preset: { id: 'item_disk', name: { id: '-7414352149342137725' } },
      item_untranslated: { id: 'item_untranslated', name: { id: 0 } },
      item_exp_low: { id: 'item_exp_low', name: { id: 1 }, rarity: 2 },
      item_exp_mid: { id: 'item_exp_mid', name: { id: 2 }, rarity: 3, iconId: '../invalid' },
      item_exp_high: { id: 'item_exp_high', name: { id: 3 }, rarity: 4 },
    }, {
      '-7414352149342137725': 'Protodisk',
      '1': 'Elementary Combat Record', '2': 'Intermediate Combat Record', '3': 'Advanced Combat Record',
    });
    expect(materials.get('endfield:item_disk')?.name).toBe('Protodisk');
    expect(materials.get('endfield:item_disk')?.iconUrl).toBe(
      'https://endfield-assets.fffdan.com/vfs/Bundle/file/assets/beyond/dynamicassets/gameplay/ui/sprites/itemiconbig/item_disk_icon.png',
    );
    expect(materials.get('endfield:item_exp_mid')?.iconUrl).toBeUndefined();
    expect(materials.get('endfield:item_exp_low')?.iconUrl).toBeUndefined();
    expect(materials.size).toBe(4);
    expect(['item_exp_high', 'item_exp_mid', 'item_exp_low'].map((id) => materials.get(`endfield:${id}`)?.family))
      .toEqual(['combat record', 'combat record', 'combat record']);
    expect(['item_exp_high', 'item_exp_mid', 'item_exp_low'].map((id) => materials.get(`endfield:${id}`)?.tier))
      .toEqual([4, 3, 2]);
    const nodes = Object.fromEntries([20, 40, 60, 70].map((level, index) => {
      const nodeId = `charBreak${level}`;
      return [nodeId, { nodeId, charId: 'chr_0004_pelica', nodeType: 1, breakStage: index + 1,
        requiredItem: [{ id: 'item_disk', count: index + 1 }] }];
    }));
    const levels = Object.fromEntries(Array.from({ length: 89 }, (_, i) =>
      [String(i + 1), { exp: 100, gold: 10 }]));
    levels['59'] = { exp: 35340, gold: 1770 };
    levels['60'] = { exp: 14510, gold: 1820 };
    const levelPath = parseEndfieldLevelPath(levels);
    const skillGroupIds = ['NormalAttack', 'NormalSkill', 'ComboSkill', 'UltimateSkill']
      .map((name) => `chr_0004_pelica_${name}`);
    const skillTypes: Record<string, number> = { NormalAttack: 0, NormalSkill: 1, ComboSkill: 3, UltimateSkill: 2 };
    const skillGroupMap = Object.fromEntries(skillGroupIds.map((id, index) => [id, {
      skillGroupId: id, skillGroupType: skillTypes[id.split('_').pop() ?? ''], name: { id: String(index + 1) },
    }]));
    const skillLevelUp = skillGroupIds.flatMap((skillGroupId) => Array.from({ length: 11 }, (_, i) => i + 2).map((level) => ({
      skillGroupId, level, goldCost: level * 100,
      itemBundle: [{ id: 'item_skill_book', count: level }],
    })));
    const detail = { charId: 'chr_0004_pelica', charBreakCostMap: nodes, skillGroupMap, skillLevelUp };
    const translations = {
      '1': 'Destructive Sequence', '2': 'Constructive Sequence', '3': 'Sealing Sequence', '4': 'Bombardment Sequence',
    };
    const entity = parseEndfieldDetail(entry, detail, levelPath, translations);
    expect(entity.coverage).toContain('ability skills');
    expect(entity.paths.filter((path) => path.id.startsWith('ability:')).map((path) => path.label))
      .toEqual([
        '(Basic Attack) Destructive Sequence', '(Battle Skill) Constructive Sequence',
        '(Combo Skill) Sealing Sequence', '(Ultimate) Bombardment Sequence',
      ]);
    expect(entity.paths.find((path) => path.id === `ability:${skillGroupIds[0]}`)?.steps[0]).toEqual({
      label: 'Level 2', cost: { 'endfield:item_skill_book': 2, 'endfield:item_gold': 200 },
    });
    const skill = entity.paths.find((path) => path.id === `ability:${skillGroupIds[0]}`)!;
    expect(skill.levelBased).toBeTrue();
    expect([pathPosition(skill, 0), pathPosition(skill, skill.steps.length)]).toEqual(['Level 1', 'Level 12']);
    expect(goalCost({ id: 'goal', entityId: entry.id, game: 'endfield',
      ranges: { promotion: { current: 1, target: 3 } } }, entity)).toEqual({ 'endfield:item_disk': 5 });
    expect(goalCost({ id: 'goal', entityId: entry.id, game: 'endfield',
      ranges: { [`ability:${skillGroupIds[0]}`]: { current: 0, target: 1 } } }, entity)).toEqual({
      'endfield:item_skill_book': 2, 'endfield:item_gold': 200,
    });
    expect(goalCost({ id: 'goal', entityId: entry.id, game: 'endfield',
      ranges: { [`ability:${skillGroupIds[0]}`]: { current: 1, target: 3 } } }, entity)).toEqual({
      'endfield:item_skill_book': 7, 'endfield:item_gold': 700,
    });
    expect(goalCost({ id: 'goal', entityId: entry.id, game: 'endfield',
      ranges: { 'character-level': { current: 58, target: 60 } } }, entity)).toEqual({
      'endfield:combat-exp': 35340, 'endfield:carrier-exp': 14510, 'endfield:item_gold': 3590,
    });
    nodes['charBreak40'].breakStage = 3;
    expect(() => parseEndfieldDetail(entry, detail, levelPath, translations)).toThrow();
    nodes['charBreak40'].breakStage = 2;
    skillLevelUp[0].skillGroupId = 'missing_group';
    expect(() => parseEndfieldDetail(entry, detail, levelPath, translations)).toThrow();
    skillLevelUp[0].skillGroupId = skillGroupIds[0];
    skillLevelUp[0].level = 13;
    expect(() => parseEndfieldDetail(entry, detail, levelPath, translations)).toThrowError(/Missing Endfield skill level/);
    levels['60'].exp = -1;
    expect(() => parseEndfieldLevelPath(levels)).toThrow();
    expect(() => parseEndfieldIndex({ chr_0004_pelica: {
      charId: 'chr_0004_pelica', name: { id: '7201533996830628902' },
    } }, {})).toThrow();
  });
});
