import { AccountUIModel } from '@api/models/account-ui-model';
import { CharUIModel } from '@api/models/char-ui-model';
import { useAppSelector } from '@hooks/redux';
import { useConstants } from '@providers/ConstantsProvider';
import { selectAssetsBaseUrl } from '@store/slices/SettingsSlice';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import React from 'react';
import styles from './CharacterBuilder.module.scss';
import {
  BuildSlot,
  CLASS_SLOT_CONFIG,
  ClassSlotConfig,
  DEFAULT_CLASS_SLOT_CONFIG
} from './config/slot-config';

const REEL_ITEM_STEP = 44;
const CENTER_SLOT_INDEX = 2;
const STRIP_LENGTH = 30;
const MIN_ITEMS_AFTER_SELECTED = 4;
const PREVIEW_ITEMS_LIMIT = 16;
const BUILD_SLOTS: BuildSlot[] = ['weapon', 'ability', 'armor', 'ring'];

const reel_config = {
  classSpinDuration: 9000,
  baseSpinDuration: 9200,
  slotStaggerDuration: 700,
  slotStartDelay: 220,
  stripLength: 72,
  easingClass: 'easingSpin'
};

type SlotNumberMap = Record<BuildSlot, number>;
type SlotBooleanMap = Record<BuildSlot, boolean>;
type SlotArrayMap = Record<BuildSlot, number[]>;
type ItemSourceFilter =
  | 'vault'
  | 'gifts'
  | 'seasonalSpoils'
  | 'equipped';

interface CharacterBuilderProps {
  account: AccountUIModel;
  characters: CharUIModel[];
}

interface ReelRenderableItem {
  x: number;
  y: number;
}

const ITEM_SOURCE_OPTIONS: Array<{ label: string; value: ItemSourceFilter }> = [
  { label: 'Vault', value: 'vault' },
  { label: 'Gift Chest', value: 'gifts' },
  { label: 'Seasonal Spoils', value: 'seasonalSpoils' },
  { label: 'Characters', value: 'equipped' }
];

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

const randomFrom = <T,>(values: T[]): T | null => {
  if (!values.length) return null;
  return values[Math.floor(Math.random() * values.length)];
};

const shuffleNumbers = (values: number[]): number[] => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const buildSequence = (pool: number[], count: number, excludeItem?: number): number[] => {
  if (count <= 0) return [];

  const source = excludeItem === undefined ? [...pool] : pool.filter((id) => id !== excludeItem);
  if (!source.length) return Array.from({ length: count }, () => excludeItem ?? -1);

  const result: number[] = [];
  let last: number | null = null;

  while (result.length < count) {
    const batch = shuffleNumbers(source);
    if (last !== null && batch.length > 1 && batch[0] === last) {
      [batch[0], batch[1]] = [batch[1], batch[0]];
    }

    for (const itemId of batch) {
      if (result.length >= count) break;
      if (last !== null && itemId === last && source.length > 1) continue;
      result.push(itemId);
      last = itemId;
    }

    if (source.length === 1 && result.length < count) {
      result.push(source[0]);
      last = source[0];
    }
  }

  return result;
};

const buildStrip = (pool: number[], finalItem: number, length = STRIP_LENGTH): number[] => {
  if (!pool.length) return [finalItem, finalItem, finalItem];

  const uniquePool = Array.from(new Set(pool));
  const minLength = CENTER_SLOT_INDEX + MIN_ITEMS_AFTER_SELECTED + 3;
  const safeLength = Math.max(10, length, minLength);
  const targetIndex = Math.max(CENTER_SLOT_INDEX, safeLength - (MIN_ITEMS_AFTER_SELECTED + 1));

  const beforeFinal = buildSequence(uniquePool, targetIndex, finalItem);
  const afterFinal = buildSequence(uniquePool, safeLength - targetIndex - 1, finalItem);

  return [...beforeFinal, finalItem, ...afterFinal];
};

