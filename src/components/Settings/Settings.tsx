import { DisplaySettings } from '@cache/settings-model';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import {
  addSortCriteria,
  removeSortCriteria,
  SortFields,
  toggleDebugMode,
  toggleSetting,
  toggleSortDirection,
  toggleStreamerMode,
  updateExperimentalSetting,
  updateItemSort,
  updateQueueFetchInterval,
  updateTheme
} from '@store/slices/SettingsSlice';
import { Theme } from '@tauri-apps/api/window';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';

export interface DisplayOption {
  label: string;
  key: keyof DisplaySettings;
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

  const getAvailableOptions = (currentIndex: number) => {
    const usedFields = settings.itemSort
      .map((sort) => sort.field)
      .filter((_, idx) => idx !== currentIndex);

    return sortOptions.map((option) => ({
      ...option,
      disabled: usedFields.includes(option.value as string)
    }));
  };

  const hasAvailableOptions = (): boolean => {
    const usedFields = settings.itemSort.map((sort) => sort.field);
    return sortOptions.some((option) => !usedFields.includes(option.value));
  };

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
            {settings.itemSort.map((sort, index) => (
              <div key={index} className="flex align-items-center gap-2">
                <Dropdown
                  value={sort.field}
                  options={getAvailableOptions(index)}
                  onChange={(e) =>
                    dispatch(
                      updateItemSort({
                        index,
                        field: e.value,
                        direction: sort.direction
                      })
                    )
                  }
                  optionLabel="label"
                  optionValue="value"
                  placeholder={`Sort Level ${index + 1}`}
                  className="flex-grow-1"
                />
                <Button
                  icon={`pi pi-sort-${sort.direction === 'asc' ? 'up' : 'down'}`}
                  onClick={() => dispatch(toggleSortDirection(index))}
                />
                <Button
                  icon="pi pi-times"
                  className="p-button-danger"
                  onClick={() => dispatch(removeSortCriteria(index))}
                  disabled={index === 0}
                />
              </div>
            ))}

            <Button
              icon="pi pi-plus"
              label="Add Sort"
              className="p-button-outlined mt-2"
              onClick={() => dispatch(addSortCriteria())}
              disabled={!hasAvailableOptions()}
            />
          </div>
          <div className="flex flex-column">
            <h4>Queue Interval</h4>
            <Dropdown
              id="queueFetchInterval"
              value={settings.queueFetchInterval}
              options={queueFetchIntervalOptions}
              onChange={(e) => dispatch(updateQueueFetchInterval(e.value))}
              placeholder="Select Interval"
            />
          </div>
        </div>

        <div className="col-12 mt-3">
          <h4>
            <i className="pi pi-exclamation-triangle text-yellow-500 mr-2" />
            Experimental Features
          </h4>
          <div className="p-3 border-2 border-yellow-500 border-round">
            <small className="text-yellow-500 block mb-3">
              Warning: These features are experimental and may not work as expected.
            </small>
            <div className="flex flex-column gap-2">
              <div className="flex align-items-center">
                <Checkbox
                  inputId="lazyLoading"
                  checked={settings?.experimental?.lazyLoading}
                  onChange={() => dispatch(updateExperimentalSetting({ key: 'lazyLoading' }))}
                />
                <label htmlFor="lazyLoading" className="ml-2">
                  Lazy Loading
                  <small className="block text-500">
                    Only render accounts when they are visible in viewport
                  </small>
                </label>
              </div>

              {settings.experimental.lazyLoading && (
                <div className="flex gap-3 ml-4 mt-2">
                  <div className="flex flex-column gap-2">
                    <label htmlFor="lazyLoadingHeight">Default Height</label>
                    <InputNumber
                      id="lazyLoadingHeight"
                      useGrouping={false}
                      suffix="px"
                      value={settings?.experimental?.lazyLoadingHeight}
                      onChange={(e) =>
                        dispatch(
                          updateExperimentalSetting({
                            key: 'lazyLoadingHeight',
                            value: e.value
                          })
                        )
                      }
                    />
                  </div>

                  <div className="flex flex-column gap-2">
                    <label htmlFor="lazyLoadingOffset">Visible Offset</label>
                    <InputNumber
                      id="lazyLoadingOffset"
                      useGrouping={false}
                      suffix="px"
                      value={settings?.experimental?.lazyLoadingOffset}
                      onChange={(e) =>
                        dispatch(
                          updateExperimentalSetting({
                            key: 'lazyLoadingOffset',
                            value: e.value
                          })
                        )
                      }
                    />
                  </div>
                </div>
              )}

              <div className="flex align-items-center gap-2">
                <Checkbox
                  checked={settings.experimental.isStreamerMode}
                  onChange={() => dispatch(toggleStreamerMode())}
                  id="streamerMode"
                />
                <label htmlFor="streamerMode" className="ml-2">
                  Streamer Mode
                  <small className="block text-500">Mask email addresses for privacy</small>
                </label>
              </div>

              <div className="flex align-items-center gap-2">
                <Checkbox
                  checked={settings.experimental.isDebugMode}
                  onChange={() => dispatch(toggleDebugMode())}
                  id="debug"
                />
                <label htmlFor="debug" className="ml-2">
                  Debug
                  <small className="block text-500">Enable debug component</small>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Settings;
