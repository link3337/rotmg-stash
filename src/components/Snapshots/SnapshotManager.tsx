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
import { selectShowAccountName } from '@store/slices/SettingsSlice';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import React, { useRef, useState } from 'react';
import './SnapshotManager.scss';

const ALL_ACCOUNTS = '__all__';
const CONFIRM_GROUP = 'snapshot-manager';

interface SnapshotManagerProps {
  visible: boolean;
  onHide: () => void;
}

const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat(navigator.language, { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(date)
  );

const sortNewestFirst = (items: AccountSnapshotMetadata[]) =>
  [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

const SnapshotManager: React.FC<SnapshotManagerProps> = ({ visible, onHide }) => {
  const dispatch = useAppDispatch();
  const snapshotView = useAppSelector(selectSnapshotView);
  const showAccountName = useAppSelector(selectShowAccountName);
  const { items: accounts } = useAccounts();
  const toastRef = useRef<Toast>(null);

  const [snapshots, setSnapshots] = useState<AccountSnapshotMetadata[]>([]);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [saveTarget, setSaveTarget] = useState<string>(ALL_ACCOUNTS);
  const [filter, setFilter] = useState<string>(ALL_ACCOUNTS);

  const accountLabel = (account: AccountModel) =>
    showAccountName ? account.mappedData?.account?.name || account.email || account.id : account.id;

  const accountOptions = [
    { label: 'All accounts', value: ALL_ACCOUNTS },
    ...accounts.map((acc) => ({ label: accountLabel(acc), value: acc.id }))
  ];

  const labelForSource = (id?: string) => {
    const account = accounts.find((acc) => acc.id === id);
    return account ? accountLabel(account) : id ? (showAccountName ? 'Removed account' : id) : '-';
  };

  const reload = async () => {
    setSnapshots(sortNewestFirst(await loadAccountSnapshotsMetadataFromDisk()));
  };

  const handleShow = () => {
    setName('');
    setSaveTarget(ALL_ACCOUNTS);
    setFilter(ALL_ACCOUNTS);
    setBusy(true);
    reload()
      .catch(() =>
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load snapshots'
        })
      )
      .finally(() => setBusy(false));
  };

  const showError = (detail: string) =>
    toastRef.current?.show({ severity: 'error', summary: 'Error', detail });

  const handleSave = async () => {
    const isSingle = saveTarget !== ALL_ACCOUNTS;
    const source = isSingle ? accounts.find((acc) => acc.id === saveTarget) : undefined;
    if (isSingle && !source) {
      showError('Selected account no longer exists');
      return;
    }

    const timestamp = new Intl.DateTimeFormat(navigator.language, {
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(new Date());
    const defaultName = isSingle ? `${accountLabel(source!)} ${timestamp}` : `All accounts ${timestamp}`;

    const snapshot: AccountSnapshotModel = {
      id: crypto.randomUUID(),
      name: name.trim() || defaultName,
      createdAt: new Date().toISOString(),
      accounts: JSON.parse(JSON.stringify(isSingle ? [source] : accounts)) as AccountModel[],
      scope: isSingle ? 'single' : 'all',
      sourceAccountId: isSingle ? saveTarget : undefined
    };

    try {
      setBusy(true);
      await saveAccountSnapshotToDisk(snapshot);
      await reload();
      setName('');
      toastRef.current?.show({
        severity: 'success',
        summary: 'Snapshot saved',
        detail: snapshot.name
      });
    } catch {
      showError('Failed to save snapshot');
    } finally {
      setBusy(false);
    }
  };

  const handleView = async (meta: AccountSnapshotMetadata) => {
    try {
      setBusy(true);
      const snapshot = await loadAccountSnapshotByIdFromDisk(meta.id);
      if (!snapshot) {
        showError('Failed to load snapshot');
        return;
      }

      const isSingle = snapshot.scope === 'single' && snapshot.sourceAccountId;
      let viewAccounts: AccountModel[];

      if (isSingle) {
        const saved = snapshot.accounts[0];
        if (!saved) {
          showError('Snapshot is missing account data');
          return;
        }
        // Show only the snapshotted account; force it visible even if it is inactive now
        viewAccounts = [{ ...saved, active: true }];
      } else {
        viewAccounts = snapshot.accounts;
      }

      dispatch(applyAccountsSnapshotTemporarily(viewAccounts));
      dispatch(
        setSnapshotView({
          snapshotId: snapshot.id,
          snapshotName: snapshot.name,
          createdAt: snapshot.createdAt,
          scope: isSingle ? 'single' : 'all',
          sourceAccountId: snapshot.sourceAccountId
        })
      );
      onHide();
    } catch {
      showError('Failed to open snapshot');
    } finally {
      setBusy(false);
    }
  };

  const handleExit = async () => {
    try {
      setBusy(true);
      await dispatch(initializeAccounts()).unwrap();
      dispatch(clearSnapshotView());
      toastRef.current?.show({
        severity: 'success',
        summary: 'Snapshot closed',
        detail: 'Showing your current data again.'
      });
    } catch {
      showError('Failed to return to current data');
    } finally {
      setBusy(false);
    }
  };

  const deleteSnapshot = async (id: string) => {
    try {
      setBusy(true);
      await deleteAccountSnapshotFromDisk(id);
      await reload();
    } catch {
      showError('Failed to delete snapshot');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = (meta: AccountSnapshotMetadata) =>
    confirmDialog({
      group: CONFIRM_GROUP,
      header: 'Delete snapshot',
      message: `Delete "${meta.name}"? This cannot be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => deleteSnapshot(meta.id)
    });

  const filtered = snapshots.filter((s) =>
    filter === ALL_ACCOUNTS ? true : s.scope === 'single' && s.sourceAccountId === filter
  );

  const filterOptions = [{ label: 'Show all snapshots', value: ALL_ACCOUNTS }, ...accountOptions.slice(1)];

  return (
    <>
      <Toast ref={toastRef} position="bottom-right" />
      <ConfirmDialog group={CONFIRM_GROUP} />
      <Dialog
        visible={visible}
        onHide={onHide}
        onShow={handleShow}
        header="Snapshots"
        style={{ width: '56rem' }}
        className="snapshot-manager-dialog"
        modal
      >
        <p className="snapshot-manager-subtitle mt-0">
          A snapshot is a saved copy of your account data. Create one before big changes, then open it
          later to look at the old data. Opening a snapshot never changes your current data.
        </p>

        {snapshotView.active && (
          <div className="snapshot-manager-active">
            <i className="pi pi-eye" />
            <span className="flex-1">
              Currently viewing <strong>{snapshotView.snapshotName}</strong>
            </span>
            <Button
              label="Exit snapshot view"
              icon="pi pi-times"
              size="small"
              severity="warning"
              onClick={handleExit}
              loading={busy}
            />
          </div>
        )}

        <div className="snapshot-manager-section">
          <div className="snapshot-manager-section-title">1. Create a snapshot</div>
          {snapshotView.active ? (
            <div className="snapshot-manager-subtitle">
              Exit the snapshot view to create a new snapshot of your current data.
            </div>
          ) : (
            <div className="snapshot-manager-form">
              <Dropdown
                value={saveTarget}
                options={accountOptions}
                onChange={(e) => setSaveTarget(e.value)}
                filter
                aria-label="What to save"
                className="snapshot-manager-form-target"
              />
              <InputText
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !busy && handleSave()}
                placeholder="Name (optional)"
                className="flex-1"
              />
              <Button label="Save" icon="pi pi-save" onClick={handleSave} loading={busy} />
            </div>
          )}
        </div>

        <div className="snapshot-manager-section">
          <div className="flex align-items-center justify-content-between gap-2 mb-2">
            <div className="snapshot-manager-section-title mb-0">2. Open or delete a saved snapshot</div>
            <Dropdown
              value={filter}
              options={filterOptions}
              onChange={(e) => setFilter(e.value)}
              filter
              aria-label="Filter snapshots"
              style={{ minWidth: '14rem' }}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="snapshot-manager-empty">
              <i className="pi pi-inbox snapshot-manager-empty-icon" />
              <div className="snapshot-manager-empty-title">No snapshots yet</div>
              <div className="snapshot-manager-empty-text">
                Pick what to save above and press Save.
              </div>
            </div>
          ) : (
            <DataTable
              value={filtered}
              dataKey="id"
              className="snapshot-manager-table"
              stripedRows
              paginator
              rows={6}
              rowClassName={(row: AccountSnapshotMetadata) =>
                snapshotView.snapshotId === row.id ? 'snapshot-manager-row-active' : ''
              }
            >
              <Column
                header="Name"
                body={(row: AccountSnapshotMetadata) => (
                  <div className="snapshot-manager-row-name">
                    {row.name}
                    {snapshotView.snapshotId === row.id && (
                      <span className="snapshot-manager-scope-pill snapshot-manager-scope-pill-global ml-2">
                        Viewing
                      </span>
                    )}
                  </div>
                )}
              />
              <Column
                header="Contains"
                body={(row: AccountSnapshotMetadata) =>
                  row.scope === 'single'
                    ? labelForSource(row.sourceAccountId)
                    : `All accounts (${row.accountCount})`
                }
                style={{ width: '12rem' }}
              />
              <Column
                header="Created"
                body={(row: AccountSnapshotMetadata) => (
                  <span className="snapshot-manager-row-meta">{formatDate(row.createdAt)}</span>
                )}
                style={{ width: '9rem' }}
              />
              <Column
                header=""
                body={(row: AccountSnapshotMetadata) => (
                  <div className="snapshot-manager-row-actions">
                    <Button
                      label="Open"
                      icon="pi pi-eye"
                      size="small"
                      outlined
                      onClick={() => handleView(row)}
                      disabled={busy || snapshotView.snapshotId === row.id}
                    />
                    <Button
                      icon="pi pi-trash"
                      size="small"
                      text
                      severity="danger"
                      aria-label="Delete snapshot"
                      tooltip="Delete snapshot"
                      tooltipOptions={{ position: 'top' }}
                      onClick={() => confirmDelete(row)}
                      disabled={busy}
                    />
                  </div>
                )}
                style={{ width: '9rem' }}
              />
            </DataTable>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default SnapshotManager;
