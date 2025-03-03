import { selectRateLimit } from '@store/slices/RateLimitSlice';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const RateLimitBanner: React.FC = () => {
  const rateLimit = useSelector(selectRateLimit);

  if (!rateLimit.isLimited) {
    return null;
  }

  const timestamp = new Date(rateLimit.timestamp!);
  const nextRequestDate = new Date(timestamp.getTime() + 5 * 60000);
  const formattedDate = nextRequestDate.toLocaleString();

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (now >= nextRequestDate) {
    return null;
  }

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