const getClassSlotConfig = (className: string): ClassSlotConfig => {
  const override = CLASS_SLOT_CONFIG[className] ?? {};

  return {
    weapon: override.weapon ?? DEFAULT_CLASS_SLOT_CONFIG.weapon,
    ability: override.ability ?? DEFAULT_CLASS_SLOT_CONFIG.ability,
    armor: override.armor ?? DEFAULT_CLASS_SLOT_CONFIG.armor,
    ring: override.ring ?? DEFAULT_CLASS_SLOT_CONFIG.ring
  };
};

const CharacterBuilder: React.FC<CharacterBuilderProps> = ({ account, characters }) => {
  const { items } = useConstants();
  const assetsBaseUrl = useAppSelector(selectAssetsBaseUrl);

  const spinStopTimersRef = React.useRef<number[]>([]);

  const [selectedClass, setSelectedClass] = React.useState('');
  const [sourceFilters, setSourceFilters] = React.useState<ItemSourceFilter[]>(
    ITEM_SOURCE_OPTIONS.map((option) => option.value)
  );

  const classPool = React.useMemo(() => {
    const fromCharacters = (characters || [])
      .map((char) => char.className)
      .filter((name): name is string => Boolean(name));

    const merged = new Set<string>([...fromCharacters, ...Object.keys(CLASS_SLOT_CONFIG)]);
    return Array.from(merged).sort((a, b) => a.localeCompare(b));
  }, [characters]);

  const [slotItems, setSlotItems] = React.useState<SlotNumberMap>({
    weapon: -1,
    ability: -1,
    armor: -1,
    ring: -1
  });

  const [slotStrips, setSlotStrips] = React.useState<SlotArrayMap>({
    weapon: [],
    ability: [],
    armor: [],
    ring: []
  });

  const [slotOffsets, setSlotOffsets] = React.useState<SlotNumberMap>({
    weapon: 0,
    ability: 0,
    armor: 0,
    ring: 0
  });

  const [slotDurations, setSlotDurations] = React.useState<SlotNumberMap>({
    weapon: 0,
    ability: 0,
    armor: 0,
    ring: 0
  });

  const [slotSpinning, setSlotSpinning] = React.useState<SlotBooleanMap>({
    weapon: false,
    ability: false,
    armor: false,
    ring: false
  });

  const [slotRevealTick, setSlotRevealTick] = React.useState<SlotNumberMap>({
    weapon: 0,
    ability: 0,
    armor: 0,
    ring: 0
  });

  const [slotPreviewExpanded, setSlotPreviewExpanded] = React.useState<SlotBooleanMap>({
    weapon: false,
    ability: false,
    armor: false,
    ring: false
  });

  const sourceItemPools = React.useMemo(() => {
    const pools: Record<ItemSourceFilter, number[]> = {
      vault: [...(account.vault || [])],
      gifts: [...(account.gifts || [])],
      seasonalSpoils: [...(account.seasonalSpoils || [])],
      equipped: []
    };

    (characters || []).forEach((char) => {
      pools.equipped.push(...(char.equipment || []));
      (char.equip_qs || []).forEach((entry) => {
        const amount = Math.max(1, entry.amount ?? 1);
        for (let i = 0; i < amount; i += 1) pools.equipped.push(entry.itemId);
      });
    });

    const normalize = (ids: number[]) =>
      Array.from(new Set(ids)).filter((id) => id > 0 && Boolean(items?.[id]));

    return {
      vault: normalize(pools.vault),
      gifts: normalize(pools.gifts),
      seasonalSpoils: normalize(pools.seasonalSpoils),
      equipped: normalize(pools.equipped)
    };
  }, [
    account.gifts,
    account.seasonalSpoils,
    account.vault,
    characters,
    items
  ]);

  const allAccountItemIds = React.useMemo(() => {
    const allSourceIds = Object.values(sourceItemPools).flat();
    return Array.from(new Set(allSourceIds));
  }, [sourceItemPools]);

  const filteredAccountItemIds = React.useMemo(() => {
    const selectedIds = sourceFilters.flatMap((source) => sourceItemPools[source] ?? []);
    return Array.from(new Set(selectedIds));
  }, [sourceFilters, sourceItemPools]);

  const categorized = React.useMemo(() => {
    if (!selectedClass) {
      return {
        weapon: [],
        ability: [],
        armor: [],
        ring: []
      };
    }

    const classConfig = getClassSlotConfig(selectedClass);
    const weaponSlotTypes = new Set(classConfig.weapon);
    const abilitySlotTypes = new Set(classConfig.ability);
    const armorSlotTypes = new Set(classConfig.armor);
    const ringSlotTypes = new Set(classConfig.ring);

    const categorySets: Record<BuildSlot, Set<number>> = {
      weapon: new Set<number>(),
      ability: new Set<number>(),
      armor: new Set<number>(),
      ring: new Set<number>()
    };

    filteredAccountItemIds.forEach((itemId) => {
      const item = items?.[itemId];
      if (!item) return;
      const slotType = Number(item.slotType);

      if (ringSlotTypes.has(slotType)) categorySets.ring.add(itemId);
      if (armorSlotTypes.has(slotType)) categorySets.armor.add(itemId);
      if (weaponSlotTypes.has(slotType)) categorySets.weapon.add(itemId);
      if (abilitySlotTypes.has(slotType)) categorySets.ability.add(itemId);
    });

    const ensurePool = (slot: BuildSlot): number[] => {
      const primary = Array.from(categorySets[slot]);
      if (primary.length) return primary;

      return [];
    };

    return {
      weapon: ensurePool('weapon'),
      ability: ensurePool('ability'),
      armor: ensurePool('armor'),
      ring: ensurePool('ring')
    };
  }, [filteredAccountItemIds, items, selectedClass]);

  const clearAllTimers = React.useCallback(() => {
    spinStopTimersRef.current.forEach((id) => window.clearTimeout(id));
    spinStopTimersRef.current = [];
  }, []);

  const resetRollState = React.useCallback(() => {
    setSlotItems({
      weapon: -1,
      ability: -1,
      armor: -1,
      ring: -1
    });
    setSlotStrips({
      weapon: [],
      ability: [],
      armor: [],
      ring: []
    });
    setSlotOffsets({
      weapon: 0,
      ability: 0,
      armor: 0,
      ring: 0
    });
    setSlotDurations({
      weapon: 0,
      ability: 0,
      armor: 0,
      ring: 0
    });
    setSlotSpinning({
      weapon: false,
      ability: false,
      armor: false,
      ring: false
    });
    setSlotRevealTick({
      weapon: 0,
      ability: 0,
      armor: 0,
      ring: 0
    });
    setSlotPreviewExpanded({
      weapon: false,
      ability: false,
      armor: false,
      ring: false
    });
  }, []);

  React.useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const spinSlot = React.useCallback(
    (slot: BuildSlot, extraDuration = 0) => {
      const pool = categorized[slot];
      if (!pool.length || slotSpinning[slot]) return;

      const finalItem = randomFrom(pool) ?? -1;
      const strip = buildStrip(pool, finalItem, reel_config.stripLength);
      const selectedIndex = strip.indexOf(finalItem);
      const targetIndex = selectedIndex >= 0 ? selectedIndex : Math.max(0, strip.length - 2);
      const finalOffset = -((targetIndex - CENTER_SLOT_INDEX) * REEL_ITEM_STEP);
      const duration = reel_config.baseSpinDuration + extraDuration;

      setSlotSpinning((prev) => ({ ...prev, [slot]: true }));
      setSlotDurations((prev) => ({ ...prev, [slot]: 0 }));
      setSlotOffsets((prev) => ({ ...prev, [slot]: 0 }));
      setSlotStrips((prev) => ({ ...prev, [slot]: strip }));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSlotDurations((prev) => ({ ...prev, [slot]: duration }));
          setSlotOffsets((prev) => ({ ...prev, [slot]: finalOffset }));
        });
      });

      const stopTimer = window.setTimeout(() => {
        setSlotItems((prev) => ({ ...prev, [slot]: finalItem }));
        setSlotSpinning((prev) => ({ ...prev, [slot]: false }));
        setSlotRevealTick((prev) => ({ ...prev, [slot]: prev[slot] + 1 }));
      }, duration + 50);

      spinStopTimersRef.current.push(stopTimer);
    },
    [categorized, reel_config.baseSpinDuration, reel_config.stripLength, slotSpinning]
  );

  const spinAll = React.useCallback(() => {
    if (!selectedClass) return;

    BUILD_SLOTS.forEach((slot, idx) => {
      const timer = window.setTimeout(
        () => spinSlot(slot, idx * reel_config.slotStaggerDuration),
        idx * reel_config.slotStartDelay
      );
      spinStopTimersRef.current.push(timer);
    });
  }, [reel_config.slotStaggerDuration, reel_config.slotStartDelay, selectedClass, spinSlot]);

  const randomizeClass = React.useCallback(() => {
    const nextClass = randomFrom(classPool);
    if (nextClass && nextClass !== selectedClass) {
      clearAllTimers();
      resetRollState();
      setSelectedClass(nextClass);
    }
  }, [classPool, clearAllTimers, resetRollState, selectedClass]);

  const toggleSourceFilter = React.useCallback(
    (source: ItemSourceFilter, checked: boolean) => {
      const hasSource = sourceFilters.includes(source);
      if ((checked && hasSource) || (!checked && !hasSource)) return;

      const nextSources = checked
        ? [...sourceFilters, source]
        : sourceFilters.filter((current) => current !== source);

      clearAllTimers();
      resetRollState();
      setSourceFilters(nextSources);
    },
    [clearAllTimers, resetRollState, sourceFilters]
  );

  const toggleSlotPreview = React.useCallback((slot: BuildSlot) => {
    setSlotPreviewExpanded((prev) => ({ ...prev, [slot]: !prev[slot] }));
  }, []);

  if (!allAccountItemIds.length) {
    return null;
  }

  return (
    <div className={styles.builderCard}>
      <div className={styles.header}>
        <div className={styles.headerActions}>
          <Dropdown
            className={styles.classSelect}
            value={selectedClass}
            options={classPool}
            onChange={(event) => {
              const nextClass = event.value ?? '';
              if (nextClass !== selectedClass) {
                clearAllTimers();
                resetRollState();
                setSelectedClass(nextClass);
              }
            }}
            placeholder="Select class"
            showClear
            disabled={Object.values(slotSpinning).some(Boolean)}
          />
          <div className={styles.sourceFilterGroup}>
            {ITEM_SOURCE_OPTIONS.map((option) => (
              <div key={option.value} className={styles.sourceFilterOption}>
                <Checkbox
                  inputId={`builder-source-${option.value}`}
                  checked={sourceFilters.includes(option.value)}
                  onChange={(event) => toggleSourceFilter(option.value, Boolean(event.checked))}
                  disabled={Object.values(slotSpinning).some(Boolean)}
                />
                <label htmlFor={`builder-source-${option.value}`}>{option.label}</label>
              </div>
            ))}
          </div>
          <Button
            label="Randomize Class"
            icon="pi pi-shuffle"
            severity="secondary"
            outlined
            onClick={randomizeClass}
            disabled={!classPool.length || Object.values(slotSpinning).some(Boolean)}
          />
          <Button
            className={styles.spinAllButton}
            label="Spin All"
            icon="pi pi-sync"
            onClick={spinAll}
            disabled={
              !selectedClass ||
              !filteredAccountItemIds.length ||
              Object.values(slotSpinning).some(Boolean)
            }
          />
        </div>
      </div>

      <div className={styles.reels}>
        {BUILD_SLOTS.map((slot) => {
          const slotPool = categorized[slot];
          const slotHasItems = slotPool.length > 0;
          const isPreviewExpanded = slotPreviewExpanded[slot];
          const selectedItemId = slotItems[slot];
          const itemName =
            selectedItemId > 0 ? (items?.[selectedItemId]?.name ?? `Item #${selectedItemId}`) : '';
          const strip = slotStrips[slot];
          const isRolling = slotSpinning[slot];
          const previewVisibleItemIds = isPreviewExpanded
            ? slotPool
            : slotPool.slice(0, PREVIEW_ITEMS_LIMIT);
          const previewHiddenCount = Math.max(0, slotPool.length - PREVIEW_ITEMS_LIMIT);
          const displayName =
            isRolling ? '' : slotHasItems ? itemName : selectedClass ? 'No available items' : '';
          const hasDecidedItem = !isRolling && selectedItemId > 0;
          const shouldAnimateReveal = !isRolling && Boolean(itemName) && slotRevealTick[slot] > 0;

          return (
            <div key={slot} className={styles.slotCard}>
              <div className={styles.slotHeader}>
                <Button
                  size="small"
                  text
                  icon="pi pi-refresh"
                  label={isRolling ? 'Spinning...' : 'Reroll'}
                  disabled={!selectedClass || !slotHasItems || isRolling}
                  onClick={() => spinSlot(slot)}
                />
              </div>

              <div
                className={`${styles.itemViewport} ${shouldAnimateReveal ? styles.reelStopped : ''}`}
              >
                <div className={styles.centerMarker} />
                <div
                  className={`${styles.centerOutline} ${hasDecidedItem ? styles.centerOutlineVisible : ''} ${shouldAnimateReveal ? styles.centerOutlineFlash : ''}`}
                />
                <div
                  className={`${styles.reelTrack} ${styles[reel_config.easingClass]}`}
                  style={{
                    transform: `translateX(${slotOffsets[slot]}px)`,
                    transitionDuration: `${slotDurations[slot]}ms`
                  }}
                >
                  {strip.map((itemId, idx) => (
                    <div key={`${slot}-${idx}-${itemId}`} className={styles.reelCell}>
                      <div className={styles.itemWrap}>
                        <ReelItemSprite
                          itemId={itemId}
                          item={items?.[itemId]}
                          assetsBaseUrl={assetsBaseUrl}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                key={`${slot}-name-${slotRevealTick[slot]}`}
                className={`${styles.itemName} ${!slotHasItems && selectedClass ? styles.itemNameEmpty : ''} ${shouldAnimateReveal ? styles.itemNameReveal : ''}`}
                title={displayName}
              >
                {displayName}
              </div>

              <div className={styles.slotPreview}>
                <div className={styles.previewLabel}>Rollable items ({slotPool.length})</div>
                {slotHasItems ? (
                  <div className={styles.previewSprites}>
                    {previewVisibleItemIds.map((previewItemId) => (
                      <div
                        key={`${slot}-${previewItemId}`}
                        className={styles.previewSpriteCell}
                        title={items?.[previewItemId]?.name ?? `Item #${previewItemId}`}
                      >
                        <ReelItemSprite
                          itemId={previewItemId}
                          item={items?.[previewItemId]}
                          assetsBaseUrl={assetsBaseUrl}
                        />
                      </div>
                    ))}
                    {!isPreviewExpanded && previewHiddenCount > 0 ? (
                      <button
                        type="button"
                        className={styles.previewMoreBadge}
                        onClick={() => toggleSlotPreview(slot)}
                        title="Show all rollable items"
                      >
                        +{previewHiddenCount}
                      </button>
                    ) : null}
                    {isPreviewExpanded && slotPool.length > PREVIEW_ITEMS_LIMIT ? (
                      <button
                        type="button"
                        className={styles.previewLessButton}
                        onClick={() => toggleSlotPreview(slot)}
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
        })}
      </div>
    </div>
  );
};

export default CharacterBuilder;
