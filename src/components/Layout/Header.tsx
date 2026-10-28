import { useAppDispatch, useAppSelector } from '@hooks/redux';
import { selectSnapshotView } from '@store/slices/AccountsSlice';
import { selectIsSettingsOpen, setSettingsVisible } from '@store/slices/LayoutSlice';
import { Button } from 'primereact/button';
import React, { useState } from 'react';
import SnapshotManager from '../Snapshots/SnapshotManager';
import Configuration from '../Settings/Configuration';
import styles from './Header.module.scss';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const settingsVisible = useAppSelector(selectIsSettingsOpen);
  const snapshotView = useAppSelector(selectSnapshotView);
  const [showSnapshots, setShowSnapshots] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <img src="/app-icon.png" alt="rotmg-stash-icon" className={styles.logo} />
        <h1 className={styles.headerTitle}>RotMG Stash</h1>
      </div>

      <div className={styles.headerActions}>
        <Button
          label="Snapshots"
          icon="pi pi-history"
          className={styles.headerButton + ' p-button-rounded'}
          outlined={!snapshotView.active}
          severity={snapshotView.active ? 'warning' : undefined}
          onClick={() => setShowSnapshots(true)}
        />
        <Button
          severity="contrast"
          icon="pi pi-cog"
          className={styles.headerButton + ' p-button-rounded'}
          onClick={() => dispatch(setSettingsVisible(true))}
        />
      </div>

      <SnapshotManager visible={showSnapshots} onHide={() => setShowSnapshots(false)} />
      <Configuration visible={settingsVisible} onHide={() => dispatch(setSettingsVisible(false))} />
    </header>
  );
};

export default Header;
