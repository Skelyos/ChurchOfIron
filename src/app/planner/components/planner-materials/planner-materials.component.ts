import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { GAMES, GameId, Inventory, Material, MaterialRequirement } from '../../models/planner.model';
import { EXPERIENCE_GROUPS, ExperienceCharacter, experienceGroup, planExperience } from '../../data/character-experience';
import { DecimalPipe } from '@angular/common';

export interface MaterialGroup {
  game: (typeof GAMES)[number];
  sections: MaterialSection[];
}

export interface MaterialSection {
  id: string;
  label: string;
  rows: MaterialRow[];
}

export interface MaterialRow extends MaterialRequirement {
  characters: ExperienceCharacter[];
  breakdown?: { sectionId: string; sectionLabel: string; required: number }[];
}

function hasBreakdown(row: MaterialRow | ReturnType<typeof planExperience>[number]): row is MaterialRow {
  return 'breakdown' in row;
}

const TIER_BORDER_COLORS: Record<GameId, Partial<Record<number, string>>> = {
  zzz: { 1: '#aeb6c2', 2: '#68aef0', 3: '#ae83e7', 4: '#e8b85b' },
  wuwa: { 1: '#aeb6c2', 2: '#70c98a', 3: '#68aef0', 4: '#ae83e7', 5: '#e8b85b' },
  endfield: { 1: '#aeb6c2', 2: '#70c98a', 3: '#68aef0', 4: '#ae83e7', 5: '#e8b85b', 6: '#e8894f' },
};

export function materialTierBorderColor(material: Material | undefined): string | undefined {
  return material?.tier === undefined ? undefined : TIER_BORDER_COLORS[material.game][material.tier];
}

@Component({
  selector: 'app-planner-materials',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, DecimalPipe],
  templateUrl: './planner-materials.component.html',
  styleUrls: ['../../planner-common.scss', './planner-materials.component.scss'],
})
export class PlannerMaterialsComponent {
  readonly groups = input.required<MaterialGroup[]>();
  readonly materials = input.required<Map<string, Material>>();
  readonly inventory = input.required<Inventory>();
  readonly unresolvedInventory = input.required<[string, number][]>();
  readonly inventoryChange = output<{ materialId: string; amount: number }>();
  readonly unavailableIcons = signal(new Set<string>());
  readonly spriteLayouts = signal(new Map<string, 0 | 60 | 120 | null>());
  readonly displayGroups = computed(() => this.groups().map((group) => ({
      ...group,
      sections: group.sections.map((section) => ({
        ...section,
        experienceTotals: section.rows.filter((row) => experienceGroup(row.materialId)),
        rows: section.rows.flatMap((row) => {
          const experience = experienceGroup(row.materialId);
          return experience ? planExperience(experience, row.characters, this.inventory()) : [row];
        }).map((row) => ({
          ...row,
          breakdown: hasBreakdown(row) ? row.breakdown : undefined,
        })).sort((a, b) => this.compareMaterials(a.materialId, b.materialId)),
      })),
    })
  ));
  readonly experienceItemIds = new Set(EXPERIENCE_GROUPS.flatMap((group) => group.items.map((item) => item.id)));

  experienceName(id: string): string {
    if (id === 'endfield:combat-exp') return 'Combat Record EXP';
    if (id === 'endfield:carrier-exp') return 'Cognitive Carrier EXP';
    return 'Character EXP';
  }

  setInventory(materialId: string, value: number | null): void {
    const amount = this.experienceItemIds.has(materialId) && typeof value === 'number' && Number.isFinite(value)
      ? Math.floor(value) : value ?? 0;
    this.inventoryChange.emit({ materialId, amount });
  }

  materialName(id: string): string {
    return this.materials().get(id)?.name ?? id;
  }

  tierBorderColor(id: string): string | undefined {
    return materialTierBorderColor(this.materials().get(id));
  }

  private compareMaterials(aId: string, bId: string): number {
    const materials = this.materials();
    const a = materials.get(aId);
    const b = materials.get(bId);
    const aName = a?.name ?? aId;
    const bName = b?.name ?? bId;
    return (a?.family ?? aName.toLocaleLowerCase()).localeCompare(b?.family ?? bName.toLocaleLowerCase()) ||
      (b?.tier ?? 0) - (a?.tier ?? 0) ||
      aName.localeCompare(bName) ||
      aId.localeCompare(bId);
  }

  materialIcon(id: string): string | undefined {
    const url = this.materials().get(id)?.iconUrl;
    return url && !this.unavailableIcons().has(url) ? url : undefined;
  }

  recordSpriteLayout(url: string, image: HTMLImageElement): void {
    const layout = image.naturalWidth !== 2048 ? null :
      image.naturalHeight === 1024 ? 60 : image.naturalHeight === 2048 ? 120 : 0;
    this.spriteLayouts.update((layouts) => new Map(layouts).set(url, layout));
  }

  markIconUnavailable(url: string): void {
    this.unavailableIcons.update((icons) => new Set(icons).add(url));
  }
}
