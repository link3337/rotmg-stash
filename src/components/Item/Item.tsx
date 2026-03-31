import { EMPTY_SLOT_ITEM_ID } from '@/constants';
import { useConstants } from '@/providers/ConstantsProvider';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import { selectSelectedItems, toggleFilter } from '@store/slices/FilterSlice';
import { selectAssetsBaseUrl, selectEnable3DViewer } from '@store/slices/SettingsSlice';
import { debug, info } from '@tauri-apps/plugin-log';
import { Dialog } from 'primereact/dialog';
import { FC, useRef, useState } from 'react';
import styles from './Item.module.scss';
import ItemTooltip, { ItemInfo } from './ItemTooltip';
import ItemViewer3D from './ItemViewer3D';
import UnknownItem from './UnknownItem';

// static lookup tables hoisted to module scope to avoid recreating on every render
const RARITY_IMAGE_BY_SLOTS: Record<number, string> = {
  1: '/enchantments/Uncommon.png',
  2: '/enchantments/Rare.png',
  3: '/enchantments/Legendary.png',
  4: '/enchantments/Divine.png'
};

const RARITY_CLASS_BY_SLOTS: Record<number, string> = {
  1: styles.rarityUncommon,
  2: styles.rarityRare,
  3: styles.rarityLegendary,
  4: styles.rarityDivine
};

interface ItemProps {
  itemId: number;
  amount?: number;
  enchantmentSlots?: number;
  enchantmentIds?: number[];
}

const Item: FC<ItemProps> = ({ itemId, amount, enchantmentSlots = 0, enchantmentIds = [] }) => {
  const dispatch = useAppDispatch();
  const activeFilters = useAppSelector(selectSelectedItems);
  const assetsBaseUrl = useAppSelector(selectAssetsBaseUrl);
  const showItemTooltips = useAppSelector(
    (state) => state.settings.displaySettings.showItemTooltips
  );
  const show3DViewerEnabled = useAppSelector(selectEnable3DViewer);

  const { items } = useConstants();

  const [showTooltip, setShowTooltip] = useState(false);
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [viewerKey, setViewerKey] = useState(0);
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
    if (itemId === EMPTY_SLOT_ITEM_ID) return;
    info(`Toggling filter for item ${itemId} (${itemInfo.name})`);
    dispatch(toggleFilter(itemId));
  };

  const handleContextMenu: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (!show3DViewerEnabled || itemId === EMPTY_SLOT_ITEM_ID) {
      return;
    }

    event.preventDefault();
    setShow3DViewer(true);
  };

  const handleMouseOver = () => {
    if (!itemRef.current) return;
    setShowTooltip(true);
  };

  const slotCount = Math.min(Math.max(enchantmentSlots, 0), 4);
  const rarityImage = RARITY_IMAGE_BY_SLOTS[slotCount];
  const rarityClass = RARITY_CLASS_BY_SLOTS[slotCount] ?? '';

  return (
    <div style={{ position: 'relative', height: '43px', display: 'inline-block' }}>
      <div
        ref={itemRef}
        onMouseOver={() => showItemTooltips && handleMouseOver()}
        onMouseLeave={() => setShowTooltip(false)}
        onContextMenu={handleContextMenu}
        className={`${styles.item} ${isHighlighted ? styles.highlighted : ''} ${
          isShiny ? styles.shiny : ''
        } ${rarityClass}`}
        data-rarity-slots={slotCount > 0 ? slotCount : undefined}
        data-itemid={itemId}
        title={
          show3DViewerEnabled ? `Right-click to open 3D Viewer for ${itemInfo.name}` : undefined
        }
        onClick={handleClick}
      >
        <div
          className={styles.itemSprite}
          style={{
            backgroundPosition,
            backgroundImage: `url('${assetsBaseUrl}/renders.png')`
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

      {show3DViewerEnabled && (
        <Dialog
          header={`${itemInfo.name} (#${itemId}) - 3D Viewer`}
          visible={show3DViewer}
          resizable
          maximizable
          closeOnEscape
          modal
          dismissableMask
          onHide={() => setShow3DViewer(false)}
          onShow={() => setViewerKey((prev) => prev + 1)}
          style={{ width: 'min(96vw, 760px)' }}
          breakpoints={{ '1200px': '82vw', '960px': '92vw' }}
          contentStyle={{ padding: 0, overflow: 'hidden' }}
        >
          <div style={{ width: '100%' }}>
            <ItemViewer3D
              key={viewerKey}
              spriteX={item.x}
              spriteY={item.y}
              assetsBaseUrl={assetsBaseUrl}
              isShiny={isShiny}
              slotCount={slotCount}
              width="100%"
              height="62vh"
            />
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default Item;
