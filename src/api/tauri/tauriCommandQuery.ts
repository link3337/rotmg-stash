import { BaseQueryFn, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { invoke } from '@tauri-apps/api/core';

interface TauriCommand {
  commandName: string;
  params?: {
    tauriArgs?: TauriCommandQueryArg;
  };
}

type TauriCommandQueryArg = Record<string, unknown>;

// this might be used in the futurem, but for now it's just a placeholder
// also based on what the rust backend is doing
export const tauriCommandQuery: BaseQueryFn<TauriCommand, unknown, FetchBaseQueryError> = async (
  args,
  _,
  _extraOptions
) => {
  try {
    const commandName = args.commandName;
    const tauriArgs = args.params?.tauriArgs;

    const response = await invoke<unknown>(commandName, tauriArgs);
    return { data: response };
  } catch (error: unknown) {
    return {
      error: {
        status: 'CUSTOM_ERROR',
        data: error instanceof Error ? error.message : 'Unknown error'
      } as FetchBaseQueryError
    };
  }
};
