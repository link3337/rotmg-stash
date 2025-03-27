import { SortDirection } from '@/utils/sorting';

export interface SettingsModel {
  itemSort: SortCriteria;
  displaySettings: DisplaySettingsModel;
  experimental: ExperimentalSettingsModel;
  totalSettings: TotalSettingsModel;
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
  useAprilFoolsItems: boolean;
}

export interface TotalSettingsModel {
  usePagination: boolean;
  itemsPerPage: number;
  customPageSize?: number;
}

export interface SortCriteria {
  field: SortFields;
  direction: SortDirection;
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
