import { CharUIModel, MappedCharacterStats } from '@api/models/char-ui-model';
import { ExaltUIModel } from '@api/models/exalt-ui-model';
import LootBoostIcon from '@components/Icons/LootBoostIcon';
import { useAppSelector } from '@hooks/redux';
import { selectEnable3DViewer } from '@store/slices/SettingsSlice';
import React, { useState } from 'react';
import Character3DViewerDialog from './Character3DViewerDialog';
import CharacterPortrait from './CharacterPortrait';
import styles from './Characters.module.scss';
import Equipment from './Equipment';
import { Stats } from './Stats';

interface CharacterProps {
  char?: CharUIModel;
  exalts: ExaltUIModel[] | null;
  accountId?: string;
}

export interface CharacterItemEntry {
  itemId: number;
  amount?: number;
  enchantmentSlots: number;
  enchantmentIds: number[];
}

const getMaxedStatsCount = (stats: MappedCharacterStats[]): string => {
  const maxedCount = stats.reduce((count, stat) => count + (stat.maxed ? 1 : 0), 0);
  return `${maxedCount}/8`;
};

export const Character: React.FC<CharacterProps> = ({ char, exalts, accountId }) => {
  const [show3DViewer, setShow3DViewer] = useState(false);
  const show3DCharacterViewer = useAppSelector(selectEnable3DViewer);

  const items = char?.equipment ?? [];

  const slotsByItemId = (char?.unique_item_info ?? []).reduce<Map<number, number[]>>(
    (acc, info) => {
      const slotCount = info.enchantments?.slotCount ?? 0;
      if (slotCount <= 0) return acc;

      const existing = acc.get(info.itemId) ?? [];
      existing.push(Math.min(Math.max(slotCount, 0), 4));
      acc.set(info.itemId, existing);
      return acc;
    },
    new Map<number, number[]>()
  );

  const enchantmentsByItemId = (char?.unique_item_info ?? []).reduce<Map<number, number[][]>>(
    (acc, info) => {
      const ids = info.enchantments?.enchantmentIds?.filter(
        (id) => id !== 0 && id !== 0xffff && id !== 0xfffe && id !== 0xfd00
      );
      if (!ids || ids.length === 0) return acc;

      const existing = acc.get(info.itemId) ?? [];
      existing.push(ids);
      acc.set(info.itemId, existing);
      return acc;
    },
    new Map<number, number[][]>()
  );

  const consumeEnchantmentData = (
    itemId: number
  ): { enchantmentSlots: number; enchantmentIds: number[] } => {
    const slotQueue = slotsByItemId.get(itemId);
    const enchantmentQueue = enchantmentsByItemId.get(itemId);

    const enchantmentSlots = slotQueue && slotQueue.length > 0 ? (slotQueue.shift() ?? 0) : 0;
    const enchantmentIds =
      enchantmentQueue && enchantmentQueue.length > 0 ? (enchantmentQueue.shift() ?? []) : [];

    if (slotQueue && slotQueue.length === 0) slotsByItemId.delete(itemId);
    if (enchantmentQueue && enchantmentQueue.length === 0) enchantmentsByItemId.delete(itemId);

    return { enchantmentSlots, enchantmentIds };
  };

  const mapItems = (itemIds: number[]): CharacterItemEntry[] => {
    return itemIds.map((itemId) => {
      const data = consumeEnchantmentData(itemId);
      return {
        itemId,
        enchantmentSlots: data.enchantmentSlots,
        enchantmentIds: data.enchantmentIds
      };
    });
  };

  const equipment = mapItems(items?.slice(0, 4) ?? []);
  const inventory = mapItems(items?.slice(4, 12) ?? []);
  const backpack = mapItems(items?.slice(12, items.length) ?? []);
  const quickslots: CharacterItemEntry[] = (char?.equip_qs ?? []).map((item) => ({
    ...consumeEnchantmentData(item.itemId),
    itemId: item.itemId,
    amount: item.amount
  }));
  const stats = char?.mappedStats ?? [];

  const timeInMinutes = (value: number): string => {
    return `${Math.floor(value / 60)}m ${value % 60}s`;
  };

  const boostDisplay = () => (
    <div className={styles.boost}>
      {char?.lootDrop && char?.lootTier ? (
        <div
          title={`Loot Drop: ${timeInMinutes(char?.lootDrop)}\nLoot Tier: ${timeInMinutes(char?.lootTier)}`}
        >
          <LootBoostIcon fill="#4EE50E" />
        </div>
      ) : (
        <>
          {char?.lootDrop ? (
            <div title={`Loot Drop: ${timeInMinutes(char?.lootDrop)}`}>
              <LootBoostIcon fill="#C9870E" />
            </div>
          ) : char?.lootTier ? (
            <div title={`Loot Tier: ${timeInMinutes(char?.lootTier)}`}>
              <LootBoostIcon fill="#9143BB" />
            </div>
          ) : null}
        </>
      )}
    </div>
  );

  return (
    <div id={`${accountId}-character-${char?.id}`} className={styles.character}>
      <div className={styles.header}>
        <button
          type="button"
          onClick={() => show3DCharacterViewer && setShow3DViewer(true)}
          title={show3DCharacterViewer ? 'Open 3D Viewer' : '3D Viewer is disabled in settings'}
          style={{
            all: 'unset',
            cursor: show3DCharacterViewer ? 'pointer' : 'default',
            display: 'inline-flex'
          }}
          aria-label="Open 3D viewer"
        >
          <CharacterPortrait
            type={char?.classId!}
            skin={char?.texture!}
            tex1={char?.tex1!}
            tex2={char?.tex2!}
            adjust={false}
          />
        </button>
        <div className={styles.info}>
          {boostDisplay()}
          <div className={`${styles.details} ${char?.seasonal ? styles.seasonal : ''}`}>
            <div className={styles.detailRow}>
              <span className={styles.charInfo}>
                {char?.className} {char?.level}
              </span>

              <span className={styles.charId}>#{char?.id}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.fame}>
                {char?.fame} Fame, {getMaxedStatsCount(stats)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Stats stats={stats} classId={char?.classId!} exalts={exalts} />
      <Equipment
        equipment={equipment}
        inventory={inventory}
        backpack={backpack}
        quickslots={quickslots}
      />

      {show3DCharacterViewer && (
        <Character3DViewerDialog
          visible={show3DViewer}
          onHide={() => setShow3DViewer(false)}
          characterClassName={char?.className}
          characterId={char?.id}
          type={char?.objectType ?? char?.classId}
          skin={char?.texture ?? char?.objectType ?? char?.classId}
          tex1={char?.tex1}
          tex2={char?.tex2}
        />
      )}
    </div>
  );
};
