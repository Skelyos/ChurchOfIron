import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { GAMES, GameId, Goal, PlannerEvent, StaminaConfig, UpgradePath } from './models/planner.model';
import { PlannerStore } from './services/planner-store';
import { CatalogService } from './services/catalog-service';
import { isGoalCompatible, pathCost } from './services/calc';
import { currentStamina, formatDuration, formatStaminaDuration, minutesUntil, staminaRules } from './services/stamina';
import { PlannerPanelComponent } from './components/planner-panel/planner-panel.component';
import { PlannerGoalsComponent } from './components/planner-goals/planner-goals.component';
import { PlannerEventsComponent } from './components/planner-events/planner-events.component';
import { MaterialGroup, MaterialRow, MaterialSection, PlannerMaterialsComponent } from './components/planner-materials/planner-materials.component';
import { PlannerStaminaComponent, StaminaDisplay } from './components/planner-stamina/planner-stamina.component';
import { CharacterModalComponent, CharacterModalData } from './modals/character-modal/character-modal.component';
import { EventsModalComponent, EventsModalData } from './modals/events-modal/events-modal.component';
import { StaminaSettingsModalComponent, StaminaSettingsModalData } from './modals/stamina-settings-modal/stamina-settings-modal.component';
import { CHARACTER_LEVEL_PATH } from './data/character-experience';
import { ExperienceCharacter } from './data/character-experience';
import { MatIconModule } from '@angular/material/icon';

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

@Component({
  selector: 'app-planner',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    PlannerPanelComponent,
    PlannerGoalsComponent,
    PlannerEventsComponent,
    PlannerMaterialsComponent,
    PlannerStaminaComponent,
    MatIconModule,
  ],
  templateUrl: './planner.component.html',
  styleUrls: ['./planner-common.scss', './planner.component.scss'],
})
export class PlannerComponent {
  readonly store = inject(PlannerStore);
  readonly catalog = inject(CatalogService);
  private readonly dialog = inject(MatDialog);
  readonly games = GAMES;
  readonly entities = this.catalog.entities;
  readonly catalogError = signal('');
  readonly filter = signal<GameId | 'all'>('all');
  readonly now = signal(new Date());
  readonly eventNotice = signal('');
  private eventDialogVersion = 0;

  readonly visibleGoals = computed(() =>
    this.store.goals().filter((g) => this.filter() === 'all' || g.game === this.filter()),
  );

  readonly visibleGames = computed(() =>
    this.games.filter((game) => this.filter() === 'all' || game.id === this.filter()));

  readonly goalsByGame = computed(() => this.visibleGames().map((game) => ({
    game, goals: this.visibleGoals().filter((goal) => goal.game === game.id),
  })));

  readonly totals = computed(() => this.store.requirementsFor(this.filter()));

