import {
  localStorageAccountsKey,
  localStorageSettingsKey,
  localStorageTotalsKey
} from '../constants';
import { AccountModel } from './account-model';
import { SettingsModel } from './settings-model';
import { TotalsModel } from './totals-model';

export function saveAccountsToLocalStorage(updatedAccounts: AccountModel[]) {
  localStorage.setItem(localStorageAccountsKey, JSON.stringify(updatedAccounts));
}

export function getAccountsFromLocalStorage(): AccountModel[] {
  const storedAccounts = localStorage.getItem(localStorageAccountsKey);
  return storedAccounts ? JSON.parse(storedAccounts) : [];
}

export function saveSettingsToLocalStorage(settings: SettingsModel) {
  localStorage.setItem(localStorageSettingsKey, JSON.stringify(settings));
}

export function getSettingsFromLocalStorage(): SettingsModel | null {
  const storedSettings = localStorage.getItem(localStorageSettingsKey);
  return storedSettings ? JSON.parse(storedSettings) : null;
}

export function saveTotalsToLocalStorage(totals: TotalsModel) {
  localStorage.setItem(localStorageSettingsKey, JSON.stringify(totals));
}

export function getTotalsFromLocalStorage(): TotalsModel | null {
  const storedTotals = localStorage.getItem(localStorageTotalsKey);
  return storedTotals ? JSON.parse(storedTotals) : null;
}
