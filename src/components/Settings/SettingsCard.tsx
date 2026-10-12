import { Card } from 'primereact/card';
import React, { ReactNode } from 'react';
import styles from './SettingsCard.module.scss';

interface SettingsCardProps {
  title: string;
  icon: string;
  children: ReactNode;
  className?: string;
}

const SettingsCard: React.FC<SettingsCardProps> = ({ title, icon, children, className }) => (
  <Card className={`${styles.card} ${className ?? ''}`}>
    <div className={styles.header}>
      <div className={styles.icon} aria-hidden="true">
        <i className={`pi ${icon}`} />
      </div>
      <div>
        <h4>{title}</h4>
      </div>
    </div>
    <div className={styles.content}>{children}</div>
  </Card>
);

export default SettingsCard;
