import { signal } from '@angular/core';
import { fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { PlannerComponent } from './planner.component';
import { CatalogService } from './services/catalog-service';
import { EMPTY_STATE, PlannerStorage } from './services/planner-storage';
import { CatalogEntry } from './data/api-catalog';
import { PlannerEntity } from './models/planner.model';
import { CharacterModalComponent } from './modals/character-modal/character-modal.component';
import { EventsModalComponent } from './modals/events-modal/events-modal.component';
import { StaminaSettingsModalComponent } from './modals/stamina-settings-modal/stamina-settings-modal.component';
import { characterLevelPath } from './data/character-experience';
import { parseEndfieldLevelPath } from './data/endfield-catalog';

describe('planner dialogs', () => {
  const entry: CatalogEntry = { id: 'zzz:1', name: 'Test character', game: 'zzz', attributes: [], beta: true };
  const entity: PlannerEntity = {
    ...entry, kind: 'character',
    paths: [{ id: 'promotion', label: 'Promotion', steps: [
      { label: 'First', cost: { 'zzz:1': 2 } }, { label: 'Second', cost: { 'zzz:1': 3 } },
    ] }],
  };
  let overlay: HTMLElement;

  beforeEach(async () => {
    const entities = signal(new Map<string, PlannerEntity>());
    await TestBed.configureTestingModule({
      imports: [PlannerComponent],
      providers: [
        provideNoopAnimations(),
        { provide: PlannerStorage, useValue: { load: () => structuredClone(EMPTY_STATE), save: () => {} } },
        { provide: CatalogService, useValue: {
          entries: signal([entry]), entities, materials: signal(new Map([['zzz:1', {
            id: 'zzz:1', game: 'zzz', name: 'Material', iconUrl: 'https://static.nanoka.cc/assets/zzz/IconCoin.webp',
          }]])),
          status: signal({ zzz: 'Test', wuwa: 'Test', endfield: 'Test' }), load: async () => {},
          loadEntity: async () => {
            entities.update((value) => new Map(value).set(entity.id, entity));
            return entity;
          },
        } },
      ],
    }).compileComponents();
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
  });

  function clickText(root: ParentNode, text: string): void {
    const button = Array.from(root.querySelectorAll('button')).find((item) => item.textContent?.trim() === text);
    if (!button) throw new Error(`Button not found: ${text}`);
    button.click();
  }

  function selectEventGame(name: string): void {
    const select = overlay.querySelector<HTMLElement>('mat-select');
    if (!select) throw new Error('Game selector not found');
    select.click();
    flushMicrotasks();
    tick(500);
    const option = Array.from(overlay.querySelectorAll<HTMLElement>('mat-option'))
      .find((item) => item.textContent?.trim() === name);
    if (!option) throw new Error(`Game option not found: ${name}`);
    option.click();
    flushMicrotasks();
    tick(500);
  }

  function checkKeepOpen(): void {
    const checkbox = overlay.querySelector<HTMLInputElement>('mat-checkbox input');
    if (!checkbox) throw new Error('Keep open checkbox not found');
    expect(checkbox.checked).toBeFalse();
    checkbox.click();
    expect(checkbox.checked).toBeTrue();
  }

  function characterModal(): CharacterModalComponent {
    const instance = TestBed.inject(MatDialog).openDialogs[0]?.componentInstance;
    if (!(instance instanceof CharacterModalComponent)) throw new Error('Character modal not found');
    return instance;
  }

  function eventsModal(): EventsModalComponent {
    const instance = TestBed.inject(MatDialog).openDialogs[0]?.componentInstance;
    if (!(instance instanceof EventsModalComponent)) throw new Error('Events modal not found');
    return instance;
  }

  function staminaModal(): StaminaSettingsModalComponent {
    const instance = TestBed.inject(MatDialog).openDialogs[0]?.componentInstance;
    if (!(instance instanceof StaminaSettingsModalComponent)) throw new Error('Stamina settings modal not found');
    return instance;
  }

  function expectDialogActions(labels: string[]): void {
    const actions = overlay.querySelector<HTMLElement>('mat-dialog-actions');
    if (!actions) throw new Error('Dialog actions not found');
    const buttons = Array.from(actions.querySelectorAll<HTMLButtonElement>('button'));
    expect(buttons.map((button) => button.textContent?.trim())).toEqual(labels);
    const bounds = actions.getBoundingClientRect();
    expect(buttons[0].getBoundingClientRect().left - bounds.left).toBeLessThan(32);
    expect(bounds.right - buttons[buttons.length - 1].getBoundingClientRect().right).toBeLessThan(32);
  }

  it('creates and edits builds in a dialog without saving cancelled changes', fakeAsync(() => {
    const fixture = TestBed.createComponent(PlannerComponent);
    fixture.detectChanges();
    clickText(fixture.nativeElement, 'Add character');
    flushMicrotasks();
    fixture.detectChanges();
    expect(overlay.querySelector('[role="dialog"]')).toBeTruthy();
    const characterButton = overlay.querySelector<HTMLButtonElement>('.catalog-entry');
    expect(characterButton).not.toBeNull();
    characterButton?.click();
    flushMicrotasks();
    fixture.detectChanges();
    expectDialogActions(['Cancel', 'Back', 'Add goal']);
    const component = fixture.componentInstance;
    characterModal().setDraftRange('promotion', 'target', 1, 2);
    clickText(overlay, 'Cancel');
    tick(500);
    fixture.detectChanges();
    expect(component.store.goals()).toEqual([]);

    clickText(fixture.nativeElement, 'Add character');
    flushMicrotasks();
    fixture.detectChanges();
    overlay.querySelector<HTMLButtonElement>('.catalog-entry')?.click();
    flushMicrotasks();
    fixture.detectChanges();
    characterModal().setDraftRange('promotion', 'current', 2, 2);
    characterModal().setDraftRange('promotion', 'target', 1, 2);
    characterModal().saveCharacter();
    expect(characterModal().characterError()).toContain('current value');
    expect(component.store.goals()).toEqual([]);
    expect(overlay.querySelector('[role="dialog"]')).toBeTruthy();
    characterModal().setDraftRange('promotion', 'current', 0, 2);
    characterModal().saveCharacter();
    tick(500);
    fixture.detectChanges();
    expect(overlay.querySelector('[role="dialog"]')).toBeNull();
    expect(component.store.goals()[0].ranges['promotion']).toEqual({ current: 0, target: 1 });
    expect(component.store.requirementsFor('zzz')[0].required).toBe(2);

    clickText(fixture.nativeElement, 'Edit build');
    flushMicrotasks();
    fixture.detectChanges();
    characterModal().setDraftRange('promotion', 'target', 2, 2);
    characterModal().saveCharacter();
    tick(500);
    expect(component.store.goals()[0].ranges['promotion'].target).toBe(2);
    expect(component.store.requirementsFor('zzz')[0].required).toBe(5);
    fixture.destroy();
  }));

  it('plans levels in separate EXP item cards and preserves old goals when editing', fakeAsync(() => {
    const fixture = TestBed.createComponent(PlannerComponent);
    const component = fixture.componentInstance;
    const leveledEntity = { ...entity, paths: [characterLevelPath('zzz', [50, 150]), ...entity.paths] };
    spyOn(component.catalog, 'loadEntity').and.resolveTo(leveledEntity);
    component.catalog.entities.set(new Map([[entity.id, leveledEntity]]));
    component.catalog.materials.set(new Map([
      ['zzz:300001', { id: 'zzz:300001', game: 'zzz', name: 'Trainee Investigator Log' }],
      ['zzz:300002', { id: 'zzz:300002', game: 'zzz', name: 'Official Investigator Log' }],
      ['zzz:300003', { id: 'zzz:300003', game: 'zzz', name: 'Senior Investigator Log' }],
      ['zzz:1', { id: 'zzz:1', game: 'zzz', name: 'Material' }],
    ]));
    fixture.detectChanges();
    clickText(fixture.nativeElement, 'Add character');
    flushMicrotasks();
    fixture.detectChanges();
    overlay.querySelector<HTMLButtonElement>('.catalog-entry')?.click();
    flushMicrotasks();
    fixture.detectChanges();
    const levelInputs = overlay.querySelectorAll<HTMLInputElement>('.range-row:first-of-type input');
    expect(levelInputs[0].value).toBe('1');
    expect(levelInputs[1].value).toBe('3');
    levelInputs[0].value = '2';
    levelInputs[0].dispatchEvent(new Event('input'));
    expect(characterModal().draftRanges()['character-level'].current).toBe(1);
    levelInputs[0].value = '1';
    levelInputs[0].dispatchEvent(new Event('input'));
    clickText(overlay, 'Add goal');
    tick(500);
    fixture.detectChanges();
    expect(component.store.goals()[0].ranges['character-level']).toEqual({ current: 0, target: 2 });
    const cards = Array.from(fixture.nativeElement.querySelectorAll('.material-card')) as HTMLElement[];
    expect(cards.filter((card) => card.textContent?.includes('Investigator Log')).length).toBe(3);
    const card = cards.find((item) => item.textContent?.includes('Trainee Investigator Log'))!;
    expect(card.textContent).toContain('Required 2');
    expect(card.textContent).toContain('Missing 2');
    const owned = card.querySelector<HTMLInputElement>('[aria-label="Owned Trainee Investigator Log"]')!;
    owned.value = '1';
    owned.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(card.textContent).toContain('Missing 1');
    expect(card.textContent).toContain('Required 2');
    expect(component.store.inventory()['zzz:300001']).toBe(1);

    component.store.addGoal(leveledEntity, { promotion: { current: 0, target: 1 } });
    fixture.detectChanges();
    expect(component.store.requirementsFor('zzz').find((row) => row.materialId === 'zzz:1')?.required).toBe(7);
    const editButtons = fixture.nativeElement.querySelectorAll('.goal-actions button:first-child') as NodeListOf<HTMLButtonElement>;
    editButtons[1].click();
    flushMicrotasks();
    fixture.detectChanges();
    expect(characterModal().draftRanges()['character-level']).toEqual({ current: 0, target: 0 });
    clickText(overlay, 'Save build');
    tick(500);
    expect(component.store.goals()[1].ranges['character-level']).toEqual({ current: 0, target: 0 });
    fixture.destroy();
  }));

  it('displays separate Endfield EXP item cards across the level 60 boundary', fakeAsync(() => {
    const fixture = TestBed.createComponent(PlannerComponent);
    const component = fixture.componentInstance;
    const levels = Object.fromEntries(Array.from({ length: 89 }, (_, i) =>
      [String(i + 1), { exp: i === 58 ? 35340 : i === 59 ? 14510 : 100, gold: 10 }]));
    const operator: PlannerEntity = {
      id: 'endfield:chr_0004_pelica', name: 'Perlica', game: 'endfield', kind: 'character',
      paths: [parseEndfieldLevelPath(levels), { id: 'promotion', label: 'Promotion', steps: [] }],
    };
    const itemNames = [
      ['item_expcard_stage1_high', 'Advanced Combat Record'], ['item_expcard_stage1_mid', 'Intermediate Combat Record'],
      ['item_expcard_stage1_low', 'Elementary Combat Record'], ['item_expcard_stage2_high', 'Advanced Cognitive Carrier'],
      ['item_expcard_stage2_low', 'Elementary Cognitive Carrier'], ['item_gold', 'T-Creds'],
    ];
    component.catalog.materials.set(new Map(itemNames.map(([id, name]) =>
      [`endfield:${id}`, { id: `endfield:${id}`, name, game: 'endfield' as const }])));
    component.catalog.entities.set(new Map([[operator.id, operator]]));
    component.store.addGoal(operator, {
      'character-level': { current: 58, target: 60 }, promotion: { current: 0, target: 0 },
    });
    component.filter.set('endfield');
    fixture.detectChanges();
    const cards = Array.from(fixture.nativeElement.querySelectorAll('.material-card')) as HTMLElement[];
    expect(cards.length).toBe(6);
    const combat = cards.find((card) => card.textContent?.includes('Advanced Combat Record'))!;
    const carrier = cards.find((card) => card.textContent?.includes('Advanced Cognitive Carrier'))!;
    expect(combat.textContent).toContain('Missing 3');
    expect(carrier.textContent).toContain('Missing 1');
    const owned = combat.querySelector<HTMLInputElement>('[aria-label="Owned Advanced Combat Record"]')!;
    owned.value = '2';
    owned.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(combat.textContent).toContain('Missing 1');
    expect(carrier.textContent).toContain('Missing 1');
    clickText(fixture.nativeElement, 'Edit build');
    flushMicrotasks();
    fixture.detectChanges();
    const inputs = overlay.querySelectorAll<HTMLInputElement>('.range-row:first-of-type input');
    expect(inputs[0].value).toBe('59');
    expect(inputs[1].value).toBe('61');
    clickText(overlay, 'Cancel');
    tick(500);
    fixture.destroy();
  }));

  it('does not apply an unfinished character load to a newly opened modal', fakeAsync(() => {
    const fixture = TestBed.createComponent(PlannerComponent);
    let finishLoad!: (loaded: PlannerEntity) => void;
    spyOn(TestBed.inject(CatalogService), 'loadEntity').and.returnValue(new Promise((resolve) => {
      finishLoad = resolve;
    }));
    fixture.detectChanges();
    clickText(fixture.nativeElement, 'Add character');
    flushMicrotasks();
    fixture.detectChanges();
    overlay.querySelector<HTMLButtonElement>('.catalog-entry')?.click();
    clickText(overlay, 'Cancel');
    tick(500);
    clickText(fixture.nativeElement, 'Add character');
    flushMicrotasks();
    finishLoad(entity);
    flushMicrotasks();
    fixture.detectChanges();
    expect(characterModal().selectedEntity()).toBeNull();
    expect(overlay.querySelector('.catalog-entry')).toBeTruthy();
    expect(fixture.componentInstance.store.goals()).toEqual([]);
    TestBed.inject(MatDialog).closeAll();
    tick(500);
    fixture.destroy();
  }));

  it('saves UTC times and displays filtered events on the planner with edit and delete controls', fakeAsync(() => {
    const fixture = TestBed.createComponent(PlannerComponent);
    const component = fixture.componentInstance;
    component.filter.set('wuwa');
    fixture.detectChanges();
    clickText(fixture.nativeElement, 'Manage events');
    flushMicrotasks();
    fixture.detectChanges();
    expect(overlay.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe('Manage events');
    expect(eventsModal().eventGame()).toBe('wuwa');
    expectDialogActions(['Close', 'Add event']);
    checkKeepOpen();
    eventsModal().eventDraft = {
      id: '', game: 'wuwa', name: ' Event ', description: ' Details ',
      startsAt: '2026-07-19T10:00', endsAt: '2026-07-19T10:00',
    };
    eventsModal().saveEvent();
    expect(eventsModal().eventError()).toBeTruthy();
    expect(component.store.events()).toEqual([]);
    eventsModal().eventDraft.endsAt = '2026-07-20T10:00';
    fixture.detectChanges();
    tick();
    clickText(overlay, 'Add event');
    const event = component.store.events()[0];
    expect(event.name).toBe('Event');
    expect(event.startsAt).toBe('2026-07-19T10:00:00.000Z');
    expect(event.endsAt).toBe('2026-07-20T10:00:00.000Z');
    fixture.detectChanges();
    expect(overlay.querySelector('.event-card')).toBeNull();
    expect(overlay.textContent).toContain('Event saved.');
    clickText(overlay, 'Close');
    tick(500);
    fixture.detectChanges();
    const eventCard: HTMLElement = fixture.nativeElement.querySelector('.event-card');
    expect(eventCard.textContent).toContain('Event');
    expect(eventCard.textContent).toContain('UTC');
    clickText(eventCard, 'Edit');
    flushMicrotasks();
    fixture.detectChanges();
    checkKeepOpen();
    expect(eventsModal().eventDraft.startsAt).toBe('2026-07-19T10:00:00.000');
    expectDialogActions(['Close', 'Cancel edit', 'Save changes']);
    eventsModal().eventDraft.name = 'Changed';
    selectEventGame('Zenless Zone Zero');
    fixture.detectChanges();
    expect(component.visibleEvents().length).toBe(1);
    expect(eventsModal().eventDraft.game).toBe('zzz');
    eventsModal().eventDraft.name = 'Unfinished ZZZ event';
    selectEventGame('Wuthering Waves');
    fixture.detectChanges();
    expect(eventsModal().eventDraft.name).toBe('Changed');
    expect(eventsModal().eventDraft.id).toBe(event.id);
    eventsModal().saveEvent();
    expect(component.store.events().length).toBe(1);
    expect(component.store.events()[0].name).toBe('Changed');
    fixture.detectChanges();
    clickText(overlay, 'Close');
    tick(500);
    fixture.detectChanges();
    clickText(fixture.nativeElement.querySelector('.event-card'), 'Delete');
    expect(component.store.events()).toEqual([]);
    clickText(fixture.nativeElement, 'Manage events');
    flushMicrotasks();
    fixture.detectChanges();
    checkKeepOpen();
    selectEventGame('Zenless Zone Zero');
    eventsModal().eventDraft.name = 'ZZZ event';
    eventsModal().eventDraft.startsAt = '2026-07-19T10:00';
    eventsModal().eventDraft.endsAt = '2026-07-20T10:00';
    eventsModal().saveEvent();
    expect(component.store.events()[0].game).toBe('zzz');
    expect(eventsModal().eventMessage()).toContain('change the planner game filter');
    eventsModal().eventDraft.name = 'Unsaved';
    clickText(overlay, 'Close');
    tick(500);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.event-card')).toBeNull();
    component.filter.set('all');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.event-card')?.textContent).toContain('ZZZ event');
    component.filter.set('wuwa');
    fixture.detectChanges();
    clickText(fixture.nativeElement, 'Manage events');
    flushMicrotasks();
    fixture.detectChanges();
    expect(eventsModal().eventGame()).toBe('wuwa');
    selectEventGame('Zenless Zone Zero');
    expect(eventsModal().eventDraft.name).toBe('');
    TestBed.inject(MatDialog).closeAll();
    tick(500);
    fixture.destroy();
  }));

  it('closes the event dialog after a successful save by default, but not on validation errors', fakeAsync(() => {
    const fixture = TestBed.createComponent(PlannerComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    clickText(fixture.nativeElement, 'Manage events');
    flushMicrotasks();
    fixture.detectChanges();
    expect(overlay.querySelector<HTMLInputElement>('mat-checkbox input')?.checked).toBeFalse();
    eventsModal().saveEvent();
    expect(eventsModal().eventError()).toBeTruthy();
    expect(overlay.querySelector('[role="dialog"]')).toBeTruthy();
    eventsModal().eventDraft = {
      id: '', game: 'zzz', name: 'New event', description: '',
      startsAt: '2026-07-19T10:00', endsAt: '2026-07-20T10:00',
    };
    eventsModal().saveEvent();
    tick(500);
    fixture.detectChanges();
    expect(overlay.querySelector('[role="dialog"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.event-card')?.textContent).toContain('New event');
    expect(fixture.nativeElement.textContent).toContain('Event saved.');
    clickText(fixture.nativeElement.querySelector('.event-card'), 'Edit');
    flushMicrotasks();
    fixture.detectChanges();
    eventsModal().eventDraft.name = 'Updated event';
    eventsModal().saveEvent();
    tick(500);
    expect(overlay.querySelector('[role="dialog"]')).toBeNull();
    expect(component.store.events()[0].name).toBe('Updated event');
    fixture.destroy();
  }));

  it('does not restore a previous save notice after reopening the event modal', fakeAsync(() => {
    const fixture = TestBed.createComponent(PlannerComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.openEventsDialog();
    const modal = eventsModal();
    modal.eventDraft = {
      id: '', game: 'zzz', name: 'New event', description: '',
      startsAt: '2026-07-19T10:00', endsAt: '2026-07-20T10:00',
    };
    modal.saveEvent();
    component.openEventsDialog();
    tick(500);
    expect(component.eventNotice()).toBe('');
    TestBed.inject(MatDialog).closeAll();
    tick(500);
    fixture.destroy();
  }));

  it('keeps the character dialog open when requested and allows adding another goal', fakeAsync(() => {
    const fixture = TestBed.createComponent(PlannerComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    clickText(fixture.nativeElement, 'Add character');
    flushMicrotasks();
    fixture.detectChanges();
    checkKeepOpen();
    overlay.querySelector<HTMLButtonElement>('.catalog-entry')?.click();
    flushMicrotasks();
    fixture.detectChanges();
    clickText(overlay, 'Add goal');
    flushMicrotasks();
    fixture.detectChanges();
    expect(overlay.querySelector('[role="dialog"]')).toBeTruthy();
    expect(component.store.goals().length).toBe(1);
    expect(characterModal().selectedEntity()).toBeNull();
    expect(overlay.textContent).toContain('Goal added.');
    overlay.querySelector<HTMLButtonElement>('.catalog-entry')?.click();
    flushMicrotasks();
    fixture.detectChanges();
    clickText(overlay, 'Add goal');
    flushMicrotasks();
    fixture.detectChanges();
    expect(component.store.goals().length).toBe(2);
    expect(overlay.querySelector('[role="dialog"]')).toBeTruthy();
    clickText(overlay, 'Cancel');
    tick(500);
    fixture.detectChanges();
    clickText(fixture.nativeElement, 'Edit build');
    flushMicrotasks();
    fixture.detectChanges();
    expect(overlay.querySelector<HTMLInputElement>('mat-checkbox input')?.checked).toBeFalse();
    checkKeepOpen();
    characterModal().setDraftRange('promotion', 'target', 1, 2);
    clickText(overlay, 'Save build');
    flushMicrotasks();
    fixture.detectChanges();
    expect(component.store.goals().length).toBe(2);
    expect(component.store.goals()[0].ranges['promotion'].target).toBe(1);
    expect(overlay.querySelector('[role="dialog"]')).toBeTruthy();
    expect(overlay.textContent).toContain('Build saved.');
    TestBed.inject(MatDialog).closeAll();
    tick(500);
    fixture.destroy();
  }));

  it('preserves existing event instants and converts them to UTC when editing', fakeAsync(() => {
    const fixture = TestBed.createComponent(PlannerComponent);
    const component = fixture.componentInstance;
    component.store.saveEvent({
      id: 'existing', game: 'zzz', name: 'Existing', description: '',
      startsAt: '2026-07-19T12:15:01.250+02:00', endsAt: '2026-07-19T13:15:01.250+02:00',
      source: 'manual',
    });
    fixture.detectChanges();
    clickText(fixture.nativeElement.querySelector('.event-card'), 'Edit');
    flushMicrotasks();
    fixture.detectChanges();
    expect(eventsModal().eventDraft.startsAt).toBe('2026-07-19T10:15:01.250');
    expect(eventsModal().eventDraft.endsAt).toBe('2026-07-19T11:15:01.250');
    expect(overlay.textContent).toContain('UTC');
    eventsModal().saveEvent();
    expect(component.store.events()[0].startsAt).toBe('2026-07-19T10:15:01.250Z');
    expect(component.store.events()[0].endsAt).toBe('2026-07-19T11:15:01.250Z');
    TestBed.inject(MatDialog).closeAll();
    tick(500);
    fixture.destroy();
  }));

  it('limits game controls and goal groups to the chosen game', () => {
    const fixture = TestBed.createComponent(PlannerComponent);
    const component = fixture.componentInstance;
    component.filter.set('wuwa');
    fixture.detectChanges();
    expect(component.goalsByGame().map((group) => group.game.id)).toEqual(['wuwa']);
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.planner-actions button'))
      .map((button) => (button as HTMLButtonElement).textContent?.trim());
    expect(buttons).toEqual(['Add character', 'Manage events']);
    fixture.destroy();
  });

  it('updates current stamina through the panel and shows one estimate to full capacity', () => {
    const fixture = TestBed.createComponent(PlannerComponent);
    const component = fixture.componentInstance;
    component.filter.set('zzz');
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('.stamina-item input') as NodeListOf<HTMLInputElement>;
    expect(inputs.length).toBe(1);
    inputs[0].value = '12';
    inputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.store.stamina().zzz?.current).toBe(12);
    expect(fixture.nativeElement.querySelector('.stamina-item').textContent).toContain('Battery Charge full capacity in');
    expect(fixture.nativeElement.querySelector('.stamina-item').textContent).not.toContain('Need');
    component.filter.set('endfield');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.stamina-item').textContent).toContain('of 125');
    expect(fixture.nativeElement.querySelector('.stamina-item input')).toBeTruthy();
    fixture.destroy();
  });

  it('shows remaining time until Endfield Sanity regenerates', () => {
    const fixture = TestBed.createComponent(PlannerComponent);
    const component = fixture.componentInstance;
    component.store.setStamina('endfield', 0);
    const snapshot = component.store.stamina().endfield!;
    component.now.set(new Date(Date.parse(snapshot.updatedAt) + 360000));
    expect(component.timeToReady('endfield')).toBe('14h 54m');
    component.store.setStamina('endfield', 125);
    component.now.set(new Date(component.store.stamina().endfield!.updatedAt));
    expect(component.timeToReady('endfield')).toBe('now');
    fixture.destroy();
  });

  it('edits stamina settings for all games, preserves cancelled drafts, and applies Endfield overrides', fakeAsync(() => {
    const fixture = TestBed.createComponent(PlannerComponent);
    const component = fixture.componentInstance;
    component.filter.set('endfield');
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Stamina settings"]');
    expect(button).toBeTruthy();
    button.click();
    flushMicrotasks();
    fixture.detectChanges();
    expectDialogActions(['Cancel', 'Save settings']);
    expect(overlay.querySelectorAll('input').length).toBe(6);
    expect(overlay.querySelector<HTMLInputElement>('[aria-label="Zenless Zone Zero maximum Battery Charge"]')?.value).toBe('240');
    expect(overlay.querySelector<HTMLInputElement>('[aria-label="Wuthering Waves maximum Waveplate"]')?.value).toBe('240');
    expect(overlay.querySelector<HTMLInputElement>('[aria-label="Arknights: Endfield maximum Sanity"]')?.value).toBe('125');
    expect(overlay.querySelector<HTMLInputElement>('[aria-label="Zenless Zone Zero account level"]')?.value).toBe('1');
    expect(overlay.querySelector<HTMLInputElement>('[aria-label="Wuthering Waves account level"]')?.value).toBe('1');
    expect(staminaModal().defaultMax('endfield')).toBe(125);
    staminaModal().draft.endfield.level = 60;
    clickText(overlay, 'Cancel');
    tick(500);
    expect(component.staminaMax('endfield')).toBe(125);

    button.click();
    flushMicrotasks();
    fixture.detectChanges();
    const level = overlay.querySelector<HTMLInputElement>('[aria-label="Arknights: Endfield Authority Level"]');
    if (!level) throw new Error('Authority Level input not found');
    level.value = '60';
    level.dispatchEvent(new Event('input'));
    flushMicrotasks();
    tick();
    fixture.detectChanges();
    expect(staminaModal().defaultMax('endfield')).toBe(360);
    expect(overlay.querySelector<HTMLInputElement>('[aria-label="Arknights: Endfield maximum Sanity"]')?.value).toBe('360');
    staminaModal().draft.zzz = { level: 32, max: 300 };
    clickText(overlay, 'Save settings');
    tick(500);
    fixture.detectChanges();
    expect(component.staminaMax('endfield')).toBe(360);
    expect(component.staminaMax('zzz')).toBe(300);
    expect(component.store.staminaConfig().zzz?.level).toBe(32);
    expect(fixture.nativeElement.querySelector('.stamina-item').textContent).toContain('of 360');
    expect(fixture.nativeElement.querySelector('.stamina-item').textContent).toContain('Sanity full capacity in');
    expect(component.timeToReady('endfield')).toBe('1d 19h 12m');
    expect(component.timeToReady('zzz')).toBe('1d 6h');
    expect(component.timeToReady('wuwa')).toBe('1d');

    button.click();
    flushMicrotasks();
    fixture.detectChanges();
    staminaModal().draft.endfield.max = 400;
    clickText(overlay, 'Save settings');
    tick(500);
    expect(component.staminaMax('endfield')).toBe(400);
    expect(component.timeToReady('endfield')).toBe('2d');

    button.click();
    flushMicrotasks();
    fixture.detectChanges();
    staminaModal().draft.endfield.level = 61;
    staminaModal().save();
    expect(staminaModal().error()).toContain('1 to 60');
    expect(component.staminaMax('endfield')).toBe(400);
    staminaModal().draft.endfield.level = 50;
    staminaModal().draft.endfield.max = null;
    staminaModal().save();
    tick(500);
    expect(component.staminaMax('endfield')).toBe(340);
    expect(component.timeToReady('endfield')).toBe('1d 16h 48m');
    fixture.destroy();
  }));

  it('groups shared material requirements by character and updates them with goals and inventory', () => {
    const fixture = TestBed.createComponent(PlannerComponent);
    const component = fixture.componentInstance;
    const other: PlannerEntity = {
      ...entity, id: 'zzz:2', name: 'Other character',
      paths: [{ id: 'promotion', label: 'Promotion', steps: [{ label: 'First', cost: { 'zzz:1': 4 } }] }],
    };
    const wuwa: PlannerEntity = {
      ...other, id: 'wuwa:2', game: 'wuwa', name: 'WuWa character',
      paths: [{ id: 'promotion', label: 'Promotion', steps: [{ label: 'First', cost: { 'wuwa:1': 7 } }] }],
    };
    component.catalog.entities.set(new Map([[entity.id, entity], [other.id, other], [wuwa.id, wuwa]]));
    component.store.addGoal(entity, { promotion: { current: 0, target: 1 } });
    component.store.addGoal(entity, { promotion: { current: 1, target: 2 } });
    component.store.addGoal(other);
    component.store.addGoal(wuwa);
    component.store.addGoal(other, { promotion: { current: 1, target: 0 } });
    component.store.addGoal({ ...other, id: 'zzz:missing' });
    fixture.detectChanges();

    let rows = component.totalsByGame()[0].rows;
    expect(rows.length).toBe(1);
    expect(rows[0].required).toBe(9);
    expect(rows[0].characters).toEqual([
      { id: entity.id, name: entity.name, required: 5 },
      { id: other.id, name: other.name, required: 4 },
    ]);
    const card: HTMLElement = fixture.nativeElement.querySelector('.material-card');
    expect(card.textContent).toContain('Test character');
    expect(card.textContent).toContain('Other character');
    const icon = card.querySelector<HTMLImageElement>('img');
    expect(icon?.src).toBe('https://static.nanoka.cc/assets/zzz/IconCoin.webp');
    icon?.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(card.querySelector('img')).toBeNull();
    expect(card.textContent).toContain('No icon');
    expect(card.textContent).toContain('Material');
    const input = card.querySelector<HTMLInputElement>('input');
    expect(input?.getAttribute('aria-label')).toBe('Owned Material');
    if (!input) throw new Error('Inventory input not found');
    input.value = '6';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.store.inventory()['zzz:1']).toBe(6);
    expect(component.totalsByGame()[0].rows[0].missing).toBe(3);

    component.store.removeGoal(component.store.goals()[1].id);
    rows = component.totalsByGame()[0].rows;
    expect(rows[0].required).toBe(6);
    expect(rows[0].missing).toBe(0);
    expect(rows[0].characters[0].required).toBe(2);
    component.filter.set('wuwa');
    fixture.detectChanges();
    expect(component.totalsByGame().map((group) => group.game.id)).toEqual(['wuwa']);
    expect(fixture.nativeElement.querySelector('.material-card').textContent).toContain('WuWa character');
    expect(fixture.nativeElement.querySelector('.material-card').textContent).not.toContain('Test character');
    expect(fixture.nativeElement.querySelector('.material-card').textContent).toContain('No icon');
    component.filter.set('zzz');
    fixture.detectChanges();
    clickText(fixture.nativeElement.querySelector('.goal-card'), 'Remove');
    fixture.detectChanges();
    expect(component.totalsByGame()[0].rows[0].required).toBe(4);
    fixture.destroy();
  });

  it('shows a countdown for upcoming and active events and marks ended events', () => {
    const fixture = TestBed.createComponent(PlannerComponent);
    const component = fixture.componentInstance;
    const event = {
      id: 'event-1', game: 'zzz' as const, name: 'Event', description: '',
      startsAt: '2026-11-19T11:00:00.000Z', endsAt: '2026-11-19T12:00:00.000Z', source: 'manual' as const,
    };
    component.now.set(new Date('2026-11-19T10:00:00.000Z'));
    expect(component.eventCountdown(event)).toBe('Starts in 1h');
    component.now.set(new Date('2026-11-19T11:30:00.000Z'));
    expect(component.eventCountdown(event)).toBe('Ends in 30m');
    component.now.set(new Date('2026-11-19T12:00:00.000Z'));
    expect(component.eventCountdown(event)).toBe('Ended');
    fixture.destroy();
  });
});
