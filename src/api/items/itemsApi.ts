import { Constants, Sheets } from '@/realm/renders/constant';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define the base URL and default to the development server url
const ASSETS_BASE_URL = import.meta.env.ROTMG_STASH_ASSETS_URL || 'https://rotmgstash.pages.dev';

export const itemsApi = createApi({
  reducerPath: 'itemsApi',
  baseQuery: fetchBaseQuery({ baseUrl: ASSETS_BASE_URL }),
  endpoints: (builder) => ({
    fetchConstants: builder.query<Constants, void>({
      query: () => ({
        url: '/constants.json',
        cache: 'no-cache'
      })
    }),
    fetchSheets: builder.query<Sheets, void>({
      query: () => ({
        url: '/sheets.json',
        cache: 'no-cache'
      })
    })
  })
});

export const { useFetchConstantsQuery, useFetchSheetsQuery } = itemsApi;
