import { Dialog } from 'primereact/dialog';
import React from 'react';
import SkinViewer3D from './SkinViewer3D';

interface Character3DViewerDialogProps {
  visible: boolean;
  onHide: () => void;
  characterClassName?: string;
  characterId?: number;
  type?: number | string | null;
  skin?: number | string | null;
  tex1?: string | number | null;
  tex2?: string | number | null;
  width?: number | string;
  height?: number | string;
}

const Character3DViewerDialog: React.FC<Character3DViewerDialogProps> = ({
  visible,
  onHide,
  characterClassName,
  characterId,
  type,
  skin,
  tex1,
  tex2,
  width = '100%',
  height = 320
}) => {
  const [viewerKey, setViewerKey] = React.useState(0);
  const viewerType = Number(type ?? 0);
  const viewerSkin = Number(skin ?? type ?? 0);

  return (
    <Dialog
      header={`${characterClassName ?? 'Character'} #${characterId ?? ''} - 3D Viewer`}
      visible={visible}
      closeOnEscape
      onHide={onHide}
      onShow={() => setViewerKey((prev) => prev + 1)}
      style={{ width: 'min(92vw, 420px)' }}
      contentStyle={{ padding: 0, overflow: 'hidden' }}
    >
      <div style={{ width: '100%' }}>
        <SkinViewer3D
          key={viewerKey}
          type={viewerType}
          skin={viewerSkin}
          tex1={tex1}
          tex2={tex2}
          width={width}
          height={height}
        />
      </div>
    </Dialog>
  );
};

export default Character3DViewerDialog;
