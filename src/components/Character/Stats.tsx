import { ExaltUIModel } from '@api/models/exalt-ui-model';
import { ClassID, exaltStats } from '@realm/renders/classes';
import React from 'react';
import { CharacterStats } from '../Account/types';
import styles from './../Character/Characters.module.scss';

interface StatsProps {
  stats: CharacterStats[];
  classId: ClassID;
  exalts: ExaltUIModel[] | null;
}

const getStatClassName = (stat: CharacterStats): string => {
  return [styles.stat, stat.maxed && styles.maxed].filter(Boolean).join(' ');
};

const getExaltValue = (value: number): number => {
  const exaltRanges = [
    { max: 5, value: 0 },
    { max: 15, value: 1 },
    { max: 30, value: 2 },
    { max: 50, value: 3 },
    { max: 75, value: 4 }
  ];

  const range = exaltRanges.find((range) => value < range.max);
  return range ? range.value : 5;
};

const calculateExalt = (statName: string, value: number): number => {
  if (isNaN(value)) return 0;

  let exaltValue = getExaltValue(value);

  // Multiply HP and MP exalts by 5
  if (statName === 'HP' || statName === 'MP') {
    exaltValue *= 5;
  }

  return exaltValue;
};

const getExaltBonus = (
  classId: ClassID,
  statName: string,
  exalts?: ExaltUIModel[] | null
): number => {
  if (!exalts || !classId) return 0;

  const classExalts = exalts.find((exalt) => (parseInt(exalt.classId) as ClassID) === classId);
  if (!classExalts) return 0;

  const statIndex = exaltStats.indexOf(statName);

  if (statIndex === undefined) return 0;

  const additionalStat = calculateExalt(statName, parseInt(classExalts.exalts[statIndex]));
  return additionalStat;
};

const renderExaltBonus = (
  classId: ClassID,
  statName: string,
  exalts?: ExaltUIModel[] | null
): string => {
  const exaltBonus = getExaltBonus(classId, statName, exalts);
  return exaltBonus ? `(+${exaltBonus})` : '';
};

export const Stats: React.FC<StatsProps> = ({ stats, classId, exalts }) => {
  // Ensure even number of stats by padding if necessary
  const paddedStats =
    stats.length % 2 === 0 ? stats : [...stats, { name: '', value: 0, maxed: false, toMax: 0 }];

  const statPairs = paddedStats.reduce<[CharacterStats, CharacterStats][]>((pairs, stat, index) => {
    if (index % 2 === 0) {
      pairs.push([stat, paddedStats[index + 1]]);
    }
    return pairs;
  }, []);

  return (
    <table className={styles.stats} role="table" aria-label="Character Statistics">
      <tbody>
        {statPairs.map(([leftStat, rightStat], index) => (
          <tr key={index}>
            {[leftStat, rightStat].map((stat, statIndex) => (
              <React.Fragment key={statIndex}>
                <td className={getStatClassName(stat)}>
                  {stat.name && (
                    <>
                      <span className={styles.statName}>{stat.name}</span>
                      <span>
                        {stat.value}
                        <span className={styles.exaltBonus}>
                          {renderExaltBonus(classId, stat.name, exalts)}
                        </span>
                      </span>
                    </>
                  )}
                </td>
              </React.Fragment>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
