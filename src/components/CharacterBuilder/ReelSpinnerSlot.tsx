import { RealmItemMap } from '@/realm/renders/item';
import { Button } from 'primereact/button';
import React from 'react';
import styles from './CharacterBuilder.module.scss';
import { BuildSlot } from './config/slot-config';

interface ReelRenderableItem {
    x: number;
    y: number;
}

interface ReelSpinnerSlotProps {
    slot: BuildSlot;
    slotPool: number[];
    previewPool: number[];
    selectedClass: string;
    selectedItemId: number;
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
    excludedItemIds: number[];
    onToggleItemExcluded: (itemId: number) => void;
    items: RealmItemMap;
    assetsBaseUrl: string;
    easingClass: string;
}

const ReelItemSprite = React.memo(
    ({
        itemId,
        item,
        assetsBaseUrl
    }: {
        itemId: number;
        item?: ReelRenderableItem;
        assetsBaseUrl: string;
    }) => {
        if (!item || itemId <= 0) {
            return <span className={styles.emptyLabel}>-</span>;
        }

        return (
            <div className={styles.reelSpriteFrame}>
                <div
                    className={styles.reelSprite}
                    style={{
                        backgroundPosition: `-${item.x}px -${item.y}px`,
                        backgroundImage: `url('${assetsBaseUrl}/renders.png')`
                    }}
                />
            </div>
        );
    }
);

const ReelSpinnerSlot: React.FC<ReelSpinnerSlotProps> = ({
    slot,
    slotPool,
    previewPool,
    selectedClass,
    selectedItemId,
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
    excludedItemIds,
    onToggleItemExcluded,
    items,
    assetsBaseUrl,
    easingClass
}) => {
    const slotHasItems = slotPool.length > 0;
    const hasPreviewItems = previewPool.length > 0;
    const itemName =
        selectedItemId > 0 ? (items?.[selectedItemId]?.name ?? `Item #${selectedItemId}`) : '';
    const previewVisibleItemIds = isPreviewExpanded
        ? previewPool
        : previewPool.slice(0, previewItemsLimit);
    const previewHiddenCount = Math.max(0, previewPool.length - previewItemsLimit);
    const displayName = isRolling
        ? ''
        : slotHasItems
            ? itemName
            : selectedClass
                ? 'No available items'
                : '';
    const hasDecidedItem = !isRolling && selectedItemId > 0;
    const shouldAnimateReveal = !isRolling && Boolean(itemName) && slotRevealTick > 0;

    return (
        <div className={styles.slotCard}>
            <div className={styles.slotHeader}>
                <Button
                    size="small"
                    text
                    icon="pi pi-refresh"
                    label={isRolling ? 'Spinning...' : 'Reroll'}
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
                    className={`${styles.reelTrack} ${styles[easingClass]}`}
                    style={{
                        transform: `translateX(${slotOffset}px)`,
                        transitionDuration: `${slotDuration}ms`
                    }}
                >
                    {strip.map((itemId, idx) => (
                        <div key={`${slot}-${idx}-${itemId}`} className={styles.reelCell}>
                            <div className={styles.itemWrap}>
                                <ReelItemSprite itemId={itemId} item={items?.[itemId]} assetsBaseUrl={assetsBaseUrl} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div
                key={`${slot}-name-${slotRevealTick}`}
                className={`${styles.itemName} ${!slotHasItems && selectedClass ? styles.itemNameEmpty : ''} ${shouldAnimateReveal ? styles.itemNameReveal : ''}`}
                title={displayName}
            >
                {displayName}
            </div>

            <div className={styles.slotPreview}>
                <div className={styles.previewLabel}>Rollable items ({previewPool.length})</div>
                {hasPreviewItems ? (
                    <div className={styles.previewSprites}>
                        {previewVisibleItemIds.map((previewItemId) => (
                            <button
                                type="button"
                                key={`${slot}-${previewItemId}`}
                                className={`${styles.previewSpriteCell} ${excludedItemIds.includes(previewItemId) ? styles.previewSpriteExcluded : ''}`}
                                onClick={() => onToggleItemExcluded(previewItemId)}
                                title={`${items?.[previewItemId]?.name ?? `Item #${previewItemId}`} (${excludedItemIds.includes(previewItemId) ? 'excluded' : 'included'})`}
                            >
                                <ReelItemSprite
                                    itemId={previewItemId}
                                    item={items?.[previewItemId]}
                                    assetsBaseUrl={assetsBaseUrl}
                                />
                            </button>
                        ))}
                        {!isPreviewExpanded && previewHiddenCount > 0 ? (
                            <button
                                type="button"
                                className={styles.previewMoreBadge}
                                onClick={onTogglePreview}
                                title="Show all rollable items"
                            >
                                +{previewHiddenCount}
                            </button>
                        ) : null}
                        {isPreviewExpanded && previewPool.length > previewItemsLimit ? (
                            <button
                                type="button"
                                className={styles.previewLessButton}
                                onClick={onTogglePreview}
                                title="Show fewer items"
                            >
                                Show less
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <div className={styles.previewEmpty}>No rollable items for current filters</div>
                )}
            </div>
        </div>
    );
};

export default ReelSpinnerSlot;
