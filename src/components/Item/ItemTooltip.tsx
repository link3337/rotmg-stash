import { bagPositionMap } from '@/constants';
import { useConstants } from '@/providers/ConstantsProvider';
import React, { useEffect, useRef, useState } from 'react';
import styles from './ItemTooltip.module.scss';

export interface ItemInfo {
  name: string;
  displayName: string;
  bagType: number;
  feedPower: number;
  fameBonus: number;
  soulbound: boolean;
  utst: number;
  isShiny: boolean;
  id: number;
  enchantmentIds: number[];
}

interface ItemTooltipProps {
  itemInfo: ItemInfo;
}

const ItemTooltip: React.FC<ItemTooltipProps> = ({ itemInfo }) => {
  const { constants } = useConstants();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'left' | 'right' | 'top' | 'bottom'>('top');
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 250);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current as unknown as number | undefined);
      }
    };
  }, []);

  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;
      if (spaceLeft < rect.width) {
        setPosition('right');
      } else if (spaceRight < rect.width) {
        setPosition('left');
      } else if (spaceAbove < rect.height) {
        setPosition('bottom');
      } else if (spaceBelow < rect.height) {
        setPosition('top');
      }
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const bagPosition = bagPositionMap[itemInfo.bagType] || '0px 0px';
  const resolveEnchantment = (id: number) => {
    const direct = constants?.enchantments?.[String(id)];
    if (direct) return { rawId: id, resolvedId: id, data: direct };

    // Some payloads appear with swapped 16-bit order (e.g. 26116 -> 1126).
    const swappedId = ((id & 0xff) << 8) | ((id >> 8) & 0xff);
    const swapped = constants?.enchantments?.[String(swappedId)];
    if (swapped) return { rawId: id, resolvedId: swappedId, data: swapped };

    return null;
  };

  const resolvedEnchantments = itemInfo.enchantmentIds.map((id) => ({
    rawId: id,
    resolved: resolveEnchantment(id)
  }));

  const enchantments = resolvedEnchantments
    .map((entry) => entry.resolved)
    .filter(
      (
        entry
      ): entry is {
        rawId: number;
        resolvedId: number;
        data: NonNullable<typeof entry>['data'];
      } => !!entry
    );

  return (
    <div
      ref={tooltipRef}
      className={`${styles.tooltip} ${styles[position]} ${itemInfo.isShiny ? styles.shiny : ''}`}
    >
      <div className={styles.name}>
        <div className={styles.nameWrapper}>
          {itemInfo.utst > 0 && (
            <div className={itemInfo.utst === 1 ? styles.ut : styles.st}>
              {itemInfo.utst === 1 ? 'UT' : 'ST'}
            </div>
          )}
          <span>{itemInfo.isShiny ? itemInfo.displayName : itemInfo.name}</span>
          <div className={styles.soulbound}>{itemInfo.soulbound ? 'SB' : ''}</div>
        </div>
      </div>
      <div className={styles.stats}>
        {itemInfo.fameBonus > 0 && (
          <div className={styles.stat}>
            <span>Fame: {itemInfo.fameBonus}%</span>
          </div>
        )}
        {itemInfo.feedPower > 0 && (
          <div className={styles.stat}>
            <span>FP: {itemInfo.feedPower}</span>
          </div>
        )}
        {itemInfo.bagType > 0 && (
          <div
            className={`${styles.bagType}`}
            style={{ backgroundPosition: bagPosition, display: 'inline-block' }}
          ></div>
        )}
        <div className={styles.stat}>
          <span>Item ID:{itemInfo.id}</span>
        </div>
        {enchantments.map((entry) => (
          <div className={styles.enchantment} key={`${entry.rawId}-${entry.resolvedId}`}>
            <div className={styles.enchantmentText}>
              <div className={styles.enchantmentName}>{entry.data!.displayId}</div>
              <div className={styles.enchantmentDescription}>{entry.data!.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItemTooltip;
