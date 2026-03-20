import { useConstants } from '@/providers/ConstantsProvider';
import { ClassID } from '@/realm/renders/classes';
import { exaltStats } from '@/realm/renders/exalts';
import { ExaltUIModel } from '@api/models/exalt-ui-model';
import { Tooltip } from 'primereact/tooltip';
import styles from './Exalts.module.scss';
import './Stats.scss';

interface ExaltsProps {
  exalts: ExaltUIModel[] | null;
}

const Exalts: React.FC<ExaltsProps> = ({ exalts }) => {
  // no exalts, don't render anything
  if (!exalts) return <></>;

  const renderValue = (cell: string) => {
    return parseInt(cell) > 75 ? 75 : cell;
  };

  const { constants } = useConstants();

  const getClassName = (classId: string) => {
    const classInfo = constants?.classes?.[classId as ClassID];
    return classInfo ? classInfo.name : 'Unknown';
  };

  const orderedExaltStats = ['HP', 'MP', 'ATT', 'DEF', 'SPD', 'DEX', 'VIT', 'WIS'];

  // determine which stats are fully exalted (all classes have 75+ for that stat)
  const fullyExaltedStats = new Set<string>();
  orderedExaltStats.forEach((stat) => {
    const originalIndex = exaltStats.indexOf(stat);
    const allFull = exalts.every((r) => parseInt(r.exalts[originalIndex] || '0', 10) >= 75);
    if (allFull) fullyExaltedStats.add(stat);
  });

  const mapToOrderedExalts = (exalts: string[]) => {
    const orderedValues: string[] = [];
    orderedExaltStats.forEach((stat) => {
      const index = exaltStats.indexOf(stat);
      orderedValues.push(exalts[index]);
    });
    return orderedValues;
  };

  const sortedExalts = [...exalts].sort((a, b) =>
    getClassName(a.classId).localeCompare(getClassName(b.classId))
  );

  const renderExaltCell = (exaltValue: string, cellIndex: number) => {
    const stat = orderedExaltStats[cellIndex];
    const valueNum = parseInt(exaltValue, 10) || 0;
    const isCellMax = valueNum >= 75;
    const cellClass = isCellMax || fullyExaltedStats.has(stat) ? styles.golden : undefined;
    const showTooltip = isCellMax;
    const tooltipProps = showTooltip
      ? {
          'data-pr-tooltip': exaltValue,
          'aria-label': `Exalt ${stat}: ${exaltValue}`
        }
      : {};
    const tabIndex = showTooltip ? 0 : -1;

    return (
      <td key={cellIndex} className={cellClass}>
        <span {...tooltipProps} tabIndex={tabIndex}>
          {renderValue(exaltValue)}
        </span>
      </td>
    );
  };

  return (
    <>
      <h2 style={{ textAlign: 'center' }}>Exalts</h2>
      <div className={styles.exalts}>
        <Tooltip position="top" target="[data-pr-tooltip]" />
        <table>
          <thead>
            <tr>
              <th>Class</th>
              {orderedExaltStats.map((stat, index) => (
                <th key={index} className={stat}>
                  {stat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedExalts.map((row, rowIndex) => {
              const orderedValues = mapToOrderedExalts(row.exalts);
              const isFullyExalted = orderedValues.every((cell) => parseInt(cell, 10) >= 75);

              return (
                <tr key={rowIndex} className={isFullyExalted ? styles.golden : undefined}>
                  <td>{getClassName(row.classId)}</td>
                  {orderedValues.map((exaltValue, cellIndex) =>
                    renderExaltCell(exaltValue, cellIndex)
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Exalts;
