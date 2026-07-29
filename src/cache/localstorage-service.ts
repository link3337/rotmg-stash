import {
  localStorageAccountsKey,
  localStorageAccountSnapshotsKey,
  localStorageSettingsKey,
  localStorageTotalsKey,
  TAURI_COMMANDS
} from '@/constants';
import { CharListResponseUIModel } from '@api/models/charlist-response-ui-model';
import { AccountSnapshotMetadata, AccountSnapshotModel } from '@cache/account-snapshot-model';
import { invoke } from '@tauri-apps/api/core';
import { debug, error } from '@tauri-apps/plugin-log';
import { AccountModel, sanitizeAccountSnapshotData } from './account-model';
import { SettingsModel } from './settings-model';
import { TotalsUIModel } from './totals-model';

type MappedDataByAccountId = Record<string, CharListResponseUIModel>;
type StoredAccountModel = AccountModel & { favoriteCharacterIds?: number[] };

function sanitizeSnapshotForStorage(snapshot: AccountSnapshotModel): AccountSnapshotModel {
  return {
    ...snapshot,
    accounts: snapshot.accounts.map((account) => sanitizeAccountSnapshotData(account) as AccountModel)
  };
}

function sanitizeSnapshotsForStorage(snapshots: AccountSnapshotModel[]): AccountSnapshotModel[] {
  return snapshots.map((snapshot) => sanitizeSnapshotForStorage(snapshot));
}

const isDesktopTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

/**
 * Saves the provided accounts to local storage.
 * @param updatedAccounts - An array of `AccountModel` objects to be saved.
 */
export function saveAccountsToLocalStorage(updatedAccounts: AccountModel[]) {
  const existingStoredAccounts = getStoredAccountsFromLocalStorage();
  const favoritesByAccountId = existingStoredAccounts.reduce<Record<string, number[]>>(
    (acc, account) => {
      if (account.favoriteCharacterIds && account.favoriteCharacterIds.length > 0) {
        acc[account.id] = account.favoriteCharacterIds;
      }
      return acc;
    },
    {}
  );

  // Keep localStorage slim and store large mappedData on disk via Tauri.
  const slimAccounts: StoredAccountModel[] = updatedAccounts.map((account) => ({
    ...account,
    favoriteCharacterIds: favoritesByAccountId[account.id],
    mappedData: undefined
  }));

  const payload = JSON.stringify(slimAccounts);
  debug(
    `[Storage] Saving ${slimAccounts.length} slim accounts to localStorage (${payload.length} chars)`
  );
  localStorage.setItem(localStorageAccountsKey, payload);
}

/**
 * Retrieves the accounts stored in local storage.
 * @returns An array of `AccountModel` objects, or an empty array if no accounts are found.
 */
export function getAccountsFromLocalStorage(): AccountModel[] {
  const parsed = getStoredAccountsFromLocalStorage();
  return parsed.map(({ favoriteCharacterIds: _favoriteCharacterIds, ...account }) => account);
}

function getStoredAccountsFromLocalStorage(): StoredAccountModel[] {
  const storedAccounts = localStorage.getItem(localStorageAccountsKey);
  if (!storedAccounts) {
    debug('[Storage] No accounts found in localStorage');
    return [];
  }

  try {
    const parsed = JSON.parse(storedAccounts) as StoredAccountModel[];
    debug(`[Storage] Loaded ${parsed.length} accounts from localStorage`);
    return parsed;
  } catch (err) {
    error(`[Storage] Failed to parse accounts from localStorage: ${String(err)}`);
    return [];
  }
}

export async function saveMappedDataToDisk(updatedAccounts: AccountModel[]): Promise<void> {
  if (!isDesktopTauri()) return;

  const mappedDataByAccountId = updatedAccounts.reduce<MappedDataByAccountId>((acc, account) => {
    if (account.mappedData) {
      acc[account.id] = account.mappedData;
    }
    return acc;
  }, {});

  const payload = JSON.stringify(mappedDataByAccountId);
  debug(
    `[Storage] Saving mappedData for ${Object.keys(mappedDataByAccountId).length} accounts to disk (${payload.length} chars)`
  );

  try {
    await invoke(TAURI_COMMANDS.SAVE_ACCOUNTS_MAPPED_DATA, {
      mappedDataByAccountJson: payload
    });
  } catch (err) {
    error(`[Storage] Failed to save mappedData to disk: ${String(err)}`);
    throw err;
  }
}

export async function loadMappedDataFromDisk(): Promise<MappedDataByAccountId> {
  if (!isDesktopTauri()) return {};

  try {
    const raw = await invoke<string>(TAURI_COMMANDS.LOAD_ACCOUNTS_MAPPED_DATA);
    if (!raw) {
      debug('[Storage] mappedData disk cache returned empty payload');
      return {};
    }

    const parsed = JSON.parse(raw) as MappedDataByAccountId;
    debug(`[Storage] Loaded mappedData for ${Object.keys(parsed).length} accounts from disk`);
    return parsed;
  } catch (err) {
    error(`[Storage] Failed to load mappedData from disk: ${String(err)}`);
    return {};
  }
}

