import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { PlannerEvent } from '../models/planner.model';
import { EMPTY_STATE, isPlannerEvent, PlannerStorage } from './planner-storage';
import { PlannerStore } from './planner-store';

const event: PlannerEvent = {
  id: 'event-1',
  game: 'wuwa',
  name: 'Test event',
  description: 'Test',
  startsAt: '2026-11-19T10:00:00.000Z',
  endsAt: '2026-11-20T10:00:00.000Z',
  source: 'manual',
};

describe('planner persistence and events', () => {
  let storage: PlannerStorage;

  beforeEach(() => {
    storage = new PlannerStorage();
  });

  it('preserves legacy goals and inventory while adding an empty event list', () => {
    const old = {
      goals: [{ id: 'g', entityId: 'zzz:ellen', game: 'zzz' as const, ranges: { skills: { current: 1, target: 4 } } }],
      inventory: { 'zzz:basic-chip': 7 },
      stamina: {},
    };
    expect(storage.parse(JSON.stringify(old))).toEqual({ ...old, staminaConfig: {}, events: [] });
  });

  it('round-trips stamina settings and rejects invalid caps and levels', () => {
    const state = {
      ...structuredClone(EMPTY_STATE),
      staminaConfig: { endfield: { level: 60, max: null }, zzz: { level: 30, max: 300 } },
    };
    expect(storage.parse(JSON.stringify(state))).toEqual(state);
    for (const config of [{ level: 61, max: null }, { level: 1, max: 0 }, { level: 1.5, max: 125 }]) {
      expect(() => storage.parse(JSON.stringify({ ...state, staminaConfig: { endfield: config } }))).toThrow();
    }
  });

  it('does not retroactively regenerate above an old cap when settings change', fakeAsync(() => {
    const saved = {
      ...structuredClone(EMPTY_STATE),
      stamina: { zzz: { current: 230, updatedAt: new Date(Date.now() - 3 * 3600000).toISOString() } },
    };
    TestBed.configureTestingModule({
      providers: [{ provide: PlannerStorage, useValue: { load: () => saved, save: () => {} } }],
    });
    const store = TestBed.inject(PlannerStore);
    store.setStaminaConfig({ zzz: { level: null, max: 300 } });
    expect(store.stamina().zzz?.current).toBe(240);
    tick(6 * 60000);
    store.setStaminaConfig({ zzz: { level: null, max: 100 } });
    expect(store.stamina().zzz?.current).toBe(100);
    tick(120 * 60000);
    store.setStaminaConfig({ zzz: { level: null, max: 300 } });
    expect(store.stamina().zzz?.current).toBe(100);
  }));

  it('round-trips manual events and rejects malformed events', () => {
    const state = { ...structuredClone(EMPTY_STATE), events: [event] };
    expect(storage.parse(JSON.stringify(state))).toEqual(state);
    expect(isPlannerEvent({ ...event, endsAt: event.startsAt })).toBeFalse();
    expect(() => storage.parse(JSON.stringify({ ...state, events: [{ ...event, startsAt: 'invalid' }] }))).toThrow();
  });

  it('creates, edits, deletes, and exports events without affecting saved legacy data', () => {
    const saved = {
      ...structuredClone(EMPTY_STATE),
      goals: [{ id: 'g', entityId: 'zzz:ellen', game: 'zzz' as const, ranges: {} }],
      inventory: { 'zzz:basic-chip': 3 },
    };
    TestBed.configureTestingModule({
      providers: [{ provide: PlannerStorage, useValue: { load: () => saved, save: () => {}, parse: storage.parse } }],
    });
    const store = TestBed.inject(PlannerStore);
    store.saveEvent(event);
    store.saveEvent({ ...event, name: 'Updated' });
    expect(store.events().length).toBe(1);
    expect(store.events()[0].name).toBe('Updated');
    expect(JSON.parse(store.exportJson()).inventory).toEqual(saved.inventory);
    expect(store.goals()).toEqual(saved.goals);
    store.removeEvent(event.id);
    expect(store.events()).toEqual([]);
  });
});
