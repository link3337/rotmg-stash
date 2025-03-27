import * as items from '@assets/items.json';
import { RealmItem } from '../realm/renders/items';

// util functions for debugging
export function itemNamesToIds(names: string[]): number[] {
  return names.map(itemNameToId);
}

function itemNameToId(name: string): number {
  return itemNameMap.get(name) || -1;
}

const itemNameMap: Map<string, number> = new Map(
  Object.entries(items).map(([key, value]) => [
    value.isShiny ? value.technicalName : value.name,
    parseInt(key)
  ])
);

const itemNameMapFull: Map<string, RealmItem> = new Map(
  Object.entries(items).map(([_key, value]) => [
    value.isShiny ? value.technicalName : value.name,
    value
  ])
);
