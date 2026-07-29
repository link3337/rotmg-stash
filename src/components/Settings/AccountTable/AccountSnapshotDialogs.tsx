import { AccountSnapshotMetadata } from '@cache/account-snapshot-model';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import React from 'react';
import '../../Snapshots/SnapshotManager.scss';

interface SnapshotViewState {
    active: boolean;
    snapshotId?: string;
    snapshotName?: string;
    createdAt?: string;
    scope?: 'all' | 'single';
    sourceAccountId?: string;
}

interface AccountSnapshotDialogsProps {
    showSaveSnapshotDialog: boolean;
    onHideSaveSnapshotDialog: () => void;
    snapshotName: string;
    onSnapshotNameChange: (value: string) => void;
    isSnapshotActionLoading: boolean;
    onSaveSnapshot: () => void;
    showSnapshotManagerDialog: boolean;
    onHideSnapshotManagerDialog: () => void;
    snapshotRows: AccountSnapshotMetadata[];
    snapshotView: SnapshotViewState;
    onOpenSaveSnapshotDialog: () => void;
    onRestoreSavedData: () => void;
    onLoadSnapshotTemporarily: (snapshot: AccountSnapshotMetadata) => void;
    onDeleteSnapshot: (snapshotId: string) => void;
    formatDate: (date: string | Date) => string;
}

const AccountSnapshotDialogs: React.FC<AccountSnapshotDialogsProps> = ({
    showSaveSnapshotDialog,
    onHideSaveSnapshotDialog,
    snapshotName,
    onSnapshotNameChange,
    isSnapshotActionLoading,
    onSaveSnapshot,
    showSnapshotManagerDialog,
    onHideSnapshotManagerDialog,
    snapshotRows,
    snapshotView,
    onOpenSaveSnapshotDialog,
    onRestoreSavedData,
    onLoadSnapshotTemporarily,
    onDeleteSnapshot,
    formatDate
}) => {
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

    const snapshotCreatedBodyTemplate = (rowData: AccountSnapshotMetadata) => {
        return (
            <div className="snapshot-manager-row-meta">
                <i className="pi pi-calendar" />
                <span>{formatDate(rowData.createdAt)}</span>
            </div>
        );
    };

    const snapshotActionsBodyTemplate = (rowData: AccountSnapshotMetadata) => {
        return (
            <div className="snapshot-manager-row-actions">
                <Button
                    icon="pi pi-history"
                    className="p-button-sm p-button-rounded p-button-text"
                    tooltip="Load snapshot temporarily"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => onLoadSnapshotTemporarily(rowData)}
                    disabled={isSnapshotActionLoading}
                />
                <Button
                    icon="pi pi-trash"
                    className="p-button-sm p-button-rounded p-button-text p-button-danger"
                    tooltip="Delete snapshot"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => onDeleteSnapshot(rowData.id)}
                    disabled={isSnapshotActionLoading}
                />
            </div>
        );
    };

    return (
        <>
            <Dialog
                visible={showSaveSnapshotDialog}
                onHide={onHideSaveSnapshotDialog}
                header="Save Account Snapshot"
                modal
                footer={
                    <div>
                        <Button
                            label="Cancel"
                            icon="pi pi-times"
                            onClick={onHideSaveSnapshotDialog}
                            className="p-button-text"
                            disabled={isSnapshotActionLoading}
                        />
                        <Button
                            label="Save Snapshot"
                            icon="pi pi-check"
                            onClick={onSaveSnapshot}
                            loading={isSnapshotActionLoading}
                            autoFocus
                        />
                    </div>
                }
            >
                <div className="field">
                    <label htmlFor="snapshotName" className="font-bold">
                        Snapshot Name
                    </label>
                    <InputText
                        id="snapshotName"
                        value={snapshotName}
                        onChange={(e) => onSnapshotNameChange(e.target.value)}
                        placeholder="Enter snapshot name"
                        autoFocus
                    />
                </div>
            </Dialog>

            <Dialog
                visible={showSnapshotManagerDialog}
                onHide={onHideSnapshotManagerDialog}
                header="Account Snapshots"
                style={{ width: '52rem' }}
                className="snapshot-manager-dialog"
                modal
            >
                <div className="snapshot-manager-panel">
                    <div className="snapshot-manager-headline">
                        <div>
                            <div className="snapshot-manager-title">Global Snapshot Manager</div>
                            <div className="snapshot-manager-subtitle">
                                Save your full account list state and restore snapshots temporarily for comparison.
                            </div>
                        </div>
                        <div className="snapshot-manager-stats">
                            <span className="snapshot-manager-stat">
                                <i className="pi pi-database" />
                                {snapshotRows.length} saved
                            </span>
                            <span className="snapshot-manager-stat">
                                <i className="pi pi-file" />
                                {formatFileSize(snapshotRows[0]?.sizeBytes)}
                            </span>
                            {snapshotView.active && (
                                <span className="snapshot-manager-stat snapshot-manager-stat-active">
                                    <i className="pi pi-history" />
                                    Active: {snapshotView.snapshotName}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="snapshot-manager-toolbar">
                        <div className="snapshot-manager-toolbar-copy">
                            <i className="pi pi-lightbulb" />
                            <span>Tip: restore saved data after reviewing a temporary snapshot.</span>
                        </div>
                        <div className="snapshot-manager-toolbar-actions">
                            <Button
                                label="Save Current as Snapshot"
                                icon="pi pi-save"
                                className="p-button-sm"
                                onClick={onOpenSaveSnapshotDialog}
                                disabled={isSnapshotActionLoading}
                            />
                            <Button
                                label="Restore Saved Data"
                                icon="pi pi-undo"
                                className="p-button-sm p-button-outlined"
                                onClick={onRestoreSavedData}
                                loading={isSnapshotActionLoading}
                            />
                        </div>
                    </div>
                </div>

                {snapshotRows.length === 0 ? (
                    <div className="snapshot-manager-empty">
                        <i className="pi pi-inbox snapshot-manager-empty-icon" />
                        <div className="snapshot-manager-empty-title">No global snapshots yet</div>
                        <div className="snapshot-manager-empty-text">
                            Create your first snapshot to preserve your current account state.
                        </div>
                    </div>
                ) : (
                    <DataTable
                        value={snapshotRows}
                        dataKey="id"
                        tableStyle={{ minWidth: '36rem' }}
                        className="snapshot-manager-table"
                        showGridlines
                        stripedRows
                        paginator
                        rows={8}
                        rowsPerPageOptions={[8, 16, 32]}
                    >
                        <Column
                            field="name"
                            header="Snapshot"
                            body={(row: AccountSnapshotMetadata) => (
                                <div className="snapshot-manager-row-name">{row.name}</div>
                            )}
                        />
                        <Column
                            field="scope"
                            header="Type"
                            body={(row: AccountSnapshotMetadata) =>
                                row.scope === 'single' ? (
                                    <span className="snapshot-manager-scope-pill">Single account</span>
                                ) : (
                                    <span className="snapshot-manager-scope-pill snapshot-manager-scope-pill-global">
                                        All accounts
                                    </span>
                                )
                            }
                            style={{ width: '9rem' }}
                        />
                        <Column field="accountCount" header="Accounts" style={{ width: '7rem' }} />
                        <Column
                            field="createdAt"
                            header="Created"
                            body={snapshotCreatedBodyTemplate}
                            style={{ width: '10rem' }}
                        />
                        <Column header="Actions" body={snapshotActionsBodyTemplate} style={{ width: '8rem' }} />
                    </DataTable>
                )}
            </Dialog>
        </>
    );
};

export default AccountSnapshotDialogs;
