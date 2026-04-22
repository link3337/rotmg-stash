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

const oldDarkThemeName = 'mdc-dark-deeppurple';
const oldLightThemeName = 'mdc-light-deeppurple';

export const migrateSettings = (settings: Partial<SettingsState>): SettingsState => {
  // map legacy 'light'/'dark' values to new PrimeReact theme ids
  let migratedTheme = settings.theme as any;
  if (migratedTheme === 'dark') {
    migratedTheme = oldDarkThemeName;
  } else if (migratedTheme === 'light') {
    migratedTheme = oldLightThemeName;
  }

  return {
    ...settings,
    totalSettings: {
      ...defaultTotalSettings,
      ...settings.totalSettings
    },
    theme: migratedTheme || defaultThemeSetting,
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
