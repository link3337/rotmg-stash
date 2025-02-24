import { mapCharListResponse } from '@api/mapping/char-mapping';
import { getAccount } from '@api/realmApi';
import { AccountModel } from '@cache/account-model';
import { AccountExportModel } from '@cache/export-model';
import { CharListResponse } from '@realm/models/charlist-response';
import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { error } from '@tauri-apps/plugin-log';
import { clearRateLimit, isRateLimited, setRateLimit } from '@utils/rate-limit';
import {
  getAccountsFromLocalStorage,
  saveAccountsToLocalStorage
} from 'cache/localstorage-service';
import { useSelector } from 'react-redux';
import { RootState } from '../index';
import { QueueStatus, QueueStatusType, updateQueue } from './QueueSlice';

interface AccountState {
  items: AccountModel[];
  loading: { [key: string]: boolean };
}

const initialState: AccountState = {
  items: [],
  loading: {}
};

const accountsFeatureKey = 'accounts';

// Types
type AccountResult = {
  success: boolean;
  data?: CharListResponse;
  error?: string;
  isRateLimited: boolean;
};

const processBackendResponse = (response: string | CharListResponse): AccountResult => {
  const rateLimitError = 'Try again later';

  if (typeof response === 'string') {
    error(response);
    if (response === rateLimitError) {
      setRateLimit();
    }
    return {
      success: false,
      error: response,
      isRateLimited: response === rateLimitError
    };
  }

  return {
    success: true,
    data: response,
    isRateLimited: false
  };
};

// Add this check before making any API requests
const canMakeRequest = (): boolean => {
  if (isRateLimited()) {
    error('Rate limited. Please wait 5 minutes before trying again.');
    return false;
  }
  clearRateLimit();
  return true;
};

export const initializeAccounts = createAsyncThunk(`${accountsFeatureKey}/initialize`, async () => {
  const accounts: AccountModel[] = getAccountsFromLocalStorage();
  return accounts;
});

export const addAccount = createAsyncThunk(
  `${accountsFeatureKey}/addAccount`,
  async (account: Partial<AccountModel>) => {
    const newAccount: AccountModel = {
      ...account,
      id: crypto.randomUUID(),
      active: true
    } as AccountModel;
    return newAccount;
  }
);

export const importAccounts = createAsyncThunk(
  `${accountsFeatureKey}/importAccounts`,
  async (accounts: AccountExportModel[]) => {
    const newAccounts: AccountModel[] = accounts.map((acc) => ({
      id: crypto.randomUUID(),
      email: acc.email,
      password: acc.password,
      active: true
    }));
    return newAccounts;
  }
);

export const updateAccount = createAsyncThunk(
  `${accountsFeatureKey}/updateAccount`,
  async (account: AccountModel) => account
);

export const deleteAccount = createAsyncThunk(
  `${accountsFeatureKey}/deleteAccount`,
  async (accountId: string) => accountId
);

export const toggleAccountActive = createAsyncThunk(
  `${accountsFeatureKey}/toggleActive`,
  async (accountId: string) => accountId
);

export const skipAccountFromQueue = createAsyncThunk(
  `${accountsFeatureKey}/skipAccount`,
  async (
    { accountId, newStatus }: { accountId: string; newStatus: QueueStatusType },
    { dispatch }
  ) => {
    const accounts = getAccountsFromLocalStorage();
    const updatedAccounts = accounts.map((acc: AccountModel) =>
      acc.id === accountId
        ? {
            ...acc,
            queueStatus: newStatus
          }
        : acc
    );

    saveAccountsToLocalStorage(updatedAccounts);

    dispatch(updateQueue({ accountId, queueStatus: newStatus }));
    return { accountId, newStatus };
  }
);

