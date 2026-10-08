import { useAppSelector } from '@hooks/redux';
import { GAME_ASSETS_PHASE_LABELS, useGameAssetsExtractor } from '@hooks/useGameAssetsExtractor';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import React from 'react';
import styles from './GameAssetsSettings.module.scss';

const GameAssetsSettings: React.FC = () => {
  const assets = useAppSelector((state) => state.assets);
  const { extract, extracting, progress, error, sourcePath } = useGameAssetsExtractor();

  const statusMap = {
    fresh: { severity: 'success', label: 'Up to date' },
    stale: { severity: 'warning', label: 'Game updated - regenerate' },
    missing: { severity: 'danger', label: 'Not extracted' },
    unknown: { severity: 'info', label: 'Checking…' }
  } as const;

  const percentage = progress && progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  const currentStatus = assets.availability in statusMap ? assets.availability : 'unknown';

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.icon} aria-hidden="true">
          <i className="pi pi-database" />
        </div>
        <div className={styles.titleGroup}>
          <span className={styles.eyebrow}>Game Assets</span>
          <p>Keep item sprites and portraits available without a network request.</p>
        </div>
        <Tag severity={statusMap[currentStatus].severity} value={statusMap[currentStatus].label} />
      </div>

      <div className={styles.actionRow}>
        <div className={styles.source}>
          <i className="pi pi-folder" aria-hidden="true" />
          <div>
            <span>Asset source</span>
            <strong title={sourcePath ?? undefined}>
              {sourcePath ?? 'Auto-detect game install'}
            </strong>
          </div>
        </div>
        <Button
          label="Extract"
          icon="pi pi-database"
          onClick={() => void extract()}
          loading={extracting}
        />
      </div>

      {progress && (
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span>{GAME_ASSETS_PHASE_LABELS[progress.phase] ?? progress.phase}</span>
            <span>
              {progress.current}/{progress.total}
              {progress.total > 0 && <strong>{` ${Math.round(percentage)}%`}</strong>}
            </span>
          </div>
          <ProgressBar value={percentage} showValue={false} className={styles.progress} />
          {progress.message && <small>{progress.message}</small>}
        </div>
      )}

      {error && <Message severity="error" text={error} className={styles.error} />}

      <div className={styles.cacheRow}>
        <span>
          <i className="pi pi-database" aria-hidden="true" /> Cache location
        </span>
        <strong title={assets.cacheDir ?? undefined}>
          {assets.cacheDir ? assets.cacheDir : 'Cache directory pending'}
        </strong>
      </div>
    </Card>
  );
};

export default GameAssetsSettings;
