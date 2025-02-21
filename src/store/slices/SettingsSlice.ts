import {
  getSettingsFromLocalStorage,
  saveSettingsToLocalStorage
} from '@cache/localstorage-service';
import { DisplaySettings, ExperimentalSettings, SettingsModel, Theme } from '@cache/settings-model';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { RootState } from '..';

// Define available sort fields
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

const getNextAvailableSortField = (usedFields: string[]): string => {
  const availableFields = Object.values(SortFields);
  for (const field of availableFields) {
    if (!usedFields.includes(field)) {
      return field;
    }
  }
  return availableFields[0]; // default to the first field if all are used
};

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
    lazyLoadingHeight: 1000,
    lazyLoadingOffset: 1500,
    isStreamerMode: false,
    isDebugMode: false
  },
  itemSort: [
    {
      field: 'id',
      direction: 'asc'
    }
  ],
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
        index: number;
        field: string;
        direction: 'asc' | 'desc';
      }>
    ) => {
      const { index, field, direction } = action.payload;
      if (index < state.itemSort.length) {
        state.itemSort[index] = {
          field: field,
          direction
        };
        saveSettingsToLocalStorage(state);
      }
    },
    toggleSortDirection: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (index < state.itemSort.length) {
        state.itemSort[index].direction =
          state.itemSort[index].direction === 'asc' ? 'desc' : 'asc';
        saveSettingsToLocalStorage(state);
      }
    },
    updateTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      saveSettingsToLocalStorage(state);
    },
    updateExperimentalSetting: (
      state,
      action: PayloadAction<{ key: keyof ExperimentalSettings; value?: any }>
    ) => {
      if (action.payload.key === 'lazyLoading') {
        state.experimental.lazyLoading = !state.experimental.lazyLoading;
      } else if (
        action.payload.key === 'lazyLoadingHeight' ||
        action.payload.key === 'lazyLoadingOffset'
      ) {
        state.experimental[action.payload.key] = action.payload.value as number;
      }
      saveSettingsToLocalStorage(state);
    },
    addSortCriteria: (state) => {
      const usedFields = state.itemSort.map((sort) => sort.field);
      const nextField = getNextAvailableSortField(usedFields);

      state.itemSort.push({
        field: nextField,
        direction: 'desc'
      });

      saveSettingsToLocalStorage(state);
    },
    removeSortCriteria: (state, action: PayloadAction<number>) => {
      if (action.payload > 0) {
        // Don't remove first sort criteria
        state.itemSort.splice(action.payload, 1);
        saveSettingsToLocalStorage(state);
      }
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
  addSortCriteria,
  removeSortCriteria,
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
