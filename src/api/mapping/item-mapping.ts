import { ItemUIModel } from '@api/models/char-ui-model';

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

export const mapToUIModel = (items: number[]): ItemUIModel[] => {
  return items.map((item) => {
    return {
      itemId: item
    };
  });
};

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