/**
 * Saves the provided settings to local storage.
 * @param settings - A `SettingsModel` object to be saved.
 */
export function saveSettingsToLocalStorage(settings: SettingsModel) {
  const payload = JSON.stringify(settings);
  debug(`[Storage] Saving settings to localStorage (${payload.length} chars)`);
  localStorage.setItem(localStorageSettingsKey, payload);
}

/**
 * Retrieves the settings stored in local storage.
 * @returns A `SettingsModel` object, or `null` if no settings are found.
 */
export function getSettingsFromLocalStorage(): SettingsModel | null {
  const storedSettings = localStorage.getItem(localStorageSettingsKey);
  if (!storedSettings) {
    debug('[Storage] No settings found in localStorage');
    return null;
  }

  try {
    debug('[Storage] Loaded settings from localStorage');
    return JSON.parse(storedSettings);
  } catch (err) {
    error(`[Storage] Failed to parse settings from localStorage: ${String(err)}`);
    return null;
  }
}

/**
 * Saves the provided totals to local storage.
 * @param totals - A `TotalsModel` object to be saved.
 */
export function saveTotalsToLocalStorage(totals: TotalsUIModel[]) {
  const payload = JSON.stringify(totals);
  debug(`[Storage] Saving ${totals.length} totals to localStorage (${payload.length} chars)`);
  localStorage.setItem(localStorageTotalsKey, payload);
}

/**
 * Retrieves the totals stored in local storage.
 * @returns A `TotalsModel` object, or `null` if no totals are found.
 */
export function getTotalsFromLocalStorage(): TotalsUIModel[] {
  const storedTotals = localStorage.getItem(localStorageTotalsKey);
  if (!storedTotals) {
    debug('[Storage] No totals found in localStorage');
    return [];
  }

  try {
    const parsed = JSON.parse(storedTotals) as TotalsUIModel[];
    debug(`[Storage] Loaded ${parsed.length} totals from localStorage`);
    return parsed;
  } catch (err) {
    error(`[Storage] Failed to parse totals from localStorage: ${String(err)}`);
    return [];
  }
}

export type FavoriteCharactersByAccount = Record<string, number[]>;

export function saveFavoriteCharactersToLocalStorage(favorites: FavoriteCharactersByAccount) {
  const storedAccounts = getStoredAccountsFromLocalStorage();
  const updatedStoredAccounts: StoredAccountModel[] = storedAccounts.map((account) => ({
    ...account,
    favoriteCharacterIds:
      favorites[account.id] && favorites[account.id].length > 0 ? favorites[account.id] : undefined
  }));

  const payload = JSON.stringify(updatedStoredAccounts);
  debug(
    `[Storage] Saving favorites for ${Object.keys(favorites).length} accounts inside accounts localStorage payload (${payload.length} chars)`
  );
  localStorage.setItem(localStorageAccountsKey, payload);
}

export function getFavoriteCharactersFromLocalStorage(): FavoriteCharactersByAccount {
  const storedAccounts = getStoredAccountsFromLocalStorage();
  const favorites = storedAccounts.reduce<FavoriteCharactersByAccount>((acc, account) => {
    if (account.favoriteCharacterIds && account.favoriteCharacterIds.length > 0) {
      acc[account.id] = account.favoriteCharacterIds;
    }
    return acc;
  }, {});

  debug(
    `[Storage] Loaded favorites for ${Object.keys(favorites).length} accounts from localStorage`
  );
  return favorites;
}

export async function saveAccountSnapshotsToDisk(
  snapshots: AccountSnapshotModel[]
): Promise<void> {
  const sanitizedSnapshots = sanitizeSnapshotsForStorage(snapshots);
  const payload = JSON.stringify(sanitizedSnapshots);

  if (isDesktopTauri()) {
    debug(
      `[Storage] Saving ${sanitizedSnapshots.length} account snapshots to disk (${payload.length} chars)`
    );

    try {
      await invoke(TAURI_COMMANDS.SAVE_ACCOUNTS_SNAPSHOTS, {
        snapshotsJson: payload
      });
      return;
    } catch (err) {
      error(`[Storage] Failed to save account snapshots to disk: ${String(err)}`);
      throw err;
    }
  }

  debug(
    `[Storage] Saving ${sanitizedSnapshots.length} account snapshots to localStorage (${payload.length} chars)`
  );
  localStorage.setItem(localStorageAccountSnapshotsKey, payload);
}

