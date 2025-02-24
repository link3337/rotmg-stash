import { tauriApi } from '@api/tauri/tauriApi';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { combineReducers } from 'redux';
import { createLogger } from 'redux-logger';
import accountsReducer from './slices/AccountsSlice';
import filterReducer from './slices/FilterSlice';
import layoutReducer from './slices/LayoutSlice';
import queueReducer from './slices/QueueSlice';
import settingsReducer from './slices/SettingsSlice';

const logger = createLogger({
  collapsed: true
});

export const store = configureStore({
  devTools: process.env.NODE_ENV === 'development',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([logger].concat(tauriApi.middleware)),
  reducer: combineReducers({
    filter: filterReducer,
    layout: layoutReducer,
    accounts: accountsReducer,
    queue: queueReducer,
    settings: settingsReducer,

    // apis
    tauriApi: tauriApi.reducer
  })
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

setupListeners(store.dispatch);
