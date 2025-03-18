import {
  localStorageAccountsKey,
  localStorageSettingsKey,
  localStorageTotalsKey
} from '@/constants';
import { AccountModel } from './account-model';
import { SettingsModel } from './settings-model';
import { TotalsUIModel } from './totals-model';

/**
 * Saves the provided accounts to local storage.
 *
 * @param updatedAccounts - An array of `AccountModel` objects to be saved.
 */
export function saveAccountsToLocalStorage(updatedAccounts: AccountModel[]) {
  localStorage.setItem(localStorageAccountsKey, JSON.stringify(updatedAccounts));
}

/**
 * Retrieves the accounts stored in local storage.
 *
 * @returns An array of `AccountModel` objects, or an empty array if no accounts are found.
 */
export function getAccountsFromLocalStorage(): AccountModel[] {
  const storedAccounts = localStorage.getItem(localStorageAccountsKey);
  return storedAccounts ? JSON.parse(storedAccounts) : [];
}

/**
 * Saves the provided settings to local storage.
 *
 * @param settings - A `SettingsModel` object to be saved.
 */
export function saveSettingsToLocalStorage(settings: SettingsModel) {
  localStorage.setItem(localStorageSettingsKey, JSON.stringify(settings));
}

/**
 * Retrieves the settings stored in local storage.
 *
 * @returns A `SettingsModel` object, or `null` if no settings are found.
 */
export function getSettingsFromLocalStorage(): SettingsModel | null {
  const storedSettings = localStorage.getItem(localStorageSettingsKey);
  return storedSettings ? JSON.parse(storedSettings) : null;
}

// todo: make use of this (later)
/**
 * Saves the provided totals to local storage.
 *
 * @param totals - A `TotalsModel` object to be saved.
 *
 * @todo Update the implementation to use the correct key for storing totals.
 */
export function saveTotalsToLocalStorage(totals: TotalsUIModel[]) {
  localStorage.setItem(localStorageTotalsKey, JSON.stringify(totals));
}

/**
 * Retrieves the totals stored in local storage.
 *
 * @returns A `TotalsModel` object, or `null` if no totals are found.
 */
export function getTotalsFromLocalStorage(): TotalsUIModel[] {
  const storedTotals = localStorage.getItem(localStorageTotalsKey);
  return storedTotals ? JSON.parse(storedTotals) : [];
}
