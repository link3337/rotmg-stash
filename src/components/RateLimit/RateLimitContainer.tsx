import { RATE_LIMIT_DURATION } from '@/constants';
import { useAppSelector } from '@/hooks/redux';
import { selectRateLimit } from '@/store/slices/RateLimitSlice';
import { useEffect, useState } from 'react';
import RateLimitAlert from './RateLimitAlert';
import RateLimitChecker from './RateLimitChecker';

const RateLimitContainer: React.FC = () => {
  const { timestamp } = useAppSelector(selectRateLimit);
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    if (timestamp) {
      const date = new Date(timestamp);
      const nextRequestDate = new Date(date.getTime() + RATE_LIMIT_DURATION);
      setFormattedDate(nextRequestDate.toLocaleTimeString());
    } else {
      setFormattedDate(null);
    }
  }, [timestamp]);

  return (
    <>
      <RateLimitAlert formattedDate={formattedDate} />
      <RateLimitChecker timestamp={timestamp} />
    </>
  );
};

export default RateLimitContainer;
