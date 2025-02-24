import { SettingsModel } from './settings-model';

export interface ExportModel {
  accounts: AccountExportModel[];
  settings: SettingsModel;
}

export interface AccountExportModel {
  email: string;
  password: string;
}
