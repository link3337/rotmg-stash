import { open } from '@tauri-apps/plugin-shell';
import { checkGithubUpdate, normalizeVersion } from '@utils/update-check';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { useRef, useState } from 'react';
import packageJson from './../../../../package.json';
import styles from './About.module.scss';

const GeneralInfo: React.FC = () => {
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const toastRef = useRef<Toast>(null);

  const handleManualUpdateCheck = async () => {
    setIsCheckingUpdate(true);

    try {
      const result = await checkGithubUpdate(packageJson.version);

      if (result.error) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Update Check Failed',
          detail: result.error
        });
        return;
      }

      if (!result.hasUpdate || !result.latestTag || !result.releaseUrl) {
        toastRef.current?.show({
          severity: 'info',
          summary: 'Up To Date',
          detail: `You are running the latest version (${normalizeVersion(packageJson.version)}).`
        });
        return;
      }

      const latestTag = result.latestTag;
      const releaseUrl = result.releaseUrl;

      const shouldOpenRelease = await new Promise<boolean>((resolve) => {
        confirmDialog({
          message: `Update available: ${normalizeVersion(latestTag)} (installed ${normalizeVersion(
            packageJson.version
          )}). Open release page?`,
          header: 'Update Available',
          icon: 'pi pi-info-circle',
          acceptLabel: 'Open Release',
          rejectLabel: 'Later',
          accept: () => resolve(true),
          reject: () => resolve(false),
          onHide: () => resolve(false)
        });
      });

      if (shouldOpenRelease) {
        await open(releaseUrl);
      }
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  return (
    <Card className={styles.infoCard}>
      <Toast ref={toastRef} position="top-center" className={styles.updateToast} />
      <ConfirmDialog />
      <h3 className="text-center mb-4">RotMG Stash</h3>
      <p className="text-center">
        RotMG Stash is a tool that allows you to manage and organize your Realm of the Mad God
        accounts.
      </p>
      <p className="text-center">Version: {packageJson.version}</p>
      <div className="flex justify-content-center mt-2">
        <Button
          label={isCheckingUpdate ? 'Checking...' : 'Check For Updates'}
          icon="pi pi-refresh"
          outlined
          loading={isCheckingUpdate}
          onClick={() => {
            void handleManualUpdateCheck();
          }}
        />
      </div>
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
