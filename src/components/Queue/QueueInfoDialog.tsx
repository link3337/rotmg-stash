import { useAppSelector } from '@hooks/redux';
import { selectDisplayIgnInQueue, selectIsStreamerMode } from '@store/slices/SettingsSlice';
import { maskEmail } from '@utils/masking';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { QueueItem } from './Queue';

interface QueueInfoDialogProps {
  visible: boolean;
  onHide: () => void;
  queueInfo: QueueItem[];
}

const QueueInfoDialog: React.FC<QueueInfoDialogProps> = ({ visible, onHide, queueInfo }) => {
  const isStreamerMode = useAppSelector(selectIsStreamerMode);
  const displayIgnInQueue = useAppSelector(selectDisplayIgnInQueue);

  const accountNameTemplate = (rowData: QueueItem) => (
    <span>
      {isStreamerMode ? maskEmail(rowData.accountName || '') : rowData.accountName}
      {displayIgnInQueue && rowData.accountIngameName ? ` (${rowData.accountIngameName})` : ''}
    </span>
  );
  return (
    <Dialog
      header="Account Queue Status"
      visible={visible}
      onHide={onHide}
      style={{ width: '50vw' }}
      dismissableMask
      closeOnEscape
    >
      <DataTable value={queueInfo}>
        <Column field="accountName" header="Account" body={accountNameTemplate} />
        {/* <Column
          field="lastRefresh"
          header="Last Refresh"
          body={(rowData) => <span>{rowData.lastRefresh || '-'}</span>}
        />
        <Column field="nextRefresh" header="Next Refresh At" /> */}
        <Column
          field="status"
          header="Status"
          body={(rowData) => (
            <span className={`queue-status ${rowData.status.toLowerCase()}`}>{rowData.status}</span>
          )}
        />
      </DataTable>
    </Dialog>
  );
};

export default QueueInfoDialog;
