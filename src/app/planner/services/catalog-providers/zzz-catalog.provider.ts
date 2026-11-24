import { Injectable } from '@angular/core';
import { CatalogEntry } from '../../data/catalog-common';
import { parseZzzDetail, parseZzzIndex, parseZzzMaterials } from '../../data/zzz-catalog';
import { PlannerEntity } from '../../models/planner.model';
import { CatalogProvider, CatalogSnapshot } from './catalog-provider';

const ZZZ_VERSION = '3.4.4+20539349';
const ZZZ_BASE = `https://static.nanoka.cc/zzz/${ZZZ_VERSION}`;

@Injectable({ providedIn: 'root' })
export class ZzzCatalogProvider implements CatalogProvider {
  readonly game = 'zzz' as const;

  async loadCatalog(): Promise<CatalogSnapshot> {
    const [index, items] = await Promise.all([
      this.json(`${ZZZ_BASE}/character.json`),
      this.json(`${ZZZ_BASE}/en/item.json`),
    ]);
    const entries = parseZzzIndex(index);
    const materials = parseZzzMaterials(items);
    if (!entries.length || !materials.size) throw new Error('Empty catalog');
    return { entries, materials, status: `Loaded beta dataset ${ZZZ_VERSION}`, replaceGameMaterials: true };
  }

  async loadEntity(entry: CatalogEntry): Promise<PlannerEntity> {
    const id = entry.id.startsWith('zzz:') ? entry.id.slice('zzz:'.length) : '';
    if (!/^\d+$/.test(id)) throw new Error('Invalid character ID');
    const data = await this.json(`${ZZZ_BASE}/en/character/${id}.json`);
    return parseZzzDetail(entry, data);
  }

  private async json(url: string): Promise<unknown> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
}