  readonly visibleEvents = computed(() => this.store.events()
    .filter((event) => this.filter() === 'all' || event.game === this.filter())
    .slice()
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)));

  readonly eventDisplays = computed(() => this.visibleEvents().map((event) => ({
    event,
    gameName: this.gameName(event.game),
    countdown: this.eventCountdown(event),
    start: this.eventDate(event.startsAt),
    end: this.eventDate(event.endsAt),
  })));

  readonly staminaDisplays = computed<StaminaDisplay[]>(() => this.visibleGames().map((game) => ({
      game,
      current: this.stamina(game.id), max: this.staminaMax(game.id),
      timeToReady: this.timeToReady(game.id),
    })));

  readonly unresolvedInventory = computed(() => Object.entries(this.store.inventory())
    .filter(([id]) => !this.catalog.materials().has(id)));

  readonly totalsByGame = computed<MaterialGroup[]>(() => {
    const entities = this.entities();
    const inventory = this.store.inventory();
    return this.visibleGames().map((game) => {
      const sectionUses = new Map<string, MaterialSectionUse>();
      for (const goal of this.visibleGoals()) {
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
  });

  constructor() {
    const timer = setInterval(() => this.now.set(new Date()), 30000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
    void this.loadCatalog();
  }

  async loadCatalog(): Promise<void> {
    await Promise.all([this.catalog.load('zzz'), this.catalog.load('wuwa'), this.catalog.load('endfield')]);
    for (const goal of this.store.goals()) {
      const entry = this.catalog.entries().find((item) => item.id === goal.entityId);
      if (entry) {
        try {
          await this.catalog.loadEntity(entry);
        } catch (error) {
          this.catalogError.set(`Could not restore ${entry.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  }

  gameName(id: GameId): string {
    return GAMES.find((g) => g.id === id)?.name ?? id;
  }

  openCharacterDialog(goal?: Goal): void {
    const data: CharacterModalData = {
      filter: this.filter,
      goal,
      entity: goal ? this.entities().get(goal.entityId) : undefined,
      reloadCatalog: () => this.loadCatalog(),
      save: (id, entity, ranges) => {
        if (id) this.store.setGoalRanges(id, ranges);
        else this.store.addGoal(entity, ranges);
      },
    };
    this.dialog.open(CharacterModalComponent, {
      data, width: '760px', maxWidth: '95vw', maxHeight: '90vh',
      ariaLabel: goal ? 'Edit character build' : 'Add character',
    });
  }

  openEventsDialog(event?: PlannerEvent): void {
    const version = ++this.eventDialogVersion;
    this.eventNotice.set('');
    const data: EventsModalData = {
      filter: this.filter,
      event,
      save: (savedEvent) => this.store.saveEvent(savedEvent),
    };
    const ref = this.dialog.open<EventsModalComponent, EventsModalData, string>(EventsModalComponent, {
      data, width: '760px', maxWidth: '95vw', maxHeight: '90vh', ariaLabel: 'Manage events',
    });
    ref.afterClosed().subscribe((notice) => {
      if (notice && this.eventDialogVersion === version) this.eventNotice.set(notice);
    });
  }

  openStaminaSettings(): void {
    const data: StaminaSettingsModalData = { settings: structuredClone(this.store.staminaConfig()) };
    const ref = this.dialog.open<StaminaSettingsModalComponent, StaminaSettingsModalData, Record<GameId, StaminaConfig>>(
      StaminaSettingsModalComponent, {
        data, width: '760px', maxWidth: '95vw', maxHeight: '90vh', ariaLabel: 'Stamina settings',
      });
    ref.afterClosed().subscribe((settings) => {
      if (settings) this.store.setStaminaConfig(settings);
    });
  }

  stamina(game: GameId): number {
    return currentStamina(staminaRules(game, this.store.staminaConfig()[game]), this.store.stamina()[game], this.now());
  }

  staminaMax(game: GameId): number {
    return staminaRules(game, this.store.staminaConfig()[game]).max;
  }

  timeToReady(game: GameId): string {
    const rules = staminaRules(game, this.store.staminaConfig()[game]);
    return formatStaminaDuration(minutesUntil(rules, this.store.stamina()[game], rules.max, this.now()) ?? 0);
  }

  eventDate(value: string): string {
    const formatted = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC',
    }).format(new Date(value));
    return `${formatted} UTC`;
  }

  eventCountdown(event: PlannerEvent): string {
    const now = this.now().getTime();
    const startsAt = Date.parse(event.startsAt);
    const endsAt = Date.parse(event.endsAt);
    if (endsAt <= now) return 'Ended';
    const isUpcoming = now < startsAt;
    const minutes = Math.ceil(((isUpcoming ? startsAt : endsAt) - now) / 60000);
    return `${isUpcoming ? 'Starts' : 'Ends'} in ${formatDuration(minutes)}`;
  }

  export(): void {
    const url = URL.createObjectURL(new Blob([this.store.exportJson()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'planner.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async import(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      this.store.importJson(await file.text());
      await this.loadCatalog();
    } catch {
      alert('Invalid planner file.');
    }
    input.value = '';
  }
}
