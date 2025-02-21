import { debug } from '@tauri-apps/plugin-log';

export const RATE_LIMIT_KEY = 'rate_limit_expiration';
export const RATE_LIMIT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const isRateLimited = (): boolean => {
  const limitTimestamp = localStorage.getItem(RATE_LIMIT_KEY);
  debug(`Rate limit timestamp: ${limitTimestamp}`);
  if (!limitTimestamp) return false;

  const timeSinceLimit = Date.now() - parseInt(limitTimestamp);
  debug(`Time since rate limit: ${timeSinceLimit}`);
  return timeSinceLimit < RATE_LIMIT_DURATION;
};

export const setRateLimit = () => {
  const rateLimitDate = new Date();
  debug(`Set rate limit, ${rateLimitDate.toString()}`);
  localStorage.setItem(RATE_LIMIT_KEY, rateLimitDate.toString());
};

export const clearRateLimit = () => {
  if (localStorage.getItem(RATE_LIMIT_KEY) === null) return;
  debug(`Cleared rate limit`);
  localStorage.removeItem(RATE_LIMIT_KEY);
};
