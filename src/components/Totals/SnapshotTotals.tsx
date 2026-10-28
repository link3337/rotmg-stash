import { AccountModel } from '@cache/account-model';
import { useConstants } from '@/providers/ConstantsProvider';
import { itemAliases } from '@/realm/renders/aliases';
import { createTotalMap } from '@/utils/item-name-map';
import ItemSearch from '@components/Item/ItemSearch';
import { useAppSelector } from '@hooks/redux';
import { selectSelectedItems, selectShowHighlightedOnly, clearFilters, setHighlightedOnly, toggleHighlightedOnly } from '@store/slices/FilterSlice';
import {
  selectDisplaySettings,
  selectItemSort,
  selectTotalSettings
} from '@store/slices/SettingsSlice';
import { Button } from 'primereact/button';
import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { ItemList } from '../Item/ItemList';
import styles from './Totals.module.scss';
import { calculateTotalsOfAllAccounts, sortTotals } from './totals-utils';

interface SnapshotTotalsProps {
  accounts: AccountModel[];
  title: string;
}

// Read-only totals for the accounts inside a snapshot; never touches the cached live totals.
const SnapshotTotals: React.FC<SnapshotTotalsProps> = ({ accounts, title }) => {
  const { items } = useConstants();
  const dispatch = useDispatch();
  const showHighlightedOnly = useAppSelector(selectShowHighlightedOnly);
  const itemSort = useAppSelector(selectItemSort);
  const activeFilters = useAppSelector(selectSelectedItems);
  const { showTotals } = useAppSelector(selectDisplaySettings);
  const { usePagination, itemsPerPage } = useAppSelector(selectTotalSettings);

  const totals = useMemo(
    () => sortTotals(calculateTotalsOfAllAccounts(accounts), itemSort, items),
    [accounts, itemSort, items]
  );

  const visibleTotals = useMemo(
    () =>
      activeFilters.length > 0 ? totals.filter((t) => activeFilters.includes(t.itemId)) : totals,
    [totals, activeFilters]
  );

  const nameMap = useMemo(() => {
    if (!items) return new Map<string, number[]>();
    const map = createTotalMap(items, totals);
    for (const [alias, itemId] of itemAliases.entries()) {
      const key = alias.toLowerCase();
      const ids = map.get(key);
      if (!ids) map.set(key, [itemId]);
      else if (!ids.includes(itemId)) ids.push(itemId);
    }
    return map;
  }, [items, totals]);

  return (
    <div className={styles.totalsContainer}>
      <div className="flex container justify-content-between align-items-center">
        <span className="font-bold ml-1">Totals in snapshot: {title}</span>
        <ItemSearch totalItemsNameMap={nameMap} totals={totals} />
      </div>
      <div className="flex justify-content-end mb-2">
        {activeFilters.length > 0 && (
          <Button className="mr-2" label="Clear" onClick={() => {
              dispatch(clearFilters());
              dispatch(setHighlightedOnly(false));
            }}
          />
        )}
        <Button
          disabled={activeFilters.length === 0}
          label={showHighlightedOnly ? 'Show All' : 'Show Highlighted Only'}
          onClick={() => dispatch(toggleHighlightedOnly())}
        />
      </div>
      {showTotals && (
        <ItemList
          items={showHighlightedOnly ? visibleTotals : totals}
          paginated={usePagination}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
};

export default SnapshotTotals;
