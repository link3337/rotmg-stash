import { debug, info } from '@tauri-apps/plugin-log';
import { RATE_LIMIT_DURATION, localStorageRateLimitKey } from './../constants';

export const isRateLimited = (): boolean => {
  const limitTimestamp = localStorage.getItem(localStorageRateLimitKey);
  debug(`Rate limit timestamp: ${limitTimestamp}`);
  if (!limitTimestamp) return false;

  const timeSinceLimit = Date.now() - new Date(limitTimestamp).getTime();
  const minutes = Math.floor(timeSinceLimit / 60000);
  const seconds = Math.floor((timeSinceLimit % 60000) / 1000);
  info(`Time since rate limit: ${minutes}m ${seconds}s`);
  return timeSinceLimit < RATE_LIMIT_DURATION;
};

export const setRateLimit = () => {
  const rateLimitDate = new Date();
  debug(`Set rate limit, ${rateLimitDate.toString()}`);
  localStorage.setItem(localStorageRateLimitKey, rateLimitDate.toString());
};

export const clearRateLimit = () => {
  if (localStorage.getItem(localStorageRateLimitKey) === null) return;
  debug(`Cleared rate limit`);
  localStorage.removeItem(localStorageRateLimitKey);
};
