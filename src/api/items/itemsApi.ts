import { LOCAL_ASSETS_BASE_URL, REMOTE_ASSETS_BASE_URL } from '@/constants';
import { Constants, Sheets } from '@/realm/renders/constant';
import type { RootState } from '@/store';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const remoteBaseQuery = fetchBaseQuery({ baseUrl: REMOTE_ASSETS_BASE_URL });
const localBaseQuery = fetchBaseQuery({ baseUrl: LOCAL_ASSETS_BASE_URL });

const queryWithFallback =
  <T>(url: string) =>
  async (_arg: boolean | void, api: any, extraOptions: any) => {
    const request = {
      url,
      cache: 'no-cache' as RequestCache
    };

    const useLocalAssets =
      (api.getState() as RootState)?.settings?.displaySettings?.useLocalAssets ?? false;

    if (useLocalAssets) {
      const localResult = await localBaseQuery(request, api, extraOptions);
      if (!localResult.error) {
        return localResult as { data: T };
      }

      console.warn('[itemsApi] Local asset request failed, falling back to remote assets', {
        url,
        localBaseUrl: LOCAL_ASSETS_BASE_URL,
        remoteBaseUrl: REMOTE_ASSETS_BASE_URL,
        error: localResult.error
      });

      return (await remoteBaseQuery(request, api, extraOptions)) as { data: T };
    }

    const remoteResult = await remoteBaseQuery(request, api, extraOptions);
    if (!remoteResult.error) {
      return remoteResult as { data: T };
    }

    console.warn('[itemsApi] Remote asset request failed, falling back to local assets', {
      url,
      remoteBaseUrl: REMOTE_ASSETS_BASE_URL,
      localBaseUrl: LOCAL_ASSETS_BASE_URL,
      error: remoteResult.error
    });

    return (await localBaseQuery(request, api, extraOptions)) as { data: T };
  };

export const itemsApi = createApi({
  reducerPath: 'itemsApi',
  baseQuery: fetchBaseQuery({ baseUrl: REMOTE_ASSETS_BASE_URL }),
  endpoints: (builder) => ({
    fetchConstants: builder.query<Constants, boolean | void>({
      queryFn: queryWithFallback<Constants>('/constants.json')
    }),
    fetchSheets: builder.query<Sheets, boolean | void>({
      queryFn: queryWithFallback<Sheets>('/sheets.json')
    })
  })
});

export const { useFetchConstantsQuery, useFetchSheetsQuery } = itemsApi;
