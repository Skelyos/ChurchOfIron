import { GAMES, GameId, Goal, Inventory, PlannerEntity, UpgradePath } from '../models/planner.model';
import { CHARACTER_LEVEL_PATH, ExperienceCharacter } from '../data/character-experience';
import { isGoalCompatible, pathCost } from './calc';
import { MaterialGroup, MaterialRow, MaterialSection } from '../components/planner-materials/planner-materials.model';

interface MaterialUse {
  required: number;
  characters: Map<string, ExperienceCharacter>;
}

interface MaterialSectionUse {
  id: string;
  label: string;
  order: number;
  materials: Map<string, MaterialUse>;
}

function materialSection(game: GameId, path: UpgradePath): Omit<MaterialSection, 'rows'> & { order: number } {
  if (path.id === CHARACTER_LEVEL_PATH) return { id: 'character-leveling', label: 'Character Leveling', order: 0 };
  if (game === 'zzz') {
    if (path.id === 'promotion') return { id: 'promotion', label: 'Promotion', order: 1 };
    if (path.id === 'core') return { id: 'core-skill', label: 'Core Skill', order: 2 };
    if (path.id.startsWith('skill:')) return { id: 'skill-leveling', label: 'Skill Leveling', order: 3 };
  } else if (game === 'wuwa') {
    if (path.id === 'promotion') return { id: 'ascension', label: 'Ascension', order: 1 };
    if (path.id.startsWith('skill:')) return { id: 'skill-leveling', label: 'Skill Leveling', order: 2 };
    if (path.id.startsWith('node:')) return { id: 'stat-nodes', label: 'Stat Nodes', order: 3 };
  } else {
    if (path.id === 'promotion') return { id: 'promotion', label: 'Promotion', order: 1 };
    if (path.id.startsWith('ability:')) return { id: 'ability-matrix-skills', label: 'Ability Matrix Skills', order: 2 };
  }
  return { id: 'other-progression', label: 'Other Progression', order: 99 };
}

function addCharacterUse(into: Map<string, ExperienceCharacter>, id: string, name: string, required: number): void {
  const previous = into.get(id);
  into.set(id, { id, name, required: (previous?.required ?? 0) + required });
}

export function aggregateMaterialGroups(
  games: readonly (typeof GAMES)[number][],
  goals: Goal[],
  entities: Map<string, PlannerEntity>,
  inventory: Inventory,
): MaterialGroup[] {
  return games.map((game) => {
    const sectionUses = new Map<string, MaterialSectionUse>();
    for (const goal of goals) {
      const entity = entities.get(goal.entityId);
      if (goal.game !== game.id || !entity || !isGoalCompatible(goal, entity)) continue;
      for (const path of entity.paths) {
        const section = materialSection(game.id, path);
        let sectionUse = sectionUses.get(section.id);
        if (!sectionUse) {
          sectionUse = { ...section, materials: new Map() };
          sectionUses.set(section.id, sectionUse);
        }
        for (const [materialId, required] of Object.entries(pathCost(goal, path))) {
          if (required <= 0) continue;
          let use = sectionUse.materials.get(materialId);
          if (!use) {
            use = { required: 0, characters: new Map() };
            sectionUse.materials.set(materialId, use);
          }
          use.required += required;
          addCharacterUse(use.characters, entity.id, entity.name, required);
        }
      }
    }

    const usesByMaterial = new Map<string, { section: MaterialSectionUse; use: MaterialUse }[]>();
    for (const section of sectionUses.values()) {
      for (const [materialId, use] of section.materials) {
        const uses = usesByMaterial.get(materialId) ?? [];
        uses.push({ section, use });
        usesByMaterial.set(materialId, uses);
      }
    }

    const makeRow = (
      materialId: string,
      required: number,
      characters: Map<string, ExperienceCharacter>,
      breakdown?: MaterialRow['breakdown'],
    ): MaterialRow => {
      const owned = inventory[materialId] ?? 0;
      return {
        materialId, required, owned, missing: Math.max(0, required - owned),
        characters: [...characters.values()],
        ...(breakdown?.length ? { breakdown } : {}),
      };
    };

    const rowsBySection = new Map<string, MaterialRow[]>();
    const sharedRows: MaterialRow[] = [];
    for (const [materialId, uses] of usesByMaterial) {
      if (uses.length === 1) {
        const { section, use } = uses[0];
        const rows = rowsBySection.get(section.id) ?? [];
        rows.push(makeRow(materialId, use.required, use.characters));
        rowsBySection.set(section.id, rows);
        continue;
      }

      const characters = new Map<string, ExperienceCharacter>();
      uses.forEach(({ use }) => use.characters.forEach((character) =>
        addCharacterUse(characters, character.id, character.name, character.required)));
      const breakdown = uses
        .slice()
        .sort((a, b) => a.section.order - b.section.order || a.section.label.localeCompare(b.section.label))
        .map(({ section, use }) => ({
          sectionId: section.id, sectionLabel: section.label, required: use.required,
        }));
      sharedRows.push(makeRow(
        materialId,
        uses.reduce((total, { use }) => total + use.required, 0),
        characters,
        breakdown,
      ));
    }

    const sections: MaterialSection[] = [...sectionUses.values()]
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
      .map((section) => ({ id: section.id, label: section.label, rows: rowsBySection.get(section.id) ?? [] }))
      .filter((section) => section.rows.length);
    if (sharedRows.length) sections.push({ id: 'shared-materials', label: 'Shared Materials', rows: sharedRows });
    return { game, sections };
  }).filter((group) => group.sections.length);
}
