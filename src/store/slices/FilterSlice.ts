import { ClassID } from '@realm/renders/classes';
import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { RootState } from '../index';

export type FilterType = 'all' | 'seasonal' | 'regular';

interface AccountFilterMap {
  [accountId: string]: {
    characterFilter: FilterType;
    selectedClasses: ClassID[];
  };
}

interface FilterState {
  selectedItems: number[];
  accountFilters: AccountFilterMap;
}

const initialState: FilterState = {
  selectedItems: [],
  accountFilters: {}
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
    }
  }
});

const filterSelector = (state: RootState) => state.filter;
export const { setFilter, setSelectedClasses, toggleFilter, clearFilters } = filterSlice.actions;

export const selectSelectedItems = (state: RootState) => state.filter.selectedItems;
export const selectAccountFilters = (state: RootState) => state.filter.accountFilters;

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

// hook
export function useFilter(): FilterState {
  return useSelector(filterSelector);
}

export default filterSlice.reducer;
