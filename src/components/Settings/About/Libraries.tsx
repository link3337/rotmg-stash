import { Card } from 'primereact/card';
import styles from './About.module.scss';
import { libraries } from './library-info';

const Libraries: React.FC = () => {
  return (
    <Card className={styles.infoCard}>
      <h3 className="text-center mb-4">Libraries used</h3>
      <div className="grid">
        {libraries.map((lib) => (
          <div key={lib.name} className="col-2">
            <div className="flex align-items-center gap-2">
              {lib.icon && (
                <img src={`/${lib.icon}.svg`} alt={`${lib.name} logo`} width={24} height={24} />
              )}
              <div>
                <div className="font-bold">{lib.name}</div>
                <div className="text-sm text-500">v{lib.version}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default Libraries;
