import { localStorageLaunchDisabledNoticeKey } from '@/constants';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useState } from 'react';

/** One-time notice explaining why the "Launch Exalt" feature was removed. */
const LaunchDisabledNotice: React.FC = () => {
  const [visible, setVisible] = useState(
    () => localStorage.getItem(localStorageLaunchDisabledNoticeKey) !== 'true'
  );

  const onHide = () => {
    localStorage.setItem(localStorageLaunchDisabledNoticeKey, 'true');
    setVisible(false);
  };

  return (
    <Dialog
      header="Notice: Launch Exalt disabled"
      visible={visible}
      onHide={onHide}
      style={{ width: '32rem' }}
      footer={<Button label="Got it" icon="pi pi-check" onClick={onHide} autoFocus />}
    >
      <p className="mt-0">
        DECA has updated their policy: launching the game separately, without the official launcher,
        is now forbidden and will result in a ban.
      </p>
      <p>
        To keep your accounts safe, the <strong>Launch Exalt</strong> feature has been temporarily
        disabled. Please use the official launcher to start the game. Maybe in the future this
        feature will be reinstated by launching the game through the official launcher.
      </p>
      <p className="mb-0">Everything else in the app keeps working as usual.</p>
    </Dialog>
  );
};

export default LaunchDisabledNotice;
