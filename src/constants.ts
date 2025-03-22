export const localStorageAccountsKey = 'accounts';
export const localStorageSettingsKey = 'settings';
export const localStorageTotalsKey = 'totals';
export const localStorageRateLimitKey = 'rate_limit_expiration';

export const RATE_LIMIT_DURATION = 300000; // 5 minutes in milliseconds
export const EMPTY_SLOT_ITEM_ID = -1;

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

export const backendErrorMessages = {
  TRY_AGAIN_LATER: 'Try again later',
  NO_INTERNET: 'dns error: No such host is known',
  UNKNOWN_ERROR: 'An unknown error occurred'
};

export const displayErrorMessages = {
  NO_INTERNET: 'No internet connection',
  RATE_LIMITED: 'Rate limited. Please wait 5 minutes before trying again.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again later.'
};

export const TAURI_COMMANDS = {
  GET_ACCOUNT_DATA: 'get_account_data',
  LAUNCH_EXALT: 'launch_exalt',
  GET_SETTINGS: 'get_settings',
  EXECUTE_POWERSHELL: 'execute_powershell'
};
