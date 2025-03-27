import { EMPTY_SLOT_ITEM_ID } from '@/constants';
import { useItems } from '@/providers/ItemsProvider';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import { selectSelectedItems, toggleFilter } from '@store/slices/FilterSlice';
import { selectUseAprilFoolsItems } from '@store/slices/SettingsSlice';
import { debug, info } from '@tauri-apps/plugin-log';
import { FC, useRef, useState } from 'react';
import styles from './Item.module.scss';
import ItemTooltip, { ItemInfo } from './ItemTooltip';
import UnknownItem from './UnknownItem';

interface ItemProps {
  itemId: number;
  amount?: number;
}

const Item: FC<ItemProps> = ({ itemId, amount }) => {
  const dispatch = useAppDispatch();
  const activeFilters = useAppSelector(selectSelectedItems);
  const showItemTooltips = useAppSelector(
    (state) => state.settings.displaySettings.showItemTooltips
  );
  const useAprilFoolsItems = useAppSelector(selectUseAprilFoolsItems);

  const { regularItems, aprilFoolsItems } = useItems();

  const [showTooltip, setShowTooltip] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  // choose the correct item set based on the setting
  const items = useAprilFoolsItems ? aprilFoolsItems : regularItems;

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

  return (
    <div style={{ position: 'relative', height: '43px', display: 'inline-block' }}>
      <div
        ref={itemRef}
        onMouseOver={() => showItemTooltips && handleMouseOver()}
        onMouseLeave={() => setShowTooltip(false)}
        className={`${styles.item} ${isHighlighted ? styles.highlighted : ''} ${
          isShiny ? styles.shiny : ''
        }`}
        data-itemid={itemId}
        style={{
          backgroundPosition,
          backgroundImage: `url(${
            useAprilFoolsItems
              ? 'https://rotmgstash.pages.dev/renders-april-fools.png'
              : 'https://rotmgstash.pages.dev/renders.png'
          })`
        }}
        onClick={handleClick}
      >
        <div className={styles.nonSelectable}>{amount && amount > 0 ? amount : ''}</div>
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
