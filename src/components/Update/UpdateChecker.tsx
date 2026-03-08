import { open } from '@tauri-apps/plugin-shell';
import { checkGithubUpdate, normalizeVersion } from '@utils/update-check';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useEffect, useRef } from 'react';
import packageJson from '../../../package.json';

const UpdateChecker = () => {
  const updateCheckRan = useRef(false);

  useEffect(() => {
    if (updateCheckRan.current) return;
    updateCheckRan.current = true;

    const runStartupUpdateCheck = async () => {
      const result = await checkGithubUpdate(packageJson.version);

      if (!result.hasUpdate || !result.latestTag || !result.releaseUrl) {
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
    };

    void runStartupUpdateCheck();
  }, []);

  return <ConfirmDialog />;
};

export default UpdateChecker;
