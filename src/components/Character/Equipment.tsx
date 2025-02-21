import { ItemUIModel } from '@api/models/char-ui-model';
import React from 'react';
import Item from '../Item/Item';
import styles from './Characters.module.scss';

interface EquipmentProps {
  equipment: number[];
  inventory: number[];
  backpack: number[];
  quickslots: ItemUIModel[];
}

const Equipment: React.FC<EquipmentProps> = ({ equipment, inventory, backpack, quickslots }) => (
  <>
    <div className={styles.equipmentContainer}>
      <div className={styles.equipment}>
        {equipment.map((item, i) => (
          <Item key={i} itemId={item} />
        ))}
        {inventory.map((item, i) => (
          <Item key={i} itemId={item} />
        ))}
        {backpack.map((item, i) => (
          <Item key={i} itemId={item} />
        ))}
        {quickslots.map((item, i) => (
          <Item key={i} itemId={item.itemId} amount={item.amount} />
        ))}
      </div>
    </div>
  </>
);

export default Equipment;
