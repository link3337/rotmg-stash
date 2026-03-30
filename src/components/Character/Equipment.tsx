import React from 'react';
import Item from '../Item/Item';
import { CharacterItemEntry } from './Character';
import styles from './Characters.module.scss';

interface EquipmentProps {
  equipment: CharacterItemEntry[];
  inventory: CharacterItemEntry[];
  backpack: CharacterItemEntry[];
  quickslots: CharacterItemEntry[];
}

const Equipment: React.FC<EquipmentProps> = ({ equipment, inventory, backpack, quickslots }) => {
  return (
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
};

export default Equipment;
