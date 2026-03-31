import { CursedSettingsModel } from '@cache/settings-model';
import { useAppDispatch } from '@hooks/redux';
import { toggleCursedSetting } from '@store/slices/SettingsSlice';
import { Checkbox } from 'primereact/checkbox';
import React from 'react';

interface CursedSettingsProps {
  cursedSettings: CursedSettingsModel;
}

const CursedSettings: React.FC<CursedSettingsProps> = ({ cursedSettings }) => {
  const dispatch = useAppDispatch();

  return (
    <div className="mt-3">
      <h4>💀 Cursed Settings</h4>
      <div className="p-3 border-2 border-yellow-500 border-round">
        <small className="text-yellow-500 block mb-3">
          Warning: These features are cursed and may not work as expected.
        </small>

        <div className="flex align-items-center">
          <Checkbox
            inputId="enable3DCharacterViewer"
            checked={cursedSettings.enable3DCharacterViewer}
            onChange={() => dispatch(toggleCursedSetting('enable3DCharacterViewer'))}
          />
          <label htmlFor="enable3DCharacterViewer" className="ml-2">
            Enable 3D Character Viewer
          </label>
        </div>
      </div>
    </div>
  );
};

export default CursedSettings;
