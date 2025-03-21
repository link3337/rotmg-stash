import { AccountModel } from '@cache/account-model';
import { QueueItem } from '@components/Queue/Queue';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { info } from '@tauri-apps/plugin-log';
import { useSelector } from 'react-redux';
import { RootState } from '..';
import { refreshAccount, setAccountsQueueStatus } from './AccountsSlice';

export const QueueStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error',
  SKIPPED: 'skipped'
};

export type QueueStatusType = (typeof QueueStatus)[keyof typeof QueueStatus];

interface QueueState {
  items: QueueItem[];
  isRunning: boolean;
  isPaused: boolean;
  isAutoRefresh: boolean;
  showQueue: boolean;
}

const initialState: QueueState = {
  items: [],
  isRunning: false,
  isPaused: false,
  isAutoRefresh: false,
  showQueue: false
};

const queueFeatureKey = 'queue';

export const initializeQueue = createAsyncThunk(
  `${queueFeatureKey}/initialize`,
  async ({
    accounts,
    queueFetchInterval
  }: {
    accounts: AccountModel[];
    queueFetchInterval: number;
  }) => {
    return accounts.map(
      (account, index) =>
        ({
          accountId: account.id,
          accountName: account.email,
          accountIngameName: account?.mappedData?.account?.name || '',
          nextRefresh: new Date(Date.now() + queueFetchInterval * (index + 1)).toLocaleTimeString(),
          status:
            account.queueStatus === QueueStatus.SKIPPED ? QueueStatus.SKIPPED : QueueStatus.PENDING
        }) as QueueItem
    );
  }
);

export const processQueue = createAsyncThunk(
  `${queueFeatureKey}/process`,
  async ({ decrypt }: { decrypt: (password: string) => string }, { getState, dispatch }) => {
    const state: RootState = getState() as RootState;

    const pendingItem = state.queue.items.find(
      (item: QueueItem) => item.status === QueueStatus.PROCESSING
    );

    info(
      `Queueing: ${pendingItem?.accountId} (${pendingItem?.accountIngameName || pendingItem?.accountName})`
    );

    if (pendingItem) {
      const account = state.accounts.items.find((a) => a.id === pendingItem.accountId);
      if (account) {
        const decryptedPassword = decrypt(account.password);
        await dispatch(refreshAccount({ ...account, password: decryptedPassword }) as any);

        // Check if this is the last non-completed/non-skipped item
        const remainingItems = state.queue.items.filter(
          (item) =>
            item.status !== QueueStatus.COMPLETED &&
            item.status !== QueueStatus.SKIPPED &&
            item.accountId !== pendingItem.accountId
        );

        // If no remaining items, dispatch finishQueueAndUpdateAccounts
        if (remainingItems.length === 0) {
          dispatch(finishQueueAndUpdateAccounts());
        }

        return pendingItem.accountId;
      }
    }
    return null;
  }
);

export const updateQueue = createAsyncThunk(
  `${queueFeatureKey}/update`,
  async (
    {
      accountId,
      queueStatus
    }: {
      accountId: string;
      queueStatus: QueueStatusType;
    },
    { getState }
  ) => {
    const state = getState() as RootState;
    const queueState = state.queue;

    // If queue is not running, return empty array
    if (!queueState.isRunning) {
      return [];
    }

    const updatedQueueItems = queueState.items.map((acc: QueueItem) =>
      acc.accountId === accountId
        ? {
            ...acc,
            status: queueStatus
          }
        : acc
    );

    return updatedQueueItems;
  }
);

// Create a new thunk to handle both queue and account updates
export const finishQueueAndUpdateAccounts = createAsyncThunk(
  `${queueFeatureKey}/finishAndUpdate`,
  async (_, { dispatch }) => {
    // First finish the queue
    dispatch(finishQueue());
    // Then update all accounts queue status
    dispatch(setAccountsQueueStatus(QueueStatus.COMPLETED));
  }
);

const queueSlice = createSlice({
  name: queueFeatureKey,
  initialState,
  reducers: {
    startQueue: (state) => {
      state.isRunning = true;
      state.isPaused = false;
      state.isAutoRefresh = true;
    },
    stopQueue: (state) => {
      state.isRunning = false;
      state.isPaused = false;
      state.isAutoRefresh = false;
    },
    pauseQueue: (state, action: PayloadAction<boolean>) => {
      state.isPaused = action.payload;
    },
    autoRefresh: (state, action: PayloadAction<boolean>) => {
      state.isAutoRefresh = action.payload;
    },
    showQueue: (state, action: PayloadAction<boolean>) => {
      state.showQueue = action.payload;
    },
    finishQueue: (state) => {
      state.isRunning = false;
      state.isPaused = false;
      state.isAutoRefresh = false;
      state.items = state.items.map((item) => ({
        ...item,
        status: QueueStatus.COMPLETED
      }));
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeQueue.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(processQueue.pending, (state) => {
        const pendingItemIndex = state.items.findIndex(
          (item) => item.status === QueueStatus.PENDING
        );
        if (pendingItemIndex !== -1) {
          state.items[pendingItemIndex].status = QueueStatus.PROCESSING;
        }
      })
      .addCase(updateQueue.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(processQueue.fulfilled, (state, action) => {
        if (action.payload) {
          const itemIndex = state.items.findIndex((item) => item.accountId === action.payload);
          if (itemIndex !== -1) {
            state.items[itemIndex].status = QueueStatus.COMPLETED;
          }
        }
      });
  }
});

const queueSelector = (state: RootState) => state.queue;

export const selectQueueItems = (state: RootState) => state.queue.items;
export const selectIsQueueRunning = (state: RootState) => state.queue.isRunning;
export const selectIsQueuePaused = (state: RootState) => state.queue.isPaused;
export const selectShowQueue = (state: RootState) => state.queue.showQueue;
export const selectIsAutoRefresh = (state: RootState) => state.queue.isAutoRefresh;

// New selector to get accounts by queue status
export const selectAccountsByQueueStatus = (status: QueueStatusType) => (state: RootState) =>
  state.accounts.items.filter((account) => account.queueStatus === status);

export const { startQueue, stopQueue, pauseQueue, showQueue, autoRefresh, finishQueue } =
  queueSlice.actions;

export function useQueue(): QueueState {
  return useSelector(queueSelector);
}

export default queueSlice.reducer;
