import { createItemNameMap } from '@/utils/item-name-map';
import { RealmItemMap } from './items';
// import assets like this for debugging / finding item ids by names (e.g for mapping consumable names to ids)
// import * as items from '@assets/items.json';

// util functions for debugging
export function itemNamesToIds(items: RealmItemMap, names: string[]): number[] {
  return names.map((name) => itemNameToId(items, name));
}

function itemNameToId(items: RealmItemMap, name: string): number {
  return createItemNameMap(items).get(name) || -1;
}
