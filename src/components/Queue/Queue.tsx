import { AccountModel } from '@cache/account-model';
import useCrypto from '@hooks/crypto';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import {
  autoRefresh,
  initializeQueue,
  pauseQueue,
  processQueue,
  QueueStatus,
  QueueStatusType,
  selectIsAutoRefresh,
  selectIsQueuePaused,
  selectIsQueueRunning,
  selectQueueItems,
  selectShowQueue,
  showQueue,
  startQueue,
  stopQueue,
  updateQueue
} from '@store/slices/QueueSlice';
import { selectQueueFetchInterval } from '@store/slices/SettingsSlice';
import { Button } from 'primereact/button';
import React, { useEffect } from 'react';
import './Queue.module.scss';
import QueueInfoDialog from './QueueInfoDialog';

interface QueueProps {
  accounts: AccountModel[];
}

export interface QueueItem {
  accountId: string;
  accountName?: string;
  accountIngameName?: string | undefined;
  nextRefresh?: string;
  status: QueueStatusType;
}

const Queue: React.FC<QueueProps> = ({ accounts }) => {
  const dispatch = useAppDispatch();
  const { decrypt } = useCrypto();

  const queueFetchInterval = useAppSelector(selectQueueFetchInterval);
  const queueItems = useAppSelector(selectQueueItems);
  const isQueueRunning = useAppSelector(selectIsQueueRunning);
  const isQueuePaused = useAppSelector(selectIsQueuePaused);
  const isShowQueue = useAppSelector(selectShowQueue);
  const isAutoRefresh = useAppSelector(selectIsAutoRefresh);

  const setShowQueue = (value: boolean) => dispatch(showQueue(value));
  const setAutoRefresh = (value: boolean) => dispatch(autoRefresh(value));
  const setIsPaused = (value: boolean) => dispatch(pauseQueue(value));

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const processQueueItem = async () => {
      console.log('Processing next queue item');
      // Process next queue item
      const queuedAccountId = await dispatch(processQueue({ decrypt })).unwrap();

      // If no more items to process, stop queue
      if (!queuedAccountId) {
        dispatch(stopQueue());
      } else {
        // update queue items
        dispatch(updateQueue({ accountId: queuedAccountId, queueStatus: QueueStatus.COMPLETED }));
      }
    };

    if (isQueueRunning && !isQueuePaused) {
      // Process first item immediately
      processQueueItem();

      // Set up interval for subsequent items
      intervalId = setInterval(processQueueItem, queueFetchInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isQueueRunning, isQueuePaused, queueFetchInterval, dispatch]);

  const initQueue = () => {
    dispatch(initializeQueue({ accounts, queueFetchInterval })).then(() => {
      dispatch(startQueue());
    });
  };

  const handleQueueControl = () => {
    if (!isAutoRefresh) {
      // Start queue
      initQueue();
      setAutoRefresh(true);
      setIsPaused(false);
    } else if (!isQueuePaused) {
      // Pause queue
      setIsPaused(true);
    } else {
      // Resume queue
      setIsPaused(false);
    }
  };

  return (
    <div className="flex justify-content-end m-1 gap-2">
      <Button
        icon={!isAutoRefresh ? 'pi pi-play' : isQueuePaused ? 'pi pi-play' : 'pi pi-pause'}
        label={!isAutoRefresh ? 'Start Queue' : isQueuePaused ? 'Resume' : 'Pause'}
        onClick={handleQueueControl}
        className={
          !isAutoRefresh
            ? 'p-button-success'
            : isQueuePaused
              ? 'p-button-warning'
              : 'p-button-secondary'
        }
      />
      <Button
        icon="pi pi-stop"
        label="Stop Queue"
        onClick={() => {
          setAutoRefresh(false);
          setIsPaused(false);
          dispatch(stopQueue());
        }}
        className="p-button-danger"
        disabled={!isAutoRefresh}
      />
      <Button icon="pi pi-list" label="Queue Status" onClick={() => setShowQueue(true)} />
      <QueueInfoDialog
        visible={isShowQueue}
        onHide={() => setShowQueue(false)}
        queueInfo={queueItems}
      />
    </div>
  );
};

export default Queue;
