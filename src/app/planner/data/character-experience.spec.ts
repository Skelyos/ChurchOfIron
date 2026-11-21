import { experienceGroup, planExperience } from './character-experience';

describe('EXP item plans', () => {
  it('uses owned ZZZ tiers first and fills the shortfall from high to low', () => {
    const group = experienceGroup('zzz:character-exp')!;
    const rows = planExperience(group, [{ id: 'a', name: 'A', required: 10000 }], {
      'zzz:300003': 2, 'zzz:300002': 2, 'zzz:300001': 3,
    });
    expect(rows.map((row) => [row.required, row.owned, row.missing])).toEqual([
      [2, 2, 0], [6, 2, 4], [4, 3, 1],
    ]);
    expect(rows.map((row) => row.characters[0]?.required)).toEqual([2, 6, 4]);
  });

  it('fills WuWa requirements with higher-tier items and rounds up the smallest tier', () => {
    const group = experienceGroup('wuwa:character-exp')!;
    const rows = planExperience(group, [{ id: 'a', name: 'A', required: 32300 }], {});
    expect(rows.map((row) => row.missing)).toEqual([1, 1, 1, 2]);
  });

  it('does not share leftover EXP between characters or Endfield item groups', () => {
    const combat = experienceGroup('endfield:combat-exp')!;
    const carrier = experienceGroup('endfield:carrier-exp')!;
    const inventory = { 'endfield:item_expcard_stage1_high': 1 };
    const characters = [{ id: 'a', name: 'A', required: 20 }, { id: 'b', name: 'B', required: 20 }];
    const combatRows = planExperience(combat, characters, inventory);
    expect(combatRows.map((row) => row.missing)).toEqual([0, 0, 1]);
    expect(combatRows.map((row) => row.required)).toEqual([1, 0, 1]);
    expect(planExperience(carrier, characters, inventory).map((row) => row.missing)).toEqual([0, 2]);
  });
});
