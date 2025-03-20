import { ExperimentalSettingsModel } from '@/cache/settings-model';
import { useAppDispatch } from '@/hooks/redux';
import {
  toggleDebugMode,
  toggleStreamerMode,
  updateExperimentalSetting
} from '@store/slices/SettingsSlice';
import { open } from '@tauri-apps/plugin-dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import React, { useState } from 'react';
import DeviceTokenHelperDialog from './DeviceTokenHelperDialog';

interface ExperimentalSettingsProps {
  experimentalSettings: ExperimentalSettingsModel;
}

const ExperimentalSettings: React.FC<ExperimentalSettingsProps> = ({ experimentalSettings }) => {
  const dispatch = useAppDispatch();

  const [showDeviceTokenHelp, setShowDeviceTokenHelp] = useState(false);

  return (
    <>
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
              checked={experimentalSettings?.lazyLoading}
              onChange={() => dispatch(updateExperimentalSetting({ key: 'lazyLoading' }))}
            />
            <label htmlFor="lazyLoading" className="ml-2">
              Lazy Loading
              <small className="block text-500">
                Only render accounts when they are visible in viewport
              </small>
            </label>
          </div>

          {experimentalSettings?.lazyLoading && (
            <div className="flex gap-3 ml-4 mt-2">
              <div className="flex flex-column gap-2">
                <label htmlFor="lazyLoadingHeight">Default Height</label>
                <InputNumber
                  id="lazyLoadingHeight"
                  useGrouping={false}
                  suffix="px"
                  value={experimentalSettings?.lazyLoadingHeight}
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
                  value={experimentalSettings?.lazyLoadingOffset}
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

              <div className="flex align-items-center gap-2 mt-5">
                <Checkbox
                  inputId="lazyLoadingKeepRendered"
                  checked={experimentalSettings?.lazyLoadingKeepRendered}
                  onChange={() =>
                    dispatch(updateExperimentalSetting({ key: 'lazyLoadingKeepRendered' }))
                  }
                />
                <label htmlFor="lazyLoadingKeepRendered" className="ml-2">
                  Keep components rendered even when not visible
                </label>
              </div>
            </div>
          )}

          <div className="flex align-items-center gap-2">
            <Checkbox
              checked={experimentalSettings?.isStreamerMode}
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
              checked={experimentalSettings?.isDebugMode}
              onChange={() => dispatch(toggleDebugMode())}
              id="debug"
            />
            <label htmlFor="debug" className="ml-2">
              Debug
              <small className="block text-500">Enable debug component</small>
            </label>
          </div>

          <div className="flex flex-column gap-2 mt-3">
            <label htmlFor="exaltPath">Exalt Path</label>
            <div className="p-inputgroup">
              <InputText id="exaltPath" value={experimentalSettings?.exaltPath || ''} readOnly />
              <Button
                icon="pi pi-folder-open"
                onClick={async () => {
                  try {
                    const selected = await open({
                      directory: true,
                      multiple: false,
                      defaultPath: experimentalSettings?.exaltPath
                    });

                    if (selected) {
                      dispatch(
                        updateExperimentalSetting({
                          key: 'exaltPath',
                          value: selected as string
                        })
                      );
                    }
                  } catch (err) {
                    console.error('Failed to open folder dialog:', err);
                  }
                }}
              />
            </div>
          </div>

          <div className="flex flex-column gap-2 mt-3">
            <div className="flex align-items-center gap-2">
              <label htmlFor="deviceToken">Device Token</label>
              <Button
                icon="pi pi-question-circle"
                className="p-button-text p-button-rounded p-button-sm"
                onClick={() => setShowDeviceTokenHelp(true)}
              />
            </div>
            <InputText
              id="deviceToken"
              value={experimentalSettings?.deviceToken}
              onChange={(e) =>
                dispatch(
                  updateExperimentalSetting({
                    key: 'deviceToken',
                    value: e.target.value
                  })
                )
              }
            />
          </div>
        </div>
      </div>
      <DeviceTokenHelperDialog
        showDeviceTokenHelp={showDeviceTokenHelp}
        onClose={() => setShowDeviceTokenHelp(false)}
      />
    </>
  );
};

export default ExperimentalSettings;
