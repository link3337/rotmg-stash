import { SortCriteria, SortFields } from '@/cache/settings-model';
import { TotalsUIModel } from '@/cache/totals-model';
import { booleanSort, numberSort } from '@/utils/sorting';
import { AccountModel } from '@cache/account-model';

export const calculateTotalsOfAllAccounts = (accounts: AccountModel[]): TotalsUIModel[] => {
  const totals = new Map<number, number>();
  accounts?.forEach((account) => {
    account.mappedData?.totals?.forEach((item) => {
      totals.set(item.itemId, (totals.get(item.itemId) || 0) + item.amount);
    });
  });

  return Array.from(totals).map(([itemId, amount]) => ({ itemId, amount }));
};

export const sortTotals = (
  toBeSorted: TotalsUIModel[],
  sort: SortCriteria,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: Record<number, any> | undefined
): TotalsUIModel[] =>
  [...toBeSorted].sort((a, b) => {
    const itemA = items?.[a.itemId];
    const itemB = items?.[b.itemId];

    switch (sort.field) {
      case SortFields.id:
        return sort.direction === 'asc' ? a?.itemId - b?.itemId : b?.itemId - a?.itemId;
      case SortFields.name:
        return sort.direction === 'asc'
          ? itemA?.name.localeCompare(itemB?.name)
          : itemB?.name.localeCompare(itemA?.name);
      case SortFields.fameBonus:
        return numberSort(itemA?.fameBonus, itemB?.fameBonus, sort.direction);
      case SortFields.feedPower:
        return numberSort(itemA?.feedPower, itemB?.feedPower, sort.direction);
      case SortFields.soulbound:
        return booleanSort(itemA?.isSoulbound, itemB?.isSoulbound, sort.direction);
      case SortFields.tier:
        return numberSort(itemA?.tier, itemB?.tier, sort.direction);
      case SortFields.shiny:
        return booleanSort(itemA?.isShiny, itemB?.isShiny, sort.direction);
      default:
        return 0;
    }
  });