export async function loadAccountSnapshotsFromDisk(): Promise<AccountSnapshotModel[]> {
  if (isDesktopTauri()) {
    try {
      const raw = await invoke<string>(TAURI_COMMANDS.LOAD_ACCOUNTS_SNAPSHOTS);
      if (!raw) {
        debug('[Storage] Account snapshots disk cache returned empty payload');
        return [];
      }

      const parsed = JSON.parse(raw) as AccountSnapshotModel[];
      debug(`[Storage] Loaded ${parsed.length} account snapshots from disk`);
      return parsed;
    } catch (err) {
      error(`[Storage] Failed to load account snapshots from disk: ${String(err)}`);
      return [];
    }
  }

  const storedSnapshots = localStorage.getItem(localStorageAccountSnapshotsKey);
  if (!storedSnapshots) {
    debug('[Storage] No account snapshots found in localStorage');
    return [];
  }

  try {
    const parsed = JSON.parse(storedSnapshots) as AccountSnapshotModel[];
    debug(`[Storage] Loaded ${parsed.length} account snapshots from localStorage`);
    return parsed;
  } catch (err) {
    error(`[Storage] Failed to parse account snapshots from localStorage: ${String(err)}`);
    return [];
  }
}

export async function saveAccountSnapshotToDisk(snapshot: AccountSnapshotModel): Promise<void> {
  const sanitizedSnapshot = sanitizeSnapshotForStorage(snapshot);

  if (isDesktopTauri()) {
    const payload = JSON.stringify(sanitizedSnapshot);
    debug(`[Storage] Appending one account snapshot to disk (${payload.length} chars)`);

    try {
      await invoke(TAURI_COMMANDS.APPEND_ACCOUNT_SNAPSHOT, {
        snapshotJson: payload
      });
      return;
    } catch (err) {
      error(`[Storage] Failed to append account snapshot to disk: ${String(err)}`);
      throw err;
    }
  }

  const existingSnapshots = await loadAccountSnapshotsFromDisk();
  const sanitizedExistingSnapshots = sanitizeSnapshotsForStorage(existingSnapshots);
  const updatedSnapshots = [sanitizedSnapshot, ...sanitizedExistingSnapshots].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  await saveAccountSnapshotsToDisk(updatedSnapshots);
}

export async function loadAccountSnapshotsMetadataFromDisk(): Promise<AccountSnapshotMetadata[]> {
  if (isDesktopTauri()) {
    try {
      const raw = await invoke<string>(TAURI_COMMANDS.LOAD_ACCOUNTS_SNAPSHOTS_METADATA);
      if (!raw) return [];

      const parsed = JSON.parse(raw) as AccountSnapshotMetadata[];
      debug(`[Storage] Loaded ${parsed.length} account snapshot metadata rows from disk`);
      return parsed;
    } catch (err) {
      error(`[Storage] Failed to load account snapshot metadata from disk: ${String(err)}`);
      return [];
    }
  }

  const snapshots = await loadAccountSnapshotsFromDisk();
  return snapshots.map((snapshot) => {
    const snapshotPayload = JSON.stringify(snapshot);

    return {
      id: snapshot.id,
      name: snapshot.name,
      createdAt: snapshot.createdAt,
      accountCount: snapshot.accounts.length,
      sizeBytes: new TextEncoder().encode(snapshotPayload).length,
      scope: snapshot.scope,
      sourceAccountId: snapshot.sourceAccountId
    };
  });
}

export async function loadAccountSnapshotByIdFromDisk(
  snapshotId: string
): Promise<AccountSnapshotModel | null> {
  if (isDesktopTauri()) {
    try {
      const raw = await invoke<string>(TAURI_COMMANDS.LOAD_ACCOUNT_SNAPSHOT_BY_ID, {
        snapshotId
      });
      if (!raw) return null;

      const parsed = JSON.parse(raw) as AccountSnapshotModel;
      return parsed;
    } catch (err) {
      error(`[Storage] Failed to load account snapshot by id from disk: ${String(err)}`);
      return null;
    }
  }

  const snapshots = await loadAccountSnapshotsFromDisk();
  return snapshots.find((snapshot) => snapshot.id === snapshotId) ?? null;
}

export async function deleteAccountSnapshotFromDisk(snapshotId: string): Promise<void> {
  if (isDesktopTauri()) {
    try {
      await invoke(TAURI_COMMANDS.DELETE_ACCOUNT_SNAPSHOT, {
        snapshotId
      });
      return;
    } catch (err) {
      error(`[Storage] Failed to delete account snapshot from disk: ${String(err)}`);
      throw err;
    }
  }

  const snapshots = await loadAccountSnapshotsFromDisk();
  const updatedSnapshots = snapshots.filter((snapshot) => snapshot.id !== snapshotId);
  await saveAccountSnapshotsToDisk(updatedSnapshots);
}
