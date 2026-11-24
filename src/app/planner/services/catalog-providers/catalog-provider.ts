import { CatalogEntry } from '../../data/catalog-common';
import { GameId, Material, PlannerEntity } from '../../models/planner.model';

export interface CatalogSnapshot {
  entries: CatalogEntry[];
  materials: Map<string, Material>;
  status: string;
  replaceGameMaterials?: boolean;
}

export interface CatalogProvider {
  readonly game: GameId;
  loadCatalog(): Promise<CatalogSnapshot>;
  loadEntity(entry: CatalogEntry): Promise<PlannerEntity>;
}
