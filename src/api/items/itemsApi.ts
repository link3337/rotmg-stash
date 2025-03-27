import { RealmItemMap } from '@/realm/renders/items';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define the base URL and default to the development server url
const ASSETS_BASE_URL = import.meta.env.ROTMGSTASH_ASSETS_URL || 'https://rotmgstash.pages.dev';

export const itemsApi = createApi({
  reducerPath: 'itemsApi',
  baseQuery: fetchBaseQuery({ baseUrl: ASSETS_BASE_URL }),
  endpoints: (builder) => ({
    fetchItems: builder.query<RealmItemMap, void>({
      query: () => '/items.json' // Endpoint to fetch the items JSON
    }),
    fetchAprilFoolsItems: builder.query<RealmItemMap, void>({
      query: () => '/april-fools-items.json' // Endpoint to fetch the april fools items JSON
    })
  })
});

export const { useFetchItemsQuery, useFetchAprilFoolsItemsQuery } = itemsApi;
