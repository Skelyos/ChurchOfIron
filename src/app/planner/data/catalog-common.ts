export type CatalogGame = 'zzz' | 'wuwa' | 'endfield';

export interface CatalogEntry {
  id: string;
  name: string;
  game: CatalogGame;
  attributes: string[];
  beta: boolean;
}

type JsonObject = Record<string, unknown>;

export function object(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid API object');
  return value as JsonObject;
}

export function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('Invalid API array');
  return value;
}

export function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Missing API name');
  return value;
}

export function numericId(value: unknown): string {
  const id = String(value);
  if (!/^\d+$/.test(id)) throw new Error('Invalid API identifier');
  return id;
}
