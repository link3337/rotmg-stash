import { SortFields } from '@store/slices/SettingsSlice';

export interface SettingsModel {
  itemSort: SortCriteria;
  displaySettings: DisplaySettingsModel;
  experimental: ExperimentalSettingsModel;
  theme: Theme;
  queueFetchInterval: number;
}

export type Theme = 'light' | 'dark';

export interface DisplaySettingsModel {
  showTotals: boolean;
  showAccountInfo: boolean;
  showExalts: boolean;
  showCharacters: boolean;
  showVault: boolean;
  showGiftChest: boolean;
  showSeasonalSpoils: boolean;
  showMaterials: boolean;
  showPotions: boolean;
  showConsumables: boolean;
  showItemTooltips: boolean;
  showAccountName: boolean;
  showIngameNameInQueue: boolean;
  compactVaults: boolean;
}

export interface SortCriteria {
  field: SortFields;
  direction: 'asc' | 'desc';
}

export interface ExperimentalSettingsModel {
  lazyLoading: boolean;
  lazyLoadingKeepRendered: boolean;
  lazyLoadingHeight?: number;
  lazyLoadingOffset?: number;
  isStreamerMode: boolean;
  isDebugMode: boolean;
  exaltPath?: string;
  deviceToken?: string;
}
