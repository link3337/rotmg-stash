import { bagPositionMap } from '@/constants';
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
}

interface ItemTooltipProps {
  itemInfo: ItemInfo;
}

const ItemTooltip: React.FC<ItemTooltipProps> = ({ itemInfo }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'left' | 'right' | 'top' | 'bottom'>('top');
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 250);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
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
      </div>
    </div>
  );
};

export default ItemTooltip;
