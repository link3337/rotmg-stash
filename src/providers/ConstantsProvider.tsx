import { Constants, Sheets } from '@/realm/renders/constant';
import { RealmItemMap } from '@/realm/renders/item';
import {
  skinsheets as defaultSkinsheets,
  textiles as defaultTextiles
} from '@/realm/renders/sheets';
import { initPortrait } from '@/utils/portrait';
import { useFetchConstantsQuery, useFetchSheetsQuery } from '@api/items/itemsApi';
import { info } from '@tauri-apps/plugin-log';
import React, { createContext, useContext, useEffect } from 'react';

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
  const {
    data: sheetsData,
    isLoading: isLoadingSheets,
    error: errorSheets
  } = useFetchSheetsQuery();

  const {
    data: constants,
    isLoading: isLoadingConstants,
    error: errorConstants
  } = useFetchConstantsQuery();

  const sheets = sheetsData ?? null;
  const skinsheets = sheets?.skinsheets ?? defaultSkinsheets;
  const textiles = sheets?.textiles ?? defaultTextiles;

  const items: RealmItemMap = (constants && constants.items) || {};
  const isLoading = isLoadingConstants || isLoadingSheets;
  const error = errorConstants || errorSheets || null;

  useEffect(() => {
    if (!constants || !skinsheets || !textiles) {
      return;
    }

    try {
      info('Initializing portrait with fetched constants and sheets');
      initPortrait(constants, skinsheets, textiles);
    } catch (e) {
      // fail silently; portrait can still use defaults
      console.warn('Failed to initialize portrait with constants', e);
    }
  }, [constants, skinsheets, textiles]);

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
