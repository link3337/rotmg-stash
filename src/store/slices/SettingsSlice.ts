import {
  defaultDisplaySettings,
  defaultExperimentalSettings,
  defaultQueueFetchIntervalSetting,
  defaultSortSettings,
  defaultThemeSetting,
  defaultTotalSettings
} from '@/cache/migration/default-settings';
import { migrateSettings } from '@/cache/migration/settings-migration';
import { saveSettingsToLocalStorage } from '@cache/localstorage-service';
import {
  DisplaySettingsModel,
  ExperimentalSettingsModel,
  SettingsModel,
  SortFields,
  Theme
} from '@cache/settings-model';
import { createListenerMiddleware, createSlice, isAnyOf, PayloadAction } from '@reduxjs/toolkit';
import { debug } from '@tauri-apps/plugin-log';
import { useSelector } from 'react-redux';
import { RootState } from '..';

export interface SettingsState extends SettingsModel {}

const initialState: SettingsState = {
  displaySettings: defaultDisplaySettings,
  totalSettings: defaultTotalSettings,
  experimental: defaultExperimentalSettings,
  itemSort: defaultSortSettings,
  theme: defaultThemeSetting,
  queueFetchInterval: defaultQueueFetchIntervalSetting
};

const loadInitialState = (): SettingsState => {
  const savedSettings = localStorage.getItem('settings');
  if (savedSettings) {
    const parsedSettings = JSON.parse(savedSettings);
    return migrateSettings(parsedSettings);
  }

  return initialState;
};

const featureKey = 'settings';

const settingsSlice = createSlice({
  name: featureKey,
  initialState: loadInitialState(),
  reducers: {
    toggleSetting: (state, action: PayloadAction<keyof DisplaySettingsModel>) => {
      state.displaySettings[action.payload] = !state.displaySettings[action.payload];
    },
    updateItemSort: (
      state,
      action: PayloadAction<{ field: SortFields; direction: 'asc' | 'desc' }>
    ) => {
      const { field, direction } = action.payload;
      state.itemSort = {
        field,
        direction
      };
    },
    toggleSortDirection: (state) => {
      state.itemSort.direction = state.itemSort.direction === 'asc' ? 'desc' : 'asc';
    },
    updateTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
    updateExperimentalSetting: (
      state,
      action: PayloadAction<{ key: keyof ExperimentalSettingsModel; value?: any }>
    ) => {
      const { key, value } = action.payload;
      if (key === 'deviceToken' || key === 'exaltPath') {
        state.experimental[key] = value as string;
      }
      if (key === 'lazyLoading' || key === 'lazyLoadingKeepRendered') {
        state.experimental[key] = !state.experimental[key];
      } else if (key === 'lazyLoadingHeight' || key === 'lazyLoadingOffset') {
        state.experimental[key] = value as number;
      }
    },
    toggleStreamerMode: (state) => {
      state.experimental.isStreamerMode = !state.experimental.isStreamerMode;
    },
    toggleDebugMode: (state) => {
      state.experimental.isDebugMode = !state.experimental.isDebugMode;
    },
    setSettings: (state, action: PayloadAction<SettingsState>) => {
      Object.assign(state, action.payload);
    },
    updateQueueFetchInterval: (state, action: PayloadAction<number>) => {
      state.queueFetchInterval = action.payload;
    },
    updateItemsPerPage: (state, action: PayloadAction<number>) => {
      const value = Math.max(1, Math.min(action.payload, 10000));
      state.totalSettings.itemsPerPage = value;
    },
    togglePagination: (state) => {
      state.totalSettings.usePagination = !state.totalSettings.usePagination;
    },
    toggleAprilFoolsItems: (state) => {
      state.displaySettings.useAprilFoolsItems = !state.displaySettings.useAprilFoolsItems;
    }
  }
});

export const {
  toggleSetting,
  updateItemSort,
  toggleSortDirection,
  updateTheme,
  updateExperimentalSetting,
  toggleStreamerMode,
  toggleDebugMode,
  updateQueueFetchInterval,
  setSettings,
  updateItemsPerPage,
  togglePagination,
  toggleAprilFoolsItems
} = settingsSlice.actions;

// middleware listener to update localStorage when settings state changes
export const settingsStateListener = createListenerMiddleware();

settingsStateListener.startListening({
  matcher: isAnyOf(
    // all actions that modify settings state
    toggleSetting,
    updateItemSort,
    toggleSortDirection,
    updateTheme,
    updateExperimentalSetting,
    toggleStreamerMode,
    toggleDebugMode,
    setSettings,
    updateQueueFetchInterval,
    updateItemsPerPage,
    togglePagination,
    toggleAprilFoolsItems
  ),
  effect: (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    debug('[SettingsStateListener] Settings state has changed, saving to local storage');
    saveSettingsToLocalStorage(state.settings);
  }
});

// selectors
const settingsSelector = (state: RootState) => state.settings;

export const selectItemSort = (state: RootState) => settingsSelector(state).itemSort;

export const selectIsStreamerMode = (state: RootState) =>
  settingsSelector(state).experimental.isStreamerMode;

export const selectExperimentalSettings = (state: RootState) =>
  settingsSelector(state).experimental;

export const selectDisplaySettings = (state: RootState) => settingsSelector(state).displaySettings;

export const selectTotalSettings = (state: RootState) => settingsSelector(state).totalSettings;

export const selectTheme = (state: RootState) => settingsSelector(state).theme;

export const selectQueueFetchInterval = (state: RootState) =>
  settingsSelector(state).queueFetchInterval;

export const selectShowAccountName = (state: RootState) =>
  settingsSelector(state).displaySettings.showAccountName;

export const selectDisplayIgnInQueue = (state: RootState) =>
  settingsSelector(state).displaySettings.showIngameNameInQueue;

export const selectUseAprilFoolsItems = (state: RootState) =>
  state.settings.displaySettings.useAprilFoolsItems;

// hook
export function useSettings(): SettingsState {
  return useSelector(settingsSelector);
}

export default settingsSlice.reducer;
