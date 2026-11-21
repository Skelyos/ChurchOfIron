import { Injectable, signal } from '@angular/core';
import { CatalogEntry, parseWuwaDetail, parseWuwaIndex, parseWuwaMaterials, parseZzzDetail, parseZzzIndex, parseZzzMaterials } from '../data/api-catalog';
import { parseEndfieldDetail, parseEndfieldIndex, parseEndfieldJson, parseEndfieldLevelPath, parseEndfieldMaterials } from '../data/endfield-catalog';
import { Material, PlannerEntity, UpgradePath } from '../models/planner.model';
import { experienceGroup, EXPERIENCE_GROUPS } from '../data/character-experience';

const ZZZ_VERSION = '3.4.4+20539349';
const ZZZ_BASE = `https://static.nanoka.cc/zzz/${ZZZ_VERSION}`;
const WUWA_BASE = 'https://api-v2.encore.moe/api/en';
const ENDFIELD_BASE = 'https://endfield-assets.fffdan.com';
type SupportedGame = 'zzz' | 'wuwa' | 'endfield';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  readonly entries = signal<CatalogEntry[]>([]);
  readonly entities = signal(new Map<string, PlannerEntity>());
  readonly materials = signal(new Map<string, Material>());
  readonly status = signal<Record<SupportedGame, string>>({ zzz: 'Not loaded', wuwa: 'Not loaded', endfield: 'Not loaded' });
  private readonly pending = new Map<string, Promise<PlannerEntity>>();
  private endfieldLoadedVersion: string | null = null;
  private endfieldLevels: UpgradePath | null = null;

  private async json(url: string): Promise<unknown> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  private async endfieldJson(path: string): Promise<unknown> {
    const response = await fetch(`${ENDFIELD_BASE}${path}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseEndfieldJson(await response.text());
  }

  private async endfieldVersion(): Promise<string> {
    const response = await fetch(`${ENDFIELD_BASE}/version`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const version = (await response.text()).trim();
    if (!version) throw new Error('Missing Endfield source version');
    return version;
  }

  async load(game: SupportedGame): Promise<void> {
    this.status.update((s) => ({ ...s, [game]: 'Loading...' }));
    try {
      if (game === 'endfield') {
        const version = await this.endfieldVersion();
        const [index, names, items, itemNames, levels] = await Promise.all([
          this.endfieldJson('/table/CharGrowthTable/all'),
          this.endfieldJson('/i18n/dict/EN/table/CharGrowthTable/all'),
          this.endfieldJson('/table/ItemTable/all'),
          this.endfieldJson('/i18n/dict/EN/table/ItemTable/all'),
          this.endfieldJson('/table/CharLevelUpTable/all'),
        ]);
        if (version !== await this.endfieldVersion()) throw new Error('Endfield source changed during loading; retry');
        const entries = parseEndfieldIndex(index, names);
        const materials = parseEndfieldMaterials(items, itemNames);
        const levelPath = parseEndfieldLevelPath(levels);
        if (!entries.length || !materials.size) throw new Error('Empty catalog');
        this.entries.update((existing) => [...existing.filter((entry) => entry.game !== game), ...entries]);
        this.materials.update((existing) => new Map([...existing].filter(([, material]) => material.game !== game).concat([...materials])));
        this.entities.update((existing) => new Map([...existing].filter(([, entity]) => entity.game !== game)));
        this.endfieldLoadedVersion = version;
        this.endfieldLevels = levelPath;
        this.status.update((s) => ({ ...s, endfield: `Loaded Endfield Assets ${version}; release status unverified` }));
        return;
      }
      const base = game === 'zzz' ? ZZZ_BASE : WUWA_BASE;
      const [index, items] = await Promise.all([
        this.json(`${base}/character${game === 'zzz' ? '.json' : ''}`),
        this.json(`${base}/${game === 'zzz' ? 'en/item.json' : 'item'}`),
      ]);
      const entries = game === 'zzz' ? parseZzzIndex(index) : parseWuwaIndex(index);
      const materials = game === 'zzz' ? parseZzzMaterials(items) : parseWuwaMaterials(items);
      if (!entries.length || !materials.size) throw new Error('Empty catalog');
      this.entries.update((existing) => [...existing.filter((entry) => entry.game !== game), ...entries]);
      this.materials.update((existing) => new Map([...existing, ...materials]));
      this.entities.update((existing) => new Map([...existing].filter(([, entity]) => entity.game !== game)));
      this.status.update((s) => ({
        ...s, [game]: game === 'zzz' ? `Loaded beta dataset ${ZZZ_VERSION}` : 'Loaded live Encore.moe data',
      }));
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
    const prefix = `${entry.game}:`;
    const id = entry.id.startsWith(prefix) ? entry.id.slice(prefix.length) : '';
    if (!(entry.game === 'endfield' ? /^chr_\d{4}_[a-z0-9]+$/ : /^\d+$/).test(id)) {
      throw new Error('Invalid character ID');
    }
    if (entry.game === 'endfield') {
      const before = await this.endfieldVersion();
      const data = await this.endfieldJson(`/table/CharGrowthTable/${id}`);
      const after = await this.endfieldVersion();
      if (before !== after || after !== this.endfieldLoadedVersion) {
        throw new Error('Endfield source changed; reload the catalog');
      }
      if (!this.endfieldLevels) throw new Error('Endfield level data is unavailable; reload the catalog');
      return this.saveEntity(parseEndfieldDetail(entry, data, this.endfieldLevels));
    }
    const url = entry.game === 'zzz'
      ? `${ZZZ_BASE}/en/character/${id}.json`
      : `${WUWA_BASE}/character/${id}`;
    const data = await this.json(url);
    const entity = entry.game === 'zzz' ? parseZzzDetail(entry, data) : parseWuwaDetail(entry, data);
    return this.saveEntity(entity);
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
