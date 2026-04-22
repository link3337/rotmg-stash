import {
  CursedSettingsModel,
  DisplaySettingsModel,
  ExperimentalSettingsModel,
  SortCriteria,
  SortFields,
  Theme,
  TotalSettingsModel
} from '../settings-model';

export const defaultTotalSettings: TotalSettingsModel = {
  usePagination: false,
  itemsPerPage: 50
};

export const defaultDisplaySettings: DisplaySettingsModel = {
  showTotals: true,
  showAccountInfo: true,
  showExalts: true,
  showCharacters: true,
  useAccordionMenu: false,
  useLocalAssets: false,
  showVault: true,
  showGiftChest: true,
  showSeasonalSpoils: true,
  showMaterials: true,
  showPotions: true,
  showConsumables: true,
  showItemTooltips: true,
  showAccountName: true,
  showIngameNameInQueue: true,
  showLastLaunched: false,
  compactVaults: true
};

export const defaultExperimentalSettings: ExperimentalSettingsModel = {
  lazyLoading: false,
  lazyLoadingKeepRendered: false,
  lazyLoadingHeight: 1000,
  lazyLoadingOffset: 1500,
  isStreamerMode: false,
  isDebugMode: false,
  deviceToken: '',
  exaltPath: ''
};

export const defaultCursedSettings: CursedSettingsModel = {
  enable3DViewer: false
};

export const defaultSortSettings: SortCriteria = {
  field: SortFields.id,
  direction: 'asc'
};

export const defaultQueueFetchIntervalSetting: number = 70000;

export const defaultThemeSetting: Theme = 'mdc-dark-deeppurple';
