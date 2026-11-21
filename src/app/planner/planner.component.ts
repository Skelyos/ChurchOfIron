import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { GAMES, GameId, Goal, PlannerEvent, StaminaConfig } from './models/planner.model';
import { PlannerStore } from './services/planner-store';
import { CatalogService } from './services/catalog-service';
import { goalCost, isGoalCompatible } from './services/calc';
import { currentStamina, formatDuration, formatStaminaDuration, minutesUntil, staminaRules } from './services/stamina';
import { PlannerPanelComponent } from './components/planner-panel/planner-panel.component';
import { PlannerGoalsComponent } from './components/planner-goals/planner-goals.component';
import { PlannerEventsComponent } from './components/planner-events/planner-events.component';
import { PlannerMaterialsComponent } from './components/planner-materials/planner-materials.component';
import { PlannerStaminaComponent, StaminaDisplay } from './components/planner-stamina/planner-stamina.component';
import { CharacterModalComponent, CharacterModalData } from './modals/character-modal/character-modal.component';
import { EventsModalComponent, EventsModalData } from './modals/events-modal/events-modal.component';
import { StaminaSettingsModalComponent, StaminaSettingsModalData } from './modals/stamina-settings-modal/stamina-settings-modal.component';

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

  readonly totalsByGame = computed(() => {
    const entities = this.entities();
    return this.visibleGames().map((game) => {
      const charactersByMaterial = new Map<string, Map<string, { id: string; name: string; required: number }>>();
      for (const goal of this.visibleGoals()) {
        const entity = entities.get(goal.entityId);
        if (goal.game !== game.id || !entity || !isGoalCompatible(goal, entity)) continue;
        for (const [materialId, required] of Object.entries(goalCost(goal, entity))) {
          if (required <= 0) continue;
          let characters = charactersByMaterial.get(materialId);
          if (!characters) {
            characters = new Map();
            charactersByMaterial.set(materialId, characters);
          }
          const previous = characters.get(entity.id);
          characters.set(entity.id, { id: entity.id, name: entity.name, required: (previous?.required ?? 0) + required });
        }
      }
      return {
        game,
        rows: this.store.requirementsFor(game.id).map((row) => ({
          ...row,
          characters: [...(charactersByMaterial.get(row.materialId)?.values() ?? [])],
        })),
      };
    }).filter((group) => group.rows.length);
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
