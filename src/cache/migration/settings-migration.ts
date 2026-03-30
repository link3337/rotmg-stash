import { SettingsState } from '@/store/slices/SettingsSlice';
import {
  defaultCursedSettings,
  defaultDisplaySettings,
  defaultExperimentalSettings,
  defaultQueueFetchIntervalSetting,
  defaultSortSettings,
  defaultThemeSetting,
  defaultTotalSettings
} from './default-settings';

export const migrateSettings = (settings: Partial<SettingsState>): SettingsState => {
  return {
    ...settings,
    totalSettings: {
      ...defaultTotalSettings,
      ...settings.totalSettings
    },
    theme: settings.theme || defaultThemeSetting,
    displaySettings: {
      ...defaultDisplaySettings,
      ...settings.displaySettings
    },
    cursedSettings: {
      ...defaultCursedSettings,
      ...settings.cursedSettings
    },
    experimental: {
      ...defaultExperimentalSettings,
      ...settings.experimental
    },
    itemSort: {
      ...defaultSortSettings,
      ...settings.itemSort
    },
    queueFetchInterval: settings.queueFetchInterval || defaultQueueFetchIntervalSetting
  };
};
