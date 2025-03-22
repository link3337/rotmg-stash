import { SettingsState } from '@/store/slices/SettingsSlice';
import {
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
    totalSettings: settings.totalSettings || defaultTotalSettings,
    theme: settings.theme || defaultThemeSetting,
    displaySettings: settings.displaySettings || defaultDisplaySettings,
    experimental: settings.experimental || defaultExperimentalSettings,
    itemSort: settings.itemSort || defaultSortSettings,
    queueFetchInterval: settings.queueFetchInterval || defaultQueueFetchIntervalSetting
  };
};
