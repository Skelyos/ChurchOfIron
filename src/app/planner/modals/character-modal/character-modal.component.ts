import { Component, computed, DestroyRef, inject, signal, Signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CatalogEntry } from '../../data/catalog-common';
import { CHARACTER_LEVEL_PATH } from '../../data/character-experience';
import { GAMES, GameId, Goal, PathRange, PlannerEntity } from '../../models/planner.model';
import { isGoalCompatible, pathPosition } from '../../services/calc';
import { CatalogService } from '../../services/catalog-service';

function initialDraftRanges(goal?: Goal, entity?: PlannerEntity): Record<string, PathRange> {
  if (!goal) return {};
  const ranges = structuredClone(goal.ranges);
  if (entity?.paths.some((path) => path.id === CHARACTER_LEVEL_PATH) && !ranges[CHARACTER_LEVEL_PATH]) {
    ranges[CHARACTER_LEVEL_PATH] = { current: 0, target: 0 };
  }
  for (const path of entity?.paths ?? []) {
    if (goal.game === 'endfield' && path.id.startsWith('ability:') && !ranges[path.id]) {
      ranges[path.id] = { current: 0, target: 0 };
    }
  }
  return ranges;
}

export interface CharacterModalData {
  filter: Signal<GameId | 'all'>;
  goal?: Goal;
  entity?: PlannerEntity;
  reloadCatalog: () => Promise<void>;
  save: (id: string | null, entity: PlannerEntity, ranges: Record<string, PathRange>) => void;
}

@Component({
  selector: 'app-character-modal',
  imports: [FormsModule, MatButtonModule, MatCheckboxModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './character-modal.component.html',
  styleUrls: ['../../planner-common.scss', '../modal-common.scss', './character-modal.component.scss'],
})
export class CharacterModalComponent {
  readonly data = inject<CharacterModalData>(MAT_DIALOG_DATA);
  readonly catalog = inject(CatalogService);
  private readonly ref = inject(MatDialogRef<CharacterModalComponent>);
  private readonly destroyRef = inject(DestroyRef);
  readonly pathPosition = pathPosition;
  readonly search = signal('');
  readonly selectedEntity = signal<PlannerEntity | null>(this.data.entity ?? null);
  readonly draftRanges = signal<Record<string, PathRange>>(initialDraftRanges(this.data.goal, this.data.entity));
  readonly editingGoalId = signal<string | null>(this.data.goal?.id ?? null);
  readonly characterLoading = signal(false);
  readonly characterError = signal('');
  readonly characterMessage = signal('');
  readonly keepCharacterOpen = signal(false);
  public showDataInformation = signal(false);

  readonly catalogMatches = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.catalog.entries().filter(
      (entry) => (this.data.filter() === 'all' || entry.game === this.data.filter()) &&
        (!q || entry.name.toLowerCase().includes(q)),
    );
  });

  duplicateName(entry: CatalogEntry): boolean {
    return this.catalogMatches().filter((item) => item.game === entry.game && item.name === entry.name).length > 1;
  }

  gameName(id: GameId): string {
    return GAMES.find((game) => game.id === id)?.name ?? id;
  }

  async selectCharacter(entry: CatalogEntry): Promise<void> {
    this.characterError.set('');
    this.characterMessage.set('');
    this.characterLoading.set(true);
    try {
      const entity = await this.catalog.loadEntity(entry);
      if (this.destroyRef.destroyed) return;
      this.selectedEntity.set(entity);
      this.draftRanges.set(this.data.goal?.entityId === entity.id
        ? initialDraftRanges(this.data.goal, entity)
        : Object.fromEntries(entity.paths.map((path) =>
          [path.id, { current: 0, target: path.steps.length }])));
    } catch (error) {
      if (!this.destroyRef.destroyed) {
        this.characterError.set(`Could not load ${entry.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      if (!this.destroyRef.destroyed) this.characterLoading.set(false);
    }
  }

  setDraftRange(pathId: string, field: 'current' | 'target', value: number, max: number): void {
    const range = this.draftRanges()[pathId];
    if (!range) return;
    this.characterMessage.set('');
    const v = typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(0, Math.floor(value))) : 0;
    this.draftRanges.update((ranges) => ({ ...ranges, [pathId]: { ...range, [field]: v } }));
  }

  saveCharacter(): void {
    const entity = this.selectedEntity();
    if (!entity) return;
    const id = this.editingGoalId();
    const ranges = structuredClone(this.draftRanges());
    const goal: Goal = { id: id ?? '', entityId: entity.id, game: entity.game, ranges };
    if (!isGoalCompatible(goal, entity)) {
      this.characterMessage.set('');
      this.characterError.set('Each current value must be at or below its target, and all saved tracks must match the source. Add a new goal if the tracks have changed.');
      return;
    }
    this.data.save(id, entity, ranges);
    this.characterError.set('');
    if (this.keepCharacterOpen()) {
      if (!id) {
        this.selectedEntity.set(null);
        this.draftRanges.set({});
        this.search.set('');
      }
      this.characterMessage.set(id ? 'Build saved.' : 'Goal added. Select another character.');
    } else {
      this.ref.close();
    }
  }
}
