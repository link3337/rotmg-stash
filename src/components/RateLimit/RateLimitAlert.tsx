import React from 'react';
import styles from './RateLimitAlert.module.scss';

interface RateLimitAlertProps {
  formattedDate: string | null;
}

const RateLimitAlert: React.FC<RateLimitAlertProps> = ({ formattedDate }) => {
  if (!formattedDate) return null;

  return (
    <div className={`flex align-items-center justify-content-center bg-red-100 ${styles.alert}`}>
      <span className={styles.message}>
        You are rate limited. You can make requests again at {formattedDate}
      </span>
    </div>
  );
};

export default RateLimitAlert;
