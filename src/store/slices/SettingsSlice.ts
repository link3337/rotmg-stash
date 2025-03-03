import {
  getSettingsFromLocalStorage,
  saveSettingsToLocalStorage
} from '@cache/localstorage-service';
import { DisplaySettings, ExperimentalSettings, SettingsModel, Theme } from '@cache/settings-model';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
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
    isDebugMode: false
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
    toggleSetting: (state, action: PayloadAction<keyof DisplaySettings>) => {
      state.displaySettings[action.payload] = !state.displaySettings[action.payload];
      saveSettingsToLocalStorage(state);
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
      saveSettingsToLocalStorage(state);
    },
    toggleSortDirection: (state) => {
      state.itemSort.direction = state.itemSort.direction === 'asc' ? 'desc' : 'asc';
      saveSettingsToLocalStorage(state);
    },
    updateTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      saveSettingsToLocalStorage(state);
    },
    updateExperimentalSetting: (
      state,
      action: PayloadAction<{ key: keyof ExperimentalSettings; value?: any }>
    ) => {
      const { key, value } = action.payload;
      if (key === 'lazyLoading' || key === 'lazyLoadingKeepRendered') {
        state.experimental[key] = !state.experimental[key];
      } else if (key === 'lazyLoadingHeight' || key === 'lazyLoadingOffset') {
        state.experimental[key] = value as number;
      }
      saveSettingsToLocalStorage(state);
    },
    toggleStreamerMode: (state) => {
      state.experimental.isStreamerMode = !state.experimental.isStreamerMode;
      saveSettingsToLocalStorage(state);
    },
    toggleDebugMode: (state) => {
      state.experimental.isDebugMode = !state.experimental.isDebugMode;
      saveSettingsToLocalStorage(state);
    },
    setSettings: (state, action: PayloadAction<SettingsState>) => {
      Object.assign(state, action.payload);
      saveSettingsToLocalStorage(state);
    },
    updateQueueFetchInterval: (state, action: PayloadAction<number>) => {
      // Add this action
      state.queueFetchInterval = action.payload;
      saveSettingsToLocalStorage(state);
    }
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

// hook
export function useSettings(): SettingsState {
  return useSelector(settingsSelector);
}

export default settingsSlice.reducer;
