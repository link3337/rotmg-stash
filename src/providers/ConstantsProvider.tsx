import { Constants, Sheets } from '@/realm/renders/constant';
import { RealmItemMap } from '@/realm/renders/item';
import { initPortrait } from '@/utils/portrait';
import { makeAssetsQueryArgs, useFetchConstantsQuery, useFetchSheetsQuery } from '@api/items/itemsApi';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import { loadAssetsStatus } from '@store/slices/AssetsSlice';
import { info } from '@tauri-apps/plugin-log';
import React, { createContext, useContext, useEffect } from 'react';
import { shallowEqual } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';

interface ConstantsContext {
  constants?: Constants | null;
  sheets?: Sheets | null;
  items: RealmItemMap;
  skinsheets: Record<string, string>;
  textiles: Record<string, string>;
  isLoading: boolean;
  error: any;
}

const ConstantsContext = createContext<ConstantsContext | undefined>(undefined);

export const ConstantsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const queryArgs = useAppSelector(makeAssetsQueryArgs, shallowEqual);
  const useGameAssets = queryArgs.useGameAssets;
  const availability = useAppSelector((state) => state.assets.availability);

  useEffect(() => {
    dispatch(loadAssetsStatus(null));
  }, [dispatch]);

  const shouldSkipAssetLoad = useGameAssets && availability === 'unknown';

  const {
    data: sheetsData,
    isLoading: isLoadingSheets,
    error: errorSheets
  } = useFetchSheetsQuery(shouldSkipAssetLoad ? skipToken : queryArgs);

  const {
    data: constants,
    isLoading: isLoadingConstants,
    error: errorConstants
  } = useFetchConstantsQuery(shouldSkipAssetLoad ? skipToken : queryArgs);

  const sheets = sheetsData ?? null;
  const skinsheets = sheets?.skinsheets ?? {};
  const textiles = sheets?.textiles ?? {};

  const items: RealmItemMap = (constants && constants.items) || {};
  const isLoading = isLoadingConstants || isLoadingSheets;
  const error = errorConstants || errorSheets || null;

  useEffect(() => {
    if (!constants || !sheets || !Object.keys(sheets.skinsheets ?? {}).length) {
      return;
    }

    try {
      info('Initializing portrait with fetched constants and sheets');
      initPortrait(constants, sheets.skinsheets, sheets.textiles);
    } catch (e) {
      console.warn('Failed to initialize portrait with constants', e);
    }
  }, [constants, sheets]);

  return (
    <ConstantsContext.Provider
      value={{
        constants,
        sheets,
        items,
        skinsheets,
        textiles,
        isLoading,
        error
      }}
    >
      {children}
    </ConstantsContext.Provider>
  );
};

export const useConstants = (): ConstantsContext => {
  const context = useContext(ConstantsContext);
  if (!context) {
    throw new Error('useConstants must be used within a ConstantsProvider');
  }
  return context;
};

export default ConstantsProvider;
