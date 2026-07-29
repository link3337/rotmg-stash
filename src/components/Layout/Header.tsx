import { AccountModel } from '@/cache/account-model';
import { AccountSnapshotMetadata, AccountSnapshotModel } from '@cache/account-snapshot-model';
import {
  deleteAccountSnapshotFromDisk,
  loadAccountSnapshotByIdFromDisk,
  loadAccountSnapshotsMetadataFromDisk,
  saveAccountSnapshotToDisk
} from '@cache/localstorage-service';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import {
  applyAccountsSnapshotTemporarily,
  clearSnapshotView,
  initializeAccounts,
  selectSnapshotView,
  setSnapshotView,
  useAccounts
} from '@store/slices/AccountsSlice';
import { selectIsSettingsOpen, setSettingsVisible } from '@store/slices/LayoutSlice';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import React, { useRef, useState } from 'react';
import AccountSnapshotDialogs from '../Settings/AccountTable/AccountSnapshotDialogs';
import Configuration from '../Settings/Configuration';
import styles from './Header.module.scss';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const settingsVisible = useAppSelector(selectIsSettingsOpen);
  const snapshotView = useAppSelector(selectSnapshotView);
  const { items: accounts } = useAccounts();
  const toastRef = useRef<Toast>(null);
  const [showSaveSnapshotDialog, setShowSaveSnapshotDialog] = useState(false);
  const [showSnapshotManagerDialog, setShowSnapshotManagerDialog] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshots, setSnapshots] = useState<AccountSnapshotMetadata[]>([]);
  const [isSnapshotActionLoading, setIsSnapshotActionLoading] = useState(false);

  const formatSnapshotName = () => {
    const now = new Date();
    const timestamp = new Intl.DateTimeFormat(navigator.language, {
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(now);

    return `Snapshot ${timestamp}`;
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat(navigator.language, {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(date));
  };

  const openSaveSnapshotDialog = () => {
    setSnapshotName(formatSnapshotName());
    setShowSaveSnapshotDialog(true);
  };

  const openSnapshotManagerDialog = async () => {
    try {
      setIsSnapshotActionLoading(true);
      const loadedSnapshots = await loadAccountSnapshotsMetadataFromDisk();
      const globalSnapshots = loadedSnapshots.filter((snapshot) => snapshot.scope !== 'single');
      setSnapshots(
        [...globalSnapshots].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      setShowSnapshotManagerDialog(true);
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to open snapshot manager'
      });
    } finally {
      setIsSnapshotActionLoading(false);
    }
  };

  const handleSaveSnapshot = async () => {
    const trimmedName = snapshotName.trim();
    if (!trimmedName) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Snapshot name is required'
      });
      return;
    }

    try {
      setIsSnapshotActionLoading(true);
      const newSnapshot: AccountSnapshotModel = {
        id: crypto.randomUUID(),
        name: trimmedName,
        createdAt: new Date().toISOString(),
        accounts: JSON.parse(JSON.stringify(accounts)) as AccountModel[],
        scope: 'all'
      };

      await saveAccountSnapshotToDisk(newSnapshot);
      const reloadedMetadata = await loadAccountSnapshotsMetadataFromDisk();
      const globalSnapshots = reloadedMetadata.filter((snapshot) => snapshot.scope !== 'single');
      setSnapshots(
        [...globalSnapshots].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      setShowSaveSnapshotDialog(false);

      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `Saved snapshot "${trimmedName}"`
      });
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save snapshot'
      });
    } finally {
      setIsSnapshotActionLoading(false);
    }
  };

  const handleLoadSnapshotTemporarily = async (snapshotMeta: AccountSnapshotMetadata) => {
    const snapshot = await loadAccountSnapshotByIdFromDisk(snapshotMeta.id);
    if (!snapshot) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load snapshot payload'
      });
      return;
    }

    const isSingleSnapshot = snapshot.scope === 'single' && snapshot.sourceAccountId;

    if (isSingleSnapshot) {
      const savedAccount = snapshot.accounts[0];
      if (!savedAccount) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Snapshot is missing account data'
        });
        return;
      }

      const existingIndex = accounts.findIndex((acc) => acc.id === snapshot.sourceAccountId);
      const updatedAccounts =
        existingIndex !== -1
          ? accounts.map((acc) => (acc.id === snapshot.sourceAccountId ? { ...savedAccount } : acc))
          : [...accounts, { ...savedAccount }];

      dispatch(applyAccountsSnapshotTemporarily(updatedAccounts));
    } else {
      dispatch(applyAccountsSnapshotTemporarily(snapshot.accounts));
    }

    dispatch(
      setSnapshotView({
        snapshotId: snapshot.id,
        snapshotName: snapshot.name,
        createdAt: snapshot.createdAt,
        scope: isSingleSnapshot ? 'single' : 'all',
        sourceAccountId: snapshot.sourceAccountId
      })
    );
    setShowSnapshotManagerDialog(false);
    toastRef.current?.show({
      severity: 'warn',
      summary: 'Snapshot Loaded',
      detail: 'Snapshot is loaded temporarily. Use restore to return to the latest saved data.'
    });
  };

  const handleRestoreSavedData = async () => {
    try {
      setIsSnapshotActionLoading(true);
      await dispatch(initializeAccounts()).unwrap();
      dispatch(clearSnapshotView());
      toastRef.current?.show({
        severity: 'success',
        summary: 'Restored',
        detail: 'Restored latest saved account data from local storage and disk.'
      });
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to restore saved account data'
      });
    } finally {
      setIsSnapshotActionLoading(false);
    }
  };

  const handleDeleteSnapshot = async (snapshotId: string) => {
    try {
      setIsSnapshotActionLoading(true);
      await deleteAccountSnapshotFromDisk(snapshotId);
      const reloadedMetadata = await loadAccountSnapshotsMetadataFromDisk();
      const globalSnapshots = reloadedMetadata.filter((snapshot) => snapshot.scope !== 'single');
      setSnapshots(
        [...globalSnapshots].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );

      toastRef.current?.show({
        severity: 'success',
        summary: 'Deleted',
        detail: 'Snapshot deleted'
      });
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete snapshot'
      });
    } finally {
      setIsSnapshotActionLoading(false);
    }
  };

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
          className={styles.headerButton + ' p-button-outlined p-button-rounded'}
          onClick={openSnapshotManagerDialog}
          disabled={isSnapshotActionLoading}
        />
        <Button
          severity="contrast"
          icon="pi pi-cog"
          className={styles.headerButton + ' p-button-rounded'}
          onClick={() => dispatch(setSettingsVisible(true))}
        />
      </div>

      <Toast ref={toastRef} position="bottom-right" />
      <AccountSnapshotDialogs
        showSaveSnapshotDialog={showSaveSnapshotDialog}
        onHideSaveSnapshotDialog={() => setShowSaveSnapshotDialog(false)}
        snapshotName={snapshotName}
        onSnapshotNameChange={setSnapshotName}
        isSnapshotActionLoading={isSnapshotActionLoading}
        onSaveSnapshot={handleSaveSnapshot}
        showSnapshotManagerDialog={showSnapshotManagerDialog}
        onHideSnapshotManagerDialog={() => setShowSnapshotManagerDialog(false)}
        snapshotRows={snapshots}
        snapshotView={snapshotView}
        onOpenSaveSnapshotDialog={openSaveSnapshotDialog}
        onRestoreSavedData={handleRestoreSavedData}
        onLoadSnapshotTemporarily={handleLoadSnapshotTemporarily}
        onDeleteSnapshot={handleDeleteSnapshot}
        formatDate={formatDate}
      />

      <Configuration visible={settingsVisible} onHide={() => dispatch(setSettingsVisible(false))} />
    </header>
  );
};

export default Header;
