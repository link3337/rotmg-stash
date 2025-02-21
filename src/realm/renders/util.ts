import { itemNameMap } from './items';

// util functions for debugging
export function itemNamesToIds(names: string[]): number[] {
  return names.map(itemNameToId);
}

function itemNameToId(name: string): number {
  return itemNameMap.get(name) || -1;
}
