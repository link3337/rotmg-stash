import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import CodeBlock from '../Util/CodeBlock';
import { deviceTokenPowershellScript } from './device-token-powershell-script';

interface DeviceTokenHelperDialog {
  showDeviceTokenHelp: boolean;
  onClose: () => void;
}

const DeviceTokenHelperDialog: React.FC<DeviceTokenHelperDialog> = ({
  showDeviceTokenHelp: show,
  onClose
}) => {
  const toast = useRef<Toast>(null);

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(deviceTokenPowershellScript);
      toast.current?.show({
        severity: 'success',
        summary: 'Copied',
        detail: 'Script copied to clipboard',
        life: 3000
      });
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy script',
        life: 3000
      });
    }
  };

  return (
    <Dialog
      header="Run this PowerShell script to get your device token"
      visible={show}
      onHide={() => onClose()}
      closeOnEscape
      dismissableMask
      style={{ width: '70vw' }}
    >
      <div className="flex flex-column">
        <div className="border-round relative">
          <CodeBlock language="powershell" value={deviceTokenPowershellScript} />
          <div className="flex align-items-center gap-2 mt-2">
            <Button
              icon="pi pi-copy"
              className="p-button-rounded p-button-text p-button-sm"
              onClick={handleCopyClick}
              tooltip="Copy to clipboard"
            />
            <p className="m-0">Copy the generated device token into the textbox afterwards.</p>
          </div>
        </div>
      </div>
      <Toast ref={toast} />
    </Dialog>
  );
};

export default DeviceTokenHelperDialog;
