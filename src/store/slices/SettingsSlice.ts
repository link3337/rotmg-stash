import {
  getSettingsFromLocalStorage,
  saveSettingsToLocalStorage
} from '@cache/localstorage-service';
import {
  DisplaySettingsModel,
  ExperimentalSettingsModel,
  SettingsModel,
  Theme
} from '@cache/settings-model';
import { createListenerMiddleware, createSlice, isAnyOf, PayloadAction } from '@reduxjs/toolkit';
import { debug } from '@tauri-apps/plugin-log';
import { useSelector } from 'react-redux';
import { RootState } from '..';

// Sort fields
export enum SortFields {
  id = 'id',
  name = 'name',
  slotType = 'slotType',
  fameBonus = 'fameBonus',
  feedPower = 'feedPower',
  bagType = 'bagType',
  soulbound = 'soulbound',
  tier = 'tier',
  shiny = 'shiny'
}

export interface SettingsState extends SettingsModel {}

const initialState: SettingsState = {
  displaySettings: {
    showTotals: true,
    showAccountInfo: true,
    showExalts: true,
    showCharacters: true,
    showVault: true,
    showGiftChest: true,
    showSeasonalSpoils: true,
    showMaterials: true,
    showPotions: true,
    showConsumables: true,
    showItemTooltips: true,
    showAccountName: true,
    showIngameNameInQueue: true,
    compactVaults: true
  },
  experimental: {
    lazyLoading: false,
    lazyLoadingKeepRendered: false,
    lazyLoadingHeight: 1000,
    lazyLoadingOffset: 1500,
    isStreamerMode: false,
    isDebugMode: false,
    deviceToken: '',
    exaltPath: ''
  },
  itemSort: {
    field: SortFields.id,
    direction: 'asc'
  },
  theme: 'dark',
  queueFetchInterval: 70000
};

const loadSettings = (): SettingsState => {
  const settingsState = getSettingsFromLocalStorage();
  return settingsState ?? initialState;
};

const featureKey = 'settings';

const settingsSlice = createSlice({
  name: featureKey,
  initialState: loadSettings(),
  reducers: {
    toggleSetting: (state, action: PayloadAction<keyof DisplaySettingsModel>) => {
      state.displaySettings[action.payload] = !state.displaySettings[action.payload];
    },
    updateItemSort: (
      state,
      action: PayloadAction<{
        field: SortFields;
        direction: 'asc' | 'desc';
      }>
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
  setSettings
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
    updateQueueFetchInterval
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

export const selectTheme = (state: RootState) => settingsSelector(state).theme;

export const selectQueueFetchInterval = (state: RootState) =>
  settingsSelector(state).queueFetchInterval;

export const selectShowAccountName = (state: RootState) =>
  settingsSelector(state).displaySettings.showAccountName;

export const selectDisplayIgnInQueue = (state: RootState) =>
  settingsSelector(state).displaySettings.showIngameNameInQueue;

// hook
export function useSettings(): SettingsState {
  return useSelector(settingsSelector);
}

export default settingsSlice.reducer;
