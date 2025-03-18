import { ExaltUIModel } from '@api/models/exalt-ui-model';
import { classes, ClassID, exaltStats } from '@realm/renders/classes';
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

  const orderedExaltStats = ['HP', 'MP', 'ATT', 'DEF', 'SPD', 'DEX', 'VIT', 'WIS'];

  const mapToOrderedExalts = (exalts: string[]) => {
    const orderedValues: string[] = [];
    orderedExaltStats.forEach((stat) => {
      const index = exaltStats.indexOf(stat);
      orderedValues.push(exalts[index]);
    });
    return orderedValues;
  };

  return (
    <>
      <h2 style={{ textAlign: 'center' }}>Exalts</h2>
      <div className={styles.exalts}>
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
            {exalts?.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td>{classes[parseInt(row.classId) as ClassID][0]}</td>
                {mapToOrderedExalts(row.exalts).map((cell, cellIndex) => (
                  <td key={cellIndex}>{renderValue(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Exalts;
