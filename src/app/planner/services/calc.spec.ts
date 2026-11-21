import { Goal, PlannerEntity } from '../models/planner.model';
import { goalCost, isGoalCompatible, requirements, totalCost } from './calc';
import { currentStamina, endfieldMax, formatStaminaDuration, minutesUntil, staminaRules, STAMINA_RULES } from './stamina';
import { characterLevelPath } from '../data/character-experience';

const entity: PlannerEntity = {
  id: 'e1',
  game: 'zzz',
  name: 'Test',
  kind: 'character',
  paths: [
    {
      id: 'asc',
      label: 'Ascension',
      steps: [
        { label: '0->1', cost: { a: 2, b: 1 } },
        { label: '1->2', cost: { a: 3 } },
        { label: '2->3', cost: { c: 5 } },
      ],
    },
  ],
};

const goal: Goal = { id: 'g', entityId: 'e1', game: 'zzz', ranges: { asc: { current: 1, target: 3 } } };

describe('planner calc', () => {
  it('detects saved goals that no longer match their source tracks', () => {
    expect(isGoalCompatible(goal, entity)).toBeTrue();
    expect(isGoalCompatible({ ...goal, ranges: {} }, entity)).toBeFalse();
    expect(isGoalCompatible({ ...goal, ranges: { asc: { current: 0, target: 9 } } }, entity)).toBeFalse();
    expect(isGoalCompatible({ ...goal, ranges: { asc: { current: 2, target: 1 } } }, entity)).toBeFalse();
  });
  it('preserves legacy goals when a character level track is added', () => {
    const updated = { ...entity, paths: [characterLevelPath('zzz', [50, 150]), ...entity.paths] };
    expect(isGoalCompatible(goal, updated)).toBeTrue();
    expect(goalCost(goal, updated)).toEqual({ a: 3, c: 5 });
    expect(isGoalCompatible({ ...goal, ranges: { ...goal.ranges, 'character-level': { current: 2, target: 3 } } }, updated)).toBeFalse();
    expect(isGoalCompatible({ ...goal, ranges: { 'character-level': { current: 0, target: 1 } } }, updated)).toBeFalse();
  });
  it('sums steps in [current, target)', () => {
    expect(goalCost(goal, entity)).toEqual({ a: 3, c: 5 });
  });

  it('clamps the target to available steps', () => {
    const g = { ...goal, ranges: { asc: { current: 0, target: 99 } } };
    expect(goalCost(g, entity)).toEqual({ a: 5, b: 1, c: 5 });
  });

  it('aggregates goals and computes shortfall', () => {
    const total = totalCost([goal, goal], new Map([['e1', entity]]));
    expect(total).toEqual({ a: 6, c: 10 });
    const reqs = requirements(total, { a: 4 });
    expect(reqs.find((r) => r.materialId === 'a')).toEqual({ materialId: 'a', required: 6, owned: 4, missing: 2 });
  });
});

describe('planner stamina', () => {
  it('regenerates and caps', () => {
    const rules = STAMINA_RULES.zzz;
    const start = new Date('2026-01-01T00:00:00Z');
    const s = { current: 10, updatedAt: start.toISOString() };
    expect(currentStamina(rules, s, new Date(start.getTime() + 60 * 60000))).toBe(20);
    expect(currentStamina(rules, s, new Date(start.getTime() + 99999 * 60000))).toBe(rules.max);
  });

  it('computes time until needed', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const snapshot = { current: 10, updatedAt: now.toISOString() };
    expect(minutesUntil(STAMINA_RULES.zzz, snapshot, 20, now)).toBe(60);
    expect(minutesUntil(STAMINA_RULES.zzz, snapshot, 999, now)).toBeNull();
  });

  it('uses the Endfield Authority Level cap progression and precise Sanity recovery', () => {
    expect([1, 35, 36, 50, 51, 60].map(endfieldMax)).toEqual([125, 295, 298, 340, 342, 360]);
    expect(() => endfieldMax(61)).toThrow();
    expect(staminaRules('endfield', { level: 60, max: 380 }).max).toBe(380);
    const rules = staminaRules('endfield');
    const start = new Date('2026-01-01T00:00:00Z');
    const snapshot = { current: 0, updatedAt: start.toISOString() };
    expect(currentStamina(rules, snapshot, new Date(start.getTime() + 431000))).toBe(0);
    expect(currentStamina(rules, snapshot, new Date(start.getTime() + 432000))).toBe(1);
    expect(currentStamina(rules, snapshot, new Date(start.getTime() + 13 * 432000))).toBe(13);
    expect(formatStaminaDuration(minutesUntil(rules, snapshot, 1, start)!)).toBe('7m 12s');
    const sixMinutesLater = new Date(start.getTime() + 360000);
    expect(formatStaminaDuration(minutesUntil(rules, snapshot, 1, sixMinutesLater)!)).toBe('1m 12s');
    expect(minutesUntil(rules, snapshot, 0, sixMinutesLater)).toBe(0);
    expect(formatStaminaDuration(minutesUntil(rules, undefined, 1, sixMinutesLater)!)).toBe('7m 12s');
    expect(formatStaminaDuration(minutesUntil(rules, snapshot, 1, new Date(start.getTime() - 60000))!)).toBe('7m 12s');
  });
});
