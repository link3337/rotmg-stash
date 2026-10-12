import { LOCAL_ASSETS_BASE_URL, REMOTE_ASSETS_BASE_URL } from '@/constants';
import { Constants, Sheets } from '@/realm/renders/constant';
import type { RootState } from '@/store';
import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue
} from '@reduxjs/toolkit/query';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { selectGameAssetsBase } from '@store/slices/AssetsSlice';

export interface AssetsQueryArgs {
  useGameAssets: boolean;
  useLocalAssets: boolean;
  gameBase?: string | null;
}

const remoteBaseQuery = fetchBaseQuery({ baseUrl: REMOTE_ASSETS_BASE_URL });
const localBaseQuery = fetchBaseQuery({ baseUrl: LOCAL_ASSETS_BASE_URL });

const toQueryArgs = (arg: boolean | AssetsQueryArgs | void): AssetsQueryArgs => {
  if (typeof arg === 'object' && arg) {
    return {
      useGameAssets: !!arg.useGameAssets,
      useLocalAssets: !!arg.useLocalAssets,
      gameBase: arg.gameBase ?? null
    };
  }

  return {
    useGameAssets: false,
    useLocalAssets: !!arg
  };
};

const queryWithFallback =
  <T>(url: string) =>
  async (
    arg: boolean | AssetsQueryArgs | void,
    api: any,
    extraOptions: any
  ): Promise<QueryReturnValue<T, FetchBaseQueryError, FetchBaseQueryMeta>> => {
    const request = {
      url,
      cache: 'no-cache' as RequestCache
    };

    const queryArgs = toQueryArgs(arg);
    const baseCandidates: Array<{ name: string; baseUrl: string }> = [];

    if (queryArgs.useGameAssets && queryArgs.gameBase) {
      baseCandidates.push({ name: 'game', baseUrl: queryArgs.gameBase });
    }

    if (queryArgs.useLocalAssets) {
      baseCandidates.push({ name: 'local', baseUrl: LOCAL_ASSETS_BASE_URL });
      baseCandidates.push({ name: 'remote', baseUrl: REMOTE_ASSETS_BASE_URL });
    } else {
      baseCandidates.push({ name: 'remote', baseUrl: REMOTE_ASSETS_BASE_URL });
      baseCandidates.push({ name: 'local', baseUrl: LOCAL_ASSETS_BASE_URL });
    }

    let lastResult: QueryReturnValue<T, FetchBaseQueryError, FetchBaseQueryMeta> | undefined;
    for (const candidate of baseCandidates) {
      const baseQuery =
        candidate.baseUrl === LOCAL_ASSETS_BASE_URL
          ? localBaseQuery
          : candidate.baseUrl === REMOTE_ASSETS_BASE_URL
            ? remoteBaseQuery
            : fetchBaseQuery({ baseUrl: candidate.baseUrl });
      const result = (await baseQuery(request, api, extraOptions)) as QueryReturnValue<
        T,
        FetchBaseQueryError,
        FetchBaseQueryMeta
      >;
      if (!result.error) {
        return result;
      }

      lastResult = result;
      console.warn(`[itemsApi] ${candidate.name} asset request failed`, {
        url,
        baseUrl: candidate.baseUrl,
        error: result.error
      });
    }

    if (lastResult) {
      return lastResult;
    }

    return remoteBaseQuery(request, api, extraOptions) as QueryReturnValue<
      T,
      FetchBaseQueryError,
      FetchBaseQueryMeta
    >;
  };

export const makeAssetsQueryArgs = (state: RootState): AssetsQueryArgs => ({
  useGameAssets: !!state.settings.displaySettings.useGameAssets,
  useLocalAssets: !!state.settings.displaySettings.useLocalAssets,
  gameBase: selectGameAssetsBase(state)
});

export const itemsApi = createApi({
  reducerPath: 'itemsApi',
  baseQuery: fetchBaseQuery({ baseUrl: REMOTE_ASSETS_BASE_URL }),
  tagTypes: ['Assets'],
  endpoints: (builder) => ({
    fetchConstants: builder.query<Constants, boolean | AssetsQueryArgs | void>({
      queryFn: queryWithFallback<Constants>('/constants.json'),
      providesTags: ['Assets']
    }),
    fetchSheets: builder.query<Sheets, boolean | AssetsQueryArgs | void>({
      queryFn: queryWithFallback<Sheets>('/sheets.json'),
      providesTags: ['Assets']
    })
  })
});

export const { useFetchConstantsQuery, useFetchSheetsQuery } = itemsApi;