export const refreshAccount = createAsyncThunk(
  `${accountsFeatureKey}/refreshAccount`,
  async (account: AccountModel) => {
    const accounts = getAccountsFromLocalStorage();

    // Check if account is in queue
    const isInQueue = accounts.find(
      (acc) =>
        (acc.id === account.id && acc.queueStatus === QueueStatus.PENDING) ||
        acc.queueStatus === QueueStatus.SKIPPED
    );

    if (canMakeRequest()) {
      const backendResponse = await getAccount(account.email, account.password);
      const result = processBackendResponse(backendResponse);

      const updatedAccounts = accounts.map((acc: AccountModel) =>
        acc.id === account.id
          ? {
              ...acc,
              mappedData: result.success ? mapCharListResponse(result.data!) : acc.mappedData,
              error: result.error,
              lastSaved: new Date().toISOString(),
              // Update queue status if account was in queue
              ...(isInQueue && {
                queueStatus: result.success ? QueueStatus.COMPLETED : QueueStatus.ERROR
              })
            }
          : acc
      );

      saveAccountsToLocalStorage(updatedAccounts as AccountModel[]);
      return updatedAccounts;
    }
    return accounts;
  }
);

export const updateAccounts = createAsyncThunk(
  `${accountsFeatureKey}/updateAccounts`,
  async (accounts: AccountModel[]) => {
    const existingAccounts = getAccountsFromLocalStorage();
    const updatedAccounts = existingAccounts.map((existing) => {
      const updated = accounts.find((acc) => acc.id === existing.id);
      return updated || existing;
    });
    saveAccountsToLocalStorage(updatedAccounts);
    return accounts;
  }
);

export const changeAccountOrder = createAsyncThunk(
  `${accountsFeatureKey}/sortAccounts`,
  async (accounts: AccountModel[]) => {
    saveAccountsToLocalStorage(accounts);
    return accounts;
  }
);

const accountsSlice = createSlice({
  name: accountsFeatureKey,
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Initialize
      .addCase(initializeAccounts.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(addAccount.fulfilled, (state, action) => {
        state.items.push(action.payload);
        saveAccountsToLocalStorage(state.items);
      })
      .addCase(importAccounts.fulfilled, (state, action) => {
        state.items.push(...action.payload);
        saveAccountsToLocalStorage(state.items);
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        const index = state.items.findIndex((acc) => acc.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
          saveAccountsToLocalStorage(state.items);
        }
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.items = state.items.filter((acc) => acc.id !== action.payload);
        saveAccountsToLocalStorage(state.items);
      })
      .addCase(toggleAccountActive.fulfilled, (state, action) => {
        const account = state.items.find((acc) => acc.id === action.payload);
        if (account) {
          account.active = !account.active;
          saveAccountsToLocalStorage(state.items);
        }
      })
      .addCase(refreshAccount.pending, (state, action) => {
        state.loading[action.meta.arg.id] = true;
      })
      .addCase(refreshAccount.fulfilled, (state, action) => {
        state.loading[action.meta.arg.id] = false;
        const index = state.items.findIndex((acc) => acc.id === action.meta.arg.id);
        if (index !== -1) {
          state.items = action.payload;
          saveAccountsToLocalStorage(state.items);
        }
      })
      .addCase(refreshAccount.rejected, (state, action) => {
        state.loading[action.meta.arg.id] = false;
      })
      .addCase(updateAccounts.fulfilled, (state, action) => {
        state.items = state.items.map((existing) => {
          const updated = action.payload.find((acc) => acc.id === existing.id);
          return updated || existing;
        });
      })
      .addCase(
        skipAccountFromQueue.fulfilled,
        (state, action: PayloadAction<{ accountId: string; newStatus: QueueStatusType }>) => {
          const account = state.items.find((acc) => acc.id === action.payload.accountId);
          if (account) {
            account.queueStatus = action.payload.newStatus;
          }
        }
      )
      .addCase(changeAccountOrder.fulfilled, (state, action) => {
        state.items = action.payload;
      });
  }
});

const accountsSelector = (state: RootState) => state.accounts;

export const selectAccountList = createSelector(accountsSelector, (accounts) => accounts.items);

export const selectActiveAccounts = createSelector(accountsSelector, (accounts) =>
  accounts.items?.filter((x) => x.active)
);

export const selectAccountLoading = (state: RootState, id: string) =>
  state.accounts.loading[id] || false;

export function useAccounts(): AccountState {
  return useSelector(accountsSelector);
}

export default accountsSlice.reducer;
