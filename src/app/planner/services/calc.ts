import { Goal, Inventory, MaterialCost, MaterialRequirement, PlannerEntity, UpgradePath } from '../models/planner.model';
import { CHARACTER_LEVEL_PATH } from '../data/character-experience';

export function pathPosition(path: UpgradePath, position: number): string {
  if (path.levelBased) return `Level ${position + 1}`;
  return position === 0 ? 'start' : path.steps[position - 1]?.label ?? 'unavailable';
}

export function isGoalCompatible(goal: Goal, entity: PlannerEntity): boolean {
  if (!goal.ranges || typeof goal.ranges !== 'object') return false;
  const paths = new Map(entity.paths.map((path) => [path.id, path]));
  const ranges = Object.entries(goal.ranges);
  const hasRequiredRanges = entity.paths.every((path) => {
    if (path.id === CHARACTER_LEVEL_PATH) return true;
    if (goal.game === 'endfield' && path.id.startsWith('ability:') && !goal.ranges[path.id]) return true;
    return !!goal.ranges[path.id];
  });
  if (!hasRequiredRanges) return false;

  return ranges.every(([id, range]) => {
    const path = paths.get(id);
    return !!path && !!range && Number.isInteger(range.current) && Number.isInteger(range.target) &&
      range.current >= 0 && range.target >= 0 && range.current <= path.steps.length &&
      range.target <= path.steps.length && range.current <= range.target;
  });
}

function addCost(into: MaterialCost, cost: MaterialCost): void {
  for (const [id, amount] of Object.entries(cost)) {
    into[id] = (into[id] ?? 0) + amount;
  }
}

export function pathCost(goal: Goal, path: UpgradePath): MaterialCost {
  const total: MaterialCost = {};
  const range = goal.ranges[path.id];
  if (!range) return total;
  const from = Math.max(0, range.current);
  const to = Math.min(path.steps.length, range.target);
  for (let i = from; i < to; i++) {
    addCost(total, path.steps[i].cost);
  }
  return total;
}

/** Total materials needed for a single goal, summing steps in [current, target) of each path. */
export function goalCost(goal: Goal, entity: PlannerEntity): MaterialCost {
  const total: MaterialCost = {};
  for (const path of entity.paths) {
    addCost(total, pathCost(goal, path));
  }
  return total;
}

export function totalCost(goals: Goal[], entities: Map<string, PlannerEntity>): MaterialCost {
  const total: MaterialCost = {};
  for (const goal of goals) {
    const entity = entities.get(goal.entityId);
    if (entity) addCost(total, goalCost(goal, entity));
  }
  return total;
}

export function requirements(cost: MaterialCost, inventory: Inventory): MaterialRequirement[] {
  return Object.entries(cost)
    .map(([materialId, required]) => {
      const owned = inventory[materialId] ?? 0;
      return { materialId, required, owned, missing: Math.max(0, required - owned) };
    })
    .sort((a, b) => b.missing - a.missing || a.materialId.localeCompare(b.materialId));
}
