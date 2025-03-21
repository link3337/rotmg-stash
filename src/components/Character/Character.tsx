import { CharUIModel, MappedCharacterStats } from '@api/models/char-ui-model';
import { ExaltUIModel } from '@api/models/exalt-ui-model';
import LootBoostIcon from '@components/Icons/LootBoostIcon';
import React from 'react';
import CharacterPortrait from './CharacterPortrait';
import styles from './Characters.module.scss';
import Equipment from './Equipment';
import { Stats } from './Stats';

interface CharacterProps {
  char?: CharUIModel;
  exalts: ExaltUIModel[] | null;
}

const getMaxedStatsCount = (stats: MappedCharacterStats[]): string => {
  const maxedCount = stats.reduce((count, stat) => count + (stat.maxed ? 1 : 0), 0);
  return `${maxedCount}/8`;
};

export const Character: React.FC<CharacterProps> = ({ char, exalts }) => {
  const items = char?.equipment ?? [];

  const equipment = items?.slice(0, 4) ?? [];
  const inventory = items?.slice(4, 12) ?? [];
  const backpack = items?.slice(12, items.length) ?? [];
  const quickslots = char?.equip_qs ?? [];
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
    <div className={styles.character}>
      <div className={styles.header}>
        <CharacterPortrait
          type={char?.classId!}
          skin={char?.texture!}
          tex1={char?.tex1!}
          tex2={char?.tex2!}
          adjust={false}
        />
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
    </div>
  );
};
