import { ItemUIModel } from '@/api/models/char-ui-model';
import { getTotalsFromLocalStorage, saveTotalsToLocalStorage } from '@/cache/localstorage-service';
import { TotalsUIModel } from '@/cache/totals-model';
import { useConstants } from '@/providers/ConstantsProvider';
import { itemAliases } from '@/realm/renders/aliases';
import { createTotalMap } from '@/utils/item-name-map';
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
  selectTotalSettings
} from '@store/slices/SettingsSlice';
import { debug } from '@tauri-apps/plugin-log';
import { Button } from 'primereact/button';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ItemList } from '../Item/ItemList';
import styles from './Totals.module.scss';
import { calculateTotalsOfAllAccounts, sortTotals } from './totals-utils';

interface TotalProps {
  accounts: AccountModel[];
}

const Totals: React.FC<TotalProps> = ({ accounts }) => {
  const dispatch = useDispatch();

  const [currentPage, setCurrentPage] = useState(1);

  // Selectors
  const activeFilters = useAppSelector(selectSelectedItems);
  const itemSort = useAppSelector(selectItemSort);
  const { showTotals } = useAppSelector(selectDisplaySettings);
  const showHighlightedOnly = useAppSelector(selectShowHighlightedOnly);
  const selectedItems = useAppSelector(selectSelectedItems);
  const { usePagination, itemsPerPage } = useAppSelector(selectTotalSettings);

  // State
  const [selectedItemsUI, setSelectedItemsUI] = useState<ItemUIModel[]>([]);
  const [totalItems, setTotalItems] = useState<TotalsUIModel[]>(getTotalsFromLocalStorage());
  const [filteredItems, setFilteredItems] = useState<TotalsUIModel[]>(getTotalsFromLocalStorage());
  const [totalItemsNameMap, setTotalItemsNameMap] = useState<Map<string, number[]>>(new Map());

  // get items/constants from context
  const { items: regularItems, error } = useConstants();

  const items = regularItems;

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
      const sortedItems = sortTotals(totalItems, itemSort, items);

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
  }, [totalItems, itemSort, activeFilters, items]);

  // Update name map for search functionality
  useEffect(() => {
    if (items) {
      const newNameMap = createTotalMap(items, totalItems);

      // add item aliases
      for (const [alias, itemId] of itemAliases.entries()) {
        const normalizedAlias = alias.toLowerCase();
        const existingItemIds = newNameMap.get(normalizedAlias);
        if (existingItemIds) {
          if (!existingItemIds.includes(itemId)) {
            existingItemIds.push(itemId);
          }
        } else {
          newNameMap.set(normalizedAlias, [itemId]);
        }
      }

      setTotalItemsNameMap(newNameMap);
    }
  }, [totalItems, items]);

  // Reset showHighlighted when filters are cleared
  useEffect(() => {
    if (activeFilters.length === 0 && showHighlightedOnly) {
      dispatch(setHighlightedOnly(false));
    }
  }, [activeFilters, showHighlightedOnly, dispatch]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilters, showHighlightedOnly]);

  // Add onPageChange handler
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

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
        <ItemSearch totalItemsNameMap={totalItemsNameMap} totals={totalItems} />
      </div>

      <div>
        {!showTotals && selectedItems.length > 0 && (
          <div className="text-left">
            <span className="ml-1 text-800 w-full">Selected Items:</span>
            <ItemList
              items={selectedItemsUI}
              paginated={usePagination}
              itemsPerPage={itemsPerPage}
            />
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
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default Totals;
