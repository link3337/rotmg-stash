import { useAppDispatch, useAppSelector } from '@hooks/redux';
import { selectIsSettingsOpen, setSettingsVisible } from '@store/slices/LayoutSlice';
import { Button } from 'primereact/button';
import React from 'react';
import Configuration from '../Settings/Configuration';
import styles from './Header.module.scss';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const settingsVisible = useAppSelector(selectIsSettingsOpen);

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <img src="/app-icon.png" alt="rotmg-stash-icon" className={styles.logo} />
        <h1 className={styles.headerTitle}>RotMG Stash</h1>
      </div>
      <Button
        severity="contrast"
        icon="pi pi-cog"
        className={styles.headerButton + ' p-button-rounded'}
        onClick={() => dispatch(setSettingsVisible(true))}
      />

      <Configuration visible={settingsVisible} onHide={() => dispatch(setSettingsVisible(false))} />
    </header>
  );
};

export default Header;
