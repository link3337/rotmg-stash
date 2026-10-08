import { useAppSelector } from '@hooks/redux';
import {
  GAME_ASSETS_PHASE_LABELS,
  useGameAssetsExtractor
} from '@hooks/useGameAssetsExtractor';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import React from 'react';

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
    <div className="p-3 border-1 border-round surface-border">
      <div className="flex align-items-center justify-content-between mb-3">
        <h4 className="m-0">Game Assets</h4>
        <Tag severity={statusMap[currentStatus].severity} value={statusMap[currentStatus].label} />
      </div>

      <div className="flex align-items-center gap-2 mb-3">
        <Button label="Extract" icon="pi pi-database" onClick={() => void extract()} loading={extracting} />
        <small className="text-500">{sourcePath ?? 'Auto-detect game install'}</small>
      </div>

      {progress && (
        <div className="mb-3">
          <div className="flex justify-content-between text-sm mb-1">
            <span>{GAME_ASSETS_PHASE_LABELS[progress.phase] ?? progress.phase}</span>
            <span>
              {progress.current}/{progress.total}
            </span>
          </div>
          <ProgressBar
            value={percentage}
            displayValueTemplate={(value) => `${Math.round(Number(value ?? 0))}%`}
            style={{ height: '2rem' }}
          />
          {progress.message && <small className="text-500 block mt-1">{progress.message}</small>}
        </div>
      )}

      {error && <small className="text-red-500 block mb-3">{error}</small>}

      <div className="text-sm text-500">
        {assets.cacheDir ? `Cache: ${assets.cacheDir}` : 'Cache directory pending'}
      </div>
    </div>
  );
};

export default GameAssetsSettings;