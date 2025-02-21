import { ItemUIModel } from '@api/models/char-ui-model';
import Item from './Item';
import styles from './ItemList.module.scss';

interface ItemListProps {
  items: ItemUIModel[];
}

export const ItemList: React.FC<ItemListProps> = ({ items }) => {
  return (
    <div className={styles.items}>
      {items.map((item, index) => (
        <Item key={index} itemId={item.itemId} amount={item.amount} />
      ))}
    </div>
  );
};
