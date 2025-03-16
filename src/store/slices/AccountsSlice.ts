import { mapCharListResponse } from '@api/mapping/char-mapping';
import { getAccount } from '@api/realmApi';
import { AccountModel } from '@cache/account-model';
import { AccountExportModel } from '@cache/export-model';
import {
  getAccountsFromLocalStorage,
  saveAccountsToLocalStorage
} from '@cache/localstorage-service';
import { CharListResponse } from '@realm/models/charlist-response';
import {
  createAsyncThunk,
  createListenerMiddleware,
  createSelector,
  createSlice,
  isAnyOf,
  PayloadAction,
  ThunkDispatch
} from '@reduxjs/toolkit';
import { debug, error } from '@tauri-apps/plugin-log';
import { useSelector } from 'react-redux';
import { RootState } from '../index';
import { QueueStatus, QueueStatusType, updateQueue } from './QueueSlice';
import { clearRateLimit, isCurrentlyRateLimited, setRateLimit } from './RateLimitSlice';

interface AccountState {
  items: AccountModel[];
  loading: { [key: string]: boolean };
}

const initialState: AccountState = {
  items: [],
  loading: {}
};

const accountsFeatureKey = 'accounts';

type AccountResult = {
  success: boolean;
  data?: CharListResponse;
  error?: string;
  isRateLimited: boolean;
};

const processBackendResponse = (
  response: string | CharListResponse,
  dispatch: ThunkDispatch<unknown, unknown, any>
): AccountResult => {
  const rateLimitError = 'Try again later';

  if (typeof response === 'string') {
    error(response);
    if (response === rateLimitError) {
      // Dispatch setRateLimit with the current timestamp
      dispatch(setRateLimit({ timestamp: Date.now() }));
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

const canMakeRequest = (getState: () => RootState): boolean => {
  const state = getState();
  if (isCurrentlyRateLimited(state.rateLimit)) {
    error('Rate limited. Please wait 5 minutes before trying again.');
    return false;
  }
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

export const skipAccountFromQueue = createAsyncThunk(
  `${accountsFeatureKey}/skipAccount`,
  async (
    { accountId, newStatus }: { accountId: string; newStatus: QueueStatusType },
    { dispatch }
  ) => {
    dispatch(updateQueue({ accountId, queueStatus: newStatus }));
    return { accountId, newStatus };
  }
);

export const refreshAccount = createAsyncThunk<
  AccountModel[], // Return type: an updated array of AccountModel
  AccountModel, // Argument type: a single AccountModel
  { state: RootState } // thunkAPI type: state is typed as RootState
>(`${accountsFeatureKey}/refreshAccount`, async (account, { dispatch, getState }) => {
  const accounts = getAccountsFromLocalStorage();

  // Check if account is in queue (existing logic)
  const isInQueue = accounts.find(
    (acc) =>
      (acc.id === account.id && acc.queueStatus === QueueStatus.PENDING) ||
      acc.queueStatus === QueueStatus.SKIPPED
  );

  if (canMakeRequest(getState)) {
    const backendResponse = await getAccount(account.email, account.password);
    const result = processBackendResponse(backendResponse, dispatch);

    const updatedAccounts = accounts.map((acc: AccountModel) =>
      acc.id === account.id
        ? {
          ...acc,
          mappedData: result.success ? mapCharListResponse(result.data!) : acc.mappedData,
          error: result.error,
          lastSaved: new Date().toISOString(),
          ...(isInQueue && {
            queueStatus: result.success ? QueueStatus.COMPLETED : QueueStatus.ERROR
          })
        }
        : acc
    );
    // Optionally: If request succeeded, dispatch(clearRateLimit())
    if (result.success) {
      dispatch(clearRateLimit());
    }
    return updatedAccounts;
  }
  return accounts;
});

export const updateAccounts = createAsyncThunk(
  `${accountsFeatureKey}/updateAccounts`,
  async (accounts: AccountModel[]) => {
    const existingAccounts = getAccountsFromLocalStorage();
    const updatedAccounts = existingAccounts.map((existing) => {
      const updated = accounts.find((acc) => acc.id === existing.id);
      return updated || existing;
    });
    return updatedAccounts;
  }
);

const accountsSlice = createSlice({
  name: accountsFeatureKey,
  initialState,
  reducers: {
    changeAccountOrder: (state, action: PayloadAction<AccountModel[]>) => {
      state.items = action.payload;
    },
    updateAccount: (state, action: PayloadAction<AccountModel>) => {
      const index = state.items.findIndex((acc) => acc.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteAccount: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((acc) => acc.id !== action.payload);
    },
    toggleAccountActive: (state, action: PayloadAction<string>) => {
      const account = state.items.find((acc) => acc.id === action.payload);
      if (account) {
        account.active = !account.active;
      }
    },
    // set queue status for all accounts (used for finishing queue)
    // used to set all accounts to pending or completed
    setAccountsQueueStatus: (state, action: PayloadAction<QueueStatusType>) => {
      state.items = state.items.map((account) => ({
        ...account,
        queueStatus: account.active ? action.payload : account.queueStatus
      }));
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAccounts.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(addAccount.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(importAccounts.fulfilled, (state, action) => {
        state.items.push(...action.payload);
      })
      .addCase(refreshAccount.pending, (state, action) => {
        state.loading[action.meta.arg.id] = true;
      })
      .addCase(refreshAccount.fulfilled, (state, action) => {
        state.loading[action.meta.arg.id] = false;
        const index = state.items.findIndex((acc) => acc.id === action.meta.arg.id);
        if (index !== -1) {
          state.items = action.payload;
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
      );
  }
});

// actions
export const {
  setAccountsQueueStatus,
  updateAccount,
  changeAccountOrder,
  toggleAccountActive,
  deleteAccount
} = accountsSlice.actions;

// middleware listener to update localStorage when accounts.items state changes
export const accountsStateListener = createListenerMiddleware();

accountsStateListener.startListening({
  matcher: isAnyOf(
    // all actions that modify state.items
    addAccount.fulfilled,
    updateAccount,
    deleteAccount,
    changeAccountOrder,
    toggleAccountActive,
    setAccountsQueueStatus,
    importAccounts.fulfilled,
    refreshAccount.fulfilled,
    updateAccounts.fulfilled,
    skipAccountFromQueue.fulfilled
  ),
  effect: (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    debug('[AccountsStateListener] Accounts state has changed, saving to local storage');
    saveAccountsToLocalStorage(state.accounts.items);
  }
});

// selectors
const accountsSelector = (state: RootState) => state.accounts;

export const selectAccountList = createSelector(accountsSelector, (accounts) => accounts.items);

export const selectActiveAccounts = createSelector(accountsSelector, (accounts) =>
  accounts.items?.filter((x) => x.active)
);

export const selectAccountLoading = (state: RootState, id: string) =>
  state.accounts.loading[id] || false;

// hook
export function useAccounts(): AccountState {
  return useSelector(accountsSelector);
}

export default accountsSlice.reducer;
