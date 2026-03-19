import { ASSETS_RENDER_URL, EMPTY_SLOT_ITEM_ID } from '@/constants';
import { useConstants } from '@/providers/ConstantsProvider';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import { selectSelectedItems, toggleFilter } from '@store/slices/FilterSlice';
import { debug, info } from '@tauri-apps/plugin-log';
import { FC, useRef, useState } from 'react';
import styles from './Item.module.scss';
import ItemTooltip, { ItemInfo } from './ItemTooltip';
import UnknownItem from './UnknownItem';

interface ItemProps {
  itemId: number;
  amount?: number;
  enchantmentSlots?: number;
  enchantmentIds?: number[];
}

const Item: FC<ItemProps> = ({ itemId, amount, enchantmentSlots = 0, enchantmentIds = [] }) => {
  const dispatch = useAppDispatch();
  const activeFilters = useAppSelector(selectSelectedItems);
  const showItemTooltips = useAppSelector(
    (state) => state.settings.displaySettings.showItemTooltips
  );

  const { items } = useConstants();

  const [showTooltip, setShowTooltip] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  if (!items) {
    debug('Items not loaded yet');
    return null;
  }

  const item = items[itemId];

  // if the item is not found, show the unknown item
  if (!item) return <UnknownItem itemId={itemId} amount={amount} />;

  const isHighlighted = activeFilters.includes(itemId);
  const isShiny = item.isShiny;

  let itemInfo: ItemInfo = {
    bagType: -1,
    fameBonus: -1,
    feedPower: -1,
    name: '',
    displayName: '',
    soulbound: false,
    utst: -1,
    isShiny,
    enchantmentIds,
    id: EMPTY_SLOT_ITEM_ID // default -1
  };

  let backgroundPosition = '0 0';
  if (item) {
    backgroundPosition = `-${item.x}px -${item.y}px`;
    itemInfo = {
      name: item.name,
      displayName: item.technicalName,
      fameBonus: item.fameBonus,
      feedPower: item.feedPower,
      bagType: item.bagType,
      soulbound: item.isSoulbound,
      utst: item.utst,
      isShiny: item.isShiny,
      enchantmentIds,
      id: itemId
    };
  }

  const handleClick = () => {
    if (itemId === 0) return;
    info(`Toggling filter for item ${itemId} (${itemInfo.name})`);
    dispatch(toggleFilter(itemId));
  };

  const handleMouseOver = () => {
    if (!itemRef.current) return;
    setShowTooltip(true);
  };

  const slotCount = Math.min(Math.max(enchantmentSlots, 0), 4);
  const rarityImageBySlots: Record<number, string> = {
    1: '/Uncommon.png',
    2: '/Rare.png',
    3: '/Legendary.png',
    4: '/Divine.png'
  };
  const rarityClassBySlots: Record<number, string> = {
    1: styles.rarityUncommon,
    2: styles.rarityRare,
    3: styles.rarityLegendary,
    4: styles.rarityDivine
  };
  const rarityImage = rarityImageBySlots[slotCount];
  const rarityClass = rarityClassBySlots[slotCount] ?? '';

  return (
    <div style={{ position: 'relative', height: '43px', display: 'inline-block' }}>
      <div
        ref={itemRef}
        onMouseOver={() => showItemTooltips && handleMouseOver()}
        onMouseLeave={() => setShowTooltip(false)}
        className={`${styles.item} ${isHighlighted ? styles.highlighted : ''} ${
          isShiny ? styles.shiny : ''
        } ${rarityClass}`}
        data-rarity-slots={slotCount > 0 ? slotCount : undefined}
        data-itemid={itemId}
        onClick={handleClick}
      >
        <div
          className={styles.itemSprite}
          style={{
            backgroundPosition,
            backgroundImage: `url('${ASSETS_RENDER_URL}')`
          }}
        >
          <div className={styles.nonSelectable}>{amount && amount > 0 ? amount : ''}</div>
        </div>
        {slotCount > 0 && rarityImage && (
          <div className={styles.enchantmentSlots}>
            <img className={styles.slotIcon} src={rarityImage} alt="" aria-hidden="true" />
          </div>
        )}
      </div>
      {showItemTooltips && showTooltip && (
        <div
          style={{
            position: 'absolute',
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          <ItemTooltip itemInfo={itemInfo} />
        </div>
      )}
    </div>
  );
};

export default Item;
