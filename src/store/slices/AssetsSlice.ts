import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import type { RootState } from '@/store';

export type AssetAvailability = 'unknown' | 'fresh' | 'stale' | 'missing';

export interface AssetsStatus {
  status: AssetAvailability;
  source_path?: string | null;
  cache_dir?: string | null;
  stats?: Record<string, unknown> | null;
}

export interface AssetsState {
  availability: AssetAvailability;
  cacheDir: string;
  stats: Record<string, unknown> | null;
}

const initialState: AssetsState = {
  availability: 'unknown',
  cacheDir: '',
  stats: null
};

export const loadAssetsStatus = createAsyncThunk<
  AssetsStatus,
  string | null | undefined,
  { state: RootState; rejectValue: string }
>('assets/loadAssetsStatus', async (sourcePath, { rejectWithValue }) => {
  try {
    const result = await invoke<AssetsStatus>('get_game_assets_status', {
      sourcePath: sourcePath ?? null
    });

    if (!result || !result.status) {
      return rejectWithValue('Missing game asset status response');
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return rejectWithValue(message);
  }
});

const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadAssetsStatus.fulfilled, (state, action) => {
        state.availability = action.payload.status;
        state.cacheDir = action.payload.cache_dir ?? '';
        state.stats = action.payload.stats ?? null;
      })
      .addCase(loadAssetsStatus.rejected, (state) => {
        state.availability = 'missing';
      });
  }
});

export const selectGameAssetsBase = (state: RootState) => {
  const cacheDir = state.assets.cacheDir;
  if (!cacheDir) return null;

  const base = state.assets.availability === 'fresh' || state.assets.availability === 'stale'
    ? convertFileSrc(cacheDir)
    : null;

  return base ? base.replace(/\/+$/, '') : null;
};

export default assetsSlice.reducer;
