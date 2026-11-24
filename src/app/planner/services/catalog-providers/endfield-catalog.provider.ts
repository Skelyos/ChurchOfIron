import { Injectable } from '@angular/core';
import { CatalogEntry } from '../../data/catalog-common';
import {
  parseEndfieldDetail, parseEndfieldIndex, parseEndfieldJson, parseEndfieldLevelPath, parseEndfieldMaterials,
} from '../../data/endfield-catalog';
import { PlannerEntity, UpgradePath } from '../../models/planner.model';
import { CatalogProvider, CatalogSnapshot } from './catalog-provider';

const ENDFIELD_BASE = 'https://endfield-assets.fffdan.com';

@Injectable({ providedIn: 'root' })
export class EndfieldCatalogProvider implements CatalogProvider {
  readonly game = 'endfield' as const;
  private loadedVersion: string | null = null;
  private levelPath: UpgradePath | null = null;
  private characterTranslations: unknown | null = null;

  async loadCatalog(): Promise<CatalogSnapshot> {
    const version = await this.version();
    const [index, names, items, itemNames, levels] = await Promise.all([
      this.json('/table/CharGrowthTable/all'),
      this.json('/i18n/dict/EN/table/CharGrowthTable/all'),
      this.json('/table/ItemTable/all'),
      this.json('/i18n/dict/EN/table/ItemTable/all'),
      this.json('/table/CharLevelUpTable/all'),
    ]);
    if (version !== await this.version()) throw new Error('Endfield source changed during loading; retry');
    const entries = parseEndfieldIndex(index, names);
    const materials = parseEndfieldMaterials(items, itemNames);
    const levelPath = parseEndfieldLevelPath(levels);
    if (!entries.length || !materials.size) throw new Error('Empty catalog');
    this.loadedVersion = version;
    this.levelPath = levelPath;
    this.characterTranslations = names;
    return {
      entries,
      materials,
      status: `Loaded Endfield Assets ${version}; release status unverified`,
      replaceGameMaterials: true,
    };
  }

  async loadEntity(entry: CatalogEntry): Promise<PlannerEntity> {
    const id = entry.id.startsWith('endfield:') ? entry.id.slice('endfield:'.length) : '';
    if (!/^chr_\d{4}_[a-z0-9]+$/.test(id)) throw new Error('Invalid character ID');
    const before = await this.version();
    const data = await this.json(`/table/CharGrowthTable/${id}`);
    const after = await this.version();
    if (before !== after || after !== this.loadedVersion) {
      throw new Error('Endfield source changed; reload the catalog');
    }
    if (!this.levelPath) throw new Error('Endfield level data is unavailable; reload the catalog');
    if (!this.characterTranslations) {
      throw new Error('Endfield character translations are unavailable; reload the catalog');
    }
    return parseEndfieldDetail(entry, data, this.levelPath, this.characterTranslations);
  }

  private async json(path: string): Promise<unknown> {
    const response = await fetch(`${ENDFIELD_BASE}${path}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseEndfieldJson(await response.text());
  }

  private async version(): Promise<string> {
    const response = await fetch(`${ENDFIELD_BASE}/version`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const version = (await response.text()).trim();
    if (!version) throw new Error('Missing Endfield source version');
    return version;
  }
}
