import { TAURI_COMMANDS } from '@/constants';
import { createApi } from '@reduxjs/toolkit/query/react';
import { tauriCommandQuery } from './tauriCommandQuery';

const tauriApiFeatureKey = 'tauriApi';

export const tauriApi = createApi({
  reducerPath: tauriApiFeatureKey,
  baseQuery: tauriCommandQuery,
  endpoints: (builder) => ({
    launchExalt: builder.mutation<void, FetchAccountApiArg>({
      query: (queryArg) => ({
        commandName: TAURI_COMMANDS.LAUNCH_EXALT,
        params: {
          tauriArgs: {
            exaltPath: queryArg.exaltPath,
            deviceToken: queryArg.deviceToken,
            guid: queryArg.guid,
            password: queryArg.password
          }
        }
      })
    }),
    getSettings: builder.query<TauriSettingsModel, void>({
      query: () => ({
        commandName: TAURI_COMMANDS.GET_SETTINGS
      })
    })
  })
});

export type FetchAccountApiArg = {
  exaltPath: string;
  deviceToken: string;
  guid: string;
  password: string;
};

export interface TauriSettingsModel {
  secret_key: string | null;
}

export const { useLaunchExaltMutation, useGetSettingsQuery, useLazyGetSettingsQuery } = tauriApi;
