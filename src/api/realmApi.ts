import { TAURI_COMMANDS } from '@/constants';
import { CharListResponse } from '@realm/models/charlist-response';
import { invoke } from '@tauri-apps/api/core';
import { info } from '@tauri-apps/plugin-log';
import { xmlToJson } from '@utils/xml';

export async function getAccountData(
  guid: string,
  password: string
): Promise<CharListResponse | string> {
  // call tauri "get_account_data" command
  info('Getting account data from tauri');
  const apiResponse: string = await invoke(TAURI_COMMANDS.GET_ACCOUNT_DATA, {
    guid,
    password
  });

  const parser = new DOMParser();
  let xml: any = parser.parseFromString(apiResponse, 'text/xml');
  const json: CharListResponse = xmlToJson(xml);

  return json;
}
