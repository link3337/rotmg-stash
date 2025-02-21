export interface SettingsModel {
  itemSort: SortCriteria[];
  displaySettings: DisplaySettings;
  experimental: ExperimentalSettings;
  theme: Theme;
  queueFetchInterval: number;
}

export type Theme = 'light' | 'dark';

export interface DisplaySettings {
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
  field: string;
  direction: 'asc' | 'desc';
}

export interface ExperimentalSettings {
  lazyLoading: boolean;
  lazyLoadingHeight: number;
  lazyLoadingOffset: number;
  isStreamerMode: boolean;
  isDebugMode: boolean;
}
