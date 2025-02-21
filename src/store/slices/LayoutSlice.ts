import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { RootState } from '../index';

interface LayoutState {
  isSettingsOpen: boolean;
}

const initialState: LayoutState = {
  isSettingsOpen: false
};

const layoutFeatureKey = 'layout';

const layoutSlice = createSlice({
  name: layoutFeatureKey,
  initialState,
  reducers: {
    setSettingsVisible: (state, action: PayloadAction<boolean>) => {
      state.isSettingsOpen = action.payload;
    }
  }
});

export const { setSettingsVisible } = layoutSlice.actions;

const layoutSelector = (state: RootState) => state.layout;

export const selectIsSettingsOpen = (state: RootState) => state.layout.isSettingsOpen;

export default layoutSlice.reducer;

export function useLayout(): LayoutState {
  return useSelector(layoutSelector);
}
