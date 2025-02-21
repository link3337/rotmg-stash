import { FC } from 'react';
import styles from './Item.module.scss';

interface UnknownItemProps {
  itemId: number;
  amount?: number;
}

const UnknownItem: FC<UnknownItemProps> = ({ itemId, amount }) => {
  let backgroundPosition = '-50px -5px';
  return (
    <div style={{ position: 'relative', height: '43px', display: 'inline-block' }}>
      <div className={`${styles.item}`} data-itemid={itemId} style={{ backgroundPosition }}>
        <div className={styles.nonSelectable}>{amount && amount > 0 ? amount : ''}</div>
      </div>
    </div>
  );
};

export default UnknownItem;
