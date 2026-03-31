import { RealmItemMap } from '@/realm/renders/item';
import { isPortraitReady, portrait, waitForPortraitReady } from '@utils/portrait';
import { Dialog } from 'primereact/dialog';
import { FC, useEffect, useState } from 'react';
import styles from './CharacterBuilder.module.scss';

export type ResultEntryKind = 'skin' | 'item';

export interface SpinResultEntry {
  key: string;
  label: string;
  itemId: number;
  name: string;
  kind: ResultEntryKind;
}

interface ResultPopupDialogProps {
  visible: boolean;
  onHide: () => void;
  entries: SpinResultEntry[];
  items: RealmItemMap;
  assetsBaseUrl: string;
}

const ResultPopupDialog: FC<ResultPopupDialogProps> = ({
  visible,
  onHide,
  entries,
  items,
  assetsBaseUrl
}) => {
  const [portraitReady, setPortraitReady] = useState(isPortraitReady());

  useEffect(() => {
    if (portraitReady) return;

    let cancelled = false;
    waitForPortraitReady().then(() => {
      if (!cancelled) {
        setPortraitReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [portraitReady]);

  return (
    <Dialog
      header="Spin Result"
      visible={visible}
      onHide={onHide}
      modal
      dismissableMask
      style={{ width: 'min(96vw, 980px)' }}
    >
      <div className={styles.resultPopupList}>
        {entries.map((entry) => {
          const item = entry.kind === 'item' ? items?.[entry.itemId] : undefined;
          const skinImage =
            entry.kind === 'skin' && portraitReady
              ? portrait(entry.itemId, entry.itemId, -1, -1)
              : '';

          return (
            <div key={entry.key} className={styles.resultPopupRow}>
              <div className={styles.resultPopupLabel}>{entry.label}</div>
              <div className={styles.resultPopupValue}>
                <div className={styles.resultPopupIcon}>
                  {entry.kind === 'item' && item ? (
                    <div
                      className={styles.reelSprite}
                      style={{
                        backgroundPosition: `-${item.x}px -${item.y}px`,
                        backgroundImage: `url('${assetsBaseUrl}/renders.png')`
                      }}
                    />
                  ) : skinImage ? (
                    <img src={skinImage} alt={entry.name} className={styles.resultSkinImage} />
                  ) : (
                    <span className={styles.emptyLabel}>-</span>
                  )}
                </div>
                <span className={styles.resultPopupName}>{entry.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Dialog>
  );
};

export default ResultPopupDialog;
