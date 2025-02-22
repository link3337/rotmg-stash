import { ItemUIModel } from '@api/models/char-ui-model';
import { AccountModel } from '@cache/account-model';
import ItemSearch from '@components/Item/ItemSearch';
import { useAppSelector } from '@hooks/redux';
import { itemNameMap, items } from '@realm/renders/items';
import { clearFilters, selectSelectedItems } from '@store/slices/FilterSlice';
import { selectItemSort, SortFields } from '@store/slices/SettingsSlice';
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

  const sortItems = (
    toBeSortedItems: ItemUIModel[],
    sort: { field: SortFields; direction: 'asc' | 'desc' }
  ): ItemUIModel[] => {
    console.log(toBeSortedItems.length);
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
          const isShinyA = itemA?.isShiny ?? false;
          const isShinyB = itemB?.isShiny ?? false;
          return sort.direction === 'asc'
            ? isShinyA === isShinyB
              ? 0
              : isShinyA
                ? -1
                : 1
            : isShinyA === isShinyB
              ? 0
              : isShinyA
                ? 1
                : -1;
        default:
          return 0;
      }
    });
  };

  totalItems = sortItems(totalItems, itemSort);

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
