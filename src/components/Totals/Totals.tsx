import { ItemUIModel } from '@api/models/char-ui-model';
import { AccountModel } from '@cache/account-model';
import { SortCriteria } from '@cache/settings-model';
import ItemSearch from '@components/Item/ItemSearch';
import { useAppSelector } from '@hooks/redux';
import { itemNameMap, items, RealmItem } from '@realm/renders/items';
import { clearFilters, selectSelectedItems } from '@store/slices/FilterSlice';
import { selectItemSort } from '@store/slices/SettingsSlice';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ItemList } from '../Item/ItemList';

const calculateTotals = (accounts: AccountModel[]): ItemUIModel[] => {
  const totals = new Map<number, number>();

  const iterateItems = (items: number[]) => {
    items.forEach((item) => {
      const current = totals.get(item) || 0;
      totals.set(item, current + 1);
    });
  };

  const iterateQuickslots = (items: ItemUIModel[]) => {
    items.forEach((item) => {
      const current = totals.get(item.itemId) || 0;
      totals.set(item.itemId, current + (item.amount ?? 0));
    });
  };

  accounts.forEach((account) => {
    // gifts
    const gifts = account?.mappedData?.account?.gifts || [];
    iterateItems(gifts);

    // temporaryGifts
    const temporaryGifts = account?.mappedData?.account?.seasonalSpoils || [];
    iterateItems(temporaryGifts);

    // potion storage
    const potionStorage = account?.mappedData?.account?.potions || [];
    iterateItems(potionStorage);

    // vault
    const vault = account?.mappedData?.account?.vault || [];
    iterateItems(vault);

    // characters
    const characters = account?.mappedData?.charList || [];
    characters.forEach((character) => {
      // equipment
      const equipment = character.equipment || [];
      iterateItems(equipment);

      // quickslots
      const quickslots = character.equip_qs || [];
      iterateQuickslots(quickslots);
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

  const [showHighlighted, setShowHighlighted] = useState(false);
  const [loading, setLoading] = useState(true);

  let totalItems = calculateTotals(accounts);
  let totalItemsNameMap = new Map<string, number>();

  totalItemsNameMap = new Map<string, number>(
    Array.from(itemNameMap.entries()).filter(([_name, id]) =>
      totalItems.some((item) => item.itemId === id)
    )
  );

  const filteredItems = totalItems.filter((item) => activeFilters.includes(item.itemId));

  const recursiveSort = (
    toBeSortedItems: ItemUIModel[],
    sortCriteria: SortCriteria[],
    index: number = 0
  ): ItemUIModel[] => {
    if (index >= sortCriteria.length) return toBeSortedItems;

    const sort = sortCriteria[index];
    const groupedItems = toBeSortedItems.reduce(
      (acc, item) => {
        const realmItem: RealmItem = items[item.itemId];
        const key =
          sort.field === 'id' || !realmItem ? item.itemId : (realmItem as any)[sort.field];
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<string, ItemUIModel[]>
    );

    const sortedKeys = Object.keys(groupedItems).sort((a, b) => {
      const itemAId = parseInt(a);
      const itemBId = parseInt(b);

      if (sort.field === 'id') {
        return sort.direction === 'asc' ? itemAId - itemBId : itemBId - itemAId;
      } else {
        const itemA = items[itemAId];
        const itemB = items[itemBId];
        if (itemA === undefined || itemB === undefined) return -1;

        if (sort.field === 'name') {
          return sort.direction === 'asc'
            ? itemA.name.localeCompare(itemB.name)
            : itemB.name.localeCompare(itemA.name);
        } else if (sort.field === 'slotType') {
          return sort.direction === 'asc'
            ? Number(itemA.slotType) - Number(itemB.slotType)
            : Number(itemB.slotType) - Number(itemA.slotType);
        } else if (sort.field === 'fameBonus') {
          return sort.direction === 'asc'
            ? itemA.fameBonus - itemB.fameBonus
            : itemB.fameBonus - itemA.fameBonus;
        } else if (sort.field === 'feedPower') {
          return sort.direction === 'asc'
            ? itemA.feedPower - itemB.feedPower
            : itemB.feedPower - itemA.feedPower;
        } else if (sort.field === 'bagType') {
          return sort.direction === 'asc'
            ? itemA.bagType - itemB.bagType
            : itemB.bagType - itemA.bagType;
        } else if (sort.field === 'soulbound') {
          return sort.direction === 'asc'
            ? Number(itemA.isSoulbound) - Number(itemB.isSoulbound)
            : Number(itemB.isSoulbound) - Number(itemA.isSoulbound);
        } else if (sort.field === 'tier') {
          return sort.direction === 'asc'
            ? Number(itemA.tier) - Number(itemB.tier)
            : Number(itemB.tier) - Number(itemA.tier);
        } else if (sort.field === 'shiny') {
          return sort.direction === 'asc'
            ? Number(itemA.isShiny) - Number(itemB.isShiny)
            : Number(itemB.isShiny) - Number(itemA.isShiny);
        }
        return -1;
      }
    });

    return sortedKeys.flatMap((key) => recursiveSort(groupedItems[key], sortCriteria, index + 1));
  };

  totalItems = recursiveSort(totalItems, itemSort);

  useEffect(() => {
    if (filteredItems.length === 0) {
      setShowHighlighted(false);
      setLoading(false);
    }
  }, [filteredItems.length]);

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

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
          disabled={!showHighlighted && filteredItems.length === 0}
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
