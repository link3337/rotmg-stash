import { createItemNameMap } from '@/utils/item-name-map';
import { RealmItemMap } from './item';
// import assets like this for debugging / finding item ids by names (e.g for mapping consumable names to ids)
// import * as constants from '@assets/constants.json';
// use constants.items for the item map, but this is not used in production since we fetch constants from the api

// util functions for debugging
export function itemNamesToIds(items: RealmItemMap, names: string[]): number[] {
  return names.flatMap((name) => itemNameToId(items, name));
}

function itemNameToId(items: RealmItemMap, name: string): number[] {
  const matchingIds = createItemNameMap(items).get(name.trim().toLowerCase());
  return matchingIds ?? [];
}
