export const localStorageAccountsKey = 'accounts';
export const localStorageSettingsKey = 'settings';
export const localStorageTotalsKey = 'totals';
export const localStorageRateLimitKey = 'rate_limit_expiration';

export const RATE_LIMIT_DURATION = 300000; // 5 minutes in milliseconds

export const bagPositionMap: { [key: number]: string } = {
  1: '-26px -0px',
  2: '-52px -0px',
  3: '-78px -0px',
  4: '-26px -26px',
  5: '-52px -26px',
  6: '-26px -52px',
  7: '-0px -26px',
  8: '-78px -26px',
  9: '-0px -52px'
};

export const TAURI_COMMANDS = {
  GET_ACCOUNT_DATA: 'get_account_data',
  LAUNCH_EXALT: 'launch_exalt',
  GET_SETTINGS: 'get_settings'
};
