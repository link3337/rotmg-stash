import {
  getFavoriteCharactersFromLocalStorage,
  saveFavoriteCharactersToLocalStorage
} from '@cache/localstorage-service';
import { ClassID } from '@realm/renders/classes';
import {
  createListenerMiddleware,
  createSelector,
  createSlice,
  isAnyOf,
  PayloadAction
} from '@reduxjs/toolkit';
import { debug } from '@tauri-apps/plugin-log';
import { useSelector } from 'react-redux';
import { RootState } from '../index';

export type FilterType = 'all' | 'seasonal' | 'regular' | 'favorites';

interface AccountFilterMap {
  [accountId: string]: {
    characterFilter: FilterType;
    selectedClasses: ClassID[];
  };
}

interface FilterState {
  selectedItems: number[];
  accountFilters: AccountFilterMap;
  favoriteCharactersByAccount: Record<string, number[]>;
  showHighlightedOnly: boolean;
}

const initialState: FilterState = {
  selectedItems: [],
  accountFilters: {},
  favoriteCharactersByAccount: getFavoriteCharactersFromLocalStorage(),
  showHighlightedOnly: false
};

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    toggleFilter: (state, action: PayloadAction<number>) => {
      const index = state.selectedItems.indexOf(action.payload);
      if (index === -1) {
        state.selectedItems.push(action.payload);
      } else {
        state.selectedItems.splice(index, 1);
      }
    },
    clearFilters: (state) => {
      state.selectedItems = [];
    },
    setFilter: (state, action: PayloadAction<{ accountId: string; filter: FilterType }>) => {
      const { accountId, filter: characterFilter } = action.payload;
      if (!state.accountFilters[accountId]) {
        // initialize
        state.accountFilters[accountId] = { characterFilter: characterFilter, selectedClasses: [] };
      }
      state.accountFilters[accountId].characterFilter = characterFilter;
    },
    setSelectedClasses: (
      state,
      action: PayloadAction<{ accountId: string; selectedClasses: ClassID[] }>
    ) => {
      const { accountId, selectedClasses } = action.payload;
      if (!state.accountFilters[accountId]) {
        // initialize
        state.accountFilters[accountId] = { characterFilter: 'all', selectedClasses };
      }
      state.accountFilters[accountId].selectedClasses = selectedClasses;
    },
    toggleFavoriteCharacter: (
      state,
      action: PayloadAction<{ accountId: string; characterId: number }>
    ) => {
      const { accountId, characterId } = action.payload;
      const existing = state.favoriteCharactersByAccount[accountId] ?? [];
      const hasFavorite = existing.includes(characterId);

      state.favoriteCharactersByAccount[accountId] = hasFavorite
        ? existing.filter((id) => id !== characterId)
        : [...existing, characterId];
    },
    toggleHighlightedOnly: (state) => {
      state.showHighlightedOnly = !state.showHighlightedOnly;
    },
    setHighlightedOnly: (state, action: PayloadAction<boolean>) => {
      state.showHighlightedOnly = action.payload;
    }
  }
});

const filterSelector = (state: RootState) => state.filter;
export const {
  setFilter,
  setSelectedClasses,
  toggleFavoriteCharacter,
  toggleFilter,
  clearFilters,
  toggleHighlightedOnly,
  setHighlightedOnly
} = filterSlice.actions;

export const filterStateListener = createListenerMiddleware();

filterStateListener.startListening({
  matcher: isAnyOf(toggleFavoriteCharacter),
  effect: (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    debug('[FilterStateListener] Favorite characters changed, saving to local storage');
    saveFavoriteCharactersToLocalStorage(state.filter.favoriteCharactersByAccount);
  }
});

export const selectSelectedItems = (state: RootState) => state.filter.selectedItems;
export const selectAccountFilters = (state: RootState) => state.filter.accountFilters;
export const selectFavoriteCharactersByAccount = (state: RootState) =>
  state.filter.favoriteCharactersByAccount;
export const selectShowHighlightedOnly = (state: RootState) => state.filter.showHighlightedOnly;

export const getCharacterFilterByAccount = createSelector(
  selectAccountFilters,
  (_: RootState, accountId: string) => accountId,
  (accountFilters, accountId) => accountFilters[accountId]?.characterFilter || 'all'
);

export const getSelectedClassesByAccount = createSelector(
  selectAccountFilters,
  (_: RootState, accountId: string) => accountId,
  (accountFilters, accountId) => accountFilters[accountId]?.selectedClasses || []
);

export const getFavoriteCharacterIdsByAccount = createSelector(
  selectFavoriteCharactersByAccount,
  (_: RootState, accountId: string) => accountId,
  (favoriteCharactersByAccount, accountId) => favoriteCharactersByAccount[accountId] || []
);

// hook
export function useFilter(): FilterState {
  return useSelector(filterSelector);
}

export default filterSlice.reducer;
