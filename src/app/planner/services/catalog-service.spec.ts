import { TestBed } from '@angular/core/testing';
import { CatalogService } from './catalog-service';

describe('catalog service', () => {
  it('loads the beta index, validates character material references, and reports fetch failures', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.callFake(async (url) => {
      const path = String(url);
      if (path.endsWith('/character.json')) return new Response(JSON.stringify({ '1011': { en: 'Anby' } }));
      if (path.endsWith('/en/item.json')) return new Response(JSON.stringify({
        '10': { name: 'Denny' }, '300001': { name: 'Trainee Investigator Log' },
        '300002': { name: 'Official Investigator Log' }, '300003': { name: 'Senior Investigator Log' },
      }));
      if (path.endsWith('/en/character/1011.json')) return new Response(JSON.stringify({
        id: 1011, element_type: { '203': 'Electric' }, weapon_type: { '2': 'Stun' },
        level_exp: [...Array(59).fill(100), 0],
        level: { '1': { materials: { '10': 24000 } } },
        skill: {}, passive: { materials: {} },
      }));
      return new Response('', { status: 500 });
    });
    const service = TestBed.inject(CatalogService);
    await service.load('zzz');
    expect(service.entries()[0].beta).toBeTrue();
    const entity = await service.loadEntity(service.entries()[0]);
    expect(entity.paths.find((path) => path.id === 'promotion')?.steps[0].cost).toEqual({ 'zzz:10': 24000 });
    expect(service.entities().has('zzz:1011')).toBeTrue();
    fetchSpy.and.resolveTo(new Response('', { status: 503 }));
    await service.load('zzz');
    expect(service.status().zzz).toContain('503');
    expect(service.entities().has('zzz:1011')).toBeTrue();
  });

  it('rejects a character whose costs refer to unknown materials', async () => {
    spyOn(window, 'fetch').and.resolveTo(new Response(JSON.stringify({
      id: 1011, element_type: {}, weapon_type: {},
      level_exp: [...Array(59).fill(100), 0],
      level: { '1': { materials: { '999': 2 } } }, skill: {}, passive: { materials: {} },
    })));
    const service = TestBed.inject(CatalogService);
    const entry = { id: 'zzz:1011', game: 'zzz' as const, name: 'Anby', attributes: [], beta: true };
    await expectAsync(service.loadEntity(entry)).toBeRejectedWithError('Missing material zzz:999');
    expect(service.entities().size).toBe(0);
  });

  it('loads Endfield promotions, rejects changed versions and retains stale data on refresh failure', async () => {
    const charId = 'chr_0004_pelica';
    const nodes = Object.fromEntries([20, 40, 60, 70].map((level, index) => {
      const nodeId = `charBreak${level}`;
      return [nodeId, { nodeId, charId, nodeType: 1, breakStage: index + 1,
        requiredItem: [{ id: 'item_gold', count: 1600 }] }];
    }));
    const skillGroupIds = ['NormalAttack', 'NormalSkill', 'ComboSkill', 'UltimateSkill']
      .map((name) => `${charId}_${name}`);
    const skillTypes: Record<string, number> = { NormalAttack: 0, NormalSkill: 1, ComboSkill: 3, UltimateSkill: 2 };
    const skillGroupMap = Object.fromEntries(skillGroupIds.map((id, index) => [id, {
      skillGroupId: id, skillGroupType: skillTypes[id.split('_').pop() ?? ''], name: { id: index + 7 },
    }]));
    const skillLevelUp = skillGroupIds.map((skillGroupId) => ({
      skillGroupId, level: 2, goldCost: 200,
      itemBundle: [{ id: 'item_skill_book', count: 6 }],
    }));
    let version = 'revision-a';
    let fail = false;
    const fetchSpy = spyOn(window, 'fetch').and.callFake(async (url) => {
      if (fail) return new Response('', { status: 503 });
      const path = new URL(String(url)).pathname;
      if (path === '/version') return new Response(version);
      if (path === '/table/CharGrowthTable/all') return new Response(JSON.stringify({
        [charId]: { charId, name: { id: '7201533996830628902' } },
      }));
      if (path === '/i18n/dict/EN/table/CharGrowthTable/all') return new Response(JSON.stringify({
        '7201533996830628902': 'Perlica', '7': 'Destructive Sequence',
        '8': 'Constructive Sequence', '9': 'Sealing Sequence', '10': 'Bombardment Sequence',
      }));
      if (path === '/table/ItemTable/all') return new Response(JSON.stringify(Object.fromEntries([
        'item_gold', 'item_expcard_stage1_high', 'item_expcard_stage1_mid', 'item_expcard_stage1_low',
        'item_expcard_stage2_high', 'item_expcard_stage2_low', 'item_skill_book',
      ].map((id, i) => [id, { id, name: { id: i + 1 } }]))));
      if (path === '/i18n/dict/EN/table/ItemTable/all') return new Response(JSON.stringify({
        '1': 'T-Creds', '2': 'Advanced Combat Record', '3': 'Intermediate Combat Record',
        '4': 'Elementary Combat Record', '5': 'Advanced Cognitive Carrier', '6': 'Elementary Cognitive Carrier',
        '7': 'Skill Manual',
      }));
      if (path === '/table/CharLevelUpTable/all') return new Response(JSON.stringify(
        Object.fromEntries(Array.from({ length: 89 }, (_, i) => [String(i + 1), { exp: 100, gold: 0 }]))));
      if (path === `/table/CharGrowthTable/${charId}`) {
        return new Response(JSON.stringify({ charId, charBreakCostMap: nodes, skillGroupMap, skillLevelUp }));
      }
      return new Response('', { status: 404 });
    });
    const service = TestBed.inject(CatalogService);
    await service.load('endfield');
    expect(service.status().endfield).toContain('revision-a');
    const entry = service.entries()[0];
    expect(entry.name).toBe('Perlica');
    version = 'revision-b';
    await expectAsync(service.loadEntity(entry)).toBeRejectedWithError('Endfield source changed; reload the catalog');
    version = 'revision-a';
    const entity = await service.loadEntity(entry);
    expect(entity.paths.find((path) => path.id === 'promotion')?.steps[0].cost).toEqual({ 'endfield:item_gold': 1600 });
    expect(entity.paths.find((path) => path.id === 'character-level')?.steps[59].cost).toEqual({ 'endfield:carrier-exp': 100 });
    expect(entity.paths.find((path) => path.id === `ability:${skillGroupIds[0]}`)).toEqual({
      id: `ability:${skillGroupIds[0]}`, label: '(Basic Attack) Destructive Sequence', levelBased: true,
      steps: [{ label: 'Level 2', cost: { 'endfield:item_skill_book': 6, 'endfield:item_gold': 200 } }],
    });
    fail = true;
    await service.load('endfield');
    expect(service.status().endfield).toContain('previously loaded data may be stale');
    expect(service.entities().has(entry.id)).toBeTrue();
    expect(service.materials().get('endfield:item_gold')?.name).toBe('T-Creds');
    expect(fetchSpy).toHaveBeenCalled();
  });
});
