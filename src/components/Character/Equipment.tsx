import React from 'react';
import Item from '../Item/Item';
import styles from './Characters.module.scss';
import { CharacterItemEntry } from './Character';

interface EquipmentProps {
  equipment: CharacterItemEntry[];
  inventory: CharacterItemEntry[];
  backpack: CharacterItemEntry[];
  quickslots: CharacterItemEntry[];
}

const Equipment: React.FC<EquipmentProps> = ({ equipment, inventory, backpack, quickslots }) => (
  <>
    <div className={styles.equipmentContainer}>
      <div className={styles.equipment}>
        {equipment.map((item, i) => (
          <Item
            key={i}
            itemId={item.itemId}
            enchantmentSlots={item.enchantmentSlots}
            enchantmentIds={item.enchantmentIds}
          />
        ))}
        {inventory.map((item, i) => (
          <Item
            key={i}
            itemId={item.itemId}
            enchantmentSlots={item.enchantmentSlots}
            enchantmentIds={item.enchantmentIds}
          />
        ))}
        {backpack.map((item, i) => (
          <Item
            key={i}
            itemId={item.itemId}
            enchantmentSlots={item.enchantmentSlots}
            enchantmentIds={item.enchantmentIds}
          />
        ))}
        {quickslots.map((item, i) => (
          <Item
            key={i}
            itemId={item.itemId}
            amount={item.amount}
            enchantmentSlots={item.enchantmentSlots}
            enchantmentIds={item.enchantmentIds}
          />
        ))}
      </div>
    </div>
  </>
);

export default Equipment;
