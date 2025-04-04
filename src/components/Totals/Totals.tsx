import { ItemUIModel } from '@/api/models/char-ui-model';
import { getTotalsFromLocalStorage, saveTotalsToLocalStorage } from '@/cache/localstorage-service';
import { SortCriteria, SortFields } from '@/cache/settings-model';
import { TotalsUIModel } from '@/cache/totals-model';
import { useItems } from '@/providers/ItemsProvider';
import { itemAliases } from '@/realm/renders/aliases';
import { createTotalMap } from '@/utils/item-name-map';
import { booleanSort, numberSort } from '@/utils/sorting';
import { AccountModel } from '@cache/account-model';
import ItemSearch from '@components/Item/ItemSearch';
import { useAppSelector } from '@hooks/redux';
import {
  clearFilters,
  selectSelectedItems,
  selectShowHighlightedOnly,
  setHighlightedOnly,
  toggleHighlightedOnly
} from '@store/slices/FilterSlice';
import {
  selectDisplaySettings,
  selectItemSort,
  selectTotalSettings,
  selectUseAprilFoolsItems
} from '@store/slices/SettingsSlice';
import { debug } from '@tauri-apps/plugin-log';
import { Button } from 'primereact/button';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ItemList } from '../Item/ItemList';
import styles from './Totals.module.scss';

// Memoized calculation function
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

  // Selectors
  const activeFilters = useAppSelector(selectSelectedItems);
  const itemSort = useAppSelector(selectItemSort);
  const { showTotals } = useAppSelector(selectDisplaySettings);
  const showHighlightedOnly = useAppSelector(selectShowHighlightedOnly);
  const selectedItems = useAppSelector(selectSelectedItems);
  const useAprilFoolsItems = useAppSelector(selectUseAprilFoolsItems);
  const { usePagination, itemsPerPage } = useAppSelector(selectTotalSettings);

  // State
  const [selectedItemsUI, setSelectedItemsUI] = useState<ItemUIModel[]>([]);
  const [totalItems, setTotalItems] = useState<TotalsUIModel[]>(getTotalsFromLocalStorage());
  const [filteredItems, setFilteredItems] = useState<TotalsUIModel[]>(getTotalsFromLocalStorage());
  const [totalItemsNameMap, setTotalItemsNameMap] = useState<Map<string, number>>(new Map());

  // get items from context
  const { regularItems, aprilFoolsItems, error } = useItems();

  const items = useAprilFoolsItems ? aprilFoolsItems : regularItems;

  // Memoized sort function
  const sortItems = useCallback(
    (toBeSortedItems: TotalsUIModel[], sort: SortCriteria): TotalsUIModel[] => {
      return [...toBeSortedItems].sort((a, b) => {
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
    },
    [items]
  );

  // Memoized handlers
  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const handleToggleHighlightedOnly = useCallback(() => {
    dispatch(toggleHighlightedOnly());
  }, [dispatch]);

  // Effects
  useEffect(() => {
    const mappedSelectedItems: ItemUIModel[] = selectedItems.map((itemId) => ({ itemId }));
    setSelectedItemsUI(mappedSelectedItems);
  }, [selectedItems]);

  // Calculate total items from accounts
  useEffect(() => {
    const newTotalItems = calculateTotalsOfAllAccounts(accounts);
    if (JSON.stringify(newTotalItems) !== JSON.stringify(totalItems)) {
      debug('Totals were recalculated and updated');
      saveTotalsToLocalStorage(newTotalItems);
      setTotalItems(newTotalItems);
    }
  }, [accounts]);

  // Sort total items and update filtered items
  useEffect(() => {
    if (totalItems.length > 0 && items) {
      const sortedItems = sortItems(totalItems, itemSort);

      if (JSON.stringify(sortedItems) !== JSON.stringify(totalItems)) {
        debug('Totals were sorted and updated');
        setTotalItems(sortedItems);
      }

      const filtered =
        activeFilters.length > 0
          ? sortedItems.filter((item) => activeFilters.includes(item.itemId))
          : sortedItems;

      setFilteredItems(filtered);
    }
  }, [totalItems, itemSort, activeFilters, sortItems, items]);

  // Update name map for search functionality
  useEffect(() => {
    if (items) {
      const newNameMap = createTotalMap(items, totalItems);

      // add item aliases
      itemAliases.forEach((itemId, alias) => {
        if (!newNameMap.has(alias)) {
          newNameMap.set(alias, itemId);
        }
      });

      setTotalItemsNameMap(newNameMap);
    }
  }, [totalItems, items]);

  // Reset showHighlighted when filters are cleared
  useEffect(() => {
    if (activeFilters.length === 0 && showHighlightedOnly) {
      dispatch(setHighlightedOnly(false));
    }
  }, [activeFilters, showHighlightedOnly, dispatch]);

  if (error) {
    return (
      <div
        className="flex justify-content-center align-items-center"
        style={{ minHeight: '200px' }}
      >
        <div className="text-red-500">Error loading items: {error.message}</div>
      </div>
    );
  }

  // Memoized button props
  const clearButtonProps = useMemo(
    () => ({
      className: 'mr-2',
      label: 'Clear',
      onClick: handleClearFilters
    }),
    [handleClearFilters]
  );

  const highlightButtonProps = useMemo(
    () => ({
      disabled: activeFilters.length === 0,
      label: showHighlightedOnly ? 'Show All' : 'Show Highlighted Only',
      onClick: handleToggleHighlightedOnly
    }),
    [activeFilters.length, showHighlightedOnly, handleToggleHighlightedOnly]
  );

  return (
    <div className={styles.totalsContainer}>
      <div className="flex container justify-content-end">
        <ItemSearch totalItemsNameMap={totalItemsNameMap} />
      </div>

      <div>
        {!showTotals && selectedItems.length > 0 && (
          <div className="text-left">
            <span className="ml-1 text-800 w-full">Selected Items:</span>
            <ItemList items={selectedItemsUI} />
          </div>
        )}
      </div>

      <div className="flex justify-content-end mb-2">
        {filteredItems.length > 0 && <Button {...clearButtonProps} />}
        <Button {...highlightButtonProps} />
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
