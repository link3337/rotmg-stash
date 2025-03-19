import { getTotalsFromLocalStorage, saveTotalsToLocalStorage } from '@/cache/localstorage-service';
import { TotalsUIModel } from '@/cache/totals-model';
import { itemAliases } from '@/realm/renders/aliases';
import { AccountModel } from '@cache/account-model';
import ItemSearch from '@components/Item/ItemSearch';
import { useAppSelector } from '@hooks/redux';
import { items } from '@realm/renders/items';
import { clearFilters, selectSelectedItems } from '@store/slices/FilterSlice';
import { selectItemSort, SortFields } from '@store/slices/SettingsSlice';
import { debug } from '@tauri-apps/plugin-log';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ItemList } from '../Item/ItemList';

const calculateTotalsOfAllAccounts = (accounts: AccountModel[]): TotalsUIModel[] => {
  const totals = new Map<number, number>();
  accounts?.forEach((account) => {
    const mappedData = account.mappedData;

    if (!mappedData) return;

    mappedData?.totals?.forEach((item) => {
      const current = totals.get(item.itemId) || 0;
      totals.set(item.itemId, current + item.amount);
    });
  });

  return Array.from(totals).map(([itemId, amount]) => ({
    itemId,
    amount
  }));
};

interface TotalProps {
  accounts: AccountModel[];
}

const Totals: React.FC<TotalProps> = ({ accounts }) => {
  const dispatch = useDispatch();

  const [totalItems, setTotalItems] = useState<TotalsUIModel[]>(getTotalsFromLocalStorage());
  const [filteredItems, setFilteredItems] = useState<TotalsUIModel[]>(getTotalsFromLocalStorage());
  const [totalItemsNameMap, setTotalItemsNameMap] = useState<Map<string, number>>(new Map());

  const activeFilters = useAppSelector(selectSelectedItems);
  const itemSort = useAppSelector(selectItemSort);

  const [showHighlighted, setShowHighlighted] = useState(false);
  const [loading, setLoading] = useState(true);

  const sortItems = useCallback(
    (
      toBeSortedItems: TotalsUIModel[],
      sort: { field: SortFields; direction: 'asc' | 'desc' }
    ): TotalsUIModel[] => {
      return [...toBeSortedItems].sort((a, b) => {
        const itemA = items[a.itemId];
        const itemB = items[b.itemId];

        switch (sort.field) {
          case SortFields.id:
            return sort.direction === 'asc' ? a?.itemId - b?.itemId : b?.itemId - a?.itemId;
          case SortFields.name:
            return sort.direction === 'asc'
              ? itemA?.name.localeCompare(itemB?.name)
              : itemB?.name.localeCompare(itemA?.name);
          case SortFields.slotType:
            return sort.direction === 'asc'
              ? Number(itemA?.slotType) - Number(itemB?.slotType)
              : Number(itemB?.slotType) - Number(itemA?.slotType);
          case SortFields.fameBonus:
            return sort.direction === 'asc'
              ? itemA?.fameBonus - itemB?.fameBonus
              : itemB?.fameBonus - itemA?.fameBonus;
          case SortFields.feedPower:
            return sort.direction === 'asc'
              ? itemA?.feedPower - itemB?.feedPower
              : itemB?.feedPower - itemA?.feedPower;
          case SortFields.bagType:
            return sort.direction === 'asc'
              ? itemA?.bagType - itemB?.bagType
              : itemB?.bagType - itemA?.bagType;
          case SortFields.soulbound:
            return sort.direction === 'asc'
              ? Number(itemA?.isSoulbound) - Number(itemB?.isSoulbound)
              : Number(itemB?.isSoulbound) - Number(itemA?.isSoulbound);
          case SortFields.tier:
            return sort.direction === 'asc'
              ? Number(itemA?.tier) - Number(itemB?.tier)
              : Number(itemB?.tier) - Number(itemA?.tier);
          case SortFields.shiny:
            return sort.direction === 'asc'
              ? Number(itemA?.isShiny) - Number(itemB?.isShiny)
              : Number(itemB?.isShiny) - Number(itemA?.isShiny);
          default:
            return 0;
        }
      });
    },
    []
  );

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  // Calculate total items from accounts
  useEffect(() => {
    const newTotalItems = calculateTotalsOfAllAccounts(accounts);
    if (JSON.stringify(newTotalItems) !== JSON.stringify(totalItems)) {
      debug('Totals updated');
      // override local storage with new totals
      saveTotalsToLocalStorage(newTotalItems);
      // set local state
      setTotalItems(newTotalItems);
      setLoading(false);
    }
  }, [accounts]);

  // sort total items and update filtered items
  useEffect(() => {
    if (totalItems.length > 0) {
      // sort the items
      const sortedItems = sortItems(totalItems, itemSort);

      // update totalItems if sort changed
      if (JSON.stringify(sortedItems) !== JSON.stringify(totalItems)) {
        setTotalItems(sortedItems);
      }

      // filter items based on active filters
      const filtered =
        activeFilters.length > 0
          ? sortedItems.filter((item) => activeFilters.includes(item.itemId))
          : sortedItems;

      setFilteredItems(filtered);
    }
  }, [totalItems, itemSort, activeFilters, sortItems]);

  // update name map for search functionality
  useEffect(() => {
    const newNameMap = new Map<string, number>();

    // add base item names
    totalItems.forEach((item) => {
      const itemData = items[item.itemId];
      if (itemData?.name) {
        newNameMap.set(itemData.name.toLowerCase(), item.itemId);
      }
    });

    // add item aliases for existing items
    itemAliases.forEach((itemId, alias) => {
      if (totalItems.some((item) => item.itemId === itemId)) {
        newNameMap.set(alias.toLowerCase(), itemId);
      }
    });

    setTotalItemsNameMap(newNameMap);
  }, [totalItems]);

  // reset showHighlighted when filters are cleared
  useEffect(() => {
    if (activeFilters.length === 0 && showHighlighted) {
      setShowHighlighted(false);
    }
  }, [activeFilters]);

  return (
    <div>
      <div className="flex container justify-content-end">
        <ItemSearch totalItemsNameMap={totalItemsNameMap} />
      </div>
      <div className="flex justify-content-end mb-2">
        {filteredItems.length > 0 && (
          <Button className="mr-2" label="Clear" onClick={handleClearFilters} />
        )}
        <Button
          disabled={activeFilters.length === 0}
          label={showHighlighted ? 'Show All' : 'Show Highlighted Only'}
          onClick={() => setShowHighlighted(!showHighlighted)}
        />
      </div>
      {loading ? (
        <div className="p-grid">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="p-col-12 p-md-6 p-lg-4">
              <Skeleton width="100%" height="2rem" />
            </div>
          ))}
        </div>
      ) : (
        <ItemList items={showHighlighted ? filteredItems : totalItems} />
      )}
    </div>
  );
};

export default Totals;
