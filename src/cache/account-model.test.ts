import { describe, expect, it } from 'vitest';
import { AccountModel, sanitizeAccountSnapshotData } from './account-model';

describe('sanitizeAccountSnapshotData', () => {
    it('removes sensitive and transient fields from an account before it is persisted in a snapshot', () => {
        const account: AccountModel = {
            id: 'account-1',
            email: 'player@example.com',
            password: 'super-secret',
            active: true,
            lastSaved: '2026-07-15T00:00:00.000Z',
            mappedData: undefined,
            error: 'stale',
            queueStatus: 'idle'
        };

        const sanitized = sanitizeAccountSnapshotData(account);

        expect('password' in sanitized).toBe(false);
        expect('error' in sanitized).toBe(false);
        expect('queueStatus' in sanitized).toBe(false);
        expect(sanitized.mappedData).toBeUndefined();
        expect(sanitized.email).toBe(account.email);
        expect(sanitized.active).toBe(account.active);
    });
});
