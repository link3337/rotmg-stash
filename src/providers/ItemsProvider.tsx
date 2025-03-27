import { RealmItemMap } from '@/realm/renders/items';
import { useFetchAprilFoolsItemsQuery, useFetchItemsQuery } from '@api/items/itemsApi';
import React, { createContext, useContext } from 'react';

interface ItemsContext {
  regularItems: RealmItemMap;
  aprilFoolsItems: RealmItemMap;
  isLoading: boolean;
  error: any;
}

const ItemsContext = createContext<ItemsContext | undefined>(undefined);

export const ItemsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    data: regularItems = {},
    isLoading: isLoadingRegular,
    error: errorRegular
  } = useFetchItemsQuery();
  const {
    data: aprilFoolsItems = {},
    isLoading: isLoadingAprilFools,
    error: errorAprilFools
  } = useFetchAprilFoolsItemsQuery();

  const isLoading = isLoadingRegular || isLoadingAprilFools;
  const error = errorRegular || errorAprilFools || null;

  return (
    <ItemsContext.Provider value={{ regularItems, aprilFoolsItems, isLoading, error }}>
      {children}
    </ItemsContext.Provider>
  );
};

export const useItems = (): ItemsContext => {
  const context = useContext(ItemsContext);
  if (!context) {
    throw new Error('useItems must be used within an ItemsProvider');
  }
  return context;
};
