import { useAppDispatch, useAppSelector } from '@hooks/redux';
import { clearRateLimit, isCurrentlyRateLimited, selectRateLimit } from '@store/slices/RateLimitSlice';
import { debug } from 'console';
import React, { useEffect, useMemo, useState } from 'react';
import { RATE_LIMIT_DURATION } from './../../constants';

const RateLimitBanner: React.FC = () => {
  const dispatch = useAppDispatch();
  const { timestamp } = useAppSelector(selectRateLimit);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 5000); // check it like every 5 seconds
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!timestamp) return;

    const elapsed = Date.now() - timestamp;
    const remainingTime = RATE_LIMIT_DURATION - elapsed;

    debug(`Rate limit remaining time: ${remainingTime}`);

    if (remainingTime <= 0) {
      dispatch(clearRateLimit());
    } else {
      const timer = setTimeout(() => {
        dispatch(clearRateLimit());
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, [timestamp, dispatch]);

  const isLimited = useMemo(() => {
    return isCurrentlyRateLimited({ timestamp }, now);
  }, [timestamp, now]);

  if (!isLimited) {
    return null;
  }

  const ts = new Date(timestamp!);
  const nextRequestDate = new Date(ts.getTime() + RATE_LIMIT_DURATION);
  const formattedDate = nextRequestDate.toLocaleString();

  return (
    <div
      className="flex align-items-center justify-content-center bg-red-100"
      style={{ height: '25px' }}
    >
      <span className="text-sm">
        You are rate limited. You can make requests again at {formattedDate}
      </span>
    </div>
  );
};

export default RateLimitBanner;
