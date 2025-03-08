import { saveAccountsToLocalStorage } from '@cache/localstorage-service';
import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import { debug } from '@tauri-apps/plugin-log';
import { RootState } from '..';
import { addAccount, changeAccountOrder, deleteAccount, importAccounts, refreshAccount, setAccountsQueueStatus, skipAccountFromQueue, toggleAccountActive, updateAccount, updateAccounts } from '../slices/AccountsSlice';

export const accountsMiddleware = createListenerMiddleware();

accountsMiddleware.startListening({
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
        debug('[AccountsSlice Middleware] Accounts state has changed, saving to local storage');
        saveAccountsToLocalStorage(state.accounts.items);
    }
});