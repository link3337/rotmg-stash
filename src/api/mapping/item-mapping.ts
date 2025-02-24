import { ItemUIModel } from '@api/models/char-ui-model';

/**
 * Maps an array of item IDs to a compact vault UI model.
 *
 * This function takes an array of item IDs and returns an array of objects,
 * each representing an item and its quantity. It filters out any falsy values
 * from the input array and counts the occurrences of each item ID.
 *
 * @param items - An array of item IDs.
 * @returns An array of objects, each containing an `itemId` and its `amount`.
 */
export const mapToCompactVaultUIModel = (items: number[]): ItemUIModel[] => {
  const totals = new Map<number, number>();
  items.forEach((item) => {
    if (!item) return;
    const current = totals.get(item) || 0;
    totals.set(item, current + 1);
  });

  return Array.from(totals.entries()).map(([itemId, amount]) => ({
    itemId,
    amount
  }));
};

/**
 * Maps an array of item IDs to an array of ItemUIModel objects.
 *
 * @param items - An array of item IDs.
 * @returns An array of ItemUIModel objects with the itemId property set.
 */
export const mapToUIModel = (items: number[]): ItemUIModel[] => {
  return items.map((item) => {
    return {
      itemId: item
    };
  });
};

/**
 * Calculates the total number of each potion type from an array of potion IDs.
 *
 * @param potions - An array of potion IDs or undefined.
 * @returns An array of ItemUIModel objects, each containing an itemId and the corresponding amount, sorted by itemId in descending order.
 */
export const calculatePotionTotals = (potions: number[] | undefined): ItemUIModel[] => {
  if (!potions) return [];

  const potionMap = new Map<number, number>();

  potions.forEach((potionId) => {
    if (!potionId) return;
    potionMap.set(potionId, (potionMap.get(potionId) || 0) + 1);
  });

  return Array.from(potionMap.entries())
    .sort(([idA], [idB]) => idB - idA) // sort potions by id descending
    .map(([id, amount]) => ({
      itemId: id,
      amount: amount
    }));
};

/**
 * Creates a map of consumable items and their counts from the provided items and quickslots.
 *
 * @param items - An array of item IDs.
 * @param quickslots - An array of quickslot items, each containing an itemId and an optional amount.
 * @param consumableIds - An array of item IDs that are considered consumable.
 * @returns A map where the keys are consumable item IDs and the values are their counts.
 */
const createConsumableMap = (
  items: number[],
  quickslots: ItemUIModel[],
  consumableIds: number[]
): Map<number, number> => {
  const consumableMap = new Map<number, number>();

  items.forEach((itemId) => {
    if (consumableIds.includes(itemId)) {
      const count = consumableMap.get(itemId) || 0;
      consumableMap.set(itemId, count + 1);
    }
  });

  quickslots.forEach((item) => {
    if (consumableIds.includes(item.itemId)) {
      const count = consumableMap.get(item.itemId) || 0;
      consumableMap.set(item.itemId, count + (item.amount ?? 0));
    }
  });

  return consumableMap;
};

/**
 * Maps consumable items to their corresponding UI models.
 *
 * @param items - An array of item IDs.
 * @param quickslots - An array of quickslot UI models.
 * @param consumableIds - An array of consumable item IDs to be mapped.
 * @returns An array of `ItemUIModel` objects representing the mapped consumables.
 */
export function mapConsumables(
  items: number[],
  quickslots: ItemUIModel[],
  consumableIds: number[]
): ItemUIModel[] {
  const consumableMapArray: [number, number][] = [
    ...createConsumableMap(items, quickslots, consumableIds)
  ];

  const consumablesUiModel: ItemUIModel[] =
    consumableMapArray?.map(([itemId, amount]) => {
      return {
        itemId: itemId,
        amount: amount
      } as ItemUIModel;
    }) || [];

  // Sort by order of consumableIds
  consumablesUiModel.sort((a, b) => {
    const indexA = consumableIds.indexOf(a.itemId);
    const indexB = consumableIds.indexOf(b.itemId);
    return indexA - indexB;
  });

  return consumablesUiModel;
}
