import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { RootState } from '../index';

interface LayoutState {
  isSettingsOpen: boolean;
  isBingoOpen: boolean;
}

const initialState: LayoutState = {
  isSettingsOpen: false,
  isBingoOpen: false
};

const layoutFeatureKey = 'layout';

const layoutSlice = createSlice({
  name: layoutFeatureKey,
  initialState,
  reducers: {
    setSettingsVisible: (state, action: PayloadAction<boolean>) => {
      state.isSettingsOpen = action.payload;
    },
    setBingoVisible: (state, action: PayloadAction<boolean>) => {
      state.isBingoOpen = action.payload;
    }
  }
});

export const { setSettingsVisible, setBingoVisible } = layoutSlice.actions;

const layoutSelector = (state: RootState) => state.layout;

export const selectIsSettingsOpen = (state: RootState) => state.layout.isSettingsOpen;
export const selectIsBingoOpen = (state: RootState) => state.layout.isBingoOpen;

export default layoutSlice.reducer;

export function useLayout(): LayoutState {
  return useSelector(layoutSelector);
}
