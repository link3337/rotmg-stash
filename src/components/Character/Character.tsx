import { CharUIModel } from '@api/models/char-ui-model';
import { ExaltUIModel } from '@api/models/exalt-ui-model';
import { classes, ClassID } from '@realm/renders/classes';
import React from 'react';
import { CharacterStats } from '../Account/types';
import CharacterPortrait from './CharacterPortrait';
import styles from './Characters.module.scss';
import Equipment from './Equipment';
import { Stats } from './Stats';

interface CharacterProps {
  char?: CharUIModel;
  exalts: ExaltUIModel[] | null;
}

const getMaxedStatsCount = (stats: CharacterStats[]): string => {
  const maxedCount = stats.reduce((count, stat) => count + (stat.maxed ? 1 : 0), 0);
  return `${maxedCount}/8`;
};

export const Character: React.FC<CharacterProps> = ({ char, exalts }) => {
  const items = char?.equipment ?? [];

  const equipment = items?.slice(0, 4) ?? [];
  const inventory = items?.slice(4, 12) ?? [];
  const backpack = items?.slice(12, items.length) ?? [];
  const quickslots = char?.equip_qs ?? [];

  const classId = parseInt(char?.objectType ?? '') as ClassID;
  const classObj = classes[classId];

  const classMaxStats = classObj[3];

  const stats: CharacterStats[] = [
    {
      name: 'HP',
      value: char?.stats.maxHP ?? 0,
      maxed: (char?.stats?.maxHP ?? 0) >= classMaxStats[0],
      toMax: Math.ceil((classMaxStats[0] - (char?.stats?.maxHP ?? 0)) / 5)
    },
    {
      name: 'MP',
      value: char?.stats.maxMP ?? 0,
      maxed: (char?.stats?.maxMP ?? 0) >= classMaxStats[1],
      toMax: Math.ceil((classMaxStats[1] - (char?.stats?.maxMP ?? 0)) / 5)
    },
    {
      name: 'ATT',
      value: char?.stats?.attack ?? 0,
      maxed: (char?.stats?.attack ?? 0) >= classMaxStats[2],
      toMax: classMaxStats[2] - (char?.stats?.attack ?? 0)
    },
    {
      name: 'DEF',
      value: char?.stats?.defense ?? 0,
      maxed: (char?.stats?.defense ?? 0) >= classMaxStats[3],
      toMax: classMaxStats[3] - (char?.stats?.defense ?? 0)
    },
    {
      name: 'SPD',
      value: char?.stats?.speed ?? 0,
      maxed: (char?.stats?.speed ?? 0) >= classMaxStats[4],
      toMax: classMaxStats[4] - (char?.stats?.speed ?? 0)
    },
    {
      name: 'DEX',
      value: char?.stats?.dexterity ?? 0,
      maxed: (char?.stats?.dexterity ?? 0) >= classMaxStats[5],
      toMax: classMaxStats[5] - (char?.stats?.dexterity ?? 0)
    },
    {
      name: 'VIT',
      value: char?.stats?.vitality ?? 0,
      maxed: (char?.stats?.vitality ?? 0) >= classMaxStats[6],
      toMax: classMaxStats[6] - (char?.stats?.vitality ?? 0)
    },
    {
      name: 'WIS',
      value: char?.stats?.wisdom ?? 0,
      maxed: (char?.stats?.wisdom ?? 0) >= classMaxStats[7],
      toMax: classMaxStats[7] - (char?.stats?.wisdom ?? 0)
    }
  ];

  return (
    <div className={styles.character}>
      <div className={styles.header}>
        <CharacterPortrait
          type={char?.class!}
          skin={char?.texture!}
          tex1={char?.tex1!}
          tex2={char?.tex2!}
          adjust={false}
        />
        <div className={styles.info}>
          <div className={styles.boost}>{/* <img src={character.boost} alt="Boost" /> */}</div>
          <div className={`${styles.details} ${char?.seasonal ? styles.seasonal : ''}`}>
            <div className={styles.detailRow}>
              <span className={styles.charInfo}>
                {classObj[0]} {char?.level}
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

      <Stats stats={stats} classId={classId} exalts={exalts} />
      <Equipment
        equipment={equipment}
        inventory={inventory}
        backpack={backpack}
        quickslots={quickslots}
      />
    </div>
  );
};
