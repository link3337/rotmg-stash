import { Constants } from '@/realm/renders/constant';
import { RealmItemMap } from '@/realm/renders/item';
import { skinsheets, textiles } from '@/realm/renders/sheets';
import { initPortrait } from '@/utils/portrait';
import { useFetchConstantsQuery } from '@api/items/itemsApi';
import { info } from '@tauri-apps/plugin-log';
import React, { createContext, useContext, useEffect } from 'react';

interface ConstantsContext {
  constants?: Constants | null;
  items: RealmItemMap;
  skinsheets: Record<string, string>;
  textiles: Record<string, string>;
  isLoading: boolean;
  error: any;
}

const ConstantsContext = createContext<ConstantsContext | undefined>(undefined);

export const ConstantsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    data: constants,
    isLoading: isLoadingConstants,
    error: errorConstants
  } = useFetchConstantsQuery();

  const items: RealmItemMap = (constants && constants.items) || {};
  const isLoading = isLoadingConstants;
  const error = errorConstants || null;

  useEffect(() => {
    if (constants) {
      try {
        info('Initializing portrait with fetched constants');
        initPortrait(constants, skinsheets, textiles);
      } catch (e) {
        // fail silently; portrait can still use defaults
        console.warn('Failed to initialize portrait with constants', e);
      }
    }
  }, [constants]);

  return (
    <ConstantsContext.Provider
      value={{
        constants,
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
