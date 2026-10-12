import { itemsApi } from '@api/items/itemsApi';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import { loadAssetsStatus } from '@store/slices/AssetsSlice';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useState } from 'react';

export interface GameAssetProgressPayload {
  phase: string;
  current: number;
  total: number;
  message: string;
}

export const GAME_ASSETS_PHASE_LABELS: Record<string, string> = {
  textures: 'Reading textures',
  'text-assets': 'Reading text assets',
  recompile: 'Recompiling atlas data',
  render: 'Rendering sprites',
  write: 'Writing cache files'
};

/**
 * Shared game-assets extraction logic: subscribes to `game-assets://progress`,
 * invokes `extract_game_assets`, then refreshes asset status and invalidates
 * cached asset queries. Used by the Settings panel and the top-of-page banner.
 */
export const useGameAssetsExtractor = () => {
  const dispatch = useAppDispatch();
  const exaltPath = useAppSelector((state) => state.settings.experimental.exaltPath);
  const [progress, setProgress] = useState<GameAssetProgressPayload | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourcePath = exaltPath
    ? `${exaltPath.replace(/[\\/]+$/, '')}\\RotMG Exalt_Data\\resources.assets`
    : null;

  useEffect(() => {
    const unsubscribe = listen<GameAssetProgressPayload>('game-assets://progress', (event) => {
      setProgress(event.payload);
    });

    return () => {
      void unsubscribe.then((unlisten) => unlisten());
    };
  }, []);

  const extract = useCallback(async () => {
    try {
      setExtracting(true);
      setError(null);
      setProgress(null);
      await invoke('extract_game_assets', { sourcePath });
      await dispatch(loadAssetsStatus(null));
      dispatch(itemsApi.util.invalidateTags(['Assets']));
    } catch (error) {
      const message = typeof error === 'string' ? error : String(error);
      console.error('Failed to extract game assets', error);
      setError(message);
    } finally {
      setExtracting(false);
    }
  }, [dispatch, sourcePath]);

  return { extract, extracting, progress, error, sourcePath };
};
