import { inject, Injectable, signal } from '@angular/core';
import { CatalogEntry } from '../data/catalog-common';
import { GameId, Material, PlannerEntity } from '../models/planner.model';
import { experienceGroup, EXPERIENCE_GROUPS } from '../data/character-experience';
import { CatalogProvider } from './catalog-providers/catalog-provider';
import { EndfieldCatalogProvider } from './catalog-providers/endfield-catalog.provider';
import { WuwaCatalogProvider } from './catalog-providers/wuwa-catalog.provider';
import { ZzzCatalogProvider } from './catalog-providers/zzz-catalog.provider';

type SupportedGame = GameId;

@Injectable({ providedIn: 'root' })
export class CatalogService {
  readonly entries = signal<CatalogEntry[]>([]);
  readonly entities = signal(new Map<string, PlannerEntity>());
  readonly materials = signal(new Map<string, Material>());
  readonly status = signal<Record<SupportedGame, string>>({ zzz: 'Not loaded', wuwa: 'Not loaded', endfield: 'Not loaded' });
  private readonly pending = new Map<string, Promise<PlannerEntity>>();
  private readonly providers: Record<SupportedGame, CatalogProvider> = {
    zzz: inject(ZzzCatalogProvider),
    wuwa: inject(WuwaCatalogProvider),
    endfield: inject(EndfieldCatalogProvider),
  };

  async load(game: SupportedGame): Promise<void> {
    this.status.update((s) => ({ ...s, [game]: 'Loading...' }));
    try {
      const snapshot = await this.providers[game].loadCatalog();
      this.entries.update((existing) => [...existing.filter((entry) => entry.game !== game), ...snapshot.entries]);
      this.materials.update((existing) => snapshot.replaceGameMaterials
        ? new Map([...existing].filter(([, material]) => material.game !== game).concat([...snapshot.materials]))
        : new Map([...existing, ...snapshot.materials]));
      this.entities.update((existing) => new Map([...existing].filter(([, entity]) => entity.game !== game)));
      this.status.update((s) => ({ ...s, [game]: snapshot.status }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stale = this.entries().some((entry) => entry.game === game) ? '; previously loaded data may be stale' : '';
      this.status.update((s) => ({ ...s, [game]: `Unable to load: ${message}${stale}` }));
    }
  }

  async loadEntity(entry: CatalogEntry): Promise<PlannerEntity> {
    const existing = this.entities().get(entry.id);
    if (existing) return existing;
    const pending = this.pending.get(entry.id);
    if (pending) return pending;
    const task = this.fetchEntity(entry);
    this.pending.set(entry.id, task);
    try {
      return await task;
    } finally {
      this.pending.delete(entry.id);
    }
  }

  private async fetchEntity(entry: CatalogEntry): Promise<PlannerEntity> {
    return this.saveEntity(await this.providers[entry.game].loadEntity(entry));
  }

  private saveEntity(entity: PlannerEntity): PlannerEntity {
    for (const path of entity.paths) {
      for (const step of path.steps) {
        for (const id of Object.keys(step.cost)) {
          if (experienceGroup(id)?.game !== entity.game && !this.materials().has(id)) throw new Error(`Missing material ${id}`);
        }
      }
    }
    for (const group of EXPERIENCE_GROUPS.filter((item) => item.game === entity.game)) {
      for (const item of group.items) {
        if (!this.materials().has(item.id)) throw new Error(`Missing material ${item.id}`);
      }
    }
    this.entities.update((existing) => new Map(existing).set(entity.id, entity));
    return entity;
  }
}
