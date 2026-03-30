import { ItemUIModel } from '@api/models/char-ui-model';
import { useAppSelector } from '@hooks/redux';
import { selectAssetsBaseUrl } from '@store/slices/SettingsSlice';
import { Paginator } from 'primereact/paginator';
import { useEffect, useState } from 'react';
import Item from './Item';
import styles from './ItemList.module.scss';

interface ItemListProps {
  items: ItemUIModel[];
  paginated?: boolean;
  itemsPerPage?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export const ItemList: React.FC<ItemListProps> = ({
  items,
  paginated = false,
  itemsPerPage = 50,
  currentPage,
  onPageChange
}) => {
  const [startIndex, setStartIndex] = useState(0);
  const assetsBaseUrl = useAppSelector(selectAssetsBaseUrl);

  // Update 'startIndex' when currentPage changes externally
  useEffect(() => {
    if (currentPage !== undefined) {
      setStartIndex((currentPage - 1) * itemsPerPage);
    }
  }, [currentPage, itemsPerPage]);

  const handlePageChange = (e: { first: number }) => {
    setStartIndex(e.first);

    if (onPageChange) {
      const newPage = Math.floor(e.first / itemsPerPage) + 1;
      onPageChange(newPage);
    }
  };

  const displayedItems = paginated ? items.slice(startIndex, startIndex + itemsPerPage) : items;

  return (
    <div className="flex flex-column gap-2">
      <div className={styles.items}>
        {displayedItems.map((item, index) => (
          <Item
            key={`${item.itemId}-${index}`}
            itemId={item.itemId}
            amount={item.amount}
            assetsBaseUrl={assetsBaseUrl}
          />
        ))}
      </div>
      {paginated && items.length > itemsPerPage && (
        <Paginator
          first={startIndex}
          rows={itemsPerPage}
          totalRecords={items.length}
          onPageChange={handlePageChange}
          className="justify-content-center"
        />
      )}
    </div>
  );
};
