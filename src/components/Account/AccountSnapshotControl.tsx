import { AccountModel } from '@cache/account-model';
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
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import React, { useState } from 'react';
import '../Snapshots/SnapshotManager.scss';

interface AccountSnapshotControlProps {
  account: AccountModel;
  accountDisplayName: string;
  isStreamerMode: boolean;
  className?: string;
}

const AccountSnapshotControl: React.FC<AccountSnapshotControlProps> = ({
  account,
  accountDisplayName,
  isStreamerMode,
  className
}) => {
  const dispatch = useAppDispatch();
  const snapshotView = useAppSelector(selectSnapshotView);
  const { items: allAccounts } = useAccounts();
  const [visible, setVisible] = useState(false);
  const [snapshots, setSnapshots] = useState<AccountSnapshotMetadata[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [activeActionSnapshotId, setActiveActionSnapshotId] = useState<string | null>(null);
  const toastRef = React.useRef<Toast>(null);

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(navigator.language, {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(date));
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null || Number.isNaN(bytes)) return '-';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }

    const precision = size >= 10 || unitIndex === 0 ? 0 : 1;
    return `${size.toFixed(precision)} ${units[unitIndex]}`;
  };

  const loadSnapshots = async () => {
    const loadedSnapshots = await loadAccountSnapshotsMetadataFromDisk();
    const filtered = loadedSnapshots
      .filter((snapshot) => snapshot.scope === 'single' && snapshot.sourceAccountId === account.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setSnapshots(filtered);
  };

  const openDialog = async () => {
    setVisible(true);
    try {
      setIsOpening(true);
      await loadSnapshots();
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load account snapshots'
      });
    } finally {
      setIsOpening(false);
    }
  };

  const handleSaveSnapshot = async () => {
    try {
      setIsSaving(true);
      const accountLabel = isStreamerMode ? account.id : account.mappedData?.account?.name || account.email;
      const timestamp = new Intl.DateTimeFormat(navigator.language, {
        dateStyle: 'short',
        timeStyle: 'medium'
      }).format(new Date());

      const singleAccountSnapshot: AccountSnapshotModel = {
        id: crypto.randomUUID(),
        name: `${accountLabel} snapshot ${timestamp}`,
        createdAt: new Date().toISOString(),
        accounts: [JSON.parse(JSON.stringify(account)) as AccountModel],
        scope: 'single',
        sourceAccountId: account.id
      };

      await saveAccountSnapshotToDisk(singleAccountSnapshot);
      await loadSnapshots();
      toastRef.current?.show({
        severity: 'success',
        summary: 'Snapshot Saved',
        detail: 'Saved snapshot for this account'
      });
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save account snapshot'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreSavedData = async () => {
    try {
      setIsRestoring(true);
      await dispatch(initializeAccounts()).unwrap();
      dispatch(clearSnapshotView());
      setVisible(false);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Restored',
        detail: 'Returned to the latest saved account data.'
      });
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to restore saved account data'
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleLoadSnapshot = async (snapshotMeta: AccountSnapshotMetadata) => {
    setActiveActionSnapshotId(snapshotMeta.id);
    const snapshot = await loadAccountSnapshotByIdFromDisk(snapshotMeta.id);
    if (!snapshot) {
      setActiveActionSnapshotId(null);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load account snapshot'
      });
      return;
    }

    const savedAccount = snapshot.accounts[0];
    if (!savedAccount) {
      setActiveActionSnapshotId(null);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Snapshot is missing account data'
      });
      return;
    }

    const updatedAccounts = allAccounts.map((acc) => (acc.id === account.id ? savedAccount : acc));
    dispatch(applyAccountsSnapshotTemporarily(updatedAccounts));
    dispatch(
      setSnapshotView({
        snapshotId: snapshot.id,
        snapshotName: snapshot.name,
        createdAt: snapshot.createdAt,
        scope: 'single',
        sourceAccountId: snapshot.sourceAccountId
      })
    );
    toastRef.current?.show({
      severity: 'warn',
      summary: 'Snapshot Loaded',
      detail: 'Loaded account snapshot temporarily. You can load another snapshot from this dialog.'
    });
    setActiveActionSnapshotId(null);
  };

  const handleDeleteSnapshot = async (snapshotId: string) => {
    try {
      setActiveActionSnapshotId(snapshotId);
      await deleteAccountSnapshotFromDisk(snapshotId);
      await loadSnapshots();
      toastRef.current?.show({
        severity: 'success',
        summary: 'Deleted',
        detail: 'Account snapshot deleted'
      });
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete account snapshot'
      });
    } finally {
      setActiveActionSnapshotId(null);
    }
  };

  return (
    <>
      <Toast ref={toastRef} position="bottom-right" />
      <Button
        label="Snapshots"
        icon="pi pi-history"
        outlined
        className={className}
        onClick={openDialog}
        loading={isOpening && !visible}
      />

      <Dialog
        visible={visible}
        onHide={() => setVisible(false)}
        header="Account Snapshots"
        style={{ width: '42rem' }}
        className="snapshot-manager-dialog"
        modal
      >
        <div className="snapshot-manager-panel snapshot-manager-panel-compact">
          <div className="snapshot-manager-headline">
            <div>
              <div className="snapshot-manager-title">Per-Account Snapshot Manager</div>
              <div className="snapshot-manager-subtitle">
                Manage snapshots for {isStreamerMode ? account.id : accountDisplayName}.
              </div>
            </div>
            <div className="snapshot-manager-stats">
              <span className="snapshot-manager-stat">
                <i className="pi pi-database" />
                {snapshots.length} saved
              </span>
              <span className="snapshot-manager-stat">
                <i className="pi pi-file" />
                {formatFileSize(snapshots[0]?.sizeBytes)}
              </span>
              {snapshotView.active && (
                <span className="snapshot-manager-stat snapshot-manager-stat-active">
                  <i className="pi pi-history" />
                  Active snapshot
                </span>
              )}
            </div>
          </div>

          <div className="snapshot-manager-toolbar">
            <div className="snapshot-manager-toolbar-copy">
              <i className="pi pi-lightbulb" />
              <span>Snapshots load temporarily until you return to saved data.</span>
            </div>
            <div className="snapshot-manager-toolbar-actions">
              <Button
                label="Save Current"
                icon="pi pi-save"
                className="p-button-sm"
                onClick={handleSaveSnapshot}
                loading={isSaving}
              />
              {snapshotView.active && (
                <Button
                  label="Return to Normal View"
                  icon="pi pi-undo"
                  className="p-button-sm"
                  severity="warning"
                  outlined
                  onClick={handleRestoreSavedData}
                  loading={isRestoring}
                />
              )}
            </div>
          </div>
        </div>

        {snapshots.length === 0 ? (
          <div className="snapshot-manager-empty">
            <i className="pi pi-inbox snapshot-manager-empty-icon" />
            <div className="snapshot-manager-empty-title">No snapshots for this account</div>
            <div className="snapshot-manager-empty-text">
              Use Save Current to preserve this account before making changes.
            </div>
          </div>
        ) : (
          <DataTable
            value={snapshots}
            dataKey="id"
            tableStyle={{ minWidth: '30rem' }}
            className="snapshot-manager-table"
            showGridlines
            stripedRows
            paginator
            rows={6}
            rowsPerPageOptions={[6, 12, 24]}
          >
            <Column
              field="name"
              header="Snapshot"
              body={(row: AccountSnapshotMetadata) => (
                <div className="snapshot-manager-row-name">
                  {row.name}
                  {snapshotView.snapshotId === row.id && (
                    <span className="snapshot-manager-scope-pill ml-2">Active</span>
                  )}
                </div>
              )}
            />
            <Column
              field="createdAt"
              header="Created"
              body={(row: AccountSnapshotMetadata) => (
                <div className="snapshot-manager-row-meta">
                  <i className="pi pi-calendar" />
                  <span>{formatDate(row.createdAt)}</span>
                </div>
              )}
              style={{ width: '10rem' }}
            />
            <Column
              header="Actions"
              body={(row: AccountSnapshotMetadata) => (
                <div className="snapshot-manager-row-actions">
                  <Button
                    icon="pi pi-history"
                    className="p-button-sm p-button-rounded p-button-text"
                    tooltip="Load account snapshot"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => handleLoadSnapshot(row)}
                    loading={activeActionSnapshotId === row.id}
                    disabled={activeActionSnapshotId !== null && activeActionSnapshotId !== row.id}
                  />
                  <Button
                    icon="pi pi-trash"
                    className="p-button-sm p-button-rounded p-button-text p-button-danger"
                    tooltip="Delete account snapshot"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => handleDeleteSnapshot(row.id)}
                    disabled={activeActionSnapshotId !== null}
                  />
                </div>
              )}
              style={{ width: '8rem' }}
            />
          </DataTable>
        )}
      </Dialog>
    </>
  );
};

export default React.memo(AccountSnapshotControl);
