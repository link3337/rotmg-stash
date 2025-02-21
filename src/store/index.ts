import { tauriApi } from '@api/tauri/tauriApi';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { createBrowserHistory } from 'history';
import { combineReducers } from 'redux';
import { createReduxHistoryContext } from 'redux-first-history';
import { createLogger } from 'redux-logger';
import accountsReducer from './slices/AccountsSlice';
import filterReducer from './slices/FilterSlice';
import layoutReducer from './slices/LayoutSlice';
import queueReducer from './slices/QueueSlice';
import settingsReducer from './slices/SettingsSlice';

// Setup redux-first-history
const { createReduxHistory, routerMiddleware, routerReducer } = createReduxHistoryContext({
  history: createBrowserHistory()
});

const logger = createLogger({
  collapsed: true
});

export const store = configureStore({
  devTools: process.env.NODE_ENV === 'development',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([routerMiddleware, logger].concat(tauriApi.middleware)),
  reducer: combineReducers({
    router: routerReducer,
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
export const history = createReduxHistory(store);
