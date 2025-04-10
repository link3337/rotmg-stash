import { RATE_LIMIT_DURATION } from '@/constants';
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
import { selectRateLimit } from '@store/slices/RateLimitSlice';
import { selectQueueFetchInterval } from '@store/slices/SettingsSlice';
import { info } from '@tauri-apps/plugin-log';
import { Button } from 'primereact/button';
import React, { useEffect, useMemo } from 'react';
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
  const { timestamp } = useAppSelector(selectRateLimit);

  const setShowQueue = (value: boolean) => dispatch(showQueue(value));
  const setAutoRefresh = (value: boolean) => dispatch(autoRefresh(value));
  const setIsPaused = (value: boolean) => dispatch(pauseQueue(value));

  // Compute if the user is rate limited locally
  const isRateLimited = useMemo(() => {
    if (!timestamp) return false;
    return Date.now() - timestamp < RATE_LIMIT_DURATION;
  }, [timestamp]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const processQueueItem = async () => {
      info('Processing next queue item');

      // If user is rate limited, skip processing
      if (isRateLimited) {
        info('User is currently rate limited. Skipping queue processing.');
        return;
      }

      if (!isQueuePaused) {
        // Process next queue item

        const queuedAccountId = await dispatch(processQueue({ decrypt })).unwrap();

        // If no more items to process, stop queue
        if (!queuedAccountId) {
          dispatch(stopQueue());
        } else {
          // update queue items
          dispatch(updateQueue({ accountId: queuedAccountId, queueStatus: QueueStatus.COMPLETED }));
        }
      } else {
        if (intervalId) {
          // clear interval until user resumes/starts queue again
          clearInterval(intervalId);
        }
      }
    };

    if (isQueueRunning && !isQueuePaused) {
      // Process first item immediately but with small delay
      setTimeout(processQueueItem, 500);

      // Set up interval for subsequent items
      intervalId = setInterval(processQueueItem, queueFetchInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isQueueRunning, isQueuePaused, queueFetchInterval, dispatch, isRateLimited]);

  const initQueue = () => {
    info('Initializing queue');
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
      info('Pausing queue');
      setIsPaused(true);
    } else {
      // Resume queue
      info('Resuming queue');
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
