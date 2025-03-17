import { RATE_LIMIT_DURATION } from '@/constants';
import { useAppDispatch } from '@hooks/redux';
import { clearRateLimit } from '@store/slices/RateLimitSlice';
import { debug } from 'console';
import React, { useEffect } from 'react';

interface RateLimitCheckerProps {
  timestamp: number | null;
}

const RateLimitChecker: React.FC<RateLimitCheckerProps> = ({ timestamp }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!timestamp) return;

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - timestamp;
      if (elapsed >= RATE_LIMIT_DURATION) {
        debug('Rate limit expired - clearing rate limit');
        dispatch(clearRateLimit());
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [timestamp, dispatch]);

  return null;
};

export default RateLimitChecker;
