import { Constants } from '@/realm/renders/constant';
import { isPortraitReady, portrait, waitForPortraitReady } from '@utils/portrait';
import { Button } from 'primereact/button';
import { FC, useEffect, useMemo, useState } from 'react';
import styles from './CharacterBuilder.module.scss';

interface SkinSpinnerSlotProps {
  skinPool: number[];
  previewPool: number[];
  selectedSkinId: number;
  strip: number[];
  isRolling: boolean;
  slotOffset: number;
  slotDuration: number;
  slotRevealTick: number;
  onReroll: () => void;
  rerollDisabled: boolean;
  onTogglePreview: () => void;
  isPreviewExpanded: boolean;
  previewItemsLimit: number;
  excludedSkinIds: number[];
  onToggleSkinExcluded: (skinId: number) => void;
  constants?: Constants | null;
}

const SkinSpinnerSlot: FC<SkinSpinnerSlotProps> = ({
  skinPool,
  previewPool,
  selectedSkinId,
  strip,
  isRolling,
  slotOffset,
  slotDuration,
  slotRevealTick,
  onReroll,
  rerollDisabled,
  onTogglePreview,
  isPreviewExpanded,
  previewItemsLimit,
  excludedSkinIds,
  onToggleSkinExcluded,
  constants
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

  const slotHasItems = skinPool.length > 0;
  const hasPreviewItems = previewPool.length > 0;
  const previewVisibleSkinIds = isPreviewExpanded
    ? previewPool
    : previewPool.slice(0, previewItemsLimit);
  const previewHiddenCount = Math.max(0, previewPool.length - previewItemsLimit);

  const skinNameById = useMemo(() => {
    const result: Record<number, string> = {};
    previewPool.forEach((skinId) => {
      result[skinId] = constants?.skins?.[skinId]?.name ?? `Skin #${skinId}`;
    });
    return result;
  }, [constants?.skins, previewPool]);

  const spriteById = useMemo(() => {
    if (!portraitReady) return {} as Record<number, string>;

    const result: Record<number, string> = {};
    const ids = new Set<number>([...strip, ...previewVisibleSkinIds, selectedSkinId]);
    ids.forEach((skinId) => {
      if (skinId > 0) {
        result[skinId] = portrait(skinId, skinId, -1, -1);
      }
    });
    return result;
  }, [portraitReady, previewVisibleSkinIds, selectedSkinId, strip]);

  const selectedName =
    selectedSkinId > 0 ? (skinNameById[selectedSkinId] ?? `Skin #${selectedSkinId}`) : '';
  const displayName = isRolling ? '' : slotHasItems ? selectedName : 'No available skins';
  const hasDecidedItem = !isRolling && selectedSkinId > 0;
  const shouldAnimateReveal = !isRolling && Boolean(selectedName) && slotRevealTick > 0;

  const renderSkinSprite = (skinId: number) => {
    const spriteDataUrl = spriteById[skinId] || '';
    if (!spriteDataUrl) {
      return <span className={styles.emptyLabel}>-</span>;
    }

    return (
      <img
        src={spriteDataUrl}
        alt={skinNameById[skinId] ?? `Skin #${skinId}`}
        className={styles.skinPreviewImage}
      />
    );
  };

  return (
    <div className={styles.slotCard}>
      <div className={styles.slotHeader}>
        <Button
          size="small"
          text
          icon="pi pi-refresh"
          label={isRolling ? 'Spinning...' : 'Spin'}
          disabled={rerollDisabled}
          onClick={onReroll}
        />
      </div>

      <div className={`${styles.itemViewport} ${shouldAnimateReveal ? styles.reelStopped : ''}`}>
        <div className={styles.centerMarker} />
        <div
          className={`${styles.centerOutline} ${hasDecidedItem ? styles.centerOutlineVisible : ''} ${shouldAnimateReveal ? styles.centerOutlineFlash : ''}`}
        />
        <div
          className={`${styles.reelTrack} ${styles.easingSpin}`}
          style={{
            transform: `translateX(${slotOffset}px)`,
            transitionDuration: `${slotDuration}ms`
          }}
        >
          {strip.map((skinId, idx) => (
            <div key={`skin-${idx}-${skinId}`} className={styles.reelCell}>
              <div className={styles.itemWrap}>{renderSkinSprite(skinId)}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        key={`skin-name-${slotRevealTick}`}
        className={`${styles.itemName} ${!slotHasItems ? styles.itemNameEmpty : ''} ${shouldAnimateReveal ? styles.itemNameReveal : ''}`}
        title={displayName}
      >
        {displayName}
      </div>

      <div className={styles.slotPreview}>
        <div className={styles.previewLabel}>Owned skins ({previewPool.length})</div>
        {hasPreviewItems ? (
          <div className={styles.previewSprites}>
            {previewVisibleSkinIds.map((skinId) => (
              <button
                type="button"
                key={`skin-preview-${skinId}`}
                className={`${styles.previewSpriteCell} ${excludedSkinIds.includes(skinId) ? styles.previewSpriteExcluded : ''}`}
                onClick={() => onToggleSkinExcluded(skinId)}
                title={`${skinNameById[skinId] ?? `Skin #${skinId}`} (${excludedSkinIds.includes(skinId) ? 'excluded' : 'included'})`}
              >
                {renderSkinSprite(skinId)}
              </button>
            ))}
            {!isPreviewExpanded && previewHiddenCount > 0 ? (
              <button
                type="button"
                className={styles.previewMoreBadge}
                onClick={onTogglePreview}
                title="Show all owned skins"
              >
                +{previewHiddenCount}
              </button>
            ) : null}
            {isPreviewExpanded && previewPool.length > previewItemsLimit ? (
              <button
                type="button"
                className={styles.previewLessButton}
                onClick={onTogglePreview}
                title="Show fewer skins"
              >
                Show less
              </button>
            ) : null}
          </div>
        ) : (
          <div className={styles.previewEmpty}>No skins available</div>
        )}
      </div>
    </div>
  );
};

export default SkinSpinnerSlot;
