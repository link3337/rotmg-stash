import { AccountUIModel } from '@api/models/account-ui-model';
import { CharUIModel } from '@api/models/char-ui-model';
import { useAppSelector } from '@hooks/redux';
import { useConstants } from '@providers/ConstantsProvider';
import { selectAssetsBaseUrl } from '@store/slices/SettingsSlice';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './CharacterBuilder.module.scss';
import {
  BuildSlot,
  CLASS_SLOT_CONFIG,
  ClassSlotConfig,
  DEFAULT_CLASS_SLOT_CONFIG
} from './config/slot-config';
import ReelSpinnerSlot from './ReelSpinnerSlot';
import ResultPopupDialog, { SpinResultEntry } from './ResultPopupDialog.tsx';
import SkinSpinnerSlot from './SkinSpinnerSlot';

const REEL_ITEM_STEP = 44;
const CENTER_SLOT_INDEX = 2;
const STRIP_LENGTH = 30;
const MIN_ITEMS_AFTER_SELECTED = 4;
const PREVIEW_ITEMS_LIMIT = 16;
const BUILD_SLOTS: BuildSlot[] = ['weapon', 'ability', 'armor', 'ring'];

const REEL_CONFIG = {
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
type ItemSourceFilter = 'vault' | 'gifts' | 'seasonalSpoils' | 'equipped';

interface CharacterBuilderProps {
  account: AccountUIModel;
  characters: CharUIModel[];
}

const ITEM_SOURCE_OPTIONS: Array<{ label: string; value: ItemSourceFilter }> = [
  { label: 'Vault', value: 'vault' },
  { label: 'Gift Chest', value: 'gifts' },
  { label: 'Seasonal Spoils', value: 'seasonalSpoils' },
  { label: 'Characters', value: 'equipped' }
];

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

const getReelTargetIndex = (stripLength: number): number => {
  return Math.max(CENTER_SLOT_INDEX, stripLength - (MIN_ITEMS_AFTER_SELECTED + 1));
};

const buildStrip = (pool: number[], finalItem: number, length = STRIP_LENGTH): number[] => {
  if (!pool.length) return [finalItem, finalItem, finalItem];

  const uniquePool = Array.from(new Set(pool));
  const minLength = CENTER_SLOT_INDEX + MIN_ITEMS_AFTER_SELECTED + 3;
  const safeLength = Math.max(10, length, minLength);
  const targetIndex = getReelTargetIndex(safeLength);

  // Keep one guaranteed stop position, but let the same item appear elsewhere in the strip.
  const beforeFinal = buildSequence(uniquePool, targetIndex);
  const afterFinal = buildSequence(uniquePool, safeLength - targetIndex - 1);

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

const CharacterBuilder: FC<CharacterBuilderProps> = ({ account, characters }) => {
  const { items, constants } = useConstants();
  const assetsBaseUrl = useAppSelector(selectAssetsBaseUrl);

  const spinStopTimersRef = useRef<number[]>([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [sourceFilters, setSourceFilters] = useState<ItemSourceFilter[]>(
    ITEM_SOURCE_OPTIONS.map((option) => option.value)
  );

  const classPool = useMemo(() => {
    const fromCharacters = (characters || [])
      .map((char) => char.className)
      .filter((name): name is string => Boolean(name));

    const merged = new Set<string>([...fromCharacters, ...Object.keys(CLASS_SLOT_CONFIG)]);
    return Array.from(merged).sort((a, b) => a.localeCompare(b));
  }, [characters]);

  const [slotItems, setSlotItems] = useState<SlotNumberMap>({
    weapon: -1,
    ability: -1,
    armor: -1,
    ring: -1
  });

  const [slotStrips, setSlotStrips] = useState<SlotArrayMap>({
    weapon: [],
    ability: [],
    armor: [],
    ring: []
  });

  const [slotOffsets, setSlotOffsets] = useState<SlotNumberMap>({
    weapon: 0,
    ability: 0,
    armor: 0,
    ring: 0
  });

  const [slotDurations, setSlotDurations] = useState<SlotNumberMap>({
    weapon: 0,
    ability: 0,
    armor: 0,
    ring: 0
  });

  const [slotSpinning, setSlotSpinning] = useState<SlotBooleanMap>({
    weapon: false,
    ability: false,
    armor: false,
    ring: false
  });

  const [slotRevealTick, setSlotRevealTick] = useState<SlotNumberMap>({
    weapon: 0,
    ability: 0,
    armor: 0,
    ring: 0
  });

  const [slotPreviewExpanded, setSlotPreviewExpanded] = useState<SlotBooleanMap>({
    weapon: false,
    ability: false,
    armor: false,
    ring: false
  });

  const [skinItem, setSkinItem] = useState(-1);
  const [skinStrip, setSkinStrip] = useState<number[]>([]);
  const [skinOffset, setSkinOffset] = useState(0);
  const [skinDuration, setSkinDuration] = useState(0);
  const [skinSpinning, setSkinSpinning] = useState(false);
  const [skinRevealTick, setSkinRevealTick] = useState(0);
  const [skinPreviewExpanded, setSkinPreviewExpanded] = useState(false);
  const [excludedSkinIds, setExcludedSkinIds] = useState<number[]>([]);

  const [slotExcludedItems, setSlotExcludedItems] = useState<SlotArrayMap>({
    weapon: [],
    ability: [],
    armor: [],
    ring: []
  });
  const [resultPopupVisible, setResultPopupVisible] = useState(false);
  const [resultPopupEntries, setResultPopupEntries] = useState<SpinResultEntry[]>([]);

  const lastResultSignatureRef = useRef('');

  const sourceItemPools = useMemo(() => {
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
  }, [account.gifts, account.seasonalSpoils, account.vault, characters, items]);

  const allAccountItemIds = useMemo(() => {
    const allSourceIds = Object.values(sourceItemPools).flat();
    return Array.from(new Set(allSourceIds));
  }, [sourceItemPools]);

  const ownedSkinIds = useMemo(() => {
    const ids = (account.ownedSkins || '')
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((id) => id > 0 && Boolean(constants?.skins?.[id]));
    return Array.from(new Set(ids));
  }, [account.ownedSkins, constants?.skins]);

  const filteredAccountItemIds = useMemo(() => {
    const selectedIds = sourceFilters.flatMap((source) => sourceItemPools[source] ?? []);
    return Array.from(new Set(selectedIds));
  }, [sourceFilters, sourceItemPools]);

  const candidateClasses = useMemo(() => {
    if (selectedClass) {
      return [selectedClass];
    }

    const allClasses = Object.keys(CLASS_SLOT_CONFIG);
    const decidedSlots = BUILD_SLOTS.filter((slot) => slotItems[slot] > 0);

    if (!decidedSlots.length) {
      return allClasses;
    }

    return allClasses.filter((className) => {
      const config = getClassSlotConfig(className);

      return decidedSlots.every((slot) => {
        const itemId = slotItems[slot];
        const item = items?.[itemId];
        if (!item) return false;
        const slotType = Number(item.slotType);
        return config[slot].includes(slotType);
      });
    });
  }, [items, selectedClass, slotItems]);

  const classFilteredSkinIds = useMemo(() => {
    if (!candidateClasses.length) {
      return [];
    }

    const eligibleClassNames = new Set(candidateClasses);
    const classTypeIds = Object.entries(constants?.classes ?? {})
      .filter(([, classData]) => classData?.name && eligibleClassNames.has(classData.name))
      .map(([classId]) => Number(classId));

    if (!classTypeIds.length) {
      return [];
    }

    const classTypeSet = new Set(classTypeIds);
    return ownedSkinIds.filter((skinId) => {
      const skinClassType = constants?.skins?.[skinId]?.classType;
      return typeof skinClassType === 'number' && classTypeSet.has(skinClassType);
    });
  }, [candidateClasses, constants?.classes, constants?.skins, ownedSkinIds]);

  const rollableSkinIds = useMemo(() => {
    if (!excludedSkinIds.length) return classFilteredSkinIds;
    const excluded = new Set(excludedSkinIds);
    return classFilteredSkinIds.filter((skinId) => !excluded.has(skinId));
  }, [classFilteredSkinIds, excludedSkinIds]);

  const categorizedAll = useMemo(() => {
    if (!candidateClasses.length) {
      return {
        weapon: [],
        ability: [],
        armor: [],
        ring: []
      };
    }

    const weaponSlotTypes = new Set<number>();
    const abilitySlotTypes = new Set<number>();
    const armorSlotTypes = new Set<number>();
    const ringSlotTypes = new Set<number>();

    candidateClasses.forEach((className) => {
      const classConfig = getClassSlotConfig(className);
      classConfig.weapon.forEach((slotType) => weaponSlotTypes.add(slotType));
      classConfig.ability.forEach((slotType) => abilitySlotTypes.add(slotType));
      classConfig.armor.forEach((slotType) => armorSlotTypes.add(slotType));
      classConfig.ring.forEach((slotType) => ringSlotTypes.add(slotType));
    });

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

    return {
      weapon: Array.from(categorySets.weapon),
      ability: Array.from(categorySets.ability),
      armor: Array.from(categorySets.armor),
      ring: Array.from(categorySets.ring)
    };
  }, [candidateClasses, filteredAccountItemIds, items]);

  const categorized = useMemo(() => {
    const filterExcluded = (slot: BuildSlot): number[] => {
      const excluded = new Set(slotExcludedItems[slot]);
      return categorizedAll[slot].filter((itemId) => !excluded.has(itemId));
    };

    return {
      weapon: filterExcluded('weapon'),
      ability: filterExcluded('ability'),
      armor: filterExcluded('armor'),
      ring: filterExcluded('ring')
    };
  }, [categorizedAll, slotExcludedItems]);

  useEffect(() => {
    if (selectedClass) return;

    if (!candidateClasses.length) return;

    const allSlotsFinished = BUILD_SLOTS.every((slot) => !slotSpinning[slot]);
    const allSlotsHaveResult = BUILD_SLOTS.every((slot) => slotItems[slot] > 0);
    const allSlotsResolved = allSlotsFinished && allSlotsHaveResult;

    const abilityResolved = slotItems.ability > 0 && !slotSpinning.ability;

    const pendingSlots = BUILD_SLOTS.filter((slot) => slotSpinning[slot] || slotItems[slot] <= 0);
    const onlyRingPending =
      pendingSlots.length > 0 && pendingSlots.every((slot) => slot === 'ring');

    if (!allSlotsResolved && !abilityResolved && !onlyRingPending) return;

    const resolvedClass = [...candidateClasses].sort((a, b) => a.localeCompare(b))[0];
    if (resolvedClass) {
      setSelectedClass(resolvedClass);
    }
  }, [candidateClasses, selectedClass, slotItems, slotSpinning]);

  const clearAllTimers = useCallback(() => {
    spinStopTimersRef.current.forEach((id) => window.clearTimeout(id));
    spinStopTimersRef.current = [];
  }, []);

  const resetRollState = useCallback(() => {
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
    setSkinItem(-1);
    setSkinStrip([]);
    setSkinOffset(0);
    setSkinDuration(0);
    setSkinSpinning(false);
    setSkinRevealTick(0);
    setSkinPreviewExpanded(false);
    setExcludedSkinIds([]);
    setResultPopupVisible(false);
    setResultPopupEntries([]);
    lastResultSignatureRef.current = '';
  }, []);

  useEffect(() => {
    const allSlotsStopped = BUILD_SLOTS.every((slot) => !slotSpinning[slot]);
    const allSlotsHaveResult = BUILD_SLOTS.every((slot) => slotItems[slot] > 0);

    if (!allSlotsStopped || !allSlotsHaveResult || skinSpinning || skinItem <= 0) return;

    const signature = [
      skinItem,
      slotItems.weapon,
      slotItems.ability,
      slotItems.armor,
      slotItems.ring
    ].join(':');

    if (signature === lastResultSignatureRef.current) return;

    lastResultSignatureRef.current = signature;
    setResultPopupEntries([
      {
        key: 'weapon',
        label: 'Weapon',
        itemId: slotItems.weapon,
        name: items?.[slotItems.weapon]?.name ?? `Item #${slotItems.weapon}`,
        kind: 'item'
      },
      {
        key: 'ability',
        label: 'Ability',
        itemId: slotItems.ability,
        name: items?.[slotItems.ability]?.name ?? `Item #${slotItems.ability}`,
        kind: 'item'
      },
      {
        key: 'armor',
        label: 'Armor',
        itemId: slotItems.armor,
        name: items?.[slotItems.armor]?.name ?? `Item #${slotItems.armor}`,
        kind: 'item'
      },
      {
        key: 'ring',
        label: 'Ring',
        itemId: slotItems.ring,
        name: items?.[slotItems.ring]?.name ?? `Item #${slotItems.ring}`,
        kind: 'item'
      },
      {
        key: 'skin',
        label: 'Skin',
        itemId: skinItem,
        name: constants?.skins?.[skinItem]?.name ?? `Skin #${skinItem}`,
        kind: 'skin'
      }
    ]);
    setResultPopupVisible(true);
  }, [constants?.skins, items, skinItem, skinSpinning, slotItems, slotSpinning]);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const spinSlot = useCallback(
    (slot: BuildSlot, extraDuration = 0) => {
      const pool = categorized[slot];
      const anyNonRingSlotSpinning = BUILD_SLOTS.some(
        (buildSlot) => buildSlot !== 'ring' && slotSpinning[buildSlot]
      );
      if (!selectedClass && slot !== 'ring' && anyNonRingSlotSpinning && !slotSpinning[slot])
        return;
      if (!pool.length || slotSpinning[slot]) return;

      const finalItem = randomFrom(pool) ?? -1;
      const strip = buildStrip(pool, finalItem, REEL_CONFIG.stripLength);
      const targetIndex = getReelTargetIndex(strip.length);
      const finalOffset = -((targetIndex - CENTER_SLOT_INDEX) * REEL_ITEM_STEP);
      const duration = REEL_CONFIG.baseSpinDuration + extraDuration;

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
    [
      categorized,
      REEL_CONFIG.baseSpinDuration,
      REEL_CONFIG.stripLength,
      selectedClass,
      slotSpinning
    ]
  );

  const spinSkin = useCallback(
    (extraDuration = 0) => {
      if (!rollableSkinIds.length || skinSpinning) return;

      const finalSkin = randomFrom(rollableSkinIds) ?? -1;
      const strip = buildStrip(rollableSkinIds, finalSkin, REEL_CONFIG.stripLength);
      const targetIndex = getReelTargetIndex(strip.length);
      const finalOffset = -((targetIndex - CENTER_SLOT_INDEX) * REEL_ITEM_STEP);
      const duration = REEL_CONFIG.baseSpinDuration + extraDuration;

      setSkinSpinning(true);
      setSkinDuration(0);
      setSkinOffset(0);
      setSkinStrip(strip);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSkinDuration(duration);
          setSkinOffset(finalOffset);
        });
      });

      const stopTimer = window.setTimeout(() => {
        setSkinItem(finalSkin);
        setSkinSpinning(false);
        setSkinRevealTick((prev) => prev + 1);
      }, duration + 50);

      spinStopTimersRef.current.push(stopTimer);
    },
    [rollableSkinIds, REEL_CONFIG.baseSpinDuration, REEL_CONFIG.stripLength, skinSpinning]
  );

  const spinAll = useCallback(() => {
    if (!selectedClass) return;

    BUILD_SLOTS.forEach((slot) => {
      spinSlot(slot);
    });
    spinSkin();
  }, [selectedClass, spinSkin, spinSlot]);

  const randomizeClass = useCallback(() => {
    const nextClass = randomFrom(classPool);
    if (nextClass && nextClass !== selectedClass) {
      clearAllTimers();
      resetRollState();
      setSelectedClass(nextClass);
    }
  }, [classPool, clearAllTimers, resetRollState, selectedClass]);

  const toggleSourceFilter = useCallback(
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

  const toggleSlotPreview = useCallback((slot: BuildSlot) => {
    setSlotPreviewExpanded((prev) => ({ ...prev, [slot]: !prev[slot] }));
  }, []);

  const toggleSlotItemExclusion = useCallback((slot: BuildSlot, itemId: number) => {
    setSlotExcludedItems((prev) => {
      const current = prev[slot];
      const exists = current.includes(itemId);
      return {
        ...prev,
        [slot]: exists ? current.filter((id) => id !== itemId) : [...current, itemId]
      };
    });
  }, []);

  const toggleSkinExclusion = useCallback((skinId: number) => {
    setExcludedSkinIds((prev) =>
      prev.includes(skinId) ? prev.filter((id) => id !== skinId) : [...prev, skinId]
    );
  }, []);

  const hasAnyRollableItems = useMemo(() => {
    return BUILD_SLOTS.some((slot) => categorized[slot].length > 0) || rollableSkinIds.length > 0;
  }, [categorized, rollableSkinIds.length]);

  const anyNonRingSlotSpinning = useMemo(
    () => BUILD_SLOTS.some((slot) => slot !== 'ring' && slotSpinning[slot]),
    [slotSpinning]
  );

  const lockOtherSlotsDuringInferenceSpin = !selectedClass && anyNonRingSlotSpinning;

  if (!allAccountItemIds.length && !ownedSkinIds.length) {
    return null;
  }

  return (
    <div className={styles.builderCard}>
      <ResultPopupDialog
        visible={resultPopupVisible}
        onHide={() => setResultPopupVisible(false)}
        entries={resultPopupEntries}
        items={items}
        assetsBaseUrl={assetsBaseUrl}
      />

      <div className={styles.header}>
        <div className={styles.headerActions}>
          <div className={styles.classControlGroup}>
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
              disabled={Object.values(slotSpinning).some(Boolean) || skinSpinning}
            />
            <Button
              className={styles.classRandomizeButton}
              icon="pi pi-sync"
              severity="secondary"
              outlined
              onClick={randomizeClass}
              disabled={
                !classPool.length || Object.values(slotSpinning).some(Boolean) || skinSpinning
              }
            />
          </div>
          <div className={styles.sourceFilterGroup}>
            {ITEM_SOURCE_OPTIONS.map((option) => (
              <div key={option.value} className={styles.sourceFilterOption}>
                <Checkbox
                  inputId={`builder-source-${option.value}`}
                  checked={sourceFilters.includes(option.value)}
                  onChange={(event) => toggleSourceFilter(option.value, Boolean(event.checked))}
                  disabled={Object.values(slotSpinning).some(Boolean) || skinSpinning}
                />
                <label htmlFor={`builder-source-${option.value}`}>{option.label}</label>
              </div>
            ))}
          </div>
          <Button
            className={styles.spinAllButton}
            label="Spin All"
            icon="pi pi-refresh"
            onClick={spinAll}
            disabled={
              !selectedClass ||
              !hasAnyRollableItems ||
              Object.values(slotSpinning).some(Boolean) ||
              skinSpinning
            }
          />
        </div>
      </div>

      <div className={styles.reels}>
        {BUILD_SLOTS.map((slot) => {
          const slotPool = categorized[slot];
          const previewPool = categorizedAll[slot];
          return (
            <ReelSpinnerSlot
              key={slot}
              slot={slot}
              slotPool={slotPool}
              previewPool={previewPool}
              selectedClass={selectedClass}
              selectedItemId={slotItems[slot]}
              strip={slotStrips[slot]}
              isRolling={slotSpinning[slot]}
              slotOffset={slotOffsets[slot]}
              slotDuration={slotDurations[slot]}
              slotRevealTick={slotRevealTick[slot]}
              onReroll={() => spinSlot(slot)}
              rerollDisabled={
                !slotPool.length ||
                slotSpinning[slot] ||
                (slot !== 'ring' && lockOtherSlotsDuringInferenceSpin && !slotSpinning[slot])
              }
              onTogglePreview={() => toggleSlotPreview(slot)}
              isPreviewExpanded={slotPreviewExpanded[slot]}
              previewItemsLimit={PREVIEW_ITEMS_LIMIT}
              excludedItemIds={slotExcludedItems[slot]}
              onToggleItemExcluded={(itemId) => toggleSlotItemExclusion(slot, itemId)}
              items={items}
              assetsBaseUrl={assetsBaseUrl}
              easingClass={REEL_CONFIG.easingClass}
            />
          );
        })}

        <SkinSpinnerSlot
          skinPool={rollableSkinIds}
          previewPool={classFilteredSkinIds}
          selectedSkinId={skinItem}
          strip={skinStrip}
          isRolling={skinSpinning}
          slotOffset={skinOffset}
          slotDuration={skinDuration}
          slotRevealTick={skinRevealTick}
          onReroll={() => spinSkin()}
          rerollDisabled={!rollableSkinIds.length || skinSpinning}
          onTogglePreview={() => setSkinPreviewExpanded((prev) => !prev)}
          isPreviewExpanded={skinPreviewExpanded}
          previewItemsLimit={PREVIEW_ITEMS_LIMIT}
          excludedSkinIds={excludedSkinIds}
          onToggleSkinExcluded={toggleSkinExclusion}
          constants={constants}
        />
      </div>
    </div>
  );
};

export default CharacterBuilder;
