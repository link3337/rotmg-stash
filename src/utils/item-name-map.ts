import { TotalsUIModel } from '@/cache/totals-model';
import { RealmItem, RealmItemMap } from '@/realm/renders/items';

/**
 * Creates a map of item names to their IDs, specifically for items in the totals list.
 * This function handles duplicate names by considering the shiny status of items.
 * @param items - all items
 * @param totals - The list of items that are in the totals
 * @returns A map where the keys are item names / technical names for shiny items and the values are item IDs
 */
export function createTotalMap(items: RealmItemMap, totals: TotalsUIModel[]): Map<string, number> {
  const nameMap = new Map<string, number>();

  // Create a set of item IDs that are in the totals for faster lookup
  const totalItemIds = new Set(totals.map((item) => item.itemId));

  // Only add items to the map if they exist in the totals
  Object.entries(items).forEach(([key, value]) => {
    const itemId = parseInt(key);
    if (totalItemIds.has(itemId)) {
      // Use technicalName for shiny items, regular name for non-shiny
      const searchName = value.isShiny ? value.technicalName : value.name;
      nameMap.set(searchName.toLowerCase(), itemId);
    }
  });

  return nameMap;
}

export function createItemNameMap(items: RealmItemMap): Map<string, number> {
  return new Map(
    Object.entries(items).map(([key, value]) => [
      value.isShiny ? value.technicalName : value.name,
      parseInt(key)
    ])
  );
}

export function createItemNameMapFull(items: RealmItemMap): Map<string, RealmItem> {
  return new Map(
    Object.entries(items).map(([_key, value]) => [
      value.isShiny ? value.technicalName : value.name,
      value
    ])
  );
}
