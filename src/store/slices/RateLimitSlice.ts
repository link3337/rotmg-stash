import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';

interface RateLimitState {
    isLimited: boolean;
    timestamp: number | null;
}

const initialState: RateLimitState = {
    isLimited: true,
    timestamp: 1741030243991
};

const rateLimitFeatureKey = 'rateLimit';

const rateLimitSlice = createSlice({
    name: rateLimitFeatureKey,
    initialState,
    reducers: {
        setRateLimit: (state, action: PayloadAction<{ nextRequest: number }>) => {
            state.isLimited = true;
            state.timestamp = action.payload.nextRequest;
        },
        clearRateLimit: (state) => {
            state.isLimited = false;
            state.timestamp = null;
        }
    }
});

export const { setRateLimit, clearRateLimit } = rateLimitSlice.actions;
export const selectRateLimit = (state: RootState) => state.rateLimit;

export default rateLimitSlice.reducer;