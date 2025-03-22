import { ItemUIModel } from '@api/models/char-ui-model';
import { Paginator } from 'primereact/paginator';
import { useState } from 'react';
import Item from './Item';
import styles from './ItemList.module.scss';

interface ItemListProps {
  items: ItemUIModel[];
  paginated?: boolean;
  itemsPerPage?: number;
}

export const ItemList: React.FC<ItemListProps> = ({
  items,
  paginated = false,
  itemsPerPage = 50
}) => {
  const [first, setFirst] = useState(0);

  const onPageChange = (e: { first: number }) => {
    setFirst(e.first);
  };

  const displayedItems = paginated ? items.slice(first, first + itemsPerPage) : items;

  return (
    <div className="flex flex-column gap-2">
      <div className={styles.items}>
        {displayedItems.map((item, index) => (
          <Item key={`${item.itemId}-${index}`} itemId={item.itemId} amount={item.amount} />
        ))}
      </div>
      {paginated && items.length > itemsPerPage && (
        <Paginator
          first={first}
          rows={itemsPerPage}
          totalRecords={items.length}
          onPageChange={onPageChange}
          className="justify-content-center"
        />
      )}
    </div>
  );
};
