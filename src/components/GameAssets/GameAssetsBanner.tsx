import { useAppSelector } from '@/hooks/redux';
import { GAME_ASSETS_PHASE_LABELS, useGameAssetsExtractor } from '@/hooks/useGameAssetsExtractor';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import React, { useState } from 'react';
import styles from './GameAssetsBanner.module.scss';

const GameAssetsBanner: React.FC = () => {
  const { extract, extracting, progress, error } = useGameAssetsExtractor();
  const useGameAssets = useAppSelector((state) => state.settings.displaySettings.useGameAssets);
  const availability = useAppSelector((state) => state.assets.availability);
  const [dismissed, setDismissed] = useState(false);

  const show = useGameAssets && !dismissed && (availability === 'missing' || extracting);

  if (!show) {
    return null;
  }

  const percentage = progress && progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  const phaseLabel = progress
    ? (GAME_ASSETS_PHASE_LABELS[progress.phase] ?? progress.phase)
    : 'Preparing…';

  return (
    <section className={styles.banner} role="alert">
      <div className={styles.mainContent}>
        <div className={styles.icon} aria-hidden="true">
          <i className="pi pi-database" />
        </div>

        <div className={styles.copy}>
          <div className={styles.eyebrow}>Game assets</div>
          <div className={styles.headingRow}>
            <h3>Game assets aren't extracted yet</h3>
            <Tag severity="warning" value={extracting ? 'Extracting' : 'Not extracted'} />
          </div>
          <p>
            Item sprites are loading from the remote server. Extract them for offline portraits.
          </p>
        </div>
      </div>

      <div className={styles.actions}>
        {extracting || progress ? (
          <div className={styles.progressSummary}>
            <div className={styles.progressLabel}>
              <span>{phaseLabel}</span>
              {progress && progress.total > 0 && (
                <span>
                  {progress.current}/{progress.total}
                  <strong className={styles.percentage}> {Math.round(percentage)}%</strong>
                </span>
              )}
            </div>
            <ProgressBar value={percentage} showValue={false} className={styles.progress} />
          </div>
        ) : (
          <Button
            label="Extract now"
            icon="pi pi-download"
            severity="warning"
            loading={extracting}
            onClick={() => void extract()}
          />
        )}

        <Button
          icon="pi pi-times"
          text
          rounded
          severity="secondary"
          className={styles.dismiss}
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        />
      </div>

      {error && <Message severity="error" text={error} className={styles.error} />}
    </section>
  );
};

export default GameAssetsBanner;
