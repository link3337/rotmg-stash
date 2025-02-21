import { CharListResponse } from '@realm/models/charlist-response';
import { createApi } from '@reduxjs/toolkit/query/react';
import { tauriCommandQuery } from './tauriCommandQuery';

export const tauriApi = createApi({
  reducerPath: 'tauriApi',
  baseQuery: tauriCommandQuery,
  endpoints: (builder) => ({
    getAccount: builder.query<CharListResponse, FetchAccountApiArg>({
      query: (queryArg) => ({
        commandName: 'get_account',
        params: {
          tauriArgs: {
            guid: queryArg.guid,
            password: queryArg.password
          }
        }
      })
    }),
    getSettings: builder.query<TauriSettingsModel, void>({
      query: () => ({
        commandName: 'get_settings'
      })
    })
  })
});

export type FetchAccountApiArg = {
  guid: string;
  password: string;
};

export interface TauriSettingsModel {
  secret_key: string | null;
}

export const {
  useLazyGetAccountQuery,
  useGetAccountQuery,
  useGetSettingsQuery,
  useLazyGetSettingsQuery
} = tauriApi;
