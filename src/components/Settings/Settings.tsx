import { DisplaySettingsModel } from '@cache/settings-model';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import {
  SortFields,
  toggleSetting,
  toggleSortDirection,
  updateItemSort,
  updateQueueFetchInterval,
  updateTheme
} from '@store/slices/SettingsSlice';
import { Theme } from '@tauri-apps/api/window';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import ExperimentalSettings from './Experimental/ExperimentalSettings';

export interface DisplayOption {
  label: string;
  key: keyof DisplaySettingsModel;
  tooltip?: string;
}

const themeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' }
];

export interface SortOption {
  label: string;
  value: SortFields;
}

export type SortSetting = {
  field: keyof typeof SortFields;
  direction: 'asc' | 'desc';
};

const sortOptions: SortOption[] = [
  {
    label: 'Item ID',
    value: SortFields.id
  },
  {
    label: 'Name',
    value: SortFields.name
  },
  {
    label: 'Slot Type',
    value: SortFields.slotType
  },
  {
    label: 'Fame Bonus',
    value: SortFields.fameBonus
  },
  {
    label: 'Feed Power',
    value: SortFields.feedPower
  },
  {
    label: 'Bag Type',
    value: SortFields.bagType
  },
  {
    label: 'Soulbound',
    value: SortFields.soulbound
  },
  {
    label: 'Tier',
    value: SortFields.tier
  },
  {
    label: 'Shiny',
    value: SortFields.shiny
  }
];

const queueFetchIntervalOptions = Array.from({ length: 31 }, (_, i) => ({
  label: `${60 + i} seconds`,
  value: (60 + i) * 1000
}));

const Settings: React.FC = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);

  const handleThemeChange = (e: DropdownChangeEvent) => {
    dispatch(updateTheme(e.value as Theme));
  };

  const displayOptions: DisplayOption[] = [
    { label: 'Show Totals', key: 'showTotals' },
    { label: 'Show Account Info', key: 'showAccountInfo' },
    { label: 'Show Exalts', key: 'showExalts' },
    { label: 'Show Characters', key: 'showCharacters' },
    { label: 'Show Vault', key: 'showVault' },
    { label: 'Show Gift Chest', key: 'showGiftChest' },
    { label: 'Show Seasonal Spoils', key: 'showSeasonalSpoils' },
    { label: 'Show Materials', key: 'showMaterials' },
    { label: 'Show Potions', key: 'showPotions' },
    { label: 'Show Consumables', key: 'showConsumables' },
    { label: 'Show Item Tooltips', key: 'showItemTooltips' },
    { label: 'Show Account Name', key: 'showAccountName' },
    { label: 'Show IGN in Queue Status', key: 'showIngameNameInQueue' },
    { label: 'Compact Vaults', key: 'compactVaults' }
  ];

  return (
    <Card>
      <div className="grid">
        <div className="col-6">
          <h4>Theme & Display</h4>
          <div className="flex flex-column gap-3">
            <div>
              <Dropdown
                value={settings.theme}
                options={themeOptions}
                onChange={handleThemeChange}
                className="w-full"
                appendTo="self"
              />
            </div>

            <div className="flex flex-column gap-2">
              {displayOptions.map((option) => (
                <div key={option.key} className="flex align-items-center">
                  <Checkbox
                    inputId={option.key}
                    checked={settings.displaySettings[option.key]}
                    onChange={() => dispatch(toggleSetting(option.key))}
                  />
                  <label htmlFor={option.key} className="ml-2">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-6">
          <h4>Item Sort</h4>
          <div className="flex flex-column gap-2">
            <div className="flex align-items-center gap-2">
              <Dropdown
                value={settings.itemSort.field}
                options={sortOptions}
                onChange={(e) =>
                  dispatch(
                    updateItemSort({
                      field: e.value,
                      direction: settings.itemSort.direction
                    })
                  )
                }
                optionLabel="label"
                optionValue="value"
                placeholder="Select sort field"
                className="flex-grow-1"
                appendTo="self"
              />
              <Button
                icon={`pi pi-sort-${settings.itemSort.direction === 'asc' ? 'up' : 'down'}`}
                onClick={() => dispatch(toggleSortDirection())}
              />
            </div>
          </div>
          <div className="flex flex-column">
            <h4>Queue Interval</h4>
            <Dropdown
              id="queueFetchInterval"
              value={settings.queueFetchInterval}
              options={queueFetchIntervalOptions}
              onChange={(e) => dispatch(updateQueueFetchInterval(e.value))}
              placeholder="Select Interval"
              appendTo="self"
            />
          </div>
        </div>

        <div className="col-12 mt-3">
          <ExperimentalSettings experimentalSettings={settings?.experimental} />
        </div>
      </div>
    </Card>
  );
};

export default Settings;
