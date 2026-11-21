import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { GAMES, Inventory, Material, MaterialRequirement } from '../../models/planner.model';
import { EXPERIENCE_GROUPS, ExperienceCharacter, experienceGroup, planExperience } from '../../data/character-experience';

export interface MaterialGroup {
  game: (typeof GAMES)[number];
  rows: (MaterialRequirement & { characters: ExperienceCharacter[] })[];
}

@Component({
  selector: 'app-planner-materials',
  imports: [FormsModule, MatFormFieldModule, MatInputModule],
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
  readonly displayGroups = computed(() => this.groups().map((group) => ({
    ...group,
    experienceTotals: group.rows.filter((row) => experienceGroup(row.materialId)),
    rows: group.rows.flatMap((row) => {
      const experience = experienceGroup(row.materialId);
      return experience ? planExperience(experience, row.characters, this.inventory()) : [row];
    }),
  })));
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

  materialIcon(id: string): string | undefined {
    const url = this.materials().get(id)?.iconUrl;
    return url && !this.unavailableIcons().has(url) ? url : undefined;
  }

  markIconUnavailable(url: string): void {
    this.unavailableIcons.update((icons) => new Set(icons).add(url));
  }
}
