import { Injectable } from '@angular/core';
import { CatalogEntry } from '../../data/catalog-common';
import { parseWuwaDetail, parseWuwaIndex, parseWuwaMaterials } from '../../data/wuwa-catalog';
import { PlannerEntity } from '../../models/planner.model';
import { CatalogProvider, CatalogSnapshot } from './catalog-provider';

const WUWA_BASE = 'https://api-v2.encore.moe/api/en';

@Injectable({ providedIn: 'root' })
export class WuwaCatalogProvider implements CatalogProvider {
  readonly game = 'wuwa' as const;

  async loadCatalog(): Promise<CatalogSnapshot> {
    const [index, items] = await Promise.all([
      this.json(`${WUWA_BASE}/character`),
      this.json(`${WUWA_BASE}/item`),
    ]);
    const entries = parseWuwaIndex(index);
    const materials = parseWuwaMaterials(items);
    if (!entries.length || !materials.size) throw new Error('Empty catalog');
    return { entries, materials, status: 'Loaded live Encore.moe data', replaceGameMaterials: true };
  }

  async loadEntity(entry: CatalogEntry): Promise<PlannerEntity> {
    const id = entry.id.startsWith('wuwa:') ? entry.id.slice('wuwa:'.length) : '';
    if (!/^\d+$/.test(id)) throw new Error('Invalid character ID');
    const data = await this.json(`${WUWA_BASE}/character/${id}`);
    return parseWuwaDetail(entry, data);
  }

  private async json(url: string): Promise<unknown> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
}
