import { Card } from 'primereact/card';
import packageJson from './../../../../package.json';
import styles from './About.module.scss';

const GeneralInfo: React.FC = () => {
  return (
    <Card className={styles.infoCard}>
      <h3 className="text-center mb-4">RotMG Stash</h3>
      <p className="text-center">
        RotMG Stash is a tool that allows you to manage and organize your Realm of the Mad God
        accounts.
      </p>
      <p className="text-center">Version: {packageJson.version}</p>
      <p className="text-center">Made by Lingo with ❤️</p>
      <div className="flex flex-column align-items-center gap-2 mt-2">
        <a
          href="https://github.com/link3337/rotmg-stash"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary-700 transition-colors flex align-items-center gap-2"
        >
          <i className="pi pi-github text-xl"></i>
          <span>View on GitHub</span>
        </a>
        <p className="text-center text-sm text-500 mt-2">
          Need help? Add me on Discord: <span className="font-semibold">lingo1337</span>
        </p>
      </div>
    </Card>
  );
};

export default GeneralInfo;
