import { useAppSelector } from '@hooks/redux';
import { selectAssetsBaseUrl } from '@store/slices/SettingsSlice';
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
  const assetsBaseUrl = useAppSelector(selectAssetsBaseUrl);

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
              assetsBaseUrl={assetsBaseUrl}
            />
          ))}
          {inventory.map((item, i) => (
            <Item
              key={i}
              itemId={item.itemId}
              enchantmentSlots={item.enchantmentSlots}
              enchantmentIds={item.enchantmentIds}
              assetsBaseUrl={assetsBaseUrl}
            />
          ))}
          {backpack.map((item, i) => (
            <Item
              key={i}
              itemId={item.itemId}
              enchantmentSlots={item.enchantmentSlots}
              enchantmentIds={item.enchantmentIds}
              assetsBaseUrl={assetsBaseUrl}
            />
          ))}
          {quickslots.map((item, i) => (
            <Item
              key={i}
              itemId={item.itemId}
              amount={item.amount}
              enchantmentSlots={item.enchantmentSlots}
              enchantmentIds={item.enchantmentIds}
              assetsBaseUrl={assetsBaseUrl}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Equipment;
