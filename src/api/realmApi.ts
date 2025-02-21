import { CharListResponse } from '@realm/models/charlist-response';
import { invoke } from '@tauri-apps/api/core';
import { xmlToJson } from '@utils/xml';

export async function getAccount(
  guid: string,
  password: string
): Promise<CharListResponse | string> {
  // call tauri
  const apiResponse: string = await invoke('get_account', {
    guid,
    password
  });

  const parser = new DOMParser();
  console.log(apiResponse);

  let xml: any = parser.parseFromString(apiResponse, 'text/xml');

  const json: CharListResponse = xmlToJson(xml);

  console.log(json);
  return json;
}
