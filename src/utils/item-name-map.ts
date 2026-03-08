import { TotalsUIModel } from '@/cache/totals-model';
import { RealmItem, RealmItemMap } from '@/realm/renders/item';

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function addIdToMap(nameMap: Map<string, number[]>, key: string, itemId: number): void {
  const normalizedKey = normalizeName(key);
  const existingIds = nameMap.get(normalizedKey);

  if (existingIds) {
    if (!existingIds.includes(itemId)) {
      existingIds.push(itemId);
    }
    return;
  }

  nameMap.set(normalizedKey, [itemId]);
}

function addItemToMap(nameMap: Map<string, RealmItem[]>, key: string, item: RealmItem): void {
  const normalizedKey = normalizeName(key);
  const existingItems = nameMap.get(normalizedKey);

  if (existingItems) {
    if (!existingItems.includes(item)) {
      existingItems.push(item);
    }
    return;
  }

  nameMap.set(normalizedKey, [item]);
}

/**
 * Creates a map of item names to their IDs, specifically for items in the totals list.
 * This function handles duplicate names by considering the shiny status of items.
 * @param items - all items
 * @param totals - The list of items that are in the totals
 * @returns A map where the keys are item names and technical names and the values are item ID arrays
 */
export function createTotalMap(
  items: RealmItemMap,
  totals: TotalsUIModel[]
): Map<string, number[]> {
  const nameMap = new Map<string, number[]>();

  // Create a set of item IDs that are in the totals for faster lookup
  const totalItemIds = new Set(totals.map((item) => item.itemId));

  // Only add items to the map if they exist in the totals
  Object.entries(items).forEach(([key, value]) => {
    const itemId = parseInt(key);
    if (totalItemIds.has(itemId)) {
      addIdToMap(nameMap, value.name, itemId);
      addIdToMap(nameMap, value.technicalName, itemId);
    }
  });

  return nameMap;
}

export function createItemNameMap(items: RealmItemMap): Map<string, number[]> {
  const nameMap = new Map<string, number[]>();

  Object.entries(items).forEach(([key, value]) => {
    const itemId = parseInt(key);
    addIdToMap(nameMap, value.name, itemId);
    addIdToMap(nameMap, value.technicalName, itemId);
  });

  return nameMap;
}

export function createItemNameMapFull(items: RealmItemMap): Map<string, RealmItem[]> {
  const nameMap = new Map<string, RealmItem[]>();

  Object.values(items).forEach((item) => {
    addItemToMap(nameMap, item.name, item);
    addItemToMap(nameMap, item.technicalName, item);
  });

  return nameMap;
}
