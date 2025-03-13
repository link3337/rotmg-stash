import { localStorageRateLimitKey, RATE_LIMIT_DURATION } from '@/constants';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { debug, info } from '@tauri-apps/plugin-log';
import { RootState } from '..';

interface RateLimitState {
  // When non-null, this represents the timestamp (in milliseconds) when the rate limit was set.
  timestamp: number | null;
}

const initialState: RateLimitState = {
  timestamp: null
};

const rateLimitFeatureKey = 'rateLimit';

const rateLimitSlice = createSlice({
  name: rateLimitFeatureKey,
  initialState,
  reducers: {
    initRateLimitState: (state) => {
      // Check localStorage for an existing rate limit timestamp
      const stored = localStorage.getItem(localStorageRateLimitKey);
      if (stored) {
        const ts = parseInt(stored);
        // Only consider it valid if it’s within the duration
        if ((Date.now() - ts) < RATE_LIMIT_DURATION) {
          state.timestamp = ts;
        } else {
          state.timestamp = null;
          localStorage.removeItem(localStorageRateLimitKey);
        }
      }
      debug(`Initialized rate limit state, timestamp: ${state.timestamp}`);
    },
    setRateLimit: (state, action: PayloadAction<{ timestamp: number }>) => {
      state.timestamp = action.payload.timestamp;
      debug(`Set rate limit at ${action.payload.timestamp}`);
      localStorage.setItem(localStorageRateLimitKey, action.payload.timestamp.toString());
    },
    clearRateLimit: (state) => {
      state.timestamp = null;
      debug('Cleared rate limit');
      localStorage.removeItem(localStorageRateLimitKey);
    }
  }
});

export const { initRateLimitState, setRateLimit, clearRateLimit } = rateLimitSlice.actions;

// Selector that returns both the stored timestamp and computed isLimited flag.
export const selectRateLimit = (state: RootState) => {
  const ts = state.rateLimit.timestamp;
  const isLimited = ts != null && Date.now() - ts < RATE_LIMIT_DURATION;
  return { timestamp: ts, isLimited };
};

export const isCurrentlyRateLimited = (
  state: RateLimitState,
  now: number = Date.now()
): boolean => {
  const ts = state.timestamp;
  if (!ts) return false;
  const timeSinceLimit = now - ts;
  const minutes = Math.floor(timeSinceLimit / 60000);
  const seconds = Math.floor((timeSinceLimit % 60000) / 1000);
  info(`Time since rate limit: ${minutes}m ${seconds}s`);
  return timeSinceLimit < RATE_LIMIT_DURATION;
};

export default rateLimitSlice.reducer;
