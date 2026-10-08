import { useAppSelector } from '@/hooks/redux';
import {
  GAME_ASSETS_PHASE_LABELS,
  useGameAssetsExtractor
} from '@/hooks/useGameAssetsExtractor';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import React, { useState } from 'react';

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
  const phaseLabel = progress ? GAME_ASSETS_PHASE_LABELS[progress.phase] ?? progress.phase : 'Preparing…';

  return (
    <div
      className="flex flex-wrap align-items-center justify-content-between gap-3 p-3 bg-yellow-100 text-900"
      role="alert"
    >
      <div className="flex align-items-center gap-2">
        <i className="pi pi-exclamation-triangle text-yellow-500" />
        <span>
          Game assets aren't extracted yet - item sprites are loading from the remote server.
          Extract them for offline portraits.
        </span>
      </div>

      <div className="flex align-items-center gap-3">
        {extracting || progress ? (
          <div className="flex flex-column gap-1" style={{ minWidth: '18rem' }}>
            <div className="flex justify-content-between text-sm">
              <span>{phaseLabel}</span>
              {progress && progress.total > 0 && (
                <span>
                  {progress.current}/{progress.total}
                </span>
              )}
            </div>
            <ProgressBar
              value={percentage}
              displayValueTemplate={(value) => `${Math.round(Number(value ?? 0))}%`}
              style={{ height: '2rem' }}
            />
          </div>
        ) : (
          <Button label="Extract now" icon="pi pi-database" loading={extracting} onClick={() => void extract()} />
        )}

        <Button
          icon="pi pi-times"
          text
          rounded
          severity="secondary"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        />
      </div>

      {error && <div className="w-full text-sm text-red-600">{error}</div>}
    </div>
  );
};

export default GameAssetsBanner;