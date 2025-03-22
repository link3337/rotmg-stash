import { ItemUIModel } from '@/api/models/char-ui-model';
import { getTotalsFromLocalStorage, saveTotalsToLocalStorage } from '@/cache/localstorage-service';
import { SortCriteria, SortFields } from '@/cache/settings-model';
import { TotalsUIModel } from '@/cache/totals-model';
import { itemAliases } from '@/realm/renders/aliases';
import { booleanSort, numberSort } from '@/utils/sorting';
import { AccountModel } from '@cache/account-model';
import ItemSearch from '@components/Item/ItemSearch';
import { useAppSelector } from '@hooks/redux';
import { items } from '@realm/renders/items';
import {
  clearFilters,
  selectSelectedItems,
  selectShowHighlightedOnly,
  setHighlightedOnly,
  toggleHighlightedOnly
} from '@store/slices/FilterSlice';
import { selectDisplaySettings, selectItemSort, selectTotalSettings } from '@store/slices/SettingsSlice';
import { debug } from '@tauri-apps/plugin-log';
import { Button } from 'primereact/button';
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

  const activeFilters = useAppSelector(selectSelectedItems);
  const itemSort = useAppSelector(selectItemSort);
  const { showTotals } = useAppSelector(selectDisplaySettings);
  const showHighlightedOnly = useAppSelector(selectShowHighlightedOnly);
  const selectedItems = useAppSelector(selectSelectedItems);

  const [selectedItemsUI, setSelectedItemsUI] = useState<ItemUIModel[]>([]);

  const [totalItems, setTotalItems] = useState<TotalsUIModel[]>(getTotalsFromLocalStorage());
  const [filteredItems, setFilteredItems] = useState<TotalsUIModel[]>(getTotalsFromLocalStorage());
  const [totalItemsNameMap, setTotalItemsNameMap] = useState<Map<string, number>>(new Map());
  const { usePagination, itemsPerPage } = useAppSelector(selectTotalSettings);

  const sortItems = useCallback(
    (toBeSortedItems: TotalsUIModel[], sort: SortCriteria): TotalsUIModel[] => {
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
    },
    []
  );

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  useEffect(() => {
    const mappedSelectedItems: ItemUIModel[] = selectedItems.map((itemId) => ({ itemId }));
    setSelectedItemsUI(mappedSelectedItems);
  }, [selectedItems]);


  // Calculate total items from accounts
  useEffect(() => {
    const newTotalItems = calculateTotalsOfAllAccounts(accounts);
    if (JSON.stringify(newTotalItems) !== JSON.stringify(totalItems)) {
      debug('Totals were recalculated and updated');
      // override local storage with new totals
      saveTotalsToLocalStorage(newTotalItems);
      // set local state
      setTotalItems(newTotalItems);
    }
  }, [accounts]);

  // sort total items and update filtered items
  useEffect(() => {
    if (totalItems.length > 0) {
      // sort the items
      const sortedItems = sortItems(totalItems, itemSort);

      // update totalItems if sort changed the order
      if (JSON.stringify(sortedItems) !== JSON.stringify(totalItems)) {
        debug('Totals were sorted and updated');
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
    if (activeFilters.length === 0 && showHighlightedOnly) {
      dispatch(setHighlightedOnly(false));
    }
  }, [activeFilters]);

  return (
    <div>
      <div className="flex container justify-content-end">
        <ItemSearch totalItemsNameMap={totalItemsNameMap} />
      </div>

      <div>
        {/* Always show selected items if they exist and user has "show totals off", so it is known which items are currently selected */}
        {!showTotals && selectedItems.length > 0 && (
          <div className="text-left">
            <span className="ml-1 text-800 w-full">Selected Items:</span>
            <ItemList items={selectedItemsUI} />
          </div>
        )}
      </div>
      <div className="flex justify-content-end mb-2">
        {filteredItems.length > 0 && (
          <Button className="mr-2" label="Clear" onClick={handleClearFilters} />
        )}
        <Button
          disabled={activeFilters.length === 0}
          label={showHighlightedOnly ? 'Show All' : 'Show Highlighted Only'}
          onClick={() => dispatch(toggleHighlightedOnly())}
        />
      </div>

      {showTotals && (
        <ItemList
          items={showHighlightedOnly ? filteredItems : totalItems}
          paginated={usePagination}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
};

export default Totals;
