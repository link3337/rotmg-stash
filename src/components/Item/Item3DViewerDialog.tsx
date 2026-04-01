import { Dialog } from 'primereact/dialog';
import React from 'react';
import ItemViewer3D from './ItemViewer3D';

interface Item3DViewerDialogProps {
    visible: boolean;
    onHide: () => void;
    itemName: string;
    itemId: number;
    spriteX: number;
    spriteY: number;
    assetsBaseUrl: string;
    isShiny?: boolean;
    slotCount?: number;
}

const Item3DViewerDialog: React.FC<Item3DViewerDialogProps> = ({
    visible,
    onHide,
    itemName,
    itemId,
    spriteX,
    spriteY,
    assetsBaseUrl,
    isShiny = false,
    slotCount = 0
}) => {
    const [viewerKey, setViewerKey] = React.useState(0);

    return (
        <Dialog
            header={`${itemName} (#${itemId}) - 3D Viewer`}
            visible={visible}
            resizable
            maximizable
            closeOnEscape
            modal
            dismissableMask
            onHide={onHide}
            onShow={() => setViewerKey((prev) => prev + 1)}
            style={{ width: 'min(96vw, 760px)' }}
            breakpoints={{ '1200px': '82vw', '960px': '92vw' }}
            contentStyle={{ padding: 0, overflow: 'hidden' }}
        >
            <div style={{ width: '100%' }}>
                <ItemViewer3D
                    key={viewerKey}
                    spriteX={spriteX}
                    spriteY={spriteY}
                    assetsBaseUrl={assetsBaseUrl}
                    isShiny={isShiny}
                    slotCount={slotCount}
                    width="100%"
                    height="62vh"
                />
            </div>
        </Dialog>
    );
};

export default Item3DViewerDialog;