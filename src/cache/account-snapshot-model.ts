import { AccountModel } from './account-model';

export interface AccountSnapshotModel {
    id: string;
    name: string;
    createdAt: string;
    accounts: AccountModel[];
    scope?: 'all' | 'single';
    sourceAccountId?: string;
}

export interface AccountSnapshotMetadata {
    id: string;
    name: string;
    createdAt: string;
    accountCount: number;
    sizeBytes?: number;
    scope?: 'all' | 'single';
    sourceAccountId?: string;
}
