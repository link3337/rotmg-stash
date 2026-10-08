import { CursedSettingsModel } from '@cache/settings-model';
import { useAppDispatch } from '@hooks/redux';
import { toggleCursedSetting } from '@store/slices/SettingsSlice';
import { Checkbox } from 'primereact/checkbox';
import React from 'react';
import SettingsCard from '../SettingsCard';

interface CursedSettingsProps {
  cursedSettings: CursedSettingsModel;
}

const CursedSettings: React.FC<CursedSettingsProps> = ({ cursedSettings }) => {
  const dispatch = useAppDispatch();

  return (
    <SettingsCard title="💀 Cursed Settings" icon="pi-bolt">
      <small className="text-yellow-500 block mb-3">
        Warning: These features are cursed and may not work as expected.
      </small>

      <div className="flex align-items-center">
        <Checkbox
          inputId="enable3DViewer"
          checked={cursedSettings.enable3DViewer}
          onChange={() => dispatch(toggleCursedSetting('enable3DViewer'))}
        />
        <label htmlFor="enable3DViewer" className="ml-2">
          Enable 3D Viewer
        </label>
      </div>
    </SettingsCard>
  );
};

export default CursedSettings;
