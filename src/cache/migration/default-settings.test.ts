import { describe, expect, it } from 'vitest';
import { defaultDisplaySettings } from './default-settings';
import { migrateSettings } from './settings-migration';

describe('default settings migration', () => {
  it('merges the game asset toggle into display settings', () => {
    expect(defaultDisplaySettings.useGameAssets).toBe(true);

    const migrated = migrateSettings({
      displaySettings: {
        ...defaultDisplaySettings,
        useLocalAssets: true
      }
    });

    expect(migrated.displaySettings.useGameAssets).toBe(true);
    expect(migrated.displaySettings.useLocalAssets).toBe(true);
  });
});
