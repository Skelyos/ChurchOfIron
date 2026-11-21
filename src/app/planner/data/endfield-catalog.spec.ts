import { parseEndfieldDetail, parseEndfieldIndex, parseEndfieldJson, parseEndfieldLevelPath, parseEndfieldMaterials } from './endfield-catalog';
import { goalCost } from '../services/calc';

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
      item_disk: { id: 'item_disk', name: { id: '-7414352149342137725' } },
      item_preset: { id: 'item_disk', name: { id: '-7414352149342137725' } },
      item_untranslated: { id: 'item_untranslated', name: { id: 0 } },
    }, { '-7414352149342137725': 'Protodisk' });
    expect(materials.get('endfield:item_disk')?.name).toBe('Protodisk');
    expect(materials.size).toBe(1);
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
    const entity = parseEndfieldDetail(entry, { charId: 'chr_0004_pelica', charBreakCostMap: nodes }, levelPath);
    expect(entity.coverage).toContain('Character level and promotion');
    expect(goalCost({ id: 'goal', entityId: entry.id, game: 'endfield',
      ranges: { promotion: { current: 1, target: 3 } } }, entity)).toEqual({ 'endfield:item_disk': 5 });
    expect(goalCost({ id: 'goal', entityId: entry.id, game: 'endfield',
      ranges: { 'character-level': { current: 58, target: 60 } } }, entity)).toEqual({
      'endfield:combat-exp': 35340, 'endfield:carrier-exp': 14510, 'endfield:item_gold': 3590,
    });
    nodes['charBreak40'].breakStage = 3;
    expect(() => parseEndfieldDetail(entry, { charId: 'chr_0004_pelica', charBreakCostMap: nodes }, levelPath)).toThrow();
    levels['60'].exp = -1;
    expect(() => parseEndfieldLevelPath(levels)).toThrow();
    expect(() => parseEndfieldIndex({ chr_0004_pelica: {
      charId: 'chr_0004_pelica', name: { id: '7201533996830628902' },
    } }, {})).toThrow();
  });
});
